// Utility functions

import { type ClassValue } from 'clsx';

// Simple className utility (mimics clsx behavior)
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .filter(Boolean)
    .join(' ')
    .trim();
}

// Format time elapsed (e.g., "2h 15m")
export function formatElapsedTime(startTime: string | Date): string {
  const start = new Date(startTime);
  const now = new Date();
  const diff = now.getTime() - start.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Format wait time for back-of-house items
export function formatWaitTime(receivedAt: string | Date): string {
  const received = new Date(receivedAt);
  const now = new Date();
  const diff = now.getTime() - received.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Get wait time category for color coding
export function getWaitTimeCategory(receivedAt: string | Date): 'normal' | 'warning' | 'critical' {
  const received = new Date(receivedAt);
  const now = new Date();
  const minutes = Math.floor((now.getTime() - received.getTime()) / (1000 * 60));

  if (minutes >= 60) return 'critical';
  if (minutes >= 30) return 'warning';
  return 'normal';
}

// Format date for display
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format time for display
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format date and time
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// Play beep sound for successful scan
export function playBeep(): void {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.value = 0.3;

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

// Check if session has been open too long (>4 hours)
export function isSessionStale(entryTime: string | Date): boolean {
  const entry = new Date(entryTime);
  const now = new Date();
  const hours = (now.getTime() - entry.getTime()) / (1000 * 60 * 60);
  return hours > 4;
}

// Validate tag format (3 digits OR 4+ alphanumeric)
export function isValidTag(tag: string): boolean {
  // Allow 3-digit tags (e.g., 001, 042) OR 4+ alphanumeric
  return /^\d{3}$/.test(tag) || /^[A-Z0-9]{4,}$/i.test(tag);
}

// Validate item barcode format (4+ alphanumeric characters)
export function isValidBarcode(barcode: string): boolean {
  // Allow alphanumeric barcodes with minimum length of 4
  return /^[A-Z0-9]{4,}$/i.test(barcode);
}

// Generate unique ID (simple implementation)
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get date range for filtering
export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(period: 'today' | 'yesterday' | '7days' | '30days' | 'custom', customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    case '7days':
      return {
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now,
      };
    case '30days':
      return {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
      };
    case 'custom':
      return {
        start: customStart || today,
        end: customEnd || now,
      };
    default:
      return {
        start: today,
        end: now,
      };
  }
}
