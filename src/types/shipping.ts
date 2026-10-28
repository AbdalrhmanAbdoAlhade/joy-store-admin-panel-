import { LocalizedString } from './api';

export interface ShippingZone {
  id: number | string;
  name: LocalizedString; // Governorate / Region name e.g. القاهرة الكبرى
  governorates: string[]; // List of included provinces
  delivery_time_days: string; // e.g. "1-2 days"
  base_rate: number;
  weight_step_kg: number;
  additional_weight_rate: number;
  free_shipping_threshold?: number;
  is_active: boolean;
}

export interface ShippingMethod {
  id: number | string;
  name: LocalizedString;
  code: 'standard' | 'express' | 'same_day' | 'branch_pickup';
  description?: LocalizedString;
  cost: number;
  estimated_delivery_hours?: number;
  is_active: boolean;
}

export interface PickupBranch {
  id: number | string;
  name: LocalizedString;
  address: LocalizedString;
  phone: string;
  working_hours: string;
  map_coordinates?: { lat: number; lng: number };
  is_active: boolean;
}

export interface CourierCompany {
  id: number | string;
  name: string;
  code: string; // 'bosta' | 'mylerz' | 'aramex' | 'oto'
  api_integrated: boolean;
  tracking_url_template?: string;
  is_active: boolean;
}
