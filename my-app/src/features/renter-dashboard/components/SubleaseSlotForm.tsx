import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, Share2, AlertCircle } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './SubleaseSlotForm.css';

interface SubleaseSlotFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  selectedDate?: Date;
  defaultSpaceId?: string;
}

export const SubleaseSlotForm: React.FC<SubleaseSlotFormProps> = ({ onClose, onSubmit, selectedDate, defaultSpaceId }) => {
  const { t, language } = useThemeLanguage();
  const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const primaryBookingsMock = [
    { id: 'pb1', spaceId: 'space-leloi', spaceName: language === 'en' ? 'Le Loi Dist 1' : 'Mặt bằng Lê Lợi Q1', dateRange: '01/01/2025 - 31/12/2025' },
    { id: 'pb2', spaceId: 'space-phandinhphung', spaceName: language === 'en' ? 'Phan Dinh Phung' : 'Shop Phan Đình Phùng', dateRange: '15/03/2025 - 15/09/2025' },
    { id: 'pb3', spaceId: 'space-quangtrung', spaceName: language === 'en' ? 'Quang Trung GV' : 'Quang Trung GV', dateRange: '01/05/2025 - 01/11/2025' },
  ];
  
  const getBookingIdFromSpaceId = (spaceId?: string) => {
    if (spaceId === 'space-phandinhphung') return 'pb2';
    if (spaceId === 'space-quangtrung') return 'pb3';
    return 'pb1';
  };

  const [bookingId, setBookingId] = useState(getBookingIdFromSpaceId(defaultSpaceId));
  const [date, setDate] = useState(formattedDate);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [price, setPrice] = useState('500000');
  const [session, setSession] = useState('Morning');
  const [type, setType] = useState('Fixed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !date || !startTime || !endTime || !price) {
      alert(t('subleaseForm.fillAllFieldsGeneric'));
      return;
    }

    const selectedBooking = primaryBookingsMock.find(b => b.id === bookingId);

    const formatPriceText = () => {
      if (language === 'en') {
        return `${Number(price).toLocaleString('en-US')} VND`;
      }
      return `${Number(price).toLocaleString('vi-VN')}₫`;
    };

    const data = {
      id: `s${Date.now()}`,
      date,
      startTime,
      endTime,
      tenantName: '', // Trống để người khác đặt
      tenantInitials: '',
      status: 'available',
      price: formatPriceText(),
      spaceId: selectedBooking?.spaceId || 'space-leloi',
      session: session === 'Morning' ? t('subleaseForm.sessionMorning') : 
               session === 'Afternoon' ? t('subleaseForm.sessionAfternoon') :
               session === 'Evening' ? t('subleaseForm.sessionEvening') : t('subleaseForm.sessionFullDay'),
      type: type === 'Fixed' ? t('subleaseForm.slotTypeFixed') : t('subleaseForm.slotTypeFlexible'),
    };

    onSubmit(data);
  };


  return (
    <div className="sublease-form-backdrop">
      <div className="glass-card sublease-form-modal animate-in">
        
        {/* Header */}
        <div className="sublease-form-header">
          <div className="sublease-form-title-area">
            <div className="sublease-form-icon-wrap">
              <Share2 size={16} />
            </div>
            <div>
              <h2 className="form-modal-title">{t('subleaseForm.createSubleaseSlot')}</h2>
              <p className="form-modal-subtitle text-secondary">{t('subleaseForm.subleaseSlotSubtitle')}</p>
            </div>
          </div>
          <button className="btn-icon close-btn" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="sublease-form-body">
          
          <div className="form-section">
            <h3 className="form-section-title">{t('subleaseForm.primaryContractTitle')}</h3>
            <div className="form-group">
              <label className="form-label">{t('subleaseForm.selectPrimaryContract')}</label>
              <select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="form-select-input"
                style={{ paddingLeft: 14 }}
              >
                {primaryBookingsMock.map(pb => (
                  <option key={pb.id} value={pb.id}>
                    {pb.spaceName} ({pb.dateRange})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">{t('subleaseForm.listingSlotDetails')}</h3>
            
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">{t('subleaseForm.formLabelDate')}</label>
                <div className="input-with-icon">
                  <Calendar size={14} className="input-icon" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('subleaseForm.formLabelPriceProposed')}</label>
                <div className="input-with-icon">
                  <DollarSign size={14} className="input-icon" />
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">{t('subleaseForm.formLabelStartTime')}</label>
                <div className="input-with-icon">
                  <Clock size={14} className="input-icon" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('subleaseForm.formLabelEndTime')}</label>
                <div className="input-with-icon">
                  <Clock size={14} className="input-icon" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">{t('subleaseForm.formLabelSession')}</label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="form-select-input"
                  style={{ paddingLeft: 14 }}
                >
                  <option value="Morning">{t('subleaseForm.sessionMorning')}</option>
                  <option value="Afternoon">{t('subleaseForm.sessionAfternoon')}</option>
                  <option value="Evening">{t('subleaseForm.sessionEvening')}</option>
                  <option value="FullDay">{t('subleaseForm.sessionFullDay')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('subleaseForm.formLabelSlotType')}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="form-select-input"
                  style={{ paddingLeft: 14 }}
                >
                  <option value="Fixed">{t('subleaseForm.slotTypeFixed')}</option>
                  <option value="Flexible">{t('subleaseForm.slotTypeFlexible')}</option>
                </select>
              </div>
            </div>

            <div className="info-banner">
              <AlertCircle size={14} className="info-banner-icon" />
              <span className="info-banner-text">{t('subleaseForm.subleaseAIBanner')}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="form-actions-footer">
            <button type="button" className="btn-ghost cancel-btn" onClick={onClose}>
              {t('spaceForm.cancel')}
            </button>
            <button type="submit" className="btn-primary submit-btn">
              {t('subleaseForm.createSubleaseSlotBtn')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
