// Mapeo de los 22 Arcanos Mayores del Tarot
export const ARCANOS_MAYORES = [
	{ id: 0, nombre: 'El Loco', imagen: '/arcan_mayor/the_fool_0.png' },
	{ id: 1, nombre: 'El Mago', imagen: '/arcan_mayor/the_magician_1.png' },
	{ id: 2, nombre: 'La Sacerdotisa', imagen: '/arcan_mayor/the_high_priestess_2.png' },
	{ id: 3, nombre: 'La Emperatriz', imagen: '/arcan_mayor/the_empress_3.png' },
	{ id: 4, nombre: 'El Emperador', imagen: '/arcan_mayor/the_emperor_4.png' },
	{ id: 5, nombre: 'El Hierofante', imagen: '/arcan_mayor/the_hierophant_v.png' },
	{ id: 6, nombre: 'Los Enamorados', imagen: '/arcan_mayor/the_lovers_6.png' },
	{ id: 7, nombre: 'El Carro', imagen: '/arcan_mayor/the_chariot_7.png' },
	{ id: 8, nombre: 'La Fuerza', imagen: '/arcan_mayor/the_strength_8.png' },
	{ id: 9, nombre: 'El Ermitaño', imagen: '/arcan_mayor/the_hermit_9.png' },
	{ id: 10, nombre: 'La Rueda de la Fortuna', imagen: '/arcan_mayor/wheel_of_fortune_x.png' },
	{ id: 11, nombre: 'La Justicia', imagen: '/arcan_mayor/justice_11.png' },
	{ id: 12, nombre: 'El Colgado', imagen: '/arcan_mayor/the_hanged_man_12.png' },
	{ id: 13, nombre: 'La Muerte', imagen: '/arcan_mayor/death_13.png' },
	{ id: 14, nombre: 'La Templanza', imagen: '/arcan_mayor/temperance_14.png' },
	{ id: 15, nombre: 'El Diablo', imagen: '/arcan_mayor/the_devil_15.png' },
	{ id: 16, nombre: 'La Torre', imagen: '/arcan_mayor/the_tower_16.png' },
	{ id: 17, nombre: 'La Estrella', imagen: '/arcan_mayor/the_star_17.png' },
	{ id: 18, nombre: 'La Luna', imagen: '/arcan_mayor/the_moon_18.png' },
	{ id: 19, nombre: 'El Sol', imagen: '/arcan_mayor/the_sun_19.png' },
	{ id: 20, nombre: 'El Juicio', imagen: '/arcan_mayor/judgement_20.png' },
	{ id: 21, nombre: 'El Mundo', imagen: '/arcan_mayor/the_world_21.png' }
];

export const BACKCOVER_IMAGE = '/arcan_mayor/backcover.png';

export function obtenerArcano(index: number) {
	return ARCANOS_MAYORES[index] || null;
}
