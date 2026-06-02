// // DedicatedDeskDetail.jsx - Updated with SpaceDetail Design and DateTimePicker
// import React, { useState, useEffect, useCallback } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import axios from 'axios';
// import DateTimePicker from './DateTimePicker';
// import { useToast } from './UseTost';
// import ToastContainer from './Tostercontainer';
// import '../componentstyles/utilstyle/dedicatedDesksDetailed.css';
// import BaseUrl from './AppConstants';

// const DedicatedDeskDetail = () => {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const location = useLocation();
//     const { toasts, addToast, removeToast, success, error, warning, info } = useToast();
//     const [space, setSpace] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [currentImage, setCurrentImage] = useState(0);
//     const [startDate, setStartDate] = useState('');
//     const [endDate, setEndDate] = useState('');
//     const [selectedRateType, setSelectedRateType] = useState('daily');
//     const [bookingLoading, setBookingLoading] = useState(false);
//     const [user, setUser] = useState(null);
//     const [imageLoading, setImageLoading] = useState(true);
//     const [loadedImages, setLoadedImages] = useState({});
//     const [touchStart, setTouchStart] = useState(0);
//     const [touchEnd, setTouchEnd] = useState(0);

//     const apiClient = axios.create({
//         baseURL: BaseUrl,
//         timeout: 30000,
//         headers: { 'Content-Type': 'application/json' }
//     });

//     // Add token to requests
//     apiClient.interceptors.request.use((config) => {
//         const token = localStorage.getItem('token');
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     });

//     // Get current user info
//     useEffect(() => {
//         const getUser = async () => {
//             const token = localStorage.getItem('token');
//             if (token) {
//                 try {
//                     const response = await apiClient.get('api/auth/profile');
//                     setUser(response.data.user);
//                     success('Welcome back! 👋');
//                 } catch (err) {
//                     console.error('Error fetching user:', err);
//                 }
//             }
//         };
//         getUser();
//     }, []);

//     // Check for pre-filled dates from "Book Again"
//     useEffect(() => {
//         const { state } = location;
//         if (state?.prefillStartDate && state?.prefillEndDate) {
//             setStartDate(state.prefillStartDate);
//             setEndDate(state.prefillEndDate);
//             if (state.fromBookAgain) {
//                 info('📅 Previous booking dates loaded. You can modify them or select new dates to book again.');
//             }
//         }
//     }, [location]);

//     useEffect(() => {
//         const fetchDedicatedDesk = async () => {
//             try {
//                 setLoading(true);
//                 const response = await apiClient.get(`api/spaces/unit/${id}`);

//                 if (response.data?.success && response.data?.unit) {
//                     const unitData = response.data.unit;

//                     let rateType = 'daily';
//                     if (unitData.hourly_rate && parseFloat(unitData.hourly_rate) > 0 && unitData.hourly_rate !== -999) {
//                         rateType = 'hourly';
//                     } else if (unitData.daily_rate && parseFloat(unitData.daily_rate) > 0 && unitData.daily_rate !== -999) {
//                         rateType = 'daily';
//                     } else if (unitData.monthly_rate && parseFloat(unitData.monthly_rate) > 0 && unitData.monthly_rate !== -999) {
//                         rateType = 'monthly';
//                     }

//                     // Parse images properly
//                     let parsedImages = [];
//                     if (unitData.images) {
//                         if (typeof unitData.images === 'string') {
//                             try {
//                                 const parsed = JSON.parse(unitData.images);
//                                 parsedImages = Array.isArray(parsed) ? parsed : [parsed];
//                             } catch (e) {
//                                 parsedImages = [unitData.images];
//                             }
//                         } else if (Array.isArray(unitData.images)) {
//                             parsedImages = unitData.images;
//                         }
//                     }

//                     // Parse space amenities
//                     let parsedAmenities = unitData.space_amenities || {};
//                     if (typeof parsedAmenities === 'string') {
//                         try {
//                             parsedAmenities = JSON.parse(parsedAmenities);
//                         } catch (e) {
//                             parsedAmenities = {};
//                         }
//                     }

//                     // Parse policies
//                     let parsedPolicies = unitData.policies || {};
//                     if (typeof parsedPolicies === 'string') {
//                         try {
//                             parsedPolicies = JSON.parse(parsedPolicies);
//                         } catch (e) {
//                             parsedPolicies = {};
//                         }
//                     }

//                     const transformedSpace = {
//                         id: unitData.id,
//                         name: unitData.name,
//                         title: unitData.name || unitData.unit_type?.replace('_', ' ') || "Dedicated Desk",
//                         description: unitData.space?.description || "A premium dedicated desk in a professional coworking space",
//                         location: unitData.space?.city || "Coworking Space",
//                         area: unitData.space?.area,
//                         address: unitData.space?.address,
//                         city: unitData.space?.city,
//                         rateType: rateType,
//                         hourly_rate: unitData.hourly_rate && unitData.hourly_rate !== -999 ? parseFloat(unitData.hourly_rate) : null,
//                         daily_rate: unitData.daily_rate && unitData.daily_rate !== -999 ? parseFloat(unitData.daily_rate) : null,
//                         monthly_rate: unitData.monthly_rate && unitData.monthly_rate !== -999 ? parseFloat(unitData.monthly_rate) : null,
//                         total_capacity: unitData.total_capacity,
//                         unit_type: unitData.unit_type,
//                         images: parsedImages,
//                         space: unitData.space,
//                         space_amenities: parsedAmenities,
//                         policies: parsedPolicies,
//                         is_active: unitData.is_active,
//                         owner_id: unitData.space?.owner_id,
//                         created_at: unitData.created_at,
//                         updated_at: unitData.updated_at
//                     };

//                     setSpace(transformedSpace);
//                     setSelectedRateType(rateType);
//                     setCurrentImage(0);
//                     setLoadedImages({});
//                     success('Space details loaded successfully! 🎉');
//                 } else {
//                     error('Space not found');
//                 }
//             } catch (err) {
//                 console.error('Error fetching dedicated desk:', err);
//                 error('Failed to load space details. Please try again.');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (id) {
//             fetchDedicatedDesk();
//         }
//     }, [id]);

//     const isOwnSpace = () => {
//         if (!user || !space) return false;
//         return user.id === space.owner_id;
//     };

//     const getImages = useCallback(() => {
//         if (space?.images && space.images.length > 0) {
//             return space.images
//                 .filter(img => img && img !== '' && img !== 'null' && img !== 'undefined')
//                 .map(img => {
//                     if (img && (img.startsWith('http://') || img.startsWith('https://'))) {
//                         return img;
//                     }
//                     if (img && img.startsWith('data:image')) {
//                         return img;
//                     }
//                     if (img && !img.startsWith('http') && !img.startsWith('/') && img.length > 100) {
//                         if (/^[A-Za-z0-9+/=]+$/.test(img.substring(0, 100))) {
//                             return `data:image/jpeg;base64,${img}`;
//                         }
//                         return img;
//                     }
//                     if (img && img.startsWith('/')) {
//                         return `${BaseUrl}${img}`;
//                     }
//                     if (img && !img.startsWith('http') && !img.startsWith('data:')) {
//                         return `${BaseUrl}uploads/${img}`;
//                     }
//                     return img;
//                 });
//         }

//         const fallbackImages = {
//             'open_desk': 'https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c?w=800',
//             'dedicated_desk': 'https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c?w=800',
//             'private_cabin': 'https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c?w=800',
//             'meeting_room': 'https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c?w=800',
//         };
//         return [fallbackImages[space?.unit_type] || fallbackImages.dedicated_desk];
//     }, [space]);

//     const images = getImages();

//     // Preload images efficiently
//     useEffect(() => {
//         if (images && images.length > 0) {
//             images.forEach((src, index) => {
//                 const img = new Image();
//                 img.onload = () => {
//                     setLoadedImages(prev => ({ ...prev, [index]: true }));
//                 };
//                 img.onerror = () => {
//                     console.warn(`Failed to load image: ${src?.substring(0, 100)}...`);
//                     setLoadedImages(prev => ({ ...prev, [index]: false }));
//                 };
//                 img.src = src;
//             });
//         }
//     }, [images]);

//     const preloadAdjacentImages = useCallback((currentIdx) => {
//         if (images.length === 0) return;
//         const nextIdx = (currentIdx + 1) % images.length;
//         const prevIdx = (currentIdx - 1 + images.length) % images.length;

//         [nextIdx, prevIdx].forEach(idx => {
//             if (!loadedImages[idx] && images[idx]) {
//                 const img = new Image();
//                 img.src = images[idx];
//                 img.onload = () => {
//                     setLoadedImages(prev => ({ ...prev, [idx]: true }));
//                 };
//             }
//         });
//     }, [images, loadedImages]);

//     useEffect(() => {
//         if (images.length > 0) {
//             preloadAdjacentImages(currentImage);
//         }
//     }, [currentImage, preloadAdjacentImages, images.length]);

//     const nextImage = useCallback(() => {
//         if (images.length === 0) return;
//         setImageLoading(true);
//         const nextIdx = (currentImage + 1) % images.length;
//         setCurrentImage(nextIdx);
//         if (loadedImages[nextIdx]) {
//             setTimeout(() => setImageLoading(false), 100);
//         }
//     }, [currentImage, images.length, loadedImages]);

//     const prevImage = useCallback(() => {
//         if (images.length === 0) return;
//         setImageLoading(true);
//         const prevIdx = (currentImage - 1 + images.length) % images.length;
//         setCurrentImage(prevIdx);
//         if (loadedImages[prevIdx]) {
//             setTimeout(() => setImageLoading(false), 100);
//         }
//     }, [currentImage, images.length, loadedImages]);

//     const goToImage = (index) => {
//         if (index >= 0 && index < images.length && index !== currentImage) {
//             setImageLoading(true);
//             setCurrentImage(index);
//             if (loadedImages[index]) {
//                 setTimeout(() => setImageLoading(false), 100);
//             }
//         }
//     };

//     // Touch handlers for mobile swipe
//     const handleTouchStart = (e) => {
//         setTouchStart(e.targetTouches[0].clientX);
//     };

//     const handleTouchMove = (e) => {
//         setTouchEnd(e.targetTouches[0].clientX);
//     };

//     const handleTouchEnd = () => {
//         if (!touchStart || !touchEnd) return;
//         const distance = touchStart - touchEnd;
//         const isLeftSwipe = distance > 50;
//         const isRightSwipe = distance < -50;

//         if (isLeftSwipe) {
//             nextImage();
//         }
//         if (isRightSwipe) {
//             prevImage();
//         }
//         setTouchStart(0);
//         setTouchEnd(0);
//     };

//     // Keyboard navigation
//     useEffect(() => {
//         const handleKeyDown = (e) => {
//             if (e.key === 'ArrowLeft') {
//                 prevImage();
//             } else if (e.key === 'ArrowRight') {
//                 nextImage();
//             }
//         };
//         window.addEventListener('keydown', handleKeyDown);
//         return () => window.removeEventListener('keydown', handleKeyDown);
//     }, [nextImage, prevImage]);

//     const calcHours = () => {
//         if (!startDate || !endDate) return 0;
//         const diff = new Date(endDate) - new Date(startDate);
//         return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
//     };

//     const calcDays = () => {
//         if (!startDate || !endDate) return 0;
//         const diff = new Date(endDate) - new Date(startDate);
//         return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
//     };

//     const calcMonths = () => {
//         if (!startDate || !endDate) return 0;
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
//         return Math.max(0, monthDiff);
//     };

//     const getRateDisplay = () => {
//         if (!space) return { rate: 0, unit: 'day', value: 0 };
//         switch (selectedRateType) {
//             case 'hourly': return { rate: space.hourly_rate, unit: 'hour', value: space.hourly_rate || 0 };
//             case 'daily': return { rate: space.daily_rate, unit: 'day', value: space.daily_rate || 0 };
//             case 'monthly': return { rate: space.monthly_rate, unit: 'month', value: space.monthly_rate || 0 };
//             default: return { rate: space.daily_rate, unit: 'day', value: space.daily_rate || 0 };
//         }
//     };

//     const calculateTotal = () => {
//         if (!startDate || !endDate) return 0;
//         switch (selectedRateType) {
//             case 'hourly': return calcHours() * (space?.hourly_rate || 0);
//             case 'daily': return calcDays() * (space?.daily_rate || 0);
//             case 'monthly': return calcMonths() * (space?.monthly_rate || 0);
//             default: return calcDays() * (space?.daily_rate || 0);
//         }
//     };

//     const getQuantity = () => {
//         if (!startDate || !endDate) return 0;
//         switch (selectedRateType) {
//             case 'hourly': return calcHours();
//             case 'daily': return calcDays();
//             case 'monthly': return Math.max(1, calcMonths());
//             default: return calcDays();
//         }
//     };

//     const getUnitLabel = () => {
//         const qty = getQuantity();
//         switch (selectedRateType) {
//             case 'hourly': return qty === 1 ? 'hour' : 'hours';
//             case 'daily': return qty === 1 ? 'night' : 'nights';
//             case 'monthly': return qty === 1 ? 'month' : 'months';
//             default: return qty === 1 ? 'night' : 'nights';
//         }
//     };

//     const handleBooking = async () => {
//         if (!user) {
//             warning('Please login to book this space');
//             setTimeout(() => {
//                 navigate('/login', { state: { from: `/dedicated-desk/${id}` } });
//             }, 1500);
//             return;
//         }

//         if (isOwnSpace()) {
//             error('You cannot book your own space!');
//             return;
//         }

//         if (!startDate || !endDate) {
//             warning('Please select both start and end dates');
//             return;
//         }

//         const start = new Date(startDate);
//         const end = new Date(endDate);

//         if (start >= end) {
//             error('End time must be after start time');
//             return;
//         }

//         const totalPrice = calculateTotal();
//         if (totalPrice <= 0) {
//             error('Invalid booking duration or price');
//             return;
//         }

//         setBookingLoading(true);

//         try {
//             const bookingData = {
//                 space_unit_id: id,
//                 start_time: new Date(startDate).toISOString(),
//                 end_time: new Date(endDate).toISOString(),
//                 total_price: totalPrice
//             };

//             console.log('Sending booking data:', bookingData);

//             const response = await apiClient.post('api/bookings/createbooking', bookingData, {
//                 timeout: 30000
//             });

//             if (response.data.success) {
//                 success(`Booking successful! Reference: ${response.data.booking.booking_ref}`, 5000);
//                 setTimeout(() => {
//                     navigate('/my-bookings');
//                 }, 2000);
//             } else {
//                 throw new Error(response.data.message || 'Booking failed');
//             }

//         } catch (err) {
//             console.error('Booking error:', err);

//             let errorMessage = 'Failed to create booking. Please try again.';

//             if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
//                 errorMessage = 'Booking is being processed. Please check "My Bookings" page to confirm your booking.';
//                 warning(errorMessage);
//                 setTimeout(() => {
//                     navigate('/my-bookings');
//                 }, 3000);
//                 return;
//             }

//             if (err.response) {
//                 if (err.response.status === 401) {
//                     errorMessage = 'Session expired. Please login again';
//                     setTimeout(() => navigate('/login'), 2000);
//                 } else if (err.response.status === 409) {
//                     errorMessage = err.response.data.message || 'This time slot is already booked.';
//                 } else if (err.response.data?.message) {
//                     errorMessage = err.response.data.message;
//                 }
//             }

//             error(errorMessage);
//         } finally {
//             setBookingLoading(false);
//         }
//     };

//     const handleStartDateChange = (e) => {
//         const newStartDate = e.target.value;
//         setStartDate(newStartDate);

//         if (endDate && new Date(endDate) <= new Date(newStartDate)) {
//             warning('End date should be after start date');
//             setEndDate('');
//         }
//     };

//     const handleEndDateChange = (e) => {
//         const newEndDate = e.target.value;
//         setEndDate(newEndDate);

//         if (startDate && new Date(newEndDate) <= new Date(startDate)) {
//             warning('End date must be after start date');
//             setEndDate('');
//         }
//     };

//     const rateDisplay = getRateDisplay();
//     const quantity = getQuantity();
//     const total = calculateTotal();

//     const renderAmenities = () => {
//         const amenities = space?.space_amenities || {};
//         const amenityList = [];
//         if (amenities.wifi) amenityList.push('WiFi');
//         if (amenities.ac) amenityList.push('Air Conditioning');
//         if (amenities.coffee) amenityList.push('Free Coffee');
//         if (amenities.printer) amenityList.push('Printer');
//         if (amenities.parking) amenityList.push('Parking');
//         if (amenities.security) amenityList.push('24/7 Security');
//         if (amenities.backup_power) amenityList.push('Backup Power');
//         return amenityList;
//     };

//     const getAvailableRateTypes = () => {
//         const types = [];
//         if (space?.hourly_rate && space.hourly_rate > 0 && space.hourly_rate !== -999) {
//             types.push({ key: 'hourly', label: 'Hourly', rate: space.hourly_rate });
//         }
//         if (space?.daily_rate && space.daily_rate > 0 && space.daily_rate !== -999) {
//             types.push({ key: 'daily', label: 'Daily', rate: space.daily_rate });
//         }
//         if (space?.monthly_rate && space.monthly_rate > 0 && space.monthly_rate !== -999) {
//             types.push({ key: 'monthly', label: 'Monthly', rate: space.monthly_rate });
//         }
//         return types;
//     };

//     if (loading) {
//         return (
//             <div className="DedicatedDeskDetail_loading">
//                 <div className="DedicatedDeskDetail_spinner"></div>
//                 <p>Loading dedicated desk details...</p>
//             </div>
//         );
//     }

//     if (!space) {
//         return (
//             <div className="DedicatedDeskDetail_loading">
//                 <p>Unable to load space details.</p>
//                 <button onClick={() => navigate(-1)} className="DedicatedDeskDetail_back-btn">Go Back</button>
//                 <button onClick={() => window.location.reload()} className="DedicatedDeskDetail_retry-btn">Retry</button>
//             </div>
//         );
//     }

//     return (
//         <>
//             <ToastContainer toasts={toasts} removeToast={removeToast} />
//             <div className="DedicatedDeskDetail_page">
//                 <button className="DedicatedDeskDetail_back-btn" onClick={() => navigate(-1)}>
//                     Back to spaces
//                 </button>

//                 <h2 className="DedicatedDeskDetail_page-title">Space Details</h2>

//                 {isOwnSpace() && (
//                     <div className="DedicatedDeskDetail_owner_warning">
//                         ⚠️ This is your own space. You cannot book it.
//                     </div>
//                 )}

//                 {!user && (
//                     <div className="DedicatedDeskDetail_login_warning">
//                         🔐 Please <button onClick={() => navigate('/login')} className="login-link">login</button> to book this space
//                     </div>
//                 )}

//                 {space.unit_type && (
//                     <div className="DedicatedDeskDetail_unit_badge">
//                         {space.unit_type.replace('_', ' ').toUpperCase()}
//                     </div>
//                 )}

//                 <div className="DedicatedDeskDetail_top-grid">
//                     <div className="DedicatedDeskDetail_left">
//                         <h1 className="DedicatedDeskDetail_title">{space.title}</h1>

//                         <p className="DedicatedDeskDetail_meta">
//                             📍 {space.city}, {space.area}
//                             {space.address && <span> - {space.address}</span>}
//                         </p>

//                         {space.total_capacity && (
//                             <p className="DedicatedDeskDetail_meta">
//                                 👥 Capacity: {space.total_capacity} people
//                             </p>
//                         )}

//                         <p className="DedicatedDeskDetail_meta">
//                             Availability: <span className="DedicatedDeskDetail_available">
//                                 {space.is_active !== false ? 'Available' : 'Currently Unavailable'}
//                             </span>
//                         </p>

//                         {getAvailableRateTypes().length > 1 && (
//                             <div className="DedicatedDeskDetail_rate_selector">
//                                 <label>Select Pricing Plan:</label>
//                                 <div className="DedicatedDeskDetail_rate_options">
//                                     {getAvailableRateTypes().map(type => (
//                                         <button
//                                             key={type.key}
//                                             className={`DedicatedDeskDetail_rate_option ${selectedRateType === type.key ? 'active' : ''}`}
//                                             onClick={() => {
//                                                 setSelectedRateType(type.key);
//                                                 info(`${type.label} pricing selected`);
//                                             }}
//                                         >
//                                             {type.label}
//                                             <span className="DedicatedDeskDetail_rate_amount">
//                                                 {type.rate.toLocaleString()} PKR
//                                             </span>
//                                         </button>
//                                     ))}
//                                 </div>
//                             </div>
//                         )}

//                         <div className="DedicatedDeskDetail_pricing">
//                             <p className="DedicatedDeskDetail_price">
//                                 {rateDisplay.rate?.toLocaleString()} PKR per {rateDisplay.unit}
//                             </p>
//                             {selectedRateType === 'hourly' && space.daily_rate && space.daily_rate > 0 && (
//                                 <p className="DedicatedDeskDetail_note">
//                                     💡 Daily rate available: {space.daily_rate.toLocaleString()} PKR/day
//                                 </p>
//                             )}
//                             {selectedRateType === 'daily' && space.monthly_rate && space.monthly_rate > 0 && (
//                                 <p className="DedicatedDeskDetail_note">
//                                     💡 Monthly rate available: {space.monthly_rate.toLocaleString()} PKR/month
//                                 </p>
//                             )}
//                         </div>

//                         {/* Date & Time Selection Section with DateTimePicker */}
//                         <div className="DedicatedDeskDetail_datetime_section">
//                             <h3 className="DedicatedDeskDetail_section_title">Select Date & Time</h3>
//                             <div className="DedicatedDeskDetail_datetime_grid">
//                                 <DateTimePicker
//                                     label="Start Date & Time"
//                                     value={startDate}
//                                     onChange={handleStartDateChange}
//                                     minDate={new Date().toISOString()}
//                                     placeholder="Select start date and time"
//                                 />
//                                 <DateTimePicker
//                                     label="End Date & Time"
//                                     value={endDate}
//                                     onChange={handleEndDateChange}
//                                     minDate={startDate || new Date().toISOString()}
//                                     placeholder="Select end date and time"
//                                 />
//                             </div>
//                         </div>

//                         {startDate && endDate && (
//                             <div className="DedicatedDeskDetail_summary">
//                                 <div className="DedicatedDeskDetail_summary-row">
//                                     <span>Starting Date</span>
//                                     <span>{new Date(startDate).toLocaleString()}</span>
//                                 </div>
//                                 <div className="DedicatedDeskDetail_summary-row">
//                                     <span>Ending Date</span>
//                                     <span>{new Date(endDate).toLocaleString()}</span>
//                                 </div>
//                                 <div className="DedicatedDeskDetail_summary-row">
//                                     <span>
//                                         {rateDisplay.rate?.toLocaleString()} PKR × {quantity} {getUnitLabel()}
//                                     </span>
//                                     <span>PKR {total.toLocaleString()}</span>
//                                 </div>
//                                 <div className="DedicatedDeskDetail_summary-row DedicatedDeskDetail_summary-total">
//                                     <span>Total</span>
//                                     <span>PKR {total.toLocaleString()}</span>
//                                 </div>
//                             </div>
//                         )}

//                         <button
//                             className="DedicatedDeskDetail_continue-btn"
//                             disabled={!startDate || !endDate || bookingLoading || isOwnSpace() || !user}
//                             onClick={handleBooking}
//                         >
//                             {bookingLoading ? (
//                                 <>
//                                     <span className="spinner-small"></span>
//                                     Processing...
//                                 </>
//                             ) : (
//                                 'Confirm Booking'
//                             )}
//                         </button>
//                     </div>

//                     {/* IMAGE SLIDER SECTION */}
//                     <div className="DedicatedDeskDetail_right">
//                         <div
//                             className="DedicatedDeskDetail_gallery"
//                             onTouchStart={handleTouchStart}
//                             onTouchMove={handleTouchMove}
//                             onTouchEnd={handleTouchEnd}
//                         >
//                             {images.length > 0 && images[0] ? (
//                                 <>
//                                     {imageLoading && !loadedImages[currentImage] && (
//                                         <div className="DedicatedDeskDetail_image_loader">
//                                             <div className="DedicatedDeskDetail_spinner_small"></div>
//                                         </div>
//                                     )}

//                                     <img
//                                         key={currentImage}
//                                         src={images[currentImage]}
//                                         alt={`${space.title} - Image ${currentImage + 1}`}
//                                         className={`DedicatedDeskDetail_main-img ${imageLoading && !loadedImages[currentImage] ? 'hidden' : 'visible'}`}
//                                         onLoad={() => {
//                                             setImageLoading(false);
//                                             setLoadedImages(prev => ({ ...prev, [currentImage]: true }));
//                                         }}
//                                         onError={(e) => {
//                                             console.error('Image failed to load');
//                                             e.target.src = 'https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c';
//                                             setImageLoading(false);
//                                         }}
//                                     />

//                                     {images.length > 1 && (
//                                         <>
//                                             <button
//                                                 className="DedicatedDeskDetail_img-nav DedicatedDeskDetail_prev"
//                                                 onClick={prevImage}
//                                                 aria-label="Previous image"
//                                             >
//                                                 ‹
//                                             </button>
//                                             <button
//                                                 className="DedicatedDeskDetail_img-nav DedicatedDeskDetail_next"
//                                                 onClick={nextImage}
//                                                 aria-label="Next image"
//                                             >
//                                                 ›
//                                             </button>
//                                             <div className="DedicatedDeskDetail_img-counter">
//                                                 {currentImage + 1} / {images.length}
//                                             </div>
//                                         </>
//                                     )}
//                                 </>
//                             ) : (
//                                 <div className="DedicatedDeskDetail_no-img">
//                                     <img
//                                         src="https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c"
//                                         alt="Fallback"
//                                         className="DedicatedDeskDetail_main-img"
//                                     />
//                                 </div>
//                             )}
//                         </div>

//                         {images.length > 1 && (
//                             <div className="DedicatedDeskDetail_thumbnails">
//                                 {images.slice(0, 6).map((img, i) => (
//                                     <div
//                                         key={i}
//                                         className={`DedicatedDeskDetail_thumb_wrapper ${i === currentImage ? 'active' : ''}`}
//                                         onClick={() => goToImage(i)}
//                                     >
//                                         <img
//                                             src={img}
//                                             alt={`Thumbnail ${i + 1}`}
//                                             className="DedicatedDeskDetail_thumb"
//                                             loading="lazy"
//                                             onError={(e) => {
//                                                 e.target.src = 'https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c';
//                                             }}
//                                         />
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 <div className="DedicatedDeskDetail_bottom">
//                     <div className="DedicatedDeskDetail_section">
//                         <h3 className="DedicatedDeskDetail_section-title">About this space</h3>
//                         <p className="DedicatedDeskDetail_description">
//                             {space.description || `A premium ${space.unit_type?.replace('_', ' ') || 'workspace'} located in the heart of ${space.city}. Perfect for professionals, freelancers, and teams looking for a productive environment.`}
//                         </p>
//                     </div>

//                     {/* Working Hours */}
//                     {space.space?.opening_time && space.space?.closing_time && (
//                         <div className="DedicatedDeskDetail_section">
//                             <h3 className="DedicatedDeskDetail_section-title">Working Hours</h3>
//                             <p className="DedicatedDeskDetail_working_hours">
//                                 {space.space.opening_time} - {space.space.closing_time}
//                             </p>
//                             {space.space.working_days && (
//                                 <p className="DedicatedDeskDetail_working_days">
//                                     {space.space.working_days.join(', ')}
//                                 </p>
//                             )}
//                         </div>
//                     )}

//                     {/* Amenities */}
//                     {renderAmenities().length > 0 && (
//                         <div className="DedicatedDeskDetail_section">
//                             <h3 className="DedicatedDeskDetail_section-title">Amenities</h3>
//                             <div className="DedicatedDeskDetail_features">
//                                 {renderAmenities().map((item, i) => (
//                                     <span key={i} className="DedicatedDeskDetail_feature-tag">✓ {item}</span>
//                                 ))}
//                             </div>
//                         </div>
//                     )}

//                     {/* Space Information */}
//                     {space.space && (
//                         <div className="DedicatedDeskDetail_section">
//                             <h3 className="DedicatedDeskDetail_section-title">Space Information</h3>
//                             <div className="DedicatedDeskDetail_space_info">
//                                 <p><strong>Space Name:</strong> {space.space.name}</p>
//                                 <p><strong>Unit Type:</strong> {space.unit_type?.replace('_', ' ')}</p>
//                                 {space.total_capacity && <p><strong>Total Capacity:</strong> {space.total_capacity} seats</p>}
//                                 {space.space.is_verified && <p className="verified">✓ Verified Space</p>}
//                             </div>
//                         </div>
//                     )}

//                     {/* Policies */}
//                     {space.policies && (space.policies.cancellation || space.policies.refund || space.policies.late_arrival) && (
//                         <div className="DedicatedDeskDetail_section">
//                             <h3 className="DedicatedDeskDetail_section-title">Policies</h3>
//                             <div className="DedicatedDeskDetail_policies">
//                                 {space.policies.cancellation && <p><strong>Cancellation:</strong> {space.policies.cancellation}</p>}
//                                 {space.policies.refund && <p><strong>Refund:</strong> {space.policies.refund}</p>}
//                                 {space.policies.late_arrival && <p><strong>Late Arrival:</strong> {space.policies.late_arrival}</p>}
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </>
//     );
// };

// export default DedicatedDeskDetail;


// DedicatedDeskDetail.jsx - Updated with fixed image handling
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import DateTimePicker from './DateTimePicker';
import { useToast } from './UseTost';
import ToastContainer from './Tostercontainer';
import '../componentstyles/utilstyle/dedicatedDesksDetailed.css';
import BaseUrl from './AppConstants';

const DedicatedDeskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { toasts, addToast, removeToast, success, error, warning, info } = useToast();
    const [space, setSpace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedRateType, setSelectedRateType] = useState('daily');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [loadedImages, setLoadedImages] = useState({});
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
    });

    // Add token to requests
    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Get current user info
    useEffect(() => {
        const getUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await apiClient.get('api/auth/profile');
                    setUser(response.data.user);
                    success('Welcome back! 👋');
                } catch (err) {
                    console.error('Error fetching user:', err);
                }
            }
        };
        getUser();
    }, []);

    // Check for pre-filled dates from "Book Again"
    useEffect(() => {
        const { state } = location;
        if (state?.prefillStartDate && state?.prefillEndDate) {
            setStartDate(state.prefillStartDate);
            setEndDate(state.prefillEndDate);
            if (state.fromBookAgain) {
                info('📅 Previous booking dates loaded. You can modify them or select new dates to book again.');
            }
        }
    }, [location]);

    // Helper function to extract image URL from various formats
    const extractImageUrl = (img) => {
        if (!img) return null;

        // If it's an object with image_base64
        if (typeof img === 'object' && img.image_base64) {
            let base64 = img.image_base64;
            // Fix for application/octet-stream
            if (typeof base64 === 'string' && base64.startsWith('data:application/octet-stream')) {
                base64 = base64.replace('data:application/octet-stream', 'data:image/jpeg');
            }
            return base64;
        }

        // If it's a string
        if (typeof img === 'string') {
            // Fix for application/octet-stream
            if (img.startsWith('data:application/octet-stream')) {
                return img.replace('data:application/octet-stream', 'data:image/jpeg');
            }
            // Handle raw Base64
            if (!img.startsWith('data:image') && !img.startsWith('http') && img.length > 100) {
                if (/^[A-Za-z0-9+/=]+$/.test(img.substring(0, 100))) {
                    return `data:image/jpeg;base64,${img}`;
                }
            }
            return img;
        }

        return null;
    };

    useEffect(() => {
        const fetchDedicatedDesk = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`api/spaces/unit/${id}`);
                console.log('API Response:', response.data);

                if (response.data?.success && response.data?.unit) {
                    const unitData = response.data.unit;
                    console.log('Unit Data:', unitData);

                    let rateType = 'daily';
                    if (unitData.hourly_rate && parseFloat(unitData.hourly_rate) > 0 && unitData.hourly_rate !== -999) {
                        rateType = 'hourly';
                    } else if (unitData.daily_rate && parseFloat(unitData.daily_rate) > 0 && unitData.daily_rate !== -999) {
                        rateType = 'daily';
                    } else if (unitData.monthly_rate && parseFloat(unitData.monthly_rate) > 0 && unitData.monthly_rate !== -999) {
                        rateType = 'monthly';
                    }

                    // Parse images - handle both array of strings and array of objects
                    let parsedImages = [];
                    if (unitData.images && Array.isArray(unitData.images)) {
                        parsedImages = unitData.images
                            .filter(img => img !== null && img !== '')
                            .map(img => extractImageUrl(img))
                            .filter(img => img !== null);
                    }

                    // Fallback if no images
                    if (parsedImages.length === 0) {
                        parsedImages = ['https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c?w=800'];
                    }

                    // Get owner_id from unitData (flattened) or from space object
                    const ownerId = unitData.owner_id || unitData.space?.owner_id;

                    const transformedSpace = {
                        id: unitData.id,
                        name: unitData.name,
                        title: unitData.name || unitData.unit_type?.replace('_', ' ') || "Dedicated Desk",
                        description: unitData.space_description || unitData.space?.description || "A premium dedicated desk in a professional coworking space",
                        location: unitData.city || unitData.space?.city || "Coworking Space",
                        area: unitData.area || unitData.space?.area,
                        address: unitData.address || unitData.space?.address,
                        city: unitData.city || unitData.space?.city,
                        rateType: rateType,
                        hourly_rate: unitData.hourly_rate && unitData.hourly_rate !== -999 ? parseFloat(unitData.hourly_rate) : null,
                        daily_rate: unitData.daily_rate && unitData.daily_rate !== -999 ? parseFloat(unitData.daily_rate) : null,
                        monthly_rate: unitData.monthly_rate && unitData.monthly_rate !== -999 ? parseFloat(unitData.monthly_rate) : null,
                        total_capacity: unitData.total_capacity,
                        unit_type: unitData.unit_type,
                        images: parsedImages,
                        // Working hours - flattened
                        opening_time: unitData.opening_time,
                        closing_time: unitData.closing_time,
                        working_days: unitData.working_days,
                        // Amenities - flattened
                        has_wifi: unitData.has_wifi,
                        has_ac: unitData.has_ac,
                        has_coffee: unitData.has_coffee,
                        has_printer: unitData.has_printer,
                        has_parking: unitData.has_parking,
                        has_security: unitData.has_security,
                        has_backup_power: unitData.has_backup_power,
                        // Space info
                        space_name: unitData.space_name,
                        space_description: unitData.space_description,
                        is_active: unitData.is_active,
                        owner_id: ownerId,
                        created_at: unitData.created_at,
                        updated_at: unitData.updated_at,
                        // Keep for compatibility
                        space: unitData.space,
                        space_amenities: unitData.space_amenities,
                        policies: unitData.policies
                    };

                    console.log('Transformed Space:', transformedSpace);
                    setSpace(transformedSpace);
                    setSelectedRateType(rateType);
                    setCurrentImage(0);
                    setLoadedImages({});
                    success('Space details loaded successfully! 🎉');
                } else {
                    error('Space not found');
                }
            } catch (err) {
                console.error('Error fetching dedicated desk:', err);
                error('Failed to load space details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDedicatedDesk();
        }
    }, [id]);

    const isOwnSpace = () => {
        if (!user || !space) return false;
        return String(user.id) === String(space.owner_id);
    };

    const getImages = useCallback(() => {
        if (space?.images && space.images.length > 0) {
            return space.images;
        }
        return ['https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c?w=800'];
    }, [space]);

    const images = getImages();

    // Preload images efficiently
    useEffect(() => {
        if (images && images.length > 0) {
            images.forEach((src, index) => {
                if (src && typeof src === 'string') {
                    const img = new Image();
                    img.onload = () => {
                        setLoadedImages(prev => ({ ...prev, [index]: true }));
                    };
                    img.onerror = () => {
                        console.warn(`Failed to load image: ${src?.substring(0, 100)}...`);
                        setLoadedImages(prev => ({ ...prev, [index]: false }));
                    };
                    img.src = src;
                } else {
                    setLoadedImages(prev => ({ ...prev, [index]: false }));
                }
            });
        }
    }, [images]);

    const preloadAdjacentImages = useCallback((currentIdx) => {
        if (images.length === 0) return;
        const nextIdx = (currentIdx + 1) % images.length;
        const prevIdx = (currentIdx - 1 + images.length) % images.length;

        [nextIdx, prevIdx].forEach(idx => {
            if (!loadedImages[idx] && images[idx] && typeof images[idx] === 'string') {
                const img = new Image();
                img.src = images[idx];
                img.onload = () => {
                    setLoadedImages(prev => ({ ...prev, [idx]: true }));
                };
            }
        });
    }, [images, loadedImages]);

    useEffect(() => {
        if (images.length > 0) {
            preloadAdjacentImages(currentImage);
        }
    }, [currentImage, preloadAdjacentImages, images.length]);

    const nextImage = useCallback(() => {
        if (images.length === 0) return;
        setImageLoading(true);
        const nextIdx = (currentImage + 1) % images.length;
        setCurrentImage(nextIdx);
        if (loadedImages[nextIdx]) {
            setTimeout(() => setImageLoading(false), 100);
        }
    }, [currentImage, images.length, loadedImages]);

    const prevImage = useCallback(() => {
        if (images.length === 0) return;
        setImageLoading(true);
        const prevIdx = (currentImage - 1 + images.length) % images.length;
        setCurrentImage(prevIdx);
        if (loadedImages[prevIdx]) {
            setTimeout(() => setImageLoading(false), 100);
        }
    }, [currentImage, images.length, loadedImages]);

    const goToImage = (index) => {
        if (index >= 0 && index < images.length && index !== currentImage) {
            setImageLoading(true);
            setCurrentImage(index);
            if (loadedImages[index]) {
                setTimeout(() => setImageLoading(false), 100);
            }
        }
    };

    // Touch handlers for mobile swipe
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            nextImage();
        }
        if (isRightSwipe) {
            prevImage();
        }
        setTouchStart(0);
        setTouchEnd(0);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                prevImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextImage, prevImage]);

    const calcHours = () => {
        if (!startDate || !endDate) return 0;
        const diff = new Date(endDate) - new Date(startDate);
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
    };

    const calcDays = () => {
        if (!startDate || !endDate) return 0;
        const diff = new Date(endDate) - new Date(startDate);
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    };

    const calcMonths = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return Math.max(0, monthDiff);
    };

    const getRateDisplay = () => {
        if (!space) return { rate: 0, unit: 'day', value: 0 };
        switch (selectedRateType) {
            case 'hourly': return { rate: space.hourly_rate, unit: 'hour', value: space.hourly_rate || 0 };
            case 'daily': return { rate: space.daily_rate, unit: 'day', value: space.daily_rate || 0 };
            case 'monthly': return { rate: space.monthly_rate, unit: 'month', value: space.monthly_rate || 0 };
            default: return { rate: space.daily_rate, unit: 'day', value: space.daily_rate || 0 };
        }
    };

    const calculateTotal = () => {
        if (!startDate || !endDate) return 0;
        switch (selectedRateType) {
            case 'hourly': return calcHours() * (space?.hourly_rate || 0);
            case 'daily': return calcDays() * (space?.daily_rate || 0);
            case 'monthly': return calcMonths() * (space?.monthly_rate || 0);
            default: return calcDays() * (space?.daily_rate || 0);
        }
    };

    const getQuantity = () => {
        if (!startDate || !endDate) return 0;
        switch (selectedRateType) {
            case 'hourly': return calcHours();
            case 'daily': return calcDays();
            case 'monthly': return Math.max(1, calcMonths());
            default: return calcDays();
        }
    };

    const getUnitLabel = () => {
        const qty = getQuantity();
        switch (selectedRateType) {
            case 'hourly': return qty === 1 ? 'hour' : 'hours';
            case 'daily': return qty === 1 ? 'night' : 'nights';
            case 'monthly': return qty === 1 ? 'month' : 'months';
            default: return qty === 1 ? 'night' : 'nights';
        }
    };

    const handleBooking = async () => {
        if (!user) {
            warning('Please login to book this space');
            setTimeout(() => {
                navigate('/login', { state: { from: `/dedicated-desk/${id}` } });
            }, 1500);
            return;
        }

        if (isOwnSpace()) {
            error('You cannot book your own space!');
            return;
        }

        if (!startDate || !endDate) {
            warning('Please select both start and end dates');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            error('End time must be after start time');
            return;
        }

        const totalPrice = calculateTotal();
        if (totalPrice <= 0) {
            error('Invalid booking duration or price');
            return;
        }

        setBookingLoading(true);

        try {
            const bookingData = {
                space_unit_id: id,
                start_time: new Date(startDate).toISOString(),
                end_time: new Date(endDate).toISOString(),
                total_price: totalPrice
            };

            console.log('Sending booking data:', bookingData);

            const response = await apiClient.post('api/bookings/createbooking', bookingData, {
                timeout: 30000
            });

            if (response.data.success) {
                success(`Booking successful! Reference: ${response.data.booking.booking_ref}`, 5000);
                setTimeout(() => {
                    navigate('/my-bookings');
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Booking failed');
            }

        } catch (err) {
            console.error('Booking error:', err);

            let errorMessage = 'Failed to create booking. Please try again.';

            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                errorMessage = 'Booking is being processed. Please check "My Bookings" page to confirm your booking.';
                warning(errorMessage);
                setTimeout(() => {
                    navigate('/my-bookings');
                }, 3000);
                return;
            }

            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = 'Session expired. Please login again';
                    setTimeout(() => navigate('/login'), 2000);
                } else if (err.response.status === 409) {
                    errorMessage = err.response.data.message || 'This time slot is already booked.';
                } else if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }

            error(errorMessage);
        } finally {
            setBookingLoading(false);
        }
    };

    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);

        if (endDate && new Date(endDate) <= new Date(newStartDate)) {
            warning('End date should be after start date');
            setEndDate('');
        }
    };

    const handleEndDateChange = (e) => {
        const newEndDate = e.target.value;
        setEndDate(newEndDate);

        if (startDate && new Date(newEndDate) <= new Date(startDate)) {
            warning('End date must be after start date');
            setEndDate('');
        }
    };

    const renderAmenities = () => {
        const amenities = [];
        if (space?.has_wifi) amenities.push('WiFi');
        if (space?.has_ac) amenities.push('Air Conditioning');
        if (space?.has_coffee) amenities.push('Free Coffee');
        if (space?.has_printer) amenities.push('Printer');
        if (space?.has_parking) amenities.push('Parking');
        if (space?.has_security) amenities.push('24/7 Security');
        if (space?.has_backup_power) amenities.push('Backup Power');
        return amenities;
    };

    const getAvailableRateTypes = () => {
        const types = [];
        if (space?.hourly_rate && space.hourly_rate > 0 && space.hourly_rate !== -999) {
            types.push({ key: 'hourly', label: 'Hourly', rate: space.hourly_rate });
        }
        if (space?.daily_rate && space.daily_rate > 0 && space.daily_rate !== -999) {
            types.push({ key: 'daily', label: 'Daily', rate: space.daily_rate });
        }
        if (space?.monthly_rate && space.monthly_rate > 0 && space.monthly_rate !== -999) {
            types.push({ key: 'monthly', label: 'Monthly', rate: space.monthly_rate });
        }
        return types;
    };

    const rateDisplay = getRateDisplay();
    const quantity = getQuantity();
    const total = calculateTotal();
    const amenities = renderAmenities();
    const availableRateTypes = getAvailableRateTypes();
    const isOwner = isOwnSpace();

    if (loading) {
        return (
            <div className="DedicatedDeskDetail_loading">
                <div className="DedicatedDeskDetail_spinner"></div>
                <p>Loading dedicated desk details...</p>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="DedicatedDeskDetail_loading">
                <p>Unable to load space details.</p>
                <button onClick={() => navigate(-1)} className="DedicatedDeskDetail_back-btn">Go Back</button>
                <button onClick={() => window.location.reload()} className="DedicatedDeskDetail_retry-btn">Retry</button>
            </div>
        );
    }

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="DedicatedDeskDetail_page">
                <button className="DedicatedDeskDetail_back-btn" onClick={() => navigate(-1)}>
                    Back to spaces
                </button>

                <h2 className="DedicatedDeskDetail_page-title">Space Details</h2>

                {isOwner && (
                    <div className="DedicatedDeskDetail_owner_warning">
                        ⚠️ This is your own space. You cannot book it.
                    </div>
                )}

                {!user && (
                    <div className="DedicatedDeskDetail_login_warning">
                        🔐 Please <button onClick={() => navigate('/login')} className="login-link">login</button> to book this space
                    </div>
                )}

                {space.unit_type && (
                    <div className="DedicatedDeskDetail_unit_badge">
                        {space.unit_type.replace('_', ' ').toUpperCase()}
                    </div>
                )}

                <div className="DedicatedDeskDetail_top-grid">
                    <div className="DedicatedDeskDetail_left">
                        <h1 className="DedicatedDeskDetail_title">{space.title}</h1>

                        <p className="DedicatedDeskDetail_meta">
                            📍 {space.city || space.location}
                            {space.area && `, ${space.area}`}
                            {space.address && <span> - {space.address}</span>}
                        </p>

                        {space.total_capacity && (
                            <p className="DedicatedDeskDetail_meta">
                                👥 Capacity: {space.total_capacity} people
                            </p>
                        )}

                        <p className="DedicatedDeskDetail_meta">
                            Availability: <span className={space.is_active ? "DedicatedDeskDetail_available" : "DedicatedDeskDetail_unavailable"}>
                                {space.is_active !== false ? 'Available' : 'Currently Unavailable'}
                            </span>
                        </p>

                        {availableRateTypes.length > 1 && (
                            <div className="DedicatedDeskDetail_rate_selector">
                                <label>Select Pricing Plan:</label>
                                <div className="DedicatedDeskDetail_rate_options">
                                    {availableRateTypes.map(type => (
                                        <button
                                            key={type.key}
                                            className={`DedicatedDeskDetail_rate_option ${selectedRateType === type.key ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedRateType(type.key);
                                                info(`${type.label} pricing selected`);
                                            }}
                                        >
                                            {type.label}
                                            <span className="DedicatedDeskDetail_rate_amount">
                                                {type.rate.toLocaleString()} PKR
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="DedicatedDeskDetail_pricing">
                            <p className="DedicatedDeskDetail_price">
                                {rateDisplay.rate?.toLocaleString()} PKR per {rateDisplay.unit}
                            </p>
                            {selectedRateType === 'hourly' && space.daily_rate && space.daily_rate > 0 && (
                                <p className="DedicatedDeskDetail_note">
                                    💡 Daily rate available: {space.daily_rate.toLocaleString()} PKR/day
                                </p>
                            )}
                            {selectedRateType === 'daily' && space.monthly_rate && space.monthly_rate > 0 && (
                                <p className="DedicatedDeskDetail_note">
                                    💡 Monthly rate available: {space.monthly_rate.toLocaleString()} PKR/month
                                </p>
                            )}
                        </div>

                        {/* Date & Time Selection Section */}
                        <div className="DedicatedDeskDetail_datetime_section">
                            <h3 className="DedicatedDeskDetail_section_title">Select Date & Time</h3>
                            <div className="DedicatedDeskDetail_datetime_grid">
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={startDate}
                                    onChange={handleStartDateChange}
                                    minDate={new Date().toISOString()}
                                    placeholder="Select start date and time"
                                />
                                <DateTimePicker
                                    label="End Date & Time"
                                    value={endDate}
                                    onChange={handleEndDateChange}
                                    minDate={startDate || new Date().toISOString()}
                                    placeholder="Select end date and time"
                                />
                            </div>
                        </div>

                        {startDate && endDate && (
                            <div className="DedicatedDeskDetail_summary">
                                <div className="DedicatedDeskDetail_summary-row">
                                    <span>Starting Date</span>
                                    <span>{new Date(startDate).toLocaleString()}</span>
                                </div>
                                <div className="DedicatedDeskDetail_summary-row">
                                    <span>Ending Date</span>
                                    <span>{new Date(endDate).toLocaleString()}</span>
                                </div>
                                <div className="DedicatedDeskDetail_summary-row">
                                    <span>
                                        {rateDisplay.rate?.toLocaleString()} PKR × {quantity} {getUnitLabel()}
                                    </span>
                                    <span>PKR {total.toLocaleString()}</span>
                                </div>
                                <div className="DedicatedDeskDetail_summary-row DedicatedDeskDetail_summary-total">
                                    <span>Total</span>
                                    <span>PKR {total.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <button
                            className="DedicatedDeskDetail_continue-btn"
                            disabled={!startDate || !endDate || bookingLoading || isOwner || !user}
                            onClick={handleBooking}
                        >
                            {bookingLoading ? (
                                <>
                                    <span className="spinner-small"></span>
                                    Processing...
                                </>
                            ) : (
                                'Confirm Booking'
                            )}
                        </button>
                    </div>

                    {/* IMAGE SLIDER SECTION */}
                    <div className="DedicatedDeskDetail_right">
                        <div
                            className="DedicatedDeskDetail_gallery"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            {images.length > 0 && images[0] ? (
                                <>
                                    {imageLoading && !loadedImages[currentImage] && (
                                        <div className="DedicatedDeskDetail_image_loader">
                                            <div className="DedicatedDeskDetail_spinner_small"></div>
                                        </div>
                                    )}

                                    <img
                                        key={currentImage}
                                        src={images[currentImage]}
                                        alt={`${space.title} - Image ${currentImage + 1}`}
                                        className={`DedicatedDeskDetail_main-img ${imageLoading && !loadedImages[currentImage] ? 'hidden' : 'visible'}`}
                                        onLoad={() => {
                                            setImageLoading(false);
                                            setLoadedImages(prev => ({ ...prev, [currentImage]: true }));
                                        }}
                                        onError={(e) => {
                                            console.error('Image failed to load');
                                            e.target.src = 'https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c?w=800';
                                            setImageLoading(false);
                                        }}
                                    />

                                    {images.length > 1 && (
                                        <>
                                            <button
                                                className="DedicatedDeskDetail_img-nav DedicatedDeskDetail_prev"
                                                onClick={prevImage}
                                                aria-label="Previous image"
                                            >
                                                ‹
                                            </button>
                                            <button
                                                className="DedicatedDeskDetail_img-nav DedicatedDeskDetail_next"
                                                onClick={nextImage}
                                                aria-label="Next image"
                                            >
                                                ›
                                            </button>
                                            <div className="DedicatedDeskDetail_img-counter">
                                                {currentImage + 1} / {images.length}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="DedicatedDeskDetail_no-img">
                                    <img
                                        src="https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c?w=800"
                                        alt="Fallback"
                                        className="DedicatedDeskDetail_main-img"
                                    />
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="DedicatedDeskDetail_thumbnails">
                                {images.slice(0, 6).map((img, i) => (
                                    <div
                                        key={i}
                                        className={`DedicatedDeskDetail_thumb_wrapper ${i === currentImage ? 'active' : ''}`}
                                        onClick={() => goToImage(i)}
                                    >
                                        <img
                                            src={img}
                                            alt={`Thumbnail ${i + 1}`}
                                            className="DedicatedDeskDetail_thumb"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c?w=800';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="DedicatedDeskDetail_bottom">
                    <div className="DedicatedDeskDetail_section">
                        <h3 className="DedicatedDeskDetail_section-title">About this space</h3>
                        <p className="DedicatedDeskDetail_description">
                            {space.description || `A premium ${space.unit_type?.replace('_', ' ') || 'workspace'} located in the heart of ${space.city || space.location}. Perfect for professionals, freelancers, and teams looking for a productive environment.`}
                        </p>
                    </div>

                    {/* Working Hours */}
                    {(space.opening_time && space.closing_time) && (
                        <div className="DedicatedDeskDetail_section">
                            <h3 className="DedicatedDeskDetail_section-title">Working Hours</h3>
                            <p className="DedicatedDeskDetail_working_hours">
                                ⏰ {space.opening_time} - {space.closing_time}
                            </p>
                            {space.working_days && space.working_days.length > 0 && (
                                <p className="DedicatedDeskDetail_working_days">
                                    📅 {space.working_days.join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Amenities */}
                    {amenities.length > 0 && (
                        <div className="DedicatedDeskDetail_section">
                            <h3 className="DedicatedDeskDetail_section-title">Amenities</h3>
                            <div className="DedicatedDeskDetail_features">
                                {amenities.map((item, i) => (
                                    <span key={i} className="DedicatedDeskDetail_feature-tag">✓ {item}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Space Information */}
                    <div className="DedicatedDeskDetail_section">
                        <h3 className="DedicatedDeskDetail_section-title">Space Information</h3>
                        <div className="DedicatedDeskDetail_space_info">
                            {space.space_name && <p><strong>🏢 Space Name:</strong> {space.space_name}</p>}
                            <p><strong>📌 Unit Type:</strong> {space.unit_type?.replace('_', ' ')}</p>
                            {space.total_capacity && <p><strong>👥 Total Capacity:</strong> {space.total_capacity} seats</p>}
                            {space.address && <p><strong>📍 Address:</strong> {space.address}</p>}
                            {space.city && <p><strong>🌆 City:</strong> {space.city}</p>}
                            {isOwner && <p className="verified">👑 You are the owner of this space</p>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DedicatedDeskDetail;