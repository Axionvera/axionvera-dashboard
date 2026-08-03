import { cn } from '@/lib/utils';
import { Badge } from '@/design-system';
import {
  NOTIFICATION_ACTION_CLASS,
  NOTIFICATION_CATEGORY_LABELS,
} from '@/notifications/constants';
import type { AppNotification, NotificationCategory, NotificationPriority } from '@/notifications/types';

const CATEGORY_BADGE: Record<NotificationCategory, 'info' | 'success' | 'warning' | 'default'> = {
  protocol: 'info',
  transaction: 'default',
  governance: 'warning',
  reward: 'success',
};

const PRIORITY_DOT: Record<NotificationPriority, string> = {
  critical: 'bg-rose-500',
  high: 'bg-amber-500',
  normal: 'bg-axion-500',
  low: 'bg-slate-400',
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString();
}

export interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
}: NotificationItemProps) {
  const category = notification.category;

  return (
    <li
      className={cn(
        'rounded-xl border border-border-primary p-3 transition',
        notification.read
          ? 'bg-background-secondary/10 opacity-80'
          : 'bg-background-secondary/30',
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
            PRIORITY_DOT[notification.priority],
          )}
          aria-hidden="true"
          title={`${notification.priority} priority`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-text-primary">{notification.title}</p>
            <Badge variant={CATEGORY_BADGE[category]}>
              {NOTIFICATION_CATEGORY_LABELS[category]}
            </Badge>
            {!notification.read ? (
              <span className="sr-only">Unread</span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-text-secondary">{notification.message}</p>
          <time
            className="mt-1 block text-[10px] text-text-muted"
            dateTime={notification.timestamp}
          >
            {formatTimestamp(notification.timestamp)}
          </time>
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        {!notification.read ? (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            className={cn(NOTIFICATION_ACTION_CLASS, 'text-axion-500 hover:bg-background-secondary/60')}
          >
            Mark read
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onDismiss(notification.id)}
          className={cn(NOTIFICATION_ACTION_CLASS, 'text-text-secondary hover:bg-background-secondary/60')}
        >
          Dismiss
        </button>
      </div>
    </li>
  );
}
