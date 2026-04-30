export interface ChartDataPoint {
  date: string;
  apr: number;
  apy: number;
  tvl: number;
}

export const mockChartData: ChartDataPoint[] = [
  { date: "2024-01-01", apr: 12.5, apy: 13.2, tvl: 1250000 },
  { date: "2024-01-08", apr: 12.8, apy: 13.5, tvl: 1320000 },
  { date: "2024-01-15", apr: 12.2, apy: 12.9, tvl: 1280000 },
  { date: "2024-01-22", apr: 13.1, apy: 13.8, tvl: 1450000 },
  { date: "2024-01-29", apr: 13.5, apy: 14.2, tvl: 1560000 },
  { date: "2024-02-05", apr: 14.0, apy: 14.8, tvl: 1680000 },
  { date: "2024-02-12", apr: 13.8, apy: 14.5, tvl: 1720000 },
  { date: "2024-02-19", apr: 14.2, apy: 15.0, tvl: 1850000 },
  { date: "2024-02-26", apr: 14.5, apy: 15.3, tvl: 1980000 },
  { date: "2024-03-04", apr: 14.1, apy: 14.9, tvl: 2050000 },
  { date: "2024-03-11", apr: 13.9, apy: 14.7, tvl: 2120000 },
  { date: "2024-03-18", apr: 14.3, apy: 15.1, tvl: 2250000 },
  { date: "2024-03-25", apr: 14.8, apy: 15.6, tvl: 2400000 },
  { date: "2024-04-01", apr: 15.2, apy: 16.1, tvl: 2550000 },
  { date: "2024-04-08", apr: 15.5, apy: 16.4, tvl: 2700000 },
  { date: "2024-04-15", apr: 15.8, apy: 16.8, tvl: 2850000 },
  { date: "2024-04-22", apr: 16.2, apy: 17.2, tvl: 3000000 },
];
