import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CookieConsent: React.FC = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        try {
            const consent = localStorage.getItem('loyalfly_cookie_consent');
            if (!consent) {
                setIsVisible(true);
            }
        } catch (error) {
            console.error("Could not access localStorage:", error);
        }
    }, []);

    const handleConsent = (consent: 'accepted' | 'rejected') => {
        try {
            localStorage.setItem('loyalfly_cookie_consent', consent);
        } catch (error) {
            console.error("Could not set item in localStorage:", error);
        }
        setIsVisible(false);
    };
    
    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 md:right-auto md:left-4 z-50 w-full max-w-sm p-5 bg-white border border-gray-200 rounded-lg shadow-lg animate-fade-in-up">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold text-black">{t('cookieConsent.title')}</h3>
                    <p className="mt-2 text-base text-gray-600">
                        {t('cookieConsent.text')}{' '}
                        <Link to="/terminos" className="font-medium text-[#4D17FF] underline">{t('cookieConsent.readTerms')}</Link>
                    </p>
                </div>
                <button 
                    onClick={() => handleConsent('rejected')}
                    aria-label="Cerrar aviso de cookies"
                    className="p-1 -mt-1 -mr-1 text-gray-500 hover:text-black transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="mt-4 flex gap-3">
                <button
                    onClick={() => handleConsent('accepted')}
                    className="flex-1 px-4 py-2 text-base font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                >
                    {t('cookieConsent.accept')}
                </button>
                <button
                    onClick={() => handleConsent('rejected')}
                    className="flex-1 px-4 py-2 text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                    {t('cookieConsent.reject')}
                </button>
            </div>
        </div>
    );
};

export default CookieConsent;