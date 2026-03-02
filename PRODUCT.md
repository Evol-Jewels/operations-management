# EVOL Jewels — Operations MVP
---

## The Problem

A jewellery order touches multiple people — sales staff, vendors, the store owner — across 8 stages before it reaches the customer. Today, none of these actors share a common view of what's happening. Order details travel over WhatsApp and phone calls. Status updates are verbal or forgotten. No one outside the store knows where an order stands unless they call and ask.

The result: delays go unnoticed, customers are left in the dark, and the owner has no reliable picture of what's at risk on any given day.

---

## What We're NOT Building (Yet)

To keep the MVP honest and shippable:

- No user authentication / login — anyone with a link can view and update
- No multi-tenancy / franchise architecture
- No vendor-specific portal — vendors use the same order page link
- No customer-specific login or account
- No automated WhatsApp / email notifications
- No financial reporting or analytics

These are valid future features. They are explicitly out of scope for now.

---

## The Core Model

Every enquiry and order has **one page**. That page has two things on it:

1. **The order details** — all specs, customer info, stage, delivery date
2. **An activity feed** — a chronological log of every update ever posted against this order

This page is shareable via a link. Anyone with the link — sales staff, vendor, store owner, or the customer — sees the same page. Logged-in users do not exist yet; the link *is* the access control for MVP.

This means:
- Sales hands off to a vendor by sharing the link — no WhatsApp needed
- Vendor posts progress updates directly on the page
- Customer is kept in the loop by sharing the same link — no separate tracking page to build
- Owner can bookmark any order and check it directly

One URL. One source of truth. Everyone looks at the same thing.

---

## The 8-Stage Pipeline

Every order moves through these stages in sequence. The system tracks the current stage and timestamps every transition.

```
Enquiry → Estimation → CAD Design* → Order Confirmed → Building → Certification → Shipped to Store → Customer Pickup
```

> *CAD Design is optional — toggled per order, relevant for custom pieces.

Stage changes are posted as activity feed entries, so the full history of how an order moved is always visible.

---

## What We're Building

### 1. Enquiry Form
Filled by sales staff when a customer walks in and shows interest — before any commitment is made.

**Captures:**
- Customer name, phone, email, address
- Product interest — category, metal type, purity, polish/color
- Stone preferences — cut, quality, carat (rough estimate)
- Budget range, occasion, timeline notes
- Salesperson name

On submission, an enquiry record is created and enters the tracker at the **Enquiry** stage. It can later be converted into a confirmed order.

---

### 2. Order Form
Filled by sales staff to formally kick off production. Based on the existing EVOL paper order form.

**Captures everything in the enquiry form, plus:**
- Order number (auto-generated)
- Vendor / manufacturer name
- Precise stone specifications — carat per stone, placement, quality grade
- Metal weight (grams)
- Chain length, ring size, bangle size (category-dependent)
- Type of stone setting
- Certification required — Jewellery / GIA / IGI / SGL / None
- Advance amount paid
- Total estimate
- Delivery date (committed)
- Any special instructions

On submission, the order enters the pipeline at **Order Confirmed** and a shareable order page is generated automatically.

---

### 3. Internal Tracker (Dashboard)
The main operations view. Used daily by sales staff and the store owner.

**What it shows:**
- All enquiries and orders in a single list
- Current stage, assigned salesperson, vendor, days remaining to delivery
- Urgency indicators — overdue (red), due within 7 days (amber), on track (green)
- Pipeline summary — count of items at each stage across the top
- Search by customer name, filter by stage or salesperson

**What you can do from it:**
- Open any order to view its full page and activity feed
- Create a new enquiry or order
- See at a glance what needs attention today

---

### 4. Order Page (The Shared Source of Truth)
Every order and enquiry has a dedicated page accessible via a unique URL. This is the single most important surface in the product.

**Page structure:**

**Top section — Order details**
All specs in one view: customer info, product specifications, stage, delivery date, vendor, salesperson, advance paid, estimate, certification type.

**Stage bar**
Visual pipeline showing all 8 stages. Current stage is highlighted. Past stages are marked complete. Makes progress immediately obvious to anyone who opens the link.

**Activity Feed**
A chronological log of everything that has happened to this order. Each entry shows:
- Who posted it (name field — free text, no login required)
- When it was posted (timestamp)
- What happened — one of three types:
  - **Stage change** — e.g. "Moved to Building"
  - **Note** — free text update, e.g. "Vendor confirmed stone availability, starting work Monday"
  - **File upload** — e.g. CAD design image, certification PDF, photo of completed piece

**Post an Update (bottom of page)**
A simple form anyone with the link can use:
- Name field (who is posting)
- Optional: change the current stage
- Optional: write a note
- Optional: attach a file or photo
- Submit button

This is how vendors report progress. This is how sales adds internal notes. This is how the customer sees what's happening. No separate interfaces, no roles, no login — just one form on one page.

---

## User Flows

**Sales captures a walk-in enquiry:**
Opens the enquiry form → fills customer details and product interest → submits → enquiry appears in the tracker.

**Sales converts enquiry to order:**
Opens the enquiry from the tracker → clicks "Convert to Order" → order form pre-fills with enquiry data → sales adds specs, vendor, price, delivery date → submits → order page is generated with a unique link.

**Sales hands off to vendor:**
Copies the order page link → sends it to the vendor however they currently communicate (WhatsApp is fine) → vendor opens the link, sees full specs, posts updates as work progresses.

**Vendor updates progress:**
Opens the order page link → scrolls to the activity feed → fills in their name, writes a note or changes the stage → submits → update appears in the feed immediately.

**Customer wants to know where their order is:**
Sales shares the order page link with the customer → customer opens it → sees the stage bar and the activity feed → knows exactly what's happening without needing to call.

**Owner checks what's at risk today:**
Opens the dashboard → looks at the urgency indicators → clicks into any delayed order → reads the activity feed to understand why it's delayed and who last updated it.

---

## Data Model (Simplified)

**Enquiry / Order**
- ID, type (enquiry | order), order number
- Customer: name, phone, email, address
- Salesperson name, vendor name
- Product: category, metal, purity, polish, metal weight
- Stones: description, quality, cut
- Size fields: chain length, ring size, bangle size
- Certification type
- Financial: advance, estimate
- Delivery date
- Current stage
- Created at, last updated at
- Shareable page URL (unique token)

**Activity Feed Entry**
- Order ID (parent)
- Posted by (free text name)
- Timestamp
- Type: stage_change | note | file_upload
- Content: note text and/or new stage value
- File: URL, filename, file type (if uploaded)

---

## MVP Success Criteria

The MVP works if, after 2–4 weeks of real use by the test team:

1. Sales staff are using the forms instead of paper for new enquiries and orders
2. At least one vendor is posting updates via the order page link
3. The owner can open the dashboard and know — without asking anyone — which orders are delayed and why
4. At least one customer has been shared an order page link and found it useful
