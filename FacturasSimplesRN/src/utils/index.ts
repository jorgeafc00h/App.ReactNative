// Utility functions for the application

/**
 * Generates a unique ID for entities
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formats a date to ISO string (YYYY-MM-DD)
 */
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Formats currency for display
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (El Salvador)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\d{4}-?\d{4}$/; // 2234-5678 or 22345678
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validates DUI format (El Salvador)
 */
export const isValidDUI = (dui: string): boolean => {
  const duiRegex = /^\d{8}-?\d$/; // 12345678-9 or 123456789
  return duiRegex.test(dui.replace(/\s/g, ''));
};

/**
 * Formats DUI with dash
 */
export const formatDUI = (dui: string): string => {
  const cleanDUI = dui.replace(/\D/g, '');
  if (cleanDUI.length === 9) {
    return `${cleanDUI.slice(0, 8)}-${cleanDUI.slice(8)}`;
  }
  return dui;
};

/**
 * Formats phone with dash
 */
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 8) {
    return `${cleanPhone.slice(0, 4)}-${cleanPhone.slice(4)}`;
  }
  return phone;
};

/**
 * Capitalizes first letter of each word
 */
export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Truncates text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Debounces a function call
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Deep clones an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * Validates if a string is empty or whitespace
 */
export const isEmpty = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * Calculates percentage
 */
export const calculatePercentage = (part: number, whole: number): number => {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
};

/**
 * Generates a UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Sleep/delay utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};