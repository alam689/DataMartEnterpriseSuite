# DataMart Enterprise Suite — ERP Front End

An eye-comfortable React front end for a modular ERP. This phase delivers the
**Login screen** and the **Home / module dashboard** covering all modules:

System Administration · Common Application · Accounts · Inventory · Procurement ·
Sales · Production · HR · Payroll · CRM · Fixed Asset Management · Fleet Management

## Design for eye comfort
- **No pure white / pure black** — warm off-white and soft slate surfaces to cut glare.
- **Calm teal brand** with low-saturation pastel accents per module.
- **Light & dark themes** with a one-click toggle; first visit respects the OS preference.
- Gentle shadows, soft focus rings, `prefers-reduced-motion` support, AA-contrast body text.
- Fully responsive: sidebar collapses, grid reflows down to mobile.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```

## Sign in
Demo auth only — enter any email/password to enter the dashboard. Wire real
authentication in `src/App.jsx` (`handleLogin`) and `src/pages/Login.jsx` (`submit`).

## Structure
```
src/
  context/ThemeContext.jsx   # light/dark theme + persistence
  data/modules.js            # module catalog (icon, accent, stats)
  pages/Login.jsx + .css     # split-panel login
  pages/Home.jsx  + .css     # sidebar + topbar + KPI + module grid + activity
  styles/index.css           # design tokens (CSS variables) + base
```

## Next steps
Each module card / sidebar item is a navigation hook (`setActive`) ready to be
routed to its own screen as those modules are built out.
