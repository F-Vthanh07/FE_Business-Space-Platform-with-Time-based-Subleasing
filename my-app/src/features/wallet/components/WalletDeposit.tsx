import React, { useState, useMemo } from 'react';
import { ShieldCheck, ChevronLeft } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { formatVnd } from '../utils/format';
import { quickAmounts } from '../utils/mockData';
import { createDepositTransaction } from '../api/wallet.api';
import '../wallet.css';

interface WalletDepositProps {
  onNavigate: (page: 'wallet') => void;
}

const MIN_AMOUNT = 50000;
const FEE_RATE = 0; // no fee on deposits for now

export const WalletDeposit: React.FC<WalletDepositProps> = ({ onNavigate }) => {
  const { t, language } = useThemeLanguage();

  const [amount, setAmount] = useState<number | ''>(500000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numericAmount = typeof amount === 'number' ? amount : 0;
  const fee = useMemo(() => Math.round(numericAmount * FEE_RATE), [numericAmount]);
  const total = numericAmount + fee;
  const isValid = numericAmount >= MIN_AMOUNT;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmount(raw === '' ? '' : Number(raw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('portal_token') || '';
      const checkoutUrl = await createDepositTransaction(total, token);
      window.location.href = checkoutUrl;
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  return (
    <div className="wallet-page animate-in">
      <div className="page-header">
        <div>
          <button className="btn-ghost" style={{ marginBottom: 12 }} onClick={() => onNavigate('wallet')}>
            <ChevronLeft size={14} />
            {t('wallet.title')}
          </button>
          <h1 className="page-title">{t('wallet.deposit.title')}</h1>
          <p className="page-subtitle text-secondary">{t('wallet.deposit.subtitle')}</p>
        </div>
      </div>

      <form className="deposit-layout" onSubmit={handleSubmit}>
        <div className="deposit-form-card glass-card">
          <div>
            <span className="label-caps">{t('wallet.deposit.amountLabel')}</span>
            <div className="deposit-amount-input-wrap" style={{ marginTop: 10 }}>
              <input
                className="deposit-amount-input"
                type="text"
                inputMode="numeric"
                placeholder={t('wallet.deposit.amountPlaceholder')}
                value={amount === '' ? '' : amount.toLocaleString('vi-VN')}
                onChange={handleAmountChange}
              />
            </div>
            {!isValid && (
              <p className="text-negative" style={{ fontSize: 12, marginTop: 8 }}>
                {t('wallet.deposit.minAmount')}
              </p>
            )}

            <span className="label-caps" style={{ display: 'block', marginTop: 20, marginBottom: 4 }}>
              {t('wallet.deposit.quickSelect')}
            </span>
            <div className="deposit-quick-grid">
              {quickAmounts.map((qa) => (
                <button
                  type="button"
                  key={qa}
                  className={`deposit-quick-btn ${amount === qa ? 'deposit-quick-btn--active' : ''}`}
                  onClick={() => setAmount(qa)}
                >
                  {formatVnd(qa, language)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label-caps">{t('wallet.deposit.methodLabel')}</span>
            <div className="deposit-methods-list" style={{ marginTop: 10 }}>
              <div className="deposit-method-item deposit-method-item--active">
                <div className="deposit-method-radio">
                  <div className="deposit-method-radio-dot" />
                </div>
                <div className="deposit-method-meta">
                  <span className="deposit-method-name">PayOS</span>
                  <span className="deposit-method-desc">
                    {language === 'en' ? 'ATM / Internet Banking / QR Code' : 'ATM / Internet Banking / Quét mã QR'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="deposit-summary-card glass-card">
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>{t('wallet.deposit.summary')}</h3>

          <div className="deposit-summary-row">
            <span className="text-secondary">{t('wallet.deposit.amount')}</span>
            <span>{formatVnd(numericAmount, language)}</span>
          </div>
          <div className="deposit-summary-row">
            <span className="text-secondary">{t('wallet.deposit.fee')}</span>
            <span>{formatVnd(fee, language)}</span>
          </div>

          <div className="deposit-summary-divider" />

          <div className="deposit-summary-total">
            <span>{t('wallet.deposit.total')}</span>
            <span className="text-accent">{formatVnd(total, language)}</span>
          </div>

          {error && (
            <p className="text-negative" style={{ fontSize: 12 }}>{error}</p>
          )}

          <button className="btn-primary" type="submit" disabled={!isValid || isSubmitting} style={{ justifyContent: 'center', marginTop: 8 }}>
            {isSubmitting ? t('wallet.deposit.processing') : t('wallet.deposit.submit')}
          </button>

          <p className="deposit-secure-note">
            <ShieldCheck size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
            {t('wallet.deposit.secureNote')}
          </p>
        </div>
      </form>
    </div>
  );
};
