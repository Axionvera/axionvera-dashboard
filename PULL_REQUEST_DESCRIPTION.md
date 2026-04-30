# URL-based Deposit/Withdraw Pre-filling

## Summary

Implemented support for pre-filling deposit and withdraw forms via URL query parameters, allowing partners or marketing links to send users directly to a pre-filled deposit screen.

## Problem Solved

Partners or marketing links wanted to send users directly to a pre-filled deposit screen (e.g., `dashboard?action=deposit&amount=100`) but the dashboard lacked support for URL query parameters to trigger this behavior.

## Solution Overview

### Files Modified

| File | Changes |
|------|---------|
| `src/pages/dashboard.tsx` | Added URL query parameter parsing with `useSearchParams`, auto-trigger wallet connection |
| `src/components/DepositForm.tsx` | Added `defaultAmount` prop with form pre-fill via `setValue` |
| `src/components/WithdrawForm.tsx` | Added `defaultAmount` prop with form pre-fill via `setValue` |

## Usage Examples

```
# Pre-filled deposit with amount
/dashboard?action=deposit&amount=100

# Pre-filled withdraw with amount
/dashboard?action=withdraw&amount=50
```

## Acceptance Criteria

- [x] `/dashboard` route checks for URL query parameters: `action` and `amount`
- [x] If `action=deposit` is present, automatically opens the Deposit form
- [x] If `amount` is present, pre-fills the input field in the respective form
- [x] "Connect Wallet" flow is triggered first if the user is not authenticated
- [x] Uses Next.js `useSearchParams` hook to read data without triggering full page re-render

## Technical Notes

- Uses React's `useEffect` to handle URL parameter parsing to avoid hydration mismatches
- Form pre-filling only activates when wallet is connected
- Auto-connect only triggers when an `action` parameter is present
- No full page re-render occurs because `useSearchParams` is used

## Testing Steps

1. **Test deposit pre-fill:** Navigate to `/dashboard?action=deposit&amount=100` → verify amount field shows "100"
2. **Test withdraw pre-fill:** Navigate to `/dashboard?action=withdraw&amount=50` → verify amount field shows "50"
3. **Test auto-connect:** Disconnect wallet, navigate to `/dashboard?action=deposit&amount=100` → verify connection prompt appears
4. **Test no parameters:** Navigate to `/dashboard` → verify both forms are empty
2. **API Timeouts**: Prevents hanging requests with configurable timeouts
3. **Retry Logic**: Automatic retries for transient failures
4. **Graceful Degradation**: Fallback values when APIs are unavailable
5. **User Recovery**: Clear paths for users to recover from errors
6. **Development Debugging**: Enhanced error details in development mode

## Configuration Examples

### Basic Usage
```tsx
// Error boundary automatically wraps the entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### API with Custom Options
```tsx
const sdk = createAxionveraVaultSdk();
const result = await sdk.getBalances(args, {
  timeout: 5000,
  retries: 3,
  fallbackValue: { balance: "0", rewards: "0" }
});
```

### Component Error Handling
```tsx
const { error, executeWithErrorHandling } = useApiError();
const result = await executeWithErrorHandling(() => apiCall());
```

## Testing Strategy
- Error boundary catches and displays errors correctly
- API resilience handles timeouts and retries
- Fallback UI renders with proper recovery options
- Application reload clears error state safely

## Benefits
✅ **Prevents White Screen Crashes** - No more blank screens for users  
✅ **Improves User Experience** - Clear error messages and recovery paths  
✅ **Enhances Reliability** - Automatic retry and timeout protection  
✅ **Maintains Performance** - Efficient error handling without overhead  
✅ **Developer Friendly** - Enhanced debugging in development mode  

## Migration Notes
- No breaking changes to existing API interfaces
- Backward compatible with current component usage
- Optional parameters for resilience configuration
- Graceful fallback for existing implementations

## Future Enhancements
- Integration with error monitoring services (Sentry, etc.)
- Network status detection and offline handling
- Progressive retry strategies
- User-specific error reporting preferences
