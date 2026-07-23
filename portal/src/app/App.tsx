import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { MainLayout } from "../components/layout/MainLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { PlaceholderPage } from "../features/shared/PlaceholderPage";
import { CustomersPage } from "../features/customers/CustomersPage";
import { CustomerDetailPage } from "../features/customers/CustomerDetailPage";
import { PetsPage } from "../features/pets/PetsPage";
import { PetDetailPage } from "../features/pets/PetDetailPage";
import { AppointmentsPage } from "../features/appointments/AppointmentsPage";
import { GroomingPage } from "../features/grooming/GroomingPage";
import { BoardingPage } from "../features/boarding/BoardingPage";
import { MessagesPage } from "../features/messages/MessagesPage";
const modules = [["payments","Payments"],["employees","Employees"],["inventory","Inventory"],["reports","Reports"],["settings","Settings"]] as const;
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
      {modules.map(([path,title]) => <Route key={path} path={path} element={<PlaceholderPage title={title}/>}/>)}
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
