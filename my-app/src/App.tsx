import React, { useState } from 'react';
import { MeshBackground } from './components/MeshBackground';
import { OwnerDashboardPage } from './features/owner-dashboard/OwnerDashboardPage';
import { RenterDashboardPage } from './features/renter-dashboard/RenterDashboardPage';
import { useThemeLanguage } from './context/ThemeLanguageContext';
import { Globe, Sun, Moon } from 'lucide-react';
import './App.css';

type DemoRole = 'owner' | 'renter';

const App: React.FC = () => {
  const [role, setRole] = useState<DemoRole | null>(null);
  const { language, setLanguage, theme, toggleTheme, t } = useThemeLanguage();

  if (!role) {
    return (
      <MeshBackground>
        <div className="role-selector">
          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 10 }}>
            <button 
              className="btn-icon" 
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')} 
              title={language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}
              style={{ width: 'auto', padding: '0 12px', gap: 6, display: 'flex', alignItems: 'center' }}
            >
              <Globe size={14} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>{language === 'en' ? 'VI' : 'EN'}</span>
            </button>
            <button 
              className="btn-icon" 
              onClick={toggleTheme} 
              title={theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          <div className="role-selector-inner">
            <div className="role-logo">
              <div className="logo-icon-lg">E</div>
              <h1 className="role-app-name">EtherSpace</h1>
            </div>
            <p className="role-tagline text-secondary">{t('app.tagline')}</p>
            <p className="role-subtitle">{t('app.selectRole')}</p>
            <div className="role-cards">
              <button className="glass-card role-card" id="role-owner" onClick={() => setRole('owner')}>
                <div className="role-card-icon">🏢</div>
                <h2 className="role-card-title">{t('app.ownerTitle')}</h2>
                <p className="text-secondary role-card-desc">
                  {t('app.ownerDesc')}
                </p>
                <div className="role-card-features">
                  <span className="badge badge--neutral">{t('app.ownerBadge1')}</span>
                  <span className="badge badge--neutral">{t('app.ownerBadge2')}</span>
                  <span className="badge badge--neutral">{t('app.ownerBadge3')}</span>
                </div>
                <div className="btn-primary role-card-btn">{t('app.ownerBtn')}</div>
              </button>

              <button className="glass-card role-card" id="role-renter" onClick={() => setRole('renter')}>
                <div className="role-card-icon">🔄</div>
                <h2 className="role-card-title">{t('app.renterTitle')}</h2>
                <p className="text-secondary role-card-desc">
                  {t('app.renterDesc')}
                </p>
                <div className="role-card-features">
                  <span className="badge badge--neutral">{t('app.renterBadge1')}</span>
                  <span className="badge badge--neutral">{t('app.renterBadge2')}</span>
                  <span className="badge badge--neutral">{t('app.renterBadge3')}</span>
                </div>
                <div className="btn-primary role-card-btn" style={{ background: 'linear-gradient(135deg, #4A72FF, #2EEA82)' }}>
                  {t('app.renterBtn')}
                </div>
              </button>
            </div>
            <p className="role-note text-secondary">
              {t('app.demoNote')}
            </p>
          </div>
        </div>
      </MeshBackground>
    );
  }

  return (
    <MeshBackground>
      {role === 'owner' ? <OwnerDashboardPage /> : <RenterDashboardPage />}
    </MeshBackground>
  );
};

export default App;
