import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";
import CustomerLayout from "@/layouts/CustomerLayout";
import OwnerLayout from "@/layouts/OwnerLayout";

// Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyAccount from "@/pages/VerifyAccount";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/customer/Home";
import HotelLanding from "@/pages/customer/HotelLanding";
import VehicleLanding from "@/pages/customer/VehicleLanding";
import ActivityLanding from "@/pages/customer/ActivityLanding";
import ServiceDetail from "@/pages/customer/ServiceDetail";
import MyOrders from "@/pages/customer/MyOrders";
import OrderDetail from "@/pages/customer/OrderDetail";
import BookingPage from "@/pages/customer/BookingPage";
import TripPlanner from "@/pages/customer/TripPlanner";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminGeography from "@/pages/admin/Geography";
import AdminProviders from "@/pages/admin/Providers";
import OwnerDashboard from "@/pages/owner/Dashboard";
import OwnerMyProviders from "@/pages/owner/MyProviders";
import OwnerMyServices from "@/pages/owner/MyServices";
import OwnerServiceDetail from "@/pages/owner/ServiceDetail";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-account" element={<VerifyAccount />} />

            {/* Customer Routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/hotels" element={<HotelLanding />} />
              <Route path="/bus-shuttle" element={<VehicleLanding />} />
              <Route path="/activities" element={<ActivityLanding />} />
              <Route path="/services" element={<Navigate to="/" replace />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route
                path="/my-orders"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <MyOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-orders/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trip-planner"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <TripPlanner />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer']}><Profile /></ProtectedRoute>} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUsers />} />
              <Route path="geography" element={<AdminGeography />} />
              <Route path="area-ownerships" element={<AdminProviders />} />
              <Route path="providers" element={<AdminProviders />} />
              <Route path="providers/:id" element={<AdminProviders />} />
              <Route path="services" element={<AdminDashboard />} />
              <Route path="services/:id" element={<AdminDashboard />} />
              <Route path="orders" element={<AdminDashboard />} />
              <Route path="orders/:id" element={<AdminDashboard />} />
              <Route path="vouchers" element={<AdminDashboard />} />
              <Route path="vouchers/:id" element={<AdminDashboard />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Owner Routes */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="providers" element={<OwnerMyProviders />} />
              <Route path="services" element={<OwnerMyServices />} />
              <Route path="services/:idItem" element={<OwnerServiceDetail />} />
              <Route path="media" element={<OwnerDashboard />} />
              <Route path="orders" element={<OwnerDashboard />} />
              <Route path="orders/:id" element={<OwnerDashboard />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
