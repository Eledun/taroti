/**
 * Formatea una fecha ISO a formato legible en español
 */
export function formatearFecha(fechaISO: string): string {
	const fecha = new Date(fechaISO);
	return fecha.toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * Formatea un precio en pesos argentinos
 */
export function formatearPrecio(precio: number): string {
	return new Intl.NumberFormat('es-AR', {
		style: 'currency',
		currency: 'ARS'
	}).format(precio);
}
