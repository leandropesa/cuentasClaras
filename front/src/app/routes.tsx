import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { CrearGrupo } from "./pages/CrearGrupo";
import { ConfigurarGrupo } from "./pages/ConfigurarGrupo";
import { MisGrupos } from "./pages/MisGrupos";
import { UnirseGrupo } from "./pages/UnirseGrupo";
import { Dashboard } from "./pages/Dashboard";
import { ResumenGastos } from "./pages/ResumenGastos";
import { CargarGasto } from "./pages/CargarGasto";
import { BalanceMensual } from "./pages/BalanceMensual";
import { EstadoCuentas } from "./pages/EstadoCuentas";
import { Register } from "./pages/Register";
import { BalanceGlobal } from "./pages/BalanceGlobal";
import { CuentaCorriente } from "./pages/CuentaCorriente";
import { Fondo } from "./pages/Fondo";
import { Cuentas } from "./pages/Cuentas";
import { ValidarComprobantes } from "./pages/ValidarComprobantes";
import { CasaFamiliarDashboard } from "./pages/CasaFamiliarDashboard";
import { CargarGastoCasaFamiliar } from "./pages/CargarGastoCasaFamiliar";
import { CasaFamiliarConfig } from "./pages/CasaFamiliarConfig";
import { GestionMora } from "./pages/GestionMora";
import { InvitationAccept } from "./pages/InvitationAccept";
import { HistorialPeriodos } from "./pages/HistorialPeriodos";
import { GastosRecurrentes } from "./pages/GastosRecurrentes";

export const router = createBrowserRouter([
  // Raíz → login
  { path: "/",                 element: <Navigate to="/login" replace /> },

  // Públicas
  { path: "/login",            Component: Login },
  { path: "/registro",         Component: Register },
  { path: "/invitation/accept", Component: InvitationAccept },
  { path: "/mis-grupos",       element: <ProtectedRoute><MisGrupos /></ProtectedRoute> },
  { path: "/crear-grupo",      element: <ProtectedRoute><CrearGrupo /></ProtectedRoute> },
  { path: "/configurar-grupo", element: <ProtectedRoute><ConfigurarGrupo /></ProtectedRoute> },
  { path: "/unirse-grupo",     element: <ProtectedRoute><UnirseGrupo /></ProtectedRoute> },

  // Propiedad Horizontal
  { path: "/inicio",           element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: "/balance-global",   element: <ProtectedRoute><BalanceGlobal /></ProtectedRoute> },
  { path: "/cargar-gasto",     element: <ProtectedRoute><CargarGasto /></ProtectedRoute> },
  { path: "/balance-mensual",  element: <ProtectedRoute><BalanceMensual /></ProtectedRoute> },
  { path: "/estado-cuentas",   element: <ProtectedRoute><EstadoCuentas /></ProtectedRoute> },
  { path: "/cuenta-corriente", element: <ProtectedRoute><CuentaCorriente /></ProtectedRoute> },
{ path: "/resumen-gastos",   element: <ProtectedRoute><ResumenGastos /></ProtectedRoute> },
  { path: "/fondo",            element: <ProtectedRoute><Fondo /></ProtectedRoute> },
  { path: "/cuentas",          element: <ProtectedRoute><Cuentas /></ProtectedRoute> },
  { path: "/validar-comprobantes", element: <ProtectedRoute><ValidarComprobantes /></ProtectedRoute> },
  { path: "/casa-familiar/:id",              element: <ProtectedRoute><CasaFamiliarDashboard /></ProtectedRoute> },
  { path: "/casa-familiar/:id/cargar-gasto", element: <ProtectedRoute><CargarGastoCasaFamiliar /></ProtectedRoute> },
  { path: "/casa-familiar/:id/configurar",   element: <ProtectedRoute><CasaFamiliarConfig /></ProtectedRoute> },
  { path: "/gestion-mora",        element: <ProtectedRoute><GestionMora /></ProtectedRoute> },
  { path: "/historial-periodos",  element: <ProtectedRoute><HistorialPeriodos /></ProtectedRoute> },
  { path: "/gastos-recurrentes",  element: <ProtectedRoute><GastosRecurrentes /></ProtectedRoute> },
]);
