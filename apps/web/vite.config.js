import { defineConfig } from 'vite';

export default defineConfig({
    root: './',
    envDir: '../../',
    server: {
        host: true,
        port: 5173
    }
});
