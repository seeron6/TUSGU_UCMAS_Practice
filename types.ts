export interface MathConfig {
  digits: number;
  terms: number;
  speed?: number; // For flash (ms)
  listeningSpeed?: number; // For listening (TTS rate 0.5 - 2.0)
  voiceIndex?: number; // For listening
  fontSize?: 'small' | 'medium' | 'large'; // For flash
}

export interface NewsItem {
  id: string;
  title: string;
  created_at: string;
  content: string;
}

export interface RequestItem {
  email: string;
  phone: string;
  materials: string;
}

export interface MathSequenceItem {
  value: number;
  operation: '+' | '-';
  displayValue?: string; // For flash mode (e.g. empty string to clear screen)
}

export enum GameState {
  CONFIG = 'CONFIG',
  PLAYING = 'PLAYING',
  INPUT = 'INPUT',
  FEEDBACK = 'FEEDBACK'
}
