# Parodos 27 - Fullstack Ordering Platform

Ενιαία web εφαρμογή για εστιατόριο/μαγειρείο με:
- δημόσιο κατάλογο και online παραγγελία,
- live admin dashboard διαχείρισης,
- delivery panel για διανομέα,
- JWT authentication στο backend,
- real-time ενημερώσεις με WebSocket (STOMP + SockJS).

## Stack

- Frontend: Next.js 16 (App Router), React 19, Tailwind v4, Zustand, Axios
- Backend: Spring Boot 3.2, Java 21, Spring Security, Spring WebSocket, JPA
- Database: PostgreSQL
- Realtime: STOMP topics (`/topic/newOrder`, `/topic/orderUpdates`)
- Uploads: Cloudinary + local uploads endpoint

## Αρχιτεκτονική

- Frontend deployment: Vercel
- Backend deployment: Render
- Frontend -> Backend API μέσω `NEXT_PUBLIC_API_URL` (π.χ. `https://.../api`)
- Frontend auth routes (`/api/auth/*`) κάνουν proxy login/check/logout και διαχειρίζονται `admin_jwt` cookie
- Backend προστατεύει τα admin endpoints με JWT Bearer token

## Core Δυνατότητες

### Customer (Public)

- Προβολή ενεργών πιάτων (`/api/dishes/active`)
- Αναζήτηση και φιλτράρισμα ανά κατηγορία
- Favorites σε `localStorage`
- Product modal με extras, υπολογισμό πρόσθετου κόστους και notes
- Cart drawer με:
- persisted cart (`zustand` + `persist`)
- τύπο παραγγελίας (`takeaway` / `delivery`)
- έλεγχο ελάχιστης αξίας για delivery
- Γρήγορα προϊόντα (quick add)
- Checkout με:
- στοιχεία πελάτη
- διεύθυνση + όροφο + κουδούνι
- Google Places autocomplete
- marker/GPS συντεταγμένες
- Δημιουργία παραγγελίας στο backend
- Σελίδα παρακολούθησης παραγγελίας `/order-status/[id]` με polling και στάδια:
- `PENDING`, `ACCEPTED`, `ON_THE_WAY`, `COMPLETED`, `CANCELLED`

### Admin Dashboard (`/admin`)

- Login με κωδικό και JWT session
- Live πίνακας παραγγελιών:
- νέες παραγγελίες σε πραγματικό χρόνο
- αποδοχή/απόρριψη παραγγελιών
- ορισμός χρόνου προετοιμασίας
- status transitions (`PENDING -> ACCEPTED -> ON_THE_WAY/COMPLETED`)
- Εκτύπωση παραγγελίας
- Ηχητικές ειδοποιήσεις για νέα και επείγουσες παραγγελίες
- Διαχείριση menu:
- CRUD πιάτων
- ενεργοποίηση/απενεργοποίηση πιάτων
- upload φωτογραφίας (Cloudinary)
- grouping ανά κατηγορία και reorder κατηγοριών
- Ιστορικό παραγγελιών με pagination
- Οικονομικά/analytics tab:
- σύνολο εσόδων, AOV, χαμένα έσοδα
- split delivery/takeaway
- best sellers
- top customers
- Ρυθμίσεις καταστήματος:
- open/closed toggle
- εβδομαδιαίο ωράριο
- global extras
- disabled extras

### Delivery App (`/delivery`)

- JWT login
- Προβολή μόνο `ON_THE_WAY` grouped παραγγελιών
- Ενέργειες: τηλεφωνική κλήση, άνοιγμα χάρτη, ολοκλήρωση παράδοσης

## Backend API

### Authentication

- `POST /api/auth/login`
- body: `{ "password": "..." }`
- επιστρέφει JWT token

### Public Endpoints

- `GET /api/dishes`
- `GET /api/dishes/active`
- `GET /api/settings`
- `POST /api/orders` (δημιουργία customer order)
- `GET /api/orders/{id}` (tracking συγκεκριμένης παραγγελίας)

### Protected Endpoints (JWT required)

- Όλα τα υπόλοιπα `/api/**`
- Ενδεικτικά:
- `PUT /api/orders/{id}`
- `GET /api/orders`
- `POST /api/dishes`
- `PUT /api/dishes/{id}`
- `PATCH /api/dishes/{id}/toggle`
- `POST /api/dishes/{id}/upload`
- `PUT /api/settings`

### WebSocket

- SockJS endpoint: `/ws-orders`
- Topics:
- `/topic/newOrder`
- `/topic/orderUpdates`

## Security (Current)

- Stateless auth με JWT
- `JwtAuthenticationFilter` σε κάθε request
- Password-based single-admin login (env-driven)
- CORS allowlist:
- `https://parodos27.vercel.app`
- `http://localhost:3000`
- CSRF disabled (token-based API mode)
- Public/Protected endpoint segmentation στο `SecurityConfig`

## Data Model

- `Dish`: name, price, category, image, extras, active, availablePortions, discount
- `CustomerOrder`: status, type, address, phone, notes, quantity, dish, createdAt, estimatedReadyTime
- `StoreSettings`: open flag, weekly schedule, global extras, disabled extras
- `DailyMenu`: dish/date/availablePortions

## Frontend Structure

- `src/app/page.js`: δημόσιος κατάλογος
- `src/app/admin/page.js`: admin dashboard
- `src/app/delivery/page.js`: delivery panel
- `src/app/order-status/[id]/page.js`: tracking page
- `src/components/CartDrawer.jsx`: cart + checkout
- `src/components/ProductModal.jsx`: επιλογές extras
- `src/store/useCartStore.js`: state management cart/customer
- `src/app/api/auth/*`: auth proxy routes
- `src/lib/setupAxiosAuth.js`: auto-attach `Authorization: Bearer ...`
- `src/lib/wsUrl.js`: ασφαλές WS URL resolver για HTTPS/localhost

## Environment Variables

### Frontend

- `NEXT_PUBLIC_API_URL` (π.χ. `https://parodos27.onrender.com/api`)
- `NEXT_PUBLIC_WS_URL` (π.χ. `https://parodos27.onrender.com/ws-orders`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Backend

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `PORT`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `JWT_SECRET_BASE64` (ή fallback `JWT_SECRET`)
- `JWT_EXPIRATION_MS`

## Run Locally

### Backend

```bash
cd backend/backend
./mvnw spring-boot:run
```

### Frontend

```bash
npm install
npm run dev
```

## Notes

- Υπάρχει και endpoint local media library (`/api/media/*`) με filesystem uploads.
- Το `AnalyticsService` υπάρχει ως service layer αλλά το κύριο analytics UI τροφοδοτείται από frontend υπολογισμούς πάνω στο order history.
- Το project είναι σχεδιασμένο για ένα admin account (χωρίς user table / RBAC system).
