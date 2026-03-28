Below is a **final product description / system contract** you can drop into your repo (README or `/docs/ARCHITECTURE.md`) that is specifically written for **code agents and future you** to safely extend your system as you add modules.

It is grounded in how Hackathon Starter is structured (Express + MVC + auth + API integrations) ([npm][1]), but re-framed into a **modular business operating system**.

---

# 🍩 Product Definition: Donut Shop Operating System (DSOS)

## 1. Purpose

This application is a **modular business operating system** for a small food business.

It extends Hackathon Starter from a generic Node.js starter into:

> A **centralized service hub** that manages operations, sales, production, and internal tools.

The system must support:

- Public-facing features (ordering)
- Internal tools (POS, recipes, admin)
- Future modular expansion without refactoring core systems

---

# 2. Core Architectural Principle

## “Shell + Modules” Model

The system is divided into:

### A. Core Shell (DO NOT BREAK)

Handles:

- Authentication (local + OAuth)
- Session management
- Security (CSRF, validation)
- App-level middleware
- Global layout/navigation
- Shared database connection

### B. Feature Modules (PLUG-IN SYSTEM)

All business functionality must exist as **independent modules**.

Each module:

- Owns its routes
- Owns its models
- Owns its UI
- Does NOT directly depend on other modules

---

# 3. Module Contract (STRICT)

Every module MUST follow this structure:

```
/modules/<module-name>/
  <module>.routes.js
  <module>.controller.js
  <module>.service.js
  <module>.model.js
  <module>.views/ (or frontend/)
```

### Responsibilities

| Layer      | Responsibility          |
| ---------- | ----------------------- |
| routes     | Define endpoints only   |
| controller | Handle request/response |
| service    | Business logic          |
| model      | Database schema         |
| views      | UI                      |

---

## Registration Pattern (REQUIRED)

All modules must be mounted in a single location:

```js
// config/modules.js

module.exports = [require('../modules/pos/pos.routes'), require('../modules/recipes/recipes.routes'), require('../modules/orders/orders.routes')];
```

```js
// app.js

const modules = require('./config/modules');

modules.forEach((moduleRoute) => {
  app.use(moduleRoute.basePath, moduleRoute.router);
});
```

---

## Module Interface Contract

Each module MUST export:

```js
module.exports = {
  basePath: '/pos',
  router,
};
```

---

# 4. Data Ownership Rules (VERY IMPORTANT)

## Rule 1 — Modules own their data

- POS owns POS sessions
- Recipes own recipes
- Orders own orders

## Rule 2 — Shared entities must be abstracted

If multiple modules need the same data:
→ create a **shared service**, NOT cross-imports

```
/shared/
  order.service.js
  product.service.js
```

---

## Rule 3 — No direct module-to-module calls

❌ BAD:

```js
require('../orders/orders.service');
```

✅ GOOD:

```js
require('../../shared/order.service');
```

---

# 5. Routing Philosophy

| Route Type | Auth     | Purpose                  |
| ---------- | -------- | ------------------------ |
| `/`        | optional | App launcher (dashboard) |
| `/order`   | public   | Customer ordering        |
| `/pos`     | required | In-person sales          |
| `/recipes` | required | Internal production      |
| `/admin`   | required | Management               |

---

# 6. UI System

## App Launcher (Home Page)

The default homepage becomes:

```
[ POS ]
[ Orders ]
[ Recipes ]
[ Inventory ]
[ Admin ]
```

This is NOT a marketing page.

---

## UI Rules

- Each module owns its UI
- Shared layout comes from `/views/layout.pug`
- Avoid global JS unless necessary

---

# 7. Auth & Roles

Extend built-in auth system to include:

```js
role: 'admin' | 'staff';
```

### Access rules:

- Public routes → no auth
- POS → staff+
- Recipes → staff+
- Admin → admin only

---

# 8. Event-Driven Extensions (Future-Proofing)

Modules SHOULD communicate via events when needed:

```js
eventBus.emit('order.created', order);
```

Consumers:

- Inventory module updates stock
- Reporting module logs revenue

This prevents tight coupling.

---

# 9. Core Modules (Initial System)

## Required

### 1. Orders

- Central data model
- Used by POS + online ordering

### 2. POS

- Fast UI
- Creates orders (source: "pos")

### 3. Recipes

- Ingredient + yield tracking

---

## Optional (Later)

- Inventory (derived from recipes)
- Reporting
- Scheduling

---

# 10. Stripe + Payments

- Guest checkout REQUIRED
- No auth dependency
- Orders must be created BEFORE payment
- Stripe stores only payment state

---

# 11. Development Rules for Code Agents

## When adding a new module:

1. Create `/modules/<name>/`
2. Follow module contract exactly
3. Register in `/config/modules.js`
4. Do NOT modify:
   - auth system
   - core middleware
   - global app structure

---

## When modifying existing features:

- Prefer editing **service layer only**
- Avoid touching routes unless necessary
- Never mix concerns across modules

---

## When adding shared logic:

- Place in `/shared/`
- Keep stateless where possible

---

# 12. Anti-Patterns (DO NOT DO)

- ❌ Monolithic “utils.js” dumping ground
- ❌ Cross-module imports
- ❌ Business logic inside routes
- ❌ Tightly coupling UI and backend logic
- ❌ Requiring authentication for public ordering

---

# 13. System Philosophy

This system is designed to evolve into:

> A **vertical SaaS-like internal toolset** for a food business

Key principles:

- Modularity over speed (after MVP)
- Separation of concerns
- Replaceability of modules
- Guest-first customer experience

---

# 14. Mental Model

Think of the system as:

```
Hackathon Starter = Operating System Kernel
Modules = Applications
```

---

# 15. Final Constraint

If a feature cannot be added as a module:

> The architecture is being violated.

---

## If you want next step

I can:

- Generate the **actual folder + file scaffold**
- Or design your **POS module UI + state flow** (this is the hardest part to get right)

[1]: https://www.npmjs.com/package/hackathon-starter?utm_source=chatgpt.com 'hackathon-starter - npm'
