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

// Voice Context
import { VoiceProvider } from "./context/VoiceContext";

// Pages - Main
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/ShopProfile";
import PaymentSimulator from "./components/PaymentSimulator";
import Customers from "./pages/Customers";
import Transactions from "./pages/Transactions";
import Payments from "./pages/Payments";
import Statements from "./pages/Statements";
import Analytics from "./pages/Analytics";

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
              <Customers />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Transactions />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Payments />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/statements"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Statements />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Analytics />
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
    <VoiceProvider>
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
    </VoiceProvider>
  );
}

export default App;
