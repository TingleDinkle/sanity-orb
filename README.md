# The Internet Sanity Orb

A mesmerizing 3D visualization that represents the collective digital consciousness through an interactive, animated orb. Watch as the orb's colors, particles, and effects dynamically change based on your "sanity level" - a metaphor for the internet's mental clarity and stability. This project represents my exploration of cutting-edge frontend technologies and the creation of something genuinely wholesome in our often chaotic digital landscape.

## The Origin Story

The inspiration for this project came from a simple yet profound concept: the "Mood Ring" for the internet. Initially, I envisioned creating an application that would scrape the web and analyze the general mood of the internet, essentially creating "THE Internet Mood Ring." 

However, as I delved deeper into the concept, I realized something important about our digital world.

As Anthony Po beautifully expressed:

> "The Internet can feel so negative sometimes, like there's just infinite drama videos and just slop. But sometimes people kind of just want something stupid, fun and wholesome and that's like, a comforting thought, I guess."

This quote perfectly captured what I wanted to create. Something that acknowledges the chaos of the internet while providing a moment of pure, wholesome fun. Instead of just analyzing the internet's mood, I decided to put my own creative spin on it and created **The Internet Sanity Orb** - a digital consciousness that you can interact with, calm down, or watch spiral into beautiful chaos.

The orb represents the internet's collective mental state, and through your interactions, you become a digital therapist of sorts, helping to stabilize or embrace the beautiful madness of our connected world.

## Overview

The Internet Sanity Orb is a WebGL-powered interactive experience that combines advanced 3D graphics with smooth user interactions. The application features a beautiful animated orb surrounded by particle systems, star fields, and dynamic lighting effects that respond to user input in real-time. Experience the internet's digital consciousness through this mesmerizing visualization.

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
- **Digital Consciousness Slider** - Smooth range input for adjusting the internet's mental state visualization
- **Preset Buttons** - Quick access to Peak, Nominal, Warning, and Critical digital states
- **Draggable UI** - Move status panels around to customize your interface
- **Panel Toggle** - Hide/show control panel for unobstructed orb viewing
- **Keyboard Shortcuts** - Full keyboard control system
- **Funny Messages** - Minecraft-style popup messages that appear when digital consciousness is unstable

### Color System
- **Smooth Transitions** - 8-step color interpolation between digital consciousness levels
- **Real-time Updates** - All effects change color simultaneously
- **Visual Feedback** - UI elements reflect current digital consciousness state
- **Dynamic Themes** - Colors shift from green (harmony) to red (chaos) based on internet stability

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
- **Mouse**: Use the slider to adjust digital consciousness level (0-100%)
- **Preset Buttons**: Click Peak, Nominal, Warning, or Critical for quick states
- **Draggable UI**: Click and drag any status panel to move it around
- **Panel Toggle**: Click the down arrow to hide/show controls

### Keyboard Shortcuts
- **H** or **Space**: Toggle control panel visibility
- **1-4**: Quick digital consciousness presets (100%, 50%, 25%, 10%)
- **Arrow Keys**: Fine adjust digital consciousness by 5% increments
- **?**: Show/hide help overlay

### Visual States
- **Digital Harmony (75-100%)**: Bright green orb with stable particles representing perfect internet harmony
- **Network Stable (50-75%)**: Yellow-green orb with gentle movement showing stable digital consciousness
- **Data Fragmented (25-50%)**: Orange orb with increased turbulence indicating network instability
- **Digital Chaos (0-25%)**: Red orb with chaotic particle behavior and funny error messages

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

*The Internet Sanity Orb: Where digital consciousness meets visual art through the power of WebGL and modern web technologies.*
