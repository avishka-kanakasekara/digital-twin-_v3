const fs = require('fs');
const path = './src/views/employee/CareerCoach.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Import CareerCoachIntelligence
content = content.replace(
  "import './CareerCoach.css';",
  "import './CareerCoach.css';\nimport { CareerCoachIntelligence } from './CareerCoachIntelligence';"
);

// 2. Insert CareerCoachIntelligence into the view when plan.goal is not set
content = content.replace(
  `<div className="career-coach">
        {header}
        {error && <div className="cc-alert">{error}</div>}`,
  `<div className="career-coach">
        {header}
        {error && <div className="cc-alert">{error}</div>}
        <CareerCoachIntelligence />`
);

// 3. Insert CareerCoachIntelligence into the view when plan.goal is set
content = content.replace(
  `<div className="career-coach">
      {header}
      {error && (
        <div className="cc-alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {notice && (
        <div className="cc-toast">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}`,
  `<div className="career-coach">
      {header}
      {error && (
        <div className="cc-alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {notice && (
        <div className="cc-toast">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}
      <CareerCoachIntelligence />`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated CareerCoach.tsx');
