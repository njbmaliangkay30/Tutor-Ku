import fs from 'fs';

function applyDetailFix(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Bilingual Badges
  content = content.replace(
    /<span className="bg-blue-500\/10[^>]*>.*?BILINGUAL.*?<\/span>/g,
    '<span className="border border-border/60 bg-bg-2 px-2 py-[2px] rounded-sm text-[9px] font-mono text-violet-300 font-medium tracking-wider w-fit whitespace-nowrap"><Globe size={10} className="inline-block mr-[2px] -mt-[1px] opacity-80" /> BILINGUAL</span>'
  );

  // Profile and Dashboard uses different classes
  content = content.replace(
    /<span className="bg-blue-500\/10[^>]*>.*?English OK.*?<\/span>/g,
    '<span className="border border-border/60 bg-bg-2 px-2 py-[2px] rounded-sm text-[9px] font-mono text-violet-300 font-medium tracking-wider w-fit whitespace-nowrap"><Globe size={10} className="inline-block mr-[2px] -mt-[1px] opacity-80" /> BILINGUAL</span>'
  );

  // 2. Jenjang Mapping in Home, Search, Profile, TutorDetail, Dashboard
  // Find everything between const level = s.replace... and return <span key={s}...
  const jenjangRegex = /const level = s\.replace\('Jenjang: ', ''\);[\s\S]*?return[\s\S]*?<\/span>[\s\S]*?\}/g;
  content = content.replace(jenjangRegex, (match) => {
     if (match.includes('colorClass')) {
       return `const level = s.replace('Jenjang: ', '');
         let dotColor = "bg-text-sub";
         if (level === 'SD') dotColor = "bg-rose-400";
         else if (level === 'SMP') dotColor = "bg-sky-400";
         else if (level === 'SMA') dotColor = "bg-slate-400";
         return (
           <span key={s} className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1.5 whitespace-nowrap w-fit">
             <span className={\`w-1 h-1 rounded-full shrink-0 \${dotColor}\`}></span> {level}
           </span>
         );
       }`;
     }
     return match;
  });

  // 3. User Profile Jenjang
  const userProfileJenjangRegex = /let colorClass = "text-lime bg-lime\/10 border-lime\/20";[\s\S]*?<\/div>/;
  content = content.replace(userProfileJenjangRegex, `return (
                   <div className="border border-border/60 bg-bg-2 px-3 py-1.5 rounded-md text-[13px] font-mono text-text-main font-medium tracking-wider flex items-center gap-2 w-fit">
                     <span className={\`w-2 h-2 rounded-full shrink-0 \${
                        level === 'SD' ? 'bg-rose-400' : 
                        level === 'SMP' ? 'bg-sky-400' : 
                        level === 'SMA/SMK' ? 'bg-slate-400' : 'bg-text-sub'
                     }\`}></span> {level}
                   </div>
                 )
                })()
                </div>`);
                
  // 4. Tutor Sessions (level.includes)
  const sessionJenjangRegex = /let colorClass = "bg-lime\/10 text-lime border-lime\/30";[\s\S]*?<\/span>/;
  content = content.replace(sessionJenjangRegex, `let dotColor = "bg-text-sub";
                                 if (level.includes('SD')) dotColor = "bg-rose-400";
                                 else if (level.includes('SMP')) dotColor = "bg-sky-400";
                                 else if (level.includes('SMA')) dotColor = "bg-slate-400";
                                 return <span className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1.5 w-fit whitespace-nowrap"><span className={\`w-1 h-1 rounded-full shrink-0 \${dotColor}\`}></span> {level}</span>`);

  // Extra check for Globe usage, make sure it's imported in the files, or remove it. Let's not use an icon and keep it simple to avoid missing import errors.
  content = content.replace(/<Globe.*?>\s*/g, '');

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
console.log('Fixed UI Themes');
