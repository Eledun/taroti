// Planes hardcodeados (sin base de datos)
import type { Plan, TipoTirada } from '$lib/types';

export const PLANES: Plan[] = [
	{
		id: 'tres-cartas',
		nombre: 'Tres Cartas',
		tipo_tirada: 'tres_cartas' as TipoTirada,
		num_cartas: 3,
		precio_base: 1000,
		recargo_anonimo_pct: 0,
		precio_final: 1000,
		activo: true
	},
	{
		id: 'cruz-celta',
		nombre: 'Cruz Celta',
		tipo_tirada: 'cruz_celta' as TipoTirada,
		num_cartas: 10,
		precio_base: 2000,
		recargo_anonimo_pct: 0,
		precio_final: 2000,
		activo: true
	},
	{
		id: 'rueda-del-anio',
		nombre: 'Rueda del Año',
		tipo_tirada: 'rueda_del_anio' as TipoTirada,
		num_cartas: 12,
		precio_base: 3000,
		recargo_anonimo_pct: 0,
		precio_final: 3000,
		activo: true
	}
];

export function obtenerPlanPorId(planId: string): Plan | undefined {
	return PLANES.find(p => p.id === planId);
}
