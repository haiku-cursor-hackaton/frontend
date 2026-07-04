import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Wallet from "@/pages/Wallet";
import Perfil from "@/pages/Perfil";
import Comercio from "@/pages/Comercio";
import Historial from "@/pages/Historial";
import Agente from "@/pages/Agente";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/comercio" element={<Comercio />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/agente" element={<Agente />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
