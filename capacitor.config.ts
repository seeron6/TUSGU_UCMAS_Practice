import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tusgu.education',
  appName: 'UCMAS SL & TUSGU',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;