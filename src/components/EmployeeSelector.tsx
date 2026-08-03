import React from 'react';
import { useEmployee } from '../contexts/EmployeeContext';

export const EmployeeSelector: React.FC = () => {
  const { currentEmployee, employees, setCurrentEmployee, loading } = useEmployee();

  if (loading) {
    return <div className="text-sm text-gray-500">Loading employees...</div>;
  }

  if (!currentEmployee) {
    return <div className="text-sm text-red-500">No employee selected</div>;
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="employee-select" className="text-sm font-medium text-gray-700">
        Current Employee:
      </label>
      <select
        id="employee-select"
        value={currentEmployee.id}
        onChange={(e) => {
          const selected = employees.find(emp => emp.id === e.target.value);
          if (selected) setCurrentEmployee(selected);
        }}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.full_name} ({emp.department})
          </option>
        ))}
      </select>
      <div className="text-sm text-gray-500">
        <span className="font-medium">{currentEmployee.full_name}</span>
        <span className="text-gray-400"> • </span>
        <span>{currentEmployee.role}</span>
      </div>
    </div>
  );
};
