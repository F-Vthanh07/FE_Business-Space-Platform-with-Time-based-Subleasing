import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  FileText,
  Maximize2,
  Minimize2,
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
import { SubleaseSlotForm } from './Space/SubleaseSlotForm';
import { SubBookingForm } from './Space/SubBookingForm';
import { ContractDetailModal } from './ContractDetailModal';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { API_BASE_URL } from '../../../config/api';
import './SlotCalendar.css';

import type { SubSlot } from '../types';

interface OwnedSpace {
  id: number;
  address: string;
}

// Ghép địa chỉ hoàn chỉnh "địa chỉ, thành phố" từ một object Space bất kỳ (Space/GetById).
// Fallback: chỉ address -> name -> "#id".
const buildSpaceAddress = (sp: { address?: string; city?: string; name?: string } | null | undefined, id: number) => {
  const parts = [sp?.address, sp?.city].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  return sp?.name || `#${id}`;
};

interface ContractCalendarEntry {
  effectiveDate: string;
  startDateTime: string;
  endDateTime: string;
  contractId: number;
  tenantName: string;
  businessDescription: string;
  displayLabel: string;
}

const slotStatusConfig = {
  booked: { color: '#4A72FF', bgColor: 'rgba(74, 114, 255, 0.15)', icon: <CheckCircle2 size={11} /> },
  available: { color: '#2EEA82', bgColor: 'rgba(46, 234, 130, 0.12)', icon: <Plus size={11} /> },
  conflict: { color: '#FF4D6D', bgColor: 'rgba(255, 77, 109, 0.15)', icon: <XCircle size={11} /> },
  pending: { color: '#D9A05B', bgColor: 'rgba(217, 160, 91, 0.15)', icon: <AlertCircle size={11} /> },
};

const contractStatusColor = '#D46EF2';

// Bảng màu để phân biệt trực quan từng hợp đồng khác nhau trên cùng một ngày.
// Không dùng contractId % length (dễ đụng màu, vd 4 và 14 cùng dư 4 nếu length=10) —
// thay vào đó gán màu theo THỨ TỰ hợp đồng xuất hiện trong danh sách hiện có,
// đảm bảo các hợp đồng đang hiển thị cùng lúc luôn nhận màu khác nhau.
const CONTRACT_COLOR_PALETTE = [
  '#D46EF2', '#4A72FF', '#2EEA82', '#FF9F45', '#FF4D6D',
  '#22D3EE', '#F5D90A', '#A78BFA', '#F472B6', '#34D399',
];

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatTime = (isoDateTime: string) => (isoDateTime ? isoDateTime.substring(11, 16) : '');

const getInitials = (name: string) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

interface SlotCalendarProps {
  slots: SubSlot[];
  onUpdateSlot: (updatedSlot: SubSlot) => void;
  onCreateSlot: (newSlot: SubSlot) => void;
  /**
   * Cả 2 chế độ đều lấy mặt bằng từ HỢP ĐỒNG (Contract/GetAll), chỉ khác vai trò của mình:
   * - 'lessor' (mặc định): mặt bằng mình CHO người khác thuê — Contract/GetAll?LessorId=tôi
   * - 'lessee': mặt bằng mình ĐI THUÊ của người khác — Contract/GetAll?LesseeId=tôi
   * Sau đó gom spaceId duy nhất và resolve địa chỉ qua Space/GetById.
   */
  mode?: 'lessor' | 'lessee';
}

export const SlotCalendar: React.FC<SlotCalendarProps> = ({ slots, onUpdateSlot, onCreateSlot, mode = 'lessor' }) => {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [selectedSpaceId, setSelectedSpaceId] = useState('');

  // Trạng thái điều khiển form modal
  const [isNewSlotOpen, setIsNewSlotOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<SubSlot | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [ownedSpaces, setOwnedSpaces] = useState<OwnedSpace[]>([]);
  const [isSpacesLoading, setIsSpacesLoading] = useState(true);
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const spaceDropdownRef = useRef<HTMLDivElement>(null);

  const [contractEntries, setContractEntries] = useState<ContractCalendarEntry[]>([]);
  const [isContractCalendarLoading, setIsContractCalendarLoading] = useState(false);

  const { t, language } = useThemeLanguage();
  const dateLocale = language === 'en' ? enUS : vi;

  // Đóng dropdown khi click ra ngoài khu vực chọn mặt bằng / chọn tháng-năm
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (spaceDropdownRef.current && !spaceDropdownRef.current.contains(e.target as Node)) {
        setIsSpaceDropdownOpen(false);
      }
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lấy danh sách mặt bằng để đổ vào dropdown (chỉ cần id + địa chỉ).
  // Cả 2 tab đều dựa trên HỢP ĐỒNG, chỉ khác vai trò của mình trong hợp đồng:
  // - mode 'lessor': hợp đồng mình là BÊN CHO THUÊ  -> Contract/GetAll?LessorId=tôi
  // - mode 'lessee': hợp đồng mình là BÊN THUÊ      -> Contract/GetAll?LesseeId=tôi
  // Từ danh sách hợp đồng, gom spaceId duy nhất rồi resolve địa chỉ qua Space/GetById.
  const fetchOwnedSpaces = useCallback(async () => {
    setIsSpacesLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const userId = localStorage.getItem('current_user_id');
      const headers = { Authorization: `Bearer ${token}`, accept: '*/*' };

      const roleParam = mode === 'lessor' ? 'LessorId' : 'LesseeId';
      const contractRes = await fetch(
        `${API_BASE_URL}/api/Contract/GetAll?${roleParam}=${encodeURIComponent(userId || '')}`,
        { headers }
      );

      if (!contractRes.ok) {
        setOwnedSpaces([]);
        return;
      }

      const contractData = await contractRes.json();
      const contracts: Array<{ spaceId: number }> = Array.isArray(contractData)
        ? contractData
        : (contractData?.data || contractData?.items || []);

      // Gom các spaceId duy nhất từ các hợp đồng ở vai trò tương ứng
      const uniqueSpaceIds = Array.from(
        new Set(contracts.map((c) => c.spaceId).filter((id): id is number => id != null))
      );

      // Resolve địa chỉ từng mặt bằng qua Space/GetById.
      // ⚠️ Endpoint KHÔNG có dấu "/" giữa "GetById" và id — dùng `GetById${id}` giống toàn bộ codebase
      // (OwnerTenants, ContractDetailModal, ...). Dùng `GetById/${id}` sẽ 404 và rơi về fallback "#id".
      const resolved = await Promise.all(
        uniqueSpaceIds.map(async (id) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/Space/GetById${id}`, { headers });
            if (res.ok) {
              const sp = await res.json();
              return { id, address: buildSpaceAddress(sp, id) } as OwnedSpace;
            }
          } catch {
            /* bỏ qua lỗi lẻ, vẫn hiển thị mặt bằng theo id */
          }
          return { id, address: `#${id}` } as OwnedSpace;
        })
      );

      setOwnedSpaces(resolved);
      setSelectedSpaceId((prev) => prev || (resolved[0] ? String(resolved[0].id) : ''));
    } catch (error) {
      console.error('Lỗi khi tải danh sách mặt bằng:', error);
      setOwnedSpaces([]);
    } finally {
      setIsSpacesLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    // Đổi tab (mode) thì reset lựa chọn mặt bằng để lấy đúng mặt bằng đầu tiên của tab mới
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSpaceId('');
    fetchOwnedSpaces();
  }, [fetchOwnedSpaces]);

  // Lấy lịch hợp đồng (contract calendar) của mặt bằng đang chọn trong khoảng tháng đang xem
  const fetchContractCalendar = useCallback(async (spaceId: string, monthDate: Date) => {
    if (!spaceId) {
      setContractEntries([]);
      return;
    }
    setIsContractCalendarLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const from = format(startOfWeek(startOfMonth(monthDate)), "yyyy-MM-dd'T'00:00:00");
      const to = format(endOfWeek(endOfMonth(monthDate)), "yyyy-MM-dd'T'23:59:59");
      const url = `${API_BASE_URL}/api/Contract/calendar/space/${spaceId}?from=${from}&to=${to}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: '*/*',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const safeData: ContractCalendarEntry[] = Array.isArray(data) ? data : (data?.data || data?.items || []);
        setContractEntries(safeData);
      } else {
        setContractEntries([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch hợp đồng:', error);
      setContractEntries([]);
    } finally {
      setIsContractCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContractCalendar(selectedSpaceId, currentMonth);
  }, [fetchContractCalendar, selectedSpaceId, currentMonth]);

  const getContractEntriesForDate = useCallback(
    (date: Date) => contractEntries.filter((entry) => isSameDay(new Date(entry.effectiveDate), date)),
    [contractEntries]
  );

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
  const selectedContracts = selectedDate ? getContractEntriesForDate(selectedDate) : [];

  // Danh sách hợp đồng duy nhất đang hiển thị trong tháng, dùng để render chú thích màu
  const visibleContracts = Array.from(
    new Map(contractEntries.map((c) => [c.contractId, c])).values()
  );

  // Gán màu theo VỊ TRÍ của hợp đồng trong danh sách đang hiển thị (không theo contractId % length),
  // để tránh 2 hợp đồng khác nhau (vd #4 và #14) vô tình trùng màu do phép chia dư.
  const contractColorMap = new Map<number, string>(
    visibleContracts.map((c, i) => [c.contractId, CONTRACT_COLOR_PALETTE[i % CONTRACT_COLOR_PALETTE.length]])
  );
  const getContractColor = (contractId: number) => contractColorMap.get(contractId) || contractStatusColor;

  const handleCreateSlotSubmit = (newSlotData: any) => {
    onCreateSlot(newSlotData);
    setIsNewSlotOpen(false);
  };

  const handleBookingSubmit = (bookedSlotData: any) => {
    onUpdateSlot(bookedSlotData);
    setBookingSlot(null);
  };

  const weekDaysHeader = language === 'en' ? WEEKDAYS_EN : WEEKDAYS;

  return (
    <div className={`slot-calendar-wrapper ${isExpanded ? 'slot-calendar-wrapper--expanded' : ''}`}>
      {/* Calendar Panel */}
      <div className="glass-card calendar-panel">

        {/* Toolbar: chọn Mặt bằng, điều hướng tháng, nút phóng to lịch — 1 hàng duy nhất khi phóng to */}
        <div className="calendar-toolbar">
          <div className="space-selector-dropdown calendar-toolbar-space" ref={spaceDropdownRef}>
          <button
            type="button"
            className="space-selector-trigger"
            disabled={isSpacesLoading || ownedSpaces.length === 0}
            onClick={() => setIsSpaceDropdownOpen((prev) => !prev)}
          >
            <span className="space-selector-trigger-label">
              {isSpacesLoading
                ? (language === 'en' ? 'Loading spaces...' : 'Đang tải mặt bằng...')
                : ownedSpaces.length === 0
                  ? (mode === 'lessee'
                      ? (language === 'en' ? 'No rented spaces' : 'Bạn chưa thuê mặt bằng nào')
                      : (language === 'en' ? 'No leased spaces' : 'Bạn chưa cho thuê mặt bằng nào'))
                  : ownedSpaces.find((sp) => String(sp.id) === selectedSpaceId)?.address
                    ?? (language === 'en' ? 'Select a space' : 'Chọn mặt bằng')}
            </span>
            <ChevronDown size={14} className={`space-selector-chevron ${isSpaceDropdownOpen ? 'space-selector-chevron--open' : ''}`} />
          </button>

          {isSpaceDropdownOpen && !isSpacesLoading && ownedSpaces.length > 0 && (
            <div className="space-selector-menu">
              {ownedSpaces.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  className={`space-selector-option ${String(sp.id) === selectedSpaceId ? 'space-selector-option--active' : ''}`}
                  onClick={() => {
                    setSelectedSpaceId(String(sp.id));
                    setIsSpaceDropdownOpen(false);
                  }}
                >
                  {sp.address}
                </button>
              ))}
            </div>
          )}
          </div>

          {/* Month Navigation */}
          <div className="calendar-header">
            <button className="btn-icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft size={16} />
            </button>

            <div className="space-selector-dropdown" ref={monthPickerRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="calendar-month-title"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setIsMonthPickerOpen((prev) => !prev)}
              >
                {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
                <ChevronDown size={14} className={`space-selector-chevron ${isMonthPickerOpen ? 'space-selector-chevron--open' : ''}`} />
              </button>

              {isMonthPickerOpen && (
                <div className="space-selector-menu" style={{ display: 'flex', gap: 8, padding: 10, width: 220 }}>
                  <select
                    value={currentMonth.getMonth()}
                    onChange={(e) => {
                      const month = Number(e.target.value);
                      setCurrentMonth((prev) => new Date(prev.getFullYear(), month, 1));
                    }}
                    style={{
                      flex: 1, padding: '6px 8px', borderRadius: 6,
                      border: '1px solid var(--color-border)', background: 'var(--color-bg-card-deep)',
                      color: 'var(--color-text-primary)', fontSize: 13,
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {format(new Date(2000, i, 1), 'MMMM', { locale: dateLocale })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={currentMonth.getFullYear()}
                    onChange={(e) => {
                      const year = Number(e.target.value);
                      setCurrentMonth((prev) => new Date(year, prev.getMonth(), 1));
                    }}
                    style={{
                      width: 90, padding: '6px 8px', borderRadius: 6,
                      border: '1px solid var(--color-border)', background: 'var(--color-bg-card-deep)',
                      color: 'var(--color-text-primary)', fontSize: 13,
                    }}
                  >
                    {Array.from({ length: 21 }, (_, i) => {
                      const year = new Date().getFullYear() - 10 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              )}
            </div>

            <button className="btn-icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            className="btn-icon calendar-toolbar-expand"
            title={isExpanded
              ? (language === 'en' ? 'Collapse' : 'Thu gọn')
              : (language === 'en' ? 'Expand' : 'Phóng to')}
            onClick={() => {
              setIsExpanded((prev) => !prev);
              if (!isExpanded) setSelectedContractId(null);
            }}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {/* Weekday Labels */}
        <div className="calendar-grid">
          {weekDaysHeader.map((wd) => (
            <div key={wd} className="cal-weekday">{wd}</div>
          ))}

          {/* Day Cells */}
          {calDays.map((day) => {
            const daySlots = getSlotsForDate(day);
            const dayContracts = getContractEntriesForDate(day);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const todayDay = isToday(day);
            const totalCount = daySlots.length + dayContracts.length;

            return (
              <div
                key={day.toISOString()}
                role="button"
                tabIndex={0}
                className={`cal-day ${!isCurrentMonth ? 'cal-day--other' : ''} ${isSelected ? 'cal-day--selected' : ''} ${todayDay ? 'cal-day--today' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <span className="cal-day-num">{format(day, 'd')}</span>

                {isExpanded ? (
                  dayContracts.length > 0 && (
                    <div className="cal-day-contract-chips">
                      {dayContracts.map((c) => {
                        const color = getContractColor(c.contractId);
                        return (
                          <span
                            key={`chip-${c.contractId}`}
                            className="cal-day-contract-chip"
                            style={{ background: `${color}26`, color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContractId(c.contractId);
                            }}
                          >
                            {formatTime(c.startDateTime)}–{formatTime(c.endDateTime)} {c.tenantName}
                          </span>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <>
                    {(daySlots.length > 0 || dayContracts.length > 0) && (
                      <div className="cal-day-dots">
                        {dayContracts.slice(0, 3).map((c) => (
                          <div key={`c-${c.contractId}`} className="cal-dot" style={{ background: getContractColor(c.contractId) }} />
                        ))}
                        {daySlots.slice(0, 3 - Math.min(dayContracts.length, 3)).map((s, i) => (
                          <div key={i} className="cal-dot" style={{ background: slotStatusConfig[s.status].color }} />
                        ))}
                        {totalCount > 3 && <span className="cal-dot-more">+{totalCount - 3}</span>}
                      </div>
                    )}
                    {totalCount > 0 && (
                      <div className="cal-slot-count">{totalCount}</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
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
          </div>

          {selectedContracts.length === 0 && selectedSlots.length === 0 ? (
            <div className="day-detail-empty">
              <Info size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
              <p className="text-secondary" style={{ fontSize: 14, marginTop: 10 }}>{t('renter.noSlotThisDay')}</p>
            </div>
          ) : (
            <div className="slot-list">
              {isContractCalendarLoading && (
                <div className="slot-item" style={{ borderLeftColor: contractStatusColor }}>
                  <span className="text-secondary" style={{ fontSize: 12 }}>{t('renter.loadingContracts')}</span>
                </div>
              )}
              {selectedContracts.map((contract) => {
                const color = getContractColor(contract.contractId);
                return (
                  <div
                    key={`contract-${contract.contractId}`}
                    className="slot-item"
                    style={{ borderLeftColor: color, cursor: 'pointer' }}
                    onClick={() => setSelectedContractId(contract.contractId)}
                  >
                    <div className="slot-item-top">
                      <div className="slot-time">
                        <Clock size={13} style={{ color }} />
                        <span>{formatTime(contract.startDateTime)} – {formatTime(contract.endDateTime)}</span>
                      </div>
                      <span
                        className="badge"
                        style={{ background: `${color}26`, color, border: `1px solid ${color}30` }}
                      >
                        <FileText size={11} />
                        {t('renter.contractStatus')} #{contract.contractId}
                      </span>
                    </div>
                    <div className="slot-tenant">
                      <div className="avatar avatar--sm" style={{ background: color }}>
                        {getInitials(contract.tenantName)}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>{contract.tenantName}</p>
                        <p className="text-secondary" style={{ fontSize: 11 }}>
                          {contract.businessDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {selectedContractId != null && (
        <ContractDetailModal
          contractId={selectedContractId}
          color={getContractColor(selectedContractId)}
          onClose={() => setSelectedContractId(null)}
        />
      )}
    </div>
  );
};
