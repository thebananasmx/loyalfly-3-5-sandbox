import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getAllBusinessesForSuperAdmin } from '../services/firebaseService';
import type { BusinessAdminData } from '../services/firebaseService';
import { useToast } from '../context/ToastContext';

type Metric = 'businesses' | 'customers';

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <p className="text-base text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-black mt-1">{value}</p>
        {description && <p className="text-base text-gray-500 mt-2">{description}</p>}
    </div>
);

const PieChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) {
        return <div className="flex items-center justify-center h-48 bg-gray-100 rounded-full text-gray-500">Sin datos</div>;
    }

    const gradientParts = [];
    let cumulativePercentage = 0;
    for (const item of data) {
        const percentage = (item.value / total) * 100;
        gradientParts.push(`${item.color} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`);
        cumulativePercentage += percentage;
    }
    const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className="flex flex-col md:flex-row items-center gap-8">
            <div 
                className="w-48 h-48 rounded-full shadow-inner border border-gray-100" 
                style={{ background: conicGradient }}
                role="img"
                aria-label="Gráfica de pastel de distribución de planes"
            ></div>
            <div className="space-y-3">
                {data.map(item => (
                    <div key={item.name} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: item.color }}></div>
                        <div>
                            <span className="font-semibold text-black">{item.name}</span>
                            <span className="ml-2 text-gray-600">
                                {item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- CHART COMPONENT ---

const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>;

const GrowthLineChart: React.FC<{ businesses: BusinessAdminData[], metric: Metric, startDate: string, endDate: string }> = ({ businesses, metric, startDate, endDate }) => {
    const [tooltip, setTooltip] = useState<{ label: string; count: number; top: number; left: number } | null>(null);

    const chartData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        // Intelligent Granularity: Day for short ranges, Month for long ones
        const granularity: 'day' | 'month' = diffDays > 62 ? 'month' : 'day';
        
        const groups: { [key: string]: number } = {};
        
        // Initialize all periods in the range with 0 to ensure continuity
        let current = new Date(start);
        while (current <= end) {
            const key = granularity === 'day' 
                ? current.toISOString().split('T')[0]
                : current.toLocaleString('es-MX', { month: 'short', year: 'numeric' });
            
            if (!groups[key]) groups[key] = 0;
            
            if (granularity === 'day') current.setDate(current.getDate() + 1);
            else current.setMonth(current.getMonth() + 1);
        }

        // Fill counts from real data
        const processDate = (ts: number) => {
            const date = new Date(ts);
            if (date >= start && date <= end) {
                const key = granularity === 'day' 
                    ? date.toISOString().split('T')[0]
                    : date.toLocaleString('es-MX', { month: 'short', year: 'numeric' });
                if (groups[key] !== undefined) groups[key]++;
            }
        };

        if (metric === 'businesses') {
            businesses.forEach(b => b.rawCreatedAt && processDate(b.rawCreatedAt));
        } else {
            businesses.forEach(b => b.customerEnrollmentDates?.forEach(ts => processDate(ts)));
        }

        return Object.entries(groups).map(([label, count]) => ({ label, count }));
    }, [businesses, metric, startDate, endDate]);

    const maxCount = Math.max(...chartData.map(d => d.count), 1);
    const yAxisLabels = [maxCount, Math.round(maxCount * 0.66), Math.round(maxCount * 0.33), 0];
    
    // Normalized Positions (Percentage-based for perfect sync)
    const points = chartData.map((d, i) => ({
        x: (i / (chartData.length - 1 || 1)) * 100,
        y: 100 - (d.count / maxCount) * 100,
        label: d.label,
        count: d.count
    }));

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaData = `${pathData} L ${points[points.length - 1]?.x || 100} 100 L ${points[0]?.x || 0} 100 Z`;

    const handleMouseMove = (e: React.MouseEvent, label: string, count: number) => {
        setTooltip({ label, count, top: e.clientY, left: e.clientX });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 relative">
            {tooltip && createPortal(
                <div
                    className="absolute z-50 p-3 text-sm bg-white border border-gray-200 rounded-lg shadow-xl pointer-events-none transition-opacity duration-200"
                    style={{ top: tooltip.top + 15, left: tooltip.left + 15 }}
                >
                    <p className="font-bold text-black">{tooltip.label}</p>
                    <p className="text-[#4D17FF] font-bold">{tooltip.count} {metric === 'businesses' ? 'Negocios' : 'Clientes'}</p>
                </div>,
                document.body
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-black">Tendencia de Crecimiento</h3>
                    <p className="text-sm text-gray-500 font-medium">Nuevos {metric === 'businesses' ? 'registros' : 'clientes'} en el periodo seleccionado</p>
                </div>
            </div>

            <div className="w-full h-[320px] flex">
                <div className="flex flex-col justify-between h-[300px] pr-4 text-right min-w-[40px]">
                    {yAxisLabels.map((label) => (
                        <span key={label} className="text-[11px] text-gray-400 font-bold">{label}</span>
                    ))}
                </div>

                <div className="w-full h-full flex flex-col relative">
                    <div className="h-[300px] relative border-l border-b border-gray-100 overflow-visible">
                        <div className="absolute inset-0 grid grid-rows-3 pointer-events-none">
                            <div className="border-b border-dashed border-gray-100"></div>
                            <div className="border-b border-dashed border-gray-100"></div>
                            <div className="border-b border-dashed border-gray-100"></div>
                        </div>

                        {chartData.length > 0 ? (
                            <>
                                <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4D17FF" stopOpacity="0.1" />
                                            <stop offset="100%" stopColor="#4D17FF" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d={areaData} fill="url(#areaGradient)" />
                                    <path d={pathData} fill="none" stroke="#4D17FF" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>

                                {points.map((p, i) => (
                                    <div
                                        key={i}
                                        className="absolute z-10 w-2.5 h-2.5 bg-[#4D17FF] border-2 border-white rounded-full shadow-sm cursor-crosshair transform -translate-x-1/2 -translate-y-1/2 hover:scale-150 transition-all"
                                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                                        onMouseMove={(e) => handleMouseMove(e, p.label, p.count)}
                                        onMouseLeave={() => setTooltip(null)}
                                    ></div>
                                ))}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 italic text-sm">
                                Selecciona un rango de fechas con datos
                            </div>
                        )}
                    </div>

                    <div className="h-10 flex justify-between items-center pt-3 px-0">
                        {chartData.map(({ label }, idx) => (
                            <div key={idx} className="text-center overflow-hidden" style={{ width: `${100 / chartData.length}%` }}>
                                <span className="text-[10px] text-gray-400 font-bold truncate block px-1">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminKpisPage: React.FC = () => {
    const [businesses, setBusinesses] = useState<BusinessAdminData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMetric, setActiveMetric] = useState<Metric>('businesses');
    const { showToast } = useToast();

    // Date Range State (Last 30 days by default)
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        document.title = 'KPIs | Super Admin | Loyalfly';
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getAllBusinessesForSuperAdmin();
                setBusinesses(data);
            } catch (error) {
                console.error("Failed to fetch businesses data:", error);
                showToast('No se pudieron cargar los datos.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const totalBusinesses = businesses.length;
    const totalCustomers = businesses.reduce((sum, b) => sum + b.customerCount, 0);
    const totalStamps = businesses.reduce((sum, b) => sum + b.totalStamps, 0);
    const totalRewards = businesses.reduce((sum, b) => sum + b.totalRewards, 0);

    const planDistribution = businesses.reduce((acc, b) => {
        const plan = b.plan || 'Gratis';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });
    
    const pieChartData = [
        { name: 'Gratis', value: planDistribution['Gratis'] || 0, color: '#A78BFA' },
        { name: 'Entrepreneur', value: planDistribution['Entrepreneur'] || 0, color: '#7C3AED' },
        { name: 'Pro', value: planDistribution['Pro'] || 0, color: '#4D17FF' }
    ];
    
    const topBusinesses = [...businesses]
        .sort((a, b) => b.customerCount - a.customerCount)
        .slice(0, 10);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black" role="status">
                    <span className="sr-only">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-black tracking-tight">KPIs de la Plataforma</h1>
                    <p className="text-gray-600 mt-1">Supervisión integral del crecimiento y adopción.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-6">
                    {/* Date Range Selector - Google Analytics Style */}
                    <div className="flex items-center bg-white border border-gray-200 p-2 rounded-lg shadow-sm gap-2">
                        <CalendarIcon />
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-sm font-bold text-gray-700 bg-transparent focus:outline-none border-b border-transparent hover:border-gray-200"
                            />
                            <span className="text-gray-400 font-bold">−</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-sm font-bold text-gray-700 bg-transparent focus:outline-none border-b border-transparent hover:border-gray-200"
                            />
                        </div>
                    </div>

                    {/* Metric Selector */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setActiveMetric('businesses')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                                activeMetric === 'businesses' 
                                ? 'bg-black text-white shadow-sm' 
                                : 'text-gray-500 hover:text-black'
                            }`}
                        >
                            Negocios
                        </button>
                        <button
                            onClick={() => setActiveMetric('customers')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                                activeMetric === 'customers' 
                                ? 'bg-black text-white shadow-sm' 
                                : 'text-gray-500 hover:text-black'
                            }`}
                        >
                            Clientes
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total de Negocios" value={totalBusinesses} />
                <StatCard title="Total de Clientes" value={totalCustomers} />
                <StatCard title="Sellos Otorgados" value={totalStamps} />
                <StatCard title="Recompensas Canjeadas" value={totalRewards} />
            </div>

            {/* Growth Line Chart Section */}
            <GrowthLineChart businesses={businesses} metric={activeMetric} startDate={startDate} endDate={endDate} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
                    <h3 className="text-xl font-bold text-black mb-6">Distribución de Planes</h3>
                    <div className="flex-grow flex items-center justify-center">
                        <PieChart data={pieChartData} />
                    </div>
                </div>
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold text-black mb-4">Top 10 Negocios por Clientes</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-gray-600">
                             <thead className="text-base text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Negocio</th>
                                    <th scope="col" className="px-4 py-3 text-center">Clientes</th>
                                    <th scope="col" className="px-4 py-3">Plan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topBusinesses.length > 0 ? (
                                    topBusinesses.map((business) => (
                                        <tr key={business.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{business.name}</td>
                                            <td className="px-4 py-3 text-center font-semibold">{business.customerCount}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    business.plan === 'Pro' ? 'bg-indigo-100 text-indigo-700' :
                                                    business.plan === 'Entrepreneur' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {business.plan || 'Gratis'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8 text-gray-500">No hay datos de negocios.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminKpisPage;