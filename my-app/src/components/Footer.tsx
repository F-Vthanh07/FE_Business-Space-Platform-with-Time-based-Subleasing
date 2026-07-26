import React from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import './Footer.css';

export const Footer: React.FC = () => {
  const { language, t } = useThemeLanguage();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="logo-container" onClick={() => scrollToSection('hero')}>
            <div className="logo-symbol">E</div>
            <span className="logo-text">EtherSpace</span>
          </div>
          <p className="footer-desc">{t('home.footerText')}</p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-column">
            <span className="footer-column-title">{language === 'en' ? 'Platform' : 'Nền tảng'}</span>
            <span className="footer-link" onClick={() => scrollToSection('hero')}>{language === 'en' ? 'SEARCH' : 'TÌM KIẾM'}</span>
            <span className="footer-link" onClick={() => scrollToSection('how-it-works')}>{t('home.navHowItWorks').toUpperCase()}</span>
          </div>

          <div className="footer-column">
            <span className="footer-column-title">{language === 'en' ? 'Security' : 'Bảo mật'}</span>
            <span className="footer-link">AI GUARD™</span>
            <span className="footer-link">ESCROW WALLET</span>
            <span className="footer-link">SMART CONTRACTS</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} EtherSpace. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>Network: EtherMainnet v1.0.4</span>
          <span>Latency: 12ms</span>
        </div>
      </div>
    </footer>
  );
};