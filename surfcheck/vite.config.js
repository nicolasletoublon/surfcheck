import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` must match the repo name for GitHub project pages:
// https://nicolasletoublon.github.io/surfcheck/
export default defineConfig({
  plugins: [react()],
  base: '/surfcheck/',
});
