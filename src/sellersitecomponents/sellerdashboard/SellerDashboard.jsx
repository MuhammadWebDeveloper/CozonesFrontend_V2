import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerHome from './SellerHome.jsx';
import SellerSpaces from './SellerSpaces.jsx';
import '../../../src/componentstyles/sellerdashboardstyles/SellerDashboard.css';
import SellerViewAllBookedSpace from './sellerViewAllBookedSpace.jsx';
import { LogOut, Home } from 'lucide-react';
import SellerCalendar from './SellerCalendar.jsx';

const navItems = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'spaces', label: 'Spaces', icon: '⊞' },
  { id: 'bookings', label: 'Bookings', icon: '📋' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
];

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('home');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleBackToMainSite = () => {
    navigate('/');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <SellerHome />;
      case 'spaces': return <SellerSpaces />;
      case 'bookings': return <SellerViewAllBookedSpace />;
      case 'calendar': return <SellerCalendar />;
      default:
        return (
          <div className="sd__coming-soon">
            <p>{activePage.charAt(0).toUpperCase() + activePage.slice(1)} — coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="sd__shell">
      <aside className="sd__sidebar">
        <div className="sd__logo">⊞ Seller</div>

        <nav className="sd__nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sd__nav-item${activePage === item.id ? ' sd__nav-item--active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="sd__nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Navigation Section */}
        <div className="sd__bottom-nav">
          <button
            className="sd__nav-item sd__nav-item-bottom"
            onClick={handleBackToMainSite}
          >
            <span className="sd__nav-icon">🏠</span>
            <span>Back to Main Site</span>
          </button>

          <button
            className="sd__nav-item sd__nav-item-bottom sd__nav-item-logout"
            onClick={handleLogout}
          >
            <span className="sd__nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="sd__content">{renderPage()}</div>
    </div>
  );
}