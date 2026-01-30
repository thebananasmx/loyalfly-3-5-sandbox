import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendPasswordReset } from '../services/firebaseService';
import ErrorMessage from '../components/ErrorMessage';
import ExclamationCircleIcon from '../components/icons/ExclamationCircleIcon';
import { useTranslation } from 'react-i18next';

const validateEmail = (email: string) => {
  if (!email) return "El email es requerido.";
  if (!/\S+@\S+\.\S+/.test(email)) return "No es una dirección de email válida.";
  return "";
};

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const [view, setView] = useState<'login' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        document.title = 'Loyalfly';
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setMessage('');

        const emailError = validateEmail(email);
        const passwordError = !password ? "La contraseña es requerida." : "";

        if (emailError || passwordError) {
            setErrors({ email: emailError, password: passwordError });
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            navigate('/app/dashboard');
        } catch (err) {
            setErrors({ form: 'Credenciales incorrectas. Inténtalo de nuevo.' });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setMessage('');

        const emailError = validateEmail(email);
        if (emailError) {
            setErrors({ email: emailError });
            return;
        }

        setLoading(true);
        try {
            await sendPasswordReset(email);
            setMessage('Si existe una cuenta, se ha enviado un enlace para restablecer tu contraseña a tu correo.');
        } catch (err) {
            setErrors({ form: 'No se pudo enviar el correo. Inténtalo de nuevo.' });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const switchToResetView = () => {
        setView('reset');
        setErrors({});
        setMessage('');
        setPassword('');
    };

    const switchToLoginView = () => {
        setView('login');
        setErrors({});
        setMessage('');
    };

    const renderLoginView = () => (
        <>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black tracking-tight">{t('auth.loginTitle')}</h1>
                <p className="text-gray-500 mt-2">{t('auth.loginSubtitle')}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
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
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${errors.password ? 'pr-10 border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 placeholder-gray-400 focus:ring-black focus:border-black'}`}
                            placeholder="••••••••"
                            aria-invalid={!!errors.password}
                            aria-describedby="password-error"
                        />
                        {errors.password && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <ExclamationCircleIcon />
                            </div>
                        )}
                    </div>
                    <ErrorMessage message={errors.password} id="password-error" />
                </div>

                <ErrorMessage message={errors.form} />

                <div>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400"
                    >
                        {loading ? t('common.loading') : t('header.login')}
                    </button>
                </div>
            </form>
             <div className="text-center mt-6 space-y-3">
                 <p className="text-base text-gray-500">
                    {t('auth.noAccount')}{' '}
                    <Link to="/register" className="font-medium text-[#4D17FF] hover:underline">
                        {t('header.register')}
                    </Link>
                </p>
                <button 
                    type="button"
                    onClick={switchToResetView}
                    className="text-sm font-medium text-[#4D17FF] hover:underline focus:outline-none"
                >
                    {t('auth.forgotPassword')}
                </button>
             </div>
        </>
    );

    const renderResetView = () => (
        <>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black tracking-tight">{t('auth.resetTitle')}</h1>
                <p className="text-gray-500 mt-2">{t('auth.resetSubtitle')}</p>
            </div>
            
            {message ? (
                 <div className="p-4 mb-4 text-base text-green-800 bg-green-100 rounded-lg text-center" role="alert">
                    {message}
                 </div>
            ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                        <label htmlFor="email-reset" className="block text-base font-medium text-gray-700">{t('common.email')}</label>
                        <div className="relative mt-1">
                            <input 
                                id="email-reset"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${errors.email ? 'pr-10 border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 placeholder-gray-400 focus:ring-black focus:border-black'}`}
                                placeholder="tu@negocio.com"
                                aria-invalid={!!errors.email}
                                aria-describedby="email-reset-error"
                            />
                             {errors.email && (
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <ExclamationCircleIcon />
                                </div>
                            )}
                        </div>
                         <ErrorMessage message={errors.email} id="email-reset-error" />
                    </div>

                    <ErrorMessage message={errors.form} />

                    <div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400"
                        >
                            {loading ? t('common.loading') : t('auth.sendLink')}
                        </button>
                    </div>
                </form>
            )}

             <div className="text-center mt-6">
                 <p className="text-base text-gray-500">
                    <button onClick={switchToLoginView} className="font-medium text-[#4D17FF] hover:underline focus:outline-none">
                        {t('auth.backToLogin')}
                    </button>
                </p>
             </div>
        </>
    );
    
    return (
        <div className="flex items-center justify-center min-h-[70vh] bg-white">
            <div className="w-full max-w-sm p-8">
                {view === 'login' ? renderLoginView() : renderResetView()}
            </div>
        </div>
    );
};

export default LoginPage;