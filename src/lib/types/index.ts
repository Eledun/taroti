// Tipos para el proyecto Taroti

export type TipoTirada = 'tres_cartas' | 'cruz_celta' | 'rueda_del_anio';
export type TipoUsuario = 'anonimo' | 'registrado';
export type EstadoSesion = 'pendiente' | 'pagada' | 'completada' | 'cancelada';
export type AmbitoLectura = 'amor' | 'trabajo' | 'dinero' | 'salud' | 'espiritual' | 'general';

export interface Plan {
	id: string;
	nombre: string;
	tipo_tirada: TipoTirada;
	num_cartas: number;
	precio_base: number;
	recargo_anonimo_pct: number;
	precio_final: number;
	activo: boolean;
}

export interface CartaTarot {
	arcano: string;
	invertida: boolean;
	posicion: number;
}

export interface Sesion {
	id: string;
	pregunta: string;
	cartas: CartaTarot[];
	estado: EstadoSesion;
	precio: number;
	generando: boolean;
	creado_en: string;
	tipo_usuario: TipoUsuario;
	token_acceso?: string;
	plan: {
		nombre: string;
		tipo_tirada: TipoTirada;
	};
	lectura?: LecturaResumen;
}

export interface LecturaResumen {
	id: string;
	ambito_detectado: AmbitoLectura;
	expirada: boolean;
	expira_en: string | null;
}

export interface Lectura {
	id: string;
	sesion_id: string;
	pregunta: string;
	cartas: CartaTarot[];
	ambito_detectado: AmbitoLectura;
	interpretacion: string;
	creado_en: string;
	expira_en: string | null;
	plan: {
		nombre: string;
		tipo_tirada: TipoTirada;
	};
}

export interface PreferenciaPago {
	preference_id: string;
	init_point: string;
}
