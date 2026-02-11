# Rennes School — Phase 1 (HTML & CSS)

This repository contains the **Phase 1** delivery of the Rennes School UI: the provided design mockups integrated as a **responsive static website** using **HTML and CSS** (JavaScript only where necessary).

## Deliverables
- **Public GitHub Repository:** https://github.com/burcusavci96/rennes-school-phase1
- **Live Demo (Vercel):** https://rennes-school-phase1.vercel.app

> Phase 2 (React) is delivered separately in its own repository.

---

## Scope
The goal of Phase 1 is to reproduce the UI from the mockups as closely as possible using a clean, responsive layout.

Implemented features:
- **Responsive layout** (mobile / tablet / desktop)
- **Mobile-first approach** with CSS breakpoints
- **Flexbox and Grid** used throughout the layout
- Dashboard-style UI with:
  - Left column course cards (date pill + course information)
  - Center column events/news banners with image overlay titles
  - Right column welcome card section
- Consistent typography, spacing, and component styling aligned with the mockups
- Assets included in the repository (`assets/`)

---

## Tech Stack
- HTML5
- CSS3 (Flexbox / Grid)
- JavaScript (minimal, only if required)

---

## Getting Started

### Run locally
Because this is a static site, you can open `index.html` directly in your browser.

For a better local dev experience (recommended), run a simple local server:

**Option A — VS Code Live Server**
- Install “Live Server” extension
- Right-click `index.html` → **Open with Live Server**

**Option B — Node (http-server)**
```bash
npx http-server

Project Structure (overview)
	•	index.html — main entry
	•	pages/ — additional pages (if applicable)
	•	css/ — stylesheets (layout, dashboard, components)
	•	js/ — scripts (only where needed)
	•	assets/ — images, icons, and UI assets


Notes
	•	The UI is implemented according to the provided design mockups.
	•	All required assets are included in the repository.
	•	Phase 1 focuses on layout integration and responsiveness; application logic and routing are handled in Phase 2 (React).

Author - Burcu Savcı