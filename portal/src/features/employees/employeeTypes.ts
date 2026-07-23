export type EmployeeRole =
  | "Owner"
  | "Manager"
  | "Groomer"
  | "Bather"
  | "Boarding Attendant"
  | "Receptionist";

export type EmployeeStatus = "Active" | "Inactive";

export type EmployeePermissions = {
  dashboard: boolean;
  customers: boolean;
  pets: boolean;
  appointments: boolean;
  grooming: boolean;
  boarding: boolean;
  messages: boolean;
  payments: boolean;
  employees: boolean;
  reports: boolean;
  settings: boolean;
};

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  hireDate: string;
  hourlyRate: number;
  colorCode: string;
  notes: string;
  permissions: EmployeePermissions;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeInput = Omit<Employee, "id" | "createdAt" | "updatedAt">;
