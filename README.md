# The Internet Sanity Orb

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.180.0-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.18-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Tone.js](https://img.shields.io/badge/Tone.js-14.7.77-000000?style=for-the-badge)

A mesmerizing 3D visualization that represents the collective digital consciousness through an interactive, animated orb. Watch as the orb's colors, particles, and effects dynamically change based on your "sanity level", a metaphor for the internet's mental clarity and stability. This project represents my exploration of cutting-edge frontend technologies and the creation of something genuinely wholesome in our often chaotic digital landscape.

## The Origin Story

The inspiration for this project came from a simple yet profound concept: the "Mood Ring" for the internet. Initially, I envisioned creating an application that would scrape the web and analyze the general mood of the internet, essentially creating "THE Internet Mood Ring." 

However, as I delved deeper into the concept, I realized something important about our digital world.

As Anthony Po beautifully expressed:

> "The Internet can feel so negative sometimes, like there's just infinite drama videos and just slop. But sometimes people kind of just want something stupid, fun and wholesome and that's like, a comforting thought, I guess."

This quote perfectly captured what I wanted to create. Something that acknowledges the chaos of the internet while providing a moment of pure, wholesome fun. Instead of just analyzing the internet's mood, I decided to put my own creative spin on it and created **The Internet Sanity Orb**, a digital consciousness that you can interact with, calm down, or watch spiral into beautiful chaos.

The orb represents the internet's collective mental state, and through your interactions, you become a digital therapist of sorts, helping to stabilize or embrace the beautiful madness of our connected world.

## Overview

The Internet Sanity Orb is a WebGL-powered interactive experience that combines advanced 3D graphics with smooth user interactions. The application features a beautiful animated orb surrounded by particle systems, star fields, and dynamic lighting effects that respond to user input in real-time. Experience the internet's digital consciousness through this mesmerizing visualization with immersive audio soundscapes, screen shake effects during critical states, and humorous Minecraft-style pop-up messages during unstable periods.

## Technologies Used

### Frontend Framework
- **React 19.1.1** - Modern React with hooks and functional components
- **TypeScript 5.9.3** - Type-safe development with interfaces and type definitions
- **Vite 7.1.7** - Fast build tool and development server with hot module replacement

### 3D Graphics & WebGL
- **Three.js 0.180.0** - 3D graphics library for WebGL rendering
- **Custom GLSL Shaders** - Vertex and fragment shaders for advanced visual effects
- **WebGL Renderer** - Hardware-accelerated 3D rendering with ACES Filmic tone mapping

### Audio System
- **Tone.js 14.7.77** - Web Audio API framework for immersive soundscapes
- **Synthesizers** - Drone bass, ambient pads, and harmonic atmospheres
- **Audio Effects** - Reverb, filters, and LFO modulation

### Styling & UI
- **Tailwind CSS 3.4.18** - Utility-first CSS framework
- **PostCSS 8.5.6** - CSS processing and optimization
- **Autoprefixer 10.4.21** - Automatic vendor prefixing

### Backend Infrastructure
- **Node.js** - JavaScript runtime environment
- **Express.js 4.18.2** - Web application framework for RESTful API
- **PostgreSQL** - Relational database system
- **pg 8.11.3** - Node.js PostgreSQL client with connection pooling
- **CORS 2.8.5** - Cross-Origin Resource Sharing middleware
- **dotenv 16.3.1** - Environment variable management

### Development Tools
- **ESLint 9.36.0** - Code linting and style enforcement
- **TypeScript Compiler** - Type checking and compilation
- **Vite Dev Server** - Hot module replacement and fast development
- **Nodemon 3.0.1** - Automatic server restart on file changes

### Build & Deployment
- **Vite Build** - Production build optimization
- **Rollup** - Module bundling (via Vite)
- **Modern JavaScript** - ES2020+ features and syntax

## Features

### 3D Visual Effects
- **Animated Orb** - Procedurally animated sphere with noise-based surface distortion
- **Particle System** - 120 orbiting particles with dynamic movement and color changes
- **Star Field** - Multiple layers of animated background stars
- **Glow Effects** - Additive blending glow spheres and rim lighting
- **Dynamic Lighting** - Ambient, key, and rim lights for dramatic depth
- **Screen Shake** - Intense camera shake effect during critical sanity levels

### Interactive Controls
- **Digital Consciousness Slider** - Smooth range input for adjusting the internet's mental state visualization
- **Preset Buttons** - Quick access to Peak, Nominal, Warning, and Critical digital states
- **Panel Toggle** - Hide/show control panel for unobstructed orb viewing
- **Keyboard Shortcuts** - Full keyboard control system
- **Audio Controls** - Mute/unmute button for soundscape management

### Audio System
- **Reactive Soundscapes** - Audio responds dynamically to sanity levels
- **Low Range (0-20%)** - Dark, ominous drone with detuned bass
- **Mid Range (20-60%)** - Soft ambient pads with gentle chord progressions
- **High Range (60-100%)** - Harmonic ambient atmosphere with floating tones
- **Immersive Effects** - Reverb and filtering for depth and atmosphere

### Visual Feedback
- **Minecraft-Style Messages** - Humorous tech support messages appear during warning levels (25-50%)
- **Ominous Overlay** - Dark red pulsing effect during critical states (0-25%)
- **Smooth Transitions** - 8-step color interpolation between digital consciousness levels
- **Real-time Updates** - All effects change color simultaneously
- **Dynamic Themes** - Colors shift from green (harmony) to red (chaos) based on internet stability

### User Experience
- **Opening Animation** - Cinematic mind assembly sequence on startup
- **Responsive Design** - Works on all screen sizes
- **Error Handling** - WebGL support detection and graceful fallbacks
- **Help System** - Interactive help overlay with all controls
- **Performance Optimized** - 60fps animations with efficient rendering

## Project Structure

```
src/
├── components/
│   ├── three/
│   │   ├── ThreeScene.tsx          # Main 3D scene manager
│   │   └── MindAssemblyScene.tsx   # Opening animation
│   ├── ui/
│   │   ├── StatusPanel.tsx         # System status display
│   │   ├── CoherenceIndex.tsx      # Sanity percentage indicator
│   │   ├── SystemIndicators.tsx    # Status indicators
│   │   ├── ControlPanel.tsx        # Interactive controls
│   │   ├── HelpOverlay.tsx         # Help system
│   │   ├── FunnyMessages.tsx       # Minecraft-style popups
│   │   ├── AudioControls.tsx       # Audio mute toggle
│   │   └── RestoreComponentsMenu.tsx # UI restoration
│   ├── animations/
│   │   └── OpeningAnimation.tsx    # Startup sequence
│   └── SanityOrb.tsx               # Main application component
├── types/
│   └── sanity.ts                   # TypeScript interfaces
├── constants/
│   └── sanityConstants.ts          # Configuration constants
├── utils/
│   ├── sanityUtils.ts              # Utility functions
│   └── audioManager.ts             # Audio system manager
├── shaders/
│   └── orbShaders.ts               # GLSL shader code
├── services/
│   └── api.ts                      # Backend API service
├── App.jsx                         # Root application component
├── main.jsx                        # Application entry point
└── index.css                       # Global styles

backend/
├── server.js                       # Express server and API endpoints
├── package.json                    # Backend dependencies
└── .env                            # Environment configuration
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sanity-orb
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Configure environment variables**
   ```bash
   # Frontend (.env)
   VITE_API_URL=http://localhost:3001/api
   
   # Backend (backend/.env)
   PORT=3001
   DATABASE_URL=postgresql://postgres:password@localhost:5432/sanity_orb
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Frontend
   npm run dev
   
   # Terminal 2 - Backend
   cd backend
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## Usage

### Basic Controls
- **Mouse**: Use the slider to adjust digital consciousness level (0-100%)
- **Preset Buttons**: Click Peak, Nominal, Warning, or Critical for quick states
- **Panel Toggle**: Click the down arrow to hide/show controls
- **Audio Control**: Click speaker icon to mute/unmute soundscapes

### Keyboard Shortcuts
- **H** or **Space**: Toggle control panel visibility
- **1-4**: Quick digital consciousness presets (100%, 50%, 25%, 10%)
- **Arrow Keys**: Fine adjust digital consciousness by 5% increments
- **?**: Show/hide help overlay

### Visual States
- **Digital Harmony (75-100%)**: Bright green orb with stable particles and gentle harmonic audio
- **Network Stable (50-75%)**: Yellow-green orb with gentle movement and ambient pad tones
- **Data Fragmented (25-50%)**: Orange orb with increased turbulence, humorous Minecraft-style error messages, and transitioning audio
- **Digital Chaos (0-25%)**: Red orb with screen shake, ominous dark overlay, chaotic particle behavior, and deep drone audio

## Video Demo

https://www.youtube.com/watch?v=77-n_cblU28 (First Prototype Demo)

[ULTRA POLISHED PRODUCT YOUTUBE DEMO TEMPLATE] (not done)

## Technical Details

### Shader System
The orb uses custom GLSL shaders for advanced visual effects:
- **Vertex Shader**: Implements Simplex noise for surface distortion
- **Fragment Shader**: Creates fresnel-based glow effects with pulsing animations
- **Uniforms**: Time, color, pulse speed, and turbulence parameters

### Audio Architecture
The audio system uses Tone.js to create three distinct soundscapes:
- **Low Sanity (0-20%)**: Sustained bass drone with LFO modulation and occasional detuned hums
- **Mid Sanity (20-60%)**: Soft polyphonic pads playing gentle chord progressions
- **High Sanity (60-100%)**: Ambient harmonic chords with filtered high-frequency tones

### Backend API
The Express.js backend provides RESTful endpoints for data persistence:
- **POST /api/sessions**: Save user sanity sessions
- **GET /api/sessions/:userId**: Retrieve user session history
- **GET /api/stats/global**: Get global sanity statistics
- **POST /api/snapshots**: Save real-time sanity snapshots
- **GET /api/mood/current**: Get current internet mood average

### Screen Shake Implementation
Critical sanity levels (0-25%) trigger dynamic screen shake:
- Shake intensity increases as sanity decreases
- Random directional movement updated every 50ms
- Smooth transitions using CSS transforms

### Performance Optimizations
- **Efficient Rendering**: Uses requestAnimationFrame for smooth 60fps
- **Memory Management**: Proper cleanup of Three.js objects and event listeners
- **Bundle Optimization**: Code splitting and tree shaking via Vite
- **WebGL Optimization**: Hardware-accelerated rendering with antialiasing
- **Audio Optimization**: Lazy initialization on first user interaction

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **WebGL Support**: Required for 3D rendering
- **Web Audio API**: Required for audio features
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
- **Component Architecture**: Separation of concerns with UI, Three.js, and utility modules

## License

This project is licensed under the [MIT License](./LICENSE).

Please credit the original author, **Jesse Dao**, when redistributing or modifying this software.

## Acknowledgments

- **Three.js Community** - For the excellent 3D graphics library
- **React Team** - For the powerful frontend framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Vite Team** - For the fast build tool
- **Tone.js** - For the comprehensive Web Audio API framework

---

*The Internet Sanity Orb: Where digital consciousness meets visual art through the power of WebGL, immersive audio, and modern web technologies.*
