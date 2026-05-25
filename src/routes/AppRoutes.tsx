import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import DashboardPage from '../pages/DashboardPage';
import ProductsPage from '../pages/ProductsPage';
import OrdersPage from '../pages/OrdersPage';
import ClientsPage from '../pages/ClientsPage';
import FinancialPage from '../pages/FinancialPage';
import ExpensesPage from '../pages/ExpensesPage';
import ReceivablesPage from '../pages/ReceivablesPage';
import ReportsPage from '../pages/ReportsPage';
import WithdrawalsPage from '../pages/WithdrawalsPage';
import ReturnsPage from '../pages/ReturnsPage';
import StockMovementsPage from '../pages/StockMovementsPage';
import SettingsPage from '../pages/SettingsPage';
import BackupPage from '../pages/BackupPage';
import LoginPage from '../pages/LoginPage';
import MapPage from '../pages/MapPage';
import AuditPage from '../pages/AuditPage';
import ProtectedRoute from './ProtectedRoute';

function protect(page: any, roles: string[]) {
  return (
    <ProtectedRoute roles={roles}>
      {page}
    </ProtectedRoute>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={protect(<DashboardPage />, ['ADMIN', 'SALES', 'FINANCE'])}
        />

        <Route
          path="/produtos"
          element={protect(<ProductsPage />, ['ADMIN', 'SALES'])}
        />

        <Route
          path="/estoque"
          element={protect(<StockMovementsPage />, ['ADMIN', 'SALES'])}
        />

        <Route
          path="/pedidos"
          element={protect(<OrdersPage />, ['ADMIN', 'SALES', 'DELIVERY'])}
        />

        <Route
          path="/clientes"
          element={protect(<ClientsPage />, ['ADMIN', 'SALES'])}
        />

        <Route
          path="/mapa"
          element={protect(<MapPage />, ['ADMIN', 'SALES', 'DELIVERY'])}
        />

        <Route
          path="/financeiro"
          element={protect(<FinancialPage />, ['ADMIN', 'FINANCE'])}
        />

        <Route
          path="/despesas"
          element={protect(<ExpensesPage />, ['ADMIN', 'FINANCE'])}
        />

        <Route
          path="/receber"
          element={protect(<ReceivablesPage />, ['ADMIN', 'SALES', 'FINANCE'])}
        />

        <Route
          path="/retiradas"
          element={protect(<WithdrawalsPage />, ['ADMIN', 'SALES', 'DELIVERY'])}
        />

        <Route
          path="/agenda-retirada"
          element={protect(<ReturnsPage />, ['ADMIN'])}
        />

        <Route
          path="/relatorios"
          element={protect(<ReportsPage />, ['ADMIN', 'FINANCE'])}
        />

        <Route
          path="/historico"
          element={protect(<AuditPage />, ['ADMIN'])}
        />

        <Route
          path="/configuracoes"
          element={protect(<SettingsPage />, ['ADMIN'])}
        />

        <Route
          path="/backup"
          element={protect(<BackupPage />, ['ADMIN'])}
        />
      </Routes>
    </BrowserRouter>
  );
}
