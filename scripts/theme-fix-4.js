import fs from 'fs';

function applyDetailFix(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // 4. Tutor Sessions (level.includes) - Multiple occurrences
  const sessionJenjangRegex = /let colorClass = "bg-lime\/10 text-lime border-lime\/30";[\s\S]*?<\/span>/g;
  content = content.replace(sessionJenjangRegex, `let dotColor = "bg-text-sub";
                                 if (level.includes('SD')) dotColor = "bg-rose-400";
                                 else if (level.includes('SMP')) dotColor = "bg-sky-400";
                                 else if (level.includes('SMA')) dotColor = "bg-slate-400";
                                 return <span className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1.5 w-fit whitespace-nowrap"><span className={\`w-1 h-1 rounded-full shrink-0 \${dotColor}\`}></span> {level}</span>`);

  fs.writeFileSync(filePath, content);
}

applyDetailFix('src/pages/TutorSessions.tsx');
console.log('Fixed TutorSessions Multiple Occurrences');
