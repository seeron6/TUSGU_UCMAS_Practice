import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tusgu.education',
  appName: 'TUSGU Portal',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;