# WelliPay Mobile App (Android & iOS)

> **Healthcare Payments, HMO Co-Pay Optimization & Medical Financing for Nigeria**

WelliPay is a native mobile application built for Android and iOS that simplifies healthcare billing, HMO health insurance claims, and hospital payments in Nigeria. Designed with the custom **Broadsheet** healthcare design system and typography powered by **Source Serif 4**, WelliPay supports bilingual usage across standard **English** and **Nigerian Pidgin**.

---

## Key Features

### 1. Healthcare & Insurance Suite
- **HMO Policy Hub & Digital Health Cards**: Manage policies with Nigeria's leading providers (Hygeia, Reliance, AXA Mansard, Leadway, Avon) with live benefit tracking and automated co-pay splits.
- **Surgery & Procedure Pre-Authorizations**: Real-time pre-authorization request submissions with hospital co-pay estimators and instant digital approval codes.
- **WelliRecord EMR Synchronization**: Live, secure cloud sync with connected hospital Electronic Medical Records (EMR).
- **Partner Hospital Directory**: Search accredited healthcare facilities with CBN-verified direct settlement accounts and instant emergency dialers.

### 2. Device Hardware Integrations
- **Live Camera QR Scanner**: Fast hospital bill scanning and QR barcode capture powered by `expo-camera` with viewfinder overlay and torch toggle.
- **Biometric Security**: Native Face ID, Touch ID, and Android Fingerprint prompt for biometric app unlock and 1-tap payment authorization via `expo-local-authentication`.
- **Haptic Engine**: Tactile haptic response patterns (light taps, selection ticks, success pulses, error rumbles) via `expo-haptics`.
- **Medical PDF Receipts & Statement Sharing**: Generate official, branded medical receipts and payment statements with native sharing via `expo-print` and `expo-sharing`.

### 3. Comprehensive Billing & Payment Suite
- **Flexible Bill Payments**: Pay in full or customize partial payments for inpatient/outpatient hospital visits.
- **Multi-Profile Healthcare Wallets**: Sub-wallets for dependents and family members (Self, Ade, Faith) with automated auto-pay rules.
- **Medical Financing & Installments**: Flexible medical loan repayment plans with interest-free installment tracking.
- **Healthcare Savings Goals**: Targeted emergency health savings reserves.

### 4. Bilingual Localization
- Native toggle between **English** (`en`) and **Nigerian Pidgin** (`pcm`) across all screens, buttons, notifications, and receipt metadata.

### 5. Local State Persistence
- Zustand reactive store with `@react-native-async-storage/async-storage` and `persist` middleware, preserving bills, payments, HMO cards, and preferences across reboots and cold launches.

---

## Design System

- **Primary Accent**: `#1B5E6B` (Deep Medical Teal)
- **Background**: `#FAFAF8` (Warm Broadsheet Off-White)
- **Danger**: `#C0392B` (Clinical Crimson)
- **Typography**: Google Fonts **Source Serif 4** (200 through 900 weights)
- **Design Tokens**: Standardized spacing, radii, elevation shadows, and custom component library (`AmountDisplay`, `AvatarCircle`, `Banner`, `BarChart`, `Button`, `Card`, `Chip`, `Divider`, `Keypad`, `PinDots`, `ProgressBar`, `RowItem`, `ScreenHeader`, `StatusPill`, `Toggle`).

---

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 57](https://expo.dev/)
- **Language**: TypeScript (Strict Mode)
- **Navigation**: React Navigation v7 (Native Stack & Bottom Tabs)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with `persist` middleware
- **Storage**: `@react-native-async-storage/async-storage` & `expo-secure-store`
- **Native Modules**: `expo-camera`, `expo-local-authentication`, `expo-haptics`, `expo-print`, `expo-sharing`
- **Build System**: Expo Application Services (EAS)

---

## Project Structure

```
wellipay-app/
├── App.tsx                     # Main application entry & font loader
├── app.json                    # Expo configuration & native permissions
├── eas.json                    # EAS build profiles (APK, AAB, iOS archive)
├── assets/                     # App icons, splash screens, adaptive icons
└── src/
    ├── components/             # Reusable UI component library (14 components)
    ├── navigation/             # React Navigation RootNavigator & Stack types
    ├── screens/
    │   ├── Auth/               # Welcome, Phone, OTP, Profile, App Lock, WR Link
    │   ├── Home/               # Dashboard & Notifications
    │   ├── Bills/              # Bills list, Bill Details, Camera QR Scanner
    │   ├── Payment/            # Amount, Method, Biometric Confirm, Cards, Transfers, Receipts
    │   ├── Wallet/             # Multi-wallet overview & Top-Up
    │   ├── Insights/           # Healthcare spend analytics & monthly breakdown
    │   ├── People/             # Dependent profiles & family management
    │   ├── HMO/                # Policy hub, Provider link, Pre-auth request engine
    │   ├── WelliRecord/        # Hospital EMR cloud sync
    │   ├── Facilities/         # Verified hospital directory & direct settlement
    │   └── Profile/            # Settings, Biometrics, Language (EN/PCM), Help, Legal
    ├── state/
    │   ├── copy.ts             # Complete bilingual English & Pidgin dictionary
    │   ├── seed.ts             # Initial domain models & mock data
    │   └── store.ts            # Persistent Zustand store
    ├── theme/
    │   └── tokens.ts           # Broadsheet palette, typography, radii, shadows
    └── utils/
        ├── biometrics.ts       # Face ID / Fingerprint verification
        ├── haptics.ts          # Tactile feedback utilities
        ├── helpers.ts          # Currency formatting (₦), dates, validators
        ├── pdfGenerator.ts     # expo-print medical PDF generator & sharing
        └── statusMeta.ts       # Bill and payment status descriptors
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on iOS or Android (or Xcode / Android Studio for local simulators)

### Installation
```bash
# Clone the repository
git clone https://github.com/wellinovate/WelliPay-MobileApp.git
cd WelliPay-MobileApp

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Metro bundler
npx expo start

# Open on Android
npx expo start --android

# Open on iOS
npx expo start --ios
```

### Type Checking & Testing Bundles
```bash
# Run TypeScript validation
npx tsc --noEmit

# Export standalone bundles
npx expo export --platform android --no-bytecode
npx expo export --platform ios --no-bytecode
```

### Building Standalone Binaries (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Build Android APK (preview)
eas build --platform android --profile preview

# Build Android App Bundle (Google Play production)
eas build --platform android --profile production

# Build iOS Archive (App Store / TestFlight)
eas build --platform ios --profile production
```

---

## License
Proprietary & Confidential — WelliNovate Inc.
