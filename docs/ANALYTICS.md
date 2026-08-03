## Analytics & Visualization System

### Overview

The AxionVera dashboard includes a comprehensive analytics and visualization system that provides actionable insights into vault performance, reward distribution, transaction flow, and user engagement.

---

### Features

#### 📊 Rich Visualizations
- **Performance Charts**: Interactive balance tracking with reward overlays
- **Flow Analysis**: Deposit and withdrawal patterns
- **APY Trends**: Historical APY with volatility bands
- **Multi-metric Dashboards**: Comprehensive view of all key metrics

#### 🎯 Key Metrics
- Total return (absolute and percentage)
- Annual Percentage Yield (APY) with historical trends
- Reward distribution and frequency
- Transaction flow (deposits/withdrawals)
- Participation and engagement scores

#### 🔧 Advanced Features
- **Time Period Filtering**: 24H, 7D, 30D, 90D, 1Y, All
- **Data Aggregation**: Hour, day, week, month granularity
- **Smoothing & Sampling**: Optimize large datasets
- **Interactive Charts**: Hover for details, click to drill down
- **Export Functionality**: CSV and JSON formats
- **Predictive Forecasting**: Forward-looking projections with confidence intervals

---

### Architecture

```
src/
├── types/
│   └── analytics.ts              # Type definitions
├── services/
│   └── analytics/
│       ├── calculations.ts       # Metric calculations
│       ├── filters.ts            # Data filtering & transformation
│       └── index.ts              # Main service
├── components/
│   └── visualizations/
│       ├── PerformanceChart.tsx  # Balance & rewards
│       ├── FlowChart.tsx         # Deposits/withdrawals
│       ├── APYChart.tsx          # APY trends
│       └── index.ts              # Exports
└── features/
    └── analytics/
        ├── components/
        │   ├── AnalyticsDashboard.tsx   # Connected-wallet dashboard (hooks, no props)
        │   ├── AnalyticsReportPanel.tsx # Address-driven report (service layer)
        │   └── …                        # Metric panels
        └── index.ts                     # Feature exports
```

---

### Usage

#### Basic Dashboard

```typescript
import { AnalyticsReportPanel } from "@/features/analytics";

function AnalyticsPage() {
  const { address } = useWallet();

  return (
    <AnalyticsReportPanel
      address={address}
      initialPeriod={TimePeriod.MONTH}
    />
  );
}
```

#### Individual Charts

```typescript
import { PerformanceChart, FlowChart, APYChart } from "@/components/visualizations";

// Performance chart with rewards
<PerformanceChart
  balanceData={balanceHistory}
  rewardData={rewardHistory}
  showRewards={true}
  showAverage={true}
  height={400}
  interactive={true}
/>

// Flow chart
<FlowChart
  deposits={depositHistory}
  withdrawals={withdrawalHistory}
  height={350}
  showNetFlow={true}
/>

// APY chart
<APYChart
  data={apyHistory}
  height={300}
  showAverage={true}
  showVolatility={true}
  currentAPY={8.5}
/>
```

#### Fetching Analytics Data

```typescript
import { fetchAnalyticsData, getBalanceHistory } from "@/services/analytics";
import { TimePeriod } from "@/types/analytics";

// Get complete analytics
const analytics = await fetchAnalyticsData(address, {
  period: TimePeriod.MONTH,
  metrics: [],
});

// Get filtered balance history
const balances = await getBalanceHistory(address, TimePeriod.WEEK, {
  smooth: true,
  sample: 100,
  granularity: "day",
});
```

---

### Data Types

#### TimeSeriesDataPoint
```typescript
interface TimeSeriesDataPoint {
  timestamp: number;    // Unix timestamp (ms)
  date: string;         // Formatted date
  value: number;        // Primary value
  [key: string]: number | string; // Additional values
}
```

#### AnalyticsData
```typescript
interface AnalyticsData {
  performance: VaultPerformance;       // Balance & returns
  rewards: RewardAnalytics;            // Reward distribution
  flow: FlowAnalytics;                 // Deposits/withdrawals
  apy: APYAnalytics;                   // APY trends
  participation: ParticipationMetrics; // User engagement
  lastUpdated: number;                 // Timestamp
}
```

#### VaultPerformance
```typescript
interface VaultPerformance {
  currentValue: number;
  initialValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  apy: number;
  timeWeightedReturn: number;
  sharpeRatio: number | null;
  balanceHistory: TimeSeriesDataPoint[];
}
```

---

### Calculations

### Forecasting Methodology

The predictive engine uses deterministic, client-side models over historical protocol metrics.

- **Linear Trend**: least-squares regression over time-indexed observations
- **Moving Average**: trailing window baseline smoothing
- **Ensemble**: average of linear trend and moving average projections

The default model is **Ensemble** for improved stability under noisy data.

#### Forecast Inputs

- Balance history
- Reward history
- APY history
- Net flow history

#### Forecast Outputs

- Point predictions for selected horizon (7d, 30d, 90d)
- Lower and upper confidence bounds
- Aggregate confidence score and confidence tier

#### Confidence Scoring

Confidence is derived from in-sample fit error and observed volatility:

```
normalizedRMSE = RMSE / |mean(history)|
volatilityScore = stdDev(history) / |mean(history)|
confidence = clamp(1 - 0.6 * normalizedRMSE - 0.4 * volatilityScore, 0.05, 0.98)
```

Confidence tiers:

- **High**: confidence ≥ 0.75
- **Medium**: 0.50 ≤ confidence < 0.75
- **Low**: confidence < 0.50

#### Assumptions

- Forecasts are based only on historical on-platform metrics.
- External market factors are not modeled.
- Uncertainty bands widen as forecast distance increases.
- Forecasts are directional analytics, not financial advice.

#### Performance Metrics

**Total Return**
```
totalReturn = currentValue - initialValue - netDeposits
totalReturnPercent = (totalReturn / initialValue) × 100
```

**APY (Annualized)**
```
APY = (currentValue / initialValue)^(1/years) - 1) × 100
```

**Time-Weighted Return**
```
TWR = average of period returns, annualized
```

**Sharpe Ratio**
```
sharpeRatio = (avgReturn / stdDev) × √365.25
```

#### Reward Analytics

- **Total Rewards**: Sum of all reward values
- **Average Reward**: Total / count
- **Frequency**: Average days between rewards
- **Next Reward**: Estimated based on frequency

#### Flow Analytics

- **Net Flow**: totalDeposits - totalWithdrawals
- **Flow by Period**: Monthly aggregation
- **Trend Analysis**: Period-over-period comparison

---

### Filtering & Transformation

#### Time Period Filtering

```typescript
import { filterByPeriod, TimePeriod } from "@/services/analytics";

// Filter to last 30 days
const monthlyData = filterByPeriod(data, TimePeriod.MONTH);
```

#### Data Aggregation

```typescript
import { aggregateByGranularity } from "@/services/analytics";

// Aggregate hourly data to daily
const dailyData = aggregateByGranularity(data, "day");
```

#### Smoothing & Sampling

```typescript
import { smoothData, sampleData } from "@/services/analytics";

// Apply 7-day moving average
const smoothed = smoothData(data, 7);

// Reduce to 100 points for performance
const sampled = sampleData(data, 100);
```

---

### Customization

#### Custom Chart Colors

```typescript
<PerformanceChart
  balanceData={data}
  colors={["#6366f1", "#10b981", "#ef4444"]}
/>
```

#### Custom Formatters

```typescript
<APYChart
  data={data}
  yAxisFormatter={(value) => `${value.toFixed(1)}%`}
  tooltipFormatter={(value) => `APY: ${value.toFixed(2)}%`}
/>
```

#### Custom Time Ranges

```typescript
const analytics = await fetchAnalyticsData(address, {
  period: TimePeriod.ALL,
  startDate: new Date("2024-01-01").getTime(),
  endDate: Date.now(),
  granularity: "week",
});
```

---

### Performance Optimization

#### Data Sampling
Large datasets are automatically sampled to improve rendering performance:

```typescript
// Automatically sample if > maxPoints
const sampled = sampleData(data, 200);
```

#### Memoization
Chart components use React.useMemo for expensive calculations:

```typescript
const combinedData = useMemo(() => {
  // Expensive data transformation
  return mergeBalanceAndRewards(balanceData, rewardData);
}, [balanceData, rewardData]);
```

#### Lazy Loading
Load analytics data on-demand:

```typescript
useEffect(() => {
  if (isVisible) {
    loadAnalyticsData();
  }
}, [isVisible]);
```

---

### Export Functionality

#### JSON Export
```typescript
import { exportAnalyticsData } from "@/services/analytics";

const jsonData = await exportAnalyticsData(address, "json");
// Download or save jsonData
```

#### CSV Export
```typescript
const csvData = await exportAnalyticsData(address, "csv");
// Create downloadable CSV file
```

---

### Integration with Existing System

The analytics system integrates seamlessly with existing components:

#### VaultContext Integration
```typescript
// In VaultContext
const { analytics } = useVaultContext();

// Use in components
<AnalyticsReportPanel address={wallet.address} />
```

#### RBAC Integration
```typescript
import { usePermission } from "@/contexts/RBACContext";
import { Permission } from "@/types/rbac";

function AnalyticsPage() {
  const canView = usePermission(Permission.VIEW_ANALYTICS);
  const canExport = usePermission(Permission.EXPORT_ANALYTICS);

  return (
    <>
      {canView && <AnalyticsDashboard />}
      {canExport && <ExportButton />}
    </>
  );
}
```

---

### Future Enhancements

#### Planned Features
- [ ] Real-time data streaming
- [ ] Comparative analytics (vs. market/protocol)
- [ ] Custom metric builder
- [ ] Alert system for thresholds
- [ ] Advanced filtering (by transaction type, amount range)
- [ ] Portfolio breakdown (multi-vault)
- [ ] Social comparison (opt-in)

#### Performance Improvements
- [ ] Virtual scrolling for large datasets
- [ ] Web Workers for calculations
- [ ] Progressive data loading
- [ ] Chart caching

---

### Testing

#### Unit Tests
```typescript
describe("calculateVaultPerformance", () => {
  it("calculates total return correctly", () => {
    const performance = calculateVaultPerformance(
      balanceHistory,
      deposits,
      withdrawals
    );
    expect(performance.totalReturn).toBe(expected);
  });
});
```

#### Integration Tests
```typescript
describe("AnalyticsReportPanel", () => {
  it("displays performance metrics", async () => {
    render(<AnalyticsReportPanel address={mockAddress} />);
    await waitFor(() => {
      expect(screen.getByText(/Total Return/)).toBeInTheDocument();
    });
  });
});
```

---

### Troubleshooting

#### No Data Displayed
- Verify wallet address is connected
- Check if analytics service is responding
- Ensure time period has data

#### Performance Issues
- Reduce data sampling size
- Increase aggregation granularity
- Disable smoothing for large datasets

#### Incorrect Calculations
- Verify input data format
- Check timestamp consistency
- Ensure deposit/withdrawal data is accurate

---

### API Reference

See type definitions in `src/types/analytics.ts` for complete API documentation.

Key exports:
- **Types**: `TimePeriod`, `MetricType`, `AnalyticsData`, `TimeSeriesDataPoint`
- **Services**: `fetchAnalyticsData`, `getBalanceHistory`, `exportAnalyticsData`
- **Components**: `PerformanceChart`, `FlowChart`, `APYChart`, `AnalyticsDashboard`, `AnalyticsReportPanel`
- **Utilities**: `calculateStats`, `formatCurrency`, `formatPercentage`

---

**For more details**, see implementation in `src/services/analytics/` and `src/components/visualizations/`.
