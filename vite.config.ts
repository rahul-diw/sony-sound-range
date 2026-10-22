import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
// `vite build --mode single` => ONE html file (used for the shareable preview). Normal build keeps /public/frames as separate files.
export default defineConfig(({ mode }) => ({ plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])], build: { target: 'es2020', chunkSizeWarningLimit: 1500 } }));
