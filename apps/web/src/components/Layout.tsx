import { NavLink, Outlet } from "react-router-dom";

const navigation = [
  { to: "/", label: "Status", end: true },
  { to: "/about", label: "About", end: false },
] as const;

export function Layout() {
  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Monorepo template home">
          <span className="brand__mark" aria-hidden="true">
            M
          </span>
          <span className="brand__name">monorepo-template</span>
        </NavLink>

        <nav className="nav" aria-label="Main navigation">
          {navigation.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? "nav__link nav__link--active" : "nav__link"
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app">
        <Outlet />
      </main>

      <footer className="footer" aria-label="Workspace packages">
        <span>apps/web</span>
        <span>apps/api</span>
        <span>packages/shared</span>
      </footer>
    </div>
  );
}
