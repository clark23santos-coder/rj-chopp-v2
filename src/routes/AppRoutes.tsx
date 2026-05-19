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

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/produtos" element={<ProductsPage />} />
        <Route path="/estoque" element={<StockMovementsPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/clientes" element={<ClientsPage />} />
        <Route path="/financeiro" element={<FinancialPage />} />
        <Route path="/despesas" element={<ExpensesPage />} />
        <Route path="/receber" element={<ReceivablesPage />} />
        <Route path="/retiradas" element={<WithdrawalsPage />} />
        <Route path="/agenda-retirada" element={<ReturnsPage />} />
        <Route path="/relatorios" element={<ReportsPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
