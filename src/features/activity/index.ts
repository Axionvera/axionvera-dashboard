/**
 * @module features/activity
 *
 * Public API for the activity feed feature.
 * Domain logic lives in `@/services/events` and `@/store/activityStore`.
 */

export { default as ActivityFeed, type ActivityFeedProps } from "./components/ActivityFeed";
export { default as ActivityItem } from "./components/ActivityItem";
export { default as ConnectionStatusBadge } from "./components/ConnectionStatusBadge";
