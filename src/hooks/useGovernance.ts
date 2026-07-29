/**
 * @module hooks/useGovernance
 *
 * Convenience re-exports from the governance context and provider registry.
 *
 * Consuming components should import from this path rather than from the
 * internal context module directly, keeping the import surface stable as
 * the implementation evolves.
 */
export { useGovernanceContext, useGovernance, GovernanceProvider } from "@/contexts/GovernanceContext";