
export interface MathConfig {
  digits: number;
  terms: number;
  speed?: number; // For flash (ms)
  listeningSpeed?: number; // For listening (TTS rate 0.5 - 2.0)
  voiceIndex?: number; // For listening
  fontSize?: 'small' | 'medium' | 'large'; // For flash
  onlyPositive?: boolean; // If true, only addition operations are generated
}

export interface NewsItem {
  id: string;
  title: string;
  created_at: string;
  content: string; // This can now be plain text OR a URL
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