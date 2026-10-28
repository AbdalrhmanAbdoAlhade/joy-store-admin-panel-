# 🧸 Toy Store eCommerce - Admin Control Panel

A production-grade, enterprise **React 19 + Vite 8 + TypeScript 7** Admin Control Panel tailored exclusively for managing a multi-category Kids' Toy Store eCommerce ecosystem with strict role authorization (`role === 'admin'`).

---

## 🚀 Key Highlights & Architectural Overview

1. **Strict Admin Access Only (`role === 'admin'`)**:
   - Automatic immediate logout and 403 Forbidden redirect if a non-admin account attempts login.
   - `AdminRoute` protecting all sensitive administration modules with wildcard permission fallback.

2. **Comprehensive Toy Catalog & Technical Safety Data**:
   - Bilingual support for all inputs (Arabic default RTL + English LTR).
   - Toy-specific fields: Age range limits, target gender, piece counts, material specifications (BPA-free plastic, wood, hypoallergenic cotton), battery details, CE/EN71 certifications, and choking hazard alerts.
   - Color / Model Variant management with independent SKUs, stocks, and pricing.
   - Drag & drop image uploader (`react-dropzone`) with primary thumbnail selection and ordering.

3. **Complete Order & Fulfillment Life-Cycle**:
   - Filterable data table (by governorate, fulfillment status, payment method, date).
   - Order timeline with past transitions and actor records.
   - Courier tracking integration (Bosta, Mylerz, Aramex).
   - Full & partial financial refunds directly updating inventory.
   - Manual telephone order creation.

4. **Multi-Channel Sales, Shipping & Inventory**:
   - Stock movement ledger (receipts, issues, adjustments, damage).
   - Low stock warnings and automated reorder suggestions.
   - Regional Egyptian governorates and zones shipping pricing.
   - Payment gateways integration (Paymob Visa/Mastercard/Meeza, Fawry, valU installments, COD).
   - Coupons, Flash Sales, and Loyalty points policies.

5. **Customer Support, CMS & RBAC**:
   - Support tickets inbox with conversation chat.
   - Product reviews & parent Q&A moderation.
   - Sliders/banners, static policies, and FAQs management.
   - Employee management with fine-grained granular permissions matrix (`SYSTEM_PERMISSIONS`).

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 8 + TypeScript
- **Styling**: **Tailwind CSS v4** (no `tailwind.config.js`; theme + `@custom-variant dark` live in `src/index.css`)
- **State Management**: TanStack Query (React Query) + Zustand
- **Data Tables**: TanStack Table (server-side pagination, sorting, column visibility, and multi-selection)
- **Forms & Validation**: React Hook Form + Zod
- **Charts & KPIs**: Recharts (Area charts, Pie charts, KPI stat cards)
- **Internationalization**: i18next (Arabic default RTL + English LTR, synchronized with `document.dir` & `document.lang`)
- **API Client**: Axios instance with Bearer token, Accept-Language, and status interceptors (401, 403, 422, 429, 500)
- **Icons & Notifications**: Lucide React + Sonner

---

## 🔑 Demo Access Credentials

The panel is seeded with the following accounts:

- **Admin (Authorized)**: `admin@toys-store.com` / `password` (Full permissions)
- **Regular User (Unauthorized)**: `customer@example.com` / `password` (Demonstrates immediate block & rejection)

---

## 🌐 Environment Variables

Copy `.env.example` to `.env` and set the backend URL:

```bash
# Backend API URL
VITE_API_URL=https://toy.backend.rouqy-jewellery.com/api/v1

# Local development
# VITE_API_URL=http://localhost:8000/api/v1
```

All endpoints are expected to adhere to the `{ success, message, data, meta, errors }` envelope.

### Getting Started

```bash
npm install --legacy-peer-deps
npm run dev      # http://localhost:3000
npm run lint     # tsc --noEmit
npm run build
```

> `--legacy-peer-deps` is still required: `@hookform/resolvers@6` declares an optional peer of `effect@^4`, while its optional `@typeschema/effect` chain requires `effect@^3` — npm cannot satisfy both. (`esbuild` was bumped to `^0.28` to match `vite@8`'s peer, which removed the original esbuild conflict.)

---

## ⚠️ Known Backend Quirks

- `GET /admin/products/{id}` historically returned `500`; product details are fetched from `/staff/products/{id}` instead (some payloads differ: `categories`/`variants` may be arrays **or** objects, and images may be relative paths — normalized client-side).
- `/staff/returns` is intermittently `500` (backend fix via trait).
- `GET /notifications` → `404` (UI skeleton only; backend endpoint still in development).
- `GET /activity-logs` → `404` (UI skeleton only; backend endpoint still in development).
- `PUT /admin/roles/{id}/permissions` rejects an empty `[]` (`422`); there is no clear-permissions route.
- Settings `PUT /admin/settings` requires `multipart/form-data` with bracketed keys (`settings[i][...]`), not JSON as the API docs suggest.
- `POST /tickets/{id}/reply` automatically sets the ticket status to `waiting_customer`.
- The **Employee role currently has the same permissions as Admin** — needs a security review.

---

## 🏗️ Architecture Notes

- **Tailwind v4**: no `tailwind.config.js`; design tokens and the class-based dark variant (`@custom-variant dark (&:where(.dark, .dark *));`) are declared in `src/index.css`. Theme state is persisted by `src/stores/themeStore.ts`.
- **ErrorBoundary** is mounted at the `App` level, with route-level `Suspense` + `PageLoader` for lazy-loaded pages.
- **Auth**: Laravel Sanctum Bearer token stored in `authStore`; a `401` interceptor clears the session and redirects to `/login`.
- **`/staff/*` endpoints** are used for several admin read-only actions (e.g. product details, reviews, tickets) because their admin counterparts are less reliable.
- **Notifications / Activity Log** pages are wired to real service stubs that intentionally contain **no mock data**; they render an empty state until the backend endpoints exist.

---

## 📊 Phase Progress

- ✅ **Phase 1**: Auth & Security
- ✅ **Phase 2**: ErrorBoundary + Suspense + Auth check + 404
- ✅ **Phase 3**: Service adapters + Form-data mutations
- ✅ **Phase 4**: Roles, Reviews, Tickets, CMS, Dark Mode, Profile
- 🔄 **Phase 5**: Polish (i18n, mobile, cleanup)
