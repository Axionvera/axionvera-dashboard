import type { ActivityEvent } from '@/services/events/types';
import type { VaultTx, VaultBalances } from '@/utils/contractHelpers';
import type { Proposal } from '@/utils/contractHelpersGovernance';

import type { RewardPayload, SearchDocument } from './types';

function joinFields(...parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/** Normalize a vault transaction into a search document. */
export function normalizeTransaction(tx: VaultTx): SearchDocument {
  const isReward = tx.type === 'claim';
  return {
    id: `tx:${tx.id}`,
    entityType: isReward ? 'reward' : 'transaction',
    title: isReward
      ? `Reward claim: ${tx.amount}`
      : `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}: ${tx.amount}`,
    subtitle: tx.hash ? `Hash ${tx.hash}` : tx.status,
    searchableText: joinFields(tx.id, tx.type, tx.amount, tx.status, tx.hash, tx.createdAt),
    timestamp: tx.createdAt,
    status: tx.status,
    route: '/dashboard',
    payload: tx,
  };
}

/** Normalize vault balance snapshot into a navigational search document. */
export function normalizeVault(balances: VaultBalances): SearchDocument {
  return {
    id: 'vault:balances',
    entityType: 'vault',
    title: `Vault balance: ${balances.balance}`,
    subtitle: `Rewards: ${balances.rewards}`,
    searchableText: joinFields('vault', 'balance', balances.balance, 'rewards', balances.rewards),
    route: '/dashboard',
    payload: balances,
  };
}

/** Normalize a governance proposal into a search document. */
export function normalizeProposal(proposal: Proposal): SearchDocument {
  return {
    id: `proposal:${proposal.id}`,
    entityType: 'proposal',
    title: proposal.title,
    subtitle: `${proposal.status} · ${proposal.proposer}`,
    searchableText: joinFields(
      proposal.id,
      proposal.title,
      proposal.description,
      proposal.proposer,
      proposal.status,
      proposal.metadataUri,
    ),
    timestamp: proposal.createdAt,
    status: proposal.status,
    route: '/governance',
    payload: proposal,
  };
}

/** Normalize a reward claim transaction into a dedicated reward document. */
export function normalizeReward(tx: VaultTx): SearchDocument {
  const payload: RewardPayload = {
    id: tx.id,
    amount: tx.amount,
    claimedAt: tx.createdAt,
    hash: tx.hash,
  };

  return {
    id: `reward:${tx.id}`,
    entityType: 'reward',
    title: `Reward: ${tx.amount}`,
    subtitle: tx.hash ? `Claimed · ${tx.hash}` : 'Reward claim',
    searchableText: joinFields('reward', tx.id, tx.amount, tx.hash, tx.createdAt, tx.status),
    timestamp: tx.createdAt,
    status: tx.status,
    route: '/analytics',
    payload,
  };
}

/** Normalize a protocol activity event into a search document. */
export function normalizeActivity(event: ActivityEvent): SearchDocument {
  return {
    id: `activity:${event.id}`,
    entityType: 'activity',
    title: event.name,
    subtitle: `${event.type} · Ledger ${event.ledger}`,
    searchableText: joinFields(
      event.id,
      event.name,
      event.type,
      event.contractId,
      event.ledger.toString(),
      ...event.topics,
      JSON.stringify(event.value),
      event.timestamp,
    ),
    timestamp: event.timestamp,
    status: event.type,
    route: '/monitoring',
    payload: event,
  };
}

/** Deduplicate documents by id, keeping the first occurrence. */
export function dedupeDocuments(docs: SearchDocument[]): SearchDocument[] {
  const seen = new Set<string>();
  return docs.filter((doc) => {
    if (seen.has(doc.id)) return false;
    seen.add(doc.id);
    return true;
  });
}
