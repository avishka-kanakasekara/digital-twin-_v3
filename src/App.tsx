import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './views/organization/Dashboard';
import { OrganizationContext } from './views/organization/OrganizationContext';
import { EmployeeTwin } from './views/employee/EmployeeTwin';
import { OrgSimulator } from './views/organization/OrgSimulator';
import { AtRiskRadar } from './views/organization/AtRiskRadar';
import { CareerCoach } from './views/employee/CareerCoach';
import { GamificationHub } from './views/employee/GamificationHub';
import { LearningHub } from './views/employee/LearningHub';
import { WorkforcePlanning } from './views/organization/WorkforcePlanning';
import { TeamBuilder } from './views/organization/TeamBuilder';
import { TalentMarketplace } from './views/organization/TalentMarketplace';
import { InnovationHub } from './views/organization/InnovationHub';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="context" element={<OrganizationContext />} />
          <Route path="employee-twin" element={<EmployeeTwin />} />
          <Route path="career-coach" element={<CareerCoach />} />
          <Route path="gamification-hub" element={<GamificationHub />} />
          <Route path="learning-hub" element={<LearningHub />} />
          <Route path="radar" element={<AtRiskRadar />} />
          <Route path="simulator" element={<OrgSimulator />} />
          <Route path="workforce" element={<WorkforcePlanning />} />
          <Route path="team-builder" element={<TeamBuilder />} />
          <Route path="talent-marketplace" element={<TalentMarketplace />} />
          <Route path="innovation-hub" element={<InnovationHub />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
