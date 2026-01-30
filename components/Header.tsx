import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;


const NavItem: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void; baseClassName: string; }> = ({ to, children, onClick, baseClassName }) => (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `${baseClassName} transition-colors ${
          isActive ? 'text-black' : 'text-gray-500 hover:text-black'
        }`
      }
    >
      {children}
    </NavLink>
);

const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <Link to="/" onClick={closeMenu}>
              <img src="https://raw.githubusercontent.com/thebananasmx/loyalfly-3-5/refs/heads/main/assets/logo_desk.svg" alt="Loyalfly" className="hidden md:block h-9 w-auto" />
              <img src="https://raw.githubusercontent.com/thebananasmx/loyalfly-3-5/refs/heads/main/assets/logo_mob.svg" alt="Loyalfly" className="md:hidden h-8 w-auto" />
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center">
              <nav className="flex items-center space-x-6">
                <NavItem to="/pricing" baseClassName="text-base font-medium">{t('header.pricing')}</NavItem>
                <NavItem to="/blog" baseClassName="text-base font-medium">{t('header.blog')}</NavItem>
                <NavItem to="/terminos" baseClassName="text-base font-medium">{t('header.terms')}</NavItem>
              </nav>
              <div className="flex items-center space-x-4 ml-6">
                  {/* Language Selector Desktop */}
                  <div className="mr-2">
                    <LanguageSelector />
                  </div>
                  <Link 
                    to="/login" 
                    className="text-base font-medium text-gray-600 hover:text-black transition-colors"
                  >
                    {t('header.login')}
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 text-base font-medium text-white bg-[#4D17FF] rounded-md hover:bg-opacity-90 transition-colors"
                  >
                    {t('header.register')}
                  </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <LanguageSelector />
              <button onClick={toggleMenu} aria-label={t('header.openMenu')} className="p-2 -mr-2">
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu - Full Screen Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col animate-fade-in-up">
          {/* Top bar with close button */}
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-200">
             <Link to="/" onClick={closeMenu}>
                <img src="https://raw.githubusercontent.com/thebananasmx/loyalfly-3-5/refs/heads/main/assets/logo_mob.svg" alt="Loyalfly" className="h-8 w-auto" />
             </Link>
             <button onClick={toggleMenu} aria-label={t('header.closeMenu')} className="p-2 -mr-2">
                <XIcon />
             </button>
          </div>

          {/* Menu content */}
          <div className="flex-grow flex flex-col justify-center items-center px-8 pb-16">
             <nav className="flex flex-col items-center space-y-8">
                <NavItem to="/pricing" onClick={closeMenu} baseClassName="text-2xl font-medium">{t('header.pricing')}</NavItem>
                <NavItem to="/blog" onClick={closeMenu} baseClassName="text-2xl font-medium">{t('header.blog')}</NavItem>
                <NavItem to="/terminos" onClick={closeMenu} baseClassName="text-2xl font-medium">{t('header.terms')}</NavItem>
             </nav>
             <div className="w-full max-w-xs mt-16 space-y-4">
                <Link 
                  to="/login"
                  onClick={closeMenu}
                  className="block w-full px-4 py-3 text-center text-lg font-medium text-gray-600 bg-gray-100 rounded-md hover:text-black hover:bg-gray-200 transition-colors"
                >
                  {t('header.login')}
                </Link>
                <Link 
                  to="/register"
                  onClick={closeMenu} 
                  className="block w-full px-4 py-3 text-center text-lg font-medium text-white bg-[#4D17FF] rounded-md hover:bg-opacity-90 transition-colors"
                >
                  {t('header.register')}
                </Link>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;