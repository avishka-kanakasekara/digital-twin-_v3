const fs = require('fs');
const path = './src/views/employee/EmployeeTwin.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Import
content = content.replace(
  "import { PeerRecommendations } from './components/twin/PeerRecommendations';",
  "import { PeerRecommendations } from './components/twin/PeerRecommendations';\nimport { SuccessionTransferService } from './components/twin/SuccessionTransferService';\nimport { ShieldCheck } from 'lucide-react';"
);

// 2. TabId
content = content.replace(
  "type TabId = 'overview' | 'skills' | 'projects' | 'knowledge' | 'peers' | 'progress';",
  "type TabId = 'overview' | 'skills' | 'projects' | 'knowledge' | 'succession' | 'peers' | 'progress';"
);

// 3. TABS array
content = content.replace(
  "{ id: 'knowledge', label: 'Knowledge', icon: <Database size={14} /> },",
  "{ id: 'knowledge', label: 'Knowledge', icon: <Database size={14} /> },\n  { id: 'succession', label: 'Succession Transfer', icon: <ShieldCheck size={14} /> },"
);

// 4. Tab render
content = content.replace(
  "{activeTab === 'peers' && (",
  `{activeTab === 'succession' && (
        <Card glass={false} className="glass-panel pd-section">
          <SectionHead
            icon={<ShieldCheck size={20} />}
            title="Succession & Knowledge Transfer Service"
            subtitle="Critical role continuity, handover tasks, and successor capability verification"
          />
          <SuccessionTransferService />
        </Card>
      )}

      {activeTab === 'peers' && (`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated EmployeeTwin.tsx');
