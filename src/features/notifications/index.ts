/**
 * @module features/notifications
 *
 * Public API for the notification centre UI.
 * Filtering, prioritisation, selectors and persistence live in `@/notifications`.
 */

export { default as NotificationCenter } from "./components/NotificationCenter";
export {
  default as NotificationItem,
  type NotificationItemProps,
} from "./components/NotificationItem";
export {
  default as NotificationFilters,
  type NotificationFiltersProps,
} from "./components/NotificationFilters";
