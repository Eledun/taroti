import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() as string,
  options: {
    timeout: 30000,
  },
});

const preference = new Preference(client);
const payment = new Payment(client);

export interface PreferenceData {
  titulo: string;
  descripcion: string;
  monto: number;
  sesionId: string;
  backUrl: string; 
}

export async function crearPreferencia(data: PreferenceData) {
  try {
    // En desarrollo, Mercado Pago no acepta localhost en back_urls con auto_return
    const isDevelopment = process.env.NODE_ENV !== 'production';

    const body: any = {
      items: [
        {
          id: data.sesionId,
          title: data.titulo,
          description: data.descripcion,
          quantity: 1,
          unit_price: data.monto,
          currency_id: 'CLP',
        },
      ],
      back_urls: {
        success: `${data.backUrl}/pago/exito`,
        failure: `${data.backUrl}/pago/error`,
        pending: `${data.backUrl}/pago/pendiente`,
      },
      external_reference: data.sesionId,
      notification_url: `${process.env.BACKEND_URL}/pagos/webhook`,
      statement_descriptor: 'TAROTI',
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
    };

    // Solo agregar auto_return en producción (Mercado Pago no acepta localhost)
    if (!isDevelopment) {
      body.auto_return = 'approved';
    }

    const response = await preference.create({ body });

    return {
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    };
  } catch (error) {
    console.error('Error creando preferencia de Mercado Pago:', error);
    throw error;
  }
}

export async function obtenerPago(paymentId: string) {
  try {
    const response = await payment.get({ id: paymentId });
    return response;
  } catch (error) {
    console.error('Error obteniendo pago de Mercado Pago:', error);
    throw error;
  }
}

export function verificarWebhookSignature(xSignature: string, xRequestId: string, dataId: string): boolean {
  try {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!secret) {
      console.warn('[WEBHOOK] No se encontró MERCADOPAGO_WEBHOOK_SECRET en .env');
      // En desarrollo, permitir sin verificación
      return process.env.NODE_ENV !== 'production';
    }

    // Separar el x-signature en parts
    const parts = xSignature.split(',');

    let ts: string | null = null;
    let hash: string | null = null;

    // Extraer ts y v1 del header
    for (const part of parts) {
      const [key, value] = part.split('=').map(s => s.trim());
      if (key === 'ts') {
        ts = value;
      } else if (key === 'v1') {
        hash = value;
      }
    }

    if (!ts || !hash) {
      console.warn('[WEBHOOK] No se encontró ts o hash en x-signature');
      return false;
    }

    // Generar el manifest string según la documentación de MP
    // Template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Crear HMAC SHA256
    const crypto = require('crypto');
    const cyphedSignature = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    // Comparar las firmas
    const isValid = cyphedSignature === hash;

    if (!isValid) {
      console.warn('[WEBHOOK] Firma inválida', {
        expected: cyphedSignature,
        received: hash,
        manifest,
      });
    }

    return isValid;
  } catch (error) {
    console.error('[WEBHOOK] Error verificando firma:', error);
    return false;
  }
}
