import React, { useState } from 'react';
import { X, Calendar, CreditCard, User, AlertCircle } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './SubBookingForm.css';

interface SubBookingFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  slot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    price: string;
  };
}

export const SubBookingForm: React.FC<SubBookingFormProps> = ({ onClose, onSubmit, slot }) => {
  const [tenantName, setTenantName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('VNPay');
  const { t, language } = useThemeLanguage();

  const getInitials = (name: string) => {
    if (!name) return 'KH';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName) {
      alert(t('subbookingForm.formTenantNameAlert'));
      return;
    }

    const initials = getInitials(tenantName);

    const data = {
      ...slot,
      tenantName,
      tenantInitials: initials,
      status: 'booked', // Chuyển từ available thành booked sau khi đặt
      paymentMethod,
    };

    onSubmit(data);
  };

  return (
    <div className="sub-booking-backdrop">
      <div className="glass-card sub-booking-modal animate-in">
        
        {/* Header */}
        <div className="sub-booking-header">
          <div className="sub-booking-title-area">
            <div className="sub-booking-icon-wrap">
              <Calendar size={16} />
            </div>
            <div>
              <h2 className="form-modal-title">{t('subbookingForm.subBookingTitle')}</h2>
              <p className="form-modal-subtitle text-secondary">{t('subbookingForm.subBookingSubtitle')}</p>
            </div>
          </div>
          <button className="btn-icon close-btn" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="sub-booking-body">
          
          {/* Thông tin slot được đặt */}
          <div className="form-section">
            <h3 className="form-section-title">{t('subbookingForm.formSectionBookingTime')}</h3>
            <div className="glass-card--inset slot-prefilled-info">
              <div className="info-row">
                <span className="info-label text-secondary">{t('subbookingForm.formLabelBookingDate')}</span>
                <span className="info-value font-bold">{slot.date}</span>
              </div>
              <div className="info-row">
                <span className="info-label text-secondary">{t('subbookingForm.formLabelBookingTime')}</span>
                <span className="info-value font-bold">{slot.startTime} – {slot.endTime}</span>
              </div>
              <div className="info-row">
                <span className="info-label text-secondary">{t('subbookingForm.formLabelBookingPrice')}</span>
                <span className="info-value text-positive font-bold" style={{ fontSize: 15 }}>
                  {language === 'en' ? slot.price.replace(/\./g, ',').replace('₫', ' VND') : slot.price}
                </span>
              </div>
            </div>
          </div>

          {/* Người thuê thứ cấp */}
          <div className="form-section">
            <h3 className="form-section-title">{t('subbookingForm.formSectionSubBooking')}</h3>
            <div className="form-group">
              <label className="form-label">{t('subbookingForm.formLabelTenantFullName')}</label>
              <div className="input-with-icon">
                <User size={14} className="input-icon" />
                <input
                  type="text"
                  placeholder={t('subbookingForm.formPlaceholderTenantFullName')}
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Hóa đơn & Giao dịch */}
          <div className="form-section">
            <h3 className="form-section-title">{t('subbookingForm.formSectionTransaction')}</h3>
            <div className="form-group">
              <label className="form-label">{t('subbookingForm.formLabelPaymentMethod')}</label>
              <div className="input-with-icon">
                <CreditCard size={14} className="input-icon" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-select-input"
                  style={{ paddingLeft: 40 }}
                >
                  <option value="VNPay">{t('subbookingForm.formPaymentVNPay')}</option>
                  <option value="MoMo">{t('subbookingForm.formPaymentMoMo')}</option>
                  <option value="Stripe">{t('subbookingForm.formPaymentStripe')}</option>
                  <option value="Wallet">{t('subbookingForm.formPaymentWallet')}</option>
                </select>
              </div>
            </div>

            <div className="info-banner">
              <AlertCircle size={14} className="info-banner-icon" />
              <span className="info-banner-text">{t('subbookingForm.formTransactionBanner')}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="form-actions-footer">
            <button type="button" className="btn-ghost cancel-btn" onClick={onClose}>
              {t('spaceForm.cancel')}
            </button>
            <button type="submit" className="btn-primary submit-btn">
              {t('subbookingForm.formConfirmPayment')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
