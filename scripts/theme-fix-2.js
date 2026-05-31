import fs from 'fs';

function applyDetailFix(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Match the entire span containing BILINGUAL
  content = content.replace(
    /<span[^>]*?text-blue-500[\s\S]*?BILINGUAL[\s\S]*?<\/span>/g,
    '<span className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-violet-300 font-medium tracking-wider w-fit whitespace-nowrap">BILINGUAL</span>'
  );

  fs.writeFileSync(filePath, content);
}

const files = [
  'src/pages/Home.tsx',
  'src/pages/Search.tsx',
  'src/pages/TutorDetail.tsx',
  'src/pages/Profile.tsx',
  'src/pages/StudentDashboard.tsx',
  'src/pages/TutorSessions.tsx'
];

files.forEach(applyDetailFix);
console.log('Fixed BILINGUAL Badges');
