# BMAD Specification: Side Drawer Navigation Menu (Option D)

**Status:** Approved for Implementation  
**Author:** Principal Architect & PM Persona  
**Target:** OmniFeed Mobile & Desktop Navigation  

---

## 1. Problem Statement & Objectives
* **Problem:** The current navigation in `Navbar.tsx` wraps the `Live Feed` / `Saved` tab controls into a full-width second row on mobile screens (`order-3 w-full`), consuming ~50px of vertical viewport height and pushing content down.
* **Objective:** Reduce the mobile navbar to a single, sleek, compact header row (~48-52px) by introducing a Slide-out Side Drawer (Hamburger Menu).
* **Future Readiness:** Provide a natural structural home for upcoming features (Collections, Topic Channels, Custom Series, RSS Settings) without cluttering the main reading view or conflicting with the bottom audio player.

---

## 2. Component Architecture & Hierarchy

### A. Compact Header (`Navbar.tsx`)
* **Left Section:**
  * Hamburger button (`Menu` icon from `lucide-react`) with accessible ARIA label (`aria-label="Open navigation menu"`).
  * Brand Logo icon + "OmniFeed" gradient title.
  * Desktop (`md:flex`): Segmented pill tabs (`Live Feed` / `Saved`) for wide screens.
* **Right Section:**
  * "Add Feed" (`+`) action button.
  * "Manage Sources" (`SlidersHorizontal`) icon button.
  * User profile avatar / Sign In button.

### B. Navigation Side Drawer (`NavDrawer.tsx`)
* **Overlay Backdrop:** `fixed inset-0 z-50 bg-black/70 backdrop-blur-sm` with smooth fade-in.
* **Drawer Panel:** Left-aligned slide-out panel (`w-72 sm:w-80 max-w-[85vw] h-full bg-slate-900 border-r border-white/10 shadow-2xl flex flex-col`).
* **Drawer Header:**
  * OmniFeed logo + title + version pill.
  * Close (`X`) button.
* **Drawer Navigation Items:**
  1. **Live Feed** (`Radio` / `Layers` icon) + Active Indicator + Total active streams count badge.
  2. **Saved** (`Bookmark` icon) + Active Indicator + Bookmark count badge.
  3. **Manage Sources** (`SlidersHorizontal` icon) — Launches `SourcesModal` and dismisses drawer.
  4. **Add Custom Feed** (`Plus` icon) — Launches `AddFeedModal` and dismisses drawer.
* **Future Roadmap Section:**
  * **Collections & Lists** (Folder icon with "Coming Soon" badge) — visually aligns architecture for next sprint.
* **Drawer Footer:**
  * User Account info (Avatar, Email) & Sign Out / Sign In action.
  * App version and status.

---

## 3. Keyboard & Accessibility Requirements
1. **Escape Key:** Pressing `Escape` immediately dismisses the drawer.
2. **Backdrop Click:** Clicking the darkened background dismisses the drawer.
3. **Body Scroll Lock:** When open, `document.body.style.overflow = 'hidden'` prevents page background scrolling.
4. **Auto-Dismiss:** Navigating to a tab or triggering a modal automatically closes the drawer.

---

## 4. Superpowers TDD Test Plan
* `NavDrawer.test.tsx` / `Navbar.test.tsx`:
  * Verify drawer opens when hamburger is clicked.
  * Verify clicking "Live Feed" calls `setActiveTab('feed')` and closes drawer.
  * Verify clicking "Saved" calls `setActiveTab('bookmarks')` and closes drawer.
  * Verify clicking "Add Feed" calls `onOpenAddModal()` and closes drawer.
  * Verify clicking "Manage Sources" calls `onOpenSourcesModal()` and closes drawer.
  * Verify clicking the backdrop or Close button dismisses the drawer.
