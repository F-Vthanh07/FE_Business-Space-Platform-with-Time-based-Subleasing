import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, Inbox } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { fetchTransactionHistory } from '../api/wallet.api';
import type { TransactionHistoryItem } from '../types';
import { TransactionHistoryRow } from './TransactionHistoryRow';
import '../wallet.css';

interface WalletHistoryProps {
  onNavigate: (page: 'wallet') => void;
}

export const WalletHistory: React.FC<WalletHistoryProps> = ({ onNavigate }) => {
  const { t } = useThemeLanguage();
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('portal_token') || '';
    fetchTransactionHistory(token)
      .then((data) => setTransactions([...data].sort((a, b) => b.id - a.id)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Lỗi tải lịch sử giao dịch'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return transactions;
    return transactions.filter((txn) => (
      String(txn.id).includes(q) || (txn.description || '').toLowerCase().includes(q)
    ));
  }, [search, transactions]);

  return (
    <div className="wallet-page animate-in">
      <div className="page-header">
        <div>
          <button className="btn-ghost" style={{ marginBottom: 12 }} onClick={() => onNavigate('wallet')}>
            <ChevronLeft size={14} />
            {t('wallet.title')}
          </button>
          <h1 className="page-title">{t('wallet.history.title')}</h1>
          <p className="page-subtitle text-secondary">{t('wallet.history.subtitle')}</p>
        </div>
      </div>

      <div className="history-controls glass-card">
        <div className="history-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            className="search-input"
            placeholder={t('wallet.history.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
        {isLoading ? (
          <div className="wallet-empty-state">
            <p className="text-secondary" style={{ fontSize: 13 }}>...</p>
          </div>
        ) : error ? (
          <div className="wallet-empty-state">
            <p className="text-secondary" style={{ fontSize: 13 }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="wallet-empty-state">
            <div className="wallet-empty-icon">
              <Inbox size={24} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>{t('wallet.noTransactionsYet')}</h3>
            <p className="text-secondary" style={{ fontSize: 13, maxWidth: 320 }}>{t('wallet.noTransactionsDesc')}</p>
          </div>
        ) : (
          <div className="txn-list">
            {filtered.map((txn) => (
              <TransactionHistoryRow key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
