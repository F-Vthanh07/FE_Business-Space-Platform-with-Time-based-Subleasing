import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { formatVnd, formatDateTime } from '../utils/format';
import type { TransactionHistoryItem } from '../types';

interface TransactionHistoryRowProps {
  txn: TransactionHistoryItem;
}

export const TransactionHistoryRow: React.FC<TransactionHistoryRowProps> = ({ txn }) => {
  const { t, language } = useThemeLanguage();
  const isCredit = txn.transactionAmount >= 0;

  return (
    <div className="glass-card--inset txn-row">
      <div className="txn-row-left">
        <div className={`txn-icon ${isCredit ? 'txn-icon--in' : 'txn-icon--out'}`}>
          {isCredit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
        </div>
        <div className="txn-meta">
          <span className="txn-title">{txn.description || t('wallet.txn.depositLabel')}</span>
          <span className="txn-sub text-secondary">{formatDateTime(txn.createdAt, language)}</span>
        </div>
      </div>
      <div className="txn-row-right">
        <span className={`txn-amount ${isCredit ? 'text-positive' : 'text-negative'}`}>
          {isCredit ? '+' : ''}{formatVnd(txn.transactionAmount, language)}
        </span>
      </div>
    </div>
  );
};
