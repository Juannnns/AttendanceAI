# Attendance Control Platform with Facial Recognition

## Overview

This is an HR attendance management system that uses facial recognition technology to track employee check-ins and check-outs. The platform provides a dashboard for monitoring attendance metrics, employee management capabilities, and a facial recognition interface for contactless attendance tracking.

**Key Features:**
- Employee management (CRUD operations)
- Facial recognition-based attendance tracking
- Real-time dashboard with attendance statistics
- Attendance history and reporting
- Multi-language support (Spanish interface)
- Dark/light theme support

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tools:**
- React 18 with TypeScript
- Vite for development and production builds
- Wouter for client-side routing
- React Query (TanStack Query) for server state management

**UI Framework:**
- shadcn/ui component library (New York style variant)
- Radix UI primitives for accessible components
- Tailwind CSS for styling with custom design system
- Material Design principles (as specified in design_guidelines.md)

**Design System:**
- Custom color scheme supporting light/dark themes
- Roboto font family via Google Fonts CDN
- Consistent spacing primitives (2, 4, 6, 8, 12, 16)
- Responsive grid layouts with sidebar navigation

**State Management:**
- React Query for API data fetching and caching
- React Hook Form with Zod validation for forms
- Local component state for UI interactions

**Key Pages:**
- Login page with authentication
- Dashboard with attendance metrics
- Employee management (list, create, edit, delete)
- Attendance records with filtering
- Check-in interface with webcam integration

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- HTTP server for API and static file serving
- Middleware for JSON parsing and logging

**Development vs Production:**
- Development: Vite middleware with HMR support
- Production: Pre-built static assets served from dist/public
- Build process uses esbuild for server bundling

**API Design:**
- RESTful API endpoints under /api namespace
- Authentication via POST /api/auth/login (token-based)
- CRUD operations for employees and attendance records
- Dashboard statistics endpoint

**Storage Layer:**
- In-memory storage implementation (MemStorage class)
- Interface-based design (IStorage) allows for easy database migration
- Prepared for PostgreSQL integration (Drizzle ORM configured but not yet implemented)

### Data Storage Solutions

**Current State:**
- In-memory Maps for users, employees, and attendance records
- Default admin user created on initialization
- No persistence across server restarts

**Planned Database:**
- PostgreSQL via Neon serverless driver (@neondatabase/serverless)
- Drizzle ORM for type-safe queries
- Schema defined in shared/schema.ts with three main tables:
  - `users` - Authentication and authorization
  - `employees` - Employee profiles with facial embeddings
  - `attendance_records` - Check-in/check-out records

**Schema Design:**
- Users: id, username, password (plain text - needs hashing), role
- Employees: id, name fields, email, department, position, photo URL, face embedding, status
- Attendance: id, employee_id, date, check_in, check_out, status, confidence

### Authentication and Authorization

**Current Implementation:**
- Simple username/password authentication
- Tokens generated as `token_{user_id}_{timestamp}`
- No actual token validation or session management implemented
- Passwords stored in plain text (security vulnerability)

**User Roles:**
- Admin role defined in schema
- No role-based access control implemented yet

**Security Considerations:**
- Missing: Password hashing (bcrypt/argon2)
- Missing: Secure session management (express-session configured but not used)
- Missing: CSRF protection
- Missing: Rate limiting on auth endpoints

### External Dependencies

**Third-Party Services:**
- Google Fonts CDN for Roboto font family
- Facial recognition service (API endpoints defined but implementation incomplete)

**Key NPM Packages:**
- **Database:** drizzle-orm, @neondatabase/serverless, connect-pg-simple
- **Forms:** react-hook-form, @hookform/resolvers, zod
- **UI:** All @radix-ui/* packages, class-variance-authority, tailwind-merge
- **Utilities:** date-fns, nanoid, uuid

**Development Tools:**
- Replit-specific plugins for development experience
- TypeScript for type safety
- ESBuild for fast production builds

**Incomplete Integrations:**
- Face recognition API (endpoints exist but no actual ML service integration)
- Email service (nodemailer in dependencies but not implemented)
- Payment processing (Stripe in dependencies but not used)
- AI services (OpenAI, Google Generative AI in dependencies but not used)

### Deployment Considerations

**Build Process:**
- Client built with Vite to dist/public
- Server bundled with esbuild to dist/index.cjs
- Allowlist for dependencies to bundle (reduces cold start time)

**Environment Variables:**
- DATABASE_URL required for PostgreSQL connection
- NODE_ENV for development/production mode

**Pending Migrations:**
- Need to run drizzle-kit push to initialize database schema
- Need to migrate from in-memory storage to PostgreSQL
- Need to implement actual facial recognition service integration