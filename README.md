 # Lynqar Password Vault

A Progressive Web App (PWA) password manager built with React, TypeScript, and Vite. Features include encrypted password storage, TOTP code generation, and secure backup/restore functionality.

## 🚀 Development

```bash
cd vault-main
npm install
npm run dev
```

**Opens at: http://localhost:5173**

## 📦 Deployment

```bash
npm run build
# Upload dist/ folder to GitHub Pages (vault/)
```

## 🛠️ Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Dexie (IndexedDB wrapper)
- OTP library for TOTP codes
- PWA support with Vite Plugin PWA

## ✨ Features

- Encrypted password storage
- TOTP 2FA code generation
- Dark/Light theme toggle
- Secure backup and import
- Auto-lock functionality
- Password strength checker
- Responsive PWA design

## 🔧 Configuration

### User Settings

All user-configurable settings are accessible through the Settings page in-app.

#### Auto-Lock
- **Enable Auto-Lock**: Automatically lock vault after inactivity (default: enabled)
- **Lock Timeout Options**: 1 minute, 5 minutes, 15 minutes (default), 30 minutes, 1 hour, or never
- **Storage**: Persisted in localStorage under `vault_settings_auto_lock` key
- **Purpose**: Security feature to prevent unauthorized access

#### Themes
- **Theme Options**: Dark mode, Light mode, and custom themes
- **Storage**: Managed via ThemeContext and localStorage
- **Effect**: Changes UI colors, backgrounds, and text contrast

#### Security Settings
- **Rate Limiting**: Protects against brute force attacks (default: enabled)
- **Auto Clipboard Clear**: Automatically clear copied passwords from clipboard after timeout (default: enabled)
- **Clipboard Timeout**: 10 seconds (default), 30 seconds, 1 minute, or 5 minutes
- **Storage**: Persisted in localStorage under `vault_settings_security` key

#### Biometric Authentication
- **Supported Methods**: Fingerprint, Face ID, Windows Hello (WebAuthn API)
- **Setup Process**: Register multiple devices via WebAuthn credential registration
- **Browser Requirements**: Modern browsers with WebAuthn support (Chrome, Firefox, Safari, Edge)
- **Fallback**: Manual password entry if biometric fails or unsupported
- **Storage**: Secure WebAuthn credentials (not in localStorage)

#### Vault Actions
- **Export Backup**: Save encrypted backup of all vault entries (JSON format, currently placeholder)
- **Import Backup**: Restore vault from encrypted backup file (currently placeholder)
- **Lock Vault**: Immediately lock and clear session data

### Technical Configuration

#### Dependencies (package.json)
- **React 18.2.0**: UI framework with hooks and concurrent features
- **TypeScript ~5.9.3**: Type-safe JavaScript
- **Vite 7.2.2**: Fast build tool and development server
- **TailwindCSS 3.4.18**: Utility-first CSS framework
- **Dexie 4.2.1**: IndexedDB wrapper for offline database storage
- **Framer Motion 8.5.5**: Animation and gesture library
- **OTPLib 12.0.1**: Time-based one-time password generation
- **ZXCvbn 4.4.2**: Password strength estimation library
- **JSQR 1.4.0**: QR code scanning for TOTP setup
- **Lucide React 0.270.0**: Icon library
- **React Router DOM 6.30.1**: Client-side routing
- **Vite Plugin PWA 1.1.0**: PWA features and service worker
- **Autoprefixer 10.4.22**: CSS vendor prefixing
- **PostCSS 8.5.6**: CSS processing tool
- **Sharp 0.34.5**: Image optimization (dev dependency)

#### Build Scripts
- `npm run dev`: Start Vite development server (http://localhost:5173)
- `npm run build`: TypeScript compilation + Vite production build
- `npm run lint`: ESLint code checking with TypeScript rules
- `npm run preview`: Preview production build locally

#### Vite Configuration (vite.config.ts)
- **Base Path**: /
- **PWA Plugin**:
  - Auto-update service worker
  - Manifest with app details, icons, colors
  - Workbox patterns for caching assets
- **Manifest Details**:
  - Name: Password Vault
  - Short Name: SecureVault
  - Description: Secure, offline-first password manager
  - Theme Color: #1e1b4b (dark blue)
  - Background Color: #0f172a (dark)
  - Display: Standalone (PWA)
  - Orientation: Portrait
  - Categories: Productivity, Utilities, Security

#### Web App Manifest (public/manifest.webmanifest)
Matches Vite PWA manifest configuration for PWA installation prompts.

#### Styling Configuration

##### TailwindCSS (tailwind.config.js)
- **Content Paths**: src/**/*.ts, index.html
- **Custom Colors**: accent, surface, bg, text, muted, glass effects, border, error/success
- **Border Radius**: lg (var(--radius)), md, sm with CSS variables
- **Box Shadows**: lynqar-lg custom shadow
- **Animations**: 200ms, 320ms duration transitions
- **Breakpoints**: md (900px), lg (1200px)

##### PostCSS (postcss.config.js)
- **Plugins**: tailwindcss, autoprefixer
- **Purpose**: Process Tailwind directives and add vendor prefixes

#### TypeScript Configuration

##### Root tsconfig.json
- **Project Structure**: Separates app code (tsconfig.app.json) and build tools (tsconfig.node.json)

##### Application Config (tsconfig.app.json)
- **Target**: ES2022
- **Module**: ESNext (bundler resolution)
- **JSX**: React transform (react-jsx)
- **Libraries**: ES2022, DOM, DOM.Iterable
- **Strict Mode**: Disabled for better DX
- **Includes**: src/ directory only

##### Node.js Config (tsconfig.node.json)
- **Target**: ES2023 (for build tools)
- **Strict Mode**: Enabled with unused variable checks
- **Includes**: vite.config.ts only

#### ESLint Configuration (eslint.config.js)
- **Config Type**: Flat config (ESLint 9+)
- **Extends**: @eslint/js recommended, typescript-eslint recommended
- **Plugins**: react-hooks, react-refresh (Vite HMR)
- **Rules**: React hooks validation, React refresh optimization
- **Globals**: Browser environment
- **Ignores**: dist/ folder

## 🏗️ Build Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
