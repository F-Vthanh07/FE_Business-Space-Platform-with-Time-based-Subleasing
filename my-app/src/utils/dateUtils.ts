/**
 * Helper utilities to adjust and format dates received from the backend,
 * correcting the timezone shift when UTC strings are parsed in Vietnam (UTC+7).
 */

export const adjustDateForVietnam = (dateInput: string | Date | number | null | undefined): Date | null => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  // Add 7 hours to convert UTC timestamp to Vietnam time (UTC+7)
  d.setHours(d.getHours() + 7);
  return d;
};

export const formatDate = (
  dateInput: string | Date | number | null | undefined,
  locale: string = 'vi-VN',
  placeholder: string = 'Không rõ'
): string => {
  const d = adjustDateForVietnam(dateInput);
  if (!d) return placeholder;
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateTime = (
  dateInput: string | Date | number | null | undefined,
  locale: string = 'vi-VN',
  placeholder: string = 'Không rõ'
): string => {
  const d = adjustDateForVietnam(dateInput);
  if (!d) return placeholder;
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateISOOnly = (dateInput: string | Date | number | null | undefined): string => {
  if (!dateInput) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const d = adjustDateForVietnam(dateInput);
  if (!d) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
