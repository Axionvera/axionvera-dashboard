# State Management Migration Guide

## Quick Start

This guide provides step-by-step instructions for migrating from context-based state to observable stores.

---

## Step 1: Create Base Store Class

Create reusable base class with common patterns:

```typescript
// src/store/base/BaseStore.ts

export abstract class BaseStore<TState> {
  protected state: TState;
  protected readonly listeners = new Set<() => void>();

  constructor(initialState: TState) {
    this.state = initialState;
    // Pre-bind for stable references in useSyncExternalStore
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
  }

  /**
   * Subscribe to state changes.
   * Returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state snapshot.
   * Must return immutable reference.
   */
  getSnapshot(): TState {
    return this.state;
  }

  /**
   * Notify all subscribers of state change.
   * Call after any state update.
   */
  protected emit(): void {
    this.listeners.forEach((cb) => cb());
  }

  /**
   * Update state immutably and notify subscribers.
   */
  protected setState(partial: Partial<TState>): void {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  /**
   * Get current listener count (useful for debugging).
   */
  getListenerCount(): number {
    return this.listeners.size;
  }
}
```



## Step 2: Implement WalletStore

Replace WalletContext with observable store:

```typescript
// src/store/walletStore.ts

import { BaseStore } from './base/BaseStore';
import { StellarNetwork, NETWORK } from '@/utils/networkConfig';
import { WalletId } from '@/wallets';
import {
  connectWallet,
  disconnectWallet,
  switchWallet as switchWalletService,
  restoreSession,
  pollSession,
} from '@/services/walletService';
import { notify } from '@/utils/notifications';
import { emit } from '@/observability/diagnostics';

interface WalletState {
  address: string | null;
  network: StellarNetwork;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  walletType: WalletId | null;
}

const INITIAL_STATE: WalletState = {
  address: null,
  network: NETWORK,
  balance: null,
  isConnecting: false,
  error: null,
  walletType: null,
};

class WalletStore extends BaseStore<WalletState> {
  private pollingInterval: NodeJS.Timeout | null = null;
  private balanceFetchController: AbortController | null = null;

  constructor() {
    super(INITIAL_STATE);
    this.restoreSessionOnInit();
  }

  private async restoreSessionOnInit() {
    if (typeof window === 'undefined') return;
    
    const session = await restoreSession();
    if (session) {
      this.setState({
        address: session.address,
        network: session.network,
        walletType: session.walletId,
      });
      this.startPolling();
      this.fetchBalance();
    }
  }

  async connect(walletType: WalletId): Promise<void> {
    this.setState({ isConnecting: true, error: null });

    try {
      const session = await connectWallet(walletType);
      this.setState({
        address: session.address,
        network: session.network,
        walletType: session.walletId,
        isConnecting: false,
        error: null,
      });

      this.startPolling();
      this.fetchBalance();

      emit('wallet_connected', { address: session.address, walletType });
      notify.success('Wallet Connected', `Successfully connected to ${walletType}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      this.setState({
        isConnecting: false,
        error: message,
      });
      emit('wallet_connect_error', { error: message, walletType });
      notify.error('Connection Failed', message);
    }
  }


  disconnect(): void {
    this.stopPolling();
    
    if (this.balanceFetchController) {
      this.balanceFetchController.abort();
    }

    const currentWalletType = this.state.walletType;
    
    this.state = INITIAL_STATE;
    this.emit();

    if (currentWalletType) {
      disconnectWallet(currentWalletType).catch(() => {});
    }

    emit('wallet_disconnected');
    notify.success('Wallet Disconnected', 'You have been disconnected');
  }

  async switchWallet(newWalletId: WalletId): Promise<void> {
    if (newWalletId === this.state.walletType) return;

    this.setState({ isConnecting: true, error: null });

    try {
      const session = await switchWalletService(this.state.walletType, newWalletId);
      this.setState({
        address: session.address,
        network: session.network,
        walletType: session.walletId,
        isConnecting: false,
        balance: null,
      });
      
      this.fetchBalance();
      notify.success('Wallet Switched', `Now connected to ${newWalletId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Switch failed';
      this.setState({
        isConnecting: false,
        error: message,
      });
      notify.error('Switch Failed', message);
    }
  }

  private startPolling(): void {
    if (this.pollingInterval) return;
    
    this.pollingInterval = setInterval(() => {
      this.checkForChanges();
    }, 5000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async checkForChanges(): Promise<void> {
    if (!this.state.walletType) return;

    const session = await pollSession(this.state.walletType);
    if (!session) return;

    // Only update if values actually changed
    if (
      session.address !== this.state.address ||
      session.network !== this.state.network
    ) {
      this.setState({
        address: session.address,
        network: session.network,
      });
      this.fetchBalance();
    }
  }

  private async fetchBalance(): Promise<void> {
    if (!this.state.address) {
      this.setState({ balance: null });
      return;
    }

    // Cancel previous fetch
    if (this.balanceFetchController) {
      this.balanceFetchController.abort();
    }

    this.balanceFetchController = new AbortController();

    try {
      const horizonUrl =
        this.state.network === 'mainnet'
          ? 'https://horizon.stellar.org'
          : 'https://horizon-testnet.stellar.org';

      const response = await fetch(
        `${horizonUrl}/accounts/${this.state.address}`,
        { signal: this.balanceFetchController.signal }
      );

      if (!response.ok) throw new Error('Failed to fetch balance');

      const data = await response.json();
      const xlmBalance = data.balances?.find(
        (b: any) => b.asset_type === 'native'
      );

      this.setState({ balance: xlmBalance?.balance ?? '0' });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.setState({ balance: '0' });
      }
    }
  }
}

export const walletStore = new WalletStore();
```



## Step 3: Create Wallet Hooks

Replace context consumption with store hooks:

```typescript
// src/hooks/useWallet.ts

import { useSyncExternalStore, useMemo } from 'react';
import { walletStore } from '@/store/walletStore';
import { getAvailableWallets } from '@/services/walletService';

/**
 * Main wallet hook - returns full wallet state.
 * Components using this will re-render on any wallet state change.
 */
export function useWallet() {
  const state = useSyncExternalStore(
    walletStore.subscribe,
    walletStore.getSnapshot
  );

  const availableWallets = useMemo(() => getAvailableWallets(), []);

  return {
    // State
    address: state.address,
    publicKey: state.address, // Alias for backward compatibility
    network: state.network,
    balance: state.balance,
    isConnected: Boolean(state.address),
    isConnecting: state.isConnecting,
    error: state.error,
    walletType: state.walletType,
    availableWallets,

    // Actions
    connect: walletStore.connect.bind(walletStore),
    disconnect: walletStore.disconnect.bind(walletStore),
    switchWallet: walletStore.switchWallet.bind(walletStore),
  };
}

/**
 * Selector hook - only re-renders when address changes.
 * Use this when you only need the wallet address.
 */
export function useWalletAddress(): string | null {
  return useSyncExternalStore(
    walletStore.subscribe,
    () => walletStore.getSnapshot().address
  );
}

/**
 * Selector hook - only re-renders when balance changes.
 */
export function useWalletBalance(): string | null {
  return useSyncExternalStore(
    walletStore.subscribe,
    () => walletStore.getSnapshot().balance
  );
}

/**
 * Selector hook - only re-renders when connection status changes.
 */
export function useWalletConnected(): boolean {
  return useSyncExternalStore(
    walletStore.subscribe,
    () => Boolean(walletStore.getSnapshot().address)
  );
}

// Backward compatibility exports
export { useWallet as useWalletContext };
```



## Step 4: Update RBACProvider

Optimize to only subscribe to address changes:

```typescript
// src/contexts/RBACContext.tsx

import { useWalletAddress, useWalletConnected } from '@/hooks/useWallet';
// ... other imports

export function RBACProvider({ children }: { children: ReactNode }) {
  // Only re-render when address or connection status changes
  const address = useWalletAddress();
  const isConnected = useWalletConnected();

  const user = useMemo<UserWithRole | null>(() => {
    if (!address || !isConnected) return null;
    return getUserRole(address);
  }, [address, isConnected]);

  // Rest of the provider implementation...
}
```

**Impact**: RBACProvider no longer re-renders on balance updates or wallet polling.

---

## Step 5: Testing

### Unit Test for WalletStore

```typescript
// src/store/__tests__/walletStore.test.ts

import { WalletStore } from '../walletStore';

describe('WalletStore', () => {
  let store: WalletStore;

  beforeEach(() => {
    store = new WalletStore();
  });

  it('initializes with disconnected state', () => {
    const state = store.getSnapshot();
    expect(state.address).toBeNull();
    expect(state.isConnecting).toBe(false);
  });

  it('notifies subscribers on state change', () => {
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    store.connect('freighter');

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('does not emit if state unchanged', () => {
    store.connect('freighter');
    
    const listener = jest.fn();
    store.subscribe(listener);

    // Trigger update with same values
    store.checkForChanges(); // Assume no changes

    expect(listener).not.toHaveBeenCalled();
  });
});
```



### Hook Test

```typescript
// src/hooks/__tests__/useWallet.test.tsx

import { renderHook, act } from '@testing-library/react';
import { useWallet, useWalletAddress } from '../useWallet';
import { walletStore } from '@/store/walletStore';

describe('useWallet', () => {
  it('returns wallet state', () => {
    const { result } = renderHook(() => useWallet());
    
    expect(result.current.address).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it('updates when store changes', async () => {
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect('freighter');
    });

    expect(result.current.isConnected).toBe(true);
  });
});

describe('useWalletAddress', () => {
  it('only re-renders on address change', () => {
    const renderCount = { current: 0 };
    
    const { result } = renderHook(() => {
      renderCount.current++;
      return useWalletAddress();
    });

    expect(renderCount.current).toBe(1);

    // Trigger balance update (should not re-render)
    act(() => {
      walletStore.setState({ balance: '1000' });
    });

    expect(renderCount.current).toBe(1); // No additional render

    // Trigger address update (should re-render)
    act(() => {
      walletStore.setState({ address: 'GABC...' });
    });

    expect(renderCount.current).toBe(2); // One additional render
  });
});
```

---

## Step 6: Update Components

### Before (Context-based)

```typescript
// ❌ Old way - re-renders on every wallet state change
function ProfileHeader() {
  const { address, balance } = useWalletContext();
  
  return (
    <div>
      <p>Address: {address}</p>
    </div>
  );
}
```

### After (Selector-based)

```typescript
// ✅ New way - only re-renders when address changes
function ProfileHeader() {
  const address = useWalletAddress();
  
  return (
    <div>
      <p>Address: {address}</p>
    </div>
  );
}
```



---

## Measuring Performance Improvements

### Add Performance Tracking

```typescript
// utils/renderTracker.ts

export class RenderTracker {
  private counts = new Map<string, number>();
  private startTime = Date.now();

  track(componentName: string) {
    const count = this.counts.get(componentName) || 0;
    this.counts.set(componentName, count + 1);
  }

  getReport() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    
    return Array.from(this.counts.entries())
      .map(([name, count]) => ({
        component: name,
        renders: count,
        rendersPerSecond: (count / elapsed).toFixed(2),
      }))
      .sort((a, b) => b.renders - a.renders);
  }

  reset() {
    this.counts.clear();
    this.startTime = Date.now();
  }
}

export const renderTracker = new RenderTracker();
```

### Use in Components

```typescript
function Dashboard() {
  useEffect(() => {
    renderTracker.track('Dashboard');
  });

  // ... component code
}
```

### View Report

```typescript
// In browser console:
window.__renderTracker = renderTracker;

// After 30 seconds:
console.table(__renderTracker.getReport());
```

**Expected Results**:

| Component | Before (renders/30s) | After (renders/30s) | Improvement |
|-----------|---------------------|---------------------|-------------|
| Dashboard | 35-40 | 8-10 | 75% ↓ |
| VaultPage | 30-35 | 6-8 | 77% ↓ |
| Profile | 25-30 | 2-3 | 90% ↓ |

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting to Bind Methods

```typescript
// Wrong - loses 'this' context
const { connect } = useWallet();
<button onClick={connect}>Connect</button>

// Right - bind in the hook
connect: walletStore.connect.bind(walletStore)
```

### ❌ Pitfall 2: Not Using Selectors

```typescript
// Wrong - re-renders on all wallet changes
const { address } = useWallet();

// Right - only re-renders on address change
const address = useWalletAddress();
```



### ❌ Pitfall 3: Mutating State Directly

```typescript
// Wrong - mutates state
this.state.balance = newBalance;
this.emit();

// Right - immutable update
this.setState({ balance: newBalance });
```

### ❌ Pitfall 4: Not Cleaning Up Intervals

```typescript
class WalletStore {
  private pollingInterval: NodeJS.Timeout | null = null;

  disconnect() {
    // Wrong - leaks interval
    this.state = INITIAL_STATE;

    // Right - cleanup first
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.state = INITIAL_STATE;
  }
}
```

---

## Rollback Plan

If issues arise, rollback is straightforward:

1. Keep old WalletContext file
2. In `_app.tsx`, temporarily add WalletProvider back
3. Change imports from `useWallet` to `useWalletContext`
4. Revert commit
5. All tests should pass

**Safety**: Observable stores don't break existing code since they're additive.

---

## Next Steps

After completing WalletStore migration:

1. **VaultStore**: Follow same pattern for vault state
2. **GovernanceStore**: Migrate governance state
3. **Request Caching**: Add caching layer to reduce API calls
4. **DevTools**: Add Redux DevTools integration for debugging

---

## Questions?

See [STATE_ARCHITECTURE.md](./STATE_ARCHITECTURE.md) for full context and architecture details.
