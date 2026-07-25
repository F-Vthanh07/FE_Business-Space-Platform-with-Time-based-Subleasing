/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Phone,
  Mail,
  Building2,
  TrendingUp,
  FileText,
  Eye,
  X,
  MapPin,
} from 'lucide-react';
import { useThemeLanguage } from '../../../../context/ThemeLanguageContext';
import { ContractViewModal } from '../../../../components/Contract/ContractViewModal';
import '../../../shared/ModalShell.css';
import './OwnerTenants.css';

const API_BASE = 'https://flexi-space-capstone-project.onrender.com';

type ContractStatus = 'Active' | 'Draft' | 'Expired' | 'Cancelled';

interface Tenant {
  contractId: number;
  lesseeId: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  spaceId: number;
  space: string;
  spaceAddress: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: ContractStatus;
  contract: any;
}

const statusConfig: Record<ContractStatus, { className: string; icon: React.ReactNode }> = {
  Active: { className: 'badge--positive', icon: <CheckCircle2 size={11} /> },
  Draft: { className: 'badge--warning', icon: <Clock size={11} /> },
  Expired: { className: 'badge--neutral', icon: <XCircle size={11} /> },
  Cancelled: { className: 'badge--negative', icon: <Ban size={11} /> },
};

const normalizeList = (data: any) => (Array.isArray(data) ? data : data?.data || data?.items || []);

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase() || '??';

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('vi-VN') : '...');

const monthsBetween = (start?: string, end?: string) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30)));
};

const monthsElapsed = (start?: string) => {
  if (!start) return 0;
  const s = new Date(start);
  const now = new Date();
  return Math.max(0, Math.round((now.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30)));
};

export const OwnerTenants: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ContractStatus>('all');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingContract, setViewingContract] = useState<any>(null);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);
  const { t, language } = useThemeLanguage();

  const token = localStorage.getItem('portal_token');
  const currentUserId = localStorage.getItem('current_user_id');

  const getStatusLabel = (status: ContractStatus) => {
    switch (status) {
      case 'Active': return language === 'en' ? 'Signed' : 'Đã ký';
      case 'Draft': return language === 'en' ? 'Unsigned' : 'Chưa ký';
      case 'Expired': return language === 'en' ? 'Expired' : 'Hết hạn';
      case 'Cancelled': return language === 'en' ? 'Cancelled' : 'Đã huỷ';
    }
  };

  // Thời hạn hợp đồng còn lại theo % — dùng để đổi màu thanh tiến độ,
  // càng gần hết hạn càng ngả từ vàng sang đỏ (cảnh báo cần gia hạn/xử lý).
  const getUrgencyColor = (remainingRatio: number, status: ContractStatus) => {
    if (status !== 'Active') return 'var(--color-text-muted)';
    if (remainingRatio <= 0.15) return 'var(--color-negative)';
    if (remainingRatio <= 0.4) return 'var(--color-gold)';
    return 'var(--color-positive)';
  };

  useEffect(() => {
    const fetchTenants = async () => {
      if (!token || !currentUserId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [contractRes, spaceRes] = await Promise.all([
          fetch(`${API_BASE}/api/Contract/GetAll?LessorId=${encodeURIComponent(currentUserId)}`, {
            headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
          }),
          fetch(`${API_BASE}/api/Space/GetAll?OwnerId=${encodeURIComponent(currentUserId)}`, {
            headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
          }),
        ]);

        const contracts = contractRes.ok ? normalizeList(await contractRes.json()) : [];
        const spaces = spaceRes.ok ? normalizeList(await spaceRes.json()) : [];
        const spaceMap = new Map<number, any>(spaces.map((s: any) => [s.id ?? s.Id, s]));

        // Contract GetAll không trả tên/sđt/email người thuê, nên phải gọi riêng User/{id}
        // cho từng lesseeId duy nhất (tránh gọi trùng nếu 1 người thuê nhiều hợp đồng).
        const uniqueLesseeIds = Array.from(new Set(contracts.map((c: any) => c.lesseeId ?? c.LesseeId).filter(Boolean)));
        const userEntries = await Promise.all(
          uniqueLesseeIds.map(async (id) => {
            try {
              const res = await fetch(`${API_BASE}/api/User/${id}`, {
                headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
              });
              if (!res.ok) return [id, null] as const;
              return [id, await res.json()] as const;
            } catch {
              return [id, null] as const;
            }
          })
        );
        const userMap = new Map(userEntries);

        const list: Tenant[] = contracts.map((c: any) => {
          const lesseeId = c.lesseeId ?? c.LesseeId;
          const spaceId = c.spaceId ?? c.SpaceId;
          const user = userMap.get(lesseeId);
          const space = spaceMap.get(spaceId);
          const name = user?.profileFullName || user?.userName || (language === 'en' ? `Tenant #${lesseeId}` : `Người thuê #${lesseeId}`);

          return {
            contractId: c.id ?? c.Id,
            lesseeId,
            name,
            initials: getInitials(name),
            phone: user?.phoneNumber || '',
            email: user?.email || '',
            spaceId,
            space: space?.name || (language === 'en' ? `Space #${spaceId}` : `Mặt bằng #${spaceId}`),
            spaceAddress: space?.address || (language === 'en' ? 'Not updated' : 'Chưa cập nhật địa chỉ'),
            startDate: c.startDate ?? c.StartDate,
            endDate: c.endDate ?? c.EndDate,
            monthlyRent: c.price ?? c.Price ?? 0,
            status: (c.status ?? c.Status ?? 'Draft') as ContractStatus,
            contract: c,
          };
        });

        list.sort((a, b) => b.contractId - a.contractId);
        setTenants(list);
      } catch (err) {
        console.error('Lỗi tải danh sách người thuê:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [token, currentUserId, language]);

  const filtered = tenants.filter((tenant) => {
    const matchSearch =
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.space.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'all' || tenant.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const activeTenants = tenants.filter((t) => t.status === 'Active');
  const totalRevenue = activeTenants.reduce((sum, t) => sum + t.monthlyRent, 0);
  const needsAttentionCount = tenants.filter((t) => t.status === 'Draft' || t.status === 'Cancelled').length;

  return (
    <div className="owner-tenants animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('tenants.monthlyTenants')}</h1>
          <p className="page-subtitle text-secondary">{t('tenants.tenantsSubtitle')}</p>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="tenants-summary">
        {[
          { label: language === 'en' ? 'Total Tenants' : 'Tổng người thuê', value: tenants.length, sub: t('tenants.current'), color: 'var(--color-accent)' },
          { label: t('tenants.revenueThisMonth'), value: (totalRevenue / 1000000).toFixed(1) + (language === 'en' ? 'M VND' : 'tr ₫'), sub: t('tenants.fromAllContracts'), color: 'var(--color-positive)' },
          { label: getStatusLabel('Active'), value: activeTenants.length, sub: language === 'en' ? 'contracts' : 'hợp đồng', color: 'var(--color-positive)' },
          { label: language === 'en' ? 'Needs attention' : 'Cần chú ý', value: needsAttentionCount, sub: t('tenants.needAction'), color: 'var(--color-gold)' },
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
          {(['all', 'Active', 'Draft', 'Expired', 'Cancelled'] as const).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filterStatus === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === 'all' ? t('listings.all') : getStatusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="loading-state text-secondary">
          <Clock size={20} />
          <span>{t('spaces.loading') || 'Đang tải...'}</span>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          {language === 'en' ? 'No tenants found yet.' : 'Chưa có người thuê nào.'}
        </div>
      )}

      {/* Tenant Cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="tenants-grid">
          {filtered.map((tenant, i) => {
            const total = monthsBetween(tenant.startDate, tenant.endDate);
            const elapsed = Math.min(total, monthsElapsed(tenant.startDate));
            const remaining = Math.max(0, total - elapsed);
            const remainingRatio = total > 0 ? remaining / total : 1;
            const urgencyColor = getUrgencyColor(remainingRatio, tenant.status);

            return (
              <div key={tenant.contractId} className={`glass-card tenant-card animate-in delay-${Math.min(i + 1, 6)}`}>
                {/* Card Header */}
                <div className="tenant-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar avatar--lg" style={{ background: `linear-gradient(135deg, hsl(${tenant.contractId * 60}, 65%, 50%), hsl(${tenant.contractId * 60 + 40}, 65%, 40%))` }}>
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
                    <span className={`badge ${statusConfig[tenant.status].className}`}>
                      {statusConfig[tenant.status].icon}
                      {getStatusLabel(tenant.status)}
                    </span>
                  </div>
                </div>

                {/* Contract Progress */}
                <div className="tenant-progress-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="label-caps">{t('tenants.contractProgress')}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {t('tenants.remainingMonths', { rem: remaining, total })}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${total > 0 ? (elapsed / total) * 100 : 0}%`,
                        background: urgencyColor,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span className="text-secondary" style={{ fontSize: 11 }}>{t('tenants.contractStart', { date: formatDate(tenant.startDate) })}</span>
                    <span className="text-secondary" style={{ fontSize: 11 }}>{t('tenants.contractEnd', { date: formatDate(tenant.endDate) })}</span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="tenant-info-grid">
                  <div className="tenant-info-item">
                    <span className="label-caps">{t('tenants.monthlyRent')}</span>
                    <span className="tenant-info-value" style={{ color: 'var(--color-positive)' }}>
                      <TrendingUp size={14} /> {tenant.monthlyRent.toLocaleString('vi-VN')}₫
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
                  {tenant.phone ? (
                    <a href={`tel:${tenant.phone}`} className="tenant-contact-item">
                      <Phone size={13} />
                      <span>{tenant.phone}</span>
                    </a>
                  ) : (
                    <span className="tenant-contact-item text-muted">
                      <Phone size={13} />
                      <span>{language === 'en' ? 'No phone' : 'Chưa có SĐT'}</span>
                    </span>
                  )}
                  {tenant.email ? (
                    <a href={`mailto:${tenant.email}`} className="tenant-contact-item">
                      <Mail size={13} />
                      <span>{tenant.email}</span>
                    </a>
                  ) : (
                    <span className="tenant-contact-item text-muted">
                      <Mail size={13} />
                      <span>{language === 'en' ? 'No email' : 'Chưa có email'}</span>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="tenant-card-actions">
                  <button
                    className="btn-ghost"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                    onClick={() => setViewingTenant(tenant)}
                  >
                    <Eye size={13} />
                    {language === 'en' ? 'View Detail' : 'Xem chi tiết'}
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                    onClick={() => setViewingContract(tenant.contract)}
                  >
                    <FileText size={13} />
                    {t('tenants.contract')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingTenant && (() => {
        const total = monthsBetween(viewingTenant.startDate, viewingTenant.endDate);
        const elapsed = Math.min(total, monthsElapsed(viewingTenant.startDate));
        const remaining = Math.max(0, total - elapsed);
        const remainingRatio = total > 0 ? remaining / total : 1;
        const urgencyColor = getUrgencyColor(remainingRatio, viewingTenant.status);

        return createPortal(
          <div className="modal-backdrop" onClick={() => setViewingTenant(null)}>
            <div className="modal-shell" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-area">
                  <div className="avatar avatar--lg" style={{ background: `linear-gradient(135deg, hsl(${viewingTenant.contractId * 60}, 65%, 50%), hsl(${viewingTenant.contractId * 60 + 40}, 65%, 40%))` }}>
                    {viewingTenant.initials}
                  </div>
                  <div>
                    <h3 className="modal-title">{viewingTenant.name}</h3>
                    <p className="modal-subtitle text-secondary">{viewingTenant.space}</p>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => setViewingTenant(null)}>
                  <X size={16} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-section">
                  <div className="form-section-title">{language === 'en' ? 'Contract status' : 'Trạng thái hợp đồng'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge ${statusConfig[viewingTenant.status].className}`}>
                      {statusConfig[viewingTenant.status].icon}
                      {getStatusLabel(viewingTenant.status)}
                    </span>
                    {viewingTenant.status === 'Active' && (
                      <span className="text-secondary" style={{ fontSize: 12 }}>
                        {t('tenants.remainingMonths', { rem: remaining, total })}
                      </span>
                    )}
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${total > 0 ? (elapsed / total) * 100 : 0}%`,
                        background: urgencyColor,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary" style={{ fontSize: 11 }}>{t('tenants.contractStart', { date: formatDate(viewingTenant.startDate) })}</span>
                    <span className="text-secondary" style={{ fontSize: 11 }}>{t('tenants.contractEnd', { date: formatDate(viewingTenant.endDate) })}</span>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-title">{language === 'en' ? 'Space information' : 'Thông tin mặt bằng'}</div>
                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">
                      <Building2 size={12} />
                      {language === 'en' ? 'Space' : 'Mặt bằng'}
                    </span>
                    <span className="tenant-detail-value">{viewingTenant.space}</span>
                  </div>
                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">
                      <MapPin size={12} />
                      {t('tenants.addressLabel')}
                    </span>
                    <span className="tenant-detail-value">{viewingTenant.spaceAddress}</span>
                  </div>
                  <div className="tenant-detail-row">
                    <span className="tenant-detail-label">{t('tenants.monthlyRent')}</span>
                    <span className="tenant-detail-value" style={{ color: 'var(--color-positive)', fontWeight: 700 }}>
                      {viewingTenant.monthlyRent.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-title">{language === 'en' ? 'Contact' : 'Liên hệ'}</div>
                  <div className="tenant-contact" style={{ padding: 0, border: 'none' }}>
                    {viewingTenant.phone ? (
                      <a href={`tel:${viewingTenant.phone}`} className="tenant-contact-item">
                        <Phone size={13} />
                        <span>{viewingTenant.phone}</span>
                      </a>
                    ) : (
                      <span className="tenant-contact-item text-muted">
                        <Phone size={13} />
                        <span>{language === 'en' ? 'No phone' : 'Chưa có SĐT'}</span>
                      </span>
                    )}
                    {viewingTenant.email ? (
                      <a href={`mailto:${viewingTenant.email}`} className="tenant-contact-item">
                        <Mail size={13} />
                        <span>{viewingTenant.email}</span>
                      </a>
                    ) : (
                      <span className="tenant-contact-item text-muted">
                        <Mail size={13} />
                        <span>{language === 'en' ? 'No email' : 'Chưa có email'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button className="btn-ghost cancel-btn" onClick={() => setViewingTenant(null)}>
                  {language === 'en' ? 'Close' : 'Đóng'}
                </button>
                <button
                  className="btn-primary submit-btn"
                  onClick={() => { setViewingContract(viewingTenant.contract); setViewingTenant(null); }}
                >
                  <FileText size={14} /> {t('tenants.contract')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {viewingContract && (
        <ContractViewModal
          contract={viewingContract}
          onClose={() => setViewingContract(null)}
          isLessor
        />
      )}
    </div>
  );
};
