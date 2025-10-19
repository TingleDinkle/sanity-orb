# Sanity Orb

A mesmerizing 3D visualization application that represents mental state through an interactive, animated orb. Watch as the orb's colors, particles, and effects dynamically change based on your "sanity level" - a metaphor for mental clarity and stability. This project was meant to be me pushing my boundaries of what I can make with the newest technologies in the frontend game. Hope you like it!

Oh and also, the inspirations for this project came from the idea or concept of a "Mood Ring".

Initally, I was gonna make an application that scrapes the internet and gives out the general mood of it, like a mood ring would.

THE Internet Mood Ring. However, that idea wasn't feasible for me monetary-wise and time wise considering i'm still quite choppy on data handling. So I decided to learn about the frontend libs and make a truly beautiful orb out of it.

## Overview

Sanity Orb is a WebGL-powered interactive experience that combines advanced 3D graphics with smooth user interactions. The application features a beautiful animated orb surrounded by particle systems, star fields, and dynamic lighting effects that respond to user input in real-time.

## Technologies Used

### Frontend Framework
- **React 19.1.1** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with interfaces and type definitions
- **Vite 7.1.10** - Fast build tool and development server

### 3D Graphics & WebGL
- **Three.js 0.180.0** - 3D graphics library for WebGL rendering
- **Custom GLSL Shaders** - Vertex and fragment shaders for advanced visual effects
- **WebGL Renderer** - Hardware-accelerated 3D rendering

### Styling & UI
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **PostCSS** - CSS processing and optimization
- **Autoprefixer** - Automatic vendor prefixing

### Development Tools
- **ESLint** - Code linting and style enforcement
- **TypeScript Compiler** - Type checking and compilation
- **Vite Dev Server** - Hot module replacement and fast development

### Build & Deployment
- **Vite Build** - Production build optimization
- **Rollup** - Module bundling (via Vite)
- **Modern JavaScript** - ES2020+ features and syntax

## Features

### 3D Visual Effects
- **Animated Orb** - Procedurally animated sphere with noise-based surface distortion
- **Particle System** - 150 orbiting particles with dynamic movement and color changes
- **Star Field** - Multiple layers of animated background stars
- **Glow Effects** - Additive blending glow spheres and rim lighting
- **Dynamic Lighting** - Ambient, key, and rim lights for dramatic depth

### Interactive Controls
- **Sanity Slider** - Smooth range input for adjusting mental state visualization
- **Preset Buttons** - Quick access to Peak, Nominal, Warning, and Critical states
- **Panel Toggle** - Hide/show control panel for unobstructed orb viewing
- **Keyboard Shortcuts** - Full keyboard control system

### Color System
- **Smooth Transitions** - 8-step color interpolation between sanity levels
- **Real-time Updates** - All effects change color simultaneously
- **Visual Feedback** - UI elements reflect current sanity state

### User Experience
- **Responsive Design** - Works on all screen sizes
- **Error Handling** - WebGL support detection and graceful fallbacks
- **Help System** - Interactive help overlay with all controls
- **Performance Optimized** - 60fps animations with efficient rendering

## Project Structure

```
src/
├── components/
│   ├── three/
│   │   └── ThreeScene.tsx          # Main 3D scene manager
│   ├── ui/
│   │   ├── StatusPanel.tsx         # System status display
│   │   ├── CoherenceIndex.tsx     # Sanity percentage indicator
│   │   ├── SystemIndicators.tsx   # Status indicators
│   │   ├── ControlPanel.tsx       # Interactive controls
│   │   └── HelpOverlay.tsx        # Help system
│   └── SanityOrb.tsx              # Main application component
├── types/
│   └── sanity.ts                  # TypeScript interfaces
├── constants/
│   └── sanityConstants.ts        # Configuration constants
├── utils/
│   └── sanityUtils.ts            # Utility functions
├── shaders/
│   └── orbShaders.ts             # GLSL shader code
├── App.jsx                       # Root application component
├── main.jsx                      # Application entry point
└── index.css                     # Global styles
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sanity-orb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Usage

### Basic Controls
- **Mouse**: Use the slider to adjust sanity level (0-100%)
- **Preset Buttons**: Click Peak, Nominal, Warning, or Critical for quick states
- **Panel Toggle**: Click the down arrow to hide/show controls

### Keyboard Shortcuts
- **H** or **Space**: Toggle control panel visibility
- **1-5**: Quick sanity presets (100%, 75%, 50%, 25%, 10%)
- **Arrow Keys**: Fine adjust sanity by 5% increments
- **?**: Show/hide help overlay

### Visual States
- **Peak (75-100%)**: Bright green orb with stable particles
- **Nominal (50-75%)**: Yellow-green orb with gentle movement
- **Warning (25-50%)**: Orange orb with increased turbulence
- **Critical (0-25%)**: Red orb with chaotic particle behavior

## Video Demo

https://www.youtube.com/watch?v=77-n_cblU28

## Technical Details

### Shader System
The orb uses custom GLSL shaders for advanced visual effects:
- **Vertex Shader**: Implements Simplex noise for surface distortion
- **Fragment Shader**: Creates fresnel-based glow effects with pulsing animations
- **Uniforms**: Time, color, pulse speed, and turbulence parameters

### Performance Optimizations
- **Efficient Rendering**: Uses requestAnimationFrame for smooth 60fps
- **Memory Management**: Proper cleanup of Three.js objects and event listeners
- **Bundle Optimization**: Code splitting and tree shaking via Vite
- **WebGL Optimization**: Hardware-accelerated rendering with antialiasing

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **WebGL Support**: Required for 3D rendering
- **ES2020+**: Modern JavaScript features

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured for React and modern JavaScript
- **Prettier**: Code formatting (if configured)

## License

This project is licensed under the [MIT License](./LICENSE).

Please credit the original author, **Jesse Dao**, when redistributing or modifying this software.

## Acknowledgments

- **Three.js Community** - For the excellent 3D graphics library
- **React Team** - For the powerful frontend framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Vite Team** - For the fast build tool

---

*Sanity Orb: Where mental state meets visual art through the power of WebGL and modern web technologies.*
