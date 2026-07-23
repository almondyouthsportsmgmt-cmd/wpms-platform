import { useCallback, useEffect, useState } from "react";
import { createEmployee, listEmployees, updateEmployee } from "./employeeService";
import type { Employee, EmployeeInput } from "./employeeTypes";

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setEmployees(await listEmployees());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(input: EmployeeInput, id?: string) {
    const saved = id ? await updateEmployee(id, input) : await createEmployee(input);
    setEmployees((current) => {
      const next = id ? current.map((item) => item.id === id ? saved : item) : [...current, saved];
      return next.sort((a, b) => a.lastName.localeCompare(b.lastName));
    });
    return saved;
  }

  return { employees, loading, error, refresh, save };
}
