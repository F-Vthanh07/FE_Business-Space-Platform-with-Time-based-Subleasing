import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { SubleaseSlotForm } from './SubleaseSlotForm';
import { SubBookingForm } from './SubBookingForm';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './SlotCalendar.css';

import type { SubSlot } from '../types';

const slotStatusConfig = {
  booked: { color: '#4A72FF', bgColor: 'rgba(74, 114, 255, 0.15)', icon: <CheckCircle2 size={11} /> },
  available: { color: '#2EEA82', bgColor: 'rgba(46, 234, 130, 0.12)', icon: <Plus size={11} /> },
  conflict: { color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.15)', icon: <XCircle size={11} /> },
  pending: { color: '#D9A05B', bgColor: 'rgba(217, 160, 91, 0.15)', icon: <AlertCircle size={11} /> },
};

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface SlotCalendarProps {
  slots: SubSlot[];
  onUpdateSlot: (updatedSlot: SubSlot) => void;
  onCreateSlot: (newSlot: SubSlot) => void;
}

export const SlotCalendar: React.FC<SlotCalendarProps> = ({ slots, onUpdateSlot, onCreateSlot }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 4, 1)); // May 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2025, 4, 26));
  const [selectedSpaceId, setSelectedSpaceId] = useState('space-leloi');
  
  // Trạng thái điều khiển form modal
  const [isNewSlotOpen, setIsNewSlotOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<SubSlot | null>(null);

  const { t, language } = useThemeLanguage();
  const dateLocale = language === 'en' ? enUS : vi;

  const mockSpaces = [
    { id: 'space-leloi', name: language === 'en' ? 'Le Loi Dist 1' : 'Mặt bằng Lê Lợi Q1', type: language === 'en' ? 'Retail' : 'Cửa hàng', size: '45 m²' },
    { id: 'space-phandinhphung', name: language === 'en' ? 'Phan Dinh Phung' : 'Shop Phan Đình Phùng', type: language === 'en' ? 'Cafe' : 'Cà phê', size: '30 m²' },
    { id: 'space-quangtrung', name: language === 'en' ? 'Quang Trung GV' : 'Quang Trung GV', type: language === 'en' ? 'Kiosk' : 'Ki-ốt', size: '18 m²' },
  ];

  const getStatusLabel = (status: 'booked' | 'available' | 'conflict' | 'pending') => {
    switch (status) {
      case 'booked': return t('renter.bookedStatus');
      case 'available': return t('renter.availableStatus');
      case 'conflict': return t('renter.conflictStatus');
      case 'pending': return t('renter.pendingStatus');
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getSlotsForDate = (date: Date) =>
    slots.filter((s) => s.date === format(date, 'yyyy-MM-dd') && s.spaceId === selectedSpaceId);

  const selectedSlots = selectedDate ? getSlotsForDate(selectedDate) : [];

  const handleCreateSlotSubmit = (newSlotData: any) => {
    onCreateSlot(newSlotData);
    setIsNewSlotOpen(false);
  };

  const handleBookingSubmit = (bookedSlotData: any) => {
    onUpdateSlot(bookedSlotData);
    setBookingSlot(null);
  };

  const filteredSlotsForStats = slots.filter(s => s.spaceId === selectedSpaceId);
  const weekDaysHeader = language === 'en' ? WEEKDAYS_EN : WEEKDAYS;

  return (
    <div className="slot-calendar-wrapper">
      {/* Calendar Panel */}
      <div className="glass-card calendar-panel">
        
        {/* Bộ chọn Mặt bằng (Space Selector Tabs) */}
        <div className="glass-card--inset space-selector-tabs" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 8, marginBottom: 20 }}>
          {mockSpaces.map(sp => (
            <button
              key={sp.id}
              className={`space-selector-tab ${selectedSpaceId === sp.id ? 'space-selector-tab--active' : ''}`}
              onClick={() => setSelectedSpaceId(sp.id)}
              style={{
                flex: 1,
                background: selectedSpaceId === sp.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: 'none',
                color: selectedSpaceId === sp.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                padding: '10px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                textAlign: 'center',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '12px' }}>{sp.name}</div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: 2 }}>{sp.type} · {sp.size}</div>
            </button>
          ))}
        </div>

        {/* Month Navigation */}
        <div className="calendar-header">
          <button className="btn-icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft size={16} />
          </button>
          <h2 className="calendar-month-title">
            {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          <button className="btn-icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Legend */}
        <div className="calendar-legend">
          {Object.entries(slotStatusConfig).map(([key, cfg]) => (
            <div key={key} className="legend-item">
              <div className="legend-dot" style={{ background: cfg.color }} />
              <span>{getStatusLabel(key as any)}</span>
            </div>
          ))}
        </div>

        {/* Weekday Labels */}
        <div className="calendar-grid">
          {weekDaysHeader.map((wd) => (
            <div key={wd} className="cal-weekday">{wd}</div>
          ))}

          {/* Day Cells */}
          {calDays.map((day) => {
            const daySlots = getSlotsForDate(day);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const todayDay = isToday(day);

            return (
              <button
                key={day.toISOString()}
                className={`cal-day ${!isCurrentMonth ? 'cal-day--other' : ''} ${isSelected ? 'cal-day--selected' : ''} ${todayDay ? 'cal-day--today' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <span className="cal-day-num">{format(day, 'd')}</span>
                {daySlots.length > 0 && (
                  <div className="cal-day-dots">
                    {daySlots.slice(0, 3).map((s, i) => (
                      <div key={i} className="cal-dot" style={{ background: slotStatusConfig[s.status].color }} />
                    ))}
                    {daySlots.length > 3 && <span className="cal-dot-more">+{daySlots.length - 3}</span>}
                  </div>
                )}
                {daySlots.length > 0 && (
                  <div className="cal-slot-count">{daySlots.length}</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="calendar-stats">
          <div className="cal-stat-item">
            <span className="cal-stat-value" style={{ color: '#4A72FF' }}>
              {filteredSlotsForStats.filter(s => s.status === 'booked').length}
            </span>
            <span className="label-caps">{t('renter.bookedStatus')}</span>
          </div>
          <div className="cal-stat-item">
            <span className="cal-stat-value" style={{ color: '#2EEA82' }}>
              {filteredSlotsForStats.filter(s => s.status === 'available').length}
            </span>
            <span className="label-caps">{t('renter.availableStatus')}</span>
          </div>
          <div className="cal-stat-item">
            <span className="cal-stat-value" style={{ color: '#D9A05B' }}>
              {filteredSlotsForStats.filter(s => s.status === 'pending').length}
            </span>
            <span className="label-caps">{t('renter.pendingStatus')}</span>
          </div>
          <div className="cal-stat-item">
            <span className="cal-stat-value" style={{ color: '#FF4D6D' }}>
              {filteredSlotsForStats.filter(s => s.status === 'conflict').length}
            </span>
            <span className="label-caps">{t('renter.conflictStatus')}</span>
          </div>
        </div>
      </div>


      {/* Day Detail Panel */}
      <div className="day-detail-panel">
        <div className="glass-card day-detail-card">
          <div className="day-detail-header">
            <div>
              <p className="label-caps">{language === 'en' ? 'Day Details' : 'Chi tiết ngày'}</p>
              <h3 className="day-detail-date">
                {selectedDate
                  ? format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: dateLocale })
                  : (language === 'en' ? 'Select a day' : 'Chọn một ngày')}
              </h3>
            </div>
            <button 
              className="btn-primary" 
              style={{ fontSize: 12, padding: '8px 14px' }}
              onClick={() => selectedDate && setIsNewSlotOpen(true)}
            >
              <Plus size={14} />
              {t('renter.addSlot')}
            </button>
          </div>

          {selectedSlots.length === 0 ? (
            <div className="day-detail-empty">
              <Info size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
              <p className="text-secondary" style={{ fontSize: 14, marginTop: 10 }}>{t('renter.noSlotThisDay')}</p>
              <p className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>{t('renter.pressAddSlotInstruction')}</p>
            </div>
          ) : (
            <div className="slot-list">
              {selectedSlots.map((slot) => {
                const cfg = slotStatusConfig[slot.status];
                return (
                  <div key={slot.id} className="slot-item" style={{ borderLeftColor: cfg.color }}>
                    <div className="slot-item-top">
                      <div className="slot-time">
                        <Clock size={13} style={{ color: cfg.color }} />
                        <span>{slot.startTime} – {slot.endTime}</span>
                      </div>
                      <span className={`badge`} style={{ background: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                        {cfg.icon}
                        {getStatusLabel(slot.status)}
                      </span>
                    </div>
                    {slot.tenantName && (
                      <div className="slot-tenant">
                        <div className="avatar avatar--sm" style={{ background: 'linear-gradient(135deg, #4A72FF, #4B8F8C)' }}>
                          {slot.tenantInitials}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{slot.tenantName}</p>
                          <p className="text-secondary" style={{ fontSize: 11 }}>
                            <User size={11} style={{ display: 'inline', marginRight: 3 }} />
                            {t('subtenants.subtenantRole')}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="slot-price-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <div className="slot-price">
                        <span className="text-secondary" style={{ fontSize: 12, marginRight: 8 }}>{t('renter.priceSlot')}</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-positive)', fontSize: 14 }}>
                          {language === 'en' ? slot.price.replace(/\./g, ',').replace('₫', ' VND') : slot.price}
                        </span>
                      </div>
                      {slot.status === 'available' && (
                        <button 
                          className="btn-primary" 
                          style={{ fontSize: 11, padding: '6px 12px' }}
                          onClick={() => setBookingSlot(slot)}
                        >
                          {t('renter.bookThisSlot')}
                        </button>
                      )}
                    </div>
                    {slot.status === 'conflict' && (
                      <div className="slot-conflict-warning">
                        <XCircle size={13} />
                        <span>{t('renter.conflictWarning')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORMS */}
      {isNewSlotOpen && selectedDate && (
        <SubleaseSlotForm
          selectedDate={selectedDate}
          defaultSpaceId={selectedSpaceId}
          onClose={() => setIsNewSlotOpen(false)}
          onSubmit={handleCreateSlotSubmit}
        />
      )}

      {bookingSlot && (
        <SubBookingForm
          slot={bookingSlot}
          onClose={() => setBookingSlot(null)}
          onSubmit={handleBookingSubmit}
        />
      )}
    </div>
  );
};
