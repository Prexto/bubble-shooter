import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arcade.juicybubbleshooter',
  appName: 'Juicy Bubble Shooter',
  webDir: 'dist',
  backgroundColor: '#0e1013',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0e1013',
      showSpinner: false,
    },
  },
};

export default config;
