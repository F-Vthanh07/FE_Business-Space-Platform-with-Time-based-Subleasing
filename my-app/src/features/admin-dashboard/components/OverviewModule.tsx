import React, { useMemo } from 'react';
import { Users, Building, FileText, DollarSign, Activity } from 'lucide-react';
import type { SystemStat, AdminListingItem } from '../types';

interface OverviewModuleProps {
  stats: SystemStat;
  listings: AdminListingItem[];
  language: 'en' | 'vi';
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({ stats, listings, language }) => {
  const statusBreakdown = useMemo(() => {
    const counts = { pending: 0, accepted: 0, canceled: 0 };
    listings.forEach(l => {
      const status = (l.status || 'Pending').toLowerCase();
      if (status === 'pending') counts.pending++;
      else if (status === 'accepted') counts.accepted++;
      else if (status === 'canceled') counts.canceled++;
    });
    const total = listings.length || 1;
    return [
      {
        key: 'pending',
        label: language === 'en' ? 'Pending' : 'Chờ duyệt',
        count: counts.pending,
        percent: Math.round((counts.pending / total) * 100),
        className: '',
      },
      {
        key: 'accepted',
        label: language === 'en' ? 'Accepted' : 'Đã duyệt',
        count: counts.accepted,
        percent: Math.round((counts.accepted / total) * 100),
        className: 'active',
      },
      {
        key: 'canceled',
        label: language === 'en' ? 'Canceled' : 'Từ chối',
        count: counts.canceled,
        percent: Math.round((counts.canceled / total) * 100),
        className: '',
      },
    ];
  }, [listings, language]);

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'System Overview' : 'Tổng quan Hệ thống'}</h1>
        <p>{language === 'en' ? 'Live analytics and nodes monitoring' : 'Thông số hoạt động và phân tích trực tiếp'}</p>
      </header>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper blue"><Users size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE USERS' : 'NGƯỜI DÙNG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{stats.totalUsers}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><Building size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'VERIFIED SPACES' : 'MẶT BẰNG ĐÃ XÁC MINH'}</span>
            <h2 className="stat-value">{stats.totalSpaces}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper orange"><FileText size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'PUBLISHED LISTINGS' : 'TIN ĐĂNG CHO THUÊ'}</span>
            <h2 className="stat-value">{stats.totalListings}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper purple"><DollarSign size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ESTIMATED VOLUME' : 'TỔNG DOANH THU'}</span>
            <h2 className="stat-value">{(stats.totalRevenue).toLocaleString('vi-VN')} đ</h2>
          </div>
        </div>
      </div>

      {/* Listings status breakdown — dữ liệu thật từ danh sách tin đăng đã tải */}
      <div className="admin-activity-section glass-card">
        <div className="section-title-row">
          <Activity size={18} className="text-neon-green" />
          <h3>{language === 'en' ? 'Listings Status Breakdown' : 'Phân bổ trạng thái tin đăng'}</h3>
        </div>
        {listings.length === 0 ? (
          <p className="text-secondary" style={{ padding: '12px 0' }}>
            {language === 'en' ? 'No listings data available yet.' : 'Chưa có dữ liệu tin đăng.'}
          </p>
        ) : (
          <div className="status-breakdown-list">
            {statusBreakdown.map(item => (
              <div key={item.key} className="status-breakdown-row">
                <div className="status-breakdown-label">
                  <span>{item.label}</span>
                  <span className="status-breakdown-count">{item.count} ({item.percent}%)</span>
                </div>
                <div className="status-breakdown-track">
                  <div
                    className={`status-breakdown-fill ${item.className}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
