// Mapeo de los 22 Arcanos Mayores del Tarot
export const ARCANOS_MAYORES = [
	{ id: 0, nombre: 'El Loco', imagen: '/arcan_mayor/the_fool_0-optimized.webp' },
	{ id: 1, nombre: 'El Mago', imagen: '/arcan_mayor/the_magician_1-optimized.webp' },
	{ id: 2, nombre: 'La Sacerdotisa', imagen: '/arcan_mayor/the_high_priestess_2-optimized.webp' },
	{ id: 3, nombre: 'La Emperatriz', imagen: '/arcan_mayor/the_empress_3-optimized.webp' },
	{ id: 4, nombre: 'El Emperador', imagen: '/arcan_mayor/the_emperor_4-optimized.webp' },
	{ id: 5, nombre: 'El Hierofante', imagen: '/arcan_mayor/the_hierophant_v-optimized.webp' },
	{ id: 6, nombre: 'Los Enamorados', imagen: '/arcan_mayor/the_lovers_6-optimized.webp' },
	{ id: 7, nombre: 'El Carro', imagen: '/arcan_mayor/the_chariot_7-optimized.webp' },
	{ id: 8, nombre: 'La Fuerza', imagen: '/arcan_mayor/the_strength_8-optimized.webp' },
	{ id: 9, nombre: 'El Ermitaño', imagen: '/arcan_mayor/the_hermit_9-optimized.webp' },
	{ id: 10, nombre: 'La Rueda de la Fortuna', imagen: '/arcan_mayor/wheel_of_fortune_x-optimized.webp' },
	{ id: 11, nombre: 'La Justicia', imagen: '/arcan_mayor/justice_11-optimized.webp' },
	{ id: 12, nombre: 'El Colgado', imagen: '/arcan_mayor/the_hanged_man_12-optimized.webp' },
	{ id: 13, nombre: 'La Muerte', imagen: '/arcan_mayor/death_13-optimized.webp' },
	{ id: 14, nombre: 'La Templanza', imagen: '/arcan_mayor/temperance_14-optimized.webp' },
	{ id: 15, nombre: 'El Diablo', imagen: '/arcan_mayor/the_devil_15-optimized.webp' },
	{ id: 16, nombre: 'La Torre', imagen: '/arcan_mayor/the_tower_16-optimized.webp' },
	{ id: 17, nombre: 'La Estrella', imagen: '/arcan_mayor/the_star_17-optimized.webp' },
	{ id: 18, nombre: 'La Luna', imagen: '/arcan_mayor/the_moon_18-optimized.webp' },
	{ id: 19, nombre: 'El Sol', imagen: '/arcan_mayor/the_sun_19-optimized.webp' },
	{ id: 20, nombre: 'El Juicio', imagen: '/arcan_mayor/judgement_20-optimized.webp' },
	{ id: 21, nombre: 'El Mundo', imagen: '/arcan_mayor/the_world_21-optimized.webp' }
];

export const BACKCOVER_IMAGE = '/arcan_mayor/backcover-optimized.webp';

export function obtenerArcano(index: number) {
	return ARCANOS_MAYORES[index] || null;
}
