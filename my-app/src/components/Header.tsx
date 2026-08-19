/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, CheckCircle2 } from 'lucide-react';
import { useIdentityVerification } from '../features/identity-verification';
import { clearLocalStorageForLogout } from '../utils/preserveLocalStorage';
import './Header.css';
import { Shuffle } from './Shuffle'; // adjust path to Shuffle

interface HeaderProps {
  userInitials?: string;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({ userInitials, userName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isVerified } = useIdentityVerification();

  const getActiveTab = (pathname: string): 'home' | 'spaces' | 'feed' | 'ai' | 'pricing' | null => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/user/spaces')) return 'spaces';
    if (pathname === '/feed') return 'feed';
    if (pathname === '/ai-image-editor') return 'ai';
    if (pathname === '/pricing') return 'pricing';
    return null;
  };
  const activeTab = getActiveTab(location.pathname);

  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // State cho toast thông báo nổi.
  const [toastNotif, setToastNotif] = useState<{ show: boolean, title: string, message: string } | null>(null);

  const token = localStorage.getItem('portal_token');
  const role = localStorage.getItem('portal_role');

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

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/Notification/unread-count', {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });
      if (res.ok) {
        const count = await res.json();
        setUnreadNotifCount(count);
      }
    } catch (err) {
      console.error('Lỗi lấy số thông báo chưa đọc:', err);
    }
  };

  const fetchNotifHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/Notification/history', {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Lỗi lấy lịch sử thông báo:', err);
    }
  };

  useEffect(() => {
    if (showNotif) {
      fetchNotifHistory();
    }
  }, [showNotif]);

  // Lắng nghe sự kiện từ floating chat để mở toast.
  useEffect(() => {
    const handleNewNotif = (e: Event) => {
      const customEvent = e as CustomEvent;
      const notifData = customEvent.detail;

      fetchUnreadCount();
      if (showNotif) fetchNotifHistory();

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
  }, [showNotif]);


  useEffect(() => {
    if (!isLoggedIn) return;

    fetchUnreadCount();


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, role]);

  const handleLogout = () => {
    clearLocalStorageForLogout();
    navigate('/');
    window.location.reload();
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await fetch('https://flexi-space-capstone-project.onrender.com/api/Notification/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });
      fetchUnreadCount();
      fetchNotifHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifClick = async (notif: any) => {
    const notifId = notif.id || notif.notificationId || notif.Id;
    const isRead = notif.isRead !== undefined ? notif.isRead : notif.IsRead;

    if (!isRead && notifId) {
      try {
        await fetch(`https://flexi-space-capstone-project.onrender.com/api/Notification/${notifId}/read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
        });
        fetchUnreadCount();
        fetchNotifHistory();
      } catch (err) {
        console.error(err);
      }
    }

    setShowNotif(false);

    const typeStr = (notif.type || notif.Type || '').toLowerCase();
    const titleStr = (notif.title || notif.Title || '').toLowerCase();

    // Nếu thông báo là tin nhắn, dispatch sự kiện mở chat
    if (notif.conversationId || typeStr.includes('message')) {
      const event = new CustomEvent('open-ether-chat', {
        detail: {
          conversationId: notif.conversationId || notif.relatedId,
          name: notif.senderName || notif.title || 'Người dùng'
        }
      });
      window.dispatchEvent(event);
    } else if (typeStr.includes('booking') || typeStr.includes('request') || titleStr.includes('booking') || titleStr.includes('đặt chỗ') || titleStr.includes('yêu cầu')) {
      navigate('/user/booking-requests');
    } else if (notif.link || notif.relatedUrl) {
      navigate(notif.link || notif.relatedUrl);
    }
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
              TRANG CHỦ
            </button>
            <button className={`header-nav-item ${activeTab === 'spaces' ? 'header-nav-item--active' : ''}`} onClick={() => navigate(isLoggedIn ? '/user/spaces' : '/login')}>
              QUẢN LÝ MẶT BẰNG
            </button>
            <button className={`header-nav-item ${activeTab === 'feed' ? 'header-nav-item--active' : ''}`} onClick={() => navigate('/feed')}>
              KHÁM PHÁ
            </button>
            <button className={`header-nav-item ${activeTab === 'pricing' ? 'header-nav-item--active' : ''}`} onClick={() => navigate('/pricing')}>
              BẢNG GIÁ
            </button>
            <button className={`header-nav-item ${activeTab === 'ai' ? 'header-nav-item--active' : ''}`} onClick={() => navigate(isLoggedIn ? '/ai-image-editor' : '/login')}>
              AI CHỈNH ẢNH
            </button>
          </nav>
        </div>

        {/* RIGHT CONTROLS */}
        <div className="header-right">
          <button className="btn-post-listing" onClick={handlePostListing}>
            Đăng tin <span className="arrow-icon">→</span>
          </button>

          {isLoggedIn ? (
            <>
              {/* Khu vực chuông thông báo */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button className="header-icon-btn" title="Thông báo" onClick={() => setShowNotif(!showNotif)}>
                  <Bell size={15} />
                  {unreadNotifCount > 0 && (
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
                        border: '1px solid #0D1117'
                      }}
                    >
                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Box xổ xuống khi bấm chuông */}
                {showNotif && (
                  <div className="header-dropdown-menu notif-dropdown animate-in" style={{ width: '320px', right: '-40px', padding: 0, overflow: 'hidden' }}>
                    <div className="notif-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Thông báo mới</span>
                      <button onClick={handleMarkAllRead} style={{ fontSize: '11px', background: 'none', border: 'none', color: '#00D4A0', cursor: 'pointer', padding: 0 }}>Đánh dấu tất cả đã đọc</button>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div className="notif-dropdown-empty">
                          Không có thông báo nào
                        </div>
                      ) : (
                        notifications.map((notif, idx) => {
                          const notifId = notif.id || notif.notificationId || notif.Id || idx;
                          const isRead = notif.isRead !== undefined ? notif.isRead : notif.IsRead;
                          return (
                            <div
                              key={notifId}
                              className="notif-dropdown-item"
                              onClick={() => handleNotifClick(notif)}
                              style={{
                                backgroundColor: isRead ? 'transparent' : 'rgba(0, 212, 160, 0.1)',
                                borderLeft: isRead ? 'none' : '3px solid #00D4A0'
                              }}
                            >
                              <div className="notif-dropdown-item-title">
                                <strong>{notif.title || notif.senderName || 'Thông báo'}</strong>
                              </div>
                              <div className="notif-dropdown-item-message">
                                {notif.message || notif.content}
                              </div>
                              <div className="notif-dropdown-item-time">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleString('vi-VN') : (notif.time || 'Vừa xong')}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>


              {/* Avatar: bấm để đi thẳng đến trang Profile */}
              <div
                className="header-avatar"
                onClick={() => navigate('/user/profile')}
                title="Hồ sơ cá nhân"
                style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}
              >
                {displayInitials}
                {isVerified && (
                  <span
                    className="header-avatar-verified-badge"
                    title="Đã xác thực định danh"
                  >
                    <CheckCircle2 size={12} />
                  </span>
                )}
              </div>

              {/* LOGOUT */}
              <button
                className="header-icon-btn"
                title="Đăng xuất"
                onClick={handleLogout}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '8px 20px', fontSize: '12px', marginLeft: '8px', cursor: 'pointer' }}>
              <User size={14} style={{ marginRight: '6px' }} /> Đăng nhập
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
