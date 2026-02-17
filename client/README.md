# Dial A Drink Kenya

Online alcohol delivery platform for Nairobi and major cities in Kenya. Built with Next.js, MongoDB, and Tailwind CSS.

**Live site:** [www.dialadrinkkenya.com](https://www.dialadrinkkenya.com)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB 8.0 + Mongoose 9
- **Styling:** Tailwind CSS 3
- **State:** Zustand
- **Auth:** JWT (jose) + bcryptjs
- **Payments:** PesaPal
- **Images:** Cloudinary
- **Forms:** React Hook Form + Zod
- **Rich Text:** TipTap
- **Process Manager:** PM2

## Project Structure

```
client/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── admin/        # Admin dashboard (CRUD for all entities)
│   │   ├── api/          # API routes (public + admin)
│   │   ├── products/     # Product listing & detail pages
│   │   ├── cart/         # Shopping cart
│   │   ├── checkout/     # Checkout flow
│   │   ├── contact/      # Contact page
│   │   └── ...           # Other pages (FAQ, terms, privacy, etc.)
│   ├── components/       # Reusable UI components
│   ├── models/           # Mongoose models
│   ├── lib/              # DB connection, utilities
│   ├── store/            # Zustand stores (cart, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── public/               # Static assets
├── scripts/              # Database maintenance scripts
└── docs/                 # SEO audits & optimization guides
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 8.0

### Setup

```bash
cd client
cp .env.example .env.local   # Configure environment variables
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for auth tokens |
| `NEXT_PUBLIC_SITE_URL` | Public site URL |
| `CLOUDINARY_*` | Cloudinary credentials |
| `PESAPAL_*` | PesaPal payment credentials |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (contact form) |
| `SMTP_*` | Email configuration |

## Admin Dashboard

Access at `/admin` (requires login). Manages:

- **Products** — catalog with pricing options, images, categories
- **Orders** — order management and status tracking
- **Categories / Subcategories / Brands** — product taxonomy
- **Pages** — CMS pages with SEO fields (title, meta, H1)
- **Locations** — delivery areas and charges
- **Menu Items** — site navigation structure
- **Promos** — discount codes and promotions
- **Users** — admin user management

## Build & Deploy

```bash
# Build
cd client
npx next build --webpack

# Deploy to server
tar czf build.tar.gz --exclude='.next/cache' --exclude='.next/dev' \
  .next package.json package-lock.json ecosystem.config.js \
  public next.config.mjs start.sh

scp build.tar.gz wwwdiala@server:/home/wwwdiala/apps/diala-dev/client/
ssh wwwdiala@server "cd /home/wwwdiala/apps/diala-dev/client && \
  tar xzf build.tar.gz && npm install --production && pm2 restart diala-nextjs"
```

## API

API documentation available at `/admin/api-docs` (Swagger UI).

## License

Proprietary. All rights reserved.
