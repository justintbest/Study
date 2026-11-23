/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Content lives in /content (outside src) and is bundled via import.meta.glob,
// so adding a division only requires adding files there.
export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 4000 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
