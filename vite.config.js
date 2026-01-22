
import { defineConfig } from 'vite';

export default defineConfig({
    root: './',
    envDir: './', // Ensure .env is loaded from root
    server: {
        host: true
    }
});
