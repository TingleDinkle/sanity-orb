import * as Tone from 'tone';

class AudioManager {
  private synths: {
    drone: Tone.PolySynth | null;
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
  private intervals: NodeJS.Timeout[];

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
    this.intervals = [];
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await Tone.start();
      
      this.reverb = new Tone.Reverb({
        decay: 4,
        wet: 0.4
      }).toDestination();

      this.filter = new Tone.Filter({
        frequency: 800,
        type: 'lowpass',
        rolloff: -24
      }).connect(this.reverb);

      this.synths.drone = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sawtooth'
        },
        envelope: {
          attack: 2,
          decay: 1,
          sustain: 0.8,
          release: 3
        },
        volume: -12
      }).connect(this.reverb);

      this.lfo = new Tone.LFO({
        frequency: 0.1,
        min: -20,
        max: 20
      });
      // Connect LFO to the drone's detune through a workaround since PolySynth doesn't expose detune directly
      this.lfo.start();

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
    if (this.synths.drone) {
      // Create a continuous, evolving drone for critical level
      // Start with a deep fundamental drone
      this.synths.drone.triggerAttack('C1');

      // Add harmonic layers after a short delay
      const harmonicTimeout1 = setTimeout(() => {
        if (this.currentRange === 'low' && this.synths.drone) {
          this.synths.drone.triggerAttack('G1');
        }
      }, 1000);

      const harmonicTimeout2 = setTimeout(() => {
        if (this.currentRange === 'low' && this.synths.drone) {
          this.synths.drone.triggerAttack('C2');
        }
      }, 2000);

      // Store timeouts for cleanup
      this.intervals.push(harmonicTimeout1 as any);
      this.intervals.push(harmonicTimeout2 as any);

      // Create subtle variations every 12-15 seconds to maintain interest
      const variationInterval = setInterval(() => {
        if (this.currentRange !== 'low') {
          clearInterval(variationInterval);
          return;
        }
        if (this.synths.drone) {
          // Add a brief higher harmonic for tension
          this.synths.drone.triggerAttackRelease('D2', '2n', undefined, 0.2);
        }
      }, Math.random() * 3000 + 12000); // Random interval between 12-15 seconds

      this.intervals.push(variationInterval);
    }
  }

  private playMidRange() {
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
      
      this.intervals.push(interval);
    }
  }

  private playHighRange() {
    if (this.synths.ambient && this.filter) {
      this.filter.frequency.value = 1200;
      
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
          this.synths.ambient.triggerAttackRelease(ambientChords[chordIndex], '2n');
          chordIndex = (chordIndex + 1) % ambientChords.length;
        }
      };
      
      playAmbientChord();
      
      const interval = setInterval(() => {
        if (this.currentRange !== 'high') {
          clearInterval(interval);
          return;
        }
        playAmbientChord();
      }, 4000);
      
      this.intervals.push(interval);
    }
  }

  private stopAll() {
    this.intervals.forEach(id => {
      clearInterval(id);
      clearTimeout(id);
    });
    this.intervals = [];

    // Immediately stop all synths by disposing and recreating them
    this.disposeSynths();
    this.createSynths();

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

  private disposeSynths() {
    Object.values(this.synths).forEach(synth => {
      if (synth) synth.dispose();
    });
  }

  private createSynths() {
    if (!this.isInitialized || !this.reverb || !this.filter) return;

    this.synths.drone = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 0.8,
        release: 3
      },
      volume: -12
    }).connect(this.reverb);

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

    if (this.lfo) {
      this.lfo.stop();
      this.lfo.dispose();
    }
    if (this.reverb) this.reverb.dispose();
    if (this.filter) this.filter.dispose();

    this.isInitialized = false;
  }
}

export const audioManager = new AudioManager();
