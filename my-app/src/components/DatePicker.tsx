import React, { useState, useRef, useEffect } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import './DatePicker.css';

interface DatePickerProps {
  value: string; // "yyyy-MM-dd"
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string; // "yyyy-MM-dd"
  max?: string; // "yyyy-MM-dd"
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, disabled, min, max }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = value ? parseISO(value) : null;
  const [viewMonth, setViewMonth] = useState(selectedDate || new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && selectedDate) setViewMonth(selectedDate);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const minDate = min ? parseISO(min) : null;
  const maxDate = max ? parseISO(max) : null;

  const gridStart = startOfWeek(startOfMonth(viewMonth));
  const gridEnd = endOfWeek(endOfMonth(viewMonth));
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const isDisabled = (day: Date) => {
    if (minDate && day < minDate) return true;
    if (maxDate && day > maxDate) return true;
    return false;
  };

  const handleSelect = (day: Date) => {
    if (isDisabled(day)) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  return (
    <div className="custom-datepicker" ref={rootRef}>
      <button
        type="button"
        className={`custom-datepicker-trigger ${isOpen ? 'custom-datepicker-trigger--open' : ''}`}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
      >
        <CalendarIcon size={14} className="custom-datepicker-icon" />
        <span className={selectedDate ? '' : 'custom-datepicker-placeholder'}>
          {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Chọn ngày'}
        </span>
      </button>

      {isOpen && (
        <div className="custom-datepicker-popup">
          <div className="custom-datepicker-header">
            <button type="button" className="custom-datepicker-nav" onClick={() => setViewMonth(prev => subMonths(prev, 1))}>
              <ChevronLeft size={16} />
            </button>
            <span className="custom-datepicker-month-label">{format(viewMonth, 'MM/yyyy')}</span>
            <button type="button" className="custom-datepicker-nav" onClick={() => setViewMonth(prev => addMonths(prev, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="custom-datepicker-weekdays">
            {WEEKDAY_LABELS.map(w => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="custom-datepicker-grid">
            {days.map(day => {
              const outOfMonth = !isSameMonth(day, viewMonth);
              const active = selectedDate ? isSameDay(day, selectedDate) : false;
              const disabledDay = isDisabled(day);
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  className={[
                    'custom-datepicker-day',
                    outOfMonth ? 'custom-datepicker-day--muted' : '',
                    active ? 'custom-datepicker-day--active' : '',
                    disabledDay ? 'custom-datepicker-day--disabled' : ''
                  ].filter(Boolean).join(' ')}
                  disabled={disabledDay}
                  onClick={() => handleSelect(day)}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
