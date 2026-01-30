import React from 'react';
import { useToast } from '../context/ToastContext';

const SuccessIcon = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ErrorIcon = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AlertIcon = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const CloseIcon = () => <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

const toastConfig = {
    success: { icon: <SuccessIcon />, bg: 'bg-[#00AA00]' },
    error: { icon: <ErrorIcon />, bg: 'bg-red-600' },
    alert: { icon: <AlertIcon />, bg: 'bg-yellow-500' },
};

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    if (!toasts.length) return null;

    return (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:top-6 sm:right-6 space-y-3 z-50 flex flex-col items-center sm:items-end pointer-events-none" role="status" aria-live="polite">
            {toasts.map(toast => {
                const config = toastConfig[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto w-full max-w-sm relative flex items-center p-4 rounded-lg shadow-lg text-white ${config.bg} animate-fade-in-down`}
                    >
                        <div className="flex-shrink-0">{config.icon}</div>
                        <div className="ml-3 text-base font-medium">{toast.message}</div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-auto p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Cerrar notificación"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ToastContainer;