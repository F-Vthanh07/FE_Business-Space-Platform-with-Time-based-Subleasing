import React, { useEffect, useState } from 'react';
import { Wallet, Plus, ArrowUpRight, Clock3, TrendingUp, TrendingDown, Inbox } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { formatVnd } from '../utils/format';
import { mockTransactions } from '../utils/mockData';
import { fetchWalletAccount } from '../api/wallet.api';
import type { WalletAccount } from '../types';
import { TransactionRow } from './TransactionRow';
import '../wallet.css';

interface WalletOverviewProps {
  onNavigate: (page: 'wallet-deposit' | 'wallet-history') => void;
}

export const WalletOverview: React.FC<WalletOverviewProps> = ({ onNavigate }) => {
  const { t, language } = useThemeLanguage();
  const recent: typeof mockTransactions = [];

  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [, setBalanceError] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('portal_token') || '';
    fetchWalletAccount(token)
      .then(setAccount)
      .catch((err) => setBalanceError(err instanceof Error ? err.message : 'Lỗi tải số dư'))
      .finally(() => setIsLoadingBalance(false));
  }, []);

  const balance = account?.balance ?? 0;
  // const linkedAccount = account?.user?.email || mockWalletSummary.linkedAccount;
  // const walletId = account ? `WAL-${account.id}` : mockWalletSummary.walletId;

  return (
    <div className="wallet-page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('wallet.title')}</h1>
          <p className="page-subtitle text-secondary">{t('wallet.subtitle')}</p>
        </div>
      </div>

      {/* Hero balance card */}
      <div className="glass-card wallet-hero">
        <div className="wallet-hero-top">
          <div>
            <span className="label-caps">
              <Wallet size={12} style={{ verticalAlign: -2, marginRight: 6 }} />
              {t('wallet.currentBalance')}
            </span>
            <h2 className="wallet-hero-balance">
              {isLoadingBalance ? '...' : formatVnd(balance, language)}
            </h2>
            {/* <p className="wallet-hero-id">
              {t('wallet.walletId')}: {walletId} • {linkedAccount}
            </p> */}

          </div>
          <div className="wallet-hero-actions">
            <button className="btn-primary" onClick={() => onNavigate('wallet-deposit')}>
              <Plus size={16} />
              {t('wallet.deposit')}
            </button>
            <button className="btn-ghost" onClick={() => onNavigate('wallet-history')}>
              {t('wallet.viewHistory')}
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div className="wallet-stats-row">
          <div className="glass-card--inset wallet-stat-tile">
            <span className="label-caps">
              <Clock3 size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              {t('wallet.pendingBalance')}
            </span>
            <span className="wallet-stat-value">{formatVnd(0, language)}</span>
          </div>
          <div className="glass-card--inset wallet-stat-tile">
            <span className="label-caps">
              <TrendingUp size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              {t('wallet.totalDeposited')}
            </span>
            <span className="wallet-stat-value text-positive">{formatVnd(0, language)}</span>
          </div>
          <div className="glass-card--inset wallet-stat-tile">
            <span className="label-caps">
              <TrendingDown size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              {t('wallet.totalSpent')}
            </span>
            <span className="wallet-stat-value text-negative">{formatVnd(0, language)}</span>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
          <h2 className="market-title">{t('wallet.recentTransactions')}</h2>
          <button className="btn-ghost" onClick={() => onNavigate('wallet-history')}>
            {t('wallet.viewAll')}
            <ArrowUpRight size={14} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="wallet-empty-state">
            <div className="wallet-empty-icon">
              <Inbox size={24} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>{t('wallet.noTransactionsYet')}</h3>
            <p className="text-secondary" style={{ fontSize: 13, maxWidth: 320 }}>{t('wallet.noTransactionsDesc')}</p>
          </div>
        ) : (
          <div className="txn-list">
            {recent.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
