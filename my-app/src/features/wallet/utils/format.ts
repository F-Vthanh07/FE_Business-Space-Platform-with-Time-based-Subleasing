import { formatDateTime as formatDateTimeUtil } from '../../../utils/dateUtils';

export const formatVnd = (amount: number, language: 'en' | 'vi') =>
  language === 'en'
    ? `${amount.toLocaleString('en-US')} VND`
    : `${amount.toLocaleString('vi-VN')} ₫`;

export const formatDateTime = (iso: string, language: 'en' | 'vi') =>
  formatDateTimeUtil(iso, language === 'en' ? 'en-US' : 'vi-VN', '');
