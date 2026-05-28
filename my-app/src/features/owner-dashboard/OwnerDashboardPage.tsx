import React, { useState } from 'react';
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

export const OwnerDashboardPage: React.FC = () => {
  const [activePage, setActivePage] = useState<OwnerPage>('overview');
  const [isNewSpaceFormOpen, setIsNewSpaceFormOpen] = useState(false);
  const { t } = useThemeLanguage();

  const handleNewSpaceSubmit = (data: any) => {
    console.log('Registered new space:', data);
    setIsNewSpaceFormOpen(false);
    setActivePage('spaces'); // Chuyển sang tab mặt bằng để xem
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
          onNavigate={setActivePage}
          onNewSpaceClick={() => setIsNewSpaceFormOpen(true)}
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
