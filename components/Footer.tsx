import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <p className="text-base text-gray-500">&copy; {new Date().getFullYear()} Loyalfly. {t('footer.rights')}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/terminos" className="text-base text-gray-500 hover:text-black transition-colors">{t('footer.terms')}</Link>
            <Link to="/pricing" className="text-base text-gray-500 hover:text-black transition-colors">{t('footer.pricing')}</Link>
            <Link to="/blog" className="text-base text-gray-500 hover:text-black transition-colors">{t('footer.blog')}</Link>
            <Link to="/docs/style-guide" className="text-base text-gray-500 hover:text-black transition-colors">{t('footer.docs')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;