import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Header } from '../../components/Header';
import { UserSidebar } from './components/layout/UserSidebar';
import { ProfileSidebar } from './components/profile/ProfileSidebar';
import { OwnerOverview } from './components/profile/OwnerOverview';
import { OwnerTenants } from './components/tenant/OwnerTenants';
import { OwnerSpaces } from './components/Space/OwnerSpaces';
import { SpaceForm } from './components/Space/SpaceForm';
import { SlotCalendar } from './components/SlotCalendar';
import { SubleaseListings } from './components/Listing/SubleaseListings';
import { SubleaseSlotForm } from './components/Space/SubleaseSlotForm';
import { RenterSubTenants } from './components/tenant/RenterSubTenants';
import { ProfileOverviewPage } from './components/profile/ProfileOverviewPage';
import { ChangePasswordPage } from './components/profile/ChangePasswordPage';
import { ForgotPasswordPage } from './components/profile/ForgotPasswordPage';
import { OwnerBookingRequests } from './components/booking/OwnerBookingRequests';
import { WalletOverview, WalletDeposit, WalletHistory } from '../wallet';
import { VerificationWarningBanner, useIdentityVerification } from '../identity-verification';
import type { UserPage, SubSlot } from './types';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import './UserDashboardPage.css';
import MyContractsPage from './components/contract/Mycontractspage';
import { UploadedContractsPage } from './components/contract/UploadedContractsPage';
import { RenterBookingRequests } from './components/booking/RenterBookingRequests';
import { SharedSpaceManagement } from './components/Space/SharedSpaceManagement';
import { OwnerListings } from './components/Listing/OwnerListings';
import { PricingPlansPage } from './components/Pricing/PricingPlansPage';

const initialMockSlots: SubSlot[] = [
  { id: 's1', date: '2025-05-26', startTime: '08:00', endTime: '12:00', tenantName: 'Trần Văn B', tenantInitials: 'TB', status: 'booked', price: '500.000₫', spaceId: 'space-leloi' },
  { id: 's2', date: '2025-05-26', startTime: '13:00', endTime: '17:00', tenantName: 'Nguyễn Thị C', tenantInitials: 'NC', status: 'booked', price: '500.000₫', spaceId: 'space-leloi' },
  { id: 's3', date: '2025-05-27', startTime: '08:00', endTime: '20:00', tenantName: 'Lê Thị D', tenantInitials: 'LD', status: 'booked', price: '1.200.000₫', spaceId: 'space-leloi' },
  { id: 's4', date: '2025-05-28', startTime: '09:00', endTime: '12:00', tenantName: '', tenantInitials: '', status: 'available', price: '400.000₫', spaceId: 'space-leloi' },
  { id: 's5', date: '2025-05-29', startTime: '08:00', endTime: '12:00', tenantName: 'Phạm Văn E', tenantInitials: 'PE', status: 'pending', price: '500.000₫', spaceId: 'space-phandinhphung' },
  { id: 's6', date: '2025-05-29', startTime: '14:00', endTime: '18:00', tenantName: 'Hoàng Thị F', tenantInitials: 'HF', status: 'booked', price: '450.000₫', spaceId: 'space-phandinhphung' },
  { id: 's7', date: '2025-05-30', startTime: '08:00', endTime: '12:00', tenantName: '', tenantInitials: '', status: 'available', price: '500.000₫', spaceId: 'space-phandinhphung' },
  { id: 's8', date: '2025-05-30', startTime: '12:00', endTime: '14:00', tenantName: '', tenantInitials: '', status: 'conflict', price: '250.000₫', spaceId: 'space-quangtrung' },
  { id: 's9', date: '2025-06-02', startTime: '08:00', endTime: '17:00', tenantName: 'Vũ Minh G', tenantInitials: 'VG', status: 'booked', price: '900.000₫', spaceId: 'space-leloi' },
  { id: 's10', date: '2025-06-03', startTime: '10:00', endTime: '14:00', tenantName: '', tenantInitials: '', status: 'available', price: '400.000₫', spaceId: 'space-phandinhphung' },
  { id: 's11', date: '2025-06-04', startTime: '09:00', endTime: '12:00', tenantName: 'Đỗ Thị H', tenantInitials: 'DH', status: 'pending', price: '380.000₫', spaceId: 'space-phandinhphung' },
  { id: 's12', date: '2025-06-05', startTime: '08:00', endTime: '20:00', tenantName: 'Bùi Văn I', tenantInitials: 'BI', status: 'booked', price: '1.100.000₫', spaceId: 'space-quangtrung' },
];

interface UserDashboardPageProps {
  onLogout: () => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNewSpaceFormOpen, setIsNewSpaceFormOpen] = useState(false);
  const [isNewSlotFormOpen, setIsNewSlotFormOpen] = useState(false);
  // Tab lịch: 'lessor' = mặt bằng mình cho người khác thuê | 'lessee' = mặt bằng mình đi thuê của người khác
  const [calendarTab, setCalendarTab] = useState<'lessor' | 'lessee'>('lessor');
  const [slots, setSlots] = useState<SubSlot[]>(initialMockSlots);
  const { isVerified } = useIdentityVerification();
  const { t } = useThemeLanguage();

  // Extract activePage from the router pathname, e.g. /user/spaces -> spaces
  const pathParts = location.pathname.split('/');
  const activePage = (pathParts[2] || 'overview') as UserPage;

  // Profile, Change Password and Forgot Password share a dedicated
  // account-settings sidebar instead of the main space-management one.
  // Wallet lives in the main sidebar, so it is excluded here.
  const isProfileSection =
    activePage === 'profile' ||
    activePage === 'change-password' ||
    activePage === 'forgot-password';

  useEffect(() => {
    const userId = localStorage.getItem('current_user_id');
    const token = localStorage.getItem('portal_token');
    if (userId && token) {
      import('../auth/api/auth.api').then(({ fetchUserProfile }) => {
        fetchUserProfile(userId, token).catch((err) =>
          console.error('Lỗi tự động đồng bộ thông tin user:', err)
        );
      });
    }

    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 0.8 } });

    tl.fromTo(
      '.dashboard-header',
      { y: -72, opacity: 0 },
      { y: 0, opacity: 1 }
    );
    tl.fromTo(
      '.user-sidebar',
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

  const handleNewSpaceSubmit = () => {
    setIsNewSpaceFormOpen(false);
    navigate('/user/spaces');
  };

  const handleCreateSlot = (newSlot: SubSlot) => {
    setSlots(prev => [...prev, newSlot]);
  };

  const handleUpdateSlot = (updatedSlot: SubSlot) => {
    setSlots(prev => prev.map(s => s.id === updatedSlot.id ? updatedSlot : s));
  };

  const handleNewSlotSubmit = (data: SubSlot) => {
    handleCreateSlot(data);
    setIsNewSlotFormOpen(false);
    navigate('/user/calendar');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'overview': return <OwnerOverview onNavigate={(page) => navigate(`/user/${page}`)} />;
      case 'spaces': return <OwnerSpaces />;
      case 'shared-spaces': return <SharedSpaceManagement />;
      case 'listings': return <OwnerListings />;
      case 'tenants': return <OwnerTenants />;
      case 'booking-requests': return <OwnerBookingRequests />;
      case 'my-booking-requests': return <RenterBookingRequests />;
      case 'contracts': return <MyContractsPage />;
      case 'external-contracts': return <UploadedContractsPage />;
      case 'calendar':

        return (
          <div className="renter-page-wrap">
            <div className="page-header animate-in">
              <div>
                <h1 className="page-title">
                  {calendarTab === 'lessor'
                    ? t('renter.subleaseCalendarTitle')
                    : t('renter.rentedCalendarTitle')}
                </h1>
                <p className="page-subtitle text-secondary">
                  {calendarTab === 'lessor'
                    ? t('renter.subleaseCalendarSubtitle')
                    : t('renter.rentedCalendarSubtitle')}
                </p>
              </div>
            </div>

            {/* Chuyển tab: lịch mình cho thuê  |  lịch mình đi thuê */}
            <div className="calendar-tab-switch" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={calendarTab === 'lessor'}
                className={`calendar-tab-switch__btn ${calendarTab === 'lessor' ? 'calendar-tab-switch__btn--active' : ''}`}
                onClick={() => setCalendarTab('lessor')}
              >
                {t('renter.calendarTabLessor')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={calendarTab === 'lessee'}
                className={`calendar-tab-switch__btn ${calendarTab === 'lessee' ? 'calendar-tab-switch__btn--active' : ''}`}
                onClick={() => setCalendarTab('lessee')}
              >
                {t('renter.calendarTabLessee')}
              </button>
            </div>

            <SlotCalendar
              key={calendarTab}
              mode={calendarTab}
              slots={slots}
              onUpdateSlot={handleUpdateSlot}
              onCreateSlot={handleCreateSlot}
            />
          </div>
        );
      case 'sublease-listings':
        return <SubleaseListings />;
      case 'sub-tenants':
        return (
          <RenterSubTenants
            slots={slots}
            onUpdateSlot={handleUpdateSlot}
          />
        );
      case 'profile':
        return <ProfileOverviewPage />;
      case 'wallet':
        return <WalletOverview onNavigate={(page) => navigate(`/user/${page}`)} />;
      case 'wallet-deposit':
        return <WalletDeposit onNavigate={(page) => navigate(`/user/${page}`)} />;
      case 'wallet-history':
        return <WalletHistory onNavigate={(page) => navigate(`/user/${page}`)} />;
      case 'pricing-plans':
        return <PricingPlansPage />;
      case 'change-password':
        return <ChangePasswordPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;
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
      {/*
        ĐÃ XÓA userName VÀ userInitials FIX CỨNG Ở ĐÂY.
        Giờ Header sẽ tự móc tên từ LocalStorage lên hiển thị.
      */}
      <Header />
      {!isVerified && activePage !== 'profile' && (
        <VerificationWarningBanner onVerifyClick={() => navigate('/user/profile')} />
      )}
      <div className="app-body">
        {isProfileSection ? (
          <ProfileSidebar
            activePage={activePage}
            onNavigate={(page) => navigate(page === 'overview' ? '/user' : `/user/${page}`)}
            onLogout={onLogout}
          />
        ) : (
          <UserSidebar
            activePage={activePage}
            onNavigate={(page) => navigate(`/user/${page}`)}
            onNewSlotClick={() => setIsNewSlotFormOpen(true)}
            onLogout={onLogout}
          />
        )}
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

      {isNewSlotFormOpen && (
        <SubleaseSlotForm
          selectedDate={new Date()}
          defaultSpaceId="space-leloi"
          onClose={() => setIsNewSlotFormOpen(false)}
          onSubmit={handleNewSlotSubmit}
        />
      )}
    </div>
  );
};
