/**
 * @module hooks/useVault
 *
 * Convenience re-exports from the vault context and provider registry.
 *
 * Consuming components should import from this path rather than from the
 * internal context module directly, keeping the import surface stable as
 * the implementation evolves.
 */
export { useVaultContext, useVault, VaultProvider } from "@/contexts/VaultContext";
