import { LocalizedString } from './api';

export type BannerPlacement =
  | 'home_hero'
  | 'home_slider'
  | 'home_banner'
  | 'category_top'
  | 'sidebar'
  | 'footer_promo'
  | string;

export interface Banner {
  id: number | string;
  title: LocalizedString | string;
  subtitle?: LocalizedString | string;
  image_url: string;
  mobile_image_url?: string;
  link_url?: string;
  placement: BannerPlacement;
  order: number;
  is_active: boolean;
  start_at?: string;
  end_at?: string;
}

export interface StaticPage {
  id: number | string;
  title: LocalizedString;
  slug: string;
  content: LocalizedString;
  meta_title?: LocalizedString;
  meta_description?: LocalizedString;
  is_published: boolean;
  updated_at: string;
}

export interface FaqItem {
  id: number | string;
  question: LocalizedString;
  answer: LocalizedString;
  category: string;
  order: number;
  is_active: boolean;
}

export interface ContactMessage {
  id: number | string;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  subject: string;
  message: string;
  is_read: boolean;
  replied_at?: string;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: number | string;
  email: string;
  is_active: boolean;
  created_at: string;
}
