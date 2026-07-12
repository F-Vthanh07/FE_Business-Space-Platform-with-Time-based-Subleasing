// src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORT THÊM Building2 VÀ FileText Ở ĐÂY NÈ
import { Bell, Globe, LogOut, LayoutDashboard, User, Building2, FileText } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { ROUTES } from '../routes/routes';
import './Header.css';
import { Shuffle } from '../components/Shuffle';

interface HeaderProps {
  userInitials?: string; 
  userName?: string;
  userRole?: string;
  onPostListing?: () => void; 
}

export const Header: React.FC<HeaderProps> = ({ userInitials, userName, userRole, onPostListing }) => {
  const navigate = useNavigate();
  const { language, setLanguage } = useThemeLanguage();
  
  const [activeTab, setActiveTab] = useState<'rent' | 'sale' | 'news' | 'feed'>('rent');
  const [showDropdown, setShowDropdown] = useState(false);

  const token = localStorage.getItem('portal_token');
  const role = localStorage.getItem('portal_role');
  const isLoggedIn = !!token;

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Giữ lại preference của người dùng, xóa hết các key còn lại
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

  return (
    <header className="dashboard-header">
      {/* 1. LOGO */}
      <div 
        className="header-logo-text" 
        onClick={() => window.location.href = 'http://localhost:5173/'}
        style={{ 
          display: 'flex', alignItems: 'center', fontFamily: "'Press Start 2P', cursive", 
          fontSize: '24px', cursor: 'pointer' 
        }}
      >
        <span>Ether</span><Shuffle text="Space" />
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="header-center">
        <nav className="header-nav">
          <button className={`header-nav-item ${activeTab === 'rent' ? 'header-nav-item--active' : ''}`} onClick={() => { setActiveTab('rent'); navigate('/'); }}>
            {language === 'en' ? 'FOR RENT' : 'CHO THUÊ'}
          </button>
          <button className={`header-nav-item ${activeTab === 'sale' ? 'header-nav-item--active' : ''}`} onClick={() => setActiveTab('sale')}>
            {language === 'en' ? 'FOR SALE' : 'MUA BÁN'}
          </button>

          {/* TAB MỚI THÊM VÀO NÈ ÔNG */}
          <button className={`header-nav-item ${activeTab === 'feed' ? 'header-nav-item--active' : ''}`} onClick={() => { setActiveTab('feed'); navigate('/feed'); }}>
            {language === 'en' ? 'DISCOVER' : 'KHÁM PHÁ'}
          </button>

          <button className={`header-nav-item ${activeTab === 'news' ? 'header-nav-item--active' : ''}`} onClick={() => setActiveTab('news')}>
            {language === 'en' ? 'NEWS' : 'TIN TỨC'}
          </button>
        </nav>
      </div>

      {/* 3. RIGHT CONTROLS */}
      <div className="header-right">
        {/* Nút Đăng tin to oạch ngoài cùng */}
        <button className="btn-post-listing" onClick={onPostListing}>
          {language === 'en' ? 'Post Listing' : 'Đăng tin'} <span className="arrow-icon">→</span>
        </button>
        
        <button className="header-icon-btn" onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')} style={{ width: 'auto', padding: '0 8px', display: 'flex', gap: 4, alignItems: 'center' }}>
          <Globe size={14} /> <span style={{ fontSize: 10, fontWeight: 700 }}>{language.toUpperCase()}</span>
        </button>

        {isLoggedIn ? (
          <>
            <button className="header-icon-btn" title="Notifications">
              <Bell size={15} /><span className="notif-dot" />
            </button>
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

                  {/* MENU DÀNH CHO USER (quản lý mặt bằng + tin đăng) */}
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