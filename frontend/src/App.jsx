import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedLayout from './components/ProtectedLayout';
import ApartmentsPage from './pages/ApartmentsPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MaintenancePage from './pages/MaintenancePage';
import NotFound from './pages/NotFound';
import PaymentsPage from './pages/PaymentsPage';
import RentalsPage from './pages/RentalsPage';
import RolesPage from './pages/RolesPage';
import TenantsPage from './pages/TenantsPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected pages — wrap each element */}
        <Route path="/" element={
          <ProtectedLayout allowedRoles={['Admin', 'Landlord', 'Tenant']}>
            <Dashboard />
          </ProtectedLayout>
        } />

        <Route path="/users" element={
          <ProtectedLayout allowedRoles={['Admin']}>
            <UsersPage />
          </ProtectedLayout>
        } />

        <Route path="/roles" element={
          <ProtectedLayout allowedRoles={['Admin']}>
            <RolesPage />
          </ProtectedLayout>
        } />

        <Route path="/apartments" element={
          <ProtectedLayout allowedRoles={['Admin', 'Landlord', 'Tenant']}>
            <ApartmentsPage />
          </ProtectedLayout>
        } />

        <Route path="/tenants" element={
          <ProtectedLayout allowedRoles={['Admin', 'Landlord']}>
            <TenantsPage />
          </ProtectedLayout>
        } />

        <Route path="/rentals" element={
          <ProtectedLayout allowedRoles={['Admin', 'Landlord', 'Tenant']}>
            <RentalsPage />
          </ProtectedLayout>
        } />

        <Route path="/payments" element={
          <ProtectedLayout allowedRoles={['Admin', 'Landlord', 'Tenant']}>
            <PaymentsPage />
          </ProtectedLayout>
        } />

        <Route path="/maintenance" element={
          <ProtectedLayout allowedRoles={['Admin', 'Landlord', 'Tenant']}>
            <MaintenancePage />
          </ProtectedLayout>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
