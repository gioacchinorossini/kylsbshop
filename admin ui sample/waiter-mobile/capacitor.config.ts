import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sizzlinggrill.waiter',
  appName: 'SG Waiter',
  webDir: 'dist',
  server: {
    // Uncomment and set this to your server's ngrok/local URL for live-reload during dev:
    // url: 'http://192.168.x.x:5173',
    // cleartext: true, // Allow HTTP (needed for local dev)
  },
  android: {
    allowMixedContent: true, // Allow HTTP requests to local Next.js server
  },
};

export default config;
