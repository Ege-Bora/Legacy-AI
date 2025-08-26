import Constants from 'expo-constants';

// API Configuration
export const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? 'http://localhost:8080';
export const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ?? '';

// Provider Configuration
export const AQUA_PROVIDER = 'aqua';
export const DEFAULT_TRANSCRIPTION_PROVIDER = AQUA_PROVIDER;

// Feature Flags
export const FEATURE_FLAGS = {
  export_epub: Constants.expoConfig?.extra?.FEATURE_EXPORT_EPUB ?? true,
  export_doc: Constants.expoConfig?.extra?.FEATURE_EXPORT_DOC ?? true,
  export_pdf: Constants.expoConfig?.extra?.FEATURE_EXPORT_PDF ?? true,
  media_upload: Constants.expoConfig?.extra?.FEATURE_MEDIA_UPLOAD ?? true,
  styles: Constants.expoConfig?.extra?.FEATURE_STYLES ?? true,
  ai_enhancement: Constants.expoConfig?.extra?.FEATURE_AI_ENHANCEMENT ?? true,
  offline_mode: Constants.expoConfig?.extra?.FEATURE_OFFLINE_MODE ?? true,
} as const;

// App Configuration
export const APP_CONFIG = {
  name: Constants.expoConfig?.name ?? 'Life Legacy AI',
  version: Constants.expoConfig?.version ?? '1.0.0',
  buildNumber: Constants.expoConfig?.extra?.BUILD_NUMBER ?? '1',
  environment: Constants.expoConfig?.extra?.ENVIRONMENT ?? 'development',
} as const;

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  enabled: Constants.expoConfig?.extra?.ANALYTICS_ENABLED ?? false,
  mixpanelToken: Constants.expoConfig?.extra?.MIXPANEL_TOKEN ?? '',
} as const;

// Crash Reporting Configuration
export const SENTRY_CONFIG = {
  dsn: Constants.expoConfig?.extra?.SENTRY_DSN ?? '',
  enabled: Boolean(Constants.expoConfig?.extra?.SENTRY_DSN),
  environment: Constants.expoConfig?.extra?.ENVIRONMENT ?? 'development',
} as const;

// Audio Configuration
export const AUDIO_CONFIG = {
  maxDurationMs: 10 * 60 * 1000, // 10 minutes
  sampleRate: 44100,
  bitRate: 128000,
  format: 'm4a',
  quality: 'high',
} as const;

// Timeline Configuration
export const TIMELINE_CONFIG = {
  pageSize: 20,
  maxRetries: 3,
  retryDelayMs: 1000,
} as const;

// Development Configuration
export const DEV_CONFIG = {
  enableDebugPanel: Constants.expoConfig?.extra?.ENABLE_DEBUG_PANEL ?? __DEV__,
  mockServices: Constants.expoConfig?.extra?.MOCK_SERVICES ?? true, // Use mocks for Expo Go compatibility
  useSupabase: Constants.expoConfig?.extra?.USE_SUPABASE ?? false, // Enable real Supabase
  logLevel: Constants.expoConfig?.extra?.LOG_LEVEL ?? (__DEV__ ? 'debug' : 'error'),
} as const;

// Unified config object
export const config = {
  apiBaseUrl: API_BASE_URL,
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
  isDevelopment: __DEV__,
  features: {
    analytics: ANALYTICS_CONFIG.enabled,
    crashReporting: SENTRY_CONFIG.enabled,
    mockApi: DEV_CONFIG.mockServices,
    useSupabase: DEV_CONFIG.useSupabase,
    exportEpub: FEATURE_FLAGS.export_epub,
    exportDoc: FEATURE_FLAGS.export_doc,
    exportPdf: FEATURE_FLAGS.export_pdf,
    debugPanel: DEV_CONFIG.enableDebugPanel,
  },
  app: APP_CONFIG,
  audio: AUDIO_CONFIG,
  timeline: TIMELINE_CONFIG,
} as const;
