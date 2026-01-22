# Technology Stack

**Analysis Date:** 2026-01-22

## Languages

**Primary:**
- TypeScript 5.5.4 - Used for all frontend and backend code with strict mode enabled
- JavaScript - Configuration files (next.config.js, postcss.config.js)

**Secondary:**
- CSS/Tailwind - Styling via utility-first framework with custom extensions
- HTML - Template markup in React components

## Runtime

**Environment:**
- Node.js (version unspecified, likely 18+)
- Next.js runtime (server and client components)

**Package Manager:**
- npm (lockfile: package-lock.json present)

## Frameworks

**Core:**
- Next.js 16.1.1 - App Router framework for full-stack React application
- React 18.3.1 - UI library with hooks and server components
- React DOM 18.3.1 - React rendering for web

**Styling:**
- Tailwind CSS 3.4.10 - Utility-first CSS framework with custom medical theme
- PostCSS 8.4.45 - CSS transformation pipeline
- Autoprefixer 10.4.20 - Browser prefix handling

**UI Components:**
- Radix UI (@radix-ui/*) - Headless UI primitives (Avatar, Checkbox, Dialog, Dropdown, Label, Popover, Progress, Select, Slot, Tabs, Tooltip)
- shadcn 3.6.3 - Component library built on Radix UI

**Testing:**
- Playwright Test 1.57.0 - E2E testing framework
- Runner configuration in `playwright.config.ts`

**Development:**
- TypeScript 5.5.4 - Compiler and type checking
- ESLint 9.18.0 - Code linting (Next.js config rules)
- Next.js ESLint Plugin - Specialized Next.js linting rules

## Key Dependencies

**Critical:**
- @deepgram/sdk 4.11.3 - Speech-to-text API for audio transcription with speaker diarization
- jose 5.9.2 - JWT handling and token management
- bcryptjs 2.4.3 - Password hashing (currently not used in auth, see CONCERNS.md)
- zod 3.25.76 - Runtime schema validation for type safety

**Infrastructure:**
- uuid 10.0.0 - Unique identifier generation for entities
- date-fns 3.6.0 - Date manipulation and formatting
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.4.0 - Merge Tailwind classes without conflicts
- class-variance-authority 0.7.1 - Component variant management

**Speech Recognition:**
- react-speech-recognition 4.0.1 - Browser-based speech recognition API wrapper

**Export/PDF:**
- html2pdf.js 0.13.0 - Client-side PDF generation from HTML (dynamically imported)

**Documentation:**
- next-swagger-doc 0.4.1 - Swagger/OpenAPI documentation generation
- swagger-ui-react 5.31.0 - Swagger UI visualization

**Icons:**
- lucide-react 0.446.0 - SVG icon library (Eye, EyeOff, LogIn, Stethoscope, Plus, X, etc.)

**Animation:**
- tailwindcss-animate 1.0.7 - Tailwind animation utilities

## Configuration

**Environment:**
- `.env.local` - Development environment variables
  - `DEEPGRAM_API_KEY` - Required for speech transcription (present in .env.local)
  - `ENCRYPTION_KEY` - Optional, defaults to demo value (see `src/lib/security.ts`)

**Build:**
- `next.config.js` - Next.js configuration with server actions body size limit (2mb)
- `tsconfig.json` - TypeScript configuration with `@/*` path alias to `./src/*`
- `tailwind.config.ts` - Extended Tailwind theme with custom colors (sage, warm, clinical) and animations
- `postcss.config.js` - PostCSS pipeline (Tailwind and Autoprefixer)
- `.eslintrc.json` - ESLint configuration extending Next.js core-web-vitals

**Package Management:**
- `package.json` - Version 1.0.0, private repository

## Platform Requirements

**Development:**
- Node.js 18+ (inferred from Next.js 16)
- npm for dependency management
- Modern browser with Web Audio API support (for speech recognition)
- Local file system access for data storage (`data/` directory)

**Production:**
- Node.js server runtime
- Environment variables: `DEEPGRAM_API_KEY`, `ENCRYPTION_KEY` (optional)
- File system writable directory for JSON data persistence (`/data`)
- HTTPS recommended for HIPAA compliance

---

*Stack analysis: 2026-01-22*
