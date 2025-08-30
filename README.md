# Stock Portfolio Manager

A full-stack Next.js application for managing a stock portfolio with separate Admin and Client dashboards. Admins can manage users and trades with search, pagination, and confirmation flows; clients can view their portfolio performance through charts and summary cards.

## Features
- Admin Dashboard
  - User management (list users, search)
  - Trades management (list, search across multiple fields, 10-per-page pagination)
  - Delete confirmation modal for safe deletions
  - Responsive, fixed-layout tables with compact typography
- Client Dashboard
  - Summary cards and charts for portfolio performance
- Authentication & Authorization
  - JWT-based auth with middleware guards
- Database
  - MongoDB with Mongoose models for Users, Trades, and NAV
- UI/UX
  - Bootstrap 5 + React-Bootstrap components
  - Tailwind CSS for utility styling
  - Bootstrap Icons for consistent iconography

## Tech Stack
- Next.js 14, React 18
- MongoDB, Mongoose 8
- Bootstrap 5, React-Bootstrap, Tailwind CSS
- Chart.js with react-chartjs-2
- date-fns, jsonwebtoken

## Project Structure (high-level)
- app/
  - admin-dashboard/
  - client-dashboard/
  - api/
  - globals.css, layout.js, page.js
- components/
  - Navbar, Sidebar, UsersTable, TradesTable, charts, etc.
- lib/
  - mongodb.js (database connection)
- models/
  - User.js, Trade.js, NAV.js
- utils/
  - auth.js (JWT helpers), database helpers, etc.
- scripts
  - import_sample_data.js
  - migrate_user_codes.js, migrate_user_codes_new_format.js

## Prerequisites
- Node.js 18+ (recommended)
- A MongoDB connection string (e.g., MongoDB Atlas or local MongoDB)

## Getting Started
1) Install dependencies
- npm install

2) Configure environment variables
Create a file named .env.local in the project root (stock_portfolio_manager/) with:
- MONGODB_URI=your_mongodb_connection_string
- JWT_SECRET=your_long_random_secret

3) Run in development
- npm run dev
App will start at http://localhost:3000

4) Build and run in production
- npm run build
- npm start

## Environment Variables
- MONGODB_URI: MongoDB connection string used by lib/mongodb.js
- JWT_SECRET: Secret used to sign and verify JWTs (utils/auth.js)

Do not commit environment files. They are excluded via .gitignore.

## Useful Scripts
- npm run dev: Start Next.js development server
- npm run build: Build the production bundle
- npm start: Start the production server
- npm run lint: Run ESLint

## Database and Utilities
- Seeding sample data
  - node import_sample_data.js
  - Reads from sample_data.json (ensure MONGODB_URI is set)
- Migrations
  - node migrate_user_codes.js
  - node migrate_user_codes_new_format.js

## Styling
- Tailwind configuration: tailwind.config.js
- Global styles: app/globals.css
- UI components: Bootstrap 5 + React-Bootstrap and Bootstrap Icons

## Troubleshooting
- MongoDB connection errors
  - Ensure MONGODB_URI is set correctly in .env.local
  - Verify network access for MongoDB (if using Atlas)
- JWT errors (invalid/undefined)
  - Ensure JWT_SECRET is set in .env.local
- Port already in use
  - Stop other processes on port 3000 or set PORT before starting (e.g., PORT=3001 npm run dev)

## Notes
- This repository includes .gitignore rules for Node, Next.js build output (.next/), logs, and environment files.
- Avoid committing secrets. Rotate JWT_SECRET if exposed.