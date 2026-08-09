import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, Mail, MapPin, Wallet, CalendarDays, User as UserIcon, Briefcase } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';

interface ContractDetail {
  id: number;
  spaceId: number;
  lessorId: string;
  lesseeId: string;
  price: number;
  depositAmount: number;
  duration: number;
  durationUnit: string;
  startDate: string;
  endDate: string;
  status: string;
  acreage?: number;
}

interface TenantUser {
  phoneNumber?: string;
  email?: string;
  profileFullName?: string;
  userName?: string;
}

interface SpaceDetail {
  id: number;
  name: string;
  address: string;
  city: string;
  area: number;
}

interface ContractDetailModalProps {
  contractId: number;
  color: string;
  onClose: () => void;
}

const formatCurrency = (value?: number) =>
  value || value === 0 ? `${value.toLocaleString('vi-VN')} VNĐ` : '...';

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '...';

const formatDurationUnit = (unit?: string, language?: string) => {
  const map: Record<string, [string, string]> = {
    Days: ['days', 'ngày'],
    Weeks: ['weeks', 'tuần'],
    Months: ['months', 'tháng'],
    Years: ['years', 'năm'],
  };
  if (!unit || !map[unit]) return unit || '';
  return language === 'en' ? map[unit][0] : map[unit][1];
};

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contractId,
  color,
  onClose,
}) => {
  const { language } = useThemeLanguage();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [tenant, setTenant] = useState<TenantUser | null>(null);
  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchDetail = async () => {
      setIsLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('portal_token');
        const headers = { Authorization: `Bearer ${token}`, accept: '*/*' };

        const contractRes = await fetch(`${API_BASE_URL}/api/Contract/GetById/${contractId}`, { headers });
        if (!contractRes.ok) throw new Error('not-found');
        const contractData: ContractDetail = await contractRes.json();
        if (cancelled) return;
        setContract(contractData);

        const lesseeId = contractData.lesseeId;
        const spaceId = contractData.spaceId;

        const [userRes, spaceRes] = await Promise.all([
          lesseeId ? fetch(`${API_BASE_URL}/api/User/${lesseeId}`, { headers }) : Promise.resolve(null),
          spaceId != null ? fetch(`${API_BASE_URL}/api/Space/GetById/${spaceId}`, { headers }) : Promise.resolve(null),
        ]);

        if (userRes?.ok) {
          const userData = await userRes.json();
          if (!cancelled) setTenant(userData);
        }
        if (spaceRes?.ok) {
          const spaceData = await spaceRes.json();
          if (!cancelled) setSpace(spaceData);
        }
      } catch {
        if (!cancelled) {
          setError(language === 'en' ? 'Unable to load contract details.' : 'Không thể tải chi tiết hợp đồng.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [contractId, language]);

  const tenantName = tenant?.profileFullName || tenant?.userName || '';

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        zIndex: 100000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {language === 'en' ? 'Contract' : 'Hợp đồng'} #{contractId}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isLoading && (
            <p className="text-secondary" style={{ fontSize: 13, textAlign: 'center', margin: '20px 0' }}>
              {language === 'en' ? 'Loading...' : 'Đang tải...'}
            </p>
          )}

          {!isLoading && error && (
            <p style={{ fontSize: 13, textAlign: 'center', margin: '20px 0', color: 'var(--color-negative)' }}>
              {error}
            </p>
          )}

          {!isLoading && !error && contract && (
            <>
              <div>
                <p className="label-caps" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserIcon size={12} /> {language === 'en' ? 'Tenant' : 'Người thuê'}
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px 0' }}>
                  {tenantName || (language === 'en' ? 'Unknown tenant' : 'Chưa xác định')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="text-secondary">
                    <Phone size={13} /> {tenant?.phoneNumber || (language === 'en' ? 'Not available' : 'Chưa có dữ liệu')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="text-secondary">
                    <Mail size={13} /> {tenant?.email || (language === 'en' ? 'Not available' : 'Chưa có dữ liệu')}
                  </span>
                </div>
              </div>

              <div>
                <p className="label-caps" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} /> {language === 'en' ? 'Space' : 'Mặt bằng'}
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px 0' }}>
                  {space?.name || `#${contract.spaceId}`}
                </p>
                <p className="text-secondary" style={{ fontSize: 13, margin: 0 }}>
                  {space ? `${space.address}, ${space.city}` : (language === 'en' ? 'Loading address...' : 'Đang tải địa chỉ...')}
                  {space?.area ? ` • ${space.area} m²` : ''}
                </p>
              </div>

              <div>
                <p className="label-caps" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wallet size={12} /> {language === 'en' ? 'Financials' : 'Tài chính'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <span className="text-secondary">{language === 'en' ? 'Rent' : 'Giá thuê'}: <strong style={{ color: 'var(--color-positive)' }}>{formatCurrency(contract.price)}</strong></span>
                  <span className="text-secondary">{language === 'en' ? 'Deposit' : 'Đặt cọc'}: <strong>{formatCurrency(contract.depositAmount)}</strong></span>
                </div>
              </div>

              <div>
                <p className="label-caps" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={12} /> {language === 'en' ? 'Duration' : 'Thời hạn'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <span className="text-secondary">{language === 'en' ? 'Start' : 'Bắt đầu'}: <strong>{formatDate(contract.startDate)}</strong></span>
                  <span className="text-secondary">{language === 'en' ? 'End' : 'Kết thúc'}: <strong>{formatDate(contract.endDate)}</strong></span>
                  <span className="text-secondary" style={{ gridColumn: '1 / -1' }}>
                    {language === 'en' ? 'Term' : 'Thời hạn HĐ'}: <strong>{contract.duration} {formatDurationUnit(contract.durationUnit, language)}</strong>
                  </span>
                </div>
              </div>

              <div>
                <p className="label-caps" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={12} /> {language === 'en' ? 'Status' : 'Trạng thái'}
                </p>
                <span
                  className="badge"
                  style={{ background: `${color}26`, color, border: `1px solid ${color}30` }}
                >
                  {contract.status}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
