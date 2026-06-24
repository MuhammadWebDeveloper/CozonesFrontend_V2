import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import HostRequestForm from './sellersitecomponents/sellerdashboard/BecomeHost';
import RequestStatus from './sellersitecomponents/sellerdashboard/Hoststatus';
// import NotFound from './u'; // 👈 Import the NotFound component

// ── Chat imports ───────────────────────────────────────────────────────────
import ChatList from './chat-frontend/pages/ChatList.jsx';
import ChatDetail from './chat-frontend/pages/ChatDetail.jsx';
// ──────────────────────────────────────────────────────────────────────────

// ── Admin imports ──────────────────────────────────────────────────────────
import AdminLayout from './admin/components/AdminLayout';
import AdminProtectedRoute from './admin/components/AdminProtectedRoute';
import AdminLogin from './Admin/pages/AdminLogin.jsx';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminSpaces from './admin/pages/AdminSpaces';
import AdminBookings from './admin/pages/AdminBookings';
import AdminHostRequests from './admin/pages/AdminHostRequests';
import AdminUsers from './admin/pages/AdminUsers';
import SearchResults from './utils/SearchResults.jsx';
import AdminDisputes from './Admin/pages/AdminDisputes.jsx';
import NotFound from './utils/PageNoteFound.jsx';
// ──────────────────────────────────────────────────────────────────────────

// Routes where Navbar should be hidden
const HIDE_NAVBAR_ROUTES = [
    '/seller-dashboard',
    '/create-space',
    '/admin',          // hide navbar on all /admin/* routes
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
            {!shouldHideNavbar && <Navbar />}

            <Routes>
                {/* ── Public Routes ───────────────────────────────────── */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* ── Public Space Detail Routes ───────────────────────── */}
                <Route path="/spaces/:id" element={<SpaceDetail />} />
                <Route path="/dedicated-desk/:id" element={<DedicatedDesksDetails />} />
                <Route path="/private-cabins/:id" element={<PrivateCabinsDetail />} />
                <Route path="/meeting-rooms/:id" element={<MeetingRoomsDetail />} />
                <Route path="/search-results" element={<SearchResults />} />

                {/* ── Protected User Routes ────────────────────────────── */}
                <Route path="/My-Profile" element={
                    <ProtectedRoute><ProfileSidebar /></ProtectedRoute>
                } />
                <Route path="/my-favorites" element={
                    <ProtectedRoute><MyFavorites /></ProtectedRoute>
                } />
                <Route path="/my-bookings" element={
                    <ProtectedRoute><MyBookings /></ProtectedRoute>
                } />

                {/* ── Chat Routes ──────────────────────────────────────── */}
                <Route path="/chats" element={
                    <ProtectedRoute><ChatList /></ProtectedRoute>
                } />
                <Route path="/chats/:id" element={
                    <ProtectedRoute><ChatDetail /></ProtectedRoute>
                } />
                {/* ─────────────────────────────────────────────────────── */}

                {/* ── Protected Seller Routes ──────────────────────────── */}
                <Route path="/seller-dashboard" element={
                    <ProtectedRoute><SellerDashboard /></ProtectedRoute>
                } />
                <Route path="/create-space" element={
                    <ProtectedRoute><CreateSpace /></ProtectedRoute>
                } />
                <Route path="/space/:spaceId" element={
                    <ProtectedRoute><SpaceDetails /></ProtectedRoute>
                } />
                <Route path="/spaces/:spaceId/addunits" element={
                    <ProtectedRoute><AddUnit /></ProtectedRoute>
                } />
                <Route path="/space/update/:id" element={
                    <ProtectedRoute><UpdateSpace /></ProtectedRoute>
                } />
                <Route path="/spaces/:spaceId/units/:unitId/edit" element={
                    <ProtectedRoute><UpdateUnit /></ProtectedRoute>
                } />
                <Route path="/become-host" element={
                    <ProtectedRoute><HostRequestForm /></ProtectedRoute>
                } />
                <Route path="/host-requests/status/:requestId?" element={
                    <ProtectedRoute><RequestStatus /></ProtectedRoute>
                } />

                {/* ── Admin Routes ─────────────────────────────────────── */}
                <Route path="/admin/login" element={<AdminLogin />} />

                <Route
                    path="/admin"
                    element={
                        <AdminProtectedRoute>
                            <AdminLayout />
                        </AdminProtectedRoute>
                    }
                >
                    <Route index element={<AdminDashboard />} />
                    <Route path="spaces" element={<AdminSpaces />} />
                    <Route path="bookings" element={<AdminBookings />} />
                    <Route path="hosts" element={<AdminHostRequests />} />
                    <Route path="disputes" element={<AdminDisputes />} />
                    <Route path="users" element={<AdminUsers />} />
                </Route>
                {/* ─────────────────────────────────────────────────────── */}

                {/* ── 404 Not Found Route - MUST BE LAST ──────────────── */}
                <Route path="*" element={<NotFound />} />
                {/* ─────────────────────────────────────────────────────── */}
            </Routes>
        </>
    );
}

export default App;