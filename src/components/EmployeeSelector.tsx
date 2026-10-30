import React from 'react';
import { useEmployee } from '../contexts/EmployeeContext';
import { User, ChevronDown } from 'lucide-react';

export const EmployeeSelector: React.FC = () => {
  const { currentEmployee, employees, setCurrentEmployee, loading } = useEmployee();

  if (loading || !currentEmployee) return null;

  return (
    <div className="relative flex items-center">
      <div className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs">
        <User size={13} className="text-blue-600 shrink-0" />
        <select
          id="employee-select"
          aria-label="Current Employee"
          value={currentEmployee.id}
          onChange={(e) => {
            const selected = employees.find(emp => emp.id === e.target.value);
            if (selected) setCurrentEmployee(selected);
          }}
          className="bg-transparent focus:outline-none cursor-pointer pr-5 appearance-none text-slate-800 font-bold text-xs"
        >
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name} ({emp.department})
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-4" />
      </div>
    </div>
  );
};
