import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../Screen/Login";
import InicioScreen from "../Screen/Pages/Inicio/InicioScreen";
import AdminLayout from "../Screen/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import DashboardScreen from "../Screen/Pages/DashboardScreen";
import UsuariosScreen from "../Screen/Admin/Usuarios/UsuariosScreen";
import AboutUsScreen from "../Screen/Pages/AboutUs/AboutUsScreen";
import TestimoniosScreen from "../Screen/Admin/Testimonios/TestimoniosScreen";
import ServiciosScreen from "../Screen/Pages/Servicios/ServiciosScreen";
import DetallesServiciosScreen from "../Screen/Pages/DetallesServicios/DetallesServiciosScreen";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login público */}
        <Route path="/login" element={<Login />} />

        {/* AdminLayout protegido */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardScreen />} />
          <Route path="usuarios" element={<UsuariosScreen />} />
          <Route path="aboutUs" element={<AboutUsScreen />} />
          <Route path="inicio" element={<InicioScreen />} />
          <Route path="testimonios" element={<TestimoniosScreen />} />
          <Route path="servicios" element={<ServiciosScreen />} />
          <Route path="detalles/servicios" element={<DetallesServiciosScreen />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;


