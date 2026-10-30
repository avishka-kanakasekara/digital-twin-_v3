const fs = require('fs');
const path = './src/views/organization/StrategyRoleArchitect.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Imports and TabMode
content = content.replace(
  "type TabMode = 'roles' | 'drivers' | 'demand' | 'skills';",
  "import { RoleArchitectStudio } from './RoleArchitectStudio';\ntype TabMode = 'role-studio' | 'roles' | 'drivers' | 'demand' | 'skills';"
);

content = content.replace(
  "const [activeTab, setActiveTab] = useState<TabMode>('roles');",
  "const [activeTab, setActiveTab] = useState<TabMode>('role-studio');"
);

// 2. Title
content = content.replace(
  "Strategy & Role Architecture",
  "Role Architect"
);

// 3. Tab button
const tabAnchor = '<div className="flex items-center gap-2 p-1 bg-slate-100/90 border border-slate-200/90 rounded-xl shadow-2xs overflow-x-auto no-scrollbar">';
const newTabBtn = `<div className="flex items-center gap-2 p-1 bg-slate-100/90 border border-slate-200/90 rounded-xl shadow-2xs overflow-x-auto no-scrollbar">
          
          {/* Tab 0: AI Role Architect Studio */}
          <button
            onClick={() => setActiveTab('role-studio')}
            className={\`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap \${
              activeTab === 'role-studio'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }\`}
          >
            <Sparkles size={14} className={activeTab === 'role-studio' ? 'text-white' : 'text-blue-500'} />
            <span>AI Role Architect Studio</span>
            <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded-full \${activeTab === 'role-studio' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}\`}>
              6-Step Engine
            </span>
          </button>`;
content = content.replace(tabAnchor, newTabBtn);

// 4. Tab content
const contentAnchor = "{activeTab === 'roles' && (";
const contentReplacement = `{activeTab === 'role-studio' && (
        <RoleArchitectStudio />
      )}

      {activeTab === 'roles' && (`;
content = content.replace(contentAnchor, contentReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated StrategyRoleArchitect.tsx');
