/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, FileText, Globe, LogOut, User, CheckCircle2 } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useIdentityVerification } from '../features/identity-verification';
import { clearLocalStorageForLogout } from '../utils/preserveLocalStorage';
import './Header.css';
import { Shuffle } from '../components/Shuffle';

interface HeaderProps {
  userInitials?: string;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({ userInitials, userName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useThemeLanguage();
  const { isVerified } = useIdentityVerification();

  const getActiveTab = (pathname: string): 'home' | 'spaces' | 'feed' | 'ai' | null => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/user/spaces')) return 'spaces';
    if (pathname === '/feed') return 'feed';
    if (pathname === '/ai-image-editor') return 'ai';
    return null;
  };
  const activeTab = getActiveTab(location.pathname);

  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Số đơn "Yêu cầu chờ duyệt" chưa xem.
  const [pendingBookingCount, setPendingBookingCount] = useState(0);

  // State cho toast thông báo nổi.
  const [toastNotif, setToastNotif] = useState<{ show: boolean, title: string, message: string } | null>(null);

  const token = localStorage.getItem('portal_token');
  const role = localStorage.getItem('portal_role');
  const currentUserId = localStorage.getItem('current_user_id');
  
  // Lấy tên từ localStorage để hiển thị.
  const storedName = localStorage.getItem('current_user_name') || userName || 'Khách';
  const displayInitials = userInitials || storedName.substring(0, 2).toUpperCase();
  const isLoggedIn = !!token;

  const handlePostListing = () => {
    if (isLoggedIn) navigate('/user/listings');
    else navigate('/login');
  };

  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lắng nghe sự kiện từ floating chat để mở toast.
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

      // Tự động tắt sau 4 giây.
      setTimeout(() => {
        setToastNotif(null);
      }, 4000);
    };
    
    window.addEventListener('new-notification', handleNewNotif);
    return () => window.removeEventListener('new-notification', handleNewNotif);
  }, []);

  // Lấy set các ID đơn đã xem từ localStorage.
  const getSeenBookingIds = (): Set<string | number> => {
    try {
      const raw = localStorage.getItem('seen_booking_request_ids');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  };

  // Kiểm tra số đơn chờ duyệt chưa xem để hiện badge đỏ.
  const checkPendingBookingRequests = async () => {
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
    if (!isLoggedIn || role !== 'user') return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkPendingBookingRequests();
    const interval = setInterval(checkPendingBookingRequests, 15000);

    // Khi trang yêu cầu chờ duyệt báo đã xem xong thì cập nhật badge ngay.
    const handleSeen = () => checkPendingBookingRequests();
    window.addEventListener('booking-request-seen', handleSeen);

    return () => {
      clearInterval(interval);
      window.removeEventListener('booking-request-seen', handleSeen);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleLogout = () => {
    clearLocalStorageForLogout();
    navigate('/');
    window.location.reload();
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
          onClick={() => navigate('/')}
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
            <button className={`header-nav-item ${activeTab === 'ai' ? 'header-nav-item--active' : ''}`} onClick={() => navigate(isLoggedIn ? '/ai-image-editor' : '/login')}>
              {language === 'en' ? 'AI EDITOR' : 'AI CHỈNH ẢNH'}
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
              {/* Khu vực chuông thông báo */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button className="header-icon-btn" title="Notifications" onClick={() => setShowNotif(!showNotif)}>
                  <Bell size={15} />
                  {notifications.length > 0 && (
                    <span className="notif-dot" style={{ position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }} />
                  )}
                </button>

                {/* Box xổ xuống khi bấm chuông */}
                {showNotif && (
                  <div className="header-dropdown-menu notif-dropdown animate-in" style={{ width: '320px', right: '-40px', padding: 0, overflow: 'hidden' }}>
                    <div className="notif-dropdown-header">
                      {language === 'en' ? 'Notifications' : 'Thông báo mới'}
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div className="notif-dropdown-empty">
                          Không có thông báo nào
                        </div>
                      ) : (
                        notifications.map((notif, idx) => (
                          <div
                            key={idx}
                            className="notif-dropdown-item"
                            onClick={() => handleNotifClick(notif)}
                          >
                            <div className="notif-dropdown-item-title">
                              <strong>{notif.senderName}</strong> vừa nhắn tin cho bạn:
                            </div>
                            <div className="notif-dropdown-item-message">
                              "{notif.message}"
                            </div>
                            <div className="notif-dropdown-item-time">{notif.time || 'Vừa xong'}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Booking requests: chỉ hiện cho role user, có badge số đơn chưa xem */}
              {role === 'user' && (
                <button
                  className="header-icon-btn"
                  title={language === 'en' ? 'Booking Requests' : 'Yêu cầu chờ duyệt'}
                  onClick={() => navigate('/user/booking-requests')}
                  style={{ position: 'relative' }}
                >
                  <FileText size={15} />
                  {pendingBookingCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        borderRadius: '999px',
                        padding: '0 4px',
                        minWidth: '15px',
                        textAlign: 'center',
                        lineHeight: '15px',
                        border: '1px solid #0D1117',
                      }}
                    >
                      {pendingBookingCount}
                    </span>
                  )}
                </button>
              )}

              {/* Avatar: bấm để đi thẳng đến trang Profile */}
              <div
                className="header-avatar"
                onClick={() => navigate('/user/profile')}
                title={language === 'en' ? 'Profile' : 'Hồ sơ cá nhân'}
                style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}
              >
                {displayInitials}
                {isVerified && (
                  <span
                    className="header-avatar-verified-badge"
                    title={language === 'en' ? 'Identity verified' : 'Đã xác thực định danh'}
                  >
                    <CheckCircle2 size={12} />
                  </span>
                )}
              </div>

              {/* LOGOUT */}
              <button
                className="header-icon-btn"
                title={language === 'en' ? 'Log out' : 'Đăng xuất'}
                onClick={handleLogout}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '8px 20px', fontSize: '12px', marginLeft: '8px' }}>
              <User size={14} style={{ marginRight: '6px' }} /> {language === 'en' ? 'Sign In' : 'Đăng nhập'}
            </button>
          )}
        </div>
      </header>

      {/* Toast notification */}
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

