import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import type { CartaTarot, Lectura, TipoTirada } from '$lib/types';

// Importar datos de arcanos
import { ARCANOS_MAYORES } from '$lib/data/arcanos-mayores';

function obtenerNombreCompleto(carta: CartaTarot): string {
	const arcano = ARCANOS_MAYORES.find((a: any) => a.id === parseInt(carta.arcano));
	if (!arcano) return carta.arcano;
	return carta.invertida ? `${arcano.nombre} (invertida)` : arcano.nombre;
}

function construirPromptSegunTirada(
	tipoTirada: TipoTirada,
	pregunta: string,
	cartas: CartaTarot[]
): string {
	const cartasTexto = cartas
		.map((c, i) => `${i + 1}. ${obtenerNombreCompleto(c)}`)
		.join('\n');

	let promptEspecifico = '';

	switch (tipoTirada) {
		case 'tres_cartas':
			promptEspecifico = `Esta es una tirada de Tres Cartas:
- Carta 1: Pasado
- Carta 2: Presente
- Carta 3: Futuro

Cartas seleccionadas:
${cartasTexto}`;
			break;

		case 'cruz_celta':
			promptEspecifico = `Esta es una tirada de Cruz Celta (10 cartas):
- Carta 1: Situación presente
- Carta 2: Obstáculo o desafío
- Carta 3: Pasado reciente
- Carta 4: Futuro inmediato
- Carta 5: Objetivo o mejor resultado posible
- Carta 6: Influencia del subconsciente
- Carta 7: Tú mismo/a
- Carta 8: Influencias externas
- Carta 9: Esperanzas y miedos
- Carta 10: Resultado final

Cartas seleccionadas:
${cartasTexto}`;
			break;

		case 'rueda_del_anio':
			promptEspecifico = `Esta es una tirada de Rueda del Año (12 cartas, una por cada mes):
- Carta 1: Enero
- Carta 2: Febrero
- Carta 3: Marzo
- Carta 4: Abril
- Carta 5: Mayo
- Carta 6: Junio
- Carta 7: Julio
- Carta 8: Agosto
- Carta 9: Septiembre
- Carta 10: Octubre
- Carta 11: Noviembre
- Carta 12: Diciembre

Cartas seleccionadas:
${cartasTexto}`;
			break;

		default:
			promptEspecifico = `Cartas seleccionadas:\n${cartasTexto}`;
	}

	return `Eres un tarotista profesional con años de experiencia. Un consultante te ha hecho la siguiente pregunta:

"${pregunta}"

${promptEspecifico}

Por favor, proporciona una lectura de tarot profunda, detallada y significativa. Considera:
1. El significado individual de cada carta en su posición
2. Las relaciones entre las cartas
3. El contexto de la pregunta del consultante
4. Un mensaje final que ofrezca claridad y guía

La lectura debe ser empática, profesional y ofrecer perspectivas útiles para el consultante.`;
}

export const GET: RequestHandler = async ({ params, url }) => {
	const { sesion_id } = params;
	const tokenAcceso = url.searchParams.get('token_acceso');

	if (!sesion_id) {
		throw error(400, 'Falta parámetro: sesion_id');
	}

	const OPENAI_API_KEY = env.OPENAI_API_KEY;

	if (!OPENAI_API_KEY) {
		throw error(500, 'OPENAI_API_KEY no configurado en el servidor');
	}

	// Aquí deberíamos obtener la sesión desde el almacenamiento
	// Por ahora, asumimos que los datos vienen en query params o necesitamos implementar persistencia
	const pregunta = url.searchParams.get('pregunta');
	const cartasRaw = url.searchParams.get('cartas');
	const tipoTirada = url.searchParams.get('tipo_tirada') as TipoTirada;
	const planNombre = url.searchParams.get('plan_nombre');

	if (!pregunta || !cartasRaw || !tipoTirada) {
		throw error(400, 'Faltan parámetros: pregunta, cartas, tipo_tirada');
	}

	let cartas: CartaTarot[];
	try {
		cartas = JSON.parse(cartasRaw);
	} catch {
		throw error(400, 'Formato de cartas inválido');
	}

	// Construir prompt
	const prompt = construirPromptSegunTirada(tipoTirada, pregunta, cartas);

	try {
		// Llamar a OpenAI
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-4o',
				messages: [
					{
						role: 'system',
						content: 'Eres un tarotista profesional y empático con profundo conocimiento del Tarot.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				temperature: 0.8,
				max_tokens: 2000
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('[OpenAI] Error:', errorData);
			throw error(500, `Error al generar lectura: ${errorData.error?.message || 'Error desconocido'}`);
		}

		const data = await response.json();
		const interpretacion = data.choices[0]?.message?.content || 'No se pudo generar la lectura';

		// Construir respuesta
		const lectura: Lectura = {
			id: `lectura-${sesion_id}`,
			sesion_id,
			pregunta,
			cartas,
			ambito_detectado: 'general',
			interpretacion,
			creado_en: new Date().toISOString(),
			expira_en: null,
			plan: {
				nombre: planNombre || 'Lectura de Tarot',
				tipo_tirada: tipoTirada
			}
		};

		return json(lectura);
	} catch (err) {
		console.error('[OpenAI] Error:', err);
		throw error(500, 'Error al comunicarse con OpenAI');
	}
};
