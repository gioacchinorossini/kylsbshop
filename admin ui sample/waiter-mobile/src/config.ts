// Configure your Next.js server address here.
// This is the base URL of your running SizzlingGrill Next.js backend.
// You can update this to your ngrok URL or local IP when deploying.

export const SERVER_URL: string =
  (typeof window !== 'undefined' && localStorage.getItem('sg_server_url')) ||
  'http://localhost:3000';

export function getServerUrl(): string {
  return localStorage.getItem('sg_server_url') || 'http://localhost:3000';
}

export function setServerUrl(url: string): void {
  // Strip trailing slash
  localStorage.setItem('sg_server_url', url.replace(/\/$/, ''));
}
