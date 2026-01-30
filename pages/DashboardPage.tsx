import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { 
    getCustomers, 
    addStampToCustomer, 
    searchCustomers, 
    redeemRewardForCustomer,
    getAllCustomers,
    getCustomerByPhone,
    createNewCustomer,
    getBusinessData,
    getCustomerById
} from '../services/firebaseService';
import type { Customer, Business } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { useTranslation } from 'react-i18next';

const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" /></svg>;
const StampIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
const GiftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 5a3 3 0 015.252-2.121l.738.737a.5.5 0 00.708 0l.738-.737A3 3 0 1115 5v2.243l-1.162.387a.5.5 0 00-.338.338L13.113 9H6.887l-.388-1.162a.5.5 0 00-.338-.338L5 7.243V5z" clipRule="evenodd" /><path d="M3 10a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2h-1.333l-.738 2.212A.5.5 0 0114.5 17h-9a.5.5 0 01-.43-.788L4.333 14H3a2 2 0 01-2-2v-2z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 011.414 0L9 11.293V3a1 1 0 112 0v8.293l1.293-1.586a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 12a1 1 0 011 1v3a1 1 0 001 1h8a1 1 0 001-1v-3a1 1 0 112 0v3a3 3 0 01-3 3H6a3 3 0 01-3-3v-3a1 1 0 011-1z" /><path d="M10 2a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 2z" /></svg>;
const QRIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h-1m-1-6v1m-1-1h-1m-1 6h1m-1-1v1m0-1h1m4-4h1m-5 5v1m-1-1h1M4 4h4v4H4zm0 12h4v4H4zm12 0h4v4h-4zm0-12h4v4h-4z" /></svg>;

const PLAN_LIMITS = {
    Gratis: 100,
    Entrepreneur: 1000,
};

const PAGE_SIZE = 25;

const AlertBar: React.FC<{ plan: 'Gratis' | 'Entrepreneur' }> = ({ plan }) => {
    return (
        <div className="p-4 mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold">Límite de Clientes Alcanzado</p>
                    <p>Has alcanzado el máximo de {PLAN_LIMITS[plan]} clientes para el plan {plan}.</p>
                </div>
                <a href="mailto:contacto@loyalfly.app" className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 transition-colors">
                    Contáctanos para mejorar
                </a>
            </div>
        </div>
    );
};


// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

const DashboardPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    
    // The state for the currently displayed list. Can be from main list or search results.
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [businessData, setBusinessData] = useState<Business | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // SERVER-SIDE PAGINATION STATE (main list)
    const [mainListPage, setMainListPage] = useState(1);
    const [pageStartCursors, setPageStartCursors] = useState<any[]>([null]);
    const [isLastPage, setIsLastPage] = useState(false);
    
    // CLIENT-SIDE PAGINATION STATE (search results)
    const [allSearchResults, setAllSearchResults] = useState<Customer[]>([]);
    const [searchPage, setSearchPage] = useState(1);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isStampModalOpen, setIsStampModalOpen] = useState(false);
    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
    const [stampQuantity, setStampQuantity] = useState(1);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [isDownloading, setIsDownloading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadStep, setUploadStep] = useState<'info' | 'processing' | 'result'>('info');
    const [uploadResult, setUploadResult] = useState<{ success: number; skipped: number; errors: string[], limitReached?: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const isSearchActive = debouncedSearchQuery.length >= 3;

    const fetchInitialData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [businessInfo, { customers: customersData, lastVisibleDoc }] = await Promise.all([
                getBusinessData(user.uid),
                getCustomers(user.uid, null)
            ]);
            setBusinessData(businessInfo);
            setCustomers(customersData);
            setPageStartCursors([null, lastVisibleDoc]);
            setIsLastPage(customersData.length < PAGE_SIZE);
            setMainListPage(1);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            showToast('No se pudieron cargar los datos del dashboard.', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // Effect for initial load of recent customers
    useEffect(() => {
        document.title = 'Dashboard | Loyalfly App';
        if (user) {
            fetchInitialData();
        }
    }, [user]);

    // Effect for handling search queries
    useEffect(() => {
        const performSearch = async () => {
            if (!user) return;

            setIsSearching(true);
            try {
                const results = await searchCustomers(user.uid, debouncedSearchQuery);
                setAllSearchResults(results);
                setCustomers(results.slice(0, PAGE_SIZE));
                setSearchPage(1);
            } catch (error) {
                console.error("Failed to search customers:", error);
                showToast('Ocurrió un error al buscar.', 'error');
            } finally {
                setIsSearching(false);
            }
        };

        if (isSearchActive) {
            performSearch();
        } else {
             if (searchQuery === '' && allSearchResults.length > 0) {
                // Was searching, now cleared
                setAllSearchResults([]);
                fetchInitialData();
            }
        }
    }, [debouncedSearchQuery, user]);

    // Effect for QR Code Scanner
    useEffect(() => {
        if (!isScannerOpen || !user?.uid) return;

        const qrReaderId = "qr-reader";
        const html5QrCode = new Html5Qrcode(qrReaderId);

        const qrCodeSuccessCallback = async (decodedText: string) => {
            try {
                if (html5QrCode.isScanning) {
                    await html5QrCode.stop();
                }
            } catch (err) {
                console.warn("QR scanner failed to stop gracefully.", err);
            }
            setIsScannerOpen(false);
            
            try {
                const customer = await getCustomerById(user.uid, decodedText);
                if (customer) {
                    handleOpenStampModal(customer);
                } else {
                    showToast('Cliente no encontrado con este código QR.', 'error');
                }
            } catch (err) {
                showToast('Error al buscar cliente.', 'error');
            }
        };

        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
        
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            qrCodeSuccessCallback,
            () => {} // Error callback, ignored for continuous scanning
        ).catch((err) => {
            showToast('No se pudo iniciar el escáner. Revisa los permisos de la cámara.', 'error');
            console.error("Unable to start scanning.", err);
            setIsScannerOpen(false);
        });

        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.warn("QR scanner failed to stop on cleanup.", err));
            }
        };
    }, [isScannerOpen, user?.uid]);


    const handleOpenStampModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setStampQuantity(1);
        setIsStampModalOpen(true);
    };

    const handleOpenRedeemModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsRedeemModalOpen(true);
    };

    const handleQuantityChange = (newQuantity: number) => {
        setStampQuantity(Math.max(1, newQuantity));
    };
    
    const handleConfirmAddStamp = async () => {
        if (!selectedCustomer || !user) return;
        setIsUpdating(true);
        try {
            const updatedCustomer = await addStampToCustomer(user.uid, selectedCustomer.id, stampQuantity);
            setCustomers(prevCustomers => 
                prevCustomers.map(c => 
                    c.id === updatedCustomer.id ? updatedCustomer : c
                )
            );

            const pluralStamps = stampQuantity > 1 ? 'sellos' : 'sello';
            const pluralAgregados = stampQuantity > 1 ? 'agregados' : 'agregado';
            const successMessage = `¡${stampQuantity} ${pluralStamps} ${pluralAgregados}! ${updatedCustomer.name} ahora tiene ${updatedCustomer.stamps} sellos.`;
            showToast(successMessage, 'success');
        } catch (err) {
             showToast('No se pudo agregar el sello. Inténtalo de nuevo.', 'error');
        } finally {
            setIsUpdating(false);
            setIsStampModalOpen(false);
            setSelectedCustomer(null);
        }
    };

    const handleConfirmRedeemReward = async () => {
        if (!selectedCustomer || !user) return;
        setIsUpdating(true);
        try {
            const updatedCustomer = await redeemRewardForCustomer(user.uid, selectedCustomer.id);
            setCustomers(prevCustomers =>
                prevCustomers.map(c =>
                    c.id === updatedCustomer.id ? updatedCustomer : c
                )
            );
            showToast(`¡Recompensa canjeada para ${updatedCustomer.name}!`, 'success');
        } catch (err) {
            showToast('No se pudo canjear la recompensa.', 'error');
        } finally {
            setIsUpdating(false);
            setIsRedeemModalOpen(false);
            setSelectedCustomer(null);
        }
    };

    const handleDownload = async () => {
        if (!user) return;
        setIsDownloading(true);
        try {
            const allCustomers = await getAllCustomers(user.uid);
            if (allCustomers.length === 0) {
                showToast('No tienes clientes para descargar.', 'alert');
                return;
            }

            const headers = ['nombre', 'telefono', 'email', 'fecha_inscripcion', 'sellos', 'recompensas_canjeadas'];
            const csvContent = [
                headers.join(','),
                ...allCustomers.map(c => [
                    `"${c.name.replace(/"/g, '""')}"`,
                    c.phone,
                    c.email,
                    c.enrollmentDate,
                    c.stamps,
                    c.rewardsRedeemed
                ].join(','))
            ].join('\n');
            
            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            const date = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `clientes_loyalfly_${date}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Descarga iniciada.', 'success');
        } catch (error) {
            console.error("Failed to download customers:", error);
            showToast('Error al descargar la lista de clientes.', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ['nombre', 'telefono', 'email'];
        const example = ['Juan Perez Ejemplo', '5512345678', 'juan@ejemplo.com'];
        const csvContent = [headers.join(','), example.join(',')].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'plantilla_carga_masiva.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !businessData) return;
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            showToast('Por favor, selecciona un archivo .csv', 'error');
            return;
        }

        setUploadStep('processing');

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').slice(1);

            let success = 0;
            let skipped = 0;
            let limitReached = false;
            const errors: string[] = [];
            const planLimit = businessData.plan ? PLAN_LIMITS[businessData.plan as keyof typeof PLAN_LIMITS] : Infinity;

            for (const row of rows) {
                if (!row.trim()) continue;

                if (businessData.customerCount + success >= planLimit) {
                    limitReached = true;
                    skipped++;
                    continue;
                }

                const [name, phone, email] = row.split(',').map(cell => cell.trim().replace(/"/g, ''));
                
                if (!name || !phone) {
                    skipped++;
                    errors.push(`Fila omitida (datos incompletos): ${row}`);
                    continue;
                }

                const cleanedPhone = phone.replace(/\D/g, '');
                if (!/^\d{10}$/.test(cleanedPhone)) {
                     skipped++;
                     errors.push(`Fila omitida (teléfono inválido): ${row}`);
                     continue;
                }

                try {
                    const existingCustomer = await getCustomerByPhone(user.uid, cleanedPhone);
                    if (existingCustomer) {
                        skipped++;
                        continue;
                    }
                    await createNewCustomer(user.uid, { name, phone: cleanedPhone, email: email || '' });
                    success++;
                } catch (err: any) {
                    if (err.message === "LIMIT_REACHED") {
                        limitReached = true;
                        skipped++;
                    } else {
                        skipped++;
                        errors.push(`Fila omitida (error al guardar): ${row}`);
                        console.error(err);
                    }
                }
            }

            setUploadResult({ success, skipped, errors, limitReached });
            setUploadStep('result');
            fetchInitialData();
        };
        reader.readAsText(file);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleNextPage = async () => {
        if (!user || isLastPage || loading) return;
        setLoading(true);
        const nextPage = mainListPage + 1;
        try {
            const cursor = pageStartCursors[nextPage - 1];
            const { customers: customersData, lastVisibleDoc } = await getCustomers(user.uid, cursor);
            setCustomers(customersData);
            if (customersData.length < PAGE_SIZE) {
                setIsLastPage(true);
            }
            if (nextPage >= pageStartCursors.length) {
                setPageStartCursors(prev => [...prev, lastVisibleDoc]);
            }
            setMainListPage(nextPage);
        } catch (error) {
            showToast('Error al cargar la siguiente página.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePrevPage = async () => {
        if (!user || mainListPage <= 1 || loading) return;
        setLoading(true);
        const prevPage = mainListPage - 1;
        try {
            const cursor = pageStartCursors[prevPage - 1];
            const { customers: customersData } = await getCustomers(user.uid, cursor);
            setCustomers(customersData);
            setIsLastPage(false);
            setMainListPage(prevPage);
        } catch (error) {
            showToast('Error al cargar la página anterior.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleNextSearchPage = () => {
        const nextPage = searchPage + 1;
        const start = (nextPage - 1) * PAGE_SIZE;
        if (start >= allSearchResults.length) return;
        
        setCustomers(allSearchResults.slice(start, start + PAGE_SIZE));
        setSearchPage(nextPage);
    };

    const handlePrevSearchPage = () => {
        const prevPage = searchPage - 1;
        if (prevPage < 1) return;
        const start = (prevPage - 1) * PAGE_SIZE;
        
        setCustomers(allSearchResults.slice(start, start + PAGE_SIZE));
        setSearchPage(prevPage);
    };

    const isLimitReached = businessData && businessData.plan && businessData.plan !== 'Pro' && PLAN_LIMITS[businessData.plan] && businessData.customerCount >= PLAN_LIMITS[businessData.plan];
    const totalSearchPages = Math.ceil(allSearchResults.length / PAGE_SIZE);

    const renderTableBody = () => {
        if (loading) {
            return (
                <tr>
                    <td colSpan={7} className="text-center px-6 py-12">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-black" role="status">
                                <span className="sr-only">{t('common.loading')}</span>
                            </div>
                        </div>
                    </td>
                </tr>
            );
        }

        if (customers.length > 0) {
            return customers.map((customer) => (
                <tr key={customer.id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-4 sm:px-6 font-medium text-gray-900 whitespace-nowrap">{customer.name}</td>
                    <td className="px-4 py-4 sm:px-6">{customer.phone}</td>
                    <td className="px-4 py-4 sm:px-6 hidden md:table-cell">{customer.email}</td>
                    <td className="px-4 py-4 sm:px-6 hidden lg:table-cell">{customer.enrollmentDate}</td>
                    <td className="px-4 py-4 sm:px-6 text-center">{customer.stamps}</td>
                    <td className="px-4 py-4 sm:px-6 text-center">{customer.rewardsRedeemed}</td>
                    <td className="px-4 py-4 sm:px-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                            {customer.stamps >= 10 ? (
                                <button
                                    onClick={() => handleOpenRedeemModal(customer)}
                                    className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-white bg-[#00AA00] rounded-md hover:bg-opacity-90 transition-colors"
                                    title={t('dashboard.actions.redeem')}
                                >
                                    <GiftIcon />
                                    <span>{t('dashboard.actions.redeem')}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleOpenStampModal(customer)}
                                    className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-white bg-[#4D17FF] rounded-md hover:bg-opacity-90 transition-colors"
                                    title={t('dashboard.actions.stamp')}
                                >
                                    <StampIcon />
                                    <span>{t('dashboard.actions.stamp')}</span>
                                </button>
                            )}
                            <Link
                                to={`/app/editar-cliente/${customer.id}`}
                                className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                <EditIcon/>
                                <span>{t('common.edit')}</span>
                            </Link>
                        </div>
                    </td>
                </tr>
            ));
        }

        return (
            <tr>
                <td colSpan={7} className="text-center px-6 py-12 text-gray-500">
                    {t('dashboard.empty')}
                </td>
            </tr>
        );
    };

    const PaginationControls = () => (
        <div className="flex justify-between items-center mt-4 px-4 py-3 sm:px-6">
            {isSearchActive ? (
                <>
                    <button
                        onClick={handlePrevSearchPage}
                        disabled={searchPage === 1}
                        className="px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span className="text-base text-gray-600">
                        Página {searchPage} de {totalSearchPages}
                    </span>
                    <button
                        onClick={handleNextSearchPage}
                        disabled={searchPage >= totalSearchPages}
                        className="px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </>
            ) : (
                 <>
                    <button
                        onClick={handlePrevPage}
                        disabled={mainListPage === 1 || loading}
                        className="px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span className="text-base text-gray-600">Página {mainListPage}</span>
                    <button
                        onClick={handleNextPage}
                        disabled={isLastPage || loading}
                        className="px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </>
            )}
        </div>
    );

    return (
        <div>
            {isLimitReached && businessData?.plan && businessData.plan !== 'Pro' && (
                <AlertBar plan={businessData.plan} />
            )}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-3xl font-bold text-black tracking-tight">{t('dashboard.title')}</h1>
                     <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            disabled={isLimitReached}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <QRIcon />
                            {t('dashboard.scanQr')}
                        </button>
                         <button
                            onClick={() => !isLimitReached && navigate('/app/nuevo-cliente')}
                            disabled={isLimitReached}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-base font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserPlusIcon />
                            {t('dashboard.newCustomer')}
                        </button>
                        <button
                            onClick={() => {
                                setUploadStep('info');
                                setUploadResult(null);
                                setIsUploadModalOpen(true);
                            }}
                            disabled={isLimitReached}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UploadIcon />
                            {t('dashboard.bulkUpload')}
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                        >
                            {isDownloading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-black"></div>
                            ) : (
                                <DownloadIcon />
                            )}
                            {isDownloading ? t('common.loading') : t('dashboard.downloadCsv')}
                        </button>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="customer-search" className="sr-only">Buscar cliente</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            id="customer-search"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-black focus:border-black sm:text-base"
                            placeholder={t('dashboard.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                         {isSearching && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-black"></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                     <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-gray-600">
                            <thead className="text-base text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th scope="col" className="px-4 py-3 sm:px-6">{t('common.name')}</th>
                                    <th scope="col" className="px-4 py-3 sm:px-6">{t('common.phone')}</th>
                                    <th scope="col" className="px-4 py-3 sm:px-6 hidden md:table-cell">{t('common.email')}</th>
                                    <th scope="col" className="px-4 py-3 sm:px-6 hidden lg:table-cell">{t('dashboard.table.joined')}</th>
                                    <th scope="col" className="px-4 py-3 sm:px-6 text-center">{t('dashboard.table.stamps')}</th>
                                    <th scope="col" className="px-4 py-3 sm:px-6 text-center">{t('dashboard.table.rewards')}</th>
                                    <th scope="col" className="px-4 py-3 sm:px-6 text-right">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderTableBody()}
                            </tbody>
                        </table>
                    </div>
                     {(!loading && (isSearchActive ? allSearchResults.length > 0 : customers.length > 0)) && <PaginationControls />}
                </div>
            </div>
            
            {selectedCustomer && (
                <ConfirmationModal
                    isOpen={isStampModalOpen}
                    onClose={() => setIsStampModalOpen(false)}
                    onConfirm={handleConfirmAddStamp}
                    title="Agregar Sellos"
                    confirmText={isUpdating ? 'Agregando...' : `Agregar ${stampQuantity} Sello${stampQuantity > 1 ? 's' : ''}`}
                >
                    <p className="mb-4 text-center">Selecciona la cantidad de sellos a agregar:</p>
                    <div className="flex items-center justify-center gap-3">
                        <button 
                            onClick={() => handleQuantityChange(stampQuantity - 1)}
                            className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                            disabled={stampQuantity <= 1 || isUpdating}
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
                            disabled={isUpdating}
                        />
                        <button 
                            onClick={() => handleQuantityChange(stampQuantity + 1)}
                            className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            aria-label="Aumentar cantidad"
                            disabled={isUpdating}
                        >
                            +
                        </button>
                    </div>
                    <div className="mt-4 text-center bg-gray-50 p-3 rounded-md border border-gray-200">
                        <p className="font-semibold">{selectedCustomer.name}</p>
                        <p className="text-base text-gray-500">{selectedCustomer.phone}</p>
                    </div>
                </ConfirmationModal>
            )}

            {selectedCustomer && (
                <ConfirmationModal
                    isOpen={isRedeemModalOpen}
                    onClose={() => setIsRedeemModalOpen(false)}
                    onConfirm={handleConfirmRedeemReward}
                    title="Confirmar Redención"
                    confirmText={isUpdating ? 'Redimiendo...' : 'Sí, Redimir'}
                >
                    <p>Estás a punto de redimir la recompensa para <strong>{selectedCustomer.name}</strong>.</p>
                    <p className="mt-2">Su contador de sellos se reducirá en 10. ¿Estás seguro?</p>
                </ConfirmationModal>
            )}

            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold text-black mb-4">{t('dashboard.bulkUpload')}</h2>
                        {uploadStep === 'info' && (
                            <div>
                                <p className="text-base text-gray-700">Sube un archivo .csv con los datos de tus clientes. El sistema omitirá automáticamente los clientes cuyo número de teléfono ya esté registrado.</p>
                                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                                    <h3 className="font-semibold text-gray-800">Formato del archivo:</h3>
                                    <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                                        <li>Debe ser un archivo .csv (delimitado por comas).</li>
                                        <li>La primera fila debe ser el encabezado: <code>nombre,telefono,email</code></li>
                                        <li>El campo <code>email</code> es opcional.</li>
                                        <li>Los nombres no deben contener comas.</li>
                                        <li>Los teléfonos deben ser de 10 dígitos.</li>
                                    </ul>
                                </div>
                                <div className="mt-4">
                                    <button onClick={handleDownloadTemplate} className="text-base font-medium text-[#4D17FF] hover:underline">
                                        Descargar plantilla de ejemplo
                                    </button>
                                </div>
                                <div className="mt-6 flex justify-end space-x-4">
                                    <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">{t('common.cancel')}</button>
                                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-base font-medium text-white bg-black rounded-md hover:bg-gray-800">Seleccionar Archivo</button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv" className="hidden" />
                                </div>
                            </div>
                        )}
                        {uploadStep === 'processing' && (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black mx-auto"></div>
                                <p className="mt-4 text-lg font-medium text-gray-700">Procesando archivo...</p>
                                <p className="text-base text-gray-500">Esto puede tardar unos segundos.</p>
                            </div>
                        )}
                        {uploadStep === 'result' && uploadResult && (
                            <div>
                                <p className="text-lg font-medium text-gray-800">Carga completada.</p>
                                <div className="mt-4 space-y-2">
                                    <p className="text-base text-green-600"><strong>{uploadResult.success}</strong> clientes agregados exitosamente.</p>
                                    <p className="text-base text-yellow-600"><strong>{uploadResult.skipped}</strong> filas omitidas (duplicados o errores de formato).</p>
                                    {uploadResult.limitReached && (
                                        <p className="text-base text-red-600"><strong>Se alcanzó el límite de clientes de tu plan.</strong> No se pudieron agregar más clientes.</p>
                                    )}
                                </div>
                                {uploadResult.errors.length > 0 && (
                                    <details className="mt-4 text-sm">
                                        <summary className="cursor-pointer text-gray-600">Ver detalles de errores</summary>
                                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 max-h-32 overflow-auto">
                                            {uploadResult.errors.join('\n')}
                                        </pre>
                                    </details>
                                )}
                                <div className="mt-6 flex justify-end">
                                    <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-base font-medium text-white bg-black rounded-md hover:bg-gray-800">Cerrar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isScannerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <h2 className="text-xl font-bold text-black mb-4">Escanear Código QR</h2>
                        <div id="qr-reader" className="w-full"></div>
                        <button
                            onClick={() => setIsScannerOpen(false)}
                            className="mt-4 w-full px-4 py-2 text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;