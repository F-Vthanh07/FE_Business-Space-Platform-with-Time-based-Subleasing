import React, { useState } from 'react';
import {
  Search,
  Phone,
  Mail,
  Check,
  X,
  Calendar,
  MapPin,
  DollarSign,
  AlertCircle,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { SubSlot } from '../types';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './RenterSubTenants.css';

interface RenterSubTenantsProps {
  slots: SubSlot[];
  onUpdateSlot: (updatedSlot: SubSlot) => void;
}

const MOCK_CONTACTS: Record<string, { phone: string; email: string }> = {
  'Trần Văn B': { phone: '0912 345 678', email: 'tranvanb@gmail.com' },
  'Nguyễn Thị C': { phone: '0988 765 432', email: 'nguyenthic@yahoo.com' },
  'Lê Thị D': { phone: '0909 111 222', email: 'lethid@gmail.com' },
  'Phạm Văn E': { phone: '0933 444 555', email: 'phamvane@outlook.com' },
  'Hoàng Thị F': { phone: '0977 888 999', email: 'hoangthif@gmail.com' },
  'Vũ Minh G': { phone: '0966 222 333', email: 'vuminhg@gmail.com' },
  'Đỗ Thị H': { phone: '0911 555 666', email: 'dothih@hotmail.com' },
  'Bùi Văn I': { phone: '0955 777 888', email: 'buivani@gmail.com' },
};

export const RenterSubTenants: React.FC<RenterSubTenantsProps> = ({ slots, onUpdateSlot }) => {
  const { t, language } = useThemeLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');

  const getSpaceName = (spaceId: string) => {
    if (spaceId === 'space-leloi') return language === 'en' ? 'Le Loi Dist 1' : 'Mặt bằng Lê Lợi Q1';
    if (spaceId === 'space-phandinhphung') return language === 'en' ? 'Phan Dinh Phung Shop' : 'Shop Phan Đình Phùng';
    return language === 'en' ? 'Quang Trung GV' : 'Quang Trung GV';
  };

  // Lọc ra các slots có người thuê phụ
  const subTenants = slots
    .filter((s) => s.tenantName !== '')
    .map((s) => {
      const contact = MOCK_CONTACTS[s.tenantName] || {
        phone: '0901 000 999',
        email: `${s.tenantName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      };
      return {
        ...s,
        phone: contact.phone,
        email: contact.email,
        spaceName: getSpaceName(s.spaceId),
      };
    });

  // Áp dụng bộ lọc tìm kiếm và trạng thái
  const filteredTenants = subTenants.filter((t) => {
    const matchSearch =
      t.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search) ||
      t.spaceName.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && t.status === 'booked') ||
      (statusFilter === 'pending' && t.status === 'pending');

    return matchSearch && matchStatus;
  });

  const handleApprove = (tenant: any) => {
    const updated = {
      ...tenant,
      status: 'booked' as const,
    };
    onUpdateSlot(updated);
  };

  const handleCancel = (tenant: any) => {
    if (window.confirm(t('subtenants.confirmCancelLease', { name: tenant.tenantName }))) {
      const updated = {
        ...tenant,
        tenantName: '',
        tenantInitials: '',
        status: 'available' as const,
      };
      onUpdateSlot(updated);
    }
  };

  // Thống kê
  const totalCount = subTenants.length;
  const activeCount = subTenants.filter((t) => t.status === 'booked').length;
  const pendingCount = subTenants.filter((t) => t.status === 'pending').length;
  const totalRevenue = subTenants
    .filter((t) => t.status === 'booked')
    .reduce((sum, t) => {
      const val = parseInt(t.price.replace(/\./g, '').replace('₫', '').replace(/,/g, '').replace(' VND', '')) || 0;
      return sum + val;
    }, 0);

  return (
    <div className="renter-sub-tenants animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('renter.subTenantsTitle')}</h1>
          <p className="page-subtitle text-secondary">
            {t('renter.subTenantsSubtitle')}
          </p>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="subtenants-summary">
        <div className="glass-card summary-item">
          <div className="summary-icon" style={{ background: 'rgba(74, 114, 255, 0.15)', color: '#4A72FF' }}>
            <Users size={18} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{totalCount}</span>
            <span className="label-caps">{t('subtenants.totalSubtenants')}</span>
          </div>
        </div>

        <div className="glass-card summary-item">
          <div className="summary-icon" style={{ background: 'rgba(46, 234, 130, 0.15)', color: '#2EEA82' }}>
            <Check size={18} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{activeCount}</span>
            <span className="label-caps">{t('subtenants.activeStatusSubtenants')}</span>
          </div>
        </div>

        <div className="glass-card summary-item">
          <div className="summary-icon" style={{ background: 'rgba(217, 160, 91, 0.15)', color: '#D9A05B' }}>
            <Clock size={18} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{pendingCount}</span>
            <span className="label-caps">{t('subtenants.pendingStatusSubtenants')}</span>
          </div>
        </div>

        <div className="glass-card summary-item">
          <div className="summary-icon" style={{ background: 'rgba(46, 234, 130, 0.15)', color: '#2EEA82' }}>
            <TrendingUp size={18} />
          </div>
          <div className="summary-info">
            <span className="summary-value">
              {language === 'en'
                ? `${totalRevenue.toLocaleString('en-US')} VND`
                : `${totalRevenue.toLocaleString('vi-VN')}₫`}
            </span>
            <span className="label-caps">{t('subtenants.revenueEarned')}</span>
          </div>
        </div>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div className="glass-card filter-card">
        <div className="search-bar-wrap">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={t('subtenants.searchSubtenantPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="glass-card--inset filter-tabs">
          <button
            className={`filter-btn-inset ${statusFilter === 'all' ? 'filter-btn-inset--active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            {t('subtenants.allSubtenantsTab')}
          </button>
          <button
            className={`filter-btn-inset ${statusFilter === 'active' ? 'filter-btn-inset--active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            {t('subtenants.activeSubtenantsTab')}
          </button>
          <button
            className={`filter-btn-inset ${statusFilter === 'pending' ? 'filter-btn-inset--active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            {t('subtenants.pendingSubtenantsTab')}
          </button>
        </div>
      </div>

      {/* Danh sách người thuê phụ */}
      {filteredTenants.length === 0 ? (
        <div className="glass-card empty-card">
          <AlertCircle size={32} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
          <p className="text-secondary" style={{ marginTop: 12 }}>
            {t('renter.emptySubtenantFilter')}
          </p>
        </div>
      ) : (
        <div className="subtenants-grid">
          {filteredTenants.map((tenant) => {
            const isActive = tenant.status === 'booked';
            return (
              <div key={tenant.id} className="glass-card tenant-card animate-in">
                {/* Header Card */}
                <div className="tenant-card-header">
                  <div className="tenant-profile">
                    <div
                      className="tenant-avatar"
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, #4A72FF, #4B8F8C)'
                          : 'linear-gradient(135deg, #D9A05B, #B87A42)',
                      }}
                    >
                      {tenant.tenantInitials}
                    </div>
                    <div>
                      <h3 className="tenant-name">{tenant.tenantName}</h3>
                      <p className="tenant-role text-secondary">{t('subtenants.subtenantRole')}</p>
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: isActive ? 'rgba(46, 234, 130, 0.12)' : 'rgba(217, 160, 91, 0.15)',
                      color: isActive ? '#2EEA82' : '#D9A05B',
                      border: `1px solid ${isActive ? '#2EEA82' : '#D9A05B'}30`,
                    }}
                  >
                    {isActive ? t('subtenants.activeSubtenantsTab') : t('subtenants.pendingSubtenantsTab')}
                  </span>
                </div>

                <div className="tenant-card-divider" />

                {/* Body Card */}
                <div className="tenant-card-body">
                  <div className="info-item">
                    <Phone size={12} className="text-secondary" />
                    <span>{tenant.phone}</span>
                  </div>
                  <div className="info-item">
                    <Mail size={12} className="text-secondary" />
                    <span className="email-text">{tenant.email}</span>
                  </div>

                  <div className="glass-card--inset booking-details">
                    <div className="detail-row">
                      <MapPin size={11} className="text-secondary" />
                      <span className="font-bold">{tenant.spaceName}</span>
                    </div>
                    <div className="detail-row" style={{ marginTop: 6 }}>
                      <Calendar size={11} className="text-secondary" />
                      <span>
                        {tenant.date} · {tenant.startTime} – {tenant.endTime}
                      </span>
                    </div>
                  </div>

                  <div className="price-row">
                    <span className="text-secondary">{t('subtenants.costPaid')}</span>
                    <div className="price-tag">
                      <DollarSign size={13} style={{ color: 'var(--color-positive)' }} />
                      <span>
                        {language === 'en'
                          ? tenant.price.replace(/\./g, ',').replace('₫', ' VND')
                          : tenant.price}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="tenant-card-divider" />

                {/* Actions Card */}
                <div className="tenant-card-footer">
                  {!isActive ? (
                    <>
                      <button
                        className="btn-primary approve-btn"
                        onClick={() => handleApprove(tenant)}
                        style={{ padding: '8px 12px', fontSize: 12, flex: 1 }}
                      >
                        <Check size={14} style={{ marginRight: 4 }} />
                        {t('subtenants.approveLease')}
                      </button>
                      <button
                        className="btn-ghost cancel-btn"
                        onClick={() => handleCancel(tenant)}
                        style={{ padding: '8px 12px', fontSize: 12, color: '#FF4D6D' }}
                        title={t('subtenants.rejectLease')}
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <a
                        href={`tel:${tenant.phone}`}
                        className="btn-ghost action-link-btn"
                        style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center' }}
                      >
                        <Phone size={13} style={{ marginRight: 6 }} />
                        {t('subtenants.contactLabel')}
                      </a>
                      <button
                        className="btn-ghost action-danger-btn"
                        onClick={() => handleCancel(tenant)}
                        style={{ padding: '8px 12px', fontSize: 12, color: '#FF4D6D' }}
                      >
                        {t('subtenants.cancelSubleaseSlot')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
