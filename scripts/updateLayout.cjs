const fs = require('fs');
const path = './src/components/Layout.tsx';

let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "{ name: 'Strategy Role Architect', path: '/strategy-architect', icon: <Crosshair size={20} /> },",
  "{ name: 'Role Architect', path: '/role-architect', icon: <Crosshair size={20} /> },"
);

content = content.replace(
  "{ name: 'Internal Talent Marketplace', path: '/talent-marketplace', icon: <Briefcase size={20} /> },",
  "{ name: 'Digital Talent Marketplace', path: '/talent-marketplace', icon: <Briefcase size={20} /> },"
);

content = content.replace(
  "{ name: 'Team Builder Engine', path: '/team-builder', icon: <Users2 size={20} /> },",
  "{ name: 'Team Assembly', path: '/team-builder', icon: <Users2 size={20} /> },"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated Layout.tsx');
