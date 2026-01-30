import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import ExclamationCircleIcon from '../components/icons/ExclamationCircleIcon';
import { useTranslation } from 'react-i18next';

const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeSlashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.111 2.458.325M9 12a3 3 0 11-6 0 3 3 0 016 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1l22 22" /></svg>;

const RegisterPage: React.FC = () => {
    const { t } = useTranslation();
    const [businessName, setBusinessName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ businessName?: string; email?: string; password?: string; confirmPassword?: string; form?: string }>({});
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { register } = useAuth();

    useEffect(() => {
        document.title = 'Registrarse | Loyalfly';
    }, []);

    const validate = () => {
        const newErrors: { businessName?: string; email?: string; password?: string; confirmPassword?: string; } = {};
        
        if (!businessName) newErrors.businessName = "El nombre del negocio es requerido.";
        if (!email) {
            newErrors.email = "El email es requerido.";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "No es una dirección de email válida.";
        }
        if (!password) {
            newErrors.password = "La contraseña es requerida.";
        } else if (password.length < 6) {
            newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validate()) return;
        
        setLoading(true);

        try {
            await register(email, password, businessName);
            
            // Google Ads Conversion Tracking
            // This fires only when registration is successful
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'conversion', {
                    'send_to': 'AW-11539287487/2DR-CL-moMMbEL-brv4q'
                });
            }

            navigate('/app/dashboard');
        } catch (err: any) {
            let formError = 'Ocurrió un error. Inténtalo de nuevo.';
            if (err.code === 'auth/email-already-in-use') {
                setErrors({ email: 'Este email ya está registrado.' });
                formError = '';
            } else if (err.code === 'auth/weak-password') {
                setErrors({ password: 'La contraseña debe tener al menos 6 caracteres.' });
                formError = '';
            }
            if (formError) setErrors(prev => ({ ...prev, form: formError }));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-[70vh] bg-white">
            <div className="w-full max-w-sm p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-black tracking-tight">{t('auth.registerTitle')}</h1>
                    <p className="text-gray-500 mt-2">{t('auth.registerSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="businessName" className="block text-base font-medium text-gray-700">{t('auth.businessName')}</label>
                        <div className="relative mt-1">
                            <input 
                                id="businessName"
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                required
                                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${errors.businessName ? 'pr-10 border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 placeholder-gray-400 focus:ring-black focus:border-black'}`}
                                placeholder="Ej: Café del Sol"
                                aria-invalid={!!errors.businessName}
                                aria-describedby="businessName-error"
                            />
                            {errors.businessName && (
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <ExclamationCircleIcon />
                                </div>
                            )}
                        </div>
                        <ErrorMessage message={errors.businessName} id="businessName-error" />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-base font-medium text-gray-700">{t('common.email')}</label>
                        <div className="relative mt-1">
                             <input 
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${errors.email ? 'pr-10 border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 placeholder-gray-400 focus:ring-black focus:border-black'}`}
                                placeholder="tu@negocio.com"
                                aria-invalid={!!errors.email}
                                aria-describedby="email-error"
                            />
                             {errors.email && (
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <ExclamationCircleIcon />
                                </div>
                            )}
                        </div>
                        <ErrorMessage message={errors.email} id="email-error" />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-base font-medium text-gray-700">{t('auth.password')}</label>
                        <div className="relative mt-1">
                            <input 
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${errors.password ? 'pr-16 border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 placeholder-gray-400 focus:ring-black focus:border-black'}`}
                                placeholder="Mínimo 6 caracteres"
                                aria-invalid={!!errors.password}
                                aria-describedby="password-error"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {errors.password && (
                                    <div className="pointer-events-none">
                                        <ExclamationCircleIcon />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        <ErrorMessage message={errors.password} id="password-error" />
                    </div>
                    
                    <div>
                        <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700">{t('auth.confirmPassword')}</label>
                        <div className="relative mt-1">
                            <input 
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${errors.confirmPassword ? 'pr-16 border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 placeholder-gray-400 focus:ring-black focus:border-black'}`}
                                placeholder="Repite tu contraseña"
                                aria-invalid={!!errors.confirmPassword}
                                aria-describedby="confirmPassword-error"
                            />
                             <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {errors.confirmPassword && (
                                    <div className="pointer-events-none">
                                        <ExclamationCircleIcon />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        <ErrorMessage message={errors.confirmPassword} id="confirmPassword-error" />
                    </div>

                    <ErrorMessage message={errors.form} />

                    <div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400"
                        >
                            {loading ? t('auth.creating') : t('auth.createAccount')}
                        </button>
                    </div>
                </form>
                <div className="text-center mt-6">
                    <p className="text-base text-gray-500">
                        {t('auth.haveAccount')}{' '}
                        <Link to="/login" className="font-medium text-[#4D17FF] hover:underline">
                            {t('header.login')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;