import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import './SidebarNav.css';

interface NavItem {
  id: string;
  label: string;
}

export const SidebarNav: React.FC = () => {
  const { language } = useThemeLanguage();
  const [activeId, setActiveId] = useState<string>('search-nav');

  const navItems: NavItem[] = [
    { id: 'search-nav', label: language === 'en' ? 'Search' : 'Tìm kiếm' },
    { id: 'features', label: language === 'en' ? 'Features' : 'Tính năng' },
    { id: 'how-it-works', label: language === 'en' ? 'How it Works' : 'Quy trình' },
    { id: 'pricing', label: language === 'en' ? 'Pricing' : 'Bảng giá' },
  ];

  useEffect(() => {
    // Dùng cảm biến để bắt chính xác thẻ đang nằm trên màn hình
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -50% 0px', // Kích hoạt khi phần tử nằm ở giữa trên màn hình
        threshold: 0
      }
    );

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [navItems]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sidebar-nav">
      {navItems.map((item, index) => (
        <div 
          key={item.id}
          className={`sidebar-nav-item ${activeId === item.id ? 'active' : ''}`}
          onClick={() => scrollToSection(item.id)}
        >
          <span className="sidebar-nav-number">{index + 1}</span>
          <span className="sidebar-nav-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
};