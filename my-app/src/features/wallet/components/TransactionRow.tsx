import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { formatVnd, formatDateTime } from '../utils/format';
import type { WalletTransaction } from '../types';
import { paymentMethods } from '../utils/mockData';

const statusConfig: Record<WalletTransaction['status'], { className: string; icon: React.ReactNode }> = {
  success: { className: 'badge--positive', icon: <CheckCircle2 size={11} /> },
  pending: { className: 'badge--warning', icon: <Clock size={11} /> },
  failed: { className: 'badge--negative', icon: <XCircle size={11} /> },
};

const typeConfig: Record<WalletTransaction['type'], { labelKey: string; sign: '+' | '-'; icon: React.ReactNode; iconClass: string }> = {
  deposit: { labelKey: 'wallet.txn.depositLabel', sign: '+', icon: <ArrowDownLeft size={14} />, iconClass: 'txn-icon--in' },
  refund: { labelKey: 'wallet.txn.refundLabel', sign: '+', icon: <ArrowDownLeft size={14} />, iconClass: 'txn-icon--in' },
  payout: { labelKey: 'wallet.txn.payoutLabel', sign: '+', icon: <ArrowDownLeft size={14} />, iconClass: 'txn-icon--in' },
  payment: { labelKey: 'wallet.txn.paymentLabel', sign: '-', icon: <ArrowUpRight size={14} />, iconClass: 'txn-icon--out' },
};

interface TransactionRowProps {
  txn: WalletTransaction;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({ txn }) => {
  const { t, language } = useThemeLanguage();
  const cfg = typeConfig[txn.type];
  const statusCfg = statusConfig[txn.status];
  const methodLabel = paymentMethods.find((m) => m.id === txn.method)?.name || txn.method;

  return (
    <div className="glass-card--inset txn-row">
      <div className="txn-row-left">
        <div className={`txn-icon ${cfg.iconClass}`}>{cfg.icon}</div>
        <div className="txn-meta">
          <span className="txn-title">{t(cfg.labelKey)}</span>
          <span className="txn-sub text-secondary">{txn.id} • {formatDateTime(txn.createdAt, language)}</span>
        </div>
      </div>
      <div className="txn-row-right">
        <span className="txn-method text-secondary">{methodLabel}</span>
        <span className={`txn-amount ${cfg.sign === '+' ? 'text-positive' : 'text-negative'}`}>
          {cfg.sign}{formatVnd(txn.amount, language)}
        </span>
        <span className={`badge ${statusCfg.className}`}>
          {statusCfg.icon}
          {t(`wallet.status.${txn.status}`)}
        </span>
      </div>
    </div>
  );
};
