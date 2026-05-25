import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		allowedHosts: [
			'overboastfully-pernicious-nasir.ngrok-free.dev',
			'.ngrok-free.dev',
			'.ngrok.io'
		]
	}
});
