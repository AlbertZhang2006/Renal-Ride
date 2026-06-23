import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './data/AuthContext';
import { RoleProvider, AuthRoleProvider, useRole } from './data/RoleContext';
import { NotificationProvider } from './data/NotificationContext';
import { DemoScenarioProvider } from './data/DemoScenarioContext';
import { AppLayout } from './layouts/AppLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { AuthLogin } from './pages/AuthLogin';
import { AuthSignup } from './pages/AuthSignup';
import { ForgotPassword } from './pages/ForgotPassword';
import { RequestDemo } from './pages/RequestDemo';
import { PendingApproval } from './pages/PendingApproval';
import { PatientView } from './pages/PatientView';
import { CaregiverView } from './pages/CaregiverView';
import { VendorView } from './pages/VendorView';
import { AdminView } from './pages/AdminView';
import { ClinicDashboard } from './pages/ClinicDashboard';
import { ClinicRidesBoard } from './pages/ClinicRidesBoard';
import { ClinicPatients } from './pages/ClinicPatients';
import { ClinicStandingOrders } from './pages/ClinicStandingOrders';
import { ClinicReturnRides } from './pages/ClinicReturnRides';
import { ClinicRiskQueue } from './pages/ClinicRiskQueue';
import { ClinicReports } from './pages/ClinicReports';
import { PlaceholderPage } from './pages/PlaceholderPage';
import type { UserRole } from './types';

function DemoProviders() {
  return (
    <RoleProvider>
      <NotificationProvider>
        <DemoScenarioProvider>
          <Outlet />
        </DemoScenarioProvider>
      </NotificationProvider>
    </RoleProvider>
  );
}

function ProtectedRoute() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!profile || profile.approval_status === 'pending')
    return <Navigate to="/pending-approval" replace />;
  if (profile.approval_status === 'denied') return <Navigate to="/login" replace />;

  const role = profile.role as UserRole;

  return (
    <AuthRoleProvider
      role={role}
      user={{ id: profile.id, name: profile.full_name, email: profile.email, role }}
      onLogout={signOut}
    >
      <NotificationProvider>
        <Outlet />
      </NotificationProvider>
    </AuthRoleProvider>
  );
}

function AppIndexRedirect() {
  const { role } = useRole();
  return <Navigate to={role ? `/app/${role}` : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthLogin />} />
          <Route path="/signup" element={<AuthSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/request-demo" element={<RequestDemo />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Demo routes — localStorage role, mock data */}
          <Route path="/demo" element={<DemoProviders />}>
            <Route index element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="patient" element={<PatientView />} />
              <Route path="patient/schedule" element={<PatientView />} />
              <Route path="patient/help" element={<PatientView />} />
              <Route path="patient/profile" element={<PatientView />} />

              <Route path="caregiver" element={<CaregiverView />} />
              <Route path="caregiver/alerts" element={<CaregiverView />} />
              <Route path="caregiver/schedule" element={<CaregiverView />} />
              <Route path="caregiver/help" element={<CaregiverView />} />

              <Route path="clinic" element={<ClinicDashboard />} />
              <Route path="clinic/rides" element={<ClinicRidesBoard />} />
              <Route path="clinic/patients" element={<ClinicPatients />} />
              <Route path="clinic/standing-orders" element={<ClinicStandingOrders />} />
              <Route path="clinic/returns" element={<ClinicReturnRides />} />
              <Route path="clinic/risk-queue" element={<ClinicRiskQueue />} />
              <Route path="clinic/reports" element={<ClinicReports />} />
              <Route path="clinic/:sub" element={<PlaceholderPage />} />

              <Route path="vendor" element={<VendorView />} />
              <Route path="vendor/trips" element={<VendorView />} />
              <Route path="vendor/drivers" element={<VendorView />} />
              <Route path="vendor/issues" element={<VendorView />} />
              <Route path="vendor/completed" element={<VendorView />} />

              <Route path="admin" element={<AdminView />} />
              <Route path="admin/orgs" element={<AdminView />} />
              <Route path="admin/users" element={<AdminView />} />
              <Route path="admin/vendors" element={<AdminView />} />
              <Route path="admin/reports" element={<AdminView />} />
              <Route path="admin/audit" element={<AdminView />} />
              <Route path="admin/settings" element={<AdminView />} />
            </Route>
          </Route>

          {/* Protected app routes — Supabase auth, real data */}
          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<AppIndexRedirect />} />

              <Route path="patient" element={<PatientView />} />
              <Route path="patient/schedule" element={<PatientView />} />
              <Route path="patient/help" element={<PatientView />} />
              <Route path="patient/profile" element={<PatientView />} />

              <Route path="caregiver" element={<CaregiverView />} />
              <Route path="caregiver/alerts" element={<CaregiverView />} />
              <Route path="caregiver/schedule" element={<CaregiverView />} />
              <Route path="caregiver/help" element={<CaregiverView />} />

              <Route path="clinic" element={<ClinicDashboard />} />
              <Route path="clinic/rides" element={<ClinicRidesBoard />} />
              <Route path="clinic/patients" element={<ClinicPatients />} />
              <Route path="clinic/standing-orders" element={<ClinicStandingOrders />} />
              <Route path="clinic/returns" element={<ClinicReturnRides />} />
              <Route path="clinic/risk-queue" element={<ClinicRiskQueue />} />
              <Route path="clinic/reports" element={<ClinicReports />} />
              <Route path="clinic/:sub" element={<PlaceholderPage />} />

              <Route path="vendor" element={<VendorView />} />
              <Route path="vendor/trips" element={<VendorView />} />
              <Route path="vendor/drivers" element={<VendorView />} />
              <Route path="vendor/issues" element={<VendorView />} />
              <Route path="vendor/completed" element={<VendorView />} />

              <Route path="admin" element={<AdminView />} />
              <Route path="admin/orgs" element={<AdminView />} />
              <Route path="admin/users" element={<AdminView />} />
              <Route path="admin/vendors" element={<AdminView />} />
              <Route path="admin/reports" element={<AdminView />} />
              <Route path="admin/audit" element={<AdminView />} />
              <Route path="admin/settings" element={<AdminView />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
