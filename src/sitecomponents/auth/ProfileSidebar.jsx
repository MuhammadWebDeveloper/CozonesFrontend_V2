// ProfileSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    DollarSign, 
    Heart, 
    LogOut, 
    Loader2,
    Phone,
    Mail,
    User,
    AlertCircle,
    RefreshCw,
    ChevronRight,
    Calendar,
    Store
} from 'lucide-react';
import '../../componentstyles/authstyls/ProfileSidebar.css';
import { logout, getCurrentUser, getAuthToken } from '../auth/auth.service.js';
import BaseUrl from '../../utils/AppConstants.jsx';

const ProfileSidebar = () => {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user profile data
    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const token = getAuthToken(); // Get token from localStorage
            
            const response = await fetch(`${BaseUrl}api/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setUserData(data.user);
                setError(null);
            } else {
                setError(data.message || 'Failed to load profile');
                // Fallback to local storage data
                const localUser = getCurrentUser();
                setUserData(localUser);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('Network error loading profile');
            // Fallback to local storage data
            const localUser = getCurrentUser();
            setUserData(localUser);
        } finally {
            setLoading(false);
        }
    };

    const handleMonetizeClick = () => {
        navigate('/seller-dashboard');
    };

    const handleMyBookingsClick = () => {
        navigate('/my-bookings');
    };

    const handleFavouritesClick = () => {
        navigate('/my-favorites');
    };

    const handleLogoutClick = async () => {
        const confirmLogout = window.confirm('Are you sure you want to logout?');
        if (!confirmLogout) return;

        setIsLoggingOut(true);
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/login', { replace: true });
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Get user display name
    const getDisplayName = () => {
        if (userData?.full_name) return userData.full_name;
        if (userData?.name) return userData.name;
        if (userData?.email) return userData.email.split('@')[0];
        return 'User';
    };

    // Get user email
    const getUserEmail = () => {
        return userData?.email || 'No email provided';
    };

    // Get user role badge
    const getRoleBadge = () => {
        const role = userData?.role || 'user';
        if (role === 'admin') return 'Admin';
        if (role === 'seller') return 'Seller';
        if (role === 'user') return 'User';
        return role;
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        const name = getDisplayName();
        if (!name || name === 'User') return 'U';
        return name.charAt(0).toUpperCase();
    };

    // Get user phone
    const getUserPhone = () => {
        return userData?.phone || 'No phone number';
    };

    return (
        <div className="ProfileSidebar_profileCard">
            <div className="ProfileSidebar_profileInner">
                <div className="ProfileSidebar_profileHeader">
                    <div className="ProfileSidebar_avatarSection">
                        <div className="ProfileSidebar_avatar">
                            {loading ? (
                                <div className="ProfileSidebar_avatarLoader"></div>
                            ) : (
                                <span className="ProfileSidebar_avatarInitials">
                                    {getUserInitials()}
                                </span>
                            )}
                        </div>
                        <div className="ProfileSidebar_nameSection">
                            {loading ? (
                                <>
                                    <div className="ProfileSidebar_skeletonName"></div>
                                    <div className="ProfileSidebar_skeletonEmail"></div>
                                </>
                            ) : (
                                <>
                                    <h2>{getDisplayName()}</h2>
                                    <p className="ProfileSidebar_email">
                                        <Mail size={14} style={{ marginRight: '4px', display: 'inline' }} />
                                        {getUserEmail()}
                                    </p>
                                    {userData?.phone && (
                                        <p className="ProfileSidebar_phone">
                                            <Phone size={14} style={{ marginRight: '4px', display: 'inline' }} />
                                            {getUserPhone()}
                                        </p>
                                    )}
                                    <span className="ProfileSidebar_roleBadge">{getRoleBadge()}</span>
                                </>
                            )}
                        </div>
                    </div>
                    {/* <div className="ProfileSidebar_viewProfile">
                        <span 
                            className="ProfileSidebar_viewProfileLink" 
                            onClick={() => navigate('/profile')}
                        >
                            View Profile <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                        </span>
                    </div> */}
                </div>

                {error && !loading && (
                    <div className="ProfileSidebar_error">
                        <p>
                            <AlertCircle size={16} style={{ marginRight: '8px', display: 'inline' }} />
                            {error}
                        </p>
                        <button onClick={fetchUserProfile} className="ProfileSidebar_retryBtn">
                            <RefreshCw size={14} style={{ marginRight: '6px' }} />
                            Retry
                        </button>
                    </div>
                )}

                <div className="ProfileSidebar_profileMenu">
                    <div className="ProfileSidebar_menuItem" onClick={handleMonetizeClick}>
                        <span className="ProfileSidebar_menuIcon">
                            <Store size={18} />
                        </span>
                        <span className="ProfileSidebar_menuText">Monetize Your Space</span>
                    </div>

                    <div className="ProfileSidebar_menuItem" onClick={handleMyBookingsClick}>
                        <span className="ProfileSidebar_menuIcon">
                            <Calendar size={18} />
                        </span>
                        <span className="ProfileSidebar_menuText">My Bookings</span>
                    </div>

                    <div className="ProfileSidebar_menuItem" onClick={handleFavouritesClick}>
                        <span className="ProfileSidebar_menuIcon">
                            <Heart size={18} />
                        </span>
                        <span className="ProfileSidebar_menuText">Favourites</span>
                    </div>

                    <div
                        className={`ProfileSidebar_menuItem ProfileSidebar_logoutItem ${isLoggingOut ? 'disabled' : ''}`}
                        onClick={!isLoggingOut ? handleLogoutClick : undefined}
                        style={{
                            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                            opacity: isLoggingOut ? 0.6 : 1
                        }}
                    >
                        <span className="ProfileSidebar_menuIcon">
                            {isLoggingOut ? (
                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <LogOut size={18} />
                            )}
                        </span>
                        <span className="ProfileSidebar_menuText">
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSidebar;