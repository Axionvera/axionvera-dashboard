import {
  NOTIFICATION_FILTER_CATEGORIES,
  NOTIFICATION_READ_FILTERS,
} from '@/notifications/constants';
import type {
  NotificationFilter,
  NotificationFilterCategory,
  NotificationFilterRead,
} from '@/notifications/types';

export interface NotificationFiltersProps {
  filter: NotificationFilter;
  onFilterChange: (filter: Partial<NotificationFilter>) => void;
}

export default function NotificationFilters({
  filter,
  onFilterChange,
}: NotificationFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border-primary px-3 py-2">
      <label className="sr-only" htmlFor="notification-category-filter">
        Filter by category
      </label>
      <select
        id="notification-category-filter"
        value={filter.category}
        onChange={(e) =>
          onFilterChange({ category: e.target.value as NotificationFilterCategory })
        }
        className="rounded-lg border border-border-primary bg-background-secondary/30 px-2 py-1 text-xs text-text-primary focus:border-axion-500 focus:outline-none"
      >
        {NOTIFICATION_FILTER_CATEGORIES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="notification-read-filter">
        Filter by read status
      </label>
      <select
        id="notification-read-filter"
        value={filter.read}
        onChange={(e) =>
          onFilterChange({ read: e.target.value as NotificationFilterRead })
        }
        className="rounded-lg border border-border-primary bg-background-secondary/30 px-2 py-1 text-xs text-text-primary focus:border-axion-500 focus:outline-none"
      >
        {NOTIFICATION_READ_FILTERS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
