const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/TutorSessions.tsx');
let data = fs.readFileSync(p, 'utf8');
data = data.replace(/<div className="font-bold text-text-main font-display">\s*\{session\.student_profiles\?\.profiles\?\.full_name \|\| 'Siswa'\}\s*<\/div>/g, 
  `<div className="font-bold text-text-main font-display flex items-center gap-2">
  {session.student_profiles?.profiles?.full_name || 'Siswa'}
  {session.student_profiles?.school_level && (
    <span className="text-[9px] bg-lime/10 text-lime px-1.5 py-0.5 rounded font-mono border border-lime/30 uppercase tracking-widest">{session.student_profiles.school_level}</span>
  )}
</div>`);
fs.writeFileSync(p, data);
