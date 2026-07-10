import React, { useState } from 'react';
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Mail,
  Building2,
  MoreHorizontal,
  TrendingUp,
  FileText,
  Calendar,
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './OwnerTenants.css';

interface Tenant {
  id: number;
  name: string;
  initials: string;
  phone: string;
  email: string;
  space: string;
  spaceAddress: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  contractMonths: number;
  remaining: number;
}

const tenants: Tenant[] = [
  { id: 1, name: 'Nguyễn Văn An', initials: 'NA', phone: '0901 234 567', email: 'an.nguyen@gmail.com', space: 'Mặt bằng Lê Lợi Q1', spaceAddress: '45 Lê Lợi, Q1, TP.HCM', startDate: '01/03/2025', endDate: '01/03/2026', monthlyRent: '12.500.000₫', paymentStatus: 'paid', contractMonths: 12, remaining: 10 },
  { id: 2, name: 'Trần Thị Bình', initials: 'TB', phone: '0912 345 678', email: 'binh.tran@gmail.com', space: 'Shop Phan Đình Phùng', spaceAddress: '12 Phan Đình Phùng, BT, TP.HCM', startDate: '01/01/2025', endDate: '31/12/2025', monthlyRent: '8.200.000₫', paymentStatus: 'paid', contractMonths: 12, remaining: 7 },
  { id: 3, name: 'Lê Minh Dũng', initials: 'LD', phone: '0987 654 321', email: 'dung.le@gmail.com', space: 'Kiosk Quang Trung', spaceAddress: '88 Quang Trung, GV, TP.HCM', startDate: '01/05/2025', endDate: '31/07/2025', monthlyRent: '3.800.000₫', paymentStatus: 'pending', contractMonths: 3, remaining: 2 },
  { id: 4, name: 'Phạm Thị Cẩm Vân', initials: 'CV', phone: '0909 876 543', email: 'van.pham@gmail.com', space: 'Mặt bằng Lê Lợi Q1', spaceAddress: '45 Lê Lợi, Q1, TP.HCM', startDate: '01/02/2025', endDate: '31/01/2026', monthlyRent: '5.000.000₫', paymentStatus: 'overdue', contractMonths: 12, remaining: 8 },
  { id: 5, name: 'Hoàng Quốc Tuấn', initials: 'HT', phone: '0945 321 789', email: 'tuan.hoang@gmail.com', space: 'Shop Mini Bình Thạnh', spaceAddress: '36 Xô Viết Nghệ Tĩnh, BT, TP.HCM', startDate: '15/04/2025', endDate: '14/04/2026', monthlyRent: '6.200.000₫', paymentStatus: 'paid', contractMonths: 12, remaining: 11 },
];

const paymentConfig = {
  paid: { className: 'badge--positive', icon: <CheckCircle2 size={11} /> },
  pending: { className: 'badge--warning', icon: <Clock size={11} /> },
  overdue: { className: 'badge--negative', icon: <XCircle size={11} /> },
};

export const OwnerTenants: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const { t, language } = useThemeLanguage();

  const getPaymentLabel = (status: Tenant['paymentStatus']) => {
    switch (status) {
      case 'paid': return t('tenants.paid');
      case 'pending': return t('tenants.pendingPayment');
      case 'overdue': return t('tenants.overdue');
    }
  };

  const filtered = tenants.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.space.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterPayment === 'all' || t.paymentStatus === filterPayment;
    return matchSearch && matchFilter;
  });

  const totalRevenue = tenants.reduce((sum, t) => {
    const val = parseFloat(t.monthlyRent.replace(/[^\d]/g, ''));
    return sum + val;
  }, 0);

  return (
    <div className="owner-tenants animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('tenants.monthlyTenants')}</h1>
          <p className="page-subtitle text-secondary">{t('tenants.tenantsSubtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost">
            <FileText size={15} />
            {t('tenants.exportReport')}
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            {t('tenants.addTenant')}
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="tenants-summary">
        {[
          { label: language === 'en' ? 'Total Tenants' : 'Tổng người thuê', value: tenants.length, sub: t('tenants.current'), color: '#fff' },
          { label: t('tenants.revenueThisMonth'), value: (totalRevenue / 1000000).toFixed(1) + (language === 'en' ? 'M VND' : 'tr ₫'), sub: t('tenants.fromAllContracts'), color: 'var(--color-positive)' },
          { label: t('tenants.paid'), value: tenants.filter(t => t.paymentStatus === 'paid').length, sub: language === 'en' ? 'this month' : 'tháng này', color: 'var(--color-positive)' },
          { label: language === 'en' ? 'Overdue / Pending' : 'Quá hạn / Chờ', value: tenants.filter(t => t.paymentStatus !== 'paid').length, sub: t('tenants.needAction'), color: 'var(--color-gold)' },
        ].map((s, i) => (
          <div key={i} className="glass-card tenants-summary-item">
            <span className="tenants-summary-value" style={{ color: s.color }}>{s.value}</span>
            <span className="label-caps">{s.label}</span>
            <span className="text-secondary" style={{ fontSize: 11 }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="glass-card tenant-filter-bar">
        <div className="listings-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={t('tenants.searchTenantPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="listings-filters">
          {(['all', 'paid', 'pending', 'overdue'] as const).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filterPayment === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilterPayment(f)}
            >
              {f === 'all' ? t('listings.all') : getPaymentLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {/* Tenant Cards */}
      <div className="tenants-grid">
        {filtered.map((tenant, i) => (
          <div key={tenant.id} className={`glass-card tenant-card animate-in delay-${Math.min(i + 1, 6)}`}>
            {/* Card Header */}
            <div className="tenant-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar avatar--lg" style={{ background: `linear-gradient(135deg, hsl(${tenant.id * 60}, 65%, 50%), hsl(${tenant.id * 60 + 40}, 65%, 40%))` }}>
                  {tenant.initials}
                </div>
                <div>
                  <h3 className="tenant-name">{tenant.name}</h3>
                  <p className="tenant-space">
                    <Building2 size={12} />
                    {tenant.space}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${paymentConfig[tenant.paymentStatus].className}`}>
                  {paymentConfig[tenant.paymentStatus].icon}
                  {getPaymentLabel(tenant.paymentStatus)}
                </span>
                <button className="btn-icon" style={{ width: 28, height: 28 }}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Contract Progress */}
            <div className="tenant-progress-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="label-caps">{t('tenants.contractProgress')}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {t('tenants.remainingMonths', { rem: tenant.remaining, total: tenant.contractMonths })}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${((tenant.contractMonths - tenant.remaining) / tenant.contractMonths) * 100}%` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span className="text-secondary" style={{ fontSize: 11 }}>{t('tenants.contractStart', { date: tenant.startDate })}</span>
                <span className="text-secondary" style={{ fontSize: 11 }}>{t('tenants.contractEnd', { date: tenant.endDate })}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="tenant-info-grid">
              <div className="tenant-info-item">
                <span className="label-caps">{t('tenants.monthlyRent')}</span>
                <span className="tenant-info-value" style={{ color: 'var(--color-positive)' }}>
                  <TrendingUp size={14} /> {tenant.monthlyRent}
                </span>
              </div>
              <div className="tenant-info-item">
                <span className="label-caps">{t('tenants.addressLabel')}</span>
                <span className="tenant-info-value text-secondary" style={{ fontSize: 12 }}>
                  {tenant.spaceAddress}
                </span>
              </div>
            </div>

            {/* Contact */}
            <div className="tenant-contact">
              <a href={`tel:${tenant.phone}`} className="tenant-contact-item">
                <Phone size={13} />
                <span>{tenant.phone}</span>
              </a>
              <a href={`mailto:${tenant.email}`} className="tenant-contact-item">
                <Mail size={13} />
                <span>{tenant.email}</span>
              </a>
            </div>

            {/* Actions */}
            <div className="tenant-card-actions">
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                <Calendar size={13} />
                {t('tenants.paymentSchedule')}
              </button>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                <FileText size={13} />
                {t('tenants.contract')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
