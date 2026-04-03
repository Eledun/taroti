import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string,
  options: { timeout: 5000 },
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
    const body = {
      items: [
        {
          title: data.titulo,
          description: data.descripcion,
          quantity: 1,
          unit_price: data.monto,
          currency_id: 'CLP',
        },
      ],
      back_urls: {
        success: `${data.backUrl}/success`,
        failure: `${data.backUrl}/failure`,
        pending: `${data.backUrl}/pending`,
      },
      auto_return: 'approved' as const,
      external_reference: data.sesionId,
      notification_url: `${process.env.BACKEND_URL}/pagos/webhook`,
      statement_descriptor: 'TAROTI',
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
    };

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
  // En producción deberías verificar la firma del webhook
  // Para desarrollo, aceptamos todos los webhooks
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // TODO: Implementar verificación de firma en producción
  // https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks#editor_3

  return true;
}
