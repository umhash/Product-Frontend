# Product MVP - Frontend

Next.js frontend for the Product MVP application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
product-fe/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # Reusable components
│   └── lib/          # Utilities and configurations
├── public/           # Static assets
├── package.json      # Node.js dependencies
└── .env.local       # Environment variables
```

## Features

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **React Query** for state management

## Environment Variables

Create `.env.local` and configure:

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_APP_NAME`: Application name
- `NEXT_PUBLIC_APP_VERSION`: Application version

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint