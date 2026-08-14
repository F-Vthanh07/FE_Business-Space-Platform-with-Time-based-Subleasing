import React, { useEffect, useMemo, useState } from 'react';
import { Search, ArrowUpDown, Wallet, Edit3, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminWalletAccount } from '../types';
import { RefreshButton } from './RefreshButton';

const ITEMS_PER_PAGE = 10;

interface WalletsModuleProps {
  wallets: AdminWalletAccount[];
  language: 'en' | 'vi';
  handleUpdateWalletBalance: (userId: string, amount: number) => Promise<void>;
  isLoading?: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

type SortOrder = 'desc' | 'asc';

export const WalletsModule: React.FC<WalletsModuleProps> = ({ wallets, language, handleUpdateWalletBalance, isLoading, onRefresh, isRefreshing }) => {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<AdminWalletAccount | null>(null);
  const [amount, setAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const formatMoney = (n: number) => `${n.toLocaleString('vi-VN')}₫`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return language === 'en' ? 'Unknown' : 'Không rõ';
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
  };

  const totalBalance = useMemo(() => wallets.reduce((sum, w) => sum + (w.balance || 0), 0), [wallets]);

  const filteredWallets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? wallets.filter(w =>
          (w.user?.email || '').toLowerCase().includes(q) ||
          (w.user?.userName || '').toLowerCase().includes(q) ||
          (w.user?.profileFullName || '').toLowerCase().includes(q) ||
          (w.user?.phoneNumber || '').toLowerCase().includes(q)
        )
      : wallets;

    return [...filtered].sort((a, b) =>
      sortOrder === 'desc' ? b.balance - a.balance : a.balance - b.balance
    );
  }, [wallets, search, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredWallets.length / ITEMS_PER_PAGE));
  const pagedWallets = filteredWallets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder, wallets.length]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const handleOpenEdit = (wallet: AdminWalletAccount) => {
    setSelectedWallet(wallet);
    setAmount('');
    setIsEditModalOpen(true);
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet?.user?.userId) return;
    const amountValue = Number(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert(language === 'en' ? 'Please enter a valid amount' : 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    try {
      await handleUpdateWalletBalance(selectedWallet.user.userId, amountValue);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <div>
          <h1>{language === 'en' ? 'Wallet Management' : 'Quản lý Ví'}</h1>
          <p>{language === 'en' ? 'Track user wallet balances across the platform' : 'Theo dõi số dư ví của người dùng trên toàn hệ thống'}</p>
        </div>
        <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} language={language} />
      </header>

      {/* Summary Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><Wallet size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL WALLETS' : 'TỔNG SỐ VÍ'}</span>
            <h2 className="stat-value">{wallets.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper purple"><Wallet size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL BALANCE' : 'TỔNG SỐ DƯ HỆ THỐNG'}</span>
            <h2 className="stat-value">{formatMoney(totalBalance)}</h2>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="admin-listings-controls glass-card">
        <div className="listings-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by name, email, phone...' : 'Tìm theo tên, email, số điện thoại...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <button
          className="btn-ghost"
          onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
        >
          <ArrowUpDown size={14} />
          {sortOrder === 'desc'
            ? (language === 'en' ? 'Balance: High to Low' : 'Số dư: Cao đến thấp')
            : (language === 'en' ? 'Balance: Low to High' : 'Số dư: Thấp đến cao')}
        </button>
      </div>

      {/* Table */}
      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{language === 'en' ? 'Wallet Owner' : 'Chủ ví'}</th>
              <th>Email</th>
              <th>{language === 'en' ? 'Phone' : 'Số điện thoại'}</th>
              <th>{language === 'en' ? 'Role' : 'Vai trò'}</th>
              <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Balance' : 'Số dư'}</th>
              <th>{language === 'en' ? 'Last Updated' : 'Cập nhật gần nhất'}</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWallets.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  {language === 'en' ? 'No wallets found.' : 'Không tìm thấy ví nào.'}
                </td>
              </tr>
            ) : (
              pagedWallets.map(w => {
                const displayName = w.user?.profileFullName || w.user?.userName || w.user?.email || (language === 'en' ? 'Unknown user' : 'Chưa rõ');
                return (
                  <tr key={w.id}>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar-mini">
                          {w.user?.profileAvatarUrl ? (
                            <img src={w.user.profileAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            displayName[0]?.toUpperCase()
                          )}
                        </div>
                        <span className="user-name">{displayName}</span>
                      </div>
                    </td>
                    <td>{w.user?.email || '—'}</td>
                    <td>{w.user?.phoneNumber || '—'}</td>
                    <td>
                      <span className={`badge-role ${(w.user?.role || '').toLowerCase()}`}>{w.user?.role || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <strong className="text-neon-green">{formatMoney(w.balance)}</strong>
                    </td>
                    <td className="font-mono">{formatDate(w.updatedAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          className="btn-action-icon unblock"
                          onClick={() => handleOpenEdit(w)}
                          title={language === 'en' ? 'Add funds' : 'Cộng tiền'}
                          disabled={isLoading || !w.user?.userId}
                        >
                          <Edit3 size={14} />
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
      {filteredWallets.length > 0 && totalPages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="btn-icon"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            title={language === 'en' ? 'Previous' : 'Trang trước'}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              type="button"
              key={page}
              className={`admin-pagination-page ${page === currentPage ? 'admin-pagination-page--active' : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="btn-icon"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            title={language === 'en' ? 'Next' : 'Trang sau'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Top-up Balance Modal */}
      {isEditModalOpen && selectedWallet && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Add Funds to Wallet' : 'Cộng tiền vào ví'}
              </h2>
              <button className="btn-icon" onClick={() => setIsEditModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {selectedWallet.user?.profileFullName || selectedWallet.user?.userName || selectedWallet.user?.email}
              {' — '}
              {language === 'en' ? 'Current balance: ' : 'Số dư hiện tại: '}
              <strong className="text-neon-green">{formatMoney(selectedWallet.balance)}</strong>
            </p>

            <form onSubmit={onEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>
                  {language === 'en' ? 'Amount to add (VND)' : 'Số tiền cộng thêm (VNĐ)'} <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="number"
                  className="slot-input-text"
                  style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  autoFocus
                  placeholder="0"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn-ghost" onClick={() => setIsEditModalOpen(false)}>
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0 20px' }} disabled={isLoading}>
                  {language === 'en' ? 'Add Funds' : 'Cộng tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
