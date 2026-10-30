const fs = require('fs');
const path = './src/App.tsx';

let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<Route path="strategy-architect" element={<StrategyRoleArchitect />} />',
  '<Route path="role-architect" element={<StrategyRoleArchitect />} />\n            <Route path="strategy-architect" element={<StrategyRoleArchitect />} />'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated App.tsx');
