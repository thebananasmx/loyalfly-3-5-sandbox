
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getBusinessIdBySlug, getSurveySettings, getCustomerById, hasCustomerVoted, submitSurveyResponse } from '../services/firebaseService';
import type { Customer } from '../types';

interface SurveySettings {
    isEnabled: boolean;
    bannerMessage: string;
    question: string;
    option1: string;
    option2: string;
    surveyId: string;
}

const PublicVotePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const customerId = new URLSearchParams(location.search).get('customerId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [survey, setSurvey] = useState<SurveySettings | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voted, setVoted] = useState(false);

    useEffect(() => {
        document.title = 'Encuesta | Loyalfly';
        const init = async () => {
            if (!slug || !customerId) {
                setError('Información inválida para cargar la encuesta.');
                setLoading(false);
                return;
            }
            try {
                const id = await getBusinessIdBySlug(slug);
                if (!id) {
                    setError('Negocio no encontrado.');
                    setLoading(false);
                    return;
                }
                setBusinessId(id);
                
                const [surveyData, customerData] = await Promise.all([
                    getSurveySettings(id),
                    getCustomerById(id, customerId)
                ]);

                if (!surveyData || !surveyData.isEnabled) {
                    setError('No hay una encuesta activa para este negocio.');
                    setLoading(false);
                    return;
                }
                if (!customerData) {
                    setError('Cliente no encontrado.');
                    setLoading(false);
                    return;
                }
                
                const alreadyVoted = await hasCustomerVoted(id, customerId, surveyData.surveyId);
                if (alreadyVoted) {
                    setVoted(true);
                }

                setSurvey(surveyData as SurveySettings);
                setCustomer(customerData);
                document.title = `${surveyData.question} | Loyalfly`;

            } catch (err) {
                setError('Ocurrió un error al cargar la encuesta.');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [slug, customerId]);

    const handleVote = async (option: string) => {
        if (!businessId || !customer || !survey || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await submitSurveyResponse(businessId, customer.id, customer.name, option, survey.surveyId);
            setVoted(true);
        } catch (err) {
            console.error(err);
            setError('No se pudo registrar tu voto. Es posible que ya hayas votado.');
            // Still show the success state to avoid confusion for the user, as the error is likely "already voted".
            setVoted(true);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black" role="status"><span className="sr-only">Cargando...</span></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-sm mx-auto text-center">
                 {error ? (
                    <div className="bg-white p-6 border border-red-300 rounded-lg shadow-sm">
                        <h1 className="text-xl font-bold text-red-600">Error</h1>
                        <p className="text-gray-700 mt-2">{error}</p>
                        <Link to={`/view/${slug}`} className="mt-4 inline-block text-[#4D17FF] hover:underline">Volver a la tarjeta</Link>
                    </div>
                ) : voted ? (
                     <div className="bg-white p-6 border border-green-300 rounded-lg shadow-sm animate-fade-in-up">
                        <h1 className="text-2xl font-bold text-green-600">¡Gracias por tu opinión!</h1>
                        <p className="text-gray-700 mt-2">Hemos agregado un sello a tu tarjeta como agradecimiento.</p>
                        <Link to={`/view/${slug}`} className="mt-4 inline-block w-full py-2.5 px-4 font-semibold text-white bg-black hover:bg-gray-800 rounded-md transition-colors">
                            Ver mi tarjeta
                        </Link>
                    </div>
                ) : survey && customer ? (
                    <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm animate-fade-in-up">
                        <h2 className="text-lg text-gray-500">Hola, {customer.name.split(' ')[0]}</h2>
                        <h1 className="text-2xl font-bold text-black mt-2">{survey.question}</h1>
                        <div className="mt-6 space-y-3">
                            <button onClick={() => handleVote(survey.option1)} disabled={isSubmitting} className="w-full py-3 px-4 text-lg font-semibold text-white bg-black hover:bg-gray-800 rounded-md transition-colors disabled:bg-gray-400">
                                {isSubmitting ? 'Votando...' : survey.option1}
                            </button>
                             <button onClick={() => handleVote(survey.option2)} disabled={isSubmitting} className="w-full py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors disabled:bg-gray-300">
                                {isSubmitting ? 'Votando...' : survey.option2}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
             <div className="text-center text-sm text-gray-500 mt-8">
              <p>Powered by Loyalfly</p>
            </div>
        </div>
    );
};

export default PublicVotePage;
