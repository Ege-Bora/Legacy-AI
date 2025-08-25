import { i18n } from '../i18n';

// Locale mapping for all supported languages
const getLocaleString = (language: string): string => {
  const localeMap: Record<string, string> = {
    'en': 'en-US',
    'tr': 'tr-TR',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'ar': 'ar-SA',
  };
  
  return localeMap[language] || 'en-US';
};

/**
 * Format a date using the current locale
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocaleString(i18n.language);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
};

/**
 * Format a date relative to now (e.g., "2 days ago", "in 3 hours")
 */
export const formatRelative = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const locale = getLocaleString(i18n.language);
  
  // Use Intl.RelativeTimeFormat for modern browsers
  if (Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ] as const;
    
    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
      if (count >= 1) {
        return rtf.format(diffInSeconds > 0 ? -count : count, interval.label);
      }
    }
    
    return rtf.format(0, 'second');
  }
  
  // Fallback for older environments - use basic English
  const absSeconds = Math.abs(diffInSeconds);
  const isFuture = diffInSeconds < 0;
  
  if (absSeconds < 60) {
    return isFuture ? 'in a few seconds' : 'a few seconds ago';
  }
  
  const minutes = Math.floor(absSeconds / 60);
  if (minutes < 60) {
    return isFuture 
      ? `in ${minutes} minute${minutes > 1 ? 's' : ''}` 
      : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return isFuture 
      ? `in ${hours} hour${hours > 1 ? 's' : ''}` 
      : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  return isFuture 
    ? `in ${days} day${days > 1 ? 's' : ''}` 
    : `${days} day${days > 1 ? 's' : ''} ago`;
};

/**
 * Format a number using the current locale
 */
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  const locale = getLocaleString(i18n.language);
  return new Intl.NumberFormat(locale, options).format(num);
};

/**
 * Format a currency amount using the current locale
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const locale = getLocaleString(i18n.language);
  
  // Use appropriate currency for locale
  const currencyMap: Record<string, string> = {
    'tr-TR': 'TRY',
    'fr-FR': 'EUR',
    'de-DE': 'EUR',
    'it-IT': 'EUR',
    'es-ES': 'EUR',
    'ar-SA': 'SAR',
  };
  
  const localCurrency = currencyMap[locale] || currency;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: localCurrency,
  }).format(amount);
};

/**
 * Format a percentage using the current locale
 */
export const formatPercent = (value: number, options?: Intl.NumberFormatOptions): string => {
  const locale = getLocaleString(i18n.language);
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    ...options,
  }).format(value);
};
