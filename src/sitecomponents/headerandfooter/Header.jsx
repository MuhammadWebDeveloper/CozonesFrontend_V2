// Navbar.jsx - Updated with My Favorites link
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiSearch, FiGlobe, FiMenu, FiUser, FiHome, FiStar, FiHelpCircle, FiSettings, FiLogIn, FiUserPlus, FiLogOut, FiUserCheck, FiHeart } from 'react-icons/fi';
import { MdOutlineLocationOn, MdOutlineDateRange, MdPeopleOutline } from 'react-icons/md';
import { IoCloseOutline } from 'react-icons/io5';
import axios from 'axios';
import '../../componentstyles/headerandfooterstyles/header.css';
import logo from '../../assets/logo.png';
import { logout } from '../auth/auth.service';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeSearchField, setActiveSearchField] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [destination, setDestination] = useState('');
    const [dates, setDates] = useState('');
    const [guests, setGuests] = useState({ adults: 0, children: 0, infants: 0 });

    const apiClient = axios.create({
        baseURL: 'http://localhost:4343/',
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
    });

    useEffect(() => { checkAuth(); }, []);

    const checkAuth = () => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setIsAuthenticated(true);
            setUser(JSON.parse(userData));
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    const handleLogin = async (email, password) => {
        try {
            const response = await apiClient.post('api/auth/login', { email, password });
            if (response.data.success) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setIsAuthenticated(true);
                setUser(user);
                setIsMenuDropdownOpen(false);
                navigate('/');
                return { success: true };
            }
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const handleRegister = async (userData) => {
        try {
            const response = await apiClient.post('api/auth/register', userData);
            if (response.data.success) {
                return await handleLogin(userData.email, userData.password);
            }
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };



    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const response = await apiClient.put('api/auth/profile', profileForm);
            if (response.data.success) {
                const updatedUser = { ...user, ...profileForm };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setShowProfileModal(false);
                alert('Profile updated successfully!');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };
    // const handleLogout = async () => {
    //     const confirmLogout = window.confirm('Are you sure you want to logout?');
    //     if (!confirmLogout) return;

    //     // Show loading state (optional)
    //     const logoutBtn = document.activeElement;
    //     const originalText = logoutBtn?.innerText;
    //     if (logoutBtn) logoutBtn.innerText = 'Logging out...';

    //     try {
    //         await logout(); // This now handles both backend call and local cleanup
    //         setIsAuthenticated(false);
    //         setUser(null);
    //         setIsMenuDropdownOpen(false);
    //         navigate('/', { replace: true });
    //     } catch (error) {
    //         console.error('Logout error:', error);
    //         // Force cleanup and redirect even on error
    //         localStorage.removeItem('token');
    //         localStorage.removeItem('user');
    //         navigate('/', { replace: true });
    //     } finally {
    //         if (logoutBtn) logoutBtn.innerText = originalText;
    //     }
    // };
    const handleLogout = async () => {
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

    const openProfileModal = () => {
        if (user) {
            setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
            setShowProfileModal(true);
            setIsMenuDropdownOpen(false);
        }
    };

    const toggleLangDropdown = () => { setIsLangDropdownOpen(!isLangDropdownOpen); setIsMenuDropdownOpen(false); setIsSearchOpen(false); setShowResults(false); };
    const toggleMenuDropdown = () => { setIsMenuDropdownOpen(!isMenuDropdownOpen); setIsLangDropdownOpen(false); setIsSearchOpen(false); setShowResults(false); };
    const openSearch = (field) => { setActiveSearchField(field); setIsSearchOpen(true); setIsLangDropdownOpen(false); setIsMenuDropdownOpen(false); setShowResults(false); };
    const closeSearch = () => { setIsSearchOpen(false); setActiveSearchField(null); setShowResults(false); };

    const dummyProperties = [
        { id: 1, name: "Luxury Beach Villa", location: "Miami", price: "$299/night", rating: 4.9, icon: "🏖️", guests: 4 },
        { id: 2, name: "Downtown Modern Apartment", location: "New York", price: "$199/night", rating: 4.8, icon: "🏢", guests: 2 },
        { id: 3, name: "Cozy Mountain Cabin", location: "Los Angeles", price: "$159/night", rating: 4.7, icon: "🏔️", guests: 3 }
    ];

    const fetchSearchResults = async (searchParams) => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        let filtered = [...dummyProperties];
        if (searchParams.destination) filtered = filtered.filter(p => p.location.toLowerCase().includes(searchParams.destination.toLowerCase()));
        const totalGuests = searchParams.guests.adults + searchParams.guests.children;
        if (totalGuests > 0) filtered = filtered.filter(p => p.guests >= totalGuests);
        setSearchResults(filtered);
        setIsLoading(false);
        setShowResults(true);
        closeSearch();
    };

    const handleSearch = async () => { await fetchSearchResults({ destination, dates, guests }); };
    const updateGuests = (type, op) => setGuests(prev => ({ ...prev, [type]: op === 'increment' ? prev[type] + 1 : Math.max(0, prev[type] - 1) }));
    const getGuestDisplayText = () => { const t = guests.adults + guests.children; return t === 0 ? "Add guests" : t === 1 ? "1 guest" : `${t} guests`; };
    const popularDestinations = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'London', 'Paris', 'Tokyo', 'Dubai', 'Sydney'];

    return (
        <>
            <nav className="Navbar-container">
                <div className="Navbar-row">
                    <div className="Navbar-leftSection">
                        <Link to="/" className="Navbar-logo">
                            <img src={logo} alt="logo" />
                        </Link>
                    </div>

                    <div className="Navbar-searchWrapper">
                        <div className="Navbar-searchPill">
                            <div className={`Navbar-searchField ${activeSearchField === 'where' ? 'Navbar-active' : ''}`} onClick={() => openSearch('where')}>
                                <span className="Navbar-label">Where</span>
                                <div className="Navbar-inputWrapper">
                                    <MdOutlineLocationOn className="Navbar-fieldIcon" />
                                    <input className="Navbar-input" type="text" placeholder="Search destinations" value={destination} onChange={(e) => setDestination(e.target.value)} onFocus={() => openSearch('where')} />
                                </div>
                            </div>
                            <div className="Navbar-divider"></div>
                            <div className={`Navbar-searchField ${activeSearchField === 'when' ? 'Navbar-active' : ''}`} onClick={() => openSearch('when')}>
                                <span className="Navbar-label">When</span>
                                <div className="Navbar-inputWrapper">
                                    <MdOutlineDateRange className="Navbar-fieldIcon" />
                                    <input className="Navbar-input" type="text" placeholder="Add dates" value={dates} onChange={(e) => setDates(e.target.value)} onFocus={() => openSearch('when')} />
                                </div>
                            </div>
                            <div className="Navbar-divider"></div>
                            <div className={`Navbar-searchField ${activeSearchField === 'who' ? 'Navbar-active' : ''}`} onClick={() => openSearch('who')}>
                                <span className="Navbar-label">Who</span>
                                <div className="Navbar-inputWrapper">
                                    <MdPeopleOutline className="Navbar-fieldIcon" />
                                    <input className="Navbar-input" type="text" placeholder="Add guests" value={getGuestDisplayText()} readOnly onFocus={() => openSearch('who')} />
                                </div>
                            </div>
                            <button className="Navbar-searchSubmit" onClick={handleSearch}>
                                <FiSearch size={20} color="white" />
                            </button>
                        </div>

                        {isSearchOpen && (
                            <div className="Navbar-searchModal">
                                <div className="Navbar-searchModalContent">
                                    <div className="Navbar-searchModalHeader">
                                        <h3>Search {activeSearchField === 'where' ? 'destinations' : activeSearchField === 'when' ? 'dates' : 'guests'}</h3>
                                        <button className="Navbar-searchModalClose" onClick={closeSearch}><IoCloseOutline size={24} /></button>
                                    </div>
                                    {activeSearchField === 'where' && (
                                        <div className="Navbar-searchModalBody">
                                            <input type="text" className="Navbar-searchModalInput" placeholder="Search for cities, countries, or landmarks" value={destination} onChange={(e) => setDestination(e.target.value)} autoFocus />
                                            <div className="Navbar-popularDestinations">
                                                <h4>Popular destinations</h4>
                                                <div className="Navbar-destinationList">
                                                    {popularDestinations.map(city => (
                                                        <div key={city} className="Navbar-destinationItem" onClick={() => { setDestination(city); handleSearch(); }}>{city}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeSearchField === 'who' && (
                                        <div className="Navbar-searchModalBody">
                                            <div className="Navbar-guestsSection">
                                                {['adults', 'children', 'infants'].map(type => (
                                                    <div key={type} className="Navbar-guestType">
                                                        <div>
                                                            <h4>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                                                            <p>{type === 'adults' ? 'Ages 13 or above' : type === 'children' ? 'Ages 2-12' : 'Under 2'}</p>
                                                        </div>
                                                        <div className="Navbar-counter">
                                                            <button onClick={() => updateGuests(type, 'decrement')}>-</button>
                                                            <span>{guests[type]}</span>
                                                            <button onClick={() => updateGuests(type, 'increment')}>+</button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button className="Navbar-searchConfirmBtn" onClick={() => { closeSearch(); handleSearch(); }}>Apply & Search</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="Navbar-userActions">
                        <Link to="/become-host" className="Navbar-hostBtn">Become a host</Link>

                        <div className="Navbar-langBtn" onClick={toggleLangDropdown}>
                            <FiGlobe size={20} />
                            {isLangDropdownOpen && (
                                <div className="Navbar-dropdown">
                                    <div className="Navbar-dropdownItem">English (US)</div>
                                    <div className="Navbar-dropdownItem">Español</div>
                                    <div className="Navbar-dropdownItem">Français</div>
                                    <div className="Navbar-dropdownItem">Deutsch</div>
                                </div>
                            )}
                        </div>

                        <div className="Navbar-menuBtn" onClick={toggleMenuDropdown}>
                            <FiMenu size={18} />
                            <div className="Navbar-avatar">
                                {user?.avatar ? <img src={user.avatar} alt="avatar" /> : <FiUser size={18} />}
                            </div>
                            {isMenuDropdownOpen && (
                                <div className="Navbar-dropdown Navbar-menuDropdown">
                                    {!isAuthenticated ? (
                                        <>
                                            <div className="Navbar-dropdownItem" onClick={() => navigate('/register')}>
                                                <FiUserPlus size={16} /> Sign up
                                            </div>
                                            <div className="Navbar-dropdownItem" onClick={() => navigate('/login')}>
                                                <FiLogIn size={16} /> Log in
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* <div className="Navbar-dropdownItem" onClick={openProfileModal} onClick={() => navigate('/register')}> */}
                                            <div className="Navbar-dropdownItem" onClick={() => navigate('/My-Profile')}>
                                                <FiUserCheck size={16} /> My Profile
                                            </div>
                                            <div className="Navbar-dropdownItem" onClick={() => navigate('/my-bookings')}>
                                                <FiHome size={16} /> My Bookings
                                            </div>

                                            {/* ✅ NEW: My Favorites link */}
                                            <div className="Navbar-dropdownItem Navbar-favoritesItem" onClick={() => { navigate('/my-favorites'); setIsMenuDropdownOpen(false); }}>
                                                <FiHeart size={16} className="Navbar-favIcon" /> My Favorites
                                            </div>

                                            <div className="Navbar-dropdownDivider"></div>
                                            <div className="Navbar-dropdownItem" onClick={() => navigate('/')}>
                                                <FiStar size={16} /> Cozones Home
                                            </div>
                                            <div className="Navbar-dropdownDivider"></div>
                                            {/* <div className="Navbar-dropdownItem" onClick={() => navigate('/help')}>
                                                <FiHelpCircle size={16} /> Help
                                            </div> */}
                                            {/* <div className="Navbar-dropdownItem" onClick={() => navigate('/settings')}>
                                                <FiSettings size={16} /> Settings
                                            </div> */}
                                            <div className="Navbar-dropdownDivider"></div>
                                            <div className="Navbar-dropdownItem" onClick={handleLogout}>
                                                <FiLogOut size={16} /> Log out
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {showResults && (
                    <div className="Navbar-resultsOverlay">
                        <div className="Navbar-resultsModal">
                            <div className="Navbar-resultsHeader">
                                <h3>Search Results {isLoading ? '...' : `(${searchResults.length})`}</h3>
                                <button className="Navbar-resultsClose" onClick={() => setShowResults(false)}><IoCloseOutline size={24} /></button>
                            </div>
                            <div className="Navbar-resultsBody">
                                {isLoading ? (
                                    <div className="Navbar-loading"><div className="Navbar-spinner"></div><p>Searching for properties...</p></div>
                                ) : searchResults.length > 0 ? (
                                    <div className="Navbar-resultsList">
                                        {searchResults.map(property => (
                                            <div key={property.id} className="Navbar-resultItem">
                                                <div className="Navbar-resultImage">{property.icon}</div>
                                                <div className="Navbar-resultInfo">
                                                    <h4>{property.name}</h4>
                                                    <p className="Navbar-resultLocation">{property.location}</p>
                                                    <div className="Navbar-resultDetails">
                                                        <span className="Navbar-resultRating">⭐ {property.rating}</span>
                                                        <span className="Navbar-resultPrice">{property.price}</span>
                                                    </div>
                                                    <button className="Navbar-resultViewBtn" onClick={() => navigate(`/spaces/${property.id}`)}>View Details</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="Navbar-noResults"><p>No properties found matching your criteria.</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {showProfileModal && (
                <div className="Navbar-profileModal">
                    <div className="Navbar-profileModalContent">
                        <div className="Navbar-profileModalHeader">
                            <h3>Edit Profile</h3>
                            <button onClick={() => setShowProfileModal(false)}><IoCloseOutline size={24} /></button>
                        </div>
                        <form onSubmit={handleProfileUpdate}>
                            <div className="Navbar-profileFormGroup">
                                <label>Full Name</label>
                                <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
                            </div>
                            <div className="Navbar-profileFormGroup">
                                <label>Email</label>
                                <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required />
                            </div>
                            <div className="Navbar-profileFormGroup">
                                <label>Phone Number</label>
                                <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                            </div>
                            <button type="submit" className="Navbar-profileUpdateBtn" disabled={isUpdating}>
                                {isUpdating ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;