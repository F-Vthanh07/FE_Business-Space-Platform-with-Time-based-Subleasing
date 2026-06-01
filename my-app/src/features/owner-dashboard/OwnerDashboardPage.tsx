import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Header } from '../../components/Header';
import { OwnerSidebar } from './components/OwnerSidebar';
import { OwnerOverview } from './components/OwnerOverview';
import { OwnerListings } from './components/OwnerListings';
import { OwnerTenants } from './components/OwnerTenants';
import { OwnerSpaces } from './components/OwnerSpaces';
import { SpaceForm } from './components/SpaceForm';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import './OwnerDashboardPage.css';

type OwnerPage = 'overview' | 'spaces' | 'listings' | 'tenants' | 'analytics' | 'settings';

interface OwnerDashboardPageProps {
  onLogout: () => void;
}

export const OwnerDashboardPage: React.FC<OwnerDashboardPageProps> = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNewSpaceFormOpen, setIsNewSpaceFormOpen] = useState(false);
  const { t } = useThemeLanguage();

  // Extract activePage from the router pathname, e.g. /owner/spaces -> spaces
  const pathParts = location.pathname.split('/');
  const activePage = (pathParts[2] || 'overview') as OwnerPage;

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 0.8 } });

    tl.fromTo(
      '.dashboard-header',
      { y: -72, opacity: 0 },
      { y: 0, opacity: 1 }
    );
    tl.fromTo(
      '.owner-sidebar',
      { x: -250, opacity: 0 },
      { x: 0, opacity: 1 },
      '-=0.6'
    );
    tl.fromTo(
      '.main-content',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1 },
      '-=0.6'
    );
  }, []);

  const handleNewSpaceSubmit = (data: any) => {
    console.log('Registered new space:', data);
    setIsNewSpaceFormOpen(false);
    navigate('/owner/spaces');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'overview': return <OwnerOverview />;
      case 'listings': return <OwnerListings />;
      case 'tenants': return <OwnerTenants />;
      case 'spaces': return <OwnerSpaces />;
      default:
        return (
          <div className="coming-soon">
            <p className="label-caps">{t('common.comingSoon')}</p>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>{t('common.featureUnderDev')}</h2>
            <p className="text-secondary" style={{ marginTop: 8 }}>{t('common.featureUnderDevDesc')}</p>
          </div>
        );
    }
  };

  return (
    <div className="app-shell">
      <Header
        userName="Nguyễn Văn Chủ"
        userRole={t('app.ownerTitle')}
        userInitials="NC"
      />
      <div className="app-body">
        <OwnerSidebar
          activePage={activePage}
          onNavigate={(page) => navigate(`/owner/${page}`)}
          onNewSpaceClick={() => setIsNewSpaceFormOpen(true)}
          onLogout={onLogout}
        />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>

      {isNewSpaceFormOpen && (
        <SpaceForm
          onClose={() => setIsNewSpaceFormOpen(false)}
          onSubmit={handleNewSpaceSubmit}
        />
      )}
    </div>
  );
};
