import * as Tone from 'tone';

class AudioManager {
  private synths: {
    drone: Tone.Synth | null;
    pad: Tone.PolySynth | null;
    bright: Tone.PolySynth | null;
    ambient: Tone.PolySynth | null;
  };
  private lfo: Tone.LFO | null;
  private reverb: Tone.Reverb | null;
  private filter: Tone.Filter | null;
  private currentRange: string | null;
  private isInitialized: boolean;
  private isMuted: boolean;

  constructor() {
    this.synths = {
      drone: null,
      pad: null,
      bright: null,
      ambient: null,
    };
    this.lfo = null;
    this.reverb = null;
    this.filter = null;
    this.currentRange = null;
    this.isInitialized = false;
    this.isMuted = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await Tone.start();
      
      // Create reverb for all synths
      this.reverb = new Tone.Reverb({
        decay: 4,
        wet: 0.4
      }).toDestination();

      // Create filter for ambient sounds
      this.filter = new Tone.Filter({
        frequency: 800,
        type: 'lowpass',
        rolloff: -24
      }).connect(this.reverb);

      // LOW RANGE (0-20): Dark, ominous drone
      this.synths.drone = new Tone.Synth({
        oscillator: {
          type: 'sawtooth',
          detune: -15
        },
        envelope: {
          attack: 2,
          decay: 1,
          sustain: 0.8,
          release: 3
        },
        volume: -12
      }).connect(this.reverb);

      // Add slow modulation LFO
      this.lfo = new Tone.LFO({
        frequency: 0.1,
        min: -20,
        max: 20
      });
      this.lfo.connect(this.synths.drone.detune);

      // MID RANGE (40-60): Soft ambient pads
      this.synths.pad = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 2,
          decay: 1.5,
          sustain: 0.6,
          release: 4
        },
        volume: -18
      }).connect(this.reverb);

      // HIGH RANGE (80-100): Ambient harmonic atmosphere
      this.synths.ambient = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 3,
          decay: 2,
          sustain: 0.8,
          release: 5
        },
        volume: -20
      }).connect(this.filter);

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  updateSanity(sanity: number) {
    if (!this.isInitialized || this.isMuted) return;

    const range = this.getSanityRange(sanity);
    
    // Only update if range changed
    if (range === this.currentRange) return;
    
    this.stopAll();
    this.currentRange = range;

    switch (range) {
      case 'low':
        this.playLowRange();
        break;
      case 'mid':
        this.playMidRange();
        break;
      case 'high':
        this.playHighRange();
        break;
    }
  }

  private getSanityRange(sanity: number): string {
    if (sanity <= 20) return 'low';
    if (sanity <= 60) return 'mid';
    return 'high';
  }

  private playLowRange() {
    // Low bass drone with detuned hums
    if (this.synths.drone && this.lfo) {
      this.synths.drone.triggerAttack('C1');
      this.lfo.start();
      
      // Add occasional detuned hums
      const interval = setInterval(() => {
        if (this.currentRange !== 'low') {
          clearInterval(interval);
          return;
        }
        if (this.synths.drone) {
          this.synths.drone.triggerAttackRelease('G1', '4n', undefined, 0.3);
        }
      }, 8000);
    }
  }

  private playMidRange() {
    // Soft pads with airy synth
    if (this.synths.pad) {
      const chords = [
        ['C3', 'E3', 'G3'],
        ['A2', 'C3', 'E3'],
        ['F2', 'A2', 'C3'],
        ['G2', 'B2', 'D3']
      ];
      
      let index = 0;
      const playChord = () => {
        if (this.currentRange !== 'mid') return;
        if (this.synths.pad) {
          this.synths.pad.triggerAttackRelease(chords[index], '2n');
          index = (index + 1) % chords.length;
        }
      };
      
      playChord();
      const interval = setInterval(() => {
        if (this.currentRange !== 'mid') {
          clearInterval(interval);
          return;
        }
        playChord();
      }, 3000);
    }
  }

  private playHighRange() {
    // Ambient harmonic atmosphere with gentle floating tones
    if (this.synths.ambient && this.filter) {
      this.filter.frequency.value = 1200; // Gentle high-pass for clarity
      
      // Create gentle, overlapping ambient chords
      const ambientChords = [
        ['C4', 'E4', 'G4', 'B4'],
        ['D4', 'F4', 'A4', 'C5'],
        ['E4', 'G4', 'B4', 'D5'],
        ['A3', 'C4', 'E4', 'G4']
      ];
      
      let chordIndex = 0;
      
      const playAmbientChord = () => {
        if (this.currentRange !== 'high') return;
        if (this.synths.ambient) {
          // Long, overlapping notes for ambient feel
          this.synths.ambient.triggerAttackRelease(ambientChords[chordIndex], '2n');
          chordIndex = (chordIndex + 1) % ambientChords.length;
        }
      };
      
      // Initial chord
      playAmbientChord();
      
      // Slower, more spaced out chords for ambient feel
      const interval = setInterval(() => {
        if (this.currentRange !== 'high') {
          clearInterval(interval);
          return;
        }
        playAmbientChord();
      }, 4000); // 4 seconds between chords for gentle ambience
    }
  }

  private stopAll() {
    if (this.synths.drone) {
      this.synths.drone.triggerRelease();
    }
    if (this.synths.pad) {
      this.synths.pad.releaseAll();
    }
    if (this.synths.ambient) {
      this.synths.ambient.releaseAll();
    }
    if (this.lfo) {
      this.lfo.stop();
    }
    if (this.reverb) {
      this.reverb.wet.value = 0.4;
    }
    if (this.filter) {
      this.filter.frequency.value = 800;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAll();
      this.currentRange = null;
    }
    return this.isMuted;
  }

  getMuteState(): boolean {
    return this.isMuted;
  }

  dispose() {
    this.stopAll();
    
    Object.values(this.synths).forEach(synth => {
      if (synth) synth.dispose();
    });
    
    if (this.lfo) this.lfo.dispose();
    if (this.reverb) this.reverb.dispose();
    if (this.filter) this.filter.dispose();
    
    this.isInitialized = false;
  }
}

export const audioManager = new AudioManager();