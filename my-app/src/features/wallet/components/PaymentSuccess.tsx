import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { formatVnd, formatDateTime } from '../utils/format';
import { paymentMethods } from '../utils/mockData';
import '../wallet.css';

export const PaymentSuccess: React.FC = () => {
  const { t, language } = useThemeLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const txnId = params.get('txnId') || 'TXN-00000';
  const amount = Number(params.get('amount') || 0);
  const methodId = params.get('method') || 'vnpay';
  const methodName = paymentMethods.find((m) => m.id === methodId)?.name || methodId;
  const now = new Date().toISOString();

  return (
    <div className="payment-result-screen">
      <div className="payment-result-logo">EtherSpace</div>
      <div className="glass-card payment-result-card animate-in">
        <div className="payment-result-icon-wrap payment-result-icon-wrap--success">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="payment-result-title">{t('wallet.payment.successTitle')}</h1>
        <p className="payment-result-desc">{t('wallet.payment.successDesc')}</p>

        <div className="payment-result-details">
          <div className="payment-result-detail-row">
            <span className="text-secondary">{t('wallet.payment.transactionId')}</span>
            <span>{txnId}</span>
          </div>
          <div className="payment-result-detail-row">
            <span className="text-secondary">{t('wallet.payment.amount')}</span>
            <span className="text-positive" style={{ fontWeight: 700 }}>{formatVnd(amount, language)}</span>
          </div>
          <div className="payment-result-detail-row">
            <span className="text-secondary">{t('wallet.payment.method')}</span>
            <span>{methodName}</span>
          </div>
          <div className="payment-result-detail-row">
            <span className="text-secondary">{t('wallet.payment.date')}</span>
            <span>{formatDateTime(now, language)}</span>
          </div>
        </div>

        <div className="payment-result-actions">
          <button className="btn-ghost" onClick={() => navigate('/user/wallet-history')}>
            {t('wallet.payment.viewReceipt')}
          </button>
          <button className="btn-primary" onClick={() => navigate('/user/wallet')}>
            {t('wallet.payment.backToWallet')}
          </button>
        </div>
      </div>
    </div>
  );
};
