import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

const InfoBar: React.FC = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="relative bg-[#EDE8FF] text-center p-3 text-base font-medium">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-[#4D17FF]">
                    {t('infoBar.prefix')} <span className="font-bold">{t('infoBar.highlight')}</span> {t('infoBar.suffix')}
                    <Link to="/register" className="ml-4 px-4 py-1.5 text-sm font-semibold text-white bg-[#4D17FF] rounded-full hover:bg-opacity-90 transition-colors shadow-sm">
                        {t('infoBar.cta')}
                    </Link>
                </p>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 text-[#4D17FF] hover:bg-black/10 rounded-full transition-colors"
                aria-label="Cerrar barra de información"
            >
                <XIcon />
            </button>
        </div>
    );
};

export default InfoBar;