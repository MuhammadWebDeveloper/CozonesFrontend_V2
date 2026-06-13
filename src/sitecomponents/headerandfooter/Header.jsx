// Header.jsx - Fully Responsive with Perfect Hamburger Menu & Latest Logo
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiSearch, FiGlobe, FiMenu, FiUser, FiHome, FiStar, FiLogIn, FiUserPlus, FiLogOut, FiUserCheck, FiHeart, FiMessageCircle, FiCalendar, FiX, FiChevronDown } from 'react-icons/fi';
import { MdOutlineLocationOn, MdOutlineDateRange } from 'react-icons/md';
import { IoCloseOutline } from 'react-icons/io5';
import axios from 'axios';
import '../../componentstyles/headerandfooterstyles/header.css';
import favicon from '../../assets/favicon.png';
import logoText from '../../assets/logo.png';
import { logout } from '../auth/auth.service';
import BaseUrl from '../../utils/AppConstants';

const Header = () => {
    const navigate = useNavigate();
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSearchField, setActiveSearchField] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isCheckingHost, setIsCheckingHost] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);

    // Search state
    const [destination, setDestination] = useState('');
    const [selectedSpaceType, setSelectedSpaceType] = useState('');
    const [timeSlot, setTimeSlot] = useState({ startTime: '', endTime: '' });
    const [tempTimeSlot, setTempTimeSlot] = useState({ startTime: '', endTime: '' });

    // Cache for all spaces
    const [allSpacesCache, setAllSpacesCache] = useState([]);
    const [isCacheLoaded, setIsCacheLoaded] = useState(false);
    const [locationsList, setLocationsList] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Space type options
    const spaceTypes = [
        { value: 'open_desk', label: 'Open Desk', icon: '🖥️' },
        { value: 'dedicated_desk', label: 'Dedicated Desk', icon: '💺' },
        { value: 'private_cabin', label: 'Private Desk', icon: '🚪' },
        { value: 'meeting_room', label: 'Meeting Rooms', icon: '👥' }
    ];

    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
    });

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            const newIsTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

            setIsMobile(newIsMobile);
            setIsTablet(newIsTablet);

            if (!newIsMobile) {
                setIsMobileMenuOpen(false);
                setIsMobileSearchOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobileMenuOpen && !event.target.closest('.Navbar-mobileMenu') && !event.target.closest('.Navbar-menuBtn')) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isMobileMenuOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen || isMobileSearchOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen, isMobileSearchOpen]);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (!isCacheLoaded && !isSearching) {
            fetchAllSpacesForSearch();
        }
    }, []);

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

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setUnreadCount(0);
                return;
            }

            const response = await axios.get(`${BaseUrl}api/chats/chat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const chats = response.data?.data || response.data?.chats || [];
            let totalUnread = 0;
            chats.forEach(chat => {
                const unread = parseInt(chat.unread_count) || 0;
                if (unread > 0) totalUnread += unread;
            });

            setUnreadCount(totalUnread);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
            setUnreadCount(0);
        }
    };

    const fetchAllSpacesForSearch = async () => {
        if (isCacheLoaded || isSearching) return;

        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const unitTypes = ['open_desks', 'dedicated_desks', 'private_cabins', 'meeting_rooms'];
            const allSpaces = [];
            const uniqueLocations = new Set();

            const promises = unitTypes.map(type =>
                apiClient.get(`api/spaces/unit/${type}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                }).catch(err => {
                    console.warn(`Failed to fetch ${type}:`, err);
                    return { data: { success: false, units: [] } };
                })
            );

            const responses = await Promise.all(promises);

            responses.forEach(response => {
                if (response.data?.success && response.data?.units?.length > 0) {
                    response.data.units
                        .filter(unit => unit.is_active === true)
                        .forEach(unit => {
                            let bestRate = null;
                            if (unit.hourly_rate && parseFloat(unit.hourly_rate) > 0) {
                                bestRate = { display: `PKR ${parseFloat(unit.hourly_rate).toLocaleString()}/hour`, type: 'hourly', value: parseFloat(unit.hourly_rate) };
                            } else if (unit.daily_rate && parseFloat(unit.daily_rate) > 0) {
                                bestRate = { display: `PKR ${parseFloat(unit.daily_rate).toLocaleString()}/day`, type: 'daily', value: parseFloat(unit.daily_rate) };
                            } else if (unit.monthly_rate && parseFloat(unit.monthly_rate) > 0) {
                                bestRate = { display: `PKR ${parseFloat(unit.monthly_rate).toLocaleString()}/month`, type: 'monthly', value: parseFloat(unit.monthly_rate) };
                            }

                            let unitTypeDisplay = '';
                            let navigatePath = '';
                            switch (unit.unit_type) {
                                case 'open_desk':
                                    unitTypeDisplay = 'Open Desk';
                                    navigatePath = `/spaces/${unit.id}`;
                                    break;
                                case 'dedicated_desk':
                                    unitTypeDisplay = 'Dedicated Desk';
                                    navigatePath = `/dedicated-desk/${unit.id}`;
                                    break;
                                case 'private_cabin':
                                    unitTypeDisplay = 'Private Cabin';
                                    navigatePath = `/private-cabins/${unit.id}`;
                                    break;
                                case 'meeting_room':
                                    unitTypeDisplay = 'Meeting Room';
                                    navigatePath = `/meeting-rooms/${unit.id}`;
                                    break;
                                default:
                                    unitTypeDisplay = 'Space';
                                    navigatePath = `/spaces/${unit.id}`;
                            }

                            const space = {
                                id: unit.id,
                                space_id: unit.space_id,
                                title: unit.name || unitTypeDisplay,
                                location: unit.city || unit.address || "Coworking Space",
                                price: bestRate ? bestRate.display : "Contact for pricing",
                                priceValue: bestRate ? bestRate.value : 0,
                                rating: 4.5,
                                capacity: unit.total_capacity || unit.capacity || 1,
                                images: unit.images?.length > 0 ? unit.images[0] : null,
                                unit_type: unit.unit_type,
                                unit_type_display: unitTypeDisplay,
                                navigateTo: navigatePath,
                                operatingHours: { start: "09:00", end: "18:00" }
                            };

                            allSpaces.push(space);

                            if (unit.city) uniqueLocations.add(unit.city);
                            if (unit.address) uniqueLocations.add(unit.address);
                        });
                }
            });

            setAllSpacesCache(allSpaces);
            setLocationsList(Array.from(uniqueLocations).sort());
            setIsCacheLoaded(true);

        } catch (error) {
            console.error('Error fetching spaces:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const formatTimeDisplay = () => {
        if (timeSlot.startTime && timeSlot.endTime) {
            return `${timeSlot.startTime} - ${timeSlot.endTime}`;
        } else if (timeSlot.startTime) {
            return timeSlot.startTime;
        }
        return '';
    };

    const getSpaceTypeDisplayText = () => {
        if (!selectedSpaceType) return "Select space type";
        const spaceType = spaceTypes.find(st => st.value === selectedSpaceType);
        return spaceType ? `${spaceType.icon} ${spaceType.label}` : "Select space type";
    };

    const getShortSpaceTypeDisplayText = () => {
        if (!selectedSpaceType) return "Type";
        const spaceType = spaceTypes.find(st => st.value === selectedSpaceType);
        return spaceType ? spaceType.icon : "🏢";
    };

    const isTimeInOperatingHours = (spaceOperatingHours, startTime, endTime) => {
        if (!startTime || !endTime) return true;
        const operatingStart = spaceOperatingHours?.start || "09:00";
        const operatingEnd = spaceOperatingHours?.end || "18:00";
        return startTime >= operatingStart && endTime <= operatingEnd;
    };

    const performSearch = useCallback(async () => {
        if (!allSpacesCache.length) return;

        try {
            let filteredSpaces = [...allSpacesCache];

            if (destination && destination.trim() !== '') {
                const searchTerm = destination.toLowerCase().trim();
                filteredSpaces = filteredSpaces.filter(space =>
                    space.location.toLowerCase().includes(searchTerm) ||
                    space.title.toLowerCase().includes(searchTerm)
                );
            }

            if (selectedSpaceType && selectedSpaceType !== '') {
                filteredSpaces = filteredSpaces.filter(space =>
                    space.unit_type === selectedSpaceType
                );
            }

            if (timeSlot.startTime && timeSlot.endTime) {
                filteredSpaces = filteredSpaces.filter(space =>
                    isTimeInOperatingHours(space.operatingHours, timeSlot.startTime, timeSlot.endTime)
                );
            }

            filteredSpaces.sort((a, b) => {
                if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0);
                return (a.priceValue || 0) - (b.priceValue || 0);
            });

            const params = new URLSearchParams();
            if (destination) params.append('destination', destination);
            if (selectedSpaceType) params.append('type', selectedSpaceType);
            if (timeSlot.startTime) params.append('startTime', timeSlot.startTime);
            if (timeSlot.endTime) params.append('endTime', timeSlot.endTime);

            navigate(`/search-results?${params.toString()}`);
            closeSearch();
            setIsMobileSearchOpen(false);
            setIsMobileMenuOpen(false);

        } catch (error) {
            console.error('Search error:', error);
            alert('An error occurred while searching. Please try again.');
        }
    }, [destination, selectedSpaceType, timeSlot, allSpacesCache, navigate]);

    const handleSearch = async () => {
        if (!destination.trim() && !selectedSpaceType && !timeSlot.startTime) {
            alert('Please enter at least one search criteria (destination, space type, or time)');
            return;
        }
        await performSearch();
    };

    const handleQuickSearch = (type, value) => {
        switch (type) {
            case 'destination':
                setDestination(value);
                break;
            case 'spaceType':
                setSelectedSpaceType(value);
                break;
            case 'time':
                setTimeSlot({ startTime: "09:00", endTime: "17:00" });
                break;
        }
        setTimeout(() => handleSearch(), 100);
    };

    const applyTime = () => {
        if (tempTimeSlot.startTime && tempTimeSlot.endTime) {
            setTimeSlot(tempTimeSlot);
        } else if (tempTimeSlot.startTime) {
            setTimeSlot({ startTime: tempTimeSlot.startTime, endTime: '' });
        }
        closeSearch();
        handleSearch();
    };

    const clearFilters = () => {
        setDestination('');
        setSelectedSpaceType('');
        setTimeSlot({ startTime: '', endTime: '' });
        setTempTimeSlot({ startTime: '', endTime: '' });
    };

    const handleBecomeHostClick = async () => {
        setIsMobileMenuOpen(false);
        setIsMenuDropdownOpen(false);
        if (!isAuthenticated) {
            alert('Please login to become a host');
            navigate('/login');
            return;
        }
        navigate('/become-host');
    };

    const handleLogout = async () => {
        const confirmLogout = window.confirm('Are you sure you want to logout?');
        if (!confirmLogout) return;
        setIsLoggingOut(true);
        try {
            await logout();
            setIsMobileMenuOpen(false);
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/login', { replace: true });
        } finally {
            setIsLoggingOut(false);
        }
    };

    const toggleLangDropdown = () => {
        setIsLangDropdownOpen(!isLangDropdownOpen);
        setIsMenuDropdownOpen(false);
        setIsSearchOpen(false);
    };

    const toggleMenuDropdown = () => {
        if (isMobile) {
            setIsMobileMenuOpen(!isMobileMenuOpen);
        } else {
            setIsMenuDropdownOpen(!isMenuDropdownOpen);
        }
        setIsLangDropdownOpen(false);
        setIsSearchOpen(false);
    };

    const openSearch = (field) => {
        setActiveSearchField(field);
        setIsSearchOpen(true);
        setIsLangDropdownOpen(false);
        setIsMenuDropdownOpen(false);
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
        setActiveSearchField(null);
    };

    const openMobileSearch = () => {
        setIsMobileSearchOpen(true);
        setIsMobileMenuOpen(false);
    };

    const closeMobileSearch = () => {
        setIsMobileSearchOpen(false);
        closeSearch();
    };

    const popularDestinations = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Multan', 'Faisalabad', 'Peshawar', 'Quetta'];

    // ── Logo helper (updated for perfect responsive display) ──────────────────────
    const LogoContent = () => (
        <>
            <img src={favicon} alt="Cozones icon" className="Navbar-logoIcon" />
            <img src={logoText} alt="COZONES" className="Navbar-logoText" />
        </>
    );

    // Mobile Menu Component
    const MobileMenu = () => (
        <div className="Navbar-mobileMenuOverlay">
            <div className="Navbar-mobileMenu">
                <div className="Navbar-mobileMenuHeader">
                    <div className="Navbar-mobileMenuLogo">
                        <LogoContent />
                    </div>
                    <button className="Navbar-mobileMenuClose" onClick={() => setIsMobileMenuOpen(false)}>
                        <FiX size={24} />
                    </button>
                </div>

                <div className="Navbar-mobileMenuContent">
                    {!isAuthenticated ? (
                        <>
                            <button className="Navbar-mobileMenuItem" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>
                                <FiLogIn size={20} />
                                Log in
                            </button>
                            <button className="Navbar-mobileMenuItem Navbar-mobileMenuItemPrimary" onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}>
                                <FiUserPlus size={20} />
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="Navbar-mobileMenuItem" onClick={() => { navigate('/My-Profile'); setIsMobileMenuOpen(false); }}>
                                <FiUserCheck size={20} />
                                My Profile
                            </button>
                            <button className="Navbar-mobileMenuItem" onClick={() => { navigate('/chats'); setIsMobileMenuOpen(false); }}>
                                <FiMessageCircle size={20} />
                                Messages
                                {unreadCount > 0 && <span className="Navbar-mobileUnreadBadge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                            </button>
                            <button className="Navbar-mobileMenuItem" onClick={() => { navigate('/my-bookings'); setIsMobileMenuOpen(false); }}>
                                <FiHome size={20} />
                                My Bookings
                            </button>
                            <button className="Navbar-mobileMenuItem" onClick={() => { navigate('/my-favorites'); setIsMobileMenuOpen(false); }}>
                                <FiHeart size={20} />
                                My Favorites
                            </button>
                            <div className="Navbar-mobileDivider"></div>
                            <button className="Navbar-mobileMenuItem" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>
                                <FiStar size={20} />
                                Cozones Home
                            </button>
                            <button className="Navbar-mobileMenuItem" onClick={handleBecomeHostClick}>
                                <FiStar size={20} />
                                Become a host
                            </button>
                            <div className="Navbar-mobileDivider"></div>
                            <button className="Navbar-mobileMenuItem Navbar-mobileMenuItemLogout" onClick={handleLogout}>
                                <FiLogOut size={20} />
                                Log out
                            </button>
                        </>
                    )}

                    <div className="Navbar-mobileDivider"></div>
                </div>
            </div>
        </div>
    );

    // Mobile Search Component
    const MobileSearchModal = () => (
        <div className="Navbar-mobileSearchOverlay">
            <div className="Navbar-mobileSearchContainer">
                <div className="Navbar-mobileSearchHeader">
                    <h3>Search Spaces</h3>
                    <button className="Navbar-mobileSearchClose" onClick={closeMobileSearch}>
                        <FiX size={24} />
                    </button>
                </div>

                <div className="Navbar-mobileSearchFields">
                    <div className="Navbar-mobileSearchField">
                        <label>
                            <MdOutlineLocationOn className="Navbar-mobileFieldIcon" />
                            Where
                        </label>
                        <input
                            type="text"
                            placeholder="Search destinations"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                        />
                    </div>

                    <div className="Navbar-mobileSearchField">
                        <label>
                            <span className="Navbar-mobileFieldIcon">🏢</span>
                            Which
                        </label>
                        <select
                            value={selectedSpaceType}
                            onChange={(e) => setSelectedSpaceType(e.target.value)}
                        >
                            <option value="">Select space type</option>
                            {spaceTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="Navbar-mobileSearchField">
                        <label>
                            <FiCalendar className="Navbar-mobileFieldIcon" />
                            When
                        </label>
                        <div className="Navbar-mobileTimeRange">
                            <input
                                type="time"
                                placeholder="Start time"
                                value={timeSlot.startTime}
                                onChange={(e) => setTimeSlot({ ...timeSlot, startTime: e.target.value })}
                            />
                            <span>to</span>
                            <input
                                type="time"
                                placeholder="End time"
                                value={timeSlot.endTime}
                                onChange={(e) => setTimeSlot({ ...timeSlot, endTime: e.target.value })}
                                disabled={!timeSlot.startTime}
                            />
                        </div>
                    </div>
                </div>

                <div className="Navbar-mobileSearchActions">
                    <button className="Navbar-mobileClearBtn" onClick={clearFilters}>
                        Clear all
                    </button>
                    <button className="Navbar-mobileSearchBtn" onClick={() => {
                        handleSearch();
                        closeMobileSearch();
                    }}>
                        <FiSearch size={20} />
                        Search
                    </button>
                </div>

                <div className="Navbar-mobileQuickFilters">
                    <div className="Navbar-mobileQuickFilterTitle">Popular destinations:</div>
                    <div className="Navbar-mobileQuickFilterList">
                        {popularDestinations.slice(0, 4).map(city => (
                            <button
                                key={city}
                                className="Navbar-mobileQuickFilter"
                                onClick={() => {
                                    setDestination(city);
                                    handleSearch();
                                    closeMobileSearch();
                                }}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // Desktop Search Modal
    const DesktopSearchModal = () => (
        <div className="Navbar-searchModal">
            <div className="Navbar-searchModalContent">
                <div className="Navbar-searchModalHeader">
                    <h3>
                        {activeSearchField === 'where' && 'Search destinations'}
                        {activeSearchField === 'which' && 'Select space type'}
                        {activeSearchField === 'when' && 'Select time'}
                    </h3>
                    <button className="Navbar-searchModalClose" onClick={closeSearch}>
                        <IoCloseOutline size={24} />
                    </button>
                </div>

                {activeSearchField === 'where' && (
                    <div className="Navbar-searchModalBody">
                        <input
                            type="text"
                            className="Navbar-searchModalInput"
                            placeholder="Search for cities or spaces"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            autoFocus
                        />
                        <div className="Navbar-popularDestinations">
                            <h4>Popular destinations in Pakistan</h4>
                            <div className="Navbar-destinationList">
                                {popularDestinations.map(city => (
                                    <div key={city} className="Navbar-destinationItem" onClick={() => handleQuickSearch('destination', city)}>
                                        {city}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button className="Navbar-searchConfirmBtn" onClick={() => { closeSearch(); handleSearch(); }}>
                            Search {destination && `"${destination}"`}
                        </button>
                    </div>
                )}

                {activeSearchField === 'which' && (
                    <div className="Navbar-searchModalBody">
                        <div className="Navbar-spaceTypes">
                            {spaceTypes.map(spaceType => (
                                <div
                                    key={spaceType.value}
                                    className={`Navbar-spaceTypeItem ${selectedSpaceType === spaceType.value ? 'Navbar-selected' : ''}`}
                                    onClick={() => {
                                        setSelectedSpaceType(spaceType.value);
                                        handleQuickSearch('spaceType', spaceType.value);
                                    }}
                                >
                                    <span className="Navbar-spaceTypeIcon">{spaceType.icon}</span>
                                    <div className="Navbar-spaceTypeInfo">
                                        <h4>{spaceType.label}</h4>
                                    </div>
                                    {selectedSpaceType === spaceType.value && (
                                        <span className="Navbar-checkMark">✓</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSearchField === 'when' && (
                    <div className="Navbar-searchModalBody">
                        <div className="Navbar-timeRange">
                            <div className="Navbar-timeField">
                                <label>Start Time</label>
                                <input
                                    type="time"
                                    className="Navbar-timeInput"
                                    value={tempTimeSlot.startTime}
                                    onChange={(e) => setTempTimeSlot({ ...tempTimeSlot, startTime: e.target.value })}
                                />
                            </div>
                            <div className="Navbar-timeField">
                                <label>End Time</label>
                                <input
                                    type="time"
                                    className="Navbar-timeInput"
                                    value={tempTimeSlot.endTime}
                                    onChange={(e) => setTempTimeSlot({ ...tempTimeSlot, endTime: e.target.value })}
                                    disabled={!tempTimeSlot.startTime}
                                />
                            </div>
                        </div>
                        <div className="Navbar-quickTimes">
                            <h4>Quick selections</h4>
                            <div className="Navbar-quickTimeList">
                                <button className="Navbar-quickTimeBtn" onClick={() => setTempTimeSlot({ startTime: "09:00", endTime: "13:00" })}>
                                    Morning (9AM - 1PM)
                                </button>
                                <button className="Navbar-quickTimeBtn" onClick={() => setTempTimeSlot({ startTime: "13:00", endTime: "17:00" })}>
                                    Afternoon (1PM - 5PM)
                                </button>
                                <button className="Navbar-quickTimeBtn" onClick={() => setTempTimeSlot({ startTime: "09:00", endTime: "17:00" })}>
                                    Full Day (9AM - 5PM)
                                </button>
                            </div>
                        </div>
                        <button className="Navbar-searchConfirmBtn" onClick={applyTime}>
                            Apply time
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // Compact search for tablet
    const TabletSearchBar = () => (
        <div className="Navbar-tabletSearch">
            <div className="Navbar-tabletSearchFields">
                <div className="Navbar-tabletSearchField" onClick={() => openSearch('where')}>
                    <MdOutlineLocationOn size={18} />
                    <span>{destination || "Where"}</span>
                </div>
                <div className="Navbar-tabletSearchField" onClick={() => openSearch('which')}>
                    <span>{getShortSpaceTypeDisplayText()}</span>
                </div>
                <div className="Navbar-tabletSearchField" onClick={() => openSearch('when')}>
                    <FiCalendar size={18} />
                    <span>{formatTimeDisplay() || "When"}</span>
                </div>
                <button className="Navbar-tabletSearchBtn" onClick={handleSearch}>
                    <FiSearch size={18} />
                </button>
            </div>
            {isSearchOpen && <DesktopSearchModal />}
        </div>
    );

    return (
        <>
            <nav className="Navbar-container">
                <div className="Navbar-row">
                    {/* Logo */}
                    <div className="Navbar-leftSection">
                        <Link to="/" className="Navbar-logo">
                            <LogoContent />
                        </Link>
                    </div>

                    {/* Desktop Search (visible on >1024px) */}
                    {!isMobile && !isTablet && (
                        <div className="Navbar-searchWrapper">
                            <div className="Navbar-searchPill">
                                <div className={`Navbar-searchField ${activeSearchField === 'where' ? 'Navbar-active' : ''}`} onClick={() => openSearch('where')}>
                                    <span className="Navbar-label">Where</span>
                                    <div className="Navbar-inputWrapper">
                                        <MdOutlineLocationOn className="Navbar-fieldIcon" />
                                        <input
                                            className="Navbar-input"
                                            type="text"
                                            placeholder="Search destinations"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            onFocus={() => openSearch('where')}
                                        />
                                    </div>
                                </div>
                                <div className="Navbar-divider"></div>

                                <div className={`Navbar-searchField ${activeSearchField === 'which' ? 'Navbar-active' : ''}`} onClick={() => openSearch('which')}>
                                    <span className="Navbar-label">Which</span>
                                    <div className="Navbar-inputWrapper">
                                        <span className="Navbar-fieldIcon">🏢</span>
                                        <input
                                            className="Navbar-input"
                                            type="text"
                                            placeholder="Select space type"
                                            value={getSpaceTypeDisplayText()}
                                            readOnly
                                            onFocus={() => openSearch('which')}
                                        />
                                    </div>
                                </div>
                                <div className="Navbar-divider"></div>

                                <div className={`Navbar-searchField ${activeSearchField === 'when' ? 'Navbar-active' : ''}`} onClick={() => openSearch('when')}>
                                    <span className="Navbar-label">When</span>
                                    <div className="Navbar-inputWrapper">
                                        <FiCalendar className="Navbar-fieldIcon" />
                                        <input
                                            className="Navbar-input"
                                            type="text"
                                            placeholder="Select time"
                                            value={formatTimeDisplay()}
                                            readOnly
                                            onFocus={() => openSearch('when')}
                                        />
                                    </div>
                                </div>

                                <button className="Navbar-searchSubmit" onClick={handleSearch}>
                                    <FiSearch size={20} color="white" />
                                </button>
                            </div>

                            {isSearchOpen && <DesktopSearchModal />}
                        </div>
                    )}

                    {/* Tablet Search (visible on 769px-1024px) */}
                    {isTablet && <TabletSearchBar />}

                    {/* User Actions */}
                    <div className="Navbar-userActions">
                        {!isMobile && (
                            <button onClick={handleBecomeHostClick} className="Navbar-hostBtn" disabled={isCheckingHost}>
                                {isCheckingHost ? 'Checking...' : 'Become a host'}
                            </button>
                        )}

                        {/* Mobile Search Button */}
                        {isMobile && (
                            <button className="Navbar-mobileSearchBtn" onClick={openMobileSearch}>
                                <FiSearch size={20} />
                            </button>
                        )}

                        {/* User Menu Button */}
                        <div className="Navbar-menuBtn" onClick={toggleMenuDropdown}>
                            <FiMenu size={18} />
                            <div className="Navbar-avatar">
                                {user?.avatar ? <img src={user.avatar} alt="avatar" /> : <FiUser size={18} />}
                            </div>

                            {/* Desktop Dropdown Menu */}
                            {!isMobile && isMenuDropdownOpen && (
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
                                            <div className="Navbar-dropdownItem" onClick={() => navigate('/My-Profile')}>
                                                <FiUserCheck size={16} /> My Profile
                                            </div>
                                            <div className="Navbar-dropdownItem" onClick={() => { navigate('/chats'); setIsMenuDropdownOpen(false); }}>
                                                <FiMessageCircle size={16} />
                                                Messages
                                                {unreadCount > 0 && <span className="Navbar-unreadBadge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                                            </div>
                                            <div className="Navbar-dropdownItem" onClick={() => navigate('/my-bookings')}>
                                                <FiHome size={16} /> My Bookings
                                            </div>
                                            <div className="Navbar-dropdownItem" onClick={() => { navigate('/my-favorites'); setIsMenuDropdownOpen(false); }}>
                                                <FiHeart size={16} /> My Favorites
                                            </div>
                                            <div className="Navbar-dropdownDivider"></div>
                                            <div className="Navbar-dropdownItem" onClick={() => navigate('/')}>
                                                <FiStar size={16} /> Cozones Home
                                            </div>
                                            <div className="Navbar-dropdownDivider"></div>
                                            <div className="Navbar-dropdownItem" onClick={handleBecomeHostClick}>
                                                <FiStar size={16} /> Become a host
                                            </div>
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
            </nav>

            {/* Mobile Menu Modal */}
            {isMobile && isMobileMenuOpen && <MobileMenu />}

            {/* Mobile Search Modal */}
            {isMobile && isMobileSearchOpen && <MobileSearchModal />}
        </>
    );
};

export default Header;