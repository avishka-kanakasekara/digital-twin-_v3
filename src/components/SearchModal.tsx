import React, { useState, useMemo } from 'react';
import { Search, X, Building, ArrowRight, MapPin, Briefcase, Zap, Filter, Target, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TwinChatModal } from './TwinChatModal';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockDatabase = [
  { id: 1, name: 'Alex Carter', role: 'Senior Cloud Engineer', dept: 'Engineering', location: 'Colombo', risk: 'Medium', skills: ['AWS IAM', 'GuardDuty', 'Terraform', 'Kubernetes', 'Go'] },
  { id: 2, name: 'Sarah Jenkins', role: 'UX Designer', dept: 'Design', location: 'Singapore', risk: 'High', skills: ['Figma', 'User Research', 'Prototyping', 'Wireframing'] },
  { id: 3, name: 'David Chen', role: 'Backend Engineer', dept: 'Engineering', location: 'Colombo', risk: 'High', skills: ['Node.js', 'PostgreSQL', 'Redis', 'GraphQL'] },
  { id: 4, name: 'Sarah Connor', role: 'Security Analyst', dept: 'Engineering', location: 'London', risk: 'Low', skills: ['Pen Testing', 'SIEM', 'Cloud Security', 'Compliance'] },
  { id: 5, name: 'Michael Chang', role: 'Product Manager', dept: 'Product', location: 'Singapore', risk: 'Medium', skills: ['Agile', 'Roadmapping', 'Jira', 'Data Analysis'] },
  { id: 6, name: 'Elena Rodriguez', role: 'Sales Lead', dept: 'Sales', location: 'New York', risk: 'Low', skills: ['B2B Sales', 'CRM', 'Negotiation', 'Account Management'] },
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterLocation, setFilterLocation] = useState<string>('All');
  const [chattingEmployee, setChattingEmployee] = useState<{ name: string; role: string } | null>(null);

  const departments = ['All', ...Array.from(new Set(mockDatabase.map(e => e.dept)))];
  const locations = ['All', ...Array.from(new Set(mockDatabase.map(e => e.location)))];

  const semanticDictionary: Record<string, string[]> = {
    'cloud security': ['AWS IAM', 'GuardDuty', 'Cloud Security', 'SIEM'],
    'frontend': ['React', 'Vue', 'UX', 'Figma'],
    'backend': ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Backend Engineer'],
    'leadership': ['Lead', 'Manager', 'Director']
  };

  const results = useMemo(() => {
    let filtered = mockDatabase;

    if (filterDept !== 'All') {
      filtered = filtered.filter(emp => emp.dept === filterDept);
    }
    if (filterLocation !== 'All') {
      filtered = filtered.filter(emp => emp.location === filterLocation);
    }

    if (!query.trim()) return filtered.slice(0, 5).map(emp => ({ ...emp, matchType: '', score: 0 }));

    const q = query.toLowerCase();
    let semanticMatches: string[] = [];
    Object.entries(semanticDictionary).forEach(([key, values]) => {
      if (key.includes(q) || q.includes(key)) {
        semanticMatches = [...semanticMatches, ...values.map(v => v.toLowerCase())];
      }
    });

    return filtered.map(emp => {
      let matchType = '';
      let score = 0;

      if (emp.name.toLowerCase().includes(q)) { matchType = 'Name Match'; score = 100; }
      else if (emp.role.toLowerCase().includes(q)) { matchType = 'Role Match'; score = 90; }
      else if (emp.dept.toLowerCase().includes(q)) { matchType = 'Department Match'; score = 80; }
      else if (emp.skills.some(s => s.toLowerCase().includes(q))) { matchType = 'Skill Match'; score = 85; }
      
      if (score === 0 && semanticMatches.length > 0) {
        if (emp.skills.some(s => semanticMatches.includes(s.toLowerCase())) || semanticMatches.includes(emp.role.toLowerCase())) {
          matchType = 'Semantic Match';
          score = 75;
        }
      }

      return { ...emp, matchType, score };
    })
    .filter(emp => emp.score > 0)
    .sort((a, b) => b.score - a.score);
  }, [query, filterDept, filterLocation]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 sm:px-6">
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative bg-white/95 backdrop-blur-xl border border-white/60 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
          
          {/* Search Input Area */}
          <div className="flex items-center p-6 border-b border-[var(--border-subtle)] bg-white/90">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-primary-light)] to-white flex items-center justify-center shadow-inner shrink-0 border border-white">
              <Search size={28} className="text-primary drop-shadow-sm" />
            </div>
            <input 
              type="text" 
              className="flex-1 h-14 px-5 text-2xl outline-none bg-transparent placeholder:text-tertiary font-semibold text-[var(--text-primary)] tracking-tight"
              placeholder="Search by name, skills, or semantic queries (e.g. 'cloud security')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-3 shrink-0">
              <kbd className="hidden sm:inline-flex items-center justify-center h-8 px-2.5 text-[10px] font-extrabold text-secondary bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded-lg shadow-sm uppercase tracking-wider">ESC</kbd>
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-xl hover:bg-danger-light text-secondary hover:text-danger transition-all bg-white shadow-sm border border-[var(--border-subtle)] hover:border-danger/30 flex items-center justify-center hover:shadow group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Structured Filters Bar */}
          <div className="flex items-center gap-4 p-4 bg-[var(--bg-main)]/50 border-b border-[var(--border-subtle)] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider pl-2 shrink-0">
              <Filter size={14} /> Filters
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] shadow-sm shrink-0 hover:border-primary transition-colors">
              <Building size={14} className="text-tertiary" />
              <select 
                className="text-sm font-semibold text-primary outline-none bg-transparent cursor-pointer appearance-none pr-4"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] shadow-sm shrink-0 hover:border-primary transition-colors">
              <MapPin size={14} className="text-tertiary" />
              <select 
                className="text-sm font-semibold text-primary outline-none bg-transparent cursor-pointer appearance-none pr-4"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                {locations.map(l => <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>)}
              </select>
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[var(--bg-main)]/20" style={{ scrollbarWidth: 'thin' }}>
            {query.length > 0 || filterDept !== 'All' || filterLocation !== 'All' ? (
              results.length > 0 ? (
                <>
                  <p className="text-xs font-bold text-secondary mb-1 px-3 uppercase tracking-wider">Search Results ({results.length})</p>
                  {results.map(res => (
                    <Link 
                      to="/employee-twin" 
                      key={res.id} 
                      onClick={onClose}
                      className="flex items-start justify-between p-5 rounded-2xl bg-white hover:shadow-md border border-[var(--border-subtle)] hover:border-primary/50 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-white text-lg font-black shadow-sm shrink-0">
                          {res.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-3">
                            <h4 className="font-extrabold text-lg text-primary group-hover:text-primary-hover">{res.name}</h4>
                            {res.matchType === 'Semantic Match' ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-secondary-light text-secondary px-2.5 py-0.5 rounded-full border border-secondary/20 uppercase tracking-wide">
                                <Zap size={10} /> Semantic Match
                              </span>
                            ) : res.matchType ? (
                              <span className="text-[10px] font-bold bg-success-light text-success-dark px-2.5 py-0.5 rounded-full border border-success/20 uppercase tracking-wide">
                                <Target size={10} className="inline mr-1 mb-0.5"/> Exact Match
                              </span>
                            ) : null}
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs font-semibold text-secondary">
                            <span className="flex items-center gap-1"><Briefcase size={14}/> {res.role}</span>
                            <span className="text-tertiary">•</span>
                            <span className="flex items-center gap-1"><Building size={14}/> {res.dept}</span>
                            <span className="text-tertiary">•</span>
                            <span className="flex items-center gap-1"><MapPin size={14}/> {res.location}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {res.skills.map(skill => (
                              <span key={skill} className="text-[10px] font-bold px-2 py-1 rounded-md border bg-[var(--bg-main)] text-tertiary border-[var(--border-subtle)] group-hover:border-primary/20 transition-colors">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setChattingEmployee({ name: res.name, role: res.role });
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-extrabold transition-all shadow-sm border border-primary/20"
                        >
                          <MessageSquare size={14}/> Chat with AI Twin
                        </button>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-main)] border border-[var(--border-subtle)] group-hover:border-primary group-hover:bg-primary text-secondary group-hover:text-white transition-all shadow-sm">
                          <ArrowRight size={18} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <Search size={48} className="text-tertiary mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-primary mb-2">No results found</h3>
                  <p className="text-sm text-secondary">Try adjusting your filters or using different keywords.</p>
                </div>
              )
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                <div className="w-24 h-24 bg-gradient-to-br from-[var(--color-primary-light)] to-white border border-[var(--border-subtle)] rounded-full flex items-center justify-center shadow-inner mb-6 relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping"></div>
                  <Search size={40} className="text-primary opacity-80 relative z-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-primary mb-3">Find Anything Instantly</h3>
                <p className="text-sm text-secondary max-w-sm mx-auto mb-8 leading-relaxed">
                  Search across the entire organization using exact attributes or natural language concepts.
                </p>
                
                <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                  <span onClick={() => setQuery('cloud security')} className="px-4 py-2 bg-white border border-[var(--border-subtle)] rounded-xl text-xs font-bold text-secondary shadow-sm hover:border-primary hover:text-primary cursor-pointer transition-colors flex items-center gap-1"><Zap size={14}/> Try "cloud security"</span>
                  <span onClick={() => setFilterDept('Engineering')} className="px-4 py-2 bg-white border border-[var(--border-subtle)] rounded-xl text-xs font-bold text-secondary shadow-sm hover:border-primary hover:text-primary cursor-pointer transition-colors flex items-center gap-1"><Building size={14}/> Try "Engineering"</span>
                  <span onClick={() => setFilterLocation('Colombo')} className="px-4 py-2 bg-white border border-[var(--border-subtle)] rounded-xl text-xs font-bold text-secondary shadow-sm hover:border-primary hover:text-primary cursor-pointer transition-colors flex items-center gap-1"><MapPin size={14}/> Try "Colombo"</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {chattingEmployee && (
        <TwinChatModal 
          isOpen={true} 
          onClose={() => setChattingEmployee(null)} 
          employeeName={chattingEmployee.name} 
          employeeRole={chattingEmployee.role} 
        />
      )}
    </>
  );
};
