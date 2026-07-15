/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Globe, LogOut, LayoutDashboard, User, Building2, FileText, IdCard } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { ROUTES } from '../routes/routes';
import './Header.css';
import { Shuffle } from '../components/Shuffle';

interface HeaderProps {
  userInitials?: string;
  userName?: string;
  userRole?: string;
}

export const Header: React.FC<HeaderProps> = ({ userInitials, userName, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useThemeLanguage();

  const getActiveTab = (pathname: string): 'home' | 'spaces' | 'feed' | null => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/user/spaces')) return 'spaces';
    if (pathname === '/feed') return 'feed';
    return null;
  };
  const activeTab = getActiveTab(location.pathname);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotif, setShowNotif] = useState(false); // Quản lý đóng mở bảng thông báo
  const [notifications, setNotifications] = useState<any[]>([]); // Lưu trữ lịch sử thông báo

  const token = localStorage.getItem('portal_token');
  const role = localStorage.getItem('portal_role');
  const isLoggedIn = !!token;

  const handlePostListing = () => {
    if (isLoggedIn) navigate('/user/listings');
    else navigate('/login');
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Click ra ngoài thì đóng cả 2 popup (Avatar và Notif)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // LẮNG NGHE SỰ KIỆN TỪ FLOATING CHAT BẮN LÊN
  useEffect(() => {
    const handleNewNotif = (e: Event) => {
      const customEvent = e as CustomEvent;
      // Thêm thông báo mới lên trên đầu mảng
      setNotifications(prev => [customEvent.detail, ...prev]);
    };
    window.addEventListener('new-notification', handleNewNotif);
    return () => window.removeEventListener('new-notification', handleNewNotif);
  }, []);

  const handleLogout = () => {
    const keepKeys = ['app-language', 'app-theme'];
    const saved: Record<string, string> = {};
    keepKeys.forEach((k) => { const v = localStorage.getItem(k); if (v !== null) saved[k] = v; });
    localStorage.clear();
    Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
    setShowDropdown(false);
    navigate('/');
    window.location.reload();
  };

  const handleDashboardClick = () => {
    setShowDropdown(false);
    if (role === 'user') navigate(ROUTES.USER);
    else if (role === 'admin') navigate(ROUTES.ADMIN);
    else navigate(ROUTES.LOGIN);
  };

  // KHI BẤM VÀO MỘT THÔNG BÁO -> MỞ FLOATING CHAT CỦA NGƯỜI ĐÓ
  const handleNotifClick = (notif: any) => {
    setShowNotif(false);
    const event = new CustomEvent('open-ether-chat', {
      detail: { 
        conversationId: notif.conversationId, 
        name: notif.senderName || 'Người dùng' 
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <header className="dashboard-header">
      {/* 1. LOGO */}
      <div 
        className="header-logo-text" 
        onClick={() => window.location.href = 'http://localhost:5173/'}
        style={{ display: 'flex', alignItems: 'center', fontFamily: "'Press Start 2P', cursive", fontSize: '24px', cursor: 'pointer' }}
      >
        <span>Ether</span><Shuffle text="Space" />
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="header-center">
        <nav className="header-nav">
          <button className={`header-nav-item ${activeTab === 'home' ? 'header-nav-item--active' : ''}`} onClick={() => navigate('/')}>
            {language === 'en' ? 'HOME' : 'TRANG CHỦ'}
          </button>
          <button className={`header-nav-item ${activeTab === 'spaces' ? 'header-nav-item--active' : ''}`} onClick={() => navigate(isLoggedIn ? '/user/spaces' : '/login')}>
            {language === 'en' ? 'MANAGE SPACES' : 'QUẢN LÝ MẶT BẰNG'}
          </button>
          <button className={`header-nav-item ${activeTab === 'feed' ? 'header-nav-item--active' : ''}`} onClick={() => navigate('/feed')}>
            {language === 'en' ? 'DISCOVER' : 'KHÁM PHÁ'}
          </button>
        </nav>
      </div>

      {/* 3. RIGHT CONTROLS */}
      <div className="header-right">
        <button className="btn-post-listing" onClick={handlePostListing}>
          {language === 'en' ? 'Post Listing' : 'Đăng tin'} <span className="arrow-icon">→</span>
        </button>
        
        <button className="header-icon-btn" onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')} style={{ width: 'auto', padding: '0 8px', display: 'flex', gap: 4, alignItems: 'center' }}>
          <Globe size={14} /> <span style={{ fontSize: 10, fontWeight: 700 }}>{language.toUpperCase()}</span>
        </button>

        {isLoggedIn ? (
          <>
            {/* ====== KHU VỰC CHUÔNG THÔNG BÁO ====== */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="header-icon-btn" title="Notifications" onClick={() => setShowNotif(!showNotif)}>
                <Bell size={15} />
                {notifications.length > 0 && (
                  <span className="notif-dot" style={{ position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '1px solid #fff' }} />
                )}
              </button>

              {/* BOX XỔ XUỐNG KHI BẤM CHUÔNG */}
              {showNotif && (
                <div className="header-dropdown-menu animate-in" style={{ width: '320px', right: '-40px', padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', backgroundColor: '#FAFAFA' }}>
                    {language === 'en' ? 'Notifications' : 'Thông báo mới'}
                  </div>
                  
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '30px 20px', textAlign: 'center', fontSize: '13px', color: '#999' }}>
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleNotifClick(notif)} 
                          style={{ padding: '12px 16px', borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', flexDirection: 'column', gap: '4px' }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F4F6F8'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ fontSize: '13.5px', color: '#2C2C2C', lineHeight: '1.4' }}>
                            <strong>{notif.senderName}</strong> vừa nhắn tin cho bạn:
                          </div>
                          <div style={{ fontSize: '13px', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            "{notif.message}"
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>{notif.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* ====== KHU VỰC AVATAR USER ====== */}
            <div className="avatar-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
              <div className="header-avatar" onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                {userInitials || 'NC'}
              </div>
              
              {showDropdown && (
                <div className="header-dropdown-menu animate-in">
                  <div className="header-dropdown-info">
                    <p className="header-dropdown-name">{userName || (language === 'en' ? 'System User' : 'Người dùng hệ thống')}</p>
                    <p className="header-dropdown-role">{userRole || (role === 'admin' ? 'Admin' : 'User')}</p>
                  </div>

                  <button className="header-dropdown-item" onClick={handleDashboardClick}>
                    <LayoutDashboard size={14} /> <span>{language === 'en' ? 'Dashboard' : 'Bảng điều khiển'}</span>
                  </button>

                  {role === 'user' && (
                    <>
                      <button className="header-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/user/spaces'); }}>
                        <Building2 size={14} /> <span>{language === 'en' ? 'Manage Spaces' : 'Quản lý Mặt bằng'}</span>
                      </button>
                      <button className="header-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/user/listings'); }}>
                        <FileText size={14} /> <span>{language === 'en' ? 'Manage Listings' : 'Quản lý Tin đăng'}</span>
                      </button>
                    </>
                  )}

                  <button className="header-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/user/profile'); }}>
                    <IdCard size={14} /> <span>{language === 'en' ? 'Profile' : 'Hồ sơ cá nhân'}</span>
                  </button>

                  <button className="header-dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={14} /> <span>{language === 'en' ? 'Log out' : 'Đăng xuất'}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '8px 20px', fontSize: '12px', marginLeft: '8px' }}>
            <User size={14} style={{ marginRight: '6px' }} /> {language === 'en' ? 'Sign In' : 'Đăng nhập'}
          </button>
        )}
      </div>
    </header>
  );
};