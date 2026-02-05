# Likhavat Frontend

A modern React application built with Vite, serving as the frontend for the Likhavat platform - a collaborative writing and scripting application.

## 🚀 Technology Stack

- **React 19** - Latest React with modern hooks and concurrent features
- **Vite** - Fast build tool with Hot Module Replacement (HMR)
- **Tailwind CSS 4** - Utility-first CSS framework for rapid styling
- **SWC** - Fast JavaScript/TypeScript compiler for React

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, and other assets
│   ├── components/        # Reusable React components
│   │   └── LoginBackground.jsx  # Animated Devanagari background
│   ├── layout/
│   │   └── Background.jsx       # Main layout wrapper
│   ├── App.jsx            # Root application component
│   ├── App.css            # Application-specific styles (currently empty)
│   ├── index.css          # Global styles with Tailwind imports
│   └── main.jsx           # Application entry point
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies and scripts
└── eslint.config.js       # ESLint configuration
```

## 🎨 Features

### Layout System
- **Background Component**: Animated Devanagari characters floating across the screen
- **Layout Wrapper**: Provides consistent page structure with relative positioning
- **Responsive Design**: Built with Tailwind CSS for mobile-first responsive design

### Components
- **LoginBackground**: Creates an immersive background with Devanagari script characters
  - Animated particles effect
  - Dark theme background (#020617)
  - Non-interactive overlay

## 🛠️ Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Starts the Vite development server with hot reload at `http://localhost:5173`

### Build for Production
```bash
npm run build
```
Creates optimized production build in `dist/` directory

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing

### Linting
```bash
npm run lint
```
Runs ESLint to check code quality and style

## 🎯 Current State

The frontend currently displays a basic home page with:
- Animated Devanagari background
- Simple "Home Page" heading
- Placeholder content area

This serves as the foundation for building out the full Likhavat application features including:
- User authentication
- Script writing interface
- Collaborative editing
- Book management
- Chat functionality

## 🔧 Configuration

### Vite Config
- Uses SWC for fast React compilation
- Tailwind CSS integrated via Vite plugin
- Hot Module Replacement enabled

### ESLint Config
- React-specific linting rules
- Modern JavaScript standards
- TypeScript-ready (can be extended)

### Tailwind CSS
- Utility-first approach
- Custom particle animation styles
- Dark theme foundation

## 📦 Dependencies

**Core:**
- `react` & `react-dom` - React framework
- `vite` - Build tool
- `tailwindcss` - CSS framework

**Development:**
- `@vitejs/plugin-react-swc` - React SWC plugin
- `eslint` - Code linting
- Various ESLint plugins for React

## 🚀 Future Enhancements

- User authentication pages
- Script editor with rich text capabilities
- Real-time collaborative features
- Book and chapter management UI
- Chat interface integration
- Mobile-responsive design improvements
