import { NotificationSound, SoundOption } from '@/lib/types';

// Opciones de sonido predefinidas
export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'bell',
    name: 'Campana',
    description: 'Sonido clásico de campana',
  },
  {
    id: 'chime',
    name: 'Carillón',
    description: 'Sonido suave y melódico',
  },
  {
    id: 'beep',
    name: 'Pitido',
    description: 'Pitido electrónico simple',
  },
  {
    id: 'digital',
    name: 'Digital',
    description: 'Sonido digital moderno',
  },
  {
    id: 'gentle',
    name: 'Suave',
    description: 'Sonido relajante y tranquilo',
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Cargar tu propio archivo de sonido',
  },
];

// Clase para manejar la reproducción de sonidos
export class SoundManager {
  private audioContext: AudioContext | null = null;
  private customAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async playSound(soundType: NotificationSound, volume: number = 0.8, customFile?: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      if (soundType === 'custom' && customFile) {
        await this.playCustomSound(customFile, volume);
      } else {
        await this.playGeneratedSound(soundType, volume);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  private async playCustomSound(file: string, volume: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.customAudio) {
        this.customAudio.pause();
        this.customAudio.currentTime = 0;
      }

      this.customAudio = new Audio(file);
      this.customAudio.volume = Math.max(0, Math.min(1, volume));
      
      this.customAudio.onended = () => resolve();
      this.customAudio.onerror = () => reject(new Error('Failed to play custom sound'));
      
      this.customAudio.play().catch(reject);
    });
  }

  private async playGeneratedSound(soundType: NotificationSound, volume: number): Promise<void> {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Configurar el sonido según el tipo
    switch (soundType) {
      case 'bell':
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.8);
        break;

      case 'chime':
        // Crear múltiples tonos para efecto de carillón
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        frequencies.forEach((freq, index) => {
          const osc = this.audioContext!.createOscillator();
          const gain = this.audioContext!.createGain();
          
          osc.connect(gain);
          gain.connect(this.audioContext!.destination);
          
          osc.frequency.value = freq;
          osc.type = 'sine';
          
          gain.gain.setValueAtTime(0, this.audioContext!.currentTime + index * 0.1);
          gain.gain.linearRampToValueAtTime(volume * 0.2, this.audioContext!.currentTime + index * 0.1 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + index * 0.1 + 0.6);
          
          osc.start(this.audioContext!.currentTime + index * 0.1);
          osc.stop(this.audioContext!.currentTime + index * 0.1 + 0.6);
        });
        return;

      case 'beep':
        oscillator.frequency.value = 1000;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.2, this.audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
        break;

      case 'digital':
        oscillator.frequency.value = 440;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.15, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(volume * 0.15, this.audioContext.currentTime + 0.15);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
        break;

      case 'gentle':
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(440, this.audioContext.currentTime + 0.5);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.1, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1.0);
        break;

      default:
        // Sonido por defecto (bell)
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.2, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    return new Promise((resolve) => {
      oscillator.onended = () => resolve();
    });
  }

  // Método para cargar y validar archivos de audio personalizados
  async loadCustomSound(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('audio/')) {
        reject(new Error('El archivo debe ser de audio'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB máximo
        reject(new Error('El archivo de audio no puede superar los 5MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  // Método para probar un sonido
  async testSound(soundType: NotificationSound, volume: number, customFile?: string): Promise<void> {
    await this.playSound(soundType, volume / 100, customFile);
  }
}

// Instancia singleton del manager de sonidos
export const soundManager = new SoundManager();
