import { config } from '../config';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
}

export interface CrashReport {
  error: Error;
  context?: Record<string, any>;
  userId?: string;
  timestamp: Date;
}

class AnalyticsService {
  private isEnabled: boolean;
  private userId: string | null = null;

  constructor() {
    this.isEnabled = config.features.analytics;
  }

  // Initialize analytics with user ID
  identify(userId: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;
    
    this.userId = userId;
    console.log('[Analytics] User identified:', userId, properties);
    
    // TODO: Replace with actual analytics provider (e.g., Mixpanel, Amplitude)
    // analytics.identify(userId, properties);
  }

  // Track user events
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: 'mobile',
      },
      userId: this.userId || undefined,
    };

    console.log('[Analytics] Event tracked:', event);
    
    // TODO: Replace with actual analytics provider
    // analytics.track(eventName, event.properties);
  }

  // Track screen views
  screen(screenName: string, properties?: Record<string, any>) {
    this.track('Screen Viewed', {
      screen: screenName,
      ...properties,
    });
  }

  // Track memo-related events
  memoStarted(properties?: Record<string, any>) {
    this.track('Memo Recording Started', properties);
  }

  memoCompleted(duration: number, properties?: Record<string, any>) {
    this.track('Memo Recording Completed', {
      duration_seconds: Math.round(duration / 1000),
      ...properties,
    });
  }

  memoTranscribed(wordCount: number, properties?: Record<string, any>) {
    this.track('Memo Transcribed', {
      word_count: wordCount,
      ...properties,
    });
  }

  // Track book generation events
  bookGenerationStarted(format: string, properties?: Record<string, any>) {
    this.track('Book Generation Started', {
      format,
      ...properties,
    });
  }

  bookGenerationCompleted(format: string, pageCount: number, properties?: Record<string, any>) {
    this.track('Book Generation Completed', {
      format,
      page_count: pageCount,
      ...properties,
    });
  }

  // Track subscription events
  subscriptionUpgraded(tier: string, properties?: Record<string, any>) {
    this.track('Subscription Upgraded', {
      tier,
      ...properties,
    });
  }

  // Track settings changes
  settingChanged(setting: string, value: any, properties?: Record<string, any>) {
    this.track('Setting Changed', {
      setting,
      value: String(value),
      ...properties,
    });
  }

  // Reset analytics (e.g., on logout)
  reset() {
    if (!this.isEnabled) return;
    
    this.userId = null;
    console.log('[Analytics] Analytics reset');
    
    // TODO: Replace with actual analytics provider
    // analytics.reset();
  }
}

class CrashReportingService {
  private isEnabled: boolean;
  private userId: string | null = null;

  constructor() {
    this.isEnabled = config.features.crashReporting;
  }

  // Set user context for crash reports
  setUser(userId: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;
    
    this.userId = userId;
    console.log('[CrashReporting] User context set:', userId, properties);
    
    // TODO: Replace with actual crash reporting service (e.g., Sentry, Bugsnag)
    // crashReporting.setUser({ id: userId, ...properties });
  }

  // Report non-fatal errors
  recordError(error: Error, context?: Record<string, any>) {
    if (!this.isEnabled) return;

    const report: CrashReport = {
      error,
      context: {
        ...context,
        userId: this.userId,
        platform: 'mobile',
      },
      userId: this.userId || undefined,
      timestamp: new Date(),
    };

    console.error('[CrashReporting] Error recorded:', report);
    
    // TODO: Replace with actual crash reporting service
    // crashReporting.recordError(error, report.context);
  }

  // Add breadcrumb for debugging
  addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
    if (!this.isEnabled) return;

    console.log('[CrashReporting] Breadcrumb:', { message, category, data });
    
    // TODO: Replace with actual crash reporting service
    // crashReporting.addBreadcrumb({ message, category, data });
  }

  // Set additional context
  setContext(key: string, value: any) {
    if (!this.isEnabled) return;

    console.log('[CrashReporting] Context set:', key, value);
    
    // TODO: Replace with actual crash reporting service
    // crashReporting.setContext(key, value);
  }

  // Clear user context (e.g., on logout)
  clearUser() {
    if (!this.isEnabled) return;
    
    this.userId = null;
    console.log('[CrashReporting] User context cleared');
    
    // TODO: Replace with actual crash reporting service
    // crashReporting.clearUser();
  }
}

// Global error handler for unhandled errors
const setupGlobalErrorHandler = () => {
  if (!config.features.crashReporting) return;

  // Handle unhandled promise rejections
  const originalHandler = global.onunhandledrejection;
  global.onunhandledrejection = (event) => {
    crashReporting.recordError(new Error(event.reason), {
      type: 'unhandled_promise_rejection',
      reason: event.reason,
    });
    
    if (originalHandler) {
      originalHandler.call(global as any, event);
    }
  };

  // Handle uncaught exceptions
  const originalErrorHandler = global.onerror;
  global.onerror = (message, source, lineno, colno, error) => {
    if (error) {
      crashReporting.recordError(error, {
        type: 'uncaught_exception',
        message,
        source,
        lineno,
        colno,
      });
    }
    
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
};

export const analytics = new AnalyticsService();
export const crashReporting = new CrashReportingService();

// Initialize global error handling
setupGlobalErrorHandler();
