import React, { useState, useEffect } from 'react';
import { getAllBusinessesForSuperAdmin, updateBusinessPlan, deleteBusinessForSuperAdmin } from '../services/firebaseService';
import { useToast } from '../context/ToastContext';
import type { BusinessAdminData } from '../services/firebaseService';
import ConfirmationModal from '../components/ConfirmationModal';

const SuperAdminPage: React.FC = () => {
    const [businesses, setBusinesses] = useState<BusinessAdminData[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState<BusinessAdminData | null>(null);

    useEffect(() => {
        document.title = 'Super Admin | Loyalfly App';
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getAllBusinessesForSuperAdmin();
                setBusinesses(data);
            } catch (error) {
                console.error("Failed to fetch businesses data:", error);
                showToast('No se pudieron cargar los datos de los negocios.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const handlePlanChange = async (businessId: string, newPlan: 'Gratis' | 'Entrepreneur' | 'Pro') => {
        const originalBusinesses = businesses;
        setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, plan: newPlan } : b));

        try {
            await updateBusinessPlan(businessId, newPlan);
            showToast('Plan actualizado con éxito.', 'success');
        } catch (error) {
            showToast('Error al actualizar el plan.', 'error');
            console.error(error);
            setBusinesses(originalBusinesses);
        }
    };
    
    const handleOpenDeleteModal = (business: BusinessAdminData) => {
        setSelectedBusiness(business);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedBusiness) return;

        try {
            await deleteBusinessForSuperAdmin(selectedBusiness.id);
            setBusinesses(prev => prev.filter(b => b.id !== selectedBusiness.id));
            showToast(`Negocio "${selectedBusiness.name}" eliminado.`, 'success');
        } catch (error) {
            console.error("Failed to delete business:", error);
            showToast('No se pudo eliminar el negocio.', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedBusiness(null);
        }
    };

    const renderTableBody = () => {
        if (loading) {
            return (
                <tr>
                    <td colSpan={7} className="text-center px-6 py-12">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-black" role="status">
                                <span className="sr-only">Cargando...</span>
                            </div>
                        </div>
                    </td>
                </tr>
            );
        }
        
        if (businesses.length === 0) {
            return (
                <tr>
                    <td colSpan={7} className="text-center px-6 py-12 text-gray-500">
                        No hay negocios registrados en la plataforma.
                    </td>
                </tr>
            );
        }
        
        return businesses.map((business) => (
             <tr key={business.id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-4 sm:px-6 font-medium text-gray-900 whitespace-nowrap">{business.name}</td>
                <td className="px-4 py-4 sm:px-6 hidden md:table-cell">{business.email}</td>
                <td className="px-4 py-4 sm:px-6 text-center">{business.customerCount}</td>
                <td className="px-4 py-4 sm:px-6 text-center">{business.totalStamps}</td>
                <td className="px-4 py-4 sm:px-6 text-center">{business.totalRewards}</td>
                <td className="px-4 py-4 sm:px-6">
                     <select
                        value={business.plan || 'Gratis'}
                        onChange={(e) => handlePlanChange(business.id, e.target.value as 'Gratis' | 'Entrepreneur' | 'Pro')}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-black focus:border-black sm:text-base"
                    >
                        <option value="Gratis">Gratis</option>
                        <option value="Entrepreneur">Entrepreneur</option>
                        <option value="Pro">Pro</option>
                    </select>
                </td>
                <td className="px-4 py-4 sm:px-6 text-right">
                    <button
                        onClick={() => handleOpenDeleteModal(business)}
                        className="text-red-600 hover:text-red-800 font-medium transition-colors"
                        title={`Eliminar ${business.name}`}
                    >
                        Eliminar
                    </button>
                </td>
            </tr>
        ));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-black tracking-tight">Super Admin Dashboard</h1>
            
             <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                 <div className="overflow-x-auto">
                    <table className="w-full text-base text-left text-gray-600">
                        <thead className="text-base text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-4 py-3 sm:px-6">Negocio</th>
                                <th scope="col" className="px-4 py-3 sm:px-6 hidden md:table-cell">Email</th>
                                <th scope="col" className="px-4 py-3 sm:px-6 text-center">Clientes</th>
                                <th scope="col" className="px-4 py-3 sm:px-6 text-center">Sellos Dados</th>
                                <th scope="col" className="px-4 py-3 sm:px-6 text-center">Recompensas</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Plan</th>
                                <th scope="col" className="px-4 py-3 sm:px-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableBody()}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {selectedBusiness && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="¿Eliminar Negocio?"
                    confirmText="Sí, eliminar permanentemente"
                >
                    <p>Estás a punto de eliminar permanentemente a <strong>{selectedBusiness.name}</strong> y todos sus datos (clientes, sellos, configuración, etc.).</p>
                    <p className="mt-2 font-bold text-red-600">Esta acción no se puede deshacer. ¿Estás seguro?</p>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default SuperAdminPage;