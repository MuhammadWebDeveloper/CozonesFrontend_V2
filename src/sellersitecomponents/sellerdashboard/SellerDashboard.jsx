import React, { useState } from 'react';
import SellerHome from './SellerHome.jsx';
import SellerSpaces from './SellerSpaces.jsx';
import '../../../src/componentstyles/sellerdashboardstyles/SellerDashboard.css';

const navItems = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'spaces', label: 'Spaces', icon: '⊞' },
  // { id: 'payments', label: 'Payments', icon: '💳' },
  // { id: 'calendar', label: 'Calendar', icon: '📅' },
  // { id: 'reviews', label: 'Reviews', icon: '📖' },
  // { id: 'bookings', label: 'Bookings', icon: '📋' },
  // { id: 'escrow', label: 'Escrow', icon: '🔒' },
];

export default function SellerDashboard() {
  const [activePage, setActivePage] = useState('home');

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <SellerHome />;
      case 'spaces': return <SellerSpaces />;
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
      </aside>
      <div className="sd__content">{renderPage()}</div>
    </div>
  );
}