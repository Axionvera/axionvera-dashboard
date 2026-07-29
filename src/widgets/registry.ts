/**
 * @module widgets/registry
 *
 * Central registry for all dashboard widgets and their data sources.
 */

import { DependencyManager } from "@/core/dependency/DependencyManager";
import { DashboardWidget, DataSource } from "./types";
import { BalanceCard } from "@/features/vault";
import { AnalyticsDashboard } from "@/features/analytics";
import { TransactionHistory } from "@/features/transactions";

const manager = new DependencyManager();

// Register Data Sources
const vaultDataSource: DataSource = {
  id: "ds-vault-data",
  name: "Vault Data Source",
  loader: async () => {
    // This would typically involve calling the SDK or a hook's refresh method
    console.log("Loading Vault Data...");
    return { loaded: true };
  }
};

const analyticsDataSource: DataSource = {
  id: "ds-analytics-data",
  name: "Analytics Data Source",
  loader: async () => {
    console.log("Loading Analytics Data...");
    return { loaded: true };
  }
};

manager.registerDataSource(vaultDataSource);
manager.registerDataSource(analyticsDataSource);

// Register Widgets
const balanceWidget: DashboardWidget = {
  id: "widget-balance",
  name: "Balance Card",
  dependencies: ["ds-vault-data"],
  component: BalanceCard
};

const historyWidget: DashboardWidget = {
  id: "widget-history",
  name: "Transaction History",
  dependencies: ["ds-vault-data"],
  component: TransactionHistory
};

const analyticsWidget: DashboardWidget = {
  id: "widget-analytics",
  name: "Analytics Dashboard",
  dependencies: ["ds-analytics-data", "widget-history"], // Analytics might depend on history data
  component: AnalyticsDashboard
};

manager.registerWidget(balanceWidget);
manager.registerWidget(historyWidget);
manager.registerWidget(analyticsWidget);

export const widgetRegistry = manager;

export const getWidgetComponent = (id: string) => {
  const widgets: Record<string, React.ComponentType<any>> = {
    "widget-balance": BalanceCard,
    "widget-analytics": AnalyticsDashboard,
    "widget-history": TransactionHistory,
  };
  return widgets[id];
};
