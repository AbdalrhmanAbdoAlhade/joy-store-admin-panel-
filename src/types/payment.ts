export type PaymentGatewayCode = 'cod' | 'paymob' | 'fawry' | 'valu' | 'kashier' | 'stripe';

export interface PaymentGateway {
  id: number | string;
  code: PaymentGatewayCode;
  name: string;
  description: string;
  logo?: string;
  is_enabled: boolean;
  is_sandbox: boolean;
  fee_percentage: number;
  fixed_fee: number;
  supported_currencies: string[];
}

/**
 * Flat payment-gateways payload used by `PUT /admin/payment-gateways`.
 * The GET endpoint nests these per provider; the service normalizes to this shape.
 */
export interface PaymentGatewaysConfig {
  cod_enabled: boolean;
  paymob_enabled: boolean;
  paymob_api_key: string;
  paymob_integration_id: string;
  paymob_iframe_id: string;
}

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Transaction {
  id: number | string;
  transaction_number: string;
  order_id: number | string;
  order_number: string;
  customer_name: string;
  gateway: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  gateway_reference?: string;
  payment_method_type?: string; // card, mobile_wallet, installment
  failure_reason?: string;
  created_at: string;
}
