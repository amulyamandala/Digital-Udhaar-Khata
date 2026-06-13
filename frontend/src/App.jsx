import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages - Auth
import Login from "./pages/Login";
import Register from "./pages/Register";

// Pages - Main
import Dashboard from "./pages/Dashboard";
import Profile from "./components/CustomerProfile";
import PaymentSimulator from "./components/PaymentSimulator";

// Layout for protected pages
const ProtectedLayout = ({ children }) => (
  <div className="d-flex flex-column min-vh-100">
    <NavBar />
    <main className="flex-grow-1">
      {children}
    </main>
    <Footer />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication routes - No NavBar/Footer */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Public payment simulation */}
      <Route path="/pay-mock/:id" element={<PaymentSimulator />} />

      {/* Protected routes - With NavBar/Footer */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Profile />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <div className="container py-4">
                <h1>Customers Page</h1>
                <p>Customer management page coming soon...</p>
              </div>
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <div className="container py-4">
                <h1>Transactions Page</h1>
                <p>Transaction management page coming soon...</p>
              </div>
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <div className="container py-4">
                <h1>Payments Page</h1>
                <p>Payment management page coming soon...</p>
              </div>
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/statements"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <div className="container py-4">
                <h1>Statements Page</h1>
                <p>Statement management page coming soon...</p>
              </div>
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <div className="container py-4">
                <h1>Analytics Page</h1>
                <p>Analytics dashboard coming soon...</p>
              </div>
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/voice"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <div className="container py-4">
                <h1>Voice Assistant Page</h1>
                <p>Voice Assistant coming soon...</p>
              </div>
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback redirection */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
