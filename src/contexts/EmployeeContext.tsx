import React, { createContext, useContext, useState, useEffect } from 'react';
import { employeeAPI, type Employee } from '../lib/api';
import { useAuth } from './AuthContext';

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
  const { user, ready } = useAuth();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setCurrentEmployee(null);
      setEmployees([]);
      setLoading(false);
      return;
    }

    let live = true;
    setLoading(true);
    employeeAPI
      .list({ limit: 200 })
      .then((data) => {
        if (!live) return;
        const list = data.employees.some((employee) => employee.id === user.id)
          ? data.employees
          : [user, ...data.employees];
        setEmployees(list);
        setCurrentEmployee(list.find((employee) => employee.id === user.id) || user);
        localStorage.setItem('current_employee_id', user.id);
      })
      .catch(() => {
        if (!live) return;
        setEmployees([user]);
        setCurrentEmployee(user);
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [ready, user]);

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
