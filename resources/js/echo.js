import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const createEcho = () => {
    // Utamakan window.location.hostname dari browser saat ini agar bekerja di IP/domain apapun
    const currentHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    const envHost = import.meta.env.VITE_REVERB_HOST;
    const host = (envHost && envHost !== '127.0.0.1' && envHost !== 'localhost') ? envHost : currentHost;

    const key = import.meta.env.VITE_REVERB_APP_KEY || 'gfjrzhqj3agfxyhxy2rs';
    const port = parseInt(import.meta.env.VITE_REVERB_PORT) || 8080;
    const scheme = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'https' : (import.meta.env.VITE_REVERB_SCHEME || 'http');

    if (!key) {
        return null;
    }

    try {
        return new Echo({
            broadcaster: 'reverb',
            key: key,
            wsHost: host,
            wsPort: port,
            wssPort: port,
            forceTLS: scheme === 'https',
            enabledTransports: ['ws', 'wss'],
        });
    } catch (e) {
        console.warn('Gagal menginisialisasi Echo WebSocket:', e);
        return null;
    }
};

export default createEcho;
