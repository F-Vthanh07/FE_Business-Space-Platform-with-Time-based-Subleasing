import React, { useState } from 'react';
import {
  Bell,
  Globe,
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import './Header.css';
import { Shuffle } from '../components/Shuffle';
interface HeaderProps {
  userInitials?: string; // Đã đổi thành optional (?) để tránh lỗi nếu chưa truyền
  onPostListing?: () => void; // Thêm prop cho nút Đăng tin
}

export const Header: React.FC<HeaderProps> = ({ userInitials, onPostListing }) => {
  const [activeTab, setActiveTab] = useState<'rent' | 'sale' | 'news'>('rent');
  const { language, setLanguage } = useThemeLanguage();

  return (
    <header className="dashboard-header">
      <div className="header-logo-text" style={{ 
        display: 'flex', 
        alignItems: 'center', // Căn chỉnh theo chiều dọc để không bị lệch trên dưới
        fontFamily: "'Press Start 2P', cursive", // Dùng font cho cả cụm
        fontSize: '24px' 
      }}>
        <span>Ether</span>
        <Shuffle text="Space" />
      </div>

      <div className="header-center">
        <nav className="header-nav">
          <button
            className={`header-nav-item ${activeTab === 'rent' ? 'header-nav-item--active' : ''}`}
            onClick={() => setActiveTab('rent')}
          >
            {language === 'en' ? 'FOR RENT' : 'CHO THUÊ'}
          </button>
          <button
            className={`header-nav-item ${activeTab === 'sale' ? 'header-nav-item--active' : ''}`}
            onClick={() => setActiveTab('sale')}
          >
            {language === 'en' ? 'FOR SALE' : 'MUA BÁN'}
          </button>
          <button
            className={`header-nav-item ${activeTab === 'news' ? 'header-nav-item--active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            {language === 'en' ? 'NEWS' : 'TIN TỨC'}
          </button>
        </nav>
      </div>

      <div className="header-right">
        {/* Nút Đăng Tin mới */}
        <button className="btn-post-listing" onClick={onPostListing}>
          {language === 'en' ? 'Post Listing' : 'Đăng tin'}
          <span className="arrow-icon">→</span>
        </button>
        
        {/* Language Switcher */}
        <button 
          className="header-icon-btn" 
          onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          title={language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}
          style={{ width: 'auto', padding: '0 8px', display: 'flex', gap: 4, alignItems: 'center' }}
        >
          <Globe size={14} />
          <span style={{ fontSize: 10, fontWeight: 700 }}>{language.toUpperCase()}</span>
        </button>

        {/* Notifications */}
        <button className="header-icon-btn" title="Notifications">
          <Bell size={15} />
          <span className="notif-dot" />
        </button>

        {/* User Avatar */}
        <div className="header-avatar">
          {userInitials || 'NC'}
        </div>
      </div>
    </header>
  );
};