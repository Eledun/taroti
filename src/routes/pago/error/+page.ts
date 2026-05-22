import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
  // Mercado Pago envía external_reference automáticamente en las back_urls
  // Documentación: https://www.mercadopago.com/developers/es/docs/checkout-pro/checkout-customization/user-interface/redirection
  const sesionId = url.searchParams.get('external_reference');
  const collectionId = url.searchParams.get('collection_id');
  const collectionStatus = url.searchParams.get('collection_status');
  const paymentId = url.searchParams.get('payment_id');
  const status = url.searchParams.get('status');
  const preferenceId = url.searchParams.get('preference_id');
  const merchantOrderId = url.searchParams.get('merchant_order_id');
  const paymentType = url.searchParams.get('payment_type');

  return {
    sesionId,
    collectionId,
    collectionStatus,
    paymentId,
    status,
    preferenceId,
    merchantOrderId,
    paymentType,
  };
};
