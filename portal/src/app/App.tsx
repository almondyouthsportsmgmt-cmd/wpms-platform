import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { MainLayout } from "../components/layout/MainLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { CustomersPage } from "../features/customers/CustomersPage";
import { CustomerDetailPage } from "../features/customers/CustomerDetailPage";
import { PetsPage } from "../features/pets/PetsPage";
import { PetDetailPage } from "../features/pets/PetDetailPage";
import { AppointmentsPage } from "../features/appointments/AppointmentsPage";
import { GroomingPage } from "../features/grooming/GroomingPage";
import { BoardingPage } from "../features/boarding/BoardingPage";
import { MessagesPage } from "../features/messages/MessagesPage";
import { PaymentsPage } from "../features/payments/PaymentsPage";
import { EmployeesPage } from "../features/employees/EmployeesPage";
import { InventoryPage } from "../features/inventory/InventoryPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { ClientPortalPage } from "../features/clientPortal/ClientPortalPage";
import { AiReceptionistPage } from "../features/aiReceptionist/AiReceptionistPage";
import { SmsIntegrationPage } from "../features/sms/SmsIntegrationPage";
import { MobileStaffPage } from "../features/mobileStaff/MobileStaffPage";
import { PetTimelinePage } from "../features/petTimeline/PetTimelinePage";
export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route element={<ProtectedRoute/>}><Route element={<MainLayout/>}>
      <Route index element={<DashboardPage/>}/>
      <Route path="customers" element={<CustomersPage/>}/>
      <Route path="customers/:id" element={<CustomerDetailPage/>}/>
      <Route path="pets" element={<PetsPage/>}/>
      <Route path="pets/:id" element={<PetDetailPage/>}/>
      <Route path="calendar" element={<AppointmentsPage/>}/>
      <Route path="appointments" element={<AppointmentsPage/>}/>
      <Route path="grooming" element={<GroomingPage/>}/>
      <Route path="boarding" element={<BoardingPage/>}/>
      <Route path="messages" element={<MessagesPage/>}/>
      <Route path="payments" element={<PaymentsPage/>}/>
      <Route path="employees" element={<EmployeesPage/>}/>
      <Route path="inventory" element={<InventoryPage/>}/>
      <Route path="reports" element={<ReportsPage/>}/>
      <Route path="settings" element={<SettingsPage/>}/>
      <Route path="client-portal" element={<ClientPortalPage/>}/>
      <Route path="ai-receptionist" element={<AiReceptionistPage/>}/>
      <Route path="sms-integration" element={<SmsIntegrationPage/>}/>
      <Route path="staff-mobile" element={<MobileStaffPage/>}/>
      <Route path="pet-timeline" element={<PetTimelinePage/>}/>
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
