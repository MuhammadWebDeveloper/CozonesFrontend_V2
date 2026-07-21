import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerHome from './SellerHome.jsx';
import SellerSpaces from './SellerSpaces.jsx';
import '../../../src/componentstyles/sellerdashboardstyles/SellerDashboard.css';
import SellerViewAllBookedSpace from './sellerViewAllBookedSpace.jsx';
import SellerCalendar from './SellerCalendar.jsx';
import axios from 'axios';
import BaseUrl from '../../utils/AppConstants.jsx';
import {
  Home,
  LayoutGrid,
  ClipboardList,
  Calendar,
  CheckCircle,
  Hourglass,
  XCircle,
  Info,
  AlertTriangle,
  FileEdit,
  Lock,
  LogOut,
  X,
} from 'lucide-react';

const navItems = [
  { id: 'home',     label: 'Home',     icon: Home },
  { id: 'spaces',   label: 'Spaces',   icon: LayoutGrid },
  { id: 'bookings', label: 'Bookings', icon: ClipboardList },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
];

// Tabs that require FULL owner/approved access
const RESTRICTED_TABS = ['bookings', 'calendar'];

export default function SellerDashboard() {
  const navigate = useNavigate();

  const [activePage,    setActivePage]    = useState('home');
  const [isAuthorized,  setIsAuthorized]  = useState(false);
  const [isLoading,     setIsLoading]     = useState(true);
  const [hostStatus,    setHostStatus]    = useState(null); // 'none' | 'pending' | 'approved' | 'rejected'

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // ─── Toast helpers ────────────────────────────────────────────────────────

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(t => ({ ...t, show: false }));
  }, []);

  const showToastThenRedirect = useCallback((message, type, path, delay = 3000) => {
    showToast(message, type);
    setTimeout(() => {
      hideToast();
      navigate(path);
    }, delay);
  }, [showToast, hideToast, navigate]);

  // ─── Authorization check ──────────────────────────────────────────────────

  useEffect(() => {
    checkUserAuthorization();
  }, []);

  const checkUserAuthorization = async () => {
    try {
      const token    = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        showToastThenRedirect('Please login to access this page', 'warning', '/login', 2000);
        setIsLoading(false);
        return;
      }

      const user = JSON.parse(userData);

      // Admin & already-approved owners → instant access
      if (user.role === 'admin' || user.role === 'owner') {
        setHostStatus('approved');
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // Fetch the user's latest host request
      const response = await axios.get(`${BaseUrl}api/host-requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log('Latest host response:', response);

      if (response.data.success && response.data.requests.length > 0) {
        const latest = response.data.requests[0];
        setHostStatus(latest.status);

        switch (latest.status) {

          case 'approved':
            // Promote role locally & grant access — no redirect needed
            user.role = 'owner';
            localStorage.setItem('user', JSON.stringify(user));
            setIsAuthorized(true);
            showToast('Welcome! Your host account is approved.', 'success');
            break;

          case 'pending':
            // Let them into the dashboard but restrict certain tabs
            setIsAuthorized(true);
            showToast('Your host request is under review. Some features are locked.', 'warning');
            break;

          case 'rejected':
            showToastThenRedirect(
              'Your host request was rejected. Please re-apply.',
              'error',
              '/become-host',
              3000
            );
            break;

          default:
            showToastThenRedirect('Unable to determine host status.', 'error', '/', 3000);
        }

      } else {
        // No request at all
        setHostStatus('none');
        showToastThenRedirect(
          'You need to become a host first. Redirecting...',
          'info',
          '/become-host',
          3000
        );
      }

    } catch (error) {
      console.error('Authorization error:', error);
      if (error.response?.status === 401) {
        showToastThenRedirect('Session expired. Please login again.', 'error', '/login', 2000);
      } else if (error.code === 'ERR_NETWORK') {
        showToastThenRedirect('Network error. Please check your connection.', 'error', '/', 3000);
      } else {
        showToastThenRedirect('Unable to verify your host status.', 'error', '/', 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Tab click handler ────────────────────────────────────────────────────

  const handleNavClick = (tabId) => {
    // If tab is restricted and user is only pending → show toast + block
    if (RESTRICTED_TABS.includes(tabId) && hostStatus === 'pending') {
      showToast(
        'This feature is only available after your host request is approved.',
        'warning'
      );
      // Auto-hide after 4s
      setTimeout(hideToast, 4000);
      return; // Don't navigate to the tab
    }

    // If somehow a plain user with no request clicks restricted tab
    if (RESTRICTED_TABS.includes(tabId) && hostStatus === 'none') {
      showToast('Please become a host first to access this feature.', 'info');
      setTimeout(() => {
        hideToast();
        navigate('/become-host');
      }, 3000);
      return;
    }

    setActivePage(tabId);
  };

  // ─── Render active page ───────────────────────────────────────────────────

  const renderPage = () => {
    switch (activePage) {
      case 'home':     return <SellerHome />;
      case 'spaces':   return <SellerSpaces />;
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

  // ─── Toast styles ─────────────────────────────────────────────────────────

  const toastClass = {
    success: 'sd__toast--success',
    warning: 'sd__toast--warning',
    error:   'sd__toast--error',
    info:    'sd__toast--info',
  }[toast.type] ?? 'sd__toast--info';

  const ToastIconComponent = {
    success: CheckCircle,
    warning: AlertTriangle,
    error:   XCircle,
    info:    Info,
  }[toast.type] ?? Info;

  // ─── Loading screen ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="sd__loading">
        <div className="sd__spinner" />
        <p>Verifying access...</p>
      </div>
    );
  }

  // ─── Not authorized → show redirect screen ────────────────────────────────

  if (!isAuthorized) {
    return (
      <>
        {toast.show && (
          <div className={`sd__toast ${toastClass}`}>
            <div className="sd__toast-content">
              <span className="sd__toast-icon">
                <ToastIconComponent size={18} />
              </span>
              <p>{toast.message}</p>
            </div>
            <button className="sd__toast-close" onClick={hideToast}>
              <X size={16} />
            </button>
          </div>
        )}
        <div className="sd__redirecting">
          <div className="sd__redirecting-content">
            <div className="sd__spinner" />
            <h3>Redirecting...</h3>
            <p>{toast.message}</p>
          </div>
        </div>
      </>
    );
  }

  // ─── Authorized dashboard ─────────────────────────────────────────────────

  return (
    <div className="sd__shell">

      {/* Toast (floats above everything) */}
      {toast.show && (
        <div className={`sd__toast ${toastClass}`}>
          <div className="sd__toast-content">
            <span className="sd__toast-icon">
              <ToastIconComponent size={18} />
            </span>
            <p>{toast.message}</p>
          </div>
          <button className="sd__toast-close" onClick={hideToast}>
            <X size={16} />
          </button>
        </div>
      )}

      <aside className="sd__sidebar">
        <div className="sd__logo">
          <LayoutGrid size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
          Seller
        </div>

        <nav className="sd__nav">
          {navItems.map(item => {
            const isLocked = RESTRICTED_TABS.includes(item.id) && hostStatus === 'pending';
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                className={[
                  'sd__nav-item',
                  activePage === item.id ? 'sd__nav-item--active' : '',
                  isLocked ? 'sd__nav-item--locked' : '',
                ].join(' ')}
                onClick={() => handleNavClick(item.id)}
                title={isLocked ? 'Available after host approval' : ''}
              >
                <span className="sd__nav-icon">
                  <ItemIcon size={18} />
                </span>
                <span>{item.label}</span>
                {isLocked && (
                  <span className="sd__nav-lock">
                    <Lock size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pending status banner */}
        {hostStatus === 'pending' && (
          <div className="sd__pending-banner">
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Hourglass size={14} /> Host request pending
            </p>
            <button onClick={() => navigate('/host-requests/status')}>
              View Status
            </button>
          </div>
        )}

        <div className="sd__bottom-nav">
          <button className="sd__nav-item sd__nav-item-bottom" onClick={() => navigate('/')}>
            <span className="sd__nav-icon">
              <Home size={18} />
            </span>
            <span>Back to Main Site</span>
          </button>
          <button
            className="sd__nav-item sd__nav-item-bottom sd__nav-item-logout"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
          >
            <span className="sd__nav-icon">
              <LogOut size={18} />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="sd__content-dashboard">{renderPage()}</div>
    </div>
  );
}