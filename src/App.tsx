import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider, useRole } from './data/RoleContext';
import { NotificationProvider } from './data/NotificationContext';
import { AppLayout } from './layouts/AppLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
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

function AppIndexRedirect() {
  const { role } = useRole();
  return <Navigate to={role ? `/app/${role}` : '/login'} replace />;
}

export default function App() {
  return (
    <RoleProvider>
      <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<AppLayout />}>
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
        </Routes>
      </BrowserRouter>
      </NotificationProvider>
    </RoleProvider>
  );
}
