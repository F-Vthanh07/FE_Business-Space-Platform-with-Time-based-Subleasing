import React, { useMemo } from 'react';
import { Users, Building, FileText, Wallet, Activity, AlertTriangle, Zap, Tag } from 'lucide-react';
import type { AdminListingItem, UserAccount, AdminSpaceItem, AdminWalletAccount, PriorityLevel, BusinessCategory, ListingReportItem } from '../types';

interface OverviewModuleProps {
  users: UserAccount[];
  listings: AdminListingItem[];
  spaces: AdminSpaceItem[];
  wallets: AdminWalletAccount[];
  priorityLevels: PriorityLevel[];
  categories: BusinessCategory[];
  reports: ListingReportItem[];
  language: 'en' | 'vi';
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  users,
  listings,
  spaces,
  wallets,
  priorityLevels,
  categories,
  reports,
  language,
}) => {
  const totalWalletBalance = useMemo(() => wallets.reduce((sum, w) => sum + (w.balance || 0), 0), [wallets]);

  const pendingListingsCount = useMemo(
    () => listings.filter(l => (l.status || 'Pending').toLowerCase() === 'pending').length,
    [listings]
  );

  const unresolvedReportsCount = useMemo(
    () => reports.filter(r => !r.isBanned).length,
    [reports]
  );

  const activePriorityCount = useMemo(() => priorityLevels.filter(p => p.isActive).length, [priorityLevels]);
  const activeCategoryCount = useMemo(() => categories.filter(c => c.isActive).length, [categories]);

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

  const hasAlerts = pendingListingsCount > 0 || unresolvedReportsCount > 0;

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'System Overview' : 'Tổng quan Hệ thống'}</h1>
        <p>{language === 'en' ? 'Live analytics and system monitoring' : 'Thông số hoạt động và phân tích trực tiếp'}</p>
      </header>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper blue"><Users size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL USERS' : 'TỔNG NGƯỜI DÙNG'}</span>
            <h2 className="stat-value">{users.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><Building size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'REGISTERED SPACES' : 'MẶT BẰNG ĐÃ ĐĂNG KÝ'}</span>
            <h2 className="stat-value">{spaces.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper orange"><FileText size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL LISTINGS' : 'TỔNG TIN ĐĂNG'}</span>
            <h2 className="stat-value">{listings.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper purple"><Wallet size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL WALLET BALANCE' : 'TỔNG SỐ DƯ VÍ HỆ THỐNG'}</span>
            <h2 className="stat-value">{totalWalletBalance.toLocaleString('vi-VN')} đ</h2>
          </div>
        </div>
      </div>

      {/* Alerts requiring action */}
      {hasAlerts && (
        <div className="admin-activity-section glass-card" style={{ marginBottom: '24px' }}>
          <div className="section-title-row">
            <AlertTriangle size={18} className="text-negative" />
            <h3>{language === 'en' ? 'Needs Attention' : 'Cần xử lý'}</h3>
          </div>
          <div className="admin-stats-grid" style={{ marginTop: '12px', marginBottom: 0 }}>
            {pendingListingsCount > 0 && (
              <div className="admin-stat-card glass-card--inset">
                <div className="stat-icon-wrapper orange"><FileText size={18} /></div>
                <div className="stat-data">
                  <span className="stat-label">{language === 'en' ? 'PENDING LISTINGS' : 'TIN ĐĂNG CHỜ DUYỆT'}</span>
                  <h2 className="stat-value">{pendingListingsCount}</h2>
                </div>
              </div>
            )}
            {unresolvedReportsCount > 0 && (
              <div className="admin-stat-card glass-card--inset">
                <div className="stat-icon-wrapper orange"><AlertTriangle size={18} /></div>
                <div className="stat-data">
                  <span className="stat-label">{language === 'en' ? 'UNRESOLVED REPORTS' : 'TIN BỊ BÁO CÁO CHƯA XỬ LÝ'}</span>
                  <h2 className="stat-value">{unresolvedReportsCount}</h2>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Listings status breakdown */}
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

      {/* Priority packages & categories summary */}
      <div className="admin-stats-grid" style={{ marginTop: '24px', marginBottom: 0 }}>
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper blue"><Zap size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE PRIORITY PACKAGES' : 'GÓI ƯU TIÊN ĐANG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{activePriorityCount} / {priorityLevels.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><Tag size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE CATEGORIES' : 'NGÀNH NGHỀ ĐANG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{activeCategoryCount} / {categories.length}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};
