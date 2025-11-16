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

## 🏗️ Build Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
