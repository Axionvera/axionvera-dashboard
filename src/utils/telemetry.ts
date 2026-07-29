import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';
import { apiPost } from '@/utils/enhancedApiClient';

/**
 * Identify user device type for metric categorization
 */
const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'unknown';

  const ua = window.navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return "mobile";
  }
  return "desktop";
};

/**
 * Pushes performance metrics to a custom /api/metrics proxy.
 * Uses navigator.sendBeacon where available for non-blocking collection.
 */
const pushToMetricsServer = (metric: Metric) => {
  const payload = {
    name: `axionvera_dashboard_${metric.name.toLowerCase()}`,
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    labels: {
      page_path: window.location.pathname,
      device_type: getDeviceType(),
      metric_id: metric.id,
    },
    timestamp: Date.now(),
  };

  const url = '/api/metrics'; // This proxy should convert to Prometheus format

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      // Fallback to apiPost for browsers that do not support sendBeacon
      apiPost(url, payload, {
        keepalive: true,
        retryPolicy: 'none'
      }).catch(err => console.debug('Telemetry push failed:', err));
    }
  } catch (err) {
    console.debug('Telemetry collection failed:', err);
  }
};

/**
 * Initializes the web-vitals collectors
 */
export const initTelemetry = () => {
  if (typeof window === 'undefined') return;

  // We capture major Core Web Vitals
  onCLS(pushToMetricsServer);
  onINP(pushToMetricsServer); // Succession of FID
  onLCP(pushToMetricsServer);
  onFCP(pushToMetricsServer);
  onTTFB(pushToMetricsServer);
};
