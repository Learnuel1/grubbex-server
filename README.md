
# GRUBEX BACKEND API SERVER FOR DASHBOARD (USER, DRIVER, BUSINESS AND ADMIN)

This is the backend API Server for the GRUBEX User, Driver, Business and Admins dashboards.

## STACKS

## Main

1. Node
2. ExpressJS
3. MongoDB
4. ZOD

- Package Manager: `yarn`

## GET STARTED

1. Clone the repo and install dependencies using `npm install`
2. Duplicate the `.env.example.show` and rename one of them ot `.env`
3. Update the `.env with the appropriate values.
4. Use `yarn run dev` to run the server locally
5. **Always create a new branch** when working on a new task/feature you want to work on. Then **submit a pull request** when you're done with the task/feature. `<username>_<type>_<login-auth>` eg `learnuel_fix_auth`, `learnuel_feat_user-model` etc.
6. Follow the commit message convention bellow

## API DOCUMENTATION 
https://documenter.getpostman.com/view/20542554/2sA3Bj9u4M
## Commit Message Pattern Convention

You're to follow this convention when creating a commit message

```bash
    type(scope?): message
```

Example

```bash
    feat(model): added account model
    fix: update the account model paths
``` 

### FRONTEND 
https://brubex-frontend.vercel.app/
### Common types

- build
- chore
- ci
- docs
- feat
- fix
- perf
- refactor
- revert
- style
- test


Read more about it here [Commit Lint Doc](https://www.conventionalcommits.org/en/v1.0.0/) and here [Common Types Usage Text](https://commitlint.js.org/#/reference-prompt) to know more.


## FOLDER STRUCTURE
```
grubbex-backend/ 
├── server.js                          # Application bootstrap, Socket.io setup, HTTP listener, DB init
├── secret.loader.js                   # Secret manager loader (AWS Secrets Manager)
├── entities_def.txt                   # High-level entity schema definitions reference
├── package.json                       # Dependencies & npm scripts
└── src/
    ├── app.js                         # Express app configuration, CORS whitelisting, rate limiting
    ├── config/                        # Configuration & constants
    │   ├── env.js                     # Environment variables loader
    │   ├── index.js                   # Application constants, role enums, order statuses
    │   └── db.config.js               # MongoDB connection logic
    │
    ├── middlewares/                   # Core request pipeline middlewares
    │   ├── auth.middleware.js         # JWT verification, web/mobile route checks, role validation
    │   ├── error.middleware.js        # Global error interceptor and response formatting
    │   └── index.js
    │
    ├── logger/                        # Logging configuration (Winston & Winston-MongoDB)
    │   ├── dev.logger.js
    │   ├── production.logger.js
    │   └── index.js
    │
    ├── models/                        # Mongoose schemas & data models (30+ entities)
    │   ├── account.model.js           # Users, admins, riders, store owners
    │   ├── order.models.js            # Core order lifecycle & status tracking
    │   ├── product.model.js           # Store inventory items & pricing
    │   ├── store.model.js             # Merchant store entity & KYC relation
    │   ├── kyc.model.js               # Rider & Store identity & bank verification
    │   ├── wallet.model.js            # User/rider/admin wallet balance
    │   ├── wallet.history.model.js    # Financial transactions & ledger history
    │   ├── payout.model.js            # Store & Rider payout requests
    │   ├── ticket.model.js            # Support desk tickets & messaging
    │   └── ... (see Domain Entities)
    │
    ├── routes/                        # Express API route modules
    │   ├── dual.route.js              # Web vs. Mobile root router (/api/v1 vs /api/v1/m)
    │   ├── index.js                   # Route aggregators (Router & MobileRouter)
    │   ├── auth.route.js              # Authentication, registration, OTP, password recovery
    │   ├── user.route.js              # User profiles, notifications, 2FA, settings
    │   ├── order.route.js             # Order routing split into shopper, rider, store, admin
    │   ├── shopper.order.route.js     # Shopper order creation, checkout, tracking
    │   ├── rider.order.route.js       # Rider order polling, acceptance, pickup, completion
    │   ├── business.order.route.js    # Merchant order processing & status updates
    │   ├── admin.order.route.js       # Admin oversight, order inspection
    │   ├── payment.route.js           # Wallet, checkout, bank verification
    │   ├── transaction.route.js       # Paystack confirmation, verify & history
    │   ├── payout.route.js            # Payout requests & processing
    │   ├── location.route.js          # Courier GPS & geofencing
    │   ├── business.route.js          # Store management & KYC routes
    │   ├── rider.route.js             # Rider specific routes
    │   └── admin.route.js             # Administrative endpoints
    │
    ├── shared/                        # Shared cross-cutting modules & controllers
    │   ├── controller/                # Central business controllers
    │   │   ├── order.controller.js    # Core order lifecycle, QR verification, commissions
    │   │   ├── account.controller.js  # Account profiles, 2FA, password resets
    │   │   ├── auth.controller.js     # Auth, session & token operations
    │   │   ├── payout.controller.js   # Merchant and courier payouts
    │   │   ├── report.controller.js   # Sales trends, platform performance, analytics
    │   │   └── ...
    │   ├── middleware/                # Validation middlewares (Zod integration)
    │   │   └── data_validator.middleware.js # Schema validation & role checks
    │   ├── schema/                    # Zod schemas for payload validation
    │   │   ├── order.schema.js
    │   │   ├── account.schema.js
    │   │   ├── payout.schema.js
    │   │   └── ...
    │   ├── services/                  # Database service layer & 3rd-party clients
    │   │   ├── order.service.js
    │   │   ├── paystack.payment.services.js
    │   │   ├── flutter.payment.services.js
    │   │   ├── google.service.js      # Geocoding & distance matrix calculations
    │   │   └── ...
    │   └── utils/                     # Utility helpers (Notification EventEmitter, QR generation, mailers)
    │
    ├── api/                           # Domain-specific modular sub-packages
    │   ├── admin/                     # Admin account controllers & invitation service
    │   ├── business/                  # Business onboarding & store schemas
    │   └── store/                     # Store category & product catalog management
    │
    ├── utils/                         # Global helpers (Cloudinary upload, Paystack, response builders)
    └── views/                         # Handlebars email & web receipt/policy templates
```
