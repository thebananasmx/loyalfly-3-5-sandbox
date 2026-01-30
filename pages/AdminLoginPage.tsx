import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginWithEmail, registerSuperAdmin } from '../services/firebaseService';
import ErrorMessage from '../components/ErrorMessage';
import ExclamationCircleIcon from '../components/icons/ExclamationCircleIcon';

type View = 'login' | 'register';

const AdminLoginPage: React.FC = () => {
    const [view, setView] = useState<View>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; form?: string }>({});
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { user, isSuperAdmin, loading: authLoading } = useAuth();

    useEffect(() => {
        document.title = 'Admin Access | Loyalfly';
        // If user is already logged in and is a super admin, redirect to dashboard
        if (!authLoading && user && isSuperAdmin) {
            navigate('/admin/dashboard');
        }
    }, [user, isSuperAdmin, authLoading, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        try {
            await loginWithEmail(email, password);
            // The context's useEffect will handle the redirect upon successful login and isSuperAdmin check
        } catch (err) {
            setErrors({ form: 'Credenciales incorrectas o no es una cuenta de administrador.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { email?: string; password?: string; confirmPassword?: string; } = {};
        if (!email || !/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email inválido.";
        if (password.length < 6) newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
        if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            await registerSuperAdmin(email, password);
            // The context's useEffect will handle the redirect
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setErrors({ form: 'Este email ya está en uso.' });
            } else {
                setErrors({ form: 'No se pudo crear la cuenta de administrador.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || (user && isSuperAdmin)) {
         return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                <div className="animate-spin rounded-full h-16 w-16 border-2 border-gray-200 border-t-black" role="status">
                <span className="sr-only">Cargando...</span>
                </div>
            </div>
        );
    }
    
    const renderForm = () => {
        if (view === 'login') {
            return (
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email-login" className="block text-base font-medium text-gray-700">Email</label>
                        <input id="email-login" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black" />
                    </div>
                    <div>
                        <label htmlFor="password-login" className="block text-base font-medium text-gray-700">Contraseña</label>
                        <input id="password-login" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black" />
                    </div>
                    <ErrorMessage message={errors.form} />
                    <button type="submit" disabled={loading} className="w-full py-2.5 px-4 font-semibold text-white bg-black rounded-md hover:bg-gray-800 disabled:bg-gray-400">
                        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            );
        }
        return (
            <form onSubmit={handleRegister} className="space-y-6">
                <div>
                    <label htmlFor="email-reg" className="block text-base font-medium text-gray-700">Email</label>
                    <input id="email-reg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-black focus:border-black`} />
                    <ErrorMessage message={errors.email} />
                </div>
                <div>
                    <label htmlFor="password-reg" className="block text-base font-medium text-gray-700">Contraseña</label>
                    <input id="password-reg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:ring-black focus:border-black`} placeholder="Mínimo 6 caracteres"/>
                    <ErrorMessage message={errors.password} />
                </div>
                <div>
                    <label htmlFor="confirm-pass" className="block text-base font-medium text-gray-700">Confirmar Contraseña</label>
                    <input id="confirm-pass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} focus:ring-black focus:border-black`} />
                    <ErrorMessage message={errors.confirmPassword} />
                </div>
                 <ErrorMessage message={errors.form} />
                <button type="submit" disabled={loading} className="w-full py-2.5 px-4 font-semibold text-white bg-black rounded-md hover:bg-gray-800 disabled:bg-gray-400">
                    {loading ? 'Registrando...' : 'Registrar Administrador'}
                </button>
            </form>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-full max-w-sm p-8 space-y-8">
                <div className="text-center">
                    <Link to="/">
                        <img src="https://raw.githubusercontent.com/thebananasmx/loyalfly-3-5/refs/heads/main/assets/logo_desk.svg" alt="Loyalfly" className="h-8 w-auto mx-auto mb-4" />
                    </Link>
                    <h1 className="text-2xl font-bold text-black tracking-tight">Portal de Administración</h1>
                </div>
                
                <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => setView('login')} className={`${view === 'login' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base`}>
                                Iniciar Sesión
                            </button>
                            <button onClick={() => setView('register')} className={`${view === 'register' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base`}>
                                Registrarse
                            </button>
                        </nav>
                    </div>
                    {renderForm()}
                </div>
                 <div className="text-center text-sm text-gray-500">
                    <Link to="/" className="hover:underline">Volver a la página principal</Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;