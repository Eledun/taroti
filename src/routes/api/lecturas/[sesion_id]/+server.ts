import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import type { CartaTarot, Lectura, TipoTirada } from '$lib/types';
import { actualizarLectura, obtenerLectura, registrarAuditLog } from '$lib/db.js';

// Importar datos de arcanos
import { ARCANOS_MAYORES } from '$lib/data/arcanos-mayores';

// DEBUG: Log at module level to verify import
console.log('[MODULE INIT] ARCANOS_MAYORES length:', ARCANOS_MAYORES?.length);
console.log('[MODULE INIT] Arcano 8:', ARCANOS_MAYORES?.find((a: any) => a.id === 8));

function obtenerNombreCompleto(carta: CartaTarot): string {
	const arcanoId = parseInt(carta.arcano);
	console.log('[DEBUG obtenerNombreCompleto] carta.arcano:', carta.arcano, '| arcanoId:', arcanoId);
	const arcano = ARCANOS_MAYORES.find((a: any) => a.id === arcanoId);
	console.log('[DEBUG obtenerNombreCompleto] arcano encontrado:', JSON.stringify(arcano));
	console.log('[DEBUG obtenerNombreCompleto] arcano?.nombre:', arcano?.nombre);
	if (!arcano) {
		console.log('[DEBUG obtenerNombreCompleto] NO ENCONTRADO - Retornando:', carta.arcano);
		return carta.arcano;
	}
	const resultado = carta.invertida ? `${arcano.nombre} (invertida)` : arcano.nombre;
	console.log('[DEBUG obtenerNombreCompleto] Resultado final:', resultado);
	return resultado;
}

function construirPromptSegunTirada(
	tipoTirada: TipoTirada,
	pregunta: string,
	cartas: CartaTarot[]
): string {
	console.log('[DEBUG construirPromptSegunTirada] Iniciando con tipoTirada:', tipoTirada);
	console.log('[DEBUG construirPromptSegunTirada] Cartas recibidas:', JSON.stringify(cartas));

	const cartasTexto = cartas
		.map((c, i) => `${i + 1}. ${obtenerNombreCompleto(c)}`)
		.join('\n');

	let promptEspecifico = '';

	switch (tipoTirada) {
		case 'tres_cartas':
			console.log('[DEBUG] Entrando en case tres_cartas');
			const [carta1, carta2, carta3] = cartas.map(c => obtenerNombreCompleto(c));
			console.log('[DEBUG] Nombres obtenidos:', carta1, carta2, carta3);
			promptEspecifico = `Esta es una tirada de Tres Cartas:
- ${carta1}: Pasado
- ${carta2}: Presente
- ${carta3}: Futuro

IMPORTANTE: En tu interpretación, menciona cada carta por su nombre real (${carta1}, ${carta2}, ${carta3}) en lugar de "Carta 1", "Carta 2", "Carta 3".`;
			break;

		case 'cruz_celta':
			promptEspecifico = `Esta es una tirada de Cruz Celta (10 cartas):
- Carta 1: Situación presente
- Carta 2: Obstáculo o desafío
- Carta 3: Pasado reciente
- Carta 4: Futuro inmediato
- Carta 5: Objetivo o mejor resultado posible
- Carta 6: Influencia del subconsciente
- Carta 7: El consultante (su yo interno)
- Carta 8: Influencias externas
- Carta 9: Esperanzas y miedos
- Carta 10: Resultado final

Cartas seleccionadas:
${cartasTexto}`;
			break;

		case 'rueda_del_anio':
			promptEspecifico = `Esta es una tirada de Rueda del Año (13 cartas: 12 meses + carta central):
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
- Carta 13: El Año (centro - síntesis anual)

Cartas seleccionadas:
${cartasTexto}`;
			break;

		default:
			promptEspecifico = `Cartas seleccionadas:\n${cartasTexto}`;
	}

	return `Un consultante te ha hecho la siguiente pregunta:

"${pregunta}"

${promptEspecifico}

Por favor, proporciona una lectura de tarot profunda, detallada y significativa. Considera:
1. El significado individual de cada carta en su posición
2. Las relaciones entre las cartas
3. El contexto de la pregunta del consultante
4. Un mensaje final que ofrezca claridad y guía

La lectura debe ser empática, profesional y ofrecer perspectivas útiles para el consultante.

IMPORTANTE: Finaliza tu lectura con un mensaje de cierre cálido y personal, firmado como "Mikahela". Por ejemplo: "Cuídate y cuida tu energía, Mikahela." o variaciones similares que muestren tu conexión espiritual con el consultante.`;
}

export const GET: RequestHandler = async ({ params, url }) => {
	const { sesion_id } = params;
	const tokenAcceso = url.searchParams.get('token_acceso');

	if (!sesion_id) {
		throw error(400, 'Falta parámetro: sesion_id');
	}

	try {
		// Paso 1: Obtener lectura de BD con validación de token y expiración
		const lecturaDB = await obtenerLectura(sesion_id, tokenAcceso || undefined);

		if (!lecturaDB) {
			throw error(404, 'Lectura no encontrada, expirada o token inválido');
		}

		// Paso 2: Verificar si ya tiene lectura_ia generada
		if (lecturaDB.lectura_ia && lecturaDB.lectura_ia.trim() !== '') {
			console.log('[LECTURA] Ya existe en BD:', sesion_id, '- Retornando sin regenerar');

			// Registrar acceso a lectura existente
			try {
				await registrarAuditLog('lectura_accedida', sesion_id, {
					metodo: 'GET',
					regenerada: false
				});
			} catch (auditErr) {
				console.error('[AUDIT] Error registrando acceso:', auditErr);
			}

			// Retornar lectura existente
			const lectura: Lectura = {
				id: `lectura-${sesion_id}`,
				sesion_id,
				pregunta: lecturaDB.pregunta,
				cartas: lecturaDB.cartas_seleccionadas,
				ambito_detectado: 'general',
				interpretacion: lecturaDB.lectura_ia,
				creado_en: lecturaDB.fecha_creacion.toISOString(),
				expira_en: lecturaDB.expira_en?.toISOString() || null,
				plan: {
					nombre: lecturaDB.plan_nombre || 'Lectura de Tarot',
					tipo_tirada: lecturaDB.tipo_tirada as TipoTirada
				}
			};

			return json(lectura);
		}

		// Paso 3: No tiene lectura_ia, generar con OpenAI
		const OPENAI_API_KEY = env.OPENAI_API_KEY;

		if (!OPENAI_API_KEY) {
			throw error(500, 'OPENAI_API_KEY no configurado en el servidor');
		}

		const pregunta = lecturaDB.pregunta;
		const cartas: CartaTarot[] = lecturaDB.cartas_seleccionadas;
		const tipoTirada = lecturaDB.tipo_tirada as TipoTirada;

		// Construir prompt
		const prompt = construirPromptSegunTirada(tipoTirada, pregunta, cartas);

		console.log('[LECTURA] Generando con OpenAI:', sesion_id, '| Tipo:', tipoTirada);

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
						content: 'Eres Mikahela, una tarotista profesional y empática con profundo conocimiento del Tarot. Tu estilo es cálido, cercano y sabio. Siempre finalizas tus lecturas con un mensaje de cierre personal como "Cuídate y cuida tu energía, Mikahela." o variaciones similares que reflejen tu calidez y conexión espiritual con el consultante.'
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
		const tokensUsados = data.usage?.total_tokens || 0;

		// GUARDAR EN BD: Actualizar lectura con resultado de OpenAI
		try {
			await actualizarLectura(sesion_id, interpretacion, tokensUsados, 'gpt-4o');
			console.log('[LECTURA] Guardada en BD:', sesion_id, '| Tokens:', tokensUsados);

			// Registrar generación en audit log
			await registrarAuditLog('lectura_generada', sesion_id, {
				modelo: 'gpt-4o',
				tokens: tokensUsados,
				tipo_tirada: tipoTirada
			});
		} catch (dbErr) {
			console.error('[LECTURA] Error guardando en BD:', dbErr);
			// No fallar la request si falla el guardado, pero logear el error
		}

		// Construir respuesta
		const lectura: Lectura = {
			id: `lectura-${sesion_id}`,
			sesion_id,
			pregunta,
			cartas,
			ambito_detectado: 'general',
			interpretacion,
			creado_en: lecturaDB.fecha_creacion.toISOString(),
			expira_en: lecturaDB.expira_en?.toISOString() || null,
			plan: {
				nombre: lecturaDB.plan_nombre || 'Lectura de Tarot',
				tipo_tirada: tipoTirada
			}
		};

		return json(lectura);
	} catch (err) {
		console.error('[API] Error en GET /api/lecturas/[sesion_id]:', err);

		// Si ya es un error de SvelteKit, re-lanzarlo
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Error genérico
		throw error(500, 'Error al procesar lectura');
	}
};
