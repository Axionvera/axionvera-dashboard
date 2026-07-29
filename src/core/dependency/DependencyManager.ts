/**
 * @module core/dependency/DependencyManager
 *
 * Centralized manager for tracking widget dependencies and resolving loading order.
 */

import type { ComponentType } from "react";

import { Graph } from "./Graph";

export interface DataSource {
  id: string;
  name: string;
  loader: () => Promise<any>;
}

export interface Widget {
  id: string;
  name: string;
  dependencies: string[]; // List of DataSource IDs or Widget IDs
  component?: ComponentType<Record<string, unknown>>;
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    version?: string;
  };
  config?: Record<string, unknown>;
}

export class DependencyManager {
  private widgets: Map<string, Widget> = new Map();
  private dataSources: Map<string, DataSource> = new Map();
  private graph: Graph<string> = new Graph();
  private subscribers: Set<() => void> = new Set();

  /**
   * Register a data source.
   */
  registerDataSource(source: DataSource): void {
    this.dataSources.set(source.id, source);
    this.graph.addVertex(source.id);
  }

  /**
   * Register a widget and its dependencies.
   */
  registerWidget(widget: Widget): void {
    this.widgets.set(widget.id, widget);
    this.graph.addVertex(widget.id);

    for (const depId of widget.dependencies) {
      this.graph.addEdge(widget.id, depId);
    }

    // Check for circular dependencies immediately
    if (this.graph.hasCycle()) {
      throw new Error(`Circular dependency detected after registering widget: ${widget.id}`);
    }

    this.notifySubscribers();
  }

  unregisterWidget(widgetId: string): boolean {
    const removed = this.widgets.delete(widgetId);
    if (removed) {
      this.rebuildGraph();
      this.notifySubscribers();
    }
    return removed;
  }

  subscribe(listener: () => void): () => void {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((listener) => listener());
  }

  private rebuildGraph(): void {
    this.graph = new Graph();
    this.dataSources.forEach((source) => this.graph.addVertex(source.id));
    this.widgets.forEach((widget) => {
      this.graph.addVertex(widget.id);
      widget.dependencies.forEach((depId) => this.graph.addEdge(widget.id, depId));
    });
  }

  /**
   * Resolve the optimal loading order for all registered entities.
   */
  getLoadingOrder(): string[] {
    // Topological sort returns order where dependencies come AFTER the dependent.
    // We want the reverse: dependencies first.
    return this.graph.topologicalSort().reverse();
  }

  /**
   * Get all registered widgets.
   */
  getWidgets(): Widget[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Get all registered data sources.
   */
  getDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }

  /**
   * Get a specific data source by ID.
   */
  getDataSource(id: string): DataSource | undefined {
    return this.dataSources.get(id);
  }

  /**
   * Get a specific widget by ID.
   */
  getWidget(id: string): Widget | undefined {
    return this.widgets.get(id);
  }
}
