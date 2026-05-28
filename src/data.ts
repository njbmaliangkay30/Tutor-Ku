export const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const SUBJECTS = [
  'Matematika', 'Fisika', 'Kimia', 'Biologi', 
  'Bahasa Inggris', 'Pemrograman', 'Ekonomi', 
  'Akuntansi', 'Statistika'
];

export const PKG_SUBSCRIPTIONS = [
  {id:'pkg-single', label:'Sesi Satuan', sessions:1, discount:0, badge:null, desc:'Booking satu sesi dulu, cocok untuk percobaan.'},
  {id:'pkg-4', label:'Paket 4 Pertemuan', sessions:4, discount:5, badge:'Populer', desc:'4 sesi, cocok untuk persiapan ulangan.'},
  {id:'pkg-8', label:'Paket 8 Pertemuan', sessions:8, discount:10, badge:'Hemat 10%', desc:'Paket terlaris — belajar rutin, hasil lebih optimal.'},
  {id:'pkg-12', label:'Paket 12 Pertemuan', sessions:12, discount:12, badge:'Best Value', desc:'Untuk persiapan UTBK atau kursus intensif.'},
];

export const TUTORS = [
  {
    id: "1",
    name: 'Ayu Maharani',
    initials: 'AM',
    university: 'Univ. Indonesia',
    major: 'Matematika',
    rating: 4.9,
    sessions: 41,
    gender: 'P', 
    genderIcon: '♀',
    genderCode: 'F',
    genderClass: 'bg-[rgba(255,80,160,0.1)] text-[#FF50A0] border-[rgba(255,80,160,0.25)]',
    online: true, 
    price: 'Rp 65.000',
    rate: 65000,
    tier: 'Silver',
    tags: ['Matematika', 'Fisika', 'Statistika'],
    badges: ['Top 10%', 'Fast Response'],
    bio: 'Asisten praktikum Kalkulus. Metode problem set bertahap, cocok untuk UTBK & ujian kampus.',
    activeDays: [1,2,3,5]
  },
  {
    id: "2",
    name: 'Kevin Saputra',
    initials: 'KS',
    university: 'ITB',
    major: 'Teknik Informatika',
    rating: 5.0,
    sessions: 87,
    gender: 'L',
    genderIcon: '♂',
    genderCode: 'M',
    genderClass: 'bg-[rgba(80,160,255,0.1)] text-[#50A0FF] border-[rgba(80,160,255,0.25)]',
    online: true,
    price: 'Rp 85.000',
    rate: 85000,
    tier: 'Gold',
    tags: ['Pemrograman', 'Matematika'],
    badges: ['Expert', '🔥 Streak 12'],
    bio: 'Finalis ICPC Regional 2023. Spesialisasi algoritma & struktur data. Sabar membimbing dari nol.',
    activeDays: [1,3,5,6]
  },
  {
    id: "3",
    name: 'Siti Rahayu',
    initials: 'SR',
    university: 'UGM',
    major: 'Kimia',
    rating: 4.7,
    sessions: 18,
    gender: 'P',
    genderIcon: '♀',
    genderCode: 'F',
    genderClass: 'bg-[rgba(255,80,160,0.1)] text-[#FF50A0] border-[rgba(255,80,160,0.25)]',
    online: false,
    price: 'Rp 50.000',
    rate: 50000,
    tier: 'Bronze',
    tags: ['Kimia', 'Biologi'],
    badges: ['Ramah Anak'],
    bio: 'Sem 6, fokus Kimia Organik. Cocok untuk persiapan UTBK & masuk PTN.',
    activeDays: [2,4,6]
  },
  {
    id: "4",
    name: 'Dimas Prasetyo',
    initials: 'DP',
    university: 'Undip',
    major: 'Ekonomi',
    rating: 4.6,
    sessions: 9,
    gender: 'L',
    genderIcon: '♂',
    genderCode: 'M',
    genderClass: 'bg-[rgba(80,160,255,0.1)] text-[#50A0FF] border-[rgba(80,160,255,0.25)]',
    online: false,
    price: 'Rp 45.000',
    rate: 45000,
    tier: 'Bronze',
    tags: ['Ekonomi', 'Akuntansi'],
    badges: [],
    bio: 'Aktif di Himpunan Ekonomi. 1 tahun pengalaman bimbel privat.',
    activeDays: [1,2,4,5]
  },
  {
    id: "5",
    name: 'Clara Natasha',
    initials: 'CN',
    university: 'Unair',
    major: 'Sastra Inggris',
    rating: 4.8,
    sessions: 29,
    gender: 'P',
    genderIcon: '♀',
    genderCode: 'F',
    genderClass: 'bg-[rgba(255,80,160,0.1)] text-[#FF50A0] border-[rgba(255,80,160,0.25)]',
    online: true,
    price: 'Rp 60.000',
    rate: 60000,
    tier: 'Silver',
    tags: ['Bahasa Inggris'],
    badges: ['IELTS Expert'],
    bio: 'Juara debat nasional 2023. IELTS 7.5. Spesialisasi IELTS/TOEFL & percakapan.',
    activeDays: [2,3,4,6]
  }
];

export const getTagStyle = (tag: string) => {
  const sl = tag.toLowerCase();
  if(sl.includes('matematika')||sl.includes('statistika')) return {c:'#50A0FF', bg:'rgba(80,160,255,0.1)'};
  if(sl.includes('fisika')||sl.includes('kimia')||sl.includes('biologi')) return {c:'#00E676', bg:'rgba(0,230,118,0.1)'};
  if(sl.includes('inggris')||sl.includes('bahasa')) return {c:'#FFD700', bg:'rgba(255,215,0,0.1)'};
  if(sl.includes('pemrograman')||sl.includes('coding')) return {c:'#C8FF00', bg:'rgba(200,255,0,0.1)'};
  if(sl.includes('ekonomi')||sl.includes('akuntansi')) return {c:'#FF9000', bg:'rgba(255,144,0,0.1)'};
  return {c:'var(--color-lime)', bg:'var(--color-lime-dim)'};
};

export const getAvatarColor = (name: string) => {
  const avatarColors = ['#1A3A28','#4B1D96','#0D4F3C','#8B2500','#7C3000','#1A3050','#4A1A8B','#8B4500','#004B7A'];
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
};

export const formatRupiah = (n: number) => {
  return 'Rp ' + n.toLocaleString('id-ID');
};
