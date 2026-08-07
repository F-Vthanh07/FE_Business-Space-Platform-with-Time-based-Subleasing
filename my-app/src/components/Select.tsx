import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number | '';
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '-- Chọn --',
  disabled,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div className={`custom-select ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'custom-select-trigger--open' : ''}`}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
      >
        <span className={selected ? '' : 'custom-select-placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="custom-select-chevron" />
      </button>

      {isOpen && (
        <div className="custom-select-menu">
          {options.length === 0 && (
            <div className="custom-select-empty">Không có dữ liệu</div>
          )}
          {options.map(option => (
            <button
              type="button"
              key={option.value}
              className={`custom-select-option ${String(option.value) === String(value) ? 'custom-select-option--active' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
