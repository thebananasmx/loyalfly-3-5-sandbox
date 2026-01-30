import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBusinessData, getAllCustomers } from '../services/firebaseService';
import CardPreview from '../components/CardPreview';
import { useToast } from '../context/ToastContext';
import type { Business, Customer } from '../types';

const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;

const AdminBusinessDetailPage: React.FC = () => {
    const { businessId } = useParams<{ businessId: string }>();
    const [business, setBusiness] = useState<Business | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        document.title = 'Detalle de Negocio | Admin | Loyalfly';
        const loadData = async () => {
            if (!businessId) return;
            setLoading(true);
            try {
                const [busData, customersData] = await Promise.all([
                    getBusinessData(businessId),
                    getAllCustomers(businessId)
                ]);
                setBusiness(busData);
                setCustomers(customersData);
            } catch (err) {
                console.error(err);
                showToast('Error al cargar datos del negocio', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [businessId, showToast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black" role="status">
                    <span className="sr-only">Cargando...</span>
                </div>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No se encontró el negocio.</p>
                <Link to="/admin/dashboard" className="text-[#4D17FF] hover:underline mt-4 inline-block">
                    Volver al Dashboard
                </Link>
            </div>
        );
    }

    const previewCustomer = customers.length > 0 ? customers[0] : null;
    const cardSettings = business.cardSettings || {};

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link
                    to="/admin/dashboard"
                    className="inline-flex items-center justify-center p-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    title="Volver al Dashboard"
                >
                    <ArrowLeftIcon />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-black tracking-tight">{business.name}</h1>
                    <p className="text-gray-500">{business.email}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Column 1: Card Preview */}
                <div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-black mb-4">Tarjeta Configurada</h2>
                        <p className="text-gray-600 mb-6 text-sm">
                            Visualización con datos del {previewCustomer ? 'primer cliente registrado' : 'cliente de ejemplo'}.
                        </p>
                        <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
                            <CardPreview
                                businessName={cardSettings.name || business.name}
                                rewardText={cardSettings.reward || 'Recompensa'}
                                cardColor={cardSettings.color || '#FEF3C7'}
                                stamps={previewCustomer ? previewCustomer.stamps : 4}
                                textColorScheme={cardSettings.textColorScheme || 'dark'}
                                logoUrl={cardSettings.logoUrl}
                                customerName={previewCustomer?.name || 'Juan Pérez'}
                                customerPhone={previewCustomer?.phone || '5512345678'}
                                customerId={previewCustomer?.id}
                            />
                        </div>
                    </div>
                </div>

                {/* Column 2: Customers Table */}
                <div>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full flex flex-col">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-black">Lista de Clientes</h2>
                            <p className="text-gray-500 mt-1">Total: {customers.length} clientes registrados</p>
                        </div>
                        <div className="overflow-x-auto flex-grow">
                            <table className="w-full text-base text-left text-gray-600">
                                <thead className="text-base text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Nombre</th>
                                        <th scope="col" className="px-6 py-3">Teléfono</th>
                                        <th scope="col" className="px-6 py-3">Email</th>
                                        <th scope="col" className="px-6 py-3 text-center">Sellos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length > 0 ? (
                                        customers.map((customer) => (
                                            <tr key={customer.id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{customer.name}</td>
                                                <td className="px-6 py-4">{customer.phone}</td>
                                                <td className="px-6 py-4">{customer.email || '-'}</td>
                                                <td className="px-6 py-4 text-center">{customer.stamps}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                Este negocio aún no tiene clientes registrados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBusinessDetailPage;