 # Travel Management System
 
 A complete Travel Management web app with 3 roles: Admin, Customer, and AreaOwner.
 
 ## Tech Stack
 
 - **Frontend**: React + TypeScript (Vite)
 - **Routing**: React Router v6
 - **UI**: shadcn/ui + lucide-react icons
 - **Styling**: TailwindCSS
 - **Charts**: Recharts
 - **Form Validation**: React Hook Form + Zod
 - **State**: TanStack Query (React Query)
 
 ## Getting Started
 
 ```bash
 npm install
 npm run dev
 ```
 
 ## Authentication (Mock)
 
 Visit `/login` and select a role:
 - **Admin** → `/admin/dashboard`
 - **Customer** → `/`
 - **Owner** → `/owner/dashboard`
 
 ## Replacing Mock API with Real Backend
 
 All API calls are in `src/api/`:
 - `admin.api.ts` - Admin endpoints
 - `customer.api.ts` - Customer endpoints
 - `owner.api.ts` - Owner/Provider endpoints
 
 To connect to a real backend:
 1. Update `API_BASE_URL` in `src/api/http.ts`
 2. Replace mock implementations with actual `fetch` calls using the `httpClient`
 
 ## Project Structure
 
 ```
 src/
 ├── api/           # API layer (fetch wrappers + mock implementations)
 ├── components/    # Shared UI components
 ├── contexts/      # React contexts (Auth)
 ├── layouts/       # Page layouts (Admin, Customer, Owner)
 ├── mocks/         # Mock data generators
 ├── pages/         # Page components organized by role
 ├── routes/        # Route guards and configuration
 ├── types/         # TypeScript DTOs
 └── utils/         # Utility functions (formatting, etc.)
 ```
 
 ## Role Guards
 
 Protected routes use `ProtectedRoute` component which:
 - Redirects to `/login` if not authenticated
 - Redirects to role-specific home if accessing wrong area