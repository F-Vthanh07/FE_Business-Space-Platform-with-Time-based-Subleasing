// src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORT THÊM Building2 VÀ FileText Ở ĐÂY NÈ
import { Bell, Globe, LogOut, LayoutDashboard, User, Building2, FileText } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
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
  
  const [activeTab, setActiveTab] = useState<'rent' | 'sale' | 'news'>('rent');
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
    if (role === 'owner') navigate('/owner');
    else if (role === 'renter') navigate('/renter');
    else if (role === 'admin') navigate('/admin');
    else navigate('/auth');
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
          <button className={`header-nav-item ${activeTab === 'rent' ? 'header-nav-item--active' : ''}`} onClick={() => setActiveTab('rent')}>
            {language === 'en' ? 'FOR RENT' : 'CHO THUÊ'}
          </button>
          <button className={`header-nav-item ${activeTab === 'sale' ? 'header-nav-item--active' : ''}`} onClick={() => setActiveTab('sale')}>
            {language === 'en' ? 'FOR SALE' : 'MUA BÁN'}
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
                <div className="glass-card animate-in" style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, minWidth: '200px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #2A3A4A' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #2A3A4A', marginBottom: '4px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0 }}>{userName || (language === 'en' ? 'System User' : 'Người dùng hệ thống')}</p>
                    <p style={{ fontSize: '11px', color: '#00D4A0', margin: '2px 0 0 0', fontWeight: 600 }}>{userRole || (role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Renter')}</p>
                  </div>
                  
                  <button className="sidebar-nav-item" onClick={handleDashboardClick} style={{ background: 'transparent', padding: '10px 12px' }}>
                    <LayoutDashboard size={14} /> <span style={{ fontSize: '12px' }}>{language === 'en' ? 'Dashboard' : 'Bảng điều khiển'}</span>
                  </button>

                  {/* MENU DÀNH RIÊNG CHO OWNER */}
                  {role === 'owner' && (
                    <>
                      <button className="sidebar-nav-item" onClick={() => { setShowDropdown(false); navigate('/owner/spaces'); }} style={{ background: 'transparent', padding: '10px 12px' }}>
                        <Building2 size={14} /> <span style={{ fontSize: '12px' }}>{language === 'en' ? 'Manage Spaces' : 'Quản lý Mặt bằng'}</span>
                      </button>
                      <button className="sidebar-nav-item" onClick={() => { setShowDropdown(false); navigate('/owner/listings'); }} style={{ background: 'transparent', padding: '10px 12px' }}>
                        <FileText size={14} /> <span style={{ fontSize: '12px' }}>{language === 'en' ? 'Manage Listings' : 'Quản lý Tin đăng'}</span>
                      </button>
                    </>
                  )}

                  <button className="sidebar-nav-item" onClick={handleLogout} style={{ background: 'transparent', padding: '10px 12px', color: '#f85149' }}>
                    <LogOut size={14} /> <span style={{ fontSize: '12px' }}>{language === 'en' ? 'Log out' : 'Đăng xuất'}</span>
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