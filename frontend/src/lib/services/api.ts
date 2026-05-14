import { env } from '$env/dynamic/public';
import type { Plan, Sesion, Lectura, PreferenciaPago, CartaTarot } from '$lib/types';

const API_URL = env.PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
	constructor(
		public status: number,
		public message: string,
		public data?: any
	) {
		super(message);
		this.name = 'ApiError';
	}
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const url = `${API_URL}${endpoint}`;
	console.log('[API] Fetching:', url, 'API_URL:', API_URL);

	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		}
	});

	console.log('[API] Response status:', response.status, response.ok);

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
		throw new ApiError(response.status, error.error || error.mensaje || 'Error en la solicitud', error);
	}

	return response.json();
}

// Planes
export async function obtenerPlanes(): Promise<Plan[]> {
	return fetchAPI<Plan[]>('/planes');
}

// Sesiones
export interface CrearSesionData {
	plan_id: string;
	pregunta: string;
	cartas: CartaTarot[];
	sesion_origen_id?: string;
}

export async function crearSesion(data: CrearSesionData): Promise<Sesion> {
	return fetchAPI<Sesion>('/sesiones', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function obtenerSesion(sesionId: string, tokenAcceso?: string): Promise<Sesion> {
	const params = tokenAcceso ? `?token_acceso=${tokenAcceso}` : '';
	return fetchAPI<Sesion>(`/sesiones/${sesionId}${params}`);
}

// Pagos
export async function crearPreferenciaPago(sesionId: string, tokenAcceso?: string): Promise<PreferenciaPago> {
	return fetchAPI<PreferenciaPago>('/pagos/preference', {
		method: 'POST',
		body: JSON.stringify({ sesion_id: sesionId, token_acceso: tokenAcceso })
	});
}

export async function iniciarPago(sesionId: string): Promise<PreferenciaPago> {
	return fetchAPI<PreferenciaPago>('/pagos/preference', {
		method: 'POST',
		body: JSON.stringify({ sesion_id: sesionId })
	});
}

// Lecturas
export async function obtenerLectura(sesionId: string, tokenAcceso?: string): Promise<Lectura> {
	const params = tokenAcceso ? `?token_acceso=${tokenAcceso}` : '';
	return fetchAPI<Lectura>(`/lecturas/${sesionId}${params}`);
}

