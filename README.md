# Life Legacy AI - React Native App

A cross-platform mobile app for recording memories and creating AI-generated life story chapters.

## Features

- **Voice & Text Recording**: Capture memories through guided interviews or quick voice/text notes
- **AI-Powered Chapters**: Transform recordings into beautifully written life story chapters
- **Timeline View**: Chronological organization of all memories and chapters
- **Rich Editor**: Edit chapters with formatting tools and AI enhancement
- **Media Support**: Attach photos, videos, and audio to memories
- **Book Export**: Generate PDF, ePub, and DOCX versions of your life story
- **Subscription Tiers**: Free, Premium, and Pro plans with different features
- **Offline Support**: Works offline with sync when connected
- **Multi-language**: Full i18n support with instant language switching

## Tech Stack

- **React Native + Expo** (SDK 53.0.0, Managed Workflow)
- **React Navigation** (Stack + Bottom Tabs)
- **NativeWind** (Tailwind CSS for React Native)
- **Zustand** for state management with persistence
- **TypeScript** for type safety
- **Expo AV** for audio recording
- **Expo Secure Store** for session persistence
- **Expo Image Picker** for media selection
- **Expo Notifications** for reminders
- **AsyncStorage** for local data persistence

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/                 # Design system components
│   ├── layout/             # Layout components (Screen, etc.)
│   ├── permissions/        # Permission handling components
│   ├── skeleton/           # Loading skeleton components
│   ├── RecordButton.js     # Voice recording button with animation
│   ├── ChapterCard.js      # Timeline item display
│   ├── MediaUploader.js    # Media selection and upload
│   ├── PaywallModal.js     # Subscription upgrade modal
│   ├── QuickMemoCard.tsx   # Quick memo recording component
│   └── ErrorBoundary.tsx   # Global error handling
├── context/             # Global state management
│   ├── AuthContext.js      # Authentication state
│   ├── SettingsContext.js  # User preferences
│   └── SubscriptionContext.js # Subscription status
├── state/               # Zustand stores
│   ├── memos.ts            # Memo upload queue and processing
│   └── timeline.ts         # Timeline items with pagination
├── services/            # API and external services
│   ├── api.ts              # Mocked API service with final contracts
│   └── auth.ts             # Authentication service with session management
├── types/               # TypeScript type definitions
│   └── index.ts            # Core types (Memo, TimelineItem, User, etc.)
├── config.ts            # Centralized app configuration
├── i18n/                # Internationalization
│   ├── locales/            # Translation files
│   └── index.ts            # i18n setup
├── hooks/               # Custom React hooks
│   ├── useTheme.ts         # Theme management
│   └── useI18n.ts          # Internationalization hook
├── navigation/          # App navigation setup
│   └── AppNavigator.js     # Main navigation configuration
└── screens/             # Main app screens
    ├── OnboardingScreen.js # Login/signup with Google/Apple
    ├── HomeScreen.js       # Dashboard with quick actions
    ├── InterviewScreen.js  # AI-guided interview flow
    ├── QuickCaptureScreen.js # Quick memory recording
    ├── TimelineScreen.js   # Chronological memory list
    ├── EditorScreen.js     # Chapter editing with AI tools
    ├── BookScreen.js       # Book generation and export
    └── SettingsScreen.tsx  # Account and app settings
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
# or
npx expo start
```

3. Run on device/simulator:
```bash
# iOS Simulator
npm run ios
# or
npx expo run:ios

# Android Emulator
npm run android
# or
npx expo run:android

# Web (for testing UI)
npm run web
# or
npx expo start --web
```

### Device Testing

For testing on real devices:

```bash
# Start with tunnel for external device access
npx expo start --tunnel

# Or use Expo Go app and scan QR code
npx expo start
```

**Note**: Audio recording requires a physical device - it won't work in simulators.

### Environment Setup

The app uses environment variables configured in `app.json` under the `extra` field:

- `API_BASE_URL`: Backend API endpoint
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Database configuration
- `MOCK_SERVICES`: Enable/disable mocked API responses
- `ENABLE_DEBUG_PANEL`: Show developer debug panel
- Feature flags for exports, analytics, etc.

For production builds, override these in `app.config.ts` or environment-specific config files.

## App Flow

1. **Onboarding**: Users sign in with Google/Apple (placeholder)
2. **Home Dashboard**: Quick access to all main features
3. **Memory Capture**: 
   - **Interview Mode**: AI asks guided questions, user responds via voice/text
   - **Quick Capture**: Instant voice/text memory logging
4. **Timeline**: View all memories chronologically
5. **Editor**: Edit chapters with rich text tools and AI enhancement
6. **Book Generation**: Export complete life story in multiple formats

## Key Components

### RecordButton
Animated recording button with pulse effect and voice recording simulation.

### ChapterCard
Timeline item component showing memory type, date, content preview, and media count.

### MediaUploader
Handles photo, video, and audio file selection with camera integration.

### PaywallModal
Subscription upgrade interface with plan comparison and features.

## Service Layer Architecture

### API Service (`src/services/api.ts`)

Mocked API service with final production contracts:

- `uploadAudio(localUri, metadata)` - Upload audio files with metadata
- `transcribeMemo(memoId, provider, language)` - Transcribe audio to text
- `createTimelineItem(payload)` - Create timeline entries
- `getTimeline(params)` - Fetch paginated timeline
- `generateBook(type)` - Generate PDF/ePub/DOCX exports

### Authentication Service (`src/services/auth.ts`)

Session management with secure storage:

- `getSession()` - Get current user session
- `signInWithGoogle()` / `signInWithApple()` - OAuth sign-in
- `signOut()` - Clear session and local data
- `deleteAccount()` - Account deletion with cleanup
- `onAuthStateChange(callback)` - Listen for auth changes

### State Management

**Memo Store** (`src/state/memos.ts`):
- Optimistic upload queue with retry logic
- Recording state management
- Offline support with sync when online

**Timeline Store** (`src/state/timeline.ts`):
- Paginated timeline items
- Real-time updates and caching
- Pull-to-refresh functionality

All services currently return mocked data with realistic delays and occasional errors for robust testing.

## Subscription Features

### Free Plan
- 5 chapters maximum
- 10 AI generations
- PDF export only
- No cloud storage

### Premium Plan ($9.99/month)
- 50 chapters
- 100 AI generations
- PDF & ePub export
- Cloud storage

### Pro Plan ($19.99/month)
- Unlimited chapters
- Unlimited AI generations
- All export formats (PDF, ePub, DOCX)
- Cloud storage
- Advanced editing tools

## Internationalization (i18n)

Full multi-language support with instant switching:

- Translation files in `src/i18n/locales/`
- `useI18n()` hook for accessing translations
- Language switching in Settings with immediate UI updates
- All user-facing strings are translated

```javascript
const { t, changeLanguage } = useI18n();
const title = t('home.welcome'); // "Welcome" or "Bienvenido"
```

## Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
npx expo start --clear
```

**iOS build issues:**
```bash
cd ios && pod install && cd ..
npx expo run:ios --clean
```

**Android build issues:**
```bash
cd android && ./gradlew clean && cd ..
npx expo run:android --clean
```

**Audio recording not working:**
- Ensure you're testing on a physical device
- Check microphone permissions in device settings
- Verify `NSMicrophoneUsageDescription` in app.json

**State not persisting:**
- Clear app data and restart
- Check AsyncStorage permissions
- Verify Zustand persist configuration

### Development Tools

**Health Check:**
```bash
npx expo-doctor
```

**Debug Panel:**
- Tap app logo 5 times to open developer panel
- View feature flags, session state, and logs
- Clear storage, test crash reporting
- Toggle mock services on/off

## Development Status

✅ **Completed:**
- Service layer with mocked APIs matching final contracts
- TypeScript types for all data models
- State management with Zustand stores
- Authentication service with session persistence
- Centralized configuration and feature flags
- Full i18n support with instant language switching
- Error boundaries and toast notifications
- Skeleton loading states
- Project passes `expo-doctor` health checks

🚧 **In Progress:**
- Quick Memo integration with real audio recording
- Export functionality in Book screen
- Legal and account deletion flows
- Analytics and crash reporting stubs
- Developer debug panel

📋 **Next Steps:**
1. Wire Quick Memo to real recording and API flow
2. Add export entry points in Book screen
3. Implement legal & account deletion UI flows
4. Add analytics & crash reporting stubs
5. Create developer panel with debug features
6. Connect to real backend (Supabase/Aqua)
7. Implement actual AI transcription and chapter generation
8. Add subscription payment processing
9. Implement push notifications for memory reminders

## Backend Development

The project includes a complete backend under `./backend/` with the following structure:

```
backend/
├── apps/
│   ├── api/                 # Fastify REST API server
│   │   ├── src/index.ts     # Main API server with endpoints
│   │   └── package.json     # API dependencies
│   └── worker/              # BullMQ background job processor
│       ├── src/index.ts     # Worker with STT, chapter, export processors
│       └── package.json     # Worker dependencies
├── packages/
│   └── shared/              # Shared types and interfaces
│       ├── src/index.ts     # Common types for API/Worker
│       └── package.json     # Shared dependencies
├── package.json             # Backend workspace root
├── tsconfig.json            # TypeScript configuration
└── .env.example             # Environment variables template
```

### Backend Setup

1. **Install backend dependencies:**
```bash
cd backend
pnpm install
```

2. **Set up environment:**
```bash
cd backend
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. **Start Redis (required for job queue):**
```bash
# Using Docker
docker-compose up redis -d

# Or install Redis locally
brew install redis
redis-server
```

4. **Start backend services:**
```bash
# From project root
pnpm dev:api     # Starts API server on port 8080
pnpm dev:worker  # Starts background job processor
```

### Backend API Endpoints

- `GET /health` - Health check with uptime
- `POST /memos/upload` - Upload audio files with metadata
- `POST /memos/transcribe` - Transcribe audio (mocked without AQUA_API_KEY)
- `GET /timeline` - Get timeline items (mocked data)
- `POST /chapters/draft` - Generate chapter drafts (mocked without OPENAI_API_KEY)
- `POST /export` - Export to PDF/DOCX/EPUB (background job)

### Environment Variables

Configure in `backend/.env`:

```bash
PORT=8080
NODE_ENV=development
REDIS_URL=redis://localhost:6379

# Optional - will use mocks if not provided
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
AQUA_API_KEY=your_aqua_stt_key
OPENAI_API_KEY=your_openai_key
```

The backend gracefully falls back to mock implementations when API keys are not provided, allowing immediate development.

## Contributing

This is a complete React Native + Expo project with backend ready for development and deployment.
# Legacy-AI
