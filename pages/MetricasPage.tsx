import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { getBusinessData, getBusinessMetrics } from '../services/firebaseService';
import type { Business, Customer } from '../types';
import type { BusinessMetrics } from '../services/firebaseService';
import { useTranslation } from 'react-i18next';

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <p className="text-base text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-black mt-1">{value}</p>
        <p className="text-base text-gray-500 mt-2">{description}</p>
    </div>
);

const BarChart: React.FC<{ data: { month: string; count: number }[] }> = ({ data }) => {
    const { t } = useTranslation();
    const [tooltip, setTooltip] = useState<{ month: string; count: number; top: number; left: number } | null>(null);

    const handleMouseMove = (e: React.MouseEvent, month: string, count: number) => {
        setTooltip({
            month,
            count,
            top: e.clientY,
            left: e.clientX,
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const maxCount = Math.max(...data.map(d => d.count), 5);
    const yAxisLabels = [maxCount, Math.round(maxCount / 2), 0];

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            {tooltip && createPortal(
                <div
                    className="absolute z-50 p-3 text-sm bg-white border border-gray-200 rounded-lg shadow-xl pointer-events-none transition-opacity duration-200"
                    style={{
                        top: tooltip.top + 15,
                        left: tooltip.left + 15,
                    }}
                >
                    <p className="font-bold text-black">{tooltip.month}</p>
                    <p className="text-gray-600">{tooltip.count} {t('metrics.newCustomers')}</p>
                </div>,
                document.body
            )}
            <h3 className="text-xl font-bold mb-4 text-black">{t('metrics.chartTitle')}</h3>

            <div className="w-full h-[300px] flex">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between h-full pb-8 pr-4 text-right">
                    {yAxisLabels.map((label) => (
                        <span key={label} className="text-xs text-gray-500">{label}</span>
                    ))}
                </div>

                <div className="w-full h-full flex flex-col">
                    {/* Main Chart Area */}
                    <div className="flex-grow relative">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 grid grid-rows-2">
                            <div className="border-b border-dashed border-gray-200"></div>
                            <div className="border-b border-dashed border-gray-200"></div>
                        </div>

                        {/* Columns with bars */}
                        <div className="absolute bottom-0 left-0 right-0 h-full flex justify-around px-2">
                            {data.map(({ month, count }) => (
                                <div
                                    key={month}
                                    className="flex-1 flex flex-col justify-end items-center group relative pt-4 hover:bg-gray-100 rounded-t-lg transition-colors"
                                    onMouseMove={(e) => handleMouseMove(e, month, count)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div
                                        className="w-12 bg-[#4D17FF] rounded-t-md"
                                        style={{ height: `${(count / maxCount) * 100}%` }}
                                        aria-label={`Clientes en ${month}: ${count}`}
                                    ></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* X-Axis */}
                    <div className="h-8 flex justify-around items-center pt-2 border-t border-gray-200 px-2">
                        {data.map(({ month }) => (
                            <div key={month} className="flex-1 text-center">
                                <span className="text-xs text-gray-500">{month}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center mt-4">
                <span className="h-3 w-3 rounded-sm mr-2" style={{ backgroundColor: '#4D17FF' }}></span>
                <span className="text-sm text-gray-500">{t('metrics.newCustomers')}</span>
            </div>
        </div>
    );
};


const MetricasPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [businessData, setBusinessData] = useState<Business | null>(null);
    const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Métricas | Loyalfly App';
        const fetchData = async () => {
            if (!user) return;
            try {
                const [business, businessMetrics] = await Promise.all([
                    getBusinessData(user.uid),
                    getBusinessMetrics(user.uid)
                ]);
                setBusinessData(business);
                setMetrics(businessMetrics);
            } catch (error) {
                console.error("Failed to fetch metrics data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black" role="status">
                    <span className="sr-only">{t('common.loading')}</span>
                </div>
            </div>
        );
    }
    
    if (!metrics || !businessData) {
        return <p className="text-center text-gray-600">No se pudieron cargar las métricas.</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-black tracking-tight">{t('metrics.title')}</h1>
                <p className="text-gray-600 mt-1">{t('metrics.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('metrics.totalCustomers')} value={businessData.customerCount} description={t('metrics.totalCustomersDesc')} />
                <StatCard title={t('metrics.stampsGiven')} value={metrics.totalStamps} description={t('metrics.stampsGivenDesc')} />
                <StatCard title={t('metrics.rewardsRedeemed')} value={metrics.totalRewards} description={t('metrics.rewardsRedeemedDesc')} />
                <StatCard title={t('metrics.redemptionRate')} value={`${metrics.redemptionRate.toFixed(1)}%`} description={t('metrics.redemptionRateDesc')} />
            </div>
            
            <BarChart data={metrics.newCustomersByMonth} />

            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-black mb-4">{t('metrics.topCustomersTitle')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-base text-left text-gray-600">
                        <thead className="text-base text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3">{t('common.name')}</th>
                                <th scope="col" className="px-4 py-3 text-center">{t('dashboard.table.stamps')}</th>
                                <th scope="col" className="px-4 py-3 text-center">{t('dashboard.table.rewards')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.topCustomers.length > 0 ? (
                                metrics.topCustomers.map((customer: Customer) => (
                                    <tr key={customer.id} className="border-b last:border-b-0">
                                        <td className="px-4 py-3 font-medium text-gray-900">{customer.name}</td>
                                        <td className="px-4 py-3 text-center">{customer.stamps}</td>
                                        <td className="px-4 py-3 text-center">{customer.rewardsRedeemed}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-gray-500">{t('metrics.emptyTopCustomers')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default MetricasPage;