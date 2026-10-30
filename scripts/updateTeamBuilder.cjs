const fs = require('fs');
const path = './src/views/organization/TeamBuilder.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Import
content = content.replace(
  "import { TeamRegistryPanel } from './TeamRegistryPanel';",
  "import { TeamRegistryPanel } from './TeamRegistryPanel';\nimport { TeamAssemblyStudio } from './TeamAssemblyStudio';"
);

// 2. Section state
content = content.replace(
  "const [section, setSection] = useState<'recommend' | 'teams'>('teams');",
  "const [section, setSection] = useState<'assembly' | 'recommend' | 'teams'>('assembly');"
);

// 3. Title
content = content.replace(
  "Team Builder Engine",
  "Team Assembly"
);

// 4. Tab list
const oldTabs = `<div className="inline-flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200/90 gap-1" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={section === 'teams'}
                className={\`h-7 px-3 rounded-md text-xs font-bold transition-all cursor-pointer \${
                  section === 'teams'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
                onClick={() => setSection('teams')}
              >
                My Teams
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={section === 'recommend'}
                className={\`h-7 px-3 rounded-md text-xs font-bold transition-all cursor-pointer \${
                  section === 'recommend'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
                onClick={() => setSection('recommend')}
              >
                Recommend a Team
              </button>
            </div>`;

const newTabs = `<div className="inline-flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200/90 gap-1" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={section === 'assembly'}
                className={\`h-7 px-3 rounded-md text-xs font-bold transition-all cursor-pointer \${
                  section === 'assembly'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
                onClick={() => setSection('assembly')}
              >
                AI Team Assembly (7-Step)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={section === 'teams'}
                className={\`h-7 px-3 rounded-md text-xs font-bold transition-all cursor-pointer \${
                  section === 'teams'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
                onClick={() => setSection('teams')}
              >
                My Teams
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={section === 'recommend'}
                className={\`h-7 px-3 rounded-md text-xs font-bold transition-all cursor-pointer \${
                  section === 'recommend'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
                onClick={() => setSection('recommend')}
              >
                Custom Optimizer
              </button>
            </div>`;

content = content.replace(oldTabs, newTabs);

// 5. Section render
content = content.replace(
  "{section === 'teams' && <TeamRegistryPanel catalogue={catalogue} />}",
  `{section === 'assembly' && <TeamAssemblyStudio />}
      {section === 'teams' && <TeamRegistryPanel catalogue={catalogue} />}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated TeamBuilder.tsx');
