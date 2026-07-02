# RentalOS — The Vision

**The operating system for rental businesses across Africa.**

This document is the product's north star. It was written before designing screens, on purpose.
Every screen, feature, and word in the product must trace back to something in this document.
If it doesn't, it gets deleted.

---

## 1. How a rental business actually works

The reference business: a car-hire company in Nairobi. 5–50 vehicles. The owner started with
two cars and a WhatsApp number. Some vehicles are owned outright; several are financed — each
financed car must earn its loan payment every month or it's bleeding. Staff: the owner, maybe a
manager, one or two booking agents/receptionists, a part-time accountant, a trusted mechanic
(often external), and drivers for chauffeured jobs.

The business does not run on software today. It runs on **WhatsApp, a paper diary or Excel
sheet, M-Pesa messages, and the owner's memory.**

### A day in the life

**07:00 — The phone.** The owner wakes up to WhatsApp: three enquiries from overnight, one
customer asking to extend, one M-Pesa payment screenshot. Before coffee, they're already doing
three jobs: sales, operations, and accounting.

**08:00 — Opening.** At the office/yard, the questions are always the same:

- _Which cars go out today?_ Are they washed, fueled, and ready? Where are the keys?
- _Which cars come back today?_ Call ahead to confirm return times.
- _Who hasn't returned?_ Yesterday's 6 p.m. return isn't back. Call. No answer. Check the
  GPS tracker app. Worry.
- _What money comes in today?_ Balances due on pickups, a deposit refund on a return.

**09:00–18:00 — The floor.** The receptionist's whole day is one loop, repeated 20–40 times:

1. **Enquiry** (phone/WhatsApp/walk-in): _"Do you have a Prado for the weekend? How much?"_
   The answer requires knowing availability across a mental calendar and current pricing —
   the single most frequent operation in the entire business. Speed of answer wins or loses
   the customer; they've messaged three other companies simultaneously.
2. **Quote** — usually typed manually into WhatsApp. No record kept.
3. **Reservation** — a name and phone number in the diary, hopefully on the right date row.
   Double bookings happen exactly here.
4. **Checkout (handover)** — the risk moment. Copy the ID (front/back), driving licence, KRA
   PIN. Sometimes a guarantor. Walk around the car photographing existing scratches, note fuel
   level and odometer, check spare tyre and jack, sign a paper contract, confirm the M-Pesa
   deposit + rental fee landed. Hand over keys.
5. **During the rental** — extensions ("add two days, I'll send money"), breakdowns, police
   stops, boundary worries (is the car being driven to another country?), accidents (rare,
   catastrophic when unrecorded).
6. **Return (check-in)** — the dispute moment. Inspect against the checkout photos. Fuel lower
   than at pickup? Late by four hours? New scratch? Every deduction from the deposit is an
   argument unless there's photographic evidence with timestamps.
7. **Settle** — refund the deposit balance via M-Pesa, or collect the shortfall. Clean the car.
   Back to available.

**18:30 — Closing.** Reconciliation by memory: money expected vs. M-Pesa statement vs. the
diary. Tomorrow's pickups — is each car ready? Anything at the mechanic that was promised back?

**Monthly — the owner's questions nobody can answer:**

- Which car actually makes money after fuel, repairs, insurance, tracker subscription, parking?
- Which cars sat idle for 20 days? (An idle financed car is a hole in the pocket.)
- Did every rental's money arrive, in full? (Revenue leakage — including staff renting cars
  off-book — is real and mostly invisible.)
- When does each car's insurance / NTSA inspection expire? (Finding out from a police fine
  is the norm.)
- Which customers are gold, and which one should never get a car again? (The blacklist lives
  in the owner's head and dies with staff turnover.)

### The pain points, ranked by blood pressure

1. **Double bookings** — diary collisions destroy trust and cost the weekend's revenue.
2. **Late returns & silent extensions** — chronic; unbilled hours are pure loss.
3. **Deposit disputes** — no photo evidence → arguments → bad reviews.
4. **Revenue leakage** — cash/M-Pesa not matched to rentals; off-book rentals.
5. **Document expiry surprises** — insurance, inspection; fines and grounded cars.
6. **No per-vehicle profitability** — decisions (sell it? buy another?) made blind.
7. **Everything lives in one person's head** — the business can't scale past the owner's memory.
8. **Slow quotes** — the customer books with whoever answers "available, KES 6,500/day" first.

### What the business actually is

Strip everything away and a rental company is **a calendar that makes money**:

> Assets × Days = Inventory. Every asset-day is either sold (rented), being prepared
> (cleaning/service), or wasted (idle). The entire product exists to sell more asset-days at
> the right price to people who will bring the asset back.

Three flows sit on top of that calendar: **a booking flow** (sell the days), **a custody flow**
(hand the asset over and get it back, with evidence), and **a money flow** (get paid, hold
deposits, track cost). Everything else is decoration.

---

## 2. Ideal workflows by role

**Owner** — opens the app once in the morning and once at night. Morning: a _briefing_ that
reads like a trusted manager's summary — what's happening today, what's wrong, what needs a
decision. Night: money reconciled, tomorrow prepared. Monthly: per-car profit, utilisation,
and one-tap answers to "should I sell the Axio?" Never touches settings. Never sees jargon.

**Manager** — lives in Today and the Calendar. Approves discounts, resolves conflicts
(two bookings want the same car — the app should offer the swap), handles problems (breakdown
mid-rental → substitute vehicle flow), watches overdue returns.

**Receptionist / booking agent** — needs exactly three superpowers, each faster than paper:

1. **Answer availability + price in under 10 seconds** while holding a phone call.
2. **Create a booking in under 60 seconds** — car, dates, customer (snap the ID to create),
   price auto-computed, deposit recorded.
3. **Run a checkout/return without forgetting a step** — the app is the checklist.
   Productive within 15 minutes of first login, because every screen says what to do next.

**Accountant** — every shilling attached to a rental. Payments in (M-Pesa ref, cash, bank),
deposits held vs. refunded, balances outstanding with one-tap reminders, expenses per vehicle,
export for the taxman. Reconciliation is a checklist, not archaeology.

**Mechanic** — a work queue, not a system: "these cars are due for service (by km or date),
this car has a reported issue, mark it unavailable, mark it done." Marking a car unavailable
instantly blocks it on the booking calendar — that's the whole integration.

**Driver** (chauffeured rentals) — today's assignments: who, where, when, contact button.

**Customer** — receives professional artifacts from a business that runs on RentalOS: a quote
link, a booking confirmation, a digital contract, photo-documented handover, a receipt, a
deposit refund notification. (A self-service booking portal is a later chapter; the artifacts
come first because they make the _business_ look premium.)

---

## 3. Information architecture

Organised around **business activities, never database tables.**

```
TODAY          The command centre. Briefing, pickups, returns, overdue,
               money due today, alerts, what to do next.

CALENDAR       The heart. Fleet × days availability grid. Tap a gap to
               book it. Drag to extend. See conflicts before they happen.
               (This replaces the paper diary — it must beat paper.)

RENTALS        The lifecycle. Enquiry → Quote → Reserved → Out → Due →
               Returned → Settled. Active rentals front and centre;
               overdue screaming; history searchable.

FLEET          Cars as earning assets. Ready/out/dirty/in-service states,
               readiness for tomorrow, documents & expiry, service due,
               per-vehicle earnings. (Not "Assets". Not "Vehicles CRUD".)

MONEY          In, held, owed, out. Payments (M-Pesa/cash/bank), deposits
               ledger, outstanding balances + reminders, expenses,
               per-car profit & loss.

CUSTOMERS      People + trust. History, documents, notes, VIP / watch /
               blacklist standing. "Should I rent to this person?"
               answered in one glance.

TEAM           Staff, roles, and accountability (who created/approved/
               handed over what).

INSIGHTS       The owner's monthly questions, answered: utilisation,
               revenue, idle assets, best/worst performers.

SETTINGS       Invisible until needed. Smart defaults everywhere.
```

The rental lifecycle is the product's core state machine:

```
ENQUIRY → QUOTE → RESERVED → CHECKED-OUT → DUE-BACK → RETURNED → SETTLED
                     │                        │
                     └── no-show / cancel     └── overdue → escalate
```

Every screen is a view into this machine. Every notification is a state change in it.

---

## 4. User journeys (the ones that must be perfect)

**J1 — The 10-second quote.** Call comes in. Receptionist types/taps: dates + car class →
sees available cars with prices → taps "Send quote" → WhatsApp message with a beautiful quote
goes out. The enquiry is now recorded and followable. _Metric: enquiry → quote < 10s._

**J2 — The 60-second booking.** From a quote or fresh: pick car on the calendar → attach
customer (search, or camera-scan the ID to create) → dates → price auto (rate × days, editable)
→ record deposit (M-Pesa ref) → Reserved. Contract auto-generated. _Metric: < 60s._

**J3 — The bulletproof handover (mobile-first).** Checkout mode: guided walk-around photos
(corners, existing damage), odometer, fuel gauge, accessories checklist, customer signs on
screen, payment confirmed → keys out. Every step evidence-stamped. _Metric: zero-dispute
returns._

**J4 — The honest return.** Check-in mode: side-by-side with checkout photos, new damage
photographed, late hours and fuel delta auto-priced, deposit settlement computed → refund or
collect → car flows to "needs cleaning" → back to available. _Metric: settlement < 3 min,
no arguments._

**J5 — The 3-tap extension.** Customer calls to extend → open active rental → new return date →
price delta shown → confirm; calendar conflicts flagged instantly with substitution offers.

**J6 — The morning briefing (owner).** Open app → one screen: "3 pickups (all cars ready),
2 returns, 1 OVERDUE (Njoroge, 14h late — call), KES 43,000 expected today, Prado insurance
expires in 6 days." Decisions, not statistics. _Metric: full situational awareness < 30s._

**J7 — The magical first five minutes (onboarding).** Business name → (country/currency
auto-detected) → "How many vehicles do you have?" → add the first 2–3 fast (photo, plate,
daily rate — nothing else required) → land on Today with a guided first booking. No
"organization", no "tenant", no configuration. _Metric: signup → first booking < 5 min._

---

## 5. Navigation philosophy

- **The dock holds activities, not nouns:** Today · Calendar · Rentals · Fleet · Money — plus
  the ＋ (new booking is the default create) and ⌘K. Customers, Team, Insights, Settings live
  one layer back (⌘K, Today links, and the profile menu) until daily use earns them a slot.
- **Frequency earns proximity.** What's touched 40×/day (availability, bookings) is zero
  clicks away. What's touched monthly (reports, settings) is discoverable, not visible.
- **The app opens on Today, always.** Nobody opens rental software to browse; they open it
  to act.
- **Every entity is reachable from every context.** Tap a car anywhere → its life. Tap a
  customer anywhere → their trust profile. Navigation is lateral, not hierarchical.
- **⌘K is the power user's whole app.** Everything nameable is jumpable and creatable.

---

## 6. Screen hierarchy

```
Level 0  TODAY (home)               — briefing, action queue, day timeline
Level 1  Calendar                   — fleet × days grid, tap-to-book
         Rentals                    — active / upcoming / overdue / history
         Fleet                      — status board → vehicle profile
         Money                      — inflows / deposits / owed / expenses / P&L
Level 2  Vehicle profile            — earnings, custody history, docs, service
         Customer profile           — standing, history, documents
         Rental detail              — the lifecycle record: money + evidence + timeline
         New booking (sheet)        — J2, launchable from anywhere (＋ / calendar / ⌘K)
         Checkout / Return modes    — full-screen guided flows (mobile-first)
Level 3  Team · Insights · Settings — profile menu / ⌘K
```

Modal sheets over page navigations wherever the user must not lose context (booking while on
a call, extending while looking at the calendar).

---

## 7. Product philosophy

1. **The calendar is the business.** Everything serves selling asset-days.
2. **Answer questions, don't display data.** Every screen answers a business question the
   owner actually asks. A number without a decision attached is deleted.
3. **The software disappears.** The owner should feel the app _understands rental_, the way
   a great employee does. Language is the business's language: "car", "booking", "deposit",
   "money in" — never "asset", "record", "entity", "transaction".
4. **Evidence is a feature.** Photos, timestamps, signatures, payment references — the app
   is the business's institutional memory and its protection in disputes.
5. **Trust is the currency.** Both directions: help the business look premium to customers
   (quotes, contracts, receipts), and help it judge customers (history, standing).
6. **Built for Africa, not adapted to it.** WhatsApp is the sales channel. M-Pesa is the bank.
   Phones are the computers. Connectivity blips. English today; Swahili tomorrow. These are
   design inputs, not localisation afterthoughts.
7. **Rentable-anything future.** "Vehicle" is the first skin of "asset". Nothing in the IA
   assumes cars — a generator rents on the same calendar with the same lifecycle. (The
   database already models `asset_kind`; the product language stays concrete per vertical.)
8. **Calm, premium, alive.** The existing OS design language (dark canvas, glass, physical
   motion) is the correct skin for this soul. Beauty builds trust; trust closes sales.

---

## 8. Feature prioritisation

Judged by: saves time / makes money / prevents mistakes / reduces stress. Everything else: cut.

**Phase A — The Calendar & the Rental lifecycle** _(the product becomes a business tool)_
Availability calendar (fleet × days) · booking creation (J2) · rental lifecycle states ·
pricing (rate × days, manual override) · deposits recorded · extension (J5) · overdue flagging
· Today rebuilt around real pickups/returns/overdue. This single phase kills pain points
1, 2, and 8.

**Phase B — Money** _(the owner trusts the numbers)_
Payments against rentals (M-Pesa ref/cash/bank) · deposit ledger (held/refunded/deducted) ·
outstanding balances + reminder nudges · expenses per vehicle · simple per-car P&L. Kills 4
and half of 6.

**Phase C — Custody & evidence** _(disputes die)_
Mobile checkout/return modes (J3, J4) · walk-around photos · fuel/odometer capture · digital
contract + signature · deposit settlement math. Kills 3.

**Phase D — The guardian** _(nothing expires, nothing is forgotten)_
Document expiry tracking + advance alerts (insurance, inspection) · service-due by km/date ·
mechanic queue · vehicle readiness board. Kills 5, 7.

**Phase E — Intelligence** _(the app becomes the smartest employee)_
Insights (utilisation, idle days, best/worst cars) · morning briefing generation · the
assistant ("which cars are idle this week?") · customer standing scores.

**Deliberately later:** customer self-service portal, GPS-tracker integrations, multi-branch,
Swahili, motorbikes/equipment verticals, automated M-Pesa reconciliation (API), WhatsApp
business API automation.

**Cut until proven needed:** anything a rental owner wouldn't recognise as their work.

---

## 9. UX principles

1. **The 15-minute receptionist.** Any screen a receptionist touches must be learnable by
   demonstration in one sitting. If it needs a manual, it's wrong.
2. **Speed is respect.** The customer is on the phone _now_. Availability in ≤10s; booking in
   ≤60s. Perceived speed (optimistic UI, instant search) counts double.
3. **One question per screen.** Each surface answers one business question and offers its
   next action. No screen is a dumping ground.
4. **The app is the checklist.** High-stakes flows (handover, return, settlement) are guided
   steps with nothing forgettable.
5. **Undo over confirm.** Never interrogate ("Are you sure?"); act instantly and offer undo.
   Confidence comes from reversibility.
6. **Evidence by default.** Photos, refs and timestamps are captured inside the flow, never
   as separate chores.
7. **Money is always exact.** Tabular figures, `KES 6,500`, every amount traceable to a
   rental and a person. Rounding errors are trust errors.
8. **Honest emptiness.** Empty states teach and invite the next action. No fake data, no
   vanity placeholders — a module that isn't live says what it will do and when.
9. **Phone-first, ultrawide-worthy.** The receptionist works on a phone at the yard; the
   owner reviews on a laptop at night. Both are first-class.
10. **Calm motion, premium feel.** The existing OS motion system (springs, glass, breathing
    dock) applies everywhere; motion communicates state, never decorates noise.
11. **Plain words, warm tone.** Reads like a trusted colleague: "Njoroge is 14 hours late —
    call him?" not "1 overdue asset detected."
12. **Accessible always.** Keyboard-complete, AA contrast, reduced-motion respected.

---

## 10. From vision to build (the bridge)

What exists today is not wasted — it's the foundation layer misdressed as the product:
multi-tenant auth, RBAC, fleet records, customer KYC, staff management, and the OS shell
(dock, ⌘K, glass, motion) are exactly the plumbing and skin this vision needs. What's missing
is the **soul: the calendar and the rental lifecycle.**

The build order therefore is:

1. **Phase A (Calendar + Rentals + Today-rebuilt)** — the transformation moment. The dock
   becomes: **Today · Calendar · Rentals · Fleet · Money**. "Vehicles" becomes Fleet;
   "Customers" moves one layer back; the ＋ defaults to "New booking".
2. Phases B → E in order, each gated on approval, each shipped in the OS design language.

One rule binds all of it: **no screen ships unless a rental company owner would recognise it
as their own work, made effortless.**
