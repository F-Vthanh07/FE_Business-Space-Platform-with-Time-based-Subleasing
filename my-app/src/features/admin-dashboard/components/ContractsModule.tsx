import React, { useEffect, useMemo, useState } from 'react';
import { Search, ScrollText, Eye, X, MapPin, CalendarClock, Wallet } from 'lucide-react';
import type { AdminContractItem, AdminSpaceItem, UserAccount } from '../types';
import { RefreshButton } from './RefreshButton';

interface ContractsModuleProps {
  contracts: AdminContractItem[];
  spaces: AdminSpaceItem[];
  users: UserAccount[];
  language: 'en' | 'vi';
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const ITEMS_PER_PAGE = 8;

type StatusFilter = 'all' | 'Pending' | 'Active' | 'Expired' | 'Cancelled';

const statusFilters: StatusFilter[] = ['all', 'Pending', 'Active', 'Expired', 'Cancelled'];

const statusConfig: Record<string, { className: string; label: { en: string; vi: string } }> = {
  pending: { className: 'badge--warning', label: { en: 'Pending', vi: 'Chờ hiệu lực' } },
  active: { className: 'badge--positive', label: { en: 'Active', vi: 'Đang hiệu lực' } },
  expired: { className: 'badge--negative', label: { en: 'Expired', vi: 'Hết hạn' } },
  cancelled: { className: 'badge--negative', label: { en: 'Cancelled', vi: 'Đã hủy' } },
};

const getStatus = (status: string) => statusConfig[(status || '').toLowerCase()] || statusConfig.pending;

export const ContractsModule: React.FC<ContractsModuleProps> = ({ contracts, spaces, users, language, onRefresh, isRefreshing }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedContract, setSelectedContract] = useState<AdminContractItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const findSpace = (spaceId: number) => spaces.find(s => s.id === spaceId);
  const findUser = (userId?: string) => (userId ? users.find(u => u.id === userId) : undefined);

  const formatMoney = (n: number) => `${(n || 0).toLocaleString('vi-VN')}₫`;
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return language === 'en' ? 'Unknown' : 'Không rõ';
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
  };

  const now = Date.now();
  const expiringSoonCount = useMemo(() => {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    return contracts.filter(c => {
      if ((c.status || '').toLowerCase() !== 'active') return false;
      const end = new Date(c.endDate).getTime();
      return !isNaN(end) && end - now <= THIRTY_DAYS && end - now > 0;
    }).length;
  }, [contracts, now]);

  const activeCount = useMemo(() => contracts.filter(c => (c.status || '').toLowerCase() === 'active').length, [contracts]);

  const filteredContracts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contracts.filter(c => {
      if (statusFilter !== 'all' && (c.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (!q) return true;
      const space = findSpace(c.spaceId);
      const lessee = findUser(c.lesseeId);
      const lessor = findUser(c.lessorId);
      return (
        (space?.name || '').toLowerCase().includes(q) ||
        (space?.address || '').toLowerCase().includes(q) ||
        (lessee?.profileFullName || lessee?.name || lessee?.email || '').toLowerCase().includes(q) ||
        (lessor?.profileFullName || lessor?.name || lessor?.email || '').toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts, search, statusFilter, spaces, users]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / ITEMS_PER_PAGE));
  const pagedContracts = filteredContracts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredContracts.length]);

  const goToPage = (page: number) => setCurrentPage(Math.min(Math.max(page, 1), totalPages));

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <div>
          <h1>{language === 'en' ? 'Contract Management' : 'Quản lý Hợp đồng'}</h1>
          <p>{language === 'en' ? 'Primary rental contracts between owners and renters' : 'Hợp đồng thuê sơ cấp giữa chủ mặt bằng và người thuê'}</p>
        </div>
        <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} language={language} />
      </header>

      {/* Summary Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper blue"><ScrollText size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL CONTRACTS' : 'TỔNG HỢP ĐỒNG'}</span>
            <h2 className="stat-value">{contracts.length}</h2>
          </div>
        </div>
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><ScrollText size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE CONTRACTS' : 'ĐANG HIỆU LỰC'}</span>
            <h2 className="stat-value">{activeCount}</h2>
          </div>
        </div>
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper orange"><CalendarClock size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'EXPIRING WITHIN 30 DAYS' : 'SẮP HẾT HẠN (30 NGÀY)'}</span>
            <h2 className="stat-value">{expiringSoonCount}</h2>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="admin-listings-controls glass-card">
        <div className="listings-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by space, lessor, lessee, contract ID...' : 'Tìm theo mặt bằng, chủ nhà, người thuê, mã hợp đồng...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {statusFilters.map(f => (
          <button
            key={f}
            className={`btn-ghost ${statusFilter === f ? 'admin-tab--active' : ''}`}
            onClick={() => setStatusFilter(f)}
          >
            {f === 'all' ? (language === 'en' ? 'All' : 'Tất cả') : getStatus(f).label[language]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{language === 'en' ? 'Space' : 'Mặt bằng'}</th>
              <th>{language === 'en' ? 'Lessee' : 'Người thuê'}</th>
              <th>{language === 'en' ? 'Duration' : 'Thời hạn'}</th>
              <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Price' : 'Giá thuê'}</th>
              <th>{language === 'en' ? 'Status' : 'Trạng thái'}</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedContracts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  {language === 'en' ? 'No contracts found.' : 'Không tìm thấy hợp đồng nào.'}
                </td>
              </tr>
            ) : (
              pagedContracts.map(c => {
                const space = findSpace(c.spaceId);
                const lessee = findUser(c.lesseeId);
                return (
                  <tr key={c.id}>
                    <td className="font-mono">#{c.id}</td>
                    <td>{space?.name || `Space #${c.spaceId}`}</td>
                    <td>{lessee?.profileFullName || lessee?.name || lessee?.email || '—'}</td>
                    <td className="font-mono">{formatDate(c.startDate)} → {formatDate(c.endDate)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <strong className="text-neon-green">{formatMoney(c.price)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${getStatus(c.status).className}`}>{getStatus(c.status).label[language]}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          className="btn-action-icon unblock"
                          onClick={() => setSelectedContract(c)}
                          title={language === 'en' ? 'View details' : 'Xem chi tiết'}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredContracts.length > 0 && totalPages > 1 && (
        <div className="admin-pagination">
          <button className="btn-icon" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`admin-pagination-page ${page === currentPage ? 'admin-pagination-page--active' : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}
          <button className="btn-icon" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
            ›
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedContract && (() => {
        const space = findSpace(selectedContract.spaceId);
        const lessee = findUser(selectedContract.lesseeId);
        const lessor = findUser(selectedContract.lessorId);
        return (
          <div className="listing-detail-backdrop">
            <div className="listing-detail-modal glass-card">
              <div className="listing-detail-header">
                <div className="title-area">
                  <h2 className="title-text">
                    {language === 'en' ? 'Contract Details' : 'Chi tiết Hợp đồng'} #{selectedContract.id}
                  </h2>
                  <p className="subtitle-text">{space?.name || `Space #${selectedContract.spaceId}`}</p>
                </div>
                <button className="btn-icon close-btn" onClick={() => setSelectedContract(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="listing-detail-body">
                <div className="detail-left-col">
                  <div className="detail-desc-card glass-card--inset">
                    <h3>{language === 'en' ? 'Space' : 'Mặt bằng'}</h3>
                    <p className="desc-content">
                      <MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {space?.address || (language === 'en' ? 'Not available' : 'Không có dữ liệu')}
                    </p>
                    <p className="desc-content">{language === 'en' ? 'Area rented' : 'Diện tích thuê'}: {selectedContract.acreage?.toLocaleString('vi-VN')} m²</p>
                  </div>

                  <div className="detail-category-card glass-card--inset">
                    <h3>{language === 'en' ? 'Parties' : 'Các bên liên quan'}</h3>
                    <p className="desc-content"><strong>{language === 'en' ? 'Lessor (Owner):' : 'Bên cho thuê:'}</strong> {lessor?.profileFullName || lessor?.name || lessor?.email || '—'}</p>
                    <p className="desc-content"><strong>{language === 'en' ? 'Lessor ID card:' : 'CCCD chủ nhà:'}</strong> {selectedContract.lessorNumberCard || '—'}</p>
                    <p className="desc-content"><strong>{language === 'en' ? 'Lessee (Renter):' : 'Bên thuê:'}</strong> {lessee?.profileFullName || lessee?.name || lessee?.email || '—'}</p>
                    <p className="desc-content"><strong>{language === 'en' ? 'Lessee ID card:' : 'CCCD người thuê:'}</strong> {selectedContract.lesseeNumberCard || '—'}</p>
                  </div>

                  {selectedContract.description && (
                    <div className="detail-desc-card glass-card--inset">
                      <h3>{language === 'en' ? 'Terms & Description' : 'Điều khoản / Mô tả'}</h3>
                      <p className="desc-content">{selectedContract.description}</p>
                    </div>
                  )}
                </div>

                <div className="detail-right-col">
                  <div className="detail-section">
                    <h3 className="section-title">{language === 'en' ? 'Duration & Status' : 'Thời hạn & Trạng thái'}</h3>
                    <div className="detail-desc-card glass-card--inset">
                      <p className="desc-content">
                        <CalendarClock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {formatDate(selectedContract.startDate)} → {formatDate(selectedContract.endDate)}
                      </p>
                      <p className="desc-content">{language === 'en' ? 'Duration' : 'Thời hạn'}: {selectedContract.duration}</p>
                      <p className="desc-content">
                        <span className={`badge ${getStatus(selectedContract.status).className}`}>
                          {getStatus(selectedContract.status).label[language]}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3 className="section-title">{language === 'en' ? 'Financials' : 'Tài chính'}</h3>
                    <div className="detail-desc-card glass-card--inset">
                      <p className="desc-content">
                        <Wallet size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {language === 'en' ? 'Rental price' : 'Giá thuê'}: <strong className="text-neon-green">{formatMoney(selectedContract.price)}</strong>
                      </p>
                      <p className="desc-content">{language === 'en' ? 'Deposit' : 'Đặt cọc'}: {formatMoney(selectedContract.depositAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="listing-detail-footer" style={{ justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setSelectedContract(null)}>
                  {language === 'en' ? 'Close Panel' : 'Đóng cửa sổ'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
