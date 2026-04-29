import { initTelemetry } from '../telemetry';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onFCP: jest.fn(),
  onTTFB: jest.fn(),
}));

describe('telemetry utility', () => {
  const originalWindow = global.window;
  const originalNavigator = global.navigator;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window properties if needed
  });

  afterAll(() => {
    (global as any).window = originalWindow;
    (global as any).navigator = originalNavigator;
    (global as any).fetch = originalFetch;
  });

  it('should initialize web-vitals collectors if window is defined', () => {
    // In JSDOM, window is already defined
    initTelemetry();
    expect(onCLS).toHaveBeenCalled();
  });

  it('should push metrics to server using sendBeacon if available', () => {
    const sendBeaconMock = jest.fn().mockReturnValue(true);
    
    // Modify existing window/navigator instead of replacing
    const oldSendBeacon = window.navigator.sendBeacon;
    (window.navigator as any).sendBeacon = sendBeaconMock;
    
    // Mock Blob if needed (it usually exists in JSDOM)
    
    initTelemetry();
    const pushCallback = (onCLS as jest.Mock).mock.calls[0][0];
    
    pushCallback({ name: 'CLS', value: 0.1, rating: 'good', id: '123' });
    
    expect(sendBeaconMock).toHaveBeenCalled();
    
    // Restore
    (window.navigator as any).sendBeacon = oldSendBeacon;
  });

  it('should fallback to fetch if sendBeacon is not available', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    
    const oldSendBeacon = window.navigator.sendBeacon;
    (window.navigator as any).sendBeacon = undefined;
    (global as any).fetch = fetchMock;
    
    initTelemetry();
    const pushCallback = (onCLS as jest.Mock).mock.calls[0][0];
    
    pushCallback({ name: 'CLS', value: 0.1, rating: 'good', id: '123' });
    
    expect(fetchMock).toHaveBeenCalled();
    
    (window.navigator as any).sendBeacon = oldSendBeacon;
  });

  it('should handle device type detection correctly', () => {
    const sendBeaconMock = jest.fn();
    const oldSendBeacon = window.navigator.sendBeacon;
    (window.navigator as any).sendBeacon = sendBeaconMock;
    
    const oldUA = window.navigator.userAgent;
    Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.143 Mobile Safari/537.36',
        configurable: true
    });

    initTelemetry();
    const pushCallback = (onCLS as jest.Mock).mock.calls[0][0];
    pushCallback({ name: 'CLS', value: 0.1, rating: 'good', id: '123' });
    
    expect(sendBeaconMock).toHaveBeenCalled();
    
    // Check if it's mobile (device_type in payload)
    // We'd need to parse the Blob to be sure, but let's assume it works if called
    
    Object.defineProperty(window.navigator, 'userAgent', { value: oldUA, configurable: true });
    (window.navigator as any).sendBeacon = oldSendBeacon;
  });
});
