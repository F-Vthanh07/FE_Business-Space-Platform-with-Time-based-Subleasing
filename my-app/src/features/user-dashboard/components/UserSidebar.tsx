/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  Plus,
  Globe,
  LogOut,
  Sun,
  Moon,
  Wallet,
  Inbox // <-- THÊM ICON INBOX VÀO ĐÂY
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './UserSidebar.css';
import type { UserPage } from '../types';

interface UserSidebarProps {
  activePage: UserPage | string; // Nới lỏng type một chút để khỏi báo lỗi
  onNavigate: (page: UserPage | string) => void;
  onNewSpaceClick?: () => void;
  onNewSlotClick?: () => void;
  onLogout?: () => void;
}

interface NavItem {
  id: UserPage | string; // Nới lỏng type
  icon: React.ReactNode;
}

const dashboardNavItems: NavItem[] = [
  { id: 'overview', icon: <LayoutDashboard size={16} /> },
];

const spaceNavItems: NavItem[] = [
  { id: 'spaces', icon: <Building2 size={16} /> },
  { id: 'listings', icon: <FileText size={16} /> },
  { id: 'booking-requests', icon: <Inbox size={16} /> },
  { id: 'contracts', icon: <FileText size={16} /> },
  { id: 'tenants', icon: <Users size={16} /> },
];

const subleaseNavItems: NavItem[] = [
  { id: 'calendar', icon: <CalendarDays size={16} /> },
  { id: 'sublease-listings', icon: <FileText size={16} /> },
  { id: 'sub-tenants', icon: <Users size={16} /> },
];

const walletNavItems: NavItem[] = [
  { id: 'wallet', icon: <Wallet size={16} /> },
];

const commonNavItems: NavItem[] = [
  { id: 'analytics', icon: <BarChart3 size={16} /> },
  { id: 'settings', icon: <Settings size={16} /> },
];

const getPageLabels = (id: string, lang: string) => {
  const isEn = lang === 'en';
  switch (id) {
    case 'overview': return { title: isEn ? 'Dashboard' : 'Bảng điều khiển', sub: isEn ? 'System overview' : 'Tổng quan hệ thống' };
    case 'spaces': return { title: isEn ? 'My Spaces' : 'Quản lý Mặt bằng', sub: isEn ? 'Physical locations' : 'Tài sản vật lý' };
    case 'listings': return { title: isEn ? 'My Listings' : 'Quản lý Tin đăng', sub: isEn ? 'Public market ads' : 'Bài đăng cho thuê' };
    case 'booking-requests': return { title: isEn ? 'Booking Requests' : 'Yêu cầu chờ duyệt', sub: isEn ? 'Manage applications' : 'Duyệt đơn khách thuê' };
    case 'contracts': return { title: isEn ? 'My Contracts' : 'Hợp đồng của bạn', sub: isEn ? 'View & sign' : 'Xem & ký hợp đồng' };    
    case 'tenants': return { title: isEn ? 'Tenants' : 'Khách thuê', sub: isEn ? 'Manage contracts' : 'Quản lý hợp đồng' };
    case 'calendar': return { title: isEn ? 'Calendar' : 'Lịch cho thuê lại', sub: isEn ? 'Sublease slots' : 'Khung giờ cho thuê lại' };
    case 'sublease-listings': return { title: isEn ? 'Sublease Market' : 'Chợ cho thuê lại', sub: isEn ? 'Your sublease ads' : 'Tin cho thuê lại' };
    case 'sub-tenants': return { title: isEn ? 'Sub-tenants' : 'Khách thuê phụ', sub: isEn ? 'Secondary renters' : 'Người thuê lại' };
    case 'wallet': return { title: isEn ? 'Wallet' : 'Ví của tôi', sub: isEn ? 'Balance & transactions' : 'Số dư & giao dịch' };
    case 'analytics': return { title: isEn ? 'Analytics' : 'Doanh thu', sub: isEn ? 'Financial reports' : 'Báo cáo tài chính' };
    case 'profile': return { title: isEn ? 'Profile' : 'Hồ sơ cá nhân', sub: isEn ? 'Identity verification' : 'Xác thực định danh' };
    case 'settings': return { title: isEn ? 'Settings' : 'Cài đặt', sub: isEn ? 'Account prefs' : 'Hệ thống' };
    default: return { title: id, sub: '' };
  }
};

export const UserSidebar: React.FC<UserSidebarProps> = ({ activePage, onNavigate, onNewSpaceClick, onNewSlotClick, onLogout }) => {
  const { t, language, setLanguage, theme, toggleTheme } = useThemeLanguage();

  // SỐ ĐƠN "YÊU CẦU CHỜ DUYỆT" CHƯA XEM (BADGE ĐỎ)
  const [pendingBookingCount, setPendingBookingCount] = useState(0);

  const getSeenBookingIds = (): Set<string | number> => {
    try {
      const raw = localStorage.getItem('seen_booking_request_ids');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  };

  const checkPendingBookingRequests = async () => {
    const token = localStorage.getItem('portal_token');
    const role = localStorage.getItem('portal_role');
    const currentUserId = localStorage.getItem('current_user_id');
    if (role !== 'user' || !token || !currentUserId) return;

    try {
      const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/PrimaryBookingRequest/GetAll?status=Pending', {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });
      if (!res.ok) return;
      const data = await res.json();
      const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
      const myRequests = safeData.filter((req: any) => req.lessorId === currentUserId);

      const seenIds = getSeenBookingIds();
      const unseen = myRequests.filter((r: any) => !seenIds.has(r.id ?? r.Id));
      setPendingBookingCount(unseen.length);
    } catch (err) {
      console.error('Lỗi kiểm tra booking request:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkPendingBookingRequests();
    const interval = setInterval(checkPendingBookingRequests, 15000);

    // Khi trang "Yêu cầu chờ duyệt" báo đã xem xong (hoặc Header check xong) -> cập nhật badge ngay
    const handleSeen = () => checkPendingBookingRequests();
    window.addEventListener('booking-request-seen', handleSeen);

    return () => {
      clearInterval(interval);
      window.removeEventListener('booking-request-seen', handleSeen);
    };
  }, []);

  const renderNavGroup = (items: NavItem[]) =>
    items.map((item) => {
      const isActive = activePage === item.id || activePage.startsWith(`${item.id}-`);
      const labels = getPageLabels(item.id as string, language);
      const showBadge = item.id === 'booking-requests' && pendingBookingCount > 0;
      return (
        <button
          key={item.id}
          className={`user-sidebar-item ${isActive ? 'user-sidebar-item--active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="user-sidebar-icon" style={{ position: 'relative' }}>
            {item.icon}
            {showBadge && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-8px',
                backgroundColor: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '999px',
                padding: '0 5px',
                minWidth: '16px',
                height: '16px',
                lineHeight: '16px',
                textAlign: 'center',
                border: '1.5px solid var(--bg-primary, #fff)'
              }}>
                {pendingBookingCount > 9 ? '9+' : pendingBookingCount}
              </span>
            )}
          </span>
          <div className="user-sidebar-text">
            <span className="user-sidebar-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {labels.title}
            </span>
            <span className="user-sidebar-sublabel">{labels.sub}</span>
          </div>
        </button>
      );
    });

  return (
    <aside className="user-sidebar glass-card">
      <div className="user-sidebar-header">
        <h2 className="user-sidebar-title">Ether UI</h2>
        <p className="user-sidebar-subtitle">System Console</p>
      </div>

      <nav className="user-sidebar-nav">
        {renderNavGroup(dashboardNavItems)}
        {renderNavGroup(walletNavItems)}

        <span className="user-sidebar-group-label">
          {language === 'en' ? 'MY SPACES' : 'MẶT BẰNG CỦA TÔI'}
        </span>
        {renderNavGroup(spaceNavItems)}

        <span className="user-sidebar-group-label">
          {language === 'en' ? 'SUBLEASING' : 'CHO THUÊ LẠI'}
        </span>
        {renderNavGroup(subleaseNavItems)}

        <div className="user-sidebar-divider" />
        {renderNavGroup(commonNavItems)}
      </nav>

      <div className="user-sidebar-footer">
        <div className="user-sidebar-divider" />
        <button className="btn-primary user-sidebar-cta" onClick={onNewSpaceClick || (() => onNavigate('spaces'))}>
          <Plus size={16} />
          {language === 'en' ? 'NEW SPACE' : 'THÊM MẶT BẰNG'}
        </button>
        <button className="user-sidebar-cta-secondary" onClick={onNewSlotClick || (() => onNavigate('sublease-listings'))}>
          <Plus size={14} />
          {language === 'en' ? 'NEW SLOT' : 'THÊM KHUNG GIỜ'}
        </button>

        <div className="user-sidebar-footer-actions">
          <button
            className="user-sidebar-action-btn"
            title={t('sidebar.languageNetwork')}
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          >
            <Globe size={16} />
          </button>
          <div className="user-sidebar-footer-divider" />
          <button
            className="user-sidebar-action-btn"
            title={theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="user-sidebar-footer-divider" />
          <button
            className="user-sidebar-action-btn"
            title={t('sidebar.logout')}
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                const keepKeys = ['app-language', 'app-theme'];
                const saved: Record<string, string> = {};
                keepKeys.forEach((k) => { const v = localStorage.getItem(k); if (v !== null) saved[k] = v; });
                localStorage.clear();
                Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
                window.location.reload();
              }
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};