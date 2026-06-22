import { useState, useRef, useEffect } from 'react';
import { useRole } from '../data/RoleContext';
import { useNotifications, type Notification } from '../data/NotificationContext';
import { cn } from '../utils/cn';

const severityStyles: Record<Notification['severity'], { dot: string; bg: string }> = {
  info:     { dot: 'bg-blue-500', bg: 'bg-blue-50' },
  success:  { dot: 'bg-emerald-500', bg: 'bg-emerald-50' },
  warning:  { dot: 'bg-amber-500', bg: 'bg-amber-50' },
  critical: { dot: 'bg-red-500', bg: 'bg-red-50' },
};

export function NotificationBell() {
  const { role } = useRole();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const count = role ? unreadCount(role) : 0;

  const visible = notifications
    .filter(n => role && (n.recipientRole === role || n.recipientRole === 'all'))
    .slice(0, 8);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 min-w-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {count > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {visible.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <p className="text-sm text-gray-400">No notifications</p>
              </div>
            ) : (
              visible.map(n => {
                const style = severityStyles[n.severity];
                return (
                  <button
                    key={n.id}
                    onClick={() => { markRead(n.id); }}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3',
                      !n.read && style.bg,
                    )}
                  >
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <span className={cn('w-2 h-2 rounded-full', n.read ? 'bg-gray-300' : style.dot)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-xs font-semibold truncate', n.read ? 'text-gray-600' : 'text-gray-900')}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">{formatTime(n.timestamp)}</span>
                      </div>
                      <p className={cn('text-xs mt-0.5 line-clamp-2', n.read ? 'text-gray-400' : 'text-gray-600')}>
                        {n.message}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {visible.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[11px] text-gray-400 text-center">
                Showing {visible.length} most recent
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
