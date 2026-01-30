import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getBusinessData, reauthenticateAndChangePassword } from '../services/firebaseService';
import type { Business } from '../types';
import ErrorMessage from '../components/ErrorMessage';

const AccountSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [businessData, setBusinessData] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordErrors, setPasswordErrors] = useState<{ current?: string; new?: string; confirm?: string; form?: string }>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        document.title = 'Ajustes de Cuenta | Loyalfly App';
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const data = await getBusinessData(user.uid);
                setBusinessData(data);
            } catch (error) {
                console.error("Failed to fetch business data:", error);
                showToast('No se pudieron cargar los datos de la cuenta.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, showToast]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordErrors({});

        const newErrors: { current?: string; new?: string; confirm?: string } = {};
        if (!currentPassword) newErrors.current = "La contraseña actual es requerida.";
        if (newPassword.length < 6) newErrors.new = "La nueva contraseña debe tener al menos 6 caracteres.";
        if (newPassword !== confirmPassword) newErrors.confirm = "Las contraseñas no coinciden.";

        if (Object.keys(newErrors).length > 0) {
            setPasswordErrors(newErrors);
            return;
        }

        setIsSaving(true);
        try {
            await reauthenticateAndChangePassword(currentPassword, newPassword);
            showToast('¡Contraseña actualizada con éxito!', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error("Password change failed:", error);
            if (error.code === 'auth/wrong-password') {
                setPasswordErrors({ form: 'La contraseña actual es incorrecta.' });
            } else {
                setPasswordErrors({ form: 'No se pudo cambiar la contraseña. Inténtalo de nuevo.' });
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black" role="status">
                    <span className="sr-only">Cargando...</span>
                </div>
            </div>
        );
    }
    
    const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black disabled:bg-gray-100";

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-black tracking-tight">Ajustes de Cuenta</h1>
                <p className="text-gray-600 mt-1">Gestiona la información de tu negocio y la seguridad de tu cuenta.</p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg space-y-6">
                <h2 className="text-xl font-bold text-black">Información del Negocio</h2>
                <div>
                    <label htmlFor="businessName" className="block text-base font-medium text-gray-700">Nombre del Negocio</label>
                    <input id="businessName" type="text" value={businessData?.name || ''} disabled className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="email" className="block text-base font-medium text-gray-700">Email de Registro</label>
                    <input id="email" type="email" value={user?.email || ''} disabled className={inputClasses} />
                </div>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <h2 className="text-xl font-bold text-black">Seguridad</h2>
                <form onSubmit={handlePasswordChange} className="space-y-6 mt-4">
                     <div>
                        <label htmlFor="currentPassword" className="block text-base font-medium text-gray-700">Contraseña Actual</label>
                        <input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className={inputClasses} />
                        <ErrorMessage message={passwordErrors.current} />
                    </div>
                     <div>
                        <label htmlFor="newPassword" className="block text-base font-medium text-gray-700">Nueva Contraseña</label>
                        <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={inputClasses} />
                        <ErrorMessage message={passwordErrors.new} />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700">Confirmar Nueva Contraseña</label>
                        <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputClasses} />
                        <ErrorMessage message={passwordErrors.confirm} />
                    </div>
                    <ErrorMessage message={passwordErrors.form} />
                    <div className="text-right">
                        <button type="submit" disabled={isSaving} className="px-6 py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 disabled:bg-gray-400">
                            {isSaving ? 'Guardando...' : 'Cambiar Contraseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountSettingsPage;
