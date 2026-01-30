import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StatsBanner from '../components/StatsBanner';

const CheckCircleIcon = () => <svg className="w-6 h-6 text-[#00AA00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;

const StoreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>;
const CoffeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 011 1v12a1 1 0 11-2 0V2a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 7H16a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" /></svg>;
const ScissorsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.003 3.012a1 1 0 011.414 0l2.28 2.28a.5.5 0 010 .707l-1.586 1.586a1 1 0 01-1.414-1.414l.879-.88-1.17-1.17a1 1 0 010-1.414l-.293-.293zm2.28 9.28a.5.5 0 000 .707l1.586 1.586a1 1 0 001.414-1.414l-.879-.88 1.17-1.17a1 1 0 000-1.414l-2.28-2.28a1 1 0 00-1.414 0l-.293.293zm2.586-7.586a1 1 0 010 1.414l-8 8a1 1 0 01-1.414-1.414l8-8a1 1 0 011.414 0z" clipRule="evenodd" /><path d="M3 5a2 2 0 100 4 2 2 0 000-4zM11 11a2 2 0 100 4 2 2 0 000-4z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.5a1 1 0 002 0V3a1 1 0 00-1-1zM5 6.5a1 1 0 00-1 1V9a1 1 0 002 0V7.5a1 1 0 00-1-1zM5 11a1 1 0 00-1 1v1.5a1 1 0 002 0V12a1 1 0 00-1-1zM8 2a1 1 0 00-1 1v1.5a1 1 0 002 0V3a1 1 0 00-1-1zM8 6.5a1 1 0 00-1 1V9a1 1 0 002 0V7.5a1 1 0 00-1-1zM8 11a1 1 0 00-1 1v1.5a1 1 0 002 0V12a1 1 0 00-1-1zM11.5 2a1 1 0 011-1h1.5a1 1 0 010 2h-1.5a1 1 0 01-1-1zM11 6.5a1 1 0 00-1 1V9a1 1 0 002 0V7.5a1 1 0 00-1-1zM11 11a1 1 0 00-1 1v1.5a1 1 0 002 0V12a1 1 0 00-1-1zM14.5 6.5a1 1 0 011-1h1.5a1 1 0 010 2h-1.5a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;


const Feature: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="flex items-start space-x-4">
        <div>
            <CheckCircleIcon />
        </div>
        <div>
            <h3 className="text-lg font-semibold text-black">{title}</h3>
            <p className="mt-1 text-gray-600">{description}</p>
        </div>
    </div>
);

const LandingPage: React.FC = () => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('emprendedores');

    const slides = [
        {
            industry: t('landing.industries.slides.cafe.industry'),
            title: t('landing.industries.slides.cafe.title'),
            description: t('landing.industries.slides.cafe.desc'),
            color: "bg-yellow-100 text-yellow-800",
            imageUrl: "https://res.cloudinary.com/dg4wbuppq/image/upload/v1762011139/coffee_loyalfly_mg9r2p.png"
        },
        {
            industry: t('landing.industries.slides.restaurant.industry'),
            title: t('landing.industries.slides.restaurant.title'),
            description: t('landing.industries.slides.restaurant.desc'),
            color: "bg-red-100 text-red-800",
            imageUrl: "https://res.cloudinary.com/dg4wbuppq/image/upload/v1762011138/restaurant_loyalfly_hs7cwc.png"
        },
        {
            industry: t('landing.industries.slides.entrepreneur.industry'),
            title: t('landing.industries.slides.entrepreneur.title'),
            description: t('landing.industries.slides.entrepreneur.desc'),
            color: "bg-blue-100 text-blue-800",
            imageUrl: "https://res.cloudinary.com/dg4wbuppq/image/upload/v1762011139/paint_loyalfly_aqcand.png"
        },
        {
            industry: t('landing.industries.slides.makeup.industry'),
            title: t('landing.industries.slides.makeup.title'),
            description: t('landing.industries.slides.makeup.desc'),
            color: "bg-pink-100 text-pink-800",
            imageUrl: "https://res.cloudinary.com/dg4wbuppq/image/upload/v1762011141/makeup_loyalfly_s0yta0.png"
        },
        {
            industry: t('landing.industries.slides.barber.industry'),
            title: t('landing.industries.slides.barber.title'),
            description: t('landing.industries.slides.barber.desc'),
            color: "bg-gray-200 text-gray-800",
            imageUrl: "https://res.cloudinary.com/dg4wbuppq/image/upload/v1762011138/barber_loyalfly_r8ymwd.png"
        }
    ];

    const tabs = [
      {
        id: 'emprendedores',
        title: t('landing.designs.tabs.entrepreneur.title'),
        icon: <StoreIcon />,
        description: t('landing.designs.tabs.entrepreneur.desc'),
        imageUrl: 'https://res.cloudinary.com/dg4wbuppq/image/upload/v1762055851/card_loyalfly_tmx9vh.png'
      },
      {
        id: 'cafeterias',
        title: t('landing.designs.tabs.cafe.title'),
        icon: <CoffeeIcon />,
        description: t('landing.designs.tabs.cafe.desc'),
        imageUrl: 'https://res.cloudinary.com/dg4wbuppq/image/upload/v1762057146/card_cafe_mzjj0q.png'
      },
      {
        id: 'barberias',
        title: t('landing.designs.tabs.barber.title'),
        icon: <ScissorsIcon />,
        description: t('landing.designs.tabs.barber.desc'),
        imageUrl: 'https://res.cloudinary.com/dg4wbuppq/image/upload/v1762057493/card_barber_ftfyxa.png'
      },
      {
        id: 'belleza',
        title: t('landing.designs.tabs.beauty.title'),
        icon: <SparklesIcon />,
        description: t('landing.designs.tabs.beauty.desc'),
        imageUrl: 'https://res.cloudinary.com/dg4wbuppq/image/upload/v1762057298/card_beauty_cu1r3n.png'
      }
    ];

    useEffect(() => {
        document.title = 'Loyalfly | Programa de Lealtad Digital para Negocios';
        
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 7000);

        return () => clearInterval(interval);
    }, [slides.length]);

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    };
    
    const activeTabData = tabs.find(tab => tab.id === activeTab);

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="py-12 md:py-24 lg:py-32">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        {/* Left side: Text content */}
                        <div className="md:w-1/2 text-center md:text-left">
                            <h1 className="text-4xl md:text-6xl font-extrabold text-black tracking-tight">
                                {t('landing.hero.title')}
                            </h1>
                            <p className="mt-6 max-w-2xl mx-auto md:mx-0 text-lg md:text-xl text-gray-600">
                                {t('landing.hero.subtitle')}
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                                <Link
                                    to="/pricing"
                                    className="px-8 py-3 w-full sm:w-auto text-base md:text-lg font-medium text-white bg-[#4D17FF] rounded-md hover:bg-opacity-90 transition-transform hover:scale-105"
                                >
                                    {t('landing.hero.viewPlans')}
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-8 py-3 w-full sm:w-auto text-base md:text-lg font-medium text-black bg-gray-100 rounded-md hover:bg-gray-200 transition-transform hover:scale-105"
                                >
                                    {t('landing.hero.login')}
                                </Link>
                            </div>
                        </div>

                        {/* Right side: Image */}
                        <div className="md:w-1/2">
                            <img
                                src="https://res.cloudinary.com/dg4wbuppq/image/upload/w_1000/q_auto/f_webp,fl_awebp/v1762014799/loyalfly_hero_p4fkee.png"
                                alt="Tarjeta de lealtad digital de Loyalfly en un smartphone"
                                className="rounded-lg shadow-xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Banner Section */}
            <StatsBanner />

            {/* Designs Tab Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-black">{t('landing.designs.title')}</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-gray-600">{t('landing.designs.subtitle')}</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        {/* Tab buttons */}
                        <div className="mb-8 p-1.5 bg-gray-200 rounded-lg flex flex-wrap justify-center gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 text-base font-medium rounded-md transition-all duration-200 flex-grow text-center flex items-center justify-center gap-2 ${
                                        activeTab === tab.id ? 'bg-[#4D17FF] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.title}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        {activeTabData && (
                            <div key={activeTabData.id} className="grid md:grid-cols-2 gap-8 md:gap-12 items-center animate-fade-in-up">
                                <div className="text-center md:text-left">
                                    <h3 className="text-2xl font-bold text-black">{activeTabData.title}</h3>
                                    <p className="mt-4 text-gray-600">{activeTabData.description}</p>
                                </div>
                                <div>
                                    <img
                                        src={activeTabData.imageUrl}
                                        alt={`Tarjeta de lealtad para ${activeTabData.title}`}
                                        className="rounded-lg shadow-xl mx-auto max-w-xs"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-black">{t('landing.features.title')}</h2>
                        <p className="mt-4 text-gray-600">{t('landing.features.subtitle')}</p>
                    </div>
                    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
                        <Feature 
                            title={t('landing.features.list.digital.title')}
                            description={t('landing.features.list.digital.desc')}
                        />
                        <Feature 
                            title={t('landing.features.list.custom.title')}
                            description={t('landing.features.list.custom.desc')}
                        />
                        <Feature 
                            title={t('landing.features.list.analytics.title')}
                            description={t('landing.features.list.analytics.desc')}
                        />
                        <Feature 
                            title={t('landing.features.list.results.title')}
                            description={t('landing.features.list.results.desc')}
                        />
                    </div>
                </div>
            </section>

            {/* Industries Carousel Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-black">{t('landing.industries.title')}</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-gray-600">{t('landing.industries.subtitle')}</p>
                    </div>
                    
                    <div className="relative max-w-5xl mx-auto md:px-16">
                        <div className="overflow-hidden rounded-lg">
                            <div 
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                            >
                                {slides.map((slide, index) => (
                                    <div key={index} className="w-full flex-shrink-0 p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                                            <div className="md:order-2">
                                                <img
                                                    src={slide.imageUrl}
                                                    alt={slide.title}
                                                    className="rounded-lg shadow-xl w-full h-auto object-cover"
                                                />
                                            </div>
                                            <div className="text-center md:text-left md:order-1">
                                                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full mb-4 ${slide.color}`}>
                                                    {slide.industry}
                                                </span>
                                                <h3 className="text-2xl font-bold text-black">{slide.title}</h3>
                                                <p className="mt-4 text-gray-600">{slide.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Arrow Controls */}
                        <button
                            onClick={goToPrevious}
                            aria-label="Diapositiva anterior"
                            className="hidden md:flex items-center justify-center absolute top-1/2 left-4 transform -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors z-10"
                        >
                            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <button
                            onClick={goToNext}
                            aria-label="Siguiente diapositiva"
                            className="hidden md:flex items-center justify-center absolute top-1/2 right-4 transform -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors z-10"
                        >
                            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                        
                        <div className="flex justify-center mt-6 space-x-2">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    aria-label={`Ir a la diapositiva ${index + 1}`}
                                    className={`w-3 h-3 rounded-full transition-colors ${currentIndex === index ? 'bg-black' : 'bg-gray-300 hover:bg-gray-400'}`}
                                ></button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;