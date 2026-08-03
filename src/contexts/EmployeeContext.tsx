import React, { createContext, useContext, useState, useEffect } from 'react';
import { employeeAPI, type Employee } from '../lib/api';

interface EmployeeContextType {
  currentEmployee: Employee | null;
  employees: Employee[];
  setCurrentEmployee: (employee: Employee) => void;
  loading: boolean;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await employeeAPI.list();
        setEmployees(data.employees);
        
        // Try to get saved employee ID from localStorage
        const savedEmployeeId = localStorage.getItem('current_employee_id');
        if (savedEmployeeId) {
          const savedEmployee = data.employees.find(e => e.id === savedEmployeeId);
          if (savedEmployee) {
            setCurrentEmployee(savedEmployee);
            return;
          }
        }
        
        // Default to first employee if no saved selection
        if (data.employees.length > 0) {
          setCurrentEmployee(data.employees[0]);
        }
      } catch (error) {
        console.error('Failed to load employees:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleSetCurrentEmployee = (employee: Employee) => {
    setCurrentEmployee(employee);
    localStorage.setItem('current_employee_id', employee.id);
  };

  return (
    <EmployeeContext.Provider value={{ currentEmployee, employees, setCurrentEmployee: handleSetCurrentEmployee, loading }}>
      {children}
    </EmployeeContext.Provider>
  );
};
