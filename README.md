# ZipKart Admin Portal

A production-grade admin portal for the **ZipKart** quick-commerce platform — a Blinkit/Zepto-style dark-store delivery system. Built with React 19 + Vite + Tailwind CSS v4. This frontend is a fully wired UI reference intended to be connected to a real backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| Charts | Recharts v3 |
| Icons | Lucide React |
| Auth State | React Context API |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Demo Login Credentials

The frontend ships with a mock auth layer. Use these to log in:

| Email | Password | Role |
|---|---|---|
| `admin@zipkart.in` | `Admin@123` | Super Admin |
| `ops@zipkart.in` | `Ops@1234` | Ops Manager |

**OTP (for all accounts):** `123456`

> Auth flow: Email + Password → OTP Verify → Dashboard

---

## Project Structure

```
zipkart-web/
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── App.jsx                    # Root router — all routes defined here
│   ├── main.jsx                   # Entry point
│   ├── index.css                  # Global styles
│   │
│   ├── context/
│   │   └── AuthContext.jsx        # Auth state, login/OTP/logout logic
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx # Redirects unauthenticated users to /auth/login
│   │   ├── layout/
│   │   │   ├── Layout.jsx         # Shell: Sidebar + Header + page content area
│   │   │   ├── Sidebar.jsx        # Left nav with all 14 module links
│   │   │   ├── Header.jsx         # Top bar with page title and user info
│   │   │   └── AuthLayout.jsx     # Centered card layout for auth pages
│   │   └── ui/
│   │       ├── Badge.jsx          # Status badges (color-coded)
│   │       ├── Card.jsx           # Reusable content card
│   │       ├── Modal.jsx          # Accessible overlay modal
│   │       ├── PageHeader.jsx     # Page title + action button slot
│   │       ├── StatCard.jsx       # KPI metric card with trend indicator
│   │       └── Table.jsx          # Sortable data table with pagination
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx          # Email + password form
│   │   │   ├── OTPVerify.jsx      # 6-digit OTP entry
│   │   │   ├── ForgotPassword.jsx # Email input for reset link
│   │   │   └── ResetPassword.jsx  # New password + confirm form
│   │   │
│   │   ├── Dashboard.jsx          # Platform KPI overview + live charts
│   │   ├── Orders.jsx             # Order list, status, SLA tracking
│   │   ├── Inventory.jsx          # Stock levels, low-stock alerts, batches
│   │   ├── Users.jsx              # Customer management, fraud flags, wallet
│   │   ├── DarkStores.jsx         # Store management, capacity, SLA config
│   │   ├── Partners.jsx           # Delivery partner management, KYC, earnings
│   │   ├── Catalog.jsx            # Products, variants, categories, approvals
│   │   ├── Payments.jsx           # Transactions, refunds, settlements, COD
│   │   ├── Coupons.jsx            # Coupon creation, usage logs, budget
│   │   ├── FlashSales.jsx         # Flash sale scheduling and product config
│   │   ├── Notifications.jsx      # Campaign builder, templates, delivery logs
│   │   ├── Analytics.jsx          # GMV charts, funnel, store-level metrics
│   │   ├── AuditLogs.jsx          # Immutable admin action log viewer
│   │   └── AppConfig.jsx          # Remote config, feature flags, A/B tests
│   │
│   ├── data/
│   │   └── mockData.js            # All mock data powering the UI (replace with API calls)
│   │
│   └── documents/                 # DB schema reference JSONs (see below)
│
├── index.html
├── vite.config.js
├── eslint.config.js
└── package.json
```

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/auth/login` | Login | Email + password authentication |
| `/auth/verify-otp` | OTP Verify | Two-factor OTP verification |
| `/auth/forgot-password` | Forgot Password | Trigger password reset email |
| `/auth/reset-password` | Reset Password | Set new password via token |
| `/` | Dashboard | Live KPIs, charts, recent orders, partner status |
| `/orders` | Orders | Order list with status filters, SLA breach flags, cancellation |
| `/inventory` | Inventory | SKU-level stock, batch management, purchase orders, damage log |
| `/users` | Users | Customer profiles, tier, wallet, fraud score, support history |
| `/stores` | Dark Stores | Store capacity, SLA config, documents, equipment, bank details |
| `/partners` | Partners | Delivery partner profiles, KYC, vehicle, earnings, performance |
| `/catalog` | Catalog | Product/category management, approval workflow, pricing history |
| `/payments` | Payments | Payment transactions, refunds, partner payouts, settlements |
| `/coupons` | Coupons | Coupon rules, usage analytics, budget tracking |
| `/flash-sales` | Flash Sales | Sale scheduling, product allocation, pre-registration |
| `/notifications` | Notifications | Campaign management, templates, A/B testing, delivery logs |
| `/analytics` | Analytics | GMV trends, conversion funnel, store metrics, category breakdown |
| `/audit-logs` | Audit Logs | Immutable log of all admin actions with diff viewer |
| `/app-config` | App Config | Remote config values, feature flags, maintenance windows, force-update rules |

---

## Authentication Flow

```
Login Page  →  (email + password validated)
    ↓
OTP Verify  →  (6-digit OTP: 123456 in demo)
    ↓
Session saved to sessionStorage
    ↓
Protected Dashboard
```

- `ProtectedRoute` wraps all admin routes — unauthenticated requests redirect to `/auth/login`
- Session persists for the browser tab (sessionStorage); cleared on logout
- In production: replace `AuthContext.jsx` mock logic with real API calls and JWT handling

---

## Database Schema Reference (`src/documents/`)

29 production-ready JSON schema documents covering every entity in the system. Each file contains `_schema_meta` with primary table, PKs, composite indexes, all enum values, FK constraints, and business rules — ready to use as the authoritative reference for database design.

### Core Transactional

| File | Tables Covered |
|---|---|
| `OrdersManagementView.json` | `orders`, `order_items`, `order_status_history`, `order_invoices`, `order_cancellations`, `order_returns` |
| `UserProfile.json` | `users`, `user_addresses`, `user_payment_methods`, `user_devices`, `user_wallet_transactions`, `user_referrals` |
| `Partner(Delivery)Management.json` | `delivery_partners`, `partner_kyc_documents`, `partner_vehicles`, `partner_bank_accounts`, `partner_earnings`, `partner_performance_snapshots`, `delivery_assignments`, `partner_penalties`, `partner_incentives` |
| `Payment&SettlementManagement.json` | `payment_transactions`, `refunds`, `wallet_transactions`, `partner_payouts`, `settlements`, `payment_dispute_cases`, `cod_collection_logs` |
| `CartAndWishlist.json` | `carts`, `cart_items`, `wishlists`, `wishlist_items`, `saved_for_later` |
| `DeliveryTracking.json` | `order_tracking_events`, `partner_location_history`, `delivery_otp_verifications`, `delivery_photo_proofs`, `delivery_attempts` |
| `ReturnsAndComplaints.json` | `return_requests`, `return_items`, `return_pickup_assignments`, `complaint_types`, `complaint_logs` |

### Catalog & Inventory

| File | Tables Covered |
|---|---|
| `CatalogManagement.json` | `categories`, `products`, `product_variants`, `product_media`, `product_attributes`, `product_tags`, `product_pricing_history`, `brands`, `catalog_approval_requests` |
| `InventoryManagement.json` | `inventory`, `inventory_batches`, `inventory_locations`, `stock_movements`, `purchase_orders`, `purchase_order_items`, `inventory_damage_log` |
| `SuppliersAndProcurement.json` | `suppliers`, `supplier_contacts`, `supplier_products`, `supplier_pricing_agreements`, `supplier_contracts` |
| `RatingsAndReviews.json` | `product_reviews`, `delivery_partner_reviews`, `review_media`, `review_helpfulness_votes`, `review_moderation_logs` |

### Store Operations

| File | Tables Covered |
|---|---|
| `DarkStoreManagement.json` | `dark_stores`, `store_pincodes`, `store_documents`, `store_sla_config`, `store_equipment`, `store_bank_accounts` |
| `DeliveryZonesAndServiceability.json` | `delivery_zones`, `zone_dark_store_assignments`, `pincode_serviceability`, `geofences`, `delivery_zone_restrictions` |
| `StoreStaffManagement.json` | `store_staff`, `staff_shifts`, `staff_attendance`, `staff_tasks`, `staff_performance_snapshots` |

### Promotions & Growth

| File | Tables Covered |
|---|---|
| `CouponManagement.json` | `coupons`, `coupon_rules`, `coupon_usage_logs`, `coupon_budget_logs` |
| `FlashSalesManagement.json` | `flash_sales`, `flash_sale_products`, `flash_sale_user_purchases`, `flash_sale_notifications` |
| `PromotionsAndBanners.json` | `promotions`, `banners`, `homepage_sections`, `promotional_slots`, `sponsored_products` |
| `NotificationManagement.json` | `notification_campaigns`, `notification_templates`, `notification_delivery_logs`, `notification_opt_outs` |
| `LoyaltyAndSubscriptions.json` | `loyalty_tier_configs`, `loyalty_points_ledger`, `subscription_plans`, `user_subscriptions` |

### Platform & Config

| File | Tables Covered |
|---|---|
| `AdminUserProfile.json` | `admin_users`, `admin_sessions`, `admin_login_history`, `admin_password_history`, `admin_mfa_backup_codes` |
| `RoleDefinitions.json` | `roles`, `role_permissions` (7 roles × full permission matrix) |
| `OTPAndAuthSessions.json` | `otp_requests`, `otp_rate_limits`, `user_sessions`, `refresh_tokens`, `token_blacklist` |
| `AppConfigAndFeatureFlags.json` | `app_configs`, `feature_flags`, `app_config_audit_log`, `maintenance_windows`, `force_update_configs`, `ab_test_experiments` |
| `Audit Log (All Admin Actions).json` | `audit_logs` (immutable, append-only) |

### Discovery & Analytics

| File | Tables Covered |
|---|---|
| `SearchAndDiscovery.json` | `search_query_logs`, `search_click_logs`, `autocomplete_suggestions`, `trending_searches`, `zero_result_searches`, `product_collections` |
| `AnalyticsEvents.json` | `user_events`, `funnel_events`, `daily_store_metrics`, `hourly_metrics_snapshots`, `product_impression_logs` |
| `SupportAndHelpCenter.json` | `support_tickets`, `ticket_messages`, `support_categories`, `faq_articles`, `ticket_escalations`, `csat_surveys` |
| `PricingRulesAndSurge.json` | `pricing_rules`, `delivery_fee_configs`, `surge_configs`, `surge_events`, `dynamic_pricing_logs` |
| `User Management (Customer View for Admin).json` | Admin-enriched read view of `users` with fraud flags, support summary, admin notes |

---

## Key Design Decisions (Schema)

### Security
- OTP stored as **bcrypt hash only** — plaintext never persisted
- Refresh tokens stored as **SHA-256 hash** in DB
- JWT blacklisting via JTI in `token_blacklist` table
- Aadhaar / PAN stored as **masked display + SHA-256 hash** (no plaintext)
- MFA backup codes stored as bcrypt-hashed objects with `used` + `used_at`
- Payment gateway secrets marked `is_secret: true` in `app_configs`

### Indian Compliance
- GST breakdown per order: `cgst_pct`, `sgst_pct`, `igst_pct` on every line item
- HSN codes on all product variants
- FSSAI license + expiry on stores and food brands
- DLT template IDs + sender IDs on all SMS notification templates (TRAI mandate)
- PF account number + ESI number on store staff
- RBI wallet balance cap: Rs. 10,000 max enforced via `app_configs`

### Performance
- `partner_location_history` — TimescaleDB / InfluxDB recommended (10-second GPS intervals)
- `user_events` — partition by date; ClickHouse / BigQuery recommended for OLAP
- `product_impression_logs` — feeds nightly ML pipeline for search ranking
- `search_query_logs` — Elasticsearch / OpenSearch for full-text with typo tolerance

### Business Logic
- Surge pricing applies **on delivery fee only**, not product prices
- Platinum / VIP / Plus subscribers are **exempt from surge fees**
- Perishables (dairy, fresh produce): **no physical return**; refund on photo evidence only
- Flash sale early access: Gold+ tier gets `early_access_minutes_for_gold_plus` head start
- Coupon budget tracked in `coupon_budget_logs`; auto-deactivates at 0 budget
- Loyalty: 5 tiers (Bronze → Silver → Gold → Platinum → VIP) with per-tier point multipliers and validity windows

---

## Admin Roles

| Role | Access Level |
|---|---|
| Super Admin | Full access to all modules + system config |
| Ops Manager | Orders, inventory, dark stores, partners, analytics |
| Finance Admin | Payments, settlements, refunds, reports |
| Category Manager | Catalog, brands, flash sales, coupons |
| Partner Manager | Delivery partners, KYC, earnings, incentives |
| Store Manager | Single dark store — inventory, staff, capacity |
| Support Agent | Read-only orders + users; can issue refunds |

Role permissions are stored in `role_permissions` with granular per-module booleans (view / create / edit / delete / approve / export).

---

## Connecting to a Real Backend

All data in this UI is currently sourced from `src/data/mockData.js`. To connect to a real backend:

1. **Auth** — replace `AuthContext.jsx` mock functions with API calls to your auth service. Store JWT access token in memory and refresh token in `httpOnly` cookie.
2. **Data fetching** — replace mockData imports in each page with `fetch` / `axios` calls. Each page maps 1:1 to a backend resource (e.g. `Orders.jsx` → `GET /api/v1/admin/orders`).
3. **Schema** — use the JSON documents in `src/documents/` as the authoritative reference for designing your PostgreSQL tables. Every file has `_schema_meta` with PKs, indexes, enums, FK constraints, and business rules.
4. **Search** — `SearchAndDiscovery.json` assumes Elasticsearch / OpenSearch for product search.
5. **Location tracking** — `DeliveryTracking.json` assumes TimescaleDB or InfluxDB for partner GPS history.
6. **Analytics events** — `AnalyticsEvents.json` assumes ClickHouse or BigQuery for OLAP queries on `user_events`.

---

## Scripts

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Serve the dist/ build locally
npm run lint       # Run ESLint
```
