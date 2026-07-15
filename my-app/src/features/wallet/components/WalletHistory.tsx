import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, Inbox } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { mockTransactions } from '../utils/mockData';
import type { TransactionType } from '../types';
import { TransactionRow } from './TransactionRow';
import '../wallet.css';

interface WalletHistoryProps {
  onNavigate: (page: 'wallet') => void;
}

type FilterType = 'all' | TransactionType;

export const WalletHistory: React.FC<WalletHistoryProps> = ({ onNavigate }) => {
  const { t } = useThemeLanguage();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    return mockTransactions.filter((txn) => {
      const matchType = filterType === 'all' || txn.type === filterType;
      const q = search.toLowerCase();
      const matchSearch =
        !q || txn.id.toLowerCase().includes(q) || (txn.note || '').toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [search, filterType]);

  const filters: { key: FilterType; labelKey: string }[] = [
    { key: 'all', labelKey: 'wallet.history.all' },
    { key: 'deposit', labelKey: 'wallet.history.deposit' },
    { key: 'payment', labelKey: 'wallet.history.payment' },
    { key: 'payout', labelKey: 'wallet.history.payout' },
    { key: 'refund', labelKey: 'wallet.history.refund' },
  ];

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
        <div className="history-filters">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`filter-tab ${filterType === f.key ? 'filter-tab--active' : ''}`}
              onClick={() => setFilterType(f.key)}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
        {filtered.length === 0 ? (
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
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
