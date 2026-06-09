<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Pago Pendiente - Taroti</title>
</svelte:head>

<div class="container">
  <div class="pending-card">
    <!-- Icono de pendiente -->
    <div class="pending-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    </div>

    <h1>Pago Pendiente</h1>

    <p class="mensaje">
      Tu pago está siendo procesado. Recibirás una notificación cuando se complete.
    </p>

    <div class="info-importante">
      <h2>¿Qué significa esto?</h2>
      <p>
        Tu pago está en proceso de verificación. Esto puede deberse a diferentes métodos de pago
        que requieren confirmación adicional (transferencia bancaria, pago en efectivo, etc.).
      </p>
    </div>

    {#if data.paymentId}
      <div class="info-pago">
        <p class="info-label">ID de Pago:</p>
        <p class="info-value">{data.paymentId}</p>
        <p class="info-descripcion">Guarda este número para consultar el estado de tu pago</p>
      </div>
    {/if}

    <div class="proximos-pasos">
      <h2>Próximos pasos:</h2>
      <ol>
        <li>Te enviaremos un email cuando tu pago sea confirmado</li>
        <li>Una vez confirmado, tu lectura será procesada automáticamente</li>
        <li>Podrás acceder a tu lectura desde tu historial</li>
      </ol>
    </div>

    <div class="acciones">
      <a href="/historial" class="btn-primary">
        Ver mi historial
      </a>

      <a href="/" class="btn-secondary">
        Volver al inicio
      </a>
    </div>
  </div>
</div>

<style>
  .container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  }

  .pending-card {
    background: white;
    border-radius: 1rem;
    padding: 3rem 2rem;
    max-width: 500px;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .pending-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 2rem;
    background: #f59e0b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 0.5s ease-out;
  }

  .pending-icon svg {
    width: 50px;
    height: 50px;
    color: white;
  }


  h1 {
    color: #1f2937;
    font-size: 2rem;
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .mensaje {
    color: #6b7280;
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
  }

  .info-importante {
    background: #fffbeb;
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
    text-align: left;
    border-left: 4px solid #f59e0b;
  }

  .info-importante h2 {
    color: #92400e;
    font-size: 1rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .info-importante p {
    color: #78350f;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .info-pago {
    background: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .info-label {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .info-value {
    color: #1f2937;
    font-weight: 600;
    font-family: monospace;
    margin-bottom: 0.5rem;
  }

  .info-descripcion {
    color: #9ca3af;
    font-size: 0.75rem;
  }

  .proximos-pasos {
    background: #eff6ff;
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
    text-align: left;
  }

  .proximos-pasos h2 {
    color: #1e40af;
    font-size: 1rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .proximos-pasos ol {
    padding-left: 1.5rem;
    margin: 0;
  }

  .proximos-pasos li {
    color: #1e3a8a;
    padding: 0.5rem 0;
    line-height: 1.5;
  }

  .acciones {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.875rem 2rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
  }

  .btn-secondary {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
    padding: 0.875rem 2rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }

  .btn-secondary:hover {
    background: #667eea;
    color: white;
  }

  @media (max-width: 640px) {
    .pending-card {
      padding: 2rem 1.5rem;
    }

    h1 {
      font-size: 1.5rem;
    }

    .mensaje {
      font-size: 1rem;
    }
  }
</style>
