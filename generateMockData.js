import fs from 'fs';
import path from 'path';

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const CSV_DIR = path.join(process.cwd(), 'mock_data', 'csv');
const TS_FILE = path.join(process.cwd(), 'src', 'dummy', 'organization', 'largeDashboardData.ts');

if (!fs.existsSync(CSV_DIR)) {
  fs.mkdirSync(CSV_DIR, { recursive: true });
}

// 1. Generate Comprehensive Organization Historical Data (100 months)
const generateOrgHistory = () => {
  const data = [];
  let currentHeadcount = 5000;
  let currentRevenue = 15000000;
  let currentCarbon = 2500;
  
  for (let i = 100; i >= 1; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    // Simulate slight growth/fluctuation
    currentHeadcount += randomInt(-50, 80);
    currentRevenue += randomInt(-500000, 800000);
    currentCarbon += randomInt(-20, 15);
    
    const monthName = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear().toString().substr(-2);
    
    const operatingCost = currentRevenue * randomFloat(0.6, 0.8);
    const ebitda = currentRevenue - operatingCost;
    const netProfit = ebitda * randomFloat(0.7, 0.9);
    
    data.push({
      id: 100 - i + 1,
      month: monthName,
      date: date.toISOString().split('T')[0],
      // Workforce / HR
      totalHeadcount: currentHeadcount,
      voluntaryAttritionRate: randomFloat(1.5, 4.0),
      involuntaryAttritionRate: randomFloat(0.5, 2.5),
      newHires: randomInt(10, 100),
      openPositions: randomInt(20, 150),
      eNPS: randomInt(10, 60),
      trainingHoursPerEmployee: randomFloat(1.0, 5.0),
      absenteeismRate: randomFloat(1.0, 4.0),
      // Financial
      revenue: currentRevenue.toFixed(2),
      operatingCost: operatingCost.toFixed(2),
      ebitda: ebitda.toFixed(2),
      netProfit: netProfit.toFixed(2),
      marketingSpend: (currentRevenue * randomFloat(0.05, 0.12)).toFixed(2),
      rdSpend: (currentRevenue * randomFloat(0.08, 0.15)).toFixed(2),
      // Operations & Market
      overallProductivityScore: randomInt(75, 98),
      csat: randomFloat(80.0, 99.0),
      nps: randomInt(30, 75),
      marketSharePercentage: randomFloat(15.0, 35.0),
      projectCompletionRate: randomFloat(75.0, 98.0),
      // ESG & Compliance
      carbonFootprintTons: currentCarbon,
      energyConsumptionKwh: currentCarbon * randomInt(150, 250),
      complianceScore: randomInt(85, 100),
      securityIncidents: randomInt(0, 5),
      anomalyFlag: Math.random() > 0.95 ? 'YES' : 'NO'
    });
  }
  return data;
};

// 2. Generate 100 Departments/Divisions Data
const generateDepartments = () => {
  const data = [];
  const regions = ['NA', 'EMEA', 'APAC', 'LATAM', 'GLOBAL'];
  const functions = ['Sales', 'Engineering', 'Marketing', 'HR', 'Finance', 'Operations', 'Product', 'R&D', 'Legal', 'Support', 'IT', 'Procurement'];
  
  for (let i = 1; i <= 100; i++) {
    const func = randomItem(functions);
    const region = randomItem(regions);
    const budget = randomInt(500000, 5000000);
    
    data.push({
      id: i,
      name: `${region} - ${func} Div ${randomInt(1, 9)}`,
      region: region,
      function: func,
      headcount: randomInt(50, 500),
      openPositions: randomInt(0, 25),
      allocatedBudget: budget,
      actualSpend: budget * randomFloat(0.8, 1.1),
      performanceScore: randomInt(60, 98),
      targetScore: randomInt(80, 95),
      eNPS: randomInt(-10, 70),
      attritionRate: randomFloat(1.0, 8.0),
      riskLevel: randomItem(['Low', 'Low', 'Medium', 'Medium', 'High'])
    });
  }
  return data;
};

// 3. Generate 100 Advanced Simulations Data
const generateSimulations = () => {
  const data = [];
  const parameters = [
    'Reduce APAC Headcount 5% & Increase R&D by 10%', 
    'Implement 4-Day Work Week Trial globally', 
    'Shift 20% Marketing Spend to Digital', 
    'Outsource Tier 1 Customer Support',
    'Open New Engineering Hub in LATAM',
    'Mandate 3-Days in Office',
    'Increase Base Salaries by 5% to combat Attrition'
  ];
  const targetMetrics = ['Revenue Impact', 'Operating Cost Impact', 'Productivity Impact', 'Attrition Impact', 'CSAT Impact'];
  
  for (let i = 1; i <= 100; i++) {
    data.push({
      id: i,
      scenarioName: `Sim-${i}: ${randomItem(parameters)}`,
      targetMetric: randomItem(targetMetrics),
      predictedImpactPercentage: randomFloat(-15, 25),
      predictedCostSavings: randomInt(-500000, 2000000),
      predictedROI: randomFloat(-10, 45),
      confidenceLevel: randomInt(60, 99),
      timeToRealizeMonths: randomInt(1, 24),
      status: randomItem(['Completed', 'Processing', 'Draft', 'Approved', 'Rejected'])
    });
  }
  return data;
};

const orgHistory = generateOrgHistory();
const departments = generateDepartments();
const simulations = generateSimulations();

// Helper to convert array of objects to CSV string
const toCSV = (arr) => {
  if (arr.length === 0) return '';
  const headers = Object.keys(arr[0]).join(',');
  const rows = arr.map(obj => Object.values(obj).map(val => `"${val}"`).join(',')).join('\n');
  return `${headers}\n${rows}`;
};

// Write CSV files
fs.writeFileSync(path.join(CSV_DIR, 'organization_history.csv'), toCSV(orgHistory));
fs.writeFileSync(path.join(CSV_DIR, 'departments.csv'), toCSV(departments));
fs.writeFileSync(path.join(CSV_DIR, 'simulations.csv'), toCSV(simulations));

// Write TS module
const tsContent = `// Auto-generated Comprehensive Mock Dataset for Digital Twin

export const mockOrgHistory = ${JSON.stringify(orgHistory, null, 2)};

export const mockLargeDepartments = ${JSON.stringify(departments, null, 2)};

export const mockSimulations = ${JSON.stringify(simulations, null, 2)};
`;

fs.writeFileSync(TS_FILE, tsContent);

console.log('Successfully generated 300 highly comprehensive mock records (100 per section) as CSV and TS modules.');
