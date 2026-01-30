import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCustomerByPhone, addStampToCustomer } from '../services/firebaseService';
import type { Customer } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ErrorMessage from '../components/ErrorMessage';
import ExclamationCircleIcon from '../components/icons/ExclamationCircleIcon';

const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;

const validateMexicanPhoneNumber = (phone: string): string => {
    if (!phone) return "El número de teléfono es requerido.";
    let cleaned = phone.trim();

    if (cleaned.startsWith('+521')) {
        cleaned = cleaned.substring(4);
    } else if (cleaned.startsWith('+52')) {
        cleaned = cleaned.substring(3);
    }

    cleaned = cleaned.replace(/\D/g, '');

    return /^\d{10}$/.test(cleaned) ? "" : "Por favor, ingresa un número de teléfono válido de 10 dígitos.";
};


const AddStampPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [stampQuantity, setStampQuantity] = useState(1);

    useEffect(() => {
        document.title = 'Agregar Sello | Loyalfly App';
    }, []);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = e.target.value.replace(/\D/g, '');
        setPhone(sanitized.slice(0, 10));
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const phoneError = validateMexicanPhoneNumber(phone);
        if (phoneError) {
            setError(phoneError);
            return;
        }

        setLoading(true);
        setError('');
        setFoundCustomer(null);
        try {
            const customer = await getCustomerByPhone(user.uid, phone);
            if (customer) {
                setFoundCustomer(customer);
            } else {
                showToast('Cliente no encontrado. Verifica el número de teléfono.', 'alert');
            }
        } catch (err) {
            showToast('Ocurrió un error al buscar el cliente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAddStamp = async () => {
        if (!foundCustomer || !user) return;

        setIsUpdating(true);
        try {
            const updatedCustomer = await addStampToCustomer(user.uid, foundCustomer.id, stampQuantity);
            setFoundCustomer(updatedCustomer);
            const pluralStamps = stampQuantity > 1 ? 'sellos' : 'sello';
            const pluralAgregados = stampQuantity > 1 ? 'agregados' : 'agregado';
            const successMessage = `¡${stampQuantity} ${pluralStamps} ${pluralAgregados}! ${updatedCustomer.name} ahora tiene ${updatedCustomer.stamps} sellos.`;
            showToast(successMessage, 'success');
        } catch (err) {
             showToast('No se pudo agregar el sello. Inténtalo de nuevo.', 'error');
        } finally {
            setIsUpdating(false);
            setIsModalOpen(false);
        }
    };
    
    const openModal = () => {
        setStampQuantity(1); // Reset quantity when opening modal
        setIsModalOpen(true);
    };

    const handleQuantityChange = (newQuantity: number) => {
        setStampQuantity(Math.max(1, newQuantity));
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    to="/app/dashboard"
                    className="inline-flex items-center justify-center p-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    title="Volver al Dashboard"
                >
                    <ArrowLeftIcon />
                </Link>
                <h1 className="text-3xl font-bold text-black tracking-tight">Agregar Sello a Cliente</h1>
            </div>


            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                        <label htmlFor="phone" className="sr-only">Número de Teléfono</label>
                         <div className="relative">
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={handlePhoneChange}
                                maxLength={10}
                                required
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${error ? 'pr-10 border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 placeholder-gray-400 focus:ring-black focus:border-black'}`}
                                placeholder="Buscar por número de teléfono (10 dígitos)"
                                aria-invalid={!!error}
                                aria-describedby="phone-error"
                            />
                            {error && (
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <ExclamationCircleIcon />
                                </div>
                            )}
                        </div>
                        <ErrorMessage message={error} id="phone-error" />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400"
                    >
                        {loading ? 'Buscando...' : 'Buscar Cliente'}
                    </button>
                </form>
            </div>

            {foundCustomer && (
                <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm animate-fade-in-up">
                    <h2 className="text-xl font-bold text-black">Cliente Encontrado</h2>
                    <div className="mt-4 space-y-2 text-base">
                        <p><span className="font-medium text-gray-600">Nombre:</span> {foundCustomer.name}</p>
                        <p><span className="font-medium text-gray-600">Teléfono:</span> {foundCustomer.phone}</p>
                        <p><span className="font-medium text-gray-600">Sellos Actuales:</span> {foundCustomer.stamps}</p>
                    </div>

                    <button
                        onClick={openModal}
                        disabled={isUpdating}
                        className="mt-6 w-full py-2.5 px-4 font-semibold text-white bg-[#4D17FF] rounded-md hover:bg-opacity-90 transition-colors disabled:bg-indigo-300"
                    >
                        {isUpdating ? 'Agregando...' : 'Agregar Sello'}
                    </button>
                </div>
            )}
            
            {foundCustomer && (
                <ConfirmationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmAddStamp}
                    title="Agregar Sellos"
                    confirmText={`Agregar ${stampQuantity} Sello${stampQuantity > 1 ? 's' : ''}`}
                >
                    <p className="mb-4 text-center">Selecciona la cantidad de sellos a agregar:</p>
                    <div className="flex items-center justify-center gap-3">
                        <button 
                            onClick={() => handleQuantityChange(stampQuantity - 1)}
                            className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                            disabled={stampQuantity <= 1}
                            aria-label="Disminuir cantidad"
                        >
                            -
                        </button>
                        <input
                            type="number"
                            min="1"
                            value={stampQuantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                            className="w-20 h-10 text-center font-bold text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                            aria-label="Cantidad de sellos"
                        />
                        <button 
                            onClick={() => handleQuantityChange(stampQuantity + 1)}
                            className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            aria-label="Aumentar cantidad"
                        >
                            +
                        </button>
                    </div>
                    <div className="mt-4 text-center bg-gray-50 p-3 rounded-md border border-gray-200">
                        <p className="font-semibold">{foundCustomer.name}</p>
                        <p className="text-base text-gray-500">{foundCustomer.phone}</p>
                    </div>
                </ConfirmationModal>
            )}

        </div>
    );
};

export default AddStampPage;