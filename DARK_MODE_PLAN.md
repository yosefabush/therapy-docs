# Dark Mode Implementation Plan for TherapyDocs

## Overview
Add dark mode toggle to the entire app with persistence and system preference support.

**Good News:** Your app is already well-prepared - Tailwind dark mode is configured and CSS variables for `.dark` are defined in globals.css.

---

## Phase 1: Core Infrastructure

### 1.1 Install next-themes
```bash
npm install next-themes
```

### 1.2 Create ThemeProvider
**New file:** `src/lib/contexts/ThemeProvider.tsx`
- Wrap next-themes provider with `attribute="class"`, `defaultTheme="system"`, `enableSystem`

### 1.3 Update ClientProviders
**File:** `src/lib/contexts/ClientProviders.tsx`
- Wrap children with ThemeProvider

### 1.4 Create ThemeToggle Component
**New file:** `src/components/ui/ThemeToggle.tsx`
- Two variants: `icon` (for Header) and `full` (for Settings)
- Sun/moon icons with Hebrew labels
- Handles hydration correctly with mounted state

---

## Phase 2: Add Toggle to UI

### 2.1 Header (Primary Location)
**File:** `src/components/layout/Header.tsx`
- Add `<ThemeToggle />` next to notifications button (line ~150)

### 2.2 Settings Page (Secondary Location)
**File:** `src/app/settings/page.tsx`
- Add `<ThemeToggle variant="full" />` in Preferences tab

---

## Phase 3: Update Styles

### 3.1 globals.css
**File:** `src/app/globals.css`
- Change body: `bg-warm-50 text-clinical-900` → `bg-background text-foreground`
- Update scrollbar styles with dark variants
- Update selection styles with dark variants

### 3.2 UI Components (use CSS variables)
| Component | Change |
|-----------|--------|
| `card.tsx` | `bg-white` → `bg-card`, `border-sage-100` → `border-border` |
| `input.tsx` | `bg-white` → `bg-background` |
| `dialog.tsx` | `bg-white` → `bg-card` |
| `button.tsx` | Add `dark:` hover variants |

### 3.3 Layout Components
| Component | Change |
|-----------|--------|
| `Header.tsx` | `bg-warm-50/95` → `bg-background/95` |
| `Sidebar.tsx` | `bg-white` → `bg-sidebar`, update text colors |

### 3.4 Page Backgrounds
All pages with `bg-warm-50` → `bg-background`:
- `src/app/page.tsx` (Dashboard)
- `src/app/settings/page.tsx`
- `src/app/patients/page.tsx`
- `src/app/sessions/page.tsx`
- `src/app/reports/page.tsx`
- `src/app/insights/page.tsx`
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`

---

## Critical Files Summary

| File | Action |
|------|--------|
| `src/lib/contexts/ThemeProvider.tsx` | **CREATE** |
| `src/components/ui/ThemeToggle.tsx` | **CREATE** |
| `src/lib/contexts/ClientProviders.tsx` | Modify |
| `src/app/globals.css` | Modify |
| `src/components/layout/Header.tsx` | Modify |
| `src/components/layout/Sidebar.tsx` | Modify |
| `src/components/ui/card.tsx` | Modify |
| `src/components/ui/input.tsx` | Modify |
| `src/components/ui/dialog.tsx` | Modify |
| All page files | Modify (background color) |

---

## Verification

1. **Toggle works:** Click sun/moon in Header, theme switches
2. **Persistence:** Refresh page, theme persists
3. **System preference:** New user gets OS theme
4. **No flash:** Page loads without wrong-theme flash
5. **RTL works:** Hebrew layout correct in both modes
6. **All pages:** Navigate through app, verify dark mode on each page
7. **Forms:** Input fields, dropdowns visible and readable
8. **Modals:** Dialogs display correctly

---

## Implementation Order

1. Install next-themes
2. Create ThemeProvider.tsx
3. Update ClientProviders.tsx
4. Create ThemeToggle.tsx
5. Add toggle to Header
6. Update globals.css body styles
7. Update Card, Input, Dialog components
8. Update Header, Sidebar components
9. Update all page backgrounds
10. Add toggle to Settings page
11. Test all pages in both modes
