import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './sitecomponents/headerandfooter/Header';
import Home from './sitecomponents/pages/Home';
import './App.css';
import SpaceDetail from './utils/spacesdetailedpage';
import DedicatedDesksDetails from './utils/dedicatedSpaceDetails';
import PrivateCabinsDetail from './utils/PrivateCabinsDetails';
import MeetingRoomsDetail from './utils/Meetingroomsdetails';
import MyFavorites from './sitecomponents/favrioutes/myfavorite';
import Login from './sitecomponents/auth/Login';
import Register from './sitecomponents/auth/Register';
import ProfileSidebar from './sitecomponents/auth/ProfileSidebar';
import SellerDashboard from './sellersitecomponents/sellerdashboard/SellerDashboard';
import ProtectedRoute from './routesauthenticationprotection/routes_authentication';
import Loader from './utils/cozonesloader';
import CreateSpace from './sellersitecomponents/sellerdashboard/SellerCreateSpace';
import SpaceDetails from './sellersitecomponents/sellerdashboard/spacesDetails';
import AddUnit from './sellersitecomponents/utils/AddUnits';
import UpdateSpace from './sellersitecomponents/utils/UpdateSpace';
import UpdateUnit from './sellersitecomponents/utils/UpdateUnits';
import MyBookings from './utils/MyBookings';
import ForgotPassword from './utils/ForgotPassword';
import ResetPassword from './utils/ResetPassword';

// Routes where Navbar should be hidden (these pages have their own navigation)
const HIDE_NAVBAR_ROUTES = [
    '/seller-dashboard',
    '/create-space',
];

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

function AppContent() {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);

    // Check if current path should hide navbar
    const shouldHideNavbar = HIDE_NAVBAR_ROUTES.some(route =>
        location.pathname === route || location.pathname.startsWith(route)
    );

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    if (isLoading) {
        return (
            <div className="loader-fullpage">
                <Loader size="large" text="Loading..." />
            </div>
        );
    }

    return (
        <>
            {/* Conditionally render Navbar - hide on seller dashboard and protected routes */}
            {!shouldHideNavbar && <Navbar />}

            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Auth Routes - Forgot/Reset Password */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Public Space Detail Routes */}
                <Route path="/spaces/:id" element={<SpaceDetail />} />
                <Route path="/dedicated-desk/:id" element={<DedicatedDesksDetails />} />
                <Route path="/private-cabins/:id" element={<PrivateCabinsDetail />} />
                <Route path="/meeting-rooms/:id" element={<MeetingRoomsDetail />} />

                {/* Protected Routes - User Profile & Favorites */}
                <Route path="/My-Profile" element={
                    <ProtectedRoute>
                        <ProfileSidebar />
                    </ProtectedRoute>
                } />
                <Route path="/my-favorites" element={
                    <ProtectedRoute>
                        <MyFavorites />
                    </ProtectedRoute>
                } />
                <Route path="/my-bookings" element={
                    <ProtectedRoute>
                        <MyBookings />
                    </ProtectedRoute>
                } />

                {/* Protected Routes - Seller/Owner Dashboard */}
                <Route path="/seller-dashboard" element={
                    <ProtectedRoute>
                        <SellerDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/create-space" element={
                    <ProtectedRoute>
                        <CreateSpace />
                    </ProtectedRoute>
                } />
                <Route path="/space/:spaceId" element={
                    <ProtectedRoute>
                        <SpaceDetails />
                    </ProtectedRoute>
                } />
                <Route path="/spaces/:spaceId/addunits" element={
                    <ProtectedRoute>
                        <AddUnit />
                    </ProtectedRoute>
                } />
                <Route path="/space/update/:id" element={
                    <ProtectedRoute>
                        <UpdateSpace />
                    </ProtectedRoute>
                } />
                <Route path="/spaces/:spaceId/units/:unitId/edit" element={
                    <ProtectedRoute>
                        <UpdateUnit />
                    </ProtectedRoute>
                } />
            </Routes>
        </>
    );
}

export default App;