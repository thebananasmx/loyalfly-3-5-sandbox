import React from 'react';
import QRCode from './QRCode';
import { useTranslation } from 'react-i18next';

interface CardPreviewProps {
  businessName: string;
  rewardText: string;
  cardColor: string;
  stamps: number;
  textColorScheme: 'dark' | 'light';
  logoUrl?: string;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
}

// Increased size of the star icon itself
const StarIcon: React.FC = () => (
    <svg className="w-8 h-8 text-[#FFC700]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
);

const CardPreview: React.FC<CardPreviewProps> = ({ businessName, rewardText, cardColor, stamps, textColorScheme, logoUrl, customerName, customerPhone, customerId }) => {
  const { t } = useTranslation();
  const totalStamps = 10;
  const isRewardReady = stamps >= totalStamps;

  const isLight = textColorScheme === 'light';
  const primaryTextColor = isLight ? 'text-white' : 'text-black';
  const secondaryTextColor = isLight ? 'text-white/80' : 'text-gray-700';
  const logoTextColor = isLight ? 'text-white opacity-50' : 'text-black opacity-50';
  const logoBgColor = isLight ? 'bg-white/20' : 'bg-black/10';
  const filledStampBgColor = isLight ? 'bg-white' : 'bg-black';
  const unfilledStampBgColor = 'bg-white/30';
  const rewardReadyTextColor = isLight ? 'text-green-300' : 'text-green-600';

  return (
    // Single container for the entire card, with rounded corners and shadow.
    <div 
        className="w-full max-w-sm mx-auto font-sans shadow-lg rounded-lg overflow-hidden flex flex-col transition-colors duration-300" 
        style={{ backgroundColor: cardColor }}
    >
      <div className="p-4 sm:p-5 flex-grow">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
            <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center overflow-hidden ${logoBgColor} transition-colors`}>
                {logoUrl ? (
                    <img src={logoUrl} alt={`${businessName} logo`} className="w-full h-full object-cover" />
                ) : (
                    <span className={`text-2xl font-bold ${logoTextColor} transition-colors`}>L</span>
                )}
            </div>
            <div className="text-right flex-grow min-w-0">
                <h2 className={`text-xl font-bold truncate ${primaryTextColor} transition-colors`}>{businessName || 'Nombre del Negocio'}</h2>
                <p className={`text-sm mt-1 ${secondaryTextColor} transition-colors`}>
                    {stamps}/{totalStamps} {t('card.stampsForReward')}
                </p>
            </div>
        </div>

        {/* Stamps Grid - Space between elements reduced */}
        <div className="grid grid-cols-5 gap-3 mt-6 mb-4">
            {Array.from({ length: totalStamps }).map((_, index) => (
                <div
                    key={index}
                    className={`w-full aspect-square rounded-full flex items-center justify-center transition-all duration-300 ${
                        index < stamps ? filledStampBgColor : unfilledStampBgColor
                    }`}
                >
                    {index < stamps && <StarIcon />}
                </div>
            ))}
        </div>

        {/* Customer Info */}
        {customerName && customerPhone && (
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className={`text-xs uppercase tracking-wider font-semibold ${secondaryTextColor}`}>{t('common.name')}</p>
                    <p className={`text-lg font-bold truncate ${primaryTextColor}`}>{customerName}</p>
                </div>
                <div className="text-left">
                    <p className={`text-xs uppercase tracking-wider font-semibold ${secondaryTextColor}`}>{t('common.phone')}</p>
                    <p className={`text-lg font-bold truncate ${primaryTextColor}`}>{customerPhone}</p>
                </div>
            </div>
        )}
      </div>
      
      {/* Reward Section - Integrated without border */}
      <div className="p-4 sm:p-5">
        {isRewardReady ? (
            <div>
                <p className={`text-center font-bold text-lg ${rewardReadyTextColor}`}>
                    {t('card.congrats')}
                </p>
                <p className={`text-center font-semibold mt-1 ${primaryTextColor}`}>
                    {rewardText}
                </p>
            </div>
        ) : (
             <div>
                <p className={`text-center text-base ${secondaryTextColor}`}>
                    {t('card.nextReward')}
                </p>
                <p className={`text-center font-semibold mt-1 ${primaryTextColor}`}>
                    {rewardText}
                </p>
            </div>
        )}
      </div>

      {/* QR Code Section */}
      {customerId && (
        <div className="p-4 flex justify-center items-center">
          <div className="bg-white rounded-md p-1">
            <QRCode url={customerId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CardPreview;