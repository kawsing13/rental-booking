import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import ForgotPassword from './pages/customer/ForgotPassword';
import ResetPassword from './pages/customer/ResetPassword';
import Catalog from './pages/customer/Catalog';
import ItemDetail from './pages/customer/ItemDetail';
import BookingReview from './pages/customer/BookingReview';
import MyBookings from './pages/customer/MyBookings';
import BookingDetail from './pages/customer/BookingDetail';
import Profile from './pages/customer/Profile';
import Notifications from './pages/customer/Notifications';

import AdminDashboard from './pages/admin/Dashboard';
import AdminInventory from './pages/admin/Inventory';
import AdminCategories from './pages/admin/Categories';
import AdminBookings from './pages/admin/Bookings';
import AdminBookingDetail from './pages/admin/BookingDetail';
import AdminCalendar from './pages/admin/Calendar';
import AdminCustomers from './pages/admin/Customers';
import AdminCustomerDetail from './pages/admin/CustomerDetail';
import AdminDeliveries from './pages/admin/Deliveries';
import AdminReports from './pages/admin/Reports';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Catalog />} />
        <Route path="/items/:id" element={<ItemDetail />} />

        {/* Customer (any authenticated user) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/booking/review" element={<BookingReview />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/my-bookings/:id" element={<BookingDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Admin/staff only */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/bookings/:id" element={<AdminBookingDetail />} />
          <Route path="/admin/calendar" element={<AdminCalendar />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/customers/:id" element={<AdminCustomerDetail />} />
          <Route path="/admin/deliveries" element={<AdminDeliveries />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
