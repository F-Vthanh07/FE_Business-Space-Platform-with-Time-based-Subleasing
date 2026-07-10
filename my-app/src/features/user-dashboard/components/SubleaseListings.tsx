import React, { useState } from 'react';
import { Plus, Search, Eye, Edit3, Trash2, Clock, CheckCircle2, XCircle, Share2, Users } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './SubleaseListings.css';

interface SubListing {
  id: number;
  spaceName: string;
  date: string;
  startTime: string;
  endTime: string;
  priceVal: number;
  status: 'published' | 'pending' | 'booked' | 'expired';
  views: number;
  inquiries: number;
  maxSubTenants: number;
  currentSubTenants: number;
  description: string;
}

export const SubleaseListings: React.FC = () => {
  const { t, language } = useThemeLanguage();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | SubListing['status']>('all');

  const subListings: SubListing[] = [
    { id: 1, spaceName: t('subleaseListings.leLoiSpace'), date: '26/05/2025', startTime: '08:00', endTime: '12:00', priceVal: 500000, status: 'booked', views: 45, inquiries: 8, maxSubTenants: 1, currentSubTenants: 1, description: t('subleaseListings.desc1') },
    { id: 2, spaceName: t('subleaseListings.leLoiSpace'), date: '26/05/2025', startTime: '13:00', endTime: '17:00', priceVal: 500000, status: 'booked', views: 38, inquiries: 6, maxSubTenants: 1, currentSubTenants: 1, description: t('subleaseListings.desc2') },
    { id: 3, spaceName: t('subleaseListings.leLoiSpace'), date: '28/05/2025', startTime: '09:00', endTime: '12:00', priceVal: 400000, status: 'published', views: 22, inquiries: 3, maxSubTenants: 1, currentSubTenants: 0, description: t('subleaseListings.desc3') },
    { id: 4, spaceName: t('subleaseListings.leLoiSpace'), date: '29/05/2025', startTime: '08:00', endTime: '12:00', priceVal: 500000, status: 'pending', views: 15, inquiries: 2, maxSubTenants: 1, currentSubTenants: 0, description: t('subleaseListings.desc4') },
    { id: 5, spaceName: t('subleaseListings.leLoiSpace'), date: '30/05/2025', startTime: '08:00', endTime: '12:00', priceVal: 500000, status: 'published', views: 9, inquiries: 1, maxSubTenants: 1, currentSubTenants: 0, description: t('subleaseListings.desc5') },
    { id: 6, spaceName: t('subleaseListings.leLoiSpace'), date: '25/05/2025', startTime: '08:00', endTime: '20:00', priceVal: 1500000, status: 'expired', views: 67, inquiries: 12, maxSubTenants: 2, currentSubTenants: 0, description: t('subleaseListings.desc6') },
  ];

  const statusConfig = {
    published: { label: t('listings.published'), className: 'badge--positive', icon: <CheckCircle2 size={11} /> },
    pending: { label: t('listings.pending'), className: 'badge--warning', icon: <Clock size={11} /> },
    booked: { label: t('renter.bookedStatus'), className: 'badge--accent', icon: <Users size={11} /> },
    expired: { label: t('listings.expired'), className: 'badge--neutral', icon: <XCircle size={11} /> },
  };

  const filtered = subListings.filter((l) => {
    const matchSearch = l.spaceName.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="sublease-listings animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('renter.subleaseListingsTitle')}</h1>
          <p className="page-subtitle text-secondary">{t('renter.subleaseListingsSubtitle')}</p>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          {t('renter.addSlot')}
        </button>
      </div>

      {/* Summary */}
      <div className="sublease-summary">
        {[
          { label: t('subleaseListings.totalSlots'), value: subListings.length, color: '#fff' },
          { label: t('subleaseListings.booked'), value: subListings.filter(l => l.status === 'booked').length, color: 'var(--color-accent)' },
          { label: t('subleaseListings.vacant'), value: subListings.filter(l => l.status === 'published').length, color: 'var(--color-positive)' },
          { label: t('subleaseListings.estRevenue'), value: language === 'en' ? '8.65M VND' : '8.65tr ₫', color: 'var(--color-positive)' },
        ].map((s, i) => (
          <div key={i} className="glass-card sublease-summary-item">
            <span className="sublease-summary-value" style={{ color: s.color }}>{s.value}</span>
            <span className="label-caps">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="glass-card sublease-filter-bar">
        <div className="listings-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={t('subleaseListings.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="listings-filters">
          {(['all', 'published', 'pending', 'booked', 'expired'] as const).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filterStatus === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === 'all' ? t('listings.all') : statusConfig[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Table */}
      <div className="glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('subleaseListings.tableSpaceTime')}</th>
              <th>{t('subleaseListings.tablePrice')}</th>
              <th>{t('subleaseListings.tableViews')}</th>
              <th>{t('subleaseListings.tableInquiries')}</th>
              <th>{t('subleaseListings.tableSubTenant')}</th>
              <th>{t('subleaseListings.tableStatus')}</th>
              <th>{t('subleaseListings.tableActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((listing, i) => {
              const formattedPrice = language === 'en'
                ? `${listing.priceVal.toLocaleString('en-US')} VND`
                : `${listing.priceVal.toLocaleString('vi-VN')}₫`;
              return (
                <tr key={listing.id} className={`animate-in delay-${Math.min(i + 1, 6)}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="slot-icon">
                        <Share2 size={15} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>{listing.spaceName}</p>
                        <p className="text-secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Clock size={11} />
                          {listing.date} · {listing.startTime} – {listing.endTime}
                        </p>
                        <p className="text-secondary" style={{ fontSize: 11, marginTop: 3 }}>{listing.description}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{formattedPrice}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Eye size={13} className="text-secondary" />
                      <span>{listing.views}</span>
                    </div>
                  </td>
                  <td>
                    <span>{listing.inquiries}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="progress-track" style={{ width: 60 }}>
                        <div className="progress-fill" style={{ width: `${(listing.currentSubTenants / listing.maxSubTenants) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: 12 }}>{listing.currentSubTenants}/{listing.maxSubTenants}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${statusConfig[listing.status].className}`}>
                      {statusConfig[listing.status].icon}
                      {statusConfig[listing.status].label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" style={{ width: 28, height: 28 }} title={t('common.view')}>
                        <Eye size={13} />
                      </button>
                      <button className="btn-icon" style={{ width: 28, height: 28 }} title={t('common.edit')}>
                        <Edit3 size={13} />
                      </button>
                      <button className="btn-icon" style={{ width: 28, height: 28, color: 'var(--color-negative)' }} title={t('common.delete')}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
