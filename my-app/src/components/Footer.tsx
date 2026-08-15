import React from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { MessageCircle } from 'lucide-react';
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
          <p className="footer-desc">
            Nền tảng chia sẻ mặt bằng kinh doanh theo<br />
            khung giờ. Thiết kế theo phong cách trực quan.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-column">
            <span className="footer-column-title">{language === 'en' ? 'Platform' : 'Nền tảng'}</span>
            <span className="footer-link" onClick={() => scrollToSection('hero')}>{language === 'en' ? 'SEARCH' : 'TÌM KIẾM'}</span>
            <span className="footer-link" onClick={() => scrollToSection('how-it-works')}>{t('home.navHowItWorks').toUpperCase()}</span>
          </div>

          <div className="footer-column">
            <span className="footer-column-title">{language === 'en' ? 'Connect' : 'Kết nối'}</span>
            <div className="footer-social-links" style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <a 
                href="https://www.facebook.com/people/Ether-Space/61593191978993/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Facebook"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
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
      
      <button className="floating-chat-btn" aria-label="Chat Support">
        <MessageCircle size={24} />
      </button>
    </footer>
  );
};