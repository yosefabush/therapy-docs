# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Next.js on localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture

TherapyDocs is a HIPAA-compliant clinical documentation system for mental health professionals, built with Next.js 14 App Router and TypeScript.

### Core Concepts

**Multi-Role Template System**: The app supports 10 therapist roles (psychologist, psychiatrist, social worker, occupational therapist, etc.), each with specialized SOAP note templates defined in `src/lib/templates.ts`. Templates specify required fields, intervention options, and assessment scales per role.

**AI Features** (`src/lib/ai-features.ts`): Role-specific session summaries, pattern recognition for mood/risk trends, and voice transcription processing. The `generateSessionSummary()` function tailors output based on `TherapistRole`.

**Type System** (`src/types/index.ts`): Central type definitions for `Patient`, `Session`, `SessionNotes`, `RiskAssessment`, `TreatmentGoal`, `Report`, etc. All PHI-related fields use an encryption wrapper pattern (e.g., `encryptedData`, `EncryptedContact`).

### Project Structure

- `src/app/` - Next.js App Router pages (dashboard, patients, sessions, reports, insights)
- `src/components/ui/` - Reusable UI component library (Button, Card, Modal, Tabs, Badge, etc.)
- `src/components/layout/` - Sidebar and Header
- `src/components/[feature]/` - Feature-specific components
- `src/lib/` - Business logic, mock data, templates, security utilities
- `src/lib/he/` - Hebrew localization (translations and formatters)

### Styling

Uses Tailwind CSS with a custom medical-themed color palette:
- `sage-*` - Primary green tones for medical aesthetic
- `warm-*` - Secondary warm neutrals
- `clinical-*` - Neutral grays for text/backgrounds

Custom utilities: `shadow-soft`, `shadow-glow`, animations (`fade-in`, `slide-up`, `pulse-soft`)

### Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)
