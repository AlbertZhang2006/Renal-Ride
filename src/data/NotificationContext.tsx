/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { UserRole } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  recipientRole: UserRole | 'all';
  patientId: string | null;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: UserRole;
  actorName: string;
  action: string;
  target: string;
  details: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning';
}

// ---------------------------------------------------------------------------
// Seed data — pre-existing events that happened before the user opened the app
// ---------------------------------------------------------------------------

function seedNotifications(): Notification[] {
  const today = new Date();
  const at = (h: number, m: number) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 'n-seed-1', recipientRole: 'clinic', patientId: 'pt-1',
      title: 'Patient Picked Up', message: 'Maria Santos was picked up at 5:18 AM by Tony Reeves.',
      timestamp: at(5, 18), read: true, severity: 'success',
    },
    {
      id: 'n-seed-2', recipientRole: 'caregiver', patientId: 'pt-1',
      title: 'Patient Picked Up', message: 'Maria was picked up and is on the way to the clinic.',
      timestamp: at(5, 18), read: true, severity: 'success',
    },
    {
      id: 'n-seed-3', recipientRole: 'clinic', patientId: 'pt-1',
      title: 'Patient Arrived', message: 'Maria Santos arrived at Fresenius Kidney Care — Riverside.',
      timestamp: at(5, 52), read: true, severity: 'info',
    },
    {
      id: 'n-seed-4', recipientRole: 'clinic', patientId: 'pt-6',
      title: 'Issue Reported', message: 'Wrong vehicle sent for Fatima Al-Rashid. Female driver was requested.',
      timestamp: at(5, 30), read: false, severity: 'warning',
    },
    {
      id: 'n-seed-5', recipientRole: 'vendor', patientId: 'pt-8',
      title: 'Late Pickup Alert', message: 'Linda Martinez pickup is 18 minutes late. Traffic delay on Florin Rd.',
      timestamp: at(9, 33), read: false, severity: 'warning',
    },
    {
      id: 'n-seed-6', recipientRole: 'admin', patientId: null,
      title: 'Safety Concern Filed', message: 'Driver texting while driving reported for ride-11. Under review.',
      timestamp: at(6, 10), read: false, severity: 'critical',
    },
    {
      id: 'n-seed-7', recipientRole: 'clinic', patientId: 'pt-4',
      title: 'Driver Replacement', message: 'Original driver for Dorothy Williams called off. Kevin Park assigned.',
      timestamp: at(9, 8), read: false, severity: 'warning',
    },
  ];
}

function seedAuditLog(): AuditLogEntry[] {
  const today = new Date();
  const at = (h: number, m: number) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const entries: AuditLogEntry[] = [
    { id: 'a-seed-1', timestamp: at(4, 30), actorRole: 'admin', actorName: 'System', action: 'rides_generated', target: 'All patients', details: 'Standing orders generated 12 rides for today' },
    { id: 'a-seed-2', timestamp: at(4, 45), actorRole: 'admin', actorName: 'System', action: 'vendor_assigned', target: 'CareRide Medical Transport', details: 'Auto-assigned to 6 rides based on standing orders' },
    { id: 'a-seed-3', timestamp: at(5, 15), actorRole: 'vendor', actorName: 'CareRide Dispatch', action: 'status_changed', target: 'Maria S. (ride-1)', details: 'Status changed to driver_en_route — Tony Reeves dispatched' },
    { id: 'a-seed-4', timestamp: at(5, 18), actorRole: 'vendor', actorName: 'Tony Reeves', action: 'patient_picked_up', target: 'Maria S. (ride-1)', details: 'Patient picked up at 1815 Alhambra Blvd' },
    { id: 'a-seed-5', timestamp: at(5, 20), actorRole: 'admin', actorName: 'System', action: 'caregiver_notified', target: 'Carlos Santos', details: 'Notified via SMS + email: Maria picked up' },
    { id: 'a-seed-6', timestamp: at(5, 25), actorRole: 'vendor', actorName: 'Valley Health Dispatch', action: 'issue_reported', target: 'Fatima A. (ride-12)', details: 'Wrong vehicle — male driver sent, female requested' },
    { id: 'a-seed-7', timestamp: at(5, 52), actorRole: 'vendor', actorName: 'Tony Reeves', action: 'status_changed', target: 'Maria S. (ride-1)', details: 'Arrived at clinic' },
    { id: 'a-seed-8', timestamp: at(6, 0), actorRole: 'clinic', actorName: 'Dr. Sarah Patel', action: 'status_changed', target: 'Maria S., Robert J.', details: 'Marked as in_treatment' },
    { id: 'a-seed-9', timestamp: at(6, 10), actorRole: 'patient', actorName: 'James Chen', action: 'issue_reported', target: 'ride-11', details: 'Safety concern: driver texting while driving' },
    { id: 'a-seed-10', timestamp: at(9, 5), actorRole: 'vendor', actorName: 'CareRide Dispatch', action: 'issue_reported', target: 'Dorothy W. (ride-4)', details: 'Original driver no-show, replacement assigned' },
  ];
  return entries.reverse();
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface NotificationContextValue {
  notifications: Notification[];
  auditLog: AuditLogEntry[];
  toasts: Toast[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  addAuditLogEntry: (e: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  addToast: (message: string, type?: Toast['type']) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: (role: UserRole) => number;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(seedAuditLog);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts(prev => prev.slice(1)), 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    setNotifications(prev => [{
      ...n,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    }, ...prev]);
  }, []);

  const addAuditLogEntry = useCallback((e: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    setAuditLog(prev => [{
      ...e,
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    }, ...prev]);
  }, []);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = useCallback((role: UserRole) => {
    return notifications.filter(n => !n.read && (n.recipientRole === role || n.recipientRole === 'all')).length;
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications, auditLog, toasts,
      addNotification, addAuditLogEntry, addToast,
      markRead, markAllRead, unreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
