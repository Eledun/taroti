// Test script to verify card name resolution
import { ARCANOS_MAYORES } from './src/lib/data/arcanos-mayores.ts';

function obtenerNombreCompleto(carta) {
	const arcanoId = parseInt(carta.arcano);
	console.log('[DEBUG obtenerNombreCompleto] carta.arcano:', carta.arcano, '| arcanoId:', arcanoId);
	const arcano = ARCANOS_MAYORES.find((a) => a.id === arcanoId);
	console.log('[DEBUG obtenerNombreCompleto] arcano encontrado:', arcano);
	if (!arcano) {
		console.log('[DEBUG obtenerNombreCompleto] NO ENCONTRADO - Retornando:', carta.arcano);
		return carta.arcano;
	}
	return carta.invertida ? `${arcano.nombre} (invertida)` : arcano.nombre;
}

// Test with session 1779820140891-725vhs3o9 cards
const cartas = [
	{ arcano: '18', invertida: false, posicion: 0 },
	{ arcano: '13', invertida: false, posicion: 1 },
	{ arcano: '2', invertida: false, posicion: 2 }
];

console.log('\n========== TESTING CARD NAME RESOLUTION ==========\n');

cartas.forEach((carta, i) => {
	console.log(`\nCarta ${i + 1}:`);
	const nombre = obtenerNombreCompleto(carta);
	console.log('Resultado:', nombre);
	console.log('---');
});

// Test prompt construction
console.log('\n========== TESTING PROMPT CONSTRUCTION ==========\n');
const [carta1, carta2, carta3] = cartas.map(c => obtenerNombreCompleto(c));
console.log(`
Esta es una tirada de Tres Cartas:
- ${carta1}: Pasado
- ${carta2}: Presente
- ${carta3}: Futuro

IMPORTANTE: En tu interpretación, menciona cada carta por su nombre real (${carta1}, ${carta2}, ${carta3}) en lugar de "Carta 1", "Carta 2", "Carta 3".
`);
