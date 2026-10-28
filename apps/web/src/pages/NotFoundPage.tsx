import { Link, useLocation } from "react-router-dom";

export default function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <section className="not-found">
      <p className="eyebrow">404</p>
      <h1>Page not found.</h1>
      <p className="lede">
        No route matches <code>{pathname}</code>.
      </p>
      <p className="back-link">
        <Link className="button" to="/">
          Back to status
        </Link>
      </p>
    </section>
  );
}
