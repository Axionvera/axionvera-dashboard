import "@testing-library/jest-dom";
import React from "react";

// ResizeObserver is not available in jsdom — required by Recharts ResponsiveContainer
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// URL.createObjectURL is not available in jsdom — required by chartExport
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = jest.fn();

// Render Recharts ResponsiveContainer at a fixed size so chart children mount
jest.mock("recharts", () => {
  const Recharts = jest.requireActual("recharts");
  return {
    ...Recharts,
    ResponsiveContainer: ({
      children,
    }: {
      children: React.ReactNode;
      width?: number | string;
      height?: number | string;
    }) =>
      React.createElement(
        "div",
        { style: { width: 400, height: 300 }, "data-testid": "responsive-container" },
        children
      ),
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock ResizeObserver for Recharts ResponsiveContainer in jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

// Mock AppTooltip to avoid Radix UI dependency issues in tests
jest.mock("@/components/AppTooltip", () => ({
  AppTooltip: ({ children }: { children: React.ReactNode }) => children,
}), { virtual: true });

// Lightweight in-memory IndexedDB shim so session store tests can exercise
// the full open/get/put/delete cycle without browser globals.
import { fakeIndexedDB, fakeIDBKeyRange } from "./utils/fakeIndexedDB";
if (typeof globalThis.indexedDB === "undefined") {
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    writable: true,
    value: fakeIndexedDB,
  });
}
if (typeof globalThis.IDBKeyRange === "undefined") {
  Object.defineProperty(globalThis, "IDBKeyRange", {
    configurable: true,
    writable: true,
    value: fakeIDBKeyRange,
  });
}
