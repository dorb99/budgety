# Budgety - Shared Expense Tracker

A super-simple, shared expense tracker for **two users** built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Features

- **Authentication**: Simple 6-digit code login for Owner and Partner
- **Add Transactions**: Create transactions with categories, amounts, and notes
- **Budget Management**: Set default recurring budgets and monthly overrides
- **Expense Summary**: View spending by category, payer, and date ranges
- **CSV Export**: Export filtered transaction data
- **Mobile-First**: Responsive design that works on all devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma
- **Authentication**: Iron Session with HTTP-only cookies
- **Deployment**: Vercel

## Quick Start

### 1. Database Setup (Neon)

1. Create a new project at [Neon Console](https://console.neon.tech/)
2. Get your **pooled** connection string (ends with `?sslmode=require`)
3. Copy the connection string for the next step

### 2. Environment Configuration

Create a `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB?sslmode=require"
AUTH_CODE="123456"
OWNER_NAME="Dor"
PARTNER_NAME="Partner"
SESSION_SECRET="super-long-random-string-at-least-32-characters"
```

**Important**: 
- Use the **pooled** connection string from Neon (not the direct connection)
- Generate a strong `SESSION_SECRET` (32+ characters)
- Change `AUTH_CODE` to your desired 6-digit code

### 3. Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed the database with users
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` and login with:
- User: Owner or Partner
- Code: Your 6-digit `AUTH_CODE`

## Deployment (Vercel)

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 2. Configure Environment Variables

In your Vercel dashboard, add these environment variables:

```
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB?sslmode=require
AUTH_CODE=123456
OWNER_NAME=Dor
PARTNER_NAME=Partner
SESSION_SECRET=super-long-random-string-at-least-32-characters
```

### 3. Run Database Migration

After deployment, run the database migration:

```bash
# In Vercel dashboard, go to Functions tab and create a new function
# Or run locally with production DATABASE_URL
npm run db:push
npm run db:seed
```

## Database Schema

The app uses a simple schema with 4 main tables:

- **users**: Owner and Partner accounts
- **categories**: Expense categories with optional default budgets
- **transactions**: Individual expense records
- **budget_overrides**: Monthly budget overrides per category

## API Endpoints

- `POST /api/auth/login` - Login with 6-digit code
- `POST /api/auth/logout` - Logout
- `GET /api/me` - Get current user info
- `GET/POST /api/categories` - Manage categories
- `GET/POST /api/transactions` - Manage transactions
- `DELETE /api/transactions/[id]` - Delete transaction
- `GET/PUT /api/budgets` - Manage budgets
- `GET /api/summary` - Get expense summary with filters

## Budget Logic

**Effective Budget Rule**: For any month and category:
1. If a monthly override exists → use override amount
2. Else if category has default budget → use default amount  
3. Else budget = 0

## Permissions

- Both users can add/edit their own transactions
- Both users can add categories and edit budgets
- Owner can delete Partner's transactions
- Partner can only delete their own transactions

## Timezone

All dates are handled in **Asia/Jerusalem** timezone. Monthly periods use calendar months in local time.

## Testing Checklist

- [ ] Login works with correct 6-digit code
- [ ] Can add transaction with new category
- [ ] Can add transaction with existing category
- [ ] Budgets page shows correct spending and remaining amounts
- [ ] Can set default recurring budgets
- [ ] Can set monthly budget overrides
- [ ] Summary page filters work (date, category, payer)
- [ ] CSV export includes only filtered data
- [ ] Month selector works correctly
- [ ] Mobile responsive design
- [ ] Rate limiting on login attempts
- [ ] Session persistence across browser refresh

## Troubleshooting

### Database Connection Issues
- Ensure you're using the **pooled** connection string from Neon
- Check that your Neon project is not paused
- Verify environment variables are set correctly

### Authentication Issues
- Check that `SESSION_SECRET` is at least 32 characters
- Ensure `AUTH_CODE` matches what you're entering
- Clear browser cookies if sessions seem stuck

### Build Issues
- Run `npm run db:generate` after schema changes
- Ensure all environment variables are set in Vercel
- Check that Prisma client is generated before build

## License

MIT License - feel free to use this for your own expense tracking needs!
