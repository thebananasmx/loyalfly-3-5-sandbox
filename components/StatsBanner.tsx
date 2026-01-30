import React from 'react';
import { useTranslation } from 'react-i18next';

const StatsBanner: React.FC = () => {
    const { t } = useTranslation();
    
    // Static values to reduce Firestore reads on public landing page
    const stats = { 
        businesses: 50, 
        stamps: 190, 
        rewards: 90 
    };

    return (
        <section className="w-full bg-gradient-to-r from-[#4D17FF] to-[#3a11cc] py-12 lg:py-16 text-white shadow-lg">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-10 tracking-tight">{t('landing.stats.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0s' }}>
                        <span className="text-4xl md:text-5xl font-extrabold mb-2">+{stats.businesses}</span>
                        <span className="text-lg md:text-xl font-medium opacity-90">{t('landing.stats.businesses')}</span>
                    </div>
                    <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <span className="text-4xl md:text-5xl font-extrabold mb-2">+{stats.stamps.toLocaleString()}</span>
                        <span className="text-lg md:text-xl font-medium opacity-90">{t('landing.stats.stamps')}</span>
                    </div>
                    <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <span className="text-4xl md:text-5xl font-extrabold mb-2">+{stats.rewards.toLocaleString()}</span>
                        <span className="text-lg md:text-xl font-medium opacity-90">{t('landing.stats.rewards')}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StatsBanner;