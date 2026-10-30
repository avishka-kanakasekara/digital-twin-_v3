const fs = require('fs');

// 1. Fix StrategyRoleArchitect.tsx import
const rolePath = './src/views/organization/StrategyRoleArchitect.tsx';
let roleContent = fs.readFileSync(rolePath, 'utf8');
roleContent = roleContent.replace(
  'Users, Plus, CheckCircle2, X,',
  'Users, Plus, CheckCircle2, X, Sparkles,'
);
fs.writeFileSync(rolePath, roleContent, 'utf8');
console.log('Fixed StrategyRoleArchitect.tsx');

// 2. Fix CareerCoach.tsx so CareerCoachIntelligence is placed and rendered
const coachPath = './src/views/employee/CareerCoach.tsx';
let coachContent = fs.readFileSync(coachPath, 'utf8');

// Ensure CareerCoachIntelligence is imported
if (!coachContent.includes("import { CareerCoachIntelligence } from './CareerCoachIntelligence';")) {
  coachContent = coachContent.replace(
    "import './CareerCoach.css';",
    "import './CareerCoach.css';\nimport { CareerCoachIntelligence } from './CareerCoachIntelligence';"
  );
}

// Add <CareerCoachIntelligence /> before the goal card or hero
coachContent = coachContent.replace(
  '{header}\n        {error && <div className="cc-alert">{error}</div>}',
  '{header}\n        {error && <div className="cc-alert">{error}</div>}\n        <CareerCoachIntelligence />'
);

coachContent = coachContent.replace(
  '{header}\r\n        {error && <div className="cc-alert">{error}</div>}',
  '{header}\r\n        {error && <div className="cc-alert">{error}</div>}\r\n        <CareerCoachIntelligence />'
);

coachContent = coachContent.replace(
  '<section className="cc-hero">',
  '<CareerCoachIntelligence />\n\n      <section className="cc-hero">'
);

fs.writeFileSync(coachPath, coachContent, 'utf8');
console.log('Fixed CareerCoach.tsx');
