
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InfoBar from './InfoBar';
import CookieConsent from './CookieConsent';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const showInfoBar = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col font-sans text-base text-gray-800">
      {showInfoBar && <InfoBar />}
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default MainLayout;