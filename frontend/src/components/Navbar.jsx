import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../api/notifications';
import ThemeToggle from './ThemeToggle';
import BrandMark, { BrandWordmark } from './BrandMark';

const linkStyle = ({ isActive }) => ({
  padding: '8px 14px',
  borderRadius: 999,
  fontWeight: 600,
  fontSize: 14,
  color: isActive ? '#fff' : 'var(--color-text-muted)',
  background: isActive ? 'var(--gradient-primary)' : 'transparent',
  boxShadow: isActive ? '0 2px 8px rgba(29,95,163,0.28)' : 'none',
  textDecoration: 'none',
  transition: 'all 0.15s var(--ease)',
  whiteSpace: 'nowrap',
});

// Same styling as linkStyle but for the stacked mobile menu, where links
// should take the full row width instead of shrink-wrapping.
const mobileLinkStyle = ({ isActive }) => ({
  ...linkStyle({ isActive }),
  display: 'block',
  padding: '12px 16px',
  borderRadius: 'var(--radius-sm)',
});

function initials(name) {
  return (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    notificationsApi
      .listMine()
      .then((list) => setUnread(list.filter((n) => !n.isRead).length))
      .catch(() => {});
  }, [user]);

  // Close the mobile menu automatically whenever the route changes, so it
  // never stays open covering the page the user just navigated to.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const customerLinks = (
    <>
      <NavLink to="/" style={linkStyle} end>Catalog</NavLink>
      <NavLink to="/my-bookings" style={linkStyle}>My Bookings</NavLink>
      <NavLink to="/notifications" style={linkStyle}>
        Notifications{unread > 0 ? ` · ${unread}` : ''}
      </NavLink>
      <NavLink to="/profile" style={linkStyle}>Profile</NavLink>
    </>
  );

  const adminLinks = (
    <>
      <NavLink to="/admin" style={linkStyle} end>Dashboard</NavLink>
      <NavLink to="/admin/inventory" style={linkStyle}>Inventory</NavLink>
      <NavLink to="/admin/categories" style={linkStyle}>Categories</NavLink>
      <NavLink to="/admin/bookings" style={linkStyle}>Bookings</NavLink>
      <NavLink to="/admin/calendar" style={linkStyle}>Calendar</NavLink>
      <NavLink to="/admin/customers" style={linkStyle}>Customers</NavLink>
      <NavLink to="/admin/deliveries" style={linkStyle}>Deliveries</NavLink>
      <NavLink to="/admin/reports" style={linkStyle}>Reports</NavLink>
    </>
  );

  const mobileCustomerLinks = (
    <>
      <NavLink to="/" style={mobileLinkStyle} end>Catalog</NavLink>
      <NavLink to="/my-bookings" style={mobileLinkStyle}>My Bookings</NavLink>
      <NavLink to="/notifications" style={mobileLinkStyle}>
        Notifications{unread > 0 ? ` · ${unread}` : ''}
      </NavLink>
      <NavLink to="/profile" style={mobileLinkStyle}>Profile</NavLink>
    </>
  );

  const mobileAdminLinks = (
    <>
      <NavLink to="/admin" style={mobileLinkStyle} end>Dashboard</NavLink>
      <NavLink to="/admin/inventory" style={mobileLinkStyle}>Inventory</NavLink>
      <NavLink to="/admin/categories" style={mobileLinkStyle}>Categories</NavLink>
      <NavLink to="/admin/bookings" style={mobileLinkStyle}>Bookings</NavLink>
      <NavLink to="/admin/calendar" style={mobileLinkStyle}>Calendar</NavLink>
      <NavLink to="/admin/customers" style={mobileLinkStyle}>Customers</NavLink>
      <NavLink to="/admin/deliveries" style={mobileLinkStyle}>Deliveries</NavLink>
      <NavLink to="/admin/reports" style={mobileLinkStyle}>Reports</NavLink>
    </>
  );

  return (
    <header
      style={{
        background: 'var(--navbar-bg)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, height: 64 }}>
        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <BrandMark size={32} />
          <BrandWordmark />
        </NavLink>

        <nav className="navbar-links" style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto' }}>
          {isAdmin ? adminLinks : user ? customerLinks : null}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 'auto' }}>
          <ThemeToggle />

          {user ? (
            <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                title={user.name}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--gradient-accent)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {initials(user.name)}
              </span>
              <span className="navbar-name" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {user.name}
              </span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="navbar-links" style={{ display: 'flex', gap: 8 }}>
              <NavLink to="/login" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>Log in</NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>Sign up</NavLink>
            </div>
          )}

          {/* Hamburger - hidden on desktop widths via the .navbar-toggle CSS
              rule in theme.css, shown under 760px. */}
          <button
            type="button"
            className="navbar-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            style={{
              display: 'none',
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile stacked menu - visibility is fully controlled by this inline
          style below the 760px breakpoint; theme.css forces it hidden with
          !important above that breakpoint regardless of `menuOpen`. */}
      <div
        className="navbar-mobile-menu fade-in"
        style={{
          display: menuOpen ? 'block' : 'none',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          padding: '10px 16px 16px',
        }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: user ? 12 : 0 }}>
          {isAdmin ? mobileAdminLinks : user ? mobileCustomerLinks : null}
        </nav>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>{user.name}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <NavLink to="/login" className="btn btn-outline btn-sm" style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}>Log in</NavLink>
            <NavLink to="/register" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}>Sign up</NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
