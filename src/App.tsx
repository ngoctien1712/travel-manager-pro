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
import NotFound from "@/pages/NotFound";
import Home from "@/pages/customer/Home";
import AdminDashboard from "@/pages/admin/Dashboard";
import OwnerDashboard from "@/pages/owner/Dashboard";

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

            {/* Customer Routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Home />} />
              <Route path="/services/:id" element={<Home />} />
              <Route path="/cart" element={<ProtectedRoute allowedRoles={['customer']}><Home /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute allowedRoles={['customer']}><Home /></ProtectedRoute>} />
              <Route path="/my-orders" element={<ProtectedRoute allowedRoles={['customer']}><Home /></ProtectedRoute>} />
              <Route path="/my-orders/:id" element={<ProtectedRoute allowedRoles={['customer']}><Home /></ProtectedRoute>} />
              <Route path="/trip-planner" element={<Home />} />
              <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer']}><Home /></ProtectedRoute>} />
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
              <Route path="users" element={<AdminDashboard />} />
              <Route path="users/:id" element={<AdminDashboard />} />
              <Route path="providers" element={<AdminDashboard />} />
              <Route path="providers/:id" element={<AdminDashboard />} />
              <Route path="services" element={<AdminDashboard />} />
              <Route path="services/:id" element={<AdminDashboard />} />
              <Route path="orders" element={<AdminDashboard />} />
              <Route path="orders/:id" element={<AdminDashboard />} />
              <Route path="vouchers" element={<AdminDashboard />} />
              <Route path="vouchers/:id" element={<AdminDashboard />} />
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
              <Route path="services" element={<OwnerDashboard />} />
              <Route path="services/:id" element={<OwnerDashboard />} />
              <Route path="media" element={<OwnerDashboard />} />
              <Route path="orders" element={<OwnerDashboard />} />
              <Route path="orders/:id" element={<OwnerDashboard />} />
              <Route path="profile" element={<OwnerDashboard />} />
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
