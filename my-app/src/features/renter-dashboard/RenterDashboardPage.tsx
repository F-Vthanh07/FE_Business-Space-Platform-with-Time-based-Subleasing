import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { RenterSidebar } from './components/RenterSidebar';
import type { RenterPage, SubSlot } from './types';
import { RenterOverview } from './components/RenterOverview';
import { SlotCalendar } from './components/SlotCalendar';
import { SubleaseListings } from './components/SubleaseListings';
import { SubleaseSlotForm } from './components/SubleaseSlotForm';
import { RenterSubTenants } from './components/RenterSubTenants';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import './RenterDashboardPage.css';

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

export const RenterDashboardPage: React.FC = () => {
  const [activePage, setActivePage] = useState<RenterPage>('overview');
  const [isNewSlotFormOpen, setIsNewSlotFormOpen] = useState(false);
  const [slots, setSlots] = useState<SubSlot[]>(initialMockSlots);
  const { t } = useThemeLanguage();

  const handleCreateSlot = (newSlot: SubSlot) => {
    setSlots(prev => [...prev, newSlot]);
  };

  const handleUpdateSlot = (updatedSlot: SubSlot) => {
    setSlots(prev => prev.map(s => s.id === updatedSlot.id ? updatedSlot : s));
  };

  const handleNewSlotSubmit = (data: any) => {
    handleCreateSlot(data);
    setIsNewSlotFormOpen(false);
    setActivePage('calendar'); // Chuyển đến lịch để xem
  };

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return <RenterOverview />;
      case 'calendar':
        return (
          <div className="renter-page-wrap">
            <div className="page-header animate-in">
              <div>
                <h1 className="page-title">{t('renter.subleaseCalendarTitle')}</h1>
                <p className="page-subtitle text-secondary">
                  {t('renter.subleaseCalendarSubtitle')}
                </p>
              </div>
            </div>
            <SlotCalendar 
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
        userName="Trần Văn Thuê"
        userRole={t('sidebar.renterRoleBadge')}
        userInitials="TT"
      />
      <div className="app-body">
        <RenterSidebar 
          activePage={activePage} 
          onNavigate={setActivePage} 
          onNewSlotClick={() => setIsNewSlotFormOpen(true)}
        />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>

      {isNewSlotFormOpen && (
        <SubleaseSlotForm
          selectedDate={new Date(2025, 4, 26)} // Ngày mặc định demo
          defaultSpaceId="space-leloi"
          onClose={() => setIsNewSlotFormOpen(false)}
          onSubmit={handleNewSlotSubmit}
        />
      )}
    </div>
  );
};

