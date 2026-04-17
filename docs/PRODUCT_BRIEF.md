# BarberPro Product Brief

## Vision

BarberPro is the operating system for Malaysian barber shops — a complete SaaS platform that helps shop owners run their business efficiently, their staff earn fairly, and their customers experience modern convenience.

---

## Problem Statement

Malaysian barber shops (estimated 15,000–20,000 active shops) largely operate without digital tooling:

- **Owners** track revenue on paper or in Excel, have no visibility into staff performance, and lose customers to shops that offer online booking
- **Barbers/staff** have no transparent record of their commissions and rely on manual tallies that are often disputed
- **Customers** have to physically queue, have no way to check wait times, and must call to book appointments

No well-designed, affordable, Malaysia-first tool exists to solve all three sides of this problem in one platform.

---

## Target Users

### Primary: Barber Shop Owners (Tenants)
- 1–5 location independent shops: Starter plan
- Growing chains (2–10 branches): Professional plan
- Franchise operators (10+ branches): Enterprise plan
- Technically comfortable (use WhatsApp, Instagram), not developers
- Price-sensitive — RM pricing, local payment preferred
- Language: BM, English, Mandarin

### Secondary: Barbers / Staff
- Use the platform as directed by their owner
- Care about commission transparency and fair payroll
- Primary device: Mobile (on their feet all day)
- Want simple, fast tools — not complex UIs

### Tertiary: Customers (End Users)
- Walk-in and repeat customers at partner barber shops
- Want to know the wait time before they travel
- Want to book in advance for popular barbers
- Engage with loyalty/rewards programs

---

## Value Proposition

### For Shop Owners
> "Replace your notebook, WhatsApp group, and Excel file with one system — and know your business numbers at a glance."

- Real-time queue with seat assignment — no more shouting names
- Staff commission auto-calculated from actual sales data
- POS integrated with queue — every service recorded, no leakage
- Multi-branch visibility on one dashboard
- Subscription tiers that grow with the business

### For Barbers/Staff
> "Know exactly what you've earned, every day."

- Commission statements with transaction-level breakdown
- Digital attendance clock-in/out
- Mobile app to view their schedule and queue

### For Customers
> "Find a barber, join the queue from home, and show up just in time."

- Browse nearby shops, check live queue status
- Book an appointment in 3 taps
- Earn loyalty points, redeem rewards
- Push notification when it's almost their turn

---

## Product Surfaces

| Surface | Audience | Domain / Platform |
|---|---|---|
| Barber Shop Management Portal | Owners + Staff | `shop.barberpro.my` (web) |
| Customer Portal | End customers | `barberpro.my` (web) |
| Super-Admin Console | BarberPro team | `admin-go.barberpro.my` (web) |
| Customer Mobile App | End customers | iOS + Android |
| Staff Mobile App | Barbers + Staff | iOS + Android |
| Queue Board | In-shop lobby display | `/queue-board` (PWA on TV/tablet) |
| Self-check-in Kiosk | Walk-in customers | `/check-in/[token]` (tablet kiosk) |

---

## Subscription Plans (Barber Shop)

| Plan | Branches | Staff Accounts | Price (est.) | Key Features |
|---|---|---|---|---|
| **Starter** | 1 | Up to 5 | RM 69/month | Queue, POS, basic reports |
| **Professional** | Up to 5 | Up to 20 | RM 179/month | All Starter + multi-branch, advanced reports, online booking |
| **Enterprise** | Unlimited | Unlimited | Custom | All Professional + white-label, API access, dedicated support |

---

## Core Feature Modules (Shop Portal)

### Queue Management
- Walk-in customer joins queue via QR code at shop entrance
- Staff assigns customer to available seat/barber
- Queue board (TV display) shows live queue with ticket numbers
- Ticket status: `waiting → serving → done → paid`
- Supports party check-in (multiple people, one ticket)
- Per-branch queue (resets daily)

### Point of Sale (POS)
- Linked to queue ticket — payment processed after service
- Service line items, product line items
- Discount, promo code support
- Multiple payment methods: cash, card, e-wallet, QR
- Receipt generation (digital + print)
- Revenue attributed to the serving barber

### Appointments
- Calendar-based booking
- Online booking via customer portal
- Barber assignment
- Status: `pending → confirmed → in_progress → completed → cancelled`
- Source tracking: `online`, `walk_in`, `phone`

### Staff & Commissions
- Staff profiles with roles: `owner`, `manager`, `barber`, `cashier`
- Commission schemes: percentage of service revenue, per-service flat rate, per-customer flat rate, base salary + target bonuses
- Commission auto-calculated from transactions
- Attendance: clock-in/out with notes
- Payroll periods with approval workflow

### Customer CRM
- Customer profiles: name, phone, email, DOB, notes
- Visit history linked to transactions
- Loyalty points earned per transaction
- Preferred barber tracking

### Inventory
- Product and supply tracking
- Stock movements (received, sold, wasted)
- Reorder level alerts
- Supplier management
- Products sold through POS (retail)

### Reports
- Daily/weekly/monthly revenue
- Service breakdown
- Staff performance and commission summary
- Customer retention (new vs returning)
- Inventory valuation

### Branch Management (Professional+)
- Multiple branch locations
- Per-branch settings, operating hours, seats
- Staff assigned to branches
- Branch switcher in dashboard UI
- Aggregate vs per-branch reporting

---

## Competitive Positioning

| Feature | BarberPro | Generic POS | Fresha/Booksy |
|---|---|---|---|
| Malaysia-first (BM/RM) | Yes | Partial | No |
| Real-time queue board | Yes | No | No |
| Walk-in QR check-in | Yes | No | No |
| Commission auto-calc | Yes | Rarely | No |
| Multi-branch | Yes | Some | Yes |
| Affordable local pricing | Yes | Varies | Expensive |
| Customer mobile app | Planned | No | Yes |

---

## Non-Goals (What BarberPro Is Not)

- Not a generic appointment booking platform (we are barber-shop-specific)
- Not a payroll tax/accounting system (we produce payroll data; accountants use their own tools)
- Not a communication platform (WhatsApp integration is a future add-on, not core)
- Not a marketplace of freelance barbers (we serve shops, not individuals)
