// This module defines the User Registration Page component.
import Link from "next/link";

// UserRegisterPage functional component.
export default function UserRegisterPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Page header section. */}
      <div className="text-center">
        <div className="text-xs tracking-luxe text-brand-muted">USER ACCESS</div>
        <h1 className="mt-2 font-display text-3xl">Seeded Login</h1>
      </div>

      {/* Information about seeded user accounts. */}
      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <p className="text-sm text-brand-muted">
          User accounts are seeded from PostgreSQL for this MVP. Use username <code>user</code> and password{" "}
          <code>user123</code> on the user login page.
        </p>
        {/* Link to the user login page. */}
        <div className="mt-6">
          <Link className="btn btn-primary" href="/user">
            GO TO USER LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}
