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
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // STATE CHO TOAST THÔNG BÁO NỔI
  const [toastNotif, setToastNotif] = useState<{ show: boolean, title: string, message: string } | null>(null);

  const token = localStorage.getItem('portal_token');
  const role = localStorage.getItem('portal_role');
  
  // LẤY TÊN TỪ LOCAL STORAGE RA ĐỂ HIỂN THỊ
  const storedName = localStorage.getItem('current_user_name') || userName || 'Khách';
  const displayInitials = userInitials || storedName.substring(0, 2).toUpperCase();
  const isLoggedIn = !!token;

  const handlePostListing = () => {
    if (isLoggedIn) navigate('/user/listings');
    else navigate('/login');
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // LẮNG NGHE SỰ KIỆN TỪ FLOATING CHAT BẮN LÊN ĐỂ MỞ TOAST
  useEffect(() => {
    const handleNewNotif = (e: Event) => {
      const customEvent = e as CustomEvent;
      const notifData = customEvent.detail;
      
      setNotifications(prev => [notifData, ...prev]);

      setToastNotif({
        show: true,
        title: notifData.senderName || 'Người dùng',
        message: notifData.message
      });

      // Tự động tắt sau 4 giây
      setTimeout(() => {
        setToastNotif(null);
      }, 4000);
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
    <>
      <header className="dashboard-header">
        {/* LOGO */}
        <div 
          className="header-logo-text" 
          onClick={() => window.location.href = 'http://localhost:5173/'}
          style={{ display: 'flex', alignItems: 'center', fontFamily: "'Press Start 2P', cursive", fontSize: '24px', cursor: 'pointer' }}
        >
          <span>Ether</span><Shuffle text="Space" />
        </div>

        {/* NAVIGATION TABS */}
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

        {/* RIGHT CONTROLS */}
        <div className="header-right">
          <button className="btn-post-listing" onClick={handlePostListing}>
            {language === 'en' ? 'Post Listing' : 'Đăng tin'} <span className="arrow-icon">→</span>
          </button>
          
          <button className="header-icon-btn" onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')} style={{ width: 'auto', padding: '0 8px', display: 'flex', gap: 4, alignItems: 'center' }}>
            <Globe size={14} /> <span style={{ fontSize: 10, fontWeight: 700 }}>{language.toUpperCase()}</span>
          </button>

          {isLoggedIn ? (
            <>
              {/* KHU VỰC CHUÔNG THÔNG BÁO */}
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
                    <div style={{ padding: '12px 16px', fontWeight: 'bold', borderBottom: '1px solid #E0E0E0', backgroundColor: '#FAFAFA', color: '#333' }}>
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
                            <div style={{ fontSize: '11px', color: '#999' }}>{notif.time || 'Vừa xong'}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* KHU VỰC AVATAR USER */}
              <div className="avatar-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
                <div className="header-avatar" onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  {displayInitials}
                </div>
                
                {showDropdown && (
                  <div className="header-dropdown-menu animate-in">
                    <div className="header-dropdown-info">
                      <p className="header-dropdown-name" style={{ color: '#F8FAFC' }}>{storedName}</p>
                      <p className="header-dropdown-role" style={{ color: '#94A3B8' }}>{userRole || (role === 'admin' ? 'Admin' : 'User')}</p>
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

      {/* TOAST NOTIFICATION (NẰM Ở LỚP CAO NHẤT) */}
      {toastNotif && toastNotif.show && (
        <div 
          className="toast-notification animate-in" 
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: '#1E293B',
            color: '#fff',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            borderLeft: '4px solid #16A34A',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minWidth: '250px',
            maxWidth: '350px',
            animation: 'slideInRight 0.3s ease-out forwards',
            cursor: 'pointer'
          }}
          onClick={() => setToastNotif(null)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <strong style={{ fontSize: '14px', color: '#4ADE80' }}>Tin nhắn từ {toastNotif.title}</strong>
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {toastNotif.message}
          </div>
        </div>
      )}
      
      {/* KEYFRAME ANIMATION CHO TOAST */}
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </>
  );
};