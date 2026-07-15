export const formatVnd = (amount: number, language: 'en' | 'vi') =>
  language === 'en'
    ? `${amount.toLocaleString('en-US')} VND`
    : `${amount.toLocaleString('vi-VN')}₫`;

export const formatDateTime = (iso: string, language: 'en' | 'vi') =>
  new Date(iso).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
