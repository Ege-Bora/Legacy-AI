import 'dotenv/config';

export default ({ config }) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...config,
    name: "Life Legacy AI",
    slug: "life-legacy-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: isProduction ? "com.lifelegacy.app" : "com.anonymous.life-legacy-ai",
      buildNumber: "1",
      infoPlist: {
        NSMicrophoneUsageDescription: "We use the microphone to record your memories and life stories.",
        NSCameraUsageDescription: "We use the camera to attach photos to your chapters.",
        NSPhotoLibraryAddUsageDescription: "We save exported media to your photo library.",
        UIBackgroundModes: ["audio"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: isProduction ? "com.lifelegacy.app" : "com.anonymous.lifelegacyai",
      versionCode: 1,
      permissions: [
        "RECORD_AUDIO",
        "READ_MEDIA_IMAGES", 
        "READ_MEDIA_VIDEO",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-notifications",
      "expo-font", 
      "expo-secure-store",
      "expo-audio"
    ],
    extra: {
      API_BASE_URL: isProduction 
        ? process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.lifelegacy.ai"
        : process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.155:8080",
      ENVIRONMENT: isProduction ? "production" : "development",
      BUILD_NUMBER: "1",
      ANALYTICS_ENABLED: isProduction,
      ENABLE_DEBUG_PANEL: !isProduction,
      MOCK_SERVICES: !isProduction,
      LOG_LEVEL: isProduction ? "info" : "debug",
      eas: {
        projectId: "bf363c47-91e3-4e25-a8c8-a0836845f445"
      }
    },
    updates: {
      fallbackToCacheTimeout: 0
    }
  };
};