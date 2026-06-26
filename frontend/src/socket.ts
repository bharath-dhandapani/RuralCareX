import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://ruralcarex.onrender.com';
export const socket = io(API_URL);
