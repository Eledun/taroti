import type { Plan, Sesion, Lectura, PreferenciaPago, CartaTarot } from '$lib/types';

// Ahora usamos rutas internas de SvelteKit (server endpoints)
const API_URL = '/api';

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
	console.log('[API] Fetching:', url);

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
export interface IniciarPagoData {
	sesion_id: string;
	plan_nombre?: string;
	precio?: number;
	email?: string;
	token_acceso?: string;
}

export async function crearPreferenciaPago(data: IniciarPagoData): Promise<PreferenciaPago> {
	return fetchAPI<PreferenciaPago>('/pagos/preference', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function iniciarPago(sesionId: string, planNombre?: string, precio?: number, email?: string): Promise<PreferenciaPago> {
	return fetchAPI<PreferenciaPago>('/pagos/preference', {
		method: 'POST',
		body: JSON.stringify({
			sesion_id: sesionId,
			plan_nombre: planNombre,
			precio: precio,
			email: email
		})
	});
}

// Lecturas
export interface ObtenerLecturaParams {
	pregunta: string;
	cartas: CartaTarot[];
	tipo_tirada: string;
	plan_nombre: string;
	token_acceso?: string;
}

export async function obtenerLectura(sesionId: string, params: ObtenerLecturaParams): Promise<Lectura> {
	const queryParams = new URLSearchParams({
		pregunta: params.pregunta,
		cartas: JSON.stringify(params.cartas),
		tipo_tirada: params.tipo_tirada,
		plan_nombre: params.plan_nombre
	});

	if (params.token_acceso) {
		queryParams.set('token_acceso', params.token_acceso);
	}

	return fetchAPI<Lectura>(`/lecturas/${sesionId}?${queryParams.toString()}`);
}

