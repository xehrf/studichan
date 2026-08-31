# Chinese Universities Portal

Mobile-first platform for studying in Chinese universities. Designed for simplicity and ease of use.

## Features

- **University Catalog**: Browse and search Chinese universities
- **Filters**: Filter by region, search by name or city
- **Agency System**: Universities can be "claimed" by agencies after reaching 100 applications
- **User Accounts**: Simple registration for submitting applications
- **Responsive Design**: Optimized for mobile devices

## Tech Stack

- **Frontend**: React 19 + Vite + Lucide Icons
- **Backend**: Node.js + Express 5 + Better SQLite3
- **Database**: SQLite (file-based, no setup required)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development

```bash
npm run dev
```

This starts:
- Backend API: http://127.0.0.1:3000
- Frontend Vite: http://127.0.0.1:5173

### 3. Seed Sample Data

```bash
curl -X POST http://127.0.0.1:3000/api/admin/seed
```

This adds sample universities and agencies to the database.

## Project Structure

```
.
├── server.mjs              # Express backend + SQLite DB
├── src/
│   ├── App.jsx            # Main React component
│   ├── App.css            # Mobile-first styles
│   └── main.jsx           # React entry point
├── index.html             # HTML template
├── vite.config.js         # Vite config
├── package.json           # Dependencies
└── .runtime/              # Generated DB file
```

## Database Schema

### Universities Table
- `id`, `name`, `city`, `region`, `ranking`
- `specialties`, `requirements`, `tuition`, `description`
- `agency_id`, `students_count`

### Users Table
- `id`, `email`, `password`, `full_name`, `country`, `phone`

### Agencies Table
- `id`, `name`, `email`, `phone`, `website`, `description`

### Applications Table
- `id`, `user_id`, `university_id`, `status`, `created_at`

## API Endpoints

- `GET /api/universities` - List all universities (with filters)
- `GET /api/universities/:id` - Get university details
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/applications` - Submit application
- `POST /api/admin/seed` - Add sample data (dev only)

## Flow

1. **User browsing** (no auth needed):
   - Search and filter universities
   - View university details
   - See agency contact info for "claimed" universities

2. **User action**:
   - Click "I want to apply" → Registration modal appears
   - Create account or login
   - Submit application

3. **Agency system**:
   - Once a university reaches 100 applications, it becomes "claimed"
   - Only agency contact is shown, no direct application option

## Build & Deploy

```bash
npm run build      # Production bundle
npm run lint       # Check code quality
npm run preview    # Preview production build
```

## Notes

- All data stored in `.runtime/universities.db` (SQLite file)
- No external dependencies for database
- Mobile-first design with minimal assets
- Simple password auth (consider adding OAuth for production)
# studichan
