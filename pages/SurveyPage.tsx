import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getBusinessData, updateSurveySettings, getSurveyResponses } from '../services/firebaseService';
import { useTranslation } from 'react-i18next';

const SurveyPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { showToast } = useToast();

    // State for form
    const [isEnabled, setIsEnabled] = useState(false);
    const [bannerMessage, setBannerMessage] = useState('¡Gana un sello extra! Contesta nuestra encuesta.');
    const [question, setQuestion] = useState('');
    const [option1, setOption1] = useState('');
    const [option2, setOption2] = useState('');
    const [surveyId, setSurveyId] = useState<string | null>(null);
    const [originalQuestion, setOriginalQuestion] = useState('');
    const [originalOption1, setOriginalOption1] = useState('');
    const [originalOption2, setOriginalOption2] = useState('');


    // State for responses
    const [responses, setResponses] = useState<any[]>([]);
    const [stats, setStats] = useState({ option1: 0, option2: 0, total: 0 });
    
    // General state
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        document.title = 'Encuesta | Loyalfly App';
        const fetchData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const data: any = await getBusinessData(user.uid);
                if (data && data.surveySettings) {
                    const { isEnabled, bannerMessage, question, option1, option2, surveyId } = data.surveySettings;
                    setIsEnabled(isEnabled || false);
                    setBannerMessage(bannerMessage || '¡Gana un sello extra! Contesta nuestra encuesta.');
                    setQuestion(question || '');
                    setOriginalQuestion(question || '');
                    setOption1(option1 || '');
                    setOriginalOption1(option1 || '');
                    setOption2(option2 || '');
                    setOriginalOption2(option2 || '');
                    setSurveyId(surveyId || null);
                    if (surveyId) {
                        const surveyResponses = await getSurveyResponses(user.uid, surveyId);
                        setResponses(surveyResponses);
                    }
                }
            } catch (error) {
                showToast(t('survey.saveError'), 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user, showToast, t]);

    useEffect(() => {
        if (responses.length > 0 && option1 && option2) {
            const newStats = responses.reduce((acc, response) => {
                if (response.response === option1) {
                    acc.option1++;
                } else if (response.response === option2) {
                    acc.option2++;
                }
                return acc;
            }, { option1: 0, option2: 0 });
            setStats({ ...newStats, total: responses.length });
        } else {
            setStats({ option1: 0, option2: 0, total: 0 });
        }
    }, [responses, option1, option2]);

    const handleSave = async () => {
        if (!user) return;
        if (!question || !option1 || !option2) {
            showToast(t('survey.requiredError'), 'alert');
            return;
        }

        setIsSaving(true);
        let newSurveyId = surveyId;
        
        const isNewSurvey = (
            (question.trim() !== '' && question !== originalQuestion) ||
            option1 !== originalOption1 ||
            option2 !== originalOption2
        );

        if (isNewSurvey) {
            newSurveyId = `survey_${Date.now()}`;
        }
        
        const settings = { isEnabled, bannerMessage, question, option1, option2, surveyId: newSurveyId };

        try {
            await updateSurveySettings(user.uid, settings);
            setSurveyId(newSurveyId);
            
            setOriginalQuestion(question);
            setOriginalOption1(option1);
            setOriginalOption2(option2);

            if (isNewSurvey) {
              setResponses([]);
            }
            showToast(t('survey.saveSuccess'), 'success');
        } catch (error) {
            showToast(t('survey.saveError'), 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black" role="status">
                    <span className="sr-only">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black";

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-black tracking-tight">{t('survey.title')}</h1>
                <p className="text-gray-600 mt-1">{t('survey.subtitle')}</p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-black">{t('survey.configTitle')}</h2>
                     <div className="flex items-center">
                        <span className="mr-3 text-base font-medium text-gray-700">{isEnabled ? t('survey.active') : t('survey.inactive')}</span>
                        <button
                            onClick={() => setIsEnabled(!isEnabled)}
                            className={`${isEnabled ? 'bg-black' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
                        >
                            <span className="sr-only">Activar encuesta</span>
                            <span className={`${isEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
                        </button>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="bannerMessage" className="block text-base font-medium text-gray-700 mb-1">{t('survey.bannerLabel')}</label>
                    <input id="bannerMessage" type="text" value={bannerMessage} onChange={e => setBannerMessage(e.target.value)} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="question" className="block text-base font-medium text-gray-700 mb-1">{t('survey.questionLabel')}</label>
                    <input id="question" type="text" value={question} onChange={e => setQuestion(e.target.value)} className={inputClasses} placeholder={t('survey.questionPlaceholder')} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="option1" className="block text-base font-medium text-gray-700 mb-1">{t('survey.option1Label')}</label>
                        <input id="option1" type="text" value={option1} onChange={e => setOption1(e.target.value)} className={inputClasses} placeholder={t('survey.option1Placeholder')}/>
                    </div>
                     <div>
                        <label htmlFor="option2" className="block text-base font-medium text-gray-700 mb-1">{t('survey.option2Label')}</label>
                        <input id="option2"  type="text" value={option2} onChange={e => setOption2(e.target.value)} className={inputClasses} placeholder={t('survey.option2Placeholder')}/>
                    </div>
                </div>
                <div className="text-right">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 disabled:bg-gray-400">
                        {isSaving ? t('common.saving') : t('common.save')}
                    </button>
                </div>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <h2 className="text-xl font-bold text-black">{t('survey.resultsTitle')}</h2>
                {responses.length > 0 ? (
                    <div className="mt-4 space-y-4">
                        <p className="text-gray-600">{t('survey.totalResponses')}: <strong>{stats.total}</strong></p>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium">{option1}</span>
                                    <span className="text-gray-600">{stats.option1} ({stats.total > 0 ? Math.round((stats.option1 / stats.total) * 100) : 0}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-[#4D17FF] h-2.5 rounded-full" style={{ width: `${stats.total > 0 ? (stats.option1 / stats.total) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium">{option2}</span>
                                    <span className="text-gray-600">{stats.option2} ({stats.total > 0 ? Math.round((stats.option2 / stats.total) * 100) : 0}%)</span>
                                </div>
                                 <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-[#4D17FF] h-2.5 rounded-full" style={{ width: `${stats.total > 0 ? (stats.option2 / stats.total) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="mt-4 text-gray-500">{t('survey.emptyResponses')}</p>
                )}
            </div>
        </div>
    );
};

export default SurveyPage;