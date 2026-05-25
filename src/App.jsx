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
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
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
                <Route path="/create-space" element={
                    <ProtectedRoute>
                        <CreateSpace />
                    </ProtectedRoute>
                } />
                <Route path="/seller-dashboard" element={
                    <ProtectedRoute>
                        <SellerDashboard />
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



                <Route path="/spaces/:id" element={<SpaceDetail />} />
                <Route path="/dedicated-desk/:id" element={<DedicatedDesksDetails />} />
                <Route path="/private-cabins/:id" element={<PrivateCabinsDetail />} />
                <Route path="/meeting-rooms/:id" element={<MeetingRoomsDetail />} />
            </Routes>
        </>
    );
}

export default App;