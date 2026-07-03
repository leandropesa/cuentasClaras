/// <reference types="vite/client" />

// Tipado explícito para las variables de entorno usadas en el proyecto
interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	// add more VITE_ env vars here as needed
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
