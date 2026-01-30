
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Declara la función gtag en el scope global de la ventana para TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: { [key: string]: any }
    ) => void;
  }
}

const AnalyticsTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Verifica si la función gtag está disponible en la ventana global
    if (typeof window.gtag === 'function') {
      // Envía un evento 'page_view' a Google Analytics cada vez que cambia la ruta
      window.gtag('config', 'G-Z4DE1F8NTK', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location.pathname, location.search]); // El efecto se ejecuta cuando la ruta cambia

  // Este componente no renderiza ninguna UI
  return null;
};

export default AnalyticsTracker;
