# 5 Animaciones GSAP para Cartas - Hover en Página Lecturas

## Opción 1: "Floating Glow" (Flotación con Resplandor)
**Descripción:** La carta flota suavemente hacia arriba mientras aparece un resplandor místico alrededor.
**Efecto:** Sutil, elegante, da sensación de magia
**Duración:** 0.4s
**Código:**
```javascript
// Hover enter
gsap.to(card, {
  y: -8,
  scale: 1.05,
  boxShadow: '0 12px 40px rgba(139, 92, 246, 0.6), 0 0 30px rgba(168, 85, 247, 0.4)',
  duration: 0.4,
  ease: 'power2.out'
});

// Hover leave
gsap.to(card, {
  y: 0,
  scale: 1,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  duration: 0.3,
  ease: 'power2.inOut'
});
```

---

## Opción 2: "Mystic Tilt" (Inclinación Mística)
**Descripción:** La carta se inclina suavemente en 3D con efecto de perspectiva y brillo sutil.
**Efecto:** Sofisticado, da profundidad, muy elegante
**Duración:** 0.5s
**Código:**
```javascript
// Hover enter
gsap.to(card, {
  rotationY: 5,
  rotationX: -3,
  scale: 1.08,
  z: 50,
  boxShadow: '0 16px 48px rgba(139, 92, 246, 0.5)',
  duration: 0.5,
  ease: 'power3.out',
  transformPerspective: 1000
});

// Hover leave
gsap.to(card, {
  rotationY: 0,
  rotationX: 0,
  scale: 1,
  z: 0,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  duration: 0.4,
  ease: 'power2.inOut'
});
```

---

## Opción 3: "Shimmer Pulse" (Pulso Brillante)
**Descripción:** Un pulso sutil de luz atraviesa la carta mientras se agranda ligeramente.
**Efecto:** Discreto, llamativo, sensación de energía
**Duración:** 0.6s
**Código:**
```javascript
// Hover enter - Timeline con múltiples efectos
const tl = gsap.timeline();

tl.to(card, {
  scale: 1.06,
  duration: 0.3,
  ease: 'back.out(1.2)'
})
.to(card, {
  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.6), 0 0 40px rgba(139, 92, 246, 0.4)',
  duration: 0.2
}, '-=0.1')
.to(card.querySelector('::before'), {
  opacity: 1,
  backgroundPosition: '200% center',
  duration: 0.6,
  ease: 'none'
}, 0);

// Hover leave
gsap.to(card, {
  scale: 1,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  duration: 0.3,
  ease: 'power2.inOut'
});
```

---

## Opción 4: "Gentle Rotate" (Rotación Suave)
**Descripción:** La carta rota muy sutilmente (3-5 grados) mientras se eleva.
**Efecto:** Delicado, natural, efecto de "carta levantándose de la mesa"
**Duración:** 0.45s
**Código:**
```javascript
// Hover enter
gsap.to(card, {
  rotation: 3,
  y: -10,
  scale: 1.04,
  boxShadow: '0 10px 35px rgba(139, 92, 246, 0.5)',
  duration: 0.45,
  ease: 'power2.out'
});

// Hover leave
gsap.to(card, {
  rotation: 0,
  y: 0,
  scale: 1,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  duration: 0.35,
  ease: 'power2.inOut'
});
```

---

## Opción 5: "Ethereal Bloom" (Florecimiento Etéreo)
**Descripción:** La carta crece desde el centro con un efecto de "bloom" mientras partículas brillantes aparecen.
**Efecto:** Mágico, etéreo, muy visual pero sutil
**Duración:** 0.5s
**Código:**
```javascript
// Hover enter - Timeline compleja
const tl = gsap.timeline();

tl.to(card, {
  scale: 1.07,
  duration: 0.3,
  ease: 'elastic.out(1, 0.5)'
})
.to(card, {
  boxShadow: '0 0 50px rgba(139, 92, 246, 0.7), 0 12px 40px rgba(168, 85, 247, 0.4)',
  filter: 'brightness(1.1)',
  duration: 0.2
}, '-=0.1');

// Agregar pequeñas partículas brillantes (requiere elementos adicionales)
gsap.fromTo('.carta-sparkle', {
  scale: 0,
  opacity: 0
}, {
  scale: 1,
  opacity: 0.8,
  duration: 0.3,
  stagger: 0.05,
  ease: 'back.out(2)'
});

// Hover leave
gsap.to(card, {
  scale: 1,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  filter: 'brightness(1)',
  duration: 0.3,
  ease: 'power2.inOut'
});
```

---

## Recomendaciones

### Más Elegante y Discreta:
- **Opción 1: Floating Glow** - Simple y efectiva
- **Opción 4: Gentle Rotate** - Natural y sofisticada

### Con Mayor Impacto Visual:
- **Opción 2: Mystic Tilt** - 3D elegante
- **Opción 5: Ethereal Bloom** - Más mágica

### Balance Perfecto:
- **Opción 3: Shimmer Pulse** - Buen equilibrio entre sutil y visible

---

## Implementación

Para implementar cualquiera de estas opciones, agregar al componente `+page.svelte`:

```javascript
import { onMount } from 'svelte';
import { browser } from '$app/environment';

onMount(() => {
  if (!browser || typeof gsap === 'undefined') return;

  const cards = document.querySelectorAll('.carta-visual');

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      // CÓDIGO DE LA ANIMACIÓN ELEGIDA
    });

    card.addEventListener('mouseleave', () => {
      // CÓDIGO DE HOVER LEAVE
    });
  });
});
```

**Nota:** GSAP ya está cargado en `app.html` línea 18.
