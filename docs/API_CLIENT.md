# API Client layer

The dashboard uses a central API client layer to standardise API calls, error handling, and retry strategies. The implementation can be found in `src/utils/enhancedApiClient.ts`.

## Core Concepts

The central API client (`EnhancedApiClient`) provides:
- Consistent JSON parsing and error handling (`AppError` types).
- Automatic retry for transient errors (e.g. `NETWORK`, `TIMEOUT`, `SERVER`).
- Telemetry & logging for API calls.

## Usage

Instead of using the raw `fetch` API directly, use the wrapper functions provided by `enhancedApiClient`:

```typescript
import { apiGet, apiPost } from '@/utils/enhancedApiClient';

// GET request
const getResponse = await apiGet('/api/data');
if (getResponse.success) {
  console.log(getResponse.data);
} else {
  console.error(getResponse.error);
}

// POST request
const postResponse = await apiPost('/api/submit', { key: 'value' });
if (postResponse.success) {
  console.log(postResponse.data);
}
```

## Error Categories & Retry Policies
The enhanced API client will categorise errors (e.g., `TimeoutError`, `NetworkError`, `ServerError`) and automatically apply a retry policy based on `ErrorCategory`. 

- `NETWORK`: aggressive backoff retry
- `TIMEOUT`: exponential backoff retry
- `SERVER` (500+): exponential backoff retry

To override or disable the retry policy on a per-request basis:

```typescript
import { getApiClient } from '@/utils/enhancedApiClient';

const client = getApiClient();
const response = await client.request('/api/health', {
    retryPolicy: 'none' // disable retries
});
```
