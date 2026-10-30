const fs = require('fs');
const path = './src/views/organization/Dashboard.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Import OrgIntelligenceGraphs
content = content.replace(
  "import api from '../../lib/api';",
  "import api from '../../lib/api';\nimport { OrgIntelligenceGraphs } from './OrgIntelligenceGraphs';"
);

// 2. Insert OrgIntelligenceGraphs before ROW 3
content = content.replace(
  "{/* ROW 3: Predictive Analytics Grid",
  "{/* Organization Intelligence Graphs: Knowledge Graph, Distributed Graph & Skills Inventory */}\n      <OrgIntelligenceGraphs />\n\n      {/* ROW 3: Predictive Analytics Grid"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated Dashboard.tsx');
