import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CheckIcon = () => <svg className="w-5 h-5 text-[#00AA00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;

interface PricingCardProps {
  plan: string;
  price: string;
  description: string;
  features: string[];
  isFeatured?: boolean;
  isContact?: boolean;
  stripeLink?: string;
  buttonText: string;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, price, description, features, isFeatured = false, isContact = false, stripeLink, buttonText }) => {
  const cardClasses = `border rounded-lg p-6 sm:p-8 flex flex-col h-full ${isFeatured ? 'border-[#4D17FF] border-2' : 'border-gray-200'}`;
  const buttonClasses = `w-full mt-8 py-3 font-semibold rounded-md transition-colors text-center ${isFeatured ? 'bg-[#4D17FF] text-white hover:bg-opacity-90' : 'bg-black text-white hover:bg-gray-800'}`;

  const renderButton = () => {
    if (stripeLink) {
      return (
        <a href={stripeLink} target="_blank" rel="noopener noreferrer" className={buttonClasses}>
          {buttonText}
        </a>
      );
    }
    if (isContact) {
      return (
        <a href="mailto:hector@thebananas.com.mx" className={buttonClasses}>
          {buttonText}
        </a>
      );
    }
    return (
      <Link to="/register" className={buttonClasses}>
        {buttonText}
      </Link>
    );
  };

  return (
    <div className={cardClasses}>
      <h3 className="text-lg font-semibold text-black">{plan}</h3>
      <p className="mt-4 text-4xl font-bold text-black">{price}</p>
      <p className="mt-2 text-gray-600">{description}</p>
      <ul className="mt-6 space-y-4 text-gray-600 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start space-x-3">
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {renderButton()}
    </div>
  );
};


const PricingPage: React.FC = () => {
    const { t } = useTranslation();
    useEffect(() => {
        document.title = 'Loyalfly';
    }, []);

    return (
        <div className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-black tracking-tight">{t('pricing.title')}</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                        {t('pricing.subtitle')}
                    </p>
                </div>

                <div className="mt-16 max-w-5xl mx-auto grid lg:grid-cols-3 gap-8">
                    <PricingCard 
                        plan={t('pricing.free.name')}
                        price="$0"
                        description={t('pricing.free.desc')}
                        buttonText={t('pricing.cta.start')}
                        features={[
                            t('pricing.features.customers100'),
                            t('pricing.features.digitalCard'),
                            t('pricing.features.basicCustom')
                        ]}
                    />
                    <PricingCard 
                        plan={t('pricing.entrepreneur.name')}
                        price="$299 / mes"
                        description={t('pricing.entrepreneur.desc')}
                        buttonText={t('pricing.cta.subscribe')}
                        features={[
                            t('pricing.features.customers1000'),
                            t('pricing.features.digitalCard'),
                            t('pricing.features.fullCustom'),
                            t('pricing.features.removeBranding'),
                            t('pricing.features.emailSupport')
                        ]}
                        isFeatured={true}
                        stripeLink="https://buy.stripe.com/3cI6oI2dX1Rrfpy9XP5c400"
                    />
                    <PricingCard 
                        plan={t('pricing.pro.name')}
                        price="Cotiza hoy"
                        description={t('pricing.pro.desc')}
                        buttonText={t('pricing.cta.contact')}
                        features={[
                            t('pricing.features.customersUnlimited'),
                            t('pricing.features.digitalCard'),
                            t('pricing.features.fullCustom'),
                            t('pricing.features.removeBranding'),
                            t('pricing.features.prioritySupport')
                        ]}
                        isContact={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default PricingPage;