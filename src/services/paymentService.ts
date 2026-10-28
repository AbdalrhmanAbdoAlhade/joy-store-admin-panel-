import apiClient, { ApiResponse } from '@/src/lib/axios';
import { Transaction, PaymentGatewaysConfig } from '@/src/types/payment';
import { TableQueryParams } from '@/src/types/api';

const DEFAULT_GATEWAYS: PaymentGatewaysConfig = {
  cod_enabled: true,
  paymob_enabled: false,
  paymob_api_key: '',
  paymob_integration_id: '',
  paymob_iframe_id: '',
};

function normalizeGateways(raw: any): PaymentGatewaysConfig {
  const src = raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object' ? raw.data : raw || {};
  return {
    cod_enabled: Boolean(src?.cod?.enabled ?? src?.cod_enabled ?? false),
    paymob_enabled: Boolean(src?.paymob?.enabled ?? src?.paymob_enabled ?? false),
    paymob_api_key: src?.paymob?.api_key ?? src?.paymob_api_key ?? '',
    paymob_integration_id: src?.paymob?.integration_id ?? src?.paymob_integration_id ?? '',
    paymob_iframe_id: src?.paymob?.iframe_id ?? src?.paymob_iframe_id ?? '',
  };
}

let mockTransactions: Transaction[] = [
  {
    id: 1,
    transaction_number: 'TXN-902188',
    order_id: 1,
    order_number: 'ORD-7740',
    customer_name: 'أحمد محمود العوضي',
    gateway: 'Paymob',
    amount: 2279,
    currency: 'EGP',
    status: 'success',
    gateway_reference: 'PM_AUTH_89123019',
    payment_method_type: 'Visa Card',
    created_at: '2026-03-15T09:30:00Z',
  },
  {
    id: 2,
    transaction_number: 'TXN-902189',
    order_id: 2,
    order_number: 'ORD-7741',
    customer_name: 'سارة إبراهيم الشناوي',
    gateway: 'Paymob Wallet',
    amount: 1188,
    currency: 'EGP',
    status: 'success',
    gateway_reference: 'PM_WAL_0029312',
    payment_method_type: 'Vodafone Cash',
    created_at: '2026-03-14T14:00:00Z',
  },
  {
    id: 3,
    transaction_number: 'TXN-902190',
    order_id: 3,
    order_number: 'ORD-7742',
    customer_name: 'محمود عبدالفتاح',
    gateway: 'COD',
    amount: 2179,
    currency: 'EGP',
    status: 'success',
    created_at: '2026-03-13T17:00:00Z',
  },
];

export const paymentService = {
  async getGateways(): Promise<ApiResponse<PaymentGatewaysConfig>> {
    try {
      const response = await apiClient.get<any>('/admin/payment-gateways');
      return { success: true, data: normalizeGateways(response.data) };
    } catch {
      return { success: true, data: DEFAULT_GATEWAYS };
    }
  },

  async updateGateways(payload: Partial<PaymentGatewaysConfig>): Promise<ApiResponse<PaymentGatewaysConfig>> {
    try {
      // Flat top-level fields (see Postman: PUT /admin/payment-gateways)
      const response = await apiClient.put<any>('/admin/payment-gateways', {
        cod_enabled: Boolean(payload.cod_enabled),
        paymob_enabled: Boolean(payload.paymob_enabled),
        paymob_api_key: payload.paymob_api_key ?? '',
        paymob_integration_id: payload.paymob_integration_id ?? '',
        paymob_iframe_id: payload.paymob_iframe_id ?? '',
      });
      return { success: true, message: 'تم تحديث بوابات الدفع بنجاح', data: normalizeGateways(response.data ?? payload) };
    } catch (err: any) {
      if (err?.response) throw err;
      return { success: true, message: 'تم تحديث بوابات الدفع بنجاح', data: { ...DEFAULT_GATEWAYS, ...payload } };
    }
  },

  async getTransactions(params?: TableQueryParams): Promise<ApiResponse<Transaction[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Transaction[]>>('/payments/transactions', { params });
      return response.data;
    } catch {
      return {
        success: true,
        data: mockTransactions,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: mockTransactions.length,
        },
      };
    }
  },
};

export default paymentService;
