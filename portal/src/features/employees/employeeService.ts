import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { Employee, EmployeeInput, EmployeePermissions, EmployeeRole } from "./employeeTypes";

const STORAGE_KEY = "wpms-demo-employees";

const rolePermissions: Record<EmployeeRole, EmployeePermissions> = {
  Owner: {
    dashboard: true, customers: true, pets: true, appointments: true,
    grooming: true, boarding: true, messages: true, payments: true,
    employees: true, reports: true, settings: true,
  },
  Manager: {
    dashboard: true, customers: true, pets: true, appointments: true,
    grooming: true, boarding: true, messages: true, payments: true,
    employees: true, reports: true, settings: false,
  },
  Groomer: {
    dashboard: true, customers: true, pets: true, appointments: true,
    grooming: true, boarding: false, messages: true, payments: true,
    employees: false, reports: false, settings: false,
  },
  Bather: {
    dashboard: true, customers: false, pets: true, appointments: true,
    grooming: true, boarding: false, messages: false, payments: false,
    employees: false, reports: false, settings: false,
  },
  "Boarding Attendant": {
    dashboard: true, customers: true, pets: true, appointments: true,
    grooming: false, boarding: true, messages: true, payments: false,
    employees: false, reports: false, settings: false,
  },
  Receptionist: {
    dashboard: true, customers: true, pets: true, appointments: true,
    grooming: true, boarding: true, messages: true, payments: true,
    employees: false, reports: false, settings: false,
  },
};

export function permissionsForRole(role: EmployeeRole): EmployeePermissions {
  return { ...rolePermissions[role] };
}

const seed: Employee[] = [
  {
    id: "demo-employee-1",
    firstName: "Lisa",
    lastName: "Almond",
    email: "owner@whimsicalpaws.com",
    mobilePhone: "850-555-0100",
    role: "Owner",
    status: "Active",
    hireDate: "2020-01-01",
    hourlyRate: 0,
    colorCode: "#99e83f",
    notes: "Business owner and administrator.",
    permissions: permissionsForRole("Owner"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-employee-2",
    firstName: "Ashley",
    lastName: "Morgan",
    email: "ashley@whimsicalpaws.com",
    mobilePhone: "850-555-0101",
    role: "Groomer",
    status: "Active",
    hireDate: "2023-04-10",
    hourlyRate: 22,
    colorCode: "#8b5cf6",
    notes: "Preferred groomer for large breeds.",
    permissions: permissionsForRole("Groomer"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-employee-3",
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan@whimsicalpaws.com",
    mobilePhone: "850-555-0102",
    role: "Boarding Attendant",
    status: "Active",
    hireDate: "2024-02-15",
    hourlyRate: 17.5,
    colorCode: "#3b82f6",
    notes: "",
    permissions: permissionsForRole("Boarding Attendant"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function readDemo(): Employee[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as Employee[];
}

function writeDemo(items: Employee[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromRow(row: Record<string, unknown>): Employee {
  return {
    id: String(row.id),
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
    email: String(row.email ?? ""),
    mobilePhone: String(row.mobile_phone ?? ""),
    role: String(row.role ?? "Receptionist") as Employee["role"],
    status: String(row.status ?? "Active") as Employee["status"],
    hireDate: String(row.hire_date ?? ""),
    hourlyRate: Number(row.hourly_rate ?? 0),
    colorCode: String(row.color_code ?? "#99e83f"),
    notes: String(row.notes ?? ""),
    permissions: (row.permissions ?? permissionsForRole("Receptionist")) as EmployeePermissions,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toRow(input: EmployeeInput) {
  return {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    mobile_phone: input.mobilePhone.trim(),
    role: input.role,
    status: input.status,
    hire_date: input.hireDate || null,
    hourly_rate: input.hourlyRate,
    color_code: input.colorCode,
    notes: input.notes.trim() || null,
    permissions: input.permissions,
  };
}

export async function listEmployees(): Promise<Employee[]> {
  if (!isSupabaseConfigured) {
    return readDemo().sort((a, b) => a.lastName.localeCompare(b.lastName));
  }
  const { data, error } = await supabase.from("employees").select("*").order("last_name");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  if (!isSupabaseConfigured) {
    const timestamp = new Date().toISOString();
    const employee: Employee = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    writeDemo([...readDemo(), employee]);
    return employee;
  }
  const { data, error } = await supabase.from("employees").insert(toRow(input)).select("*").single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<Employee> {
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const existing = items.find((item) => item.id === id);
    if (!existing) throw new Error("Employee not found.");
    const updated: Employee = { ...existing, ...input, updatedAt: new Date().toISOString() };
    writeDemo(items.map((item) => item.id === id ? updated : item));
    return updated;
  }
  const { data, error } = await supabase.from("employees").update(toRow(input)).eq("id", id).select("*").single();
  if (error) throw error;
  return fromRow(data);
}
