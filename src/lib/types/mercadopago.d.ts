// Tipos para Mercado Pago SDK

declare global {
	interface Window {
		MercadoPago: typeof MercadoPago;
	}
}

export class MercadoPago {
	constructor(publicKey: string, options?: { locale?: string });
	checkout(options: {
		preference: {
			id: string;
		};
		render?: {
			container?: string;
			label?: string;
		};
		autoOpen?: boolean;
	}): Promise<void>;
}

export {};
