import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminLayout.css";
import "../styles/AdminLogin.css";
import BaseUrl from "../../utils/AppConstants";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BaseUrl}api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      // Check admin role before saving
      const user = data.user || data.data?.user;
      const token = data.token || data.data?.token;

      if (!user || user.role !== "admin") {
        throw new Error("Access denied. Admins only.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/admin");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="login-brand">
          <i className="ti ti-shield-check" aria-hidden="true" />
          <span>CoZones Admin</span>
        </div>

        <h1 className="login-title">Admin sign in</h1>
        <p className="login-sub">Only authorised administrators can access this panel.</p>

        {error && (
          <div className="login-error">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="login-field">
          <label htmlFor="admin-email">Email</label>
          <div className="input-wrap">
            <i className="ti ti-mail" aria-hidden="true" />
            <input
              id="admin-email"
              type="email"
              placeholder="admin@cozones.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
            />
          </div>
        </div>

        <div className="login-field">
          <label htmlFor="admin-password">Password</label>
          <div className="input-wrap">
            <i className="ti ti-lock" aria-hidden="true" />
            <input
              id="admin-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
        </div>

        <button
          className="login-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }} /> Signing in…</>
          ) : (
            <><i className="ti ti-login" /> Sign in to admin panel</>
          )}
        </button>

        <p className="login-back">
          <a href="/">← Back to main site</a>
        </p>
      </div>
    </div>
  );
}


// to add admin use this  "node -e "const bcrypt = require('bcrypt'); bcrypt.hash('__yourpassword__', 10).then(h => console.log(h));""  to create password hash
//  and  use this for the login credentials email: below and password: __yourpassword__

// INSERT INTO users (id, full_name, email, phone, password_hash, role, is_verified, created_at, updated_at)
// VALUES (
//   gen_random_uuid(),
//   'Name Surname',
//   'you email here',
//   '03001234567',
//   'you hash here',
//   'admin',
//   true,
//   NOW(),
//   NOW()
// );

// i have created below
// admin@cozones.com
// Admin@123






// INSERT INTO users (id, full_name, email, phone, password_hash, role, is_verified, created_at, updated_at)
// VALUES (
//   gen_random_uuid(),
//   'Muhammad',
//   'admin@cozones.com',
//   '03274097597',
//   '$2b$10$hgtoEeUSfKfk.Vc9t4CDleV63dVmxQTiXw8M4OLAuRVLN1EzuUXdm',
//   'admin',
//   true,
//   NOW(),
//   NOW()
// );

// i have created below
// admin@cozones.com
// Admin@123