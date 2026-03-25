@AGENTS.md

# God Protection Mode - Foundation Code

The following files are **PROTECTED FOUNDATION CODE** and should NOT be modified without explicit user approval:

## Protected Files (DO NOT MODIFY)
- `src/app/layout.tsx` - Root layout with fonts and metadata
- `src/app/page.tsx` - Access code entry page
- `src/app/setup/page.tsx` - Tester information form
- `src/app/app/page.tsx` - Main app shell with tab navigation
- `src/components/TabNavigation.tsx` - Tab navigation component
- `src/lib/db.ts` - Database client configuration
- `src/lib/schema.sql` - Database schema
- `src/app/globals.css` - Core styling and Procore brand colors
- `src/app/api/auth/route.ts` - Authentication API
- `src/app/api/tester/route.ts` - Tester session API

## Plugin/Feature Pattern

All new features must be added as **plugins** in the `src/features/` directory:

```
src/features/<feature-name>/
├── <FeatureName>.tsx       # Main component
├── <FeatureName>.test.tsx  # Tests (required)
└── <FeatureName>.css       # Styles (optional, prefer Tailwind)
```

### Rules for New Features:
1. Create a new folder under `src/features/`
2. Include tests for all functionality
3. Import features into the main app via standard imports
4. Do not modify foundation files - extend functionality through the feature pattern

## Database
- Using Neon Postgres (free tier)
- Google Sheets syncs test cases to the database
- Schema is defined in `src/lib/schema.sql`
