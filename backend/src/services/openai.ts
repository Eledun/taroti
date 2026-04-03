import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CartaTarot {
  nombre: string;
  arcano: string;
  orientacion: 'derecha' | 'invertida';
  posicion?: string;
}

export interface LecturaGenerada {
  ambito_detectado: string;
  interpretacion: string;
}

export async function generarLectura(
  pregunta: string,
  cartas: CartaTarot[],
  tipoTirada: string
): Promise<LecturaGenerada> {
  const cartasFormateadas = cartas
    .map(
      (c, i) =>
        `${i + 1}. ${c.nombre} (${c.arcano}) - ${c.orientacion}${c.posicion ? ` - Posición: ${c.posicion}` : ''}`
    )
    .join('\n');

  const prompt = `Eres un tarotista experto con décadas de experiencia. Te han consultado con la siguiente pregunta:

"${pregunta}"

Se realizó una tirada de ${tipoTirada} con las siguientes cartas:

${cartasFormateadas}

IMPORTANTE:
1. Detecta el ámbito de la pregunta (amor, trabajo, salud, espiritual, personal, financiero, etc.)
2. Proporciona una interpretación profunda y personalizada de la tirada
3. Considera la posición de cada carta en la tirada
4. Ten en cuenta si las cartas están derechas o invertidas
5. Conecta las cartas entre sí para dar una lectura coherente
6. Sé empático, directo y profesional
7. Proporciona insights accionables
8. Responde en español de Chile

Responde ÚNICAMENTE en formato JSON con esta estructura:
{
  "ambito_detectado": "ámbito principal de la consulta",
  "interpretacion": "interpretación completa en formato markdown, con títulos, negritas y separación clara"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Eres un experto tarotista. Respondes siempre en formato JSON válido con los campos ambito_detectado e interpretacion.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const respuesta = completion.choices[0].message.content;

    if (!respuesta) {
      throw new Error('OpenAI no devolvió una respuesta');
    }

    const lecturaGenerada = JSON.parse(respuesta) as LecturaGenerada;

    return lecturaGenerada;
  } catch (error) {
    console.error('Error generando lectura con OpenAI:', error);
    throw error;
  }
}
