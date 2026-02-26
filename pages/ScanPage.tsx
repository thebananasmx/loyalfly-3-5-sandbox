import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  X, 
  CheckCircle2, 
  User, 
  Phone, 
  Mail, 
  Award, 
  History,
  ChevronRight,
  Camera,
  Lock
} from 'lucide-react';
import { 
  getBusinessIdBySlug, 
  getBusinessData, 
  getCustomerById,
  addStampToCustomer,
  redeemRewardForCustomer
} from '../services/firebaseService';
import LanguageSelector from '../components/LanguageSelector';
import { useToast } from '../context/ToastContext';
import type { Business, Customer } from '../types';

type ScanState = 'CHECK_PIN' | 'IDLE' | 'SCANNING' | 'DETAILS' | 'SUCCESS';

const ScanPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [state, setState] = useState<ScanState>('CHECK_PIN');
  const [business, setBusiness] = useState<Business | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

  // Load business data
  useEffect(() => {
    const loadBusiness = async () => {
      if (!slug) return;
      const bid = await getBusinessIdBySlug(slug);
      if (bid) {
        const bdata = await getBusinessData(bid);
        setBusiness(bdata);
        
        // Check if PIN is already in localStorage for this business
        const savedPin = localStorage.getItem(`staff_pin_${bid}`);
        if (savedPin && bdata?.staffPin === savedPin) {
          setState('IDLE');
        }
      } else {
        navigate('/');
      }
    };
    loadBusiness();
  }, [slug, navigate]);

  // QR Scanner Effect
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (state === 'SCANNING') {
      const initScanner = async () => {
        console.log("Initializing scanner...");
        // Wait a bit longer for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const element = document.getElementById(scannerContainerId);
        if (!element) {
          console.error("Scanner element not found in DOM");
          showToast(t('common.error'), 'error');
          setState('IDLE');
          return;
        }

        try {
          html5QrCode = new Html5Qrcode(scannerContainerId);
          scannerRef.current = html5QrCode;
          
          console.log("Starting camera...");
          await html5QrCode.start(
            { facingMode: "environment" },
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            async (decodedText) => {
              console.log("QR Code detected:", decodedText);
              await handleCustomerFound(decodedText);
            },
            (errorMessage) => {
              // Only log real errors, not the constant "QR not found" noise
              if (errorMessage.includes("NotFoundException")) return;
              // console.log("Scanner warning:", errorMessage);
            }
          );
          console.log("Scanner started successfully");
        } catch (err: any) {
          console.error("Failed to start scanner:", err);
          const errorMsg = err?.message || err || "Unknown error";
          showToast(`${t('common.error')}: ${errorMsg}`, 'error');
          setState('IDLE');
        }
      };

      initScanner();
    }

    return () => {
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          console.log("Stopping scanner...");
          html5QrCode.stop()
            .then(() => {
              console.log("Scanner stopped");
              html5QrCode?.clear();
            })
            .catch(err => console.error("Error stopping scanner:", err));
        } else {
          try {
            html5QrCode.clear();
          } catch (e) {}
        }
      }
    };
  }, [state]);

  const handlePinSubmit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        if (business && newPin === business.staffPin) {
          localStorage.setItem(`staff_pin_${business.id}`, newPin);
          setState('IDLE');
          setPin('');
          setError('');
        } else {
          setError(t('staff.invalidPin'));
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const startScanning = () => {
    console.log("startScanning called, setting state to SCANNING");
    setState('SCANNING');
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner manually:", err);
      }
    }
  };

  const handleCustomerFound = async (customerId: string) => {
    setLoading(true);
    await stopScanning();
    try {
      if (business) {
        const cdata = await getCustomerById(business.id, customerId);
        if (cdata) {
          setCustomer(cdata);
          setState('DETAILS');
        } else {
          // Try to see if it's a phone number or email if not a direct ID
          // But for simplicity, we assume it's the ID as per the "static QR" plan
          setError("Customer not found");
          setState('IDLE');
        }
      }
    } catch (err) {
      console.error(err);
      setState('IDLE');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!business || !customer) return;
    setLoading(true);
    try {
      if (customer.stamps >= 10) {
        await redeemRewardForCustomer(business.id, customer.id);
      } else {
        await addStampToCustomer(business.id, customer.id);
      }
      setState('SUCCESS');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSlideProgress(0);
    }
  };

  const renderPinPad = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white">
      <div className="mb-8 text-center">
        {business?.cardSettings?.logoUrl ? (
          <img src={business.cardSettings.logoUrl} alt={business.name} className="h-16 mx-auto mb-4 object-contain" />
        ) : (
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-indigo-600 w-8 h-8" />
          </div>
        )}
        <h1 className="text-xl font-bold text-gray-900">{t('staff.enterPin')}</h1>
        <p className="text-gray-500 mt-2">{business?.name}</p>
      </div>

      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 ${
              pin.length > i ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-red-500 mb-4 animate-bounce">{error}</p>}

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePinSubmit(num.toString())}
            className="h-16 rounded-full bg-gray-50 text-2xl font-semibold text-gray-900 active:bg-gray-200 transition-colors"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handlePinSubmit('0')}
          className="h-16 rounded-full bg-gray-50 text-2xl font-semibold text-gray-900 active:bg-gray-200 transition-colors"
        >
          0
        </button>
        <button
          onClick={() => setPin(pin.slice(0, -1))}
          className="h-16 rounded-full flex items-center justify-center text-gray-500 active:bg-gray-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );

  const renderIdle = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white">
      <div className="mb-12 text-center">
        {business?.cardSettings?.logoUrl ? (
          <img src={business.cardSettings.logoUrl} alt={business.name} className="h-20 mx-auto mb-6 object-contain" />
        ) : (
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <QrCode className="text-indigo-600 w-10 h-10" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{business?.name}</h1>
        <p className="text-gray-500 max-w-xs mx-auto">{t('staff.idleText')}</p>
      </div>

      <button
        onClick={startScanning}
        className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-transform"
      >
        <Camera className="w-6 h-6" />
        {t('staff.scanBtn')}
      </button>
    </div>
  );

  const renderScanning = () => (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur-md z-10">
        <h2 className="text-white font-bold">{t('staff.scanTitle')}</h2>
        <button onClick={() => { stopScanning(); setState('IDLE'); }} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-grow relative flex items-center justify-center bg-zinc-900">
        <div id={scannerContainerId} className="w-full h-full min-h-[300px]" />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1 rounded-br-lg" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetails = () => {
    if (!customer) return null;
    const isRedeemable = customer.stamps >= 10;
    
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="p-6 bg-white border-b border-gray-100 flex items-center gap-4">
          <button onClick={() => setState('IDLE')} className="p-2 -ml-2 text-gray-400">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">{t('staff.customerDetails')}</h2>
        </div>

        <div className="p-6 flex-grow">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                  <Phone className="w-3 h-3" />
                  {customer.phone}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">
                  <Award className="w-3 h-3" />
                  {t('staff.stamps')}
                </div>
                <div className="text-2xl font-black text-indigo-600">
                  {customer.stamps} <span className="text-gray-300 font-normal">/ 10</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">
                  <History className="w-3 h-3" />
                  {t('staff.rewards')}
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {customer.rewardsRedeemed}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <p className="text-indigo-700 text-sm font-medium text-center">
                {isRedeemable ? t('staff.readyToRedeem') : `${10 - customer.stamps} ${t('staff.stampsLeft')}`}
              </p>
            </div>
          </motion.div>
        </div>

        <div className="p-6 pb-12 bg-white border-t border-gray-100">
          <div className="relative h-16 bg-gray-100 rounded-full overflow-hidden p-1">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`text-sm font-bold uppercase tracking-widest transition-opacity ${slideProgress > 20 ? 'opacity-0' : 'opacity-40'}`}>
                {isRedeemable ? t('staff.redeemReward') : t('staff.addStamp')}
              </span>
            </div>
            
            <motion.div 
              drag="x"
              dragConstraints={{ left: 0, right: 280 }} // Approximate width minus handle
              dragElastic={0.1}
              onDrag={(e, info) => {
                const progress = (info.point.x / 280) * 100;
                setSlideProgress(progress);
              }}
              onDragEnd={(e, info) => {
                if (info.offset.x > 200) {
                  handleAction();
                } else {
                  setSlideProgress(0);
                }
              }}
              className={`absolute left-1 top-1 bottom-1 w-14 rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10 ${
                isRedeemable ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ x: slideProgress * 2.8 }} // Simple mapping
            >
              <ChevronRight className="text-white w-6 h-6" />
            </motion.div>
            
            <div 
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-75 ${
                isRedeemable ? 'bg-emerald-100' : 'bg-indigo-100'
              }`}
              style={{ width: `${Math.max(14, slideProgress)}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 text-indigo-600"
      >
        <CheckCircle2 className="w-32 h-32" />
      </motion.div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">{t('staff.success')}</h1>
      <p className="text-gray-500 mb-12">{t('common.success')}</p>
      
      <button
        onClick={() => setState('IDLE')}
        className="w-full max-w-xs py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg active:scale-95 transition-transform"
      >
        {t('staff.nextCustomer')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Top Bar with Language Selector */}
      <div className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-center bg-white/80 backdrop-blur-md">
        <div className="w-10" /> {/* Spacer */}
        <LanguageSelector />
      </div>

      <div className="pt-16">
        {state === 'CHECK_PIN' && renderPinPad()}
        {state === 'IDLE' && renderIdle()}
        {state === 'SCANNING' && renderScanning()}
        {state === 'DETAILS' && renderDetails()}
        {state === 'SUCCESS' && renderSuccess()}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ScanPage;
