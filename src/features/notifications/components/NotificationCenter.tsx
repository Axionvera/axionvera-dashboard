import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

import { IconButton } from '@/design-system';
import { NOTIFICATION_ACTION_CLASS } from '@/notifications/constants';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import NotificationFilters from './NotificationFilters';
import NotificationItem from './NotificationItem';

/**
 * Navbar notification center panel (#268). Displays priority-sorted alerts
 * with category/read filters, dismissal, and persistent read state.
 */
export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    filter,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAllVisible,
    setFilter,
  } = useNotifications();

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        document.getElementById('notification-center-button')?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadLabel =
    unreadCount === 0
      ? 'Notifications'
      : `Notifications, ${unreadCount} unread`;

  return (
    <div className="relative" ref={panelRef}>
      <IconButton
        id="notification-center-button"
        label={unreadLabel}
        variant="default"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="notification-center-panel"
        onClick={() => setIsOpen((v) => !v)}
        className="relative"
      >
        <Bell className="h-4 w-4" strokeWidth={2} />
      </IconButton>

      {unreadCount > 0 ? (
        <span
          className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-axion-500 px-1 text-[10px] font-semibold text-white"
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}

      {isOpen ? (
        <div
          id="notification-center-panel"
          role="region"
          aria-label="Notification center"
          className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-border-primary bg-background-primary shadow-xl ring-1 ring-black/5 dark:ring-white/5 sm:w-96"
        >
          <header className="flex items-center justify-between gap-2 px-4 py-3">
            <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
            <div className="flex gap-1">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className={cn(NOTIFICATION_ACTION_CLASS, 'text-axion-500 hover:bg-background-secondary/60')}
                >
                  Mark all read
                </button>
              ) : null}
              {notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={dismissAllVisible}
                  className={cn(NOTIFICATION_ACTION_CLASS, 'text-text-secondary hover:bg-background-secondary/60')}
                >
                  Dismiss all
                </button>
              ) : null}
            </div>
          </header>

          <NotificationFilters filter={filter} onFilterChange={setFilter} />

          <div
            className="max-h-96 overflow-y-auto px-3 py-2"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {notifications.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">
                No notifications match the current filters.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 py-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDismiss={dismiss}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
