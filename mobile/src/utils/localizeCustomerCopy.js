function toLowerTrimmed(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function humanize(value, fallback = '') {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  return value
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const EXACT_TEXT_ID = {
  'Textured cuts and modern fades': 'Potongan bertekstur dan fade modern',
  'Classic side parts and beard cleanup': 'Side part klasik dan rapikan jenggot',
  'Low taper and school-friendly trims': 'Low taper dan potongan yang cocok untuk pelajar',
  'Curated hairstyle inspiration.': 'Inspirasi gaya rambut pilihan.',
  'Curated discovery item.': 'Inspirasi pilihan untuk Anda.',
  'Curated beta inspiration pick.': 'Inspirasi pilihan untuk versi beta.',
  'Visual preview coming soon': 'Preview visual segera hadir',
  'Preview example not available yet': 'Contoh preview belum tersedia',
  'Everyday hairstyle inspiration': 'Inspirasi gaya untuk dipakai sehari-hari',
  'No specific caution listed': 'Tidak ada catatan khusus',
  'General': 'Umum',
  'Trending now': 'Sedang diminati',
  'Consultation': 'Konsultasi',
  'Many skin tones': 'Beragam warna kulit',
  'A curated hair color direction.': 'Arah warna rambut pilihan.',
  'A short note from the barber team.': 'Catatan singkat dari tim barber.',
  'Versatile style': 'Gaya serbaguna',
  'Color idea': 'Inspirasi warna',
  'Barber tip': 'Tips barber',
  'Style preview': 'Preview gaya',
  'Bring one hero reference only': 'Bawa satu referensi utama saja',
  'One clear reference photo helps your barber understand shape and texture faster than a mixed gallery of ten different cuts.':
    'Satu foto referensi yang jelas membantu barber memahami bentuk dan tekstur lebih cepat dibanding galeri campuran berisi banyak potongan berbeda.',
  'Talk about maintenance honestly': 'Bicarakan soal perawatan dengan jujur',
  'If you only style your hair for two minutes every morning, say it early so the cut matches your real routine.':
    'Kalau Anda hanya sempat menata rambut dua menit setiap pagi, sampaikan dari awal supaya potongannya sesuai rutinitas asli Anda.',
  'Mention your office or campus dress code': 'Sebutkan aturan kantor atau kampus Anda',
  'A barber can keep the cut cleaner around the ears and neckline if you need a more professional finish.':
    'Barber bisa membuat area telinga dan garis leher lebih rapi jika Anda butuh hasil yang lebih profesional.',
  'Tell them your last haircut problem': 'Ceritakan masalah potongan terakhir Anda',
  'Start with what went wrong last time: too bulky, too flat, too short, or hard to style. That helps avoid repeat mistakes.':
    'Mulailah dari apa yang terasa kurang di potongan sebelumnya: terlalu tebal, terlalu lepek, terlalu pendek, atau sulit diatur. Ini membantu menghindari kesalahan yang sama.',
  'Ask where the weight should stay': 'Tanyakan bagian mana yang sebaiknya tetap bervolume',
  'Even a simple trim looks better when you and your barber agree where to keep density and where to remove it.':
    'Potongan sederhana pun akan terlihat lebih baik saat Anda dan barber sepakat bagian mana yang tetap tebal dan bagian mana yang harus diringankan.',
  'Front photos matter most': 'Foto dari depan paling penting',
  'For recommendation and consultation, front-facing photos reveal fringe, balance, and face shape more clearly.':
    'Untuk rekomendasi dan konsultasi, foto dari depan lebih jelas menunjukkan poni, keseimbangan, dan bentuk wajah.',
  'Natural lighting beats bathroom lighting': 'Cahaya alami lebih baik daripada cahaya kamar mandi',
  'Hair direction, texture, and scalp line all read better in soft natural light than under harsh yellow bulbs.':
    'Arah rambut, tekstur, dan garis kulit kepala lebih mudah terlihat dalam cahaya alami yang lembut dibanding lampu kuning yang keras.',
  'Ask for styling product guidance': 'Minta saran produk styling',
  'A haircut that looks great in the chair still needs a realistic product recommendation for everyday wear.':
    'Potongan yang terlihat bagus di kursi barber tetap membutuhkan saran produk yang realistis untuk dipakai setiap hari.',
  'Know your safe fade zone': 'Kenali zona fade yang aman untuk Anda',
  'If you are trying fades for the first time, start lower. You can always go sharper next visit.':
    'Kalau baru pertama kali mencoba fade, mulailah dari yang lebih rendah. Anda selalu bisa membuatnya lebih tegas di kunjungan berikutnya.',
  'Texture changes the whole look': 'Tekstur mengubah keseluruhan tampilan',
  'Two cuts with the same outline can feel completely different depending on whether the top is left soft, separated, or matte.':
    'Dua potongan dengan siluet yang sama bisa terasa sangat berbeda tergantung apakah bagian atas dibiarkan lembut, terpisah, atau matte.',
  'Show your hair when dry if possible': 'Tunjukkan rambut saat kering jika memungkinkan',
  'Dry hair reveals the true fall pattern and makes it easier to judge how much volume or shrinkage you really have.':
    'Rambut kering menunjukkan arah jatuh aslinya dan memudahkan melihat seberapa besar volume atau susut alami yang Anda punya.',
  'Say if you wear a hijab, helmet, or cap often': 'Sampaikan jika Anda sering memakai hijab, helm, atau topi',
  'Hair that stays under headwear most of the day needs a different plan for fringe, crown bulk, and flattening.':
    'Rambut yang sering tertutup penutup kepala membutuhkan rencana berbeda untuk poni, volume crown, dan efek lepek.',
  'Color needs the same honesty': 'Soal warna juga perlu kejujuran yang sama',
  'If you do not want bleach, toning upkeep, or salon revisits, choose a softer color family early.':
    'Jika Anda tidak ingin bleaching, perawatan toning, atau sering kembali ke salon, pilih keluarga warna yang lebih lembut sejak awal.',
  'Fringe should match your forehead comfort': 'Poni harus sesuai kenyamanan area dahi Anda',
  'Some people want their forehead softer; others prefer it open. That choice changes bangs and front layers significantly.':
    'Ada yang ingin area dahi terlihat lebih lembut, ada juga yang lebih suka terbuka. Pilihan ini sangat memengaruhi poni dan layer depan.',
  'Ask how the cut grows out': 'Tanyakan bagaimana potongan ini tumbuh seiring waktu',
  'A haircut that looks slightly less dramatic on day one may actually look better three weeks later.':
    'Potongan yang terlihat sedikit lebih ringan di hari pertama justru bisa terlihat lebih bagus tiga minggu kemudian.',
  'Shape around the ears changes the vibe fast': 'Bentuk di sekitar telinga cepat mengubah kesan',
  'A cleaner ear line feels professional; a softer one feels more relaxed and fashion-forward.':
    'Garis telinga yang lebih rapi terasa profesional, sedangkan yang lebih lembut terasa santai dan modis.',
  'Volume should match your face balance': 'Volume harus sesuai keseimbangan wajah',
  'A little lift can slim the silhouette, while too much height can exaggerate length on oblong faces.':
    'Sedikit lift bisa membuat siluet terlihat lebih ramping, sedangkan terlalu banyak tinggi bisa membuat wajah lonjong terasa lebih panjang.',
  'Do not skip the side profile': 'Jangan lewatkan foto profil samping',
  'A good consultation checks the side line too, especially for mullets, layers, and dramatic color placement.':
    'Konsultasi yang baik juga melihat garis samping, terutama untuk mullet, layer, dan penempatan warna yang dramatis.',
  'Ask for barber wording you can reuse': 'Minta istilah barber yang bisa Anda pakai lagi',
  'A simple phrase like low taper, soft top texture, and no harsh line helps you repeat a good result next time.':
    'Frasa sederhana seperti low taper, tekstur atas lembut, dan tanpa garis tegas membantu Anda mengulang hasil yang bagus di kunjungan berikutnya.',
  'Bold changes are better in steps': 'Perubahan berani lebih baik dilakukan bertahap',
  'If you are moving from safe to dramatic, one controlled step per visit usually gives better outcomes than one huge leap.':
    'Jika Anda berpindah dari gaya aman ke gaya dramatis, satu langkah terkontrol per kunjungan biasanya memberi hasil lebih baik daripada perubahan besar sekaligus.',
  'Jakarta consultation flow': 'Alur konsultasi Jakarta',
  'Bandung everyday styling': 'Styling harian Bandung',
  'Surabaya professional looks': 'Gaya profesional Surabaya',
  'Salon correction routine': 'Rutinitas koreksi salon',
  'Tokyo precision cutting': 'Potongan presisi Tokyo',
  'Beta photo checklist': 'Checklist foto beta',
  'Home capture best practice': 'Praktik terbaik foto di rumah',
  'Singapore polished finish': 'Hasil rapi ala Singapura',
  'Low-risk beta picks': 'Pilihan beta berisiko rendah',
  'Seoul texture-first looks': 'Gaya fokus tekstur ala Seoul',
  'Beta salon prep': 'Persiapan salon beta',
  'Daily routine adaptation': 'Adaptasi rutinitas harian',
  'Low maintenance color': 'Warna low maintenance',
  'Korean/Japanese fringe trends': 'Tren poni Korea/Jepang',
  'Public beta practicality': 'Praktikal untuk beta publik',
  'Office versus off-duty looks': 'Gaya kantor versus santai',
  'Recommendation basics': 'Dasar rekomendasi',
  'Preview readiness': 'Kesiapan preview',
  'Repeatable cuts': 'Potongan yang mudah diulang',
  'Beta confidence building': 'Bangun percaya diri bertahap',
};

const VALUE_MAP_ID = {
  all: 'Semua',
  men: 'Pria',
  women: 'Wanita',
  unisex: 'Unisex',
  short: 'Pendek',
  medium: 'Sedang',
  long: 'Panjang',
  low: 'Rendah',
  high: 'Tinggi',
  balanced: 'Seimbang',
  bold: 'Berani',
  light: 'Ringan',
  professional: 'Profesional',
  classic: 'Klasik',
  clean: 'Rapi',
  taper: 'Taper',
  fade: 'Fade',
  crop: 'Crop',
  textured: 'Bertekstur',
  korean: 'Korea',
  flow: 'Flow',
  layered: 'Layered',
  bob: 'Bob',
  quiff: 'Quiff',
  wolf: 'Wolf',
  shag: 'Shag',
  undercut: 'Undercut',
  minimal: 'Minimal',
  curly: 'Keriting',
  twists: 'Twist',
  texture: 'Tekstur',
  consultation: 'Konsultasi',
  maintenance: 'Perawatan',
  shape: 'Bentuk',
  styling: 'Styling',
  lifestyle: 'Gaya hidup',
  fringe: 'Poni',
  volume: 'Volume',
  color: 'Warna',
  'grow out': 'Masa tumbuh',
  'grow-out': 'Masa tumbuh',
  'risk management': 'Manajemen risiko',
  'photo prep': 'Persiapan foto',
  flow: 'Alur',
  wave: 'Gelombang',
  everyday: 'Harian',
  looks: 'Gaya',
  routine: 'Rutinitas',
  correction: 'Perbaikan',
  cutting: 'Potongan',
  checklist: 'Checklist',
  readiness: 'Kesiapan',
  practice: 'Praktik',
  'side part': 'Side part',
  'soft volume': 'Volume lembut',
  'soft lift': 'Lift lembut',
  'student friendly': 'Cocok untuk Pelajar',
  'student-friendly': 'Cocok untuk Pelajar',
  'texture first': 'Fokus Tekstur',
  'texture-first': 'Fokus Tekstur',
  'barber favorite': 'Favorit Barber',
  'barber-favorite': 'Favorit Barber',
  'safe choice': 'Pilihan Aman',
  'safe-choice': 'Pilihan Aman',
  polished: 'Rapi',
  'bold transformations': 'Perubahan Berani',
  'office ready': 'Siap untuk Kantor',
  'office-ready': 'Siap untuk Kantor',
  'meeting ready': 'Siap Meeting',
  'meeting-ready': 'Siap Meeting',
  refined: 'Rapi',
  'campus style': 'Gaya kampus',
  'content creators': 'Content creator',
  romantic: 'Romantis',
  executive: 'Eksekutif',
  timeless: 'Timeless',
  statement: 'Statement',
  'gym ready': 'Siap olahraga',
  'gym-ready': 'Siap olahraga',
  'camera ready': 'Siap kamera',
  'camera-ready': 'Siap kamera',
  'formal night': 'Malam formal',
  'formal-night': 'Malam formal',
  volume: 'Volume',
  airy: 'Ringan',
  indonesia: 'Indonesia',
  global: 'Global',
  us: 'Amerika Serikat',
  europe: 'Eropa',
  oval: 'Oval',
  round: 'Bulat',
  square: 'Kotak',
  heart: 'Hati',
  oblong: 'Lonjong',
  diamond: 'Diamond',
  triangle: 'Segitiga',
  straight: 'Lurus',
  wavy: 'Bergelombang',
  thick: 'Tebal',
  fine: 'Tipis',
  coily: 'Keriting rapat',
  'office refresh': 'tampilan kantor yang lebih segar',
  'first style change': 'perubahan gaya pertama',
  'daily helmet wear': 'pemakaian helm harian',
  'humid weather': 'cuaca lembap',
  'streetwear looks': 'tampilan streetwear',
  'strong hairline': 'garis rambut tegas',
  'needs conservative office finish': 'butuh hasil kantor yang konservatif',
  'leadership roles': 'peran kepemimpinan',
  'formal settings': 'situasi formal',
  'smart casual looks': 'tampilan smart casual',
  'wants edgy contrast or hard disconnects': 'ingin kontras edgy atau potongan disconnect tegas',
  'natural curls': 'ikal alami',
  'festival looks': 'tampilan festival',
  'high contrast styling': 'styling kontras tinggi',
  'wants low-maintenance barber visits': 'ingin kunjungan barber yang minim perawatan',
  'hot climate': 'cuaca panas',
  'helmet wear': 'sering memakai helm',
  'ultra-fast routine': 'rutinitas super cepat',
  'wants softness around forehead': 'ingin area dahi yang lebih lembut',
  'has strong cowlick concerns': 'punya cowlick yang cukup kuat',
  'client-facing roles': 'peran yang sering bertemu klien',
  'wedding season': 'musim acara pernikahan',
  'smooth grow-out': 'masa tumbuh yang tetap rapi',
  'wants sharp disconnected undercut energy': 'ingin kesan undercut disconnect yang tegas',
  'special events': 'acara spesial',
  'confident styling routine': 'rutinitas styling yang percaya diri',
  'strong jawlines': 'rahang yang tegas',
  'wants wash-and-go routine': 'ingin rutinitas tinggal pakai',
};

const SENTENCE_REPLACEMENTS_ID = [
  ['Works best with', 'Paling cocok dengan'],
  ['Best when paired with', 'Paling pas dipadukan dengan'],
  ['Requires', 'Butuh'],
  ['Needs', 'Butuh'],
  ['Use', 'Gunakan'],
  ['Ask for', 'Minta'],
  ['Keep the finish close to', 'Jaga hasil akhir tetap dekat dengan'],
  ['Keep the texture', 'Jaga tekstur tetap'],
  ['keep the routine', 'jaga rutinitas tetap'],
  ['Styling note:', 'Catatan styling:'],
  ['This preview is a reference, not a final salon guarantee.', 'Preview ini adalah referensi, bukan jaminan hasil akhir salon.'],
  ['with a matte cream and a quick finger-comb finish', 'dengan krim matte dan sisiran jari yang cepat'],
  ['and a quick finger-comb finish', 'dan sisiran jari yang cepat'],
  ['blow-dry direction', 'arahan blow-dry'],
  ['light cream hold', 'hold krim ringan'],
  ['lightweight mousse', 'mousse ringan'],
  ['matte paste', 'pasta matte'],
  ['sea-salt spray', 'sea-salt spray'],
  ['matte clay', 'clay matte'],
  ['diffuser drying', 'pengeringan dengan diffuser'],
  ['regular burst fade cleanups', 'rapikan burst fade secara rutin'],
  ['beard cleanup', 'rapikan jenggot'],
  ['line-up precision', 'line-up yang presisi'],
  ['instead of rigid', 'agar tidak kaku'],
];

function replaceCaseInsensitive(source, searchValue, replacement) {
  return source.replace(new RegExp(escapeRegExp(searchValue), 'gi'), replacement);
}

export function localizeMetadataValue(value, language = 'en', fallback = '') {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  if (language !== 'id') {
    return humanize(value, fallback);
  }

  const normalizedValue = toLowerTrimmed(value);

  if (VALUE_MAP_ID[normalizedValue]) {
    return VALUE_MAP_ID[normalizedValue];
  }

  if (normalizedValue.includes(' and ')) {
    return normalizedValue
      .split(' and ')
      .map((entry) => localizeMetadataValue(entry, language, entry))
      .join(' dan ');
  }

  if (normalizedValue.includes(',')) {
    return normalizedValue
      .split(',')
      .map((entry) => localizeMetadataValue(entry, language, entry))
      .join(', ');
  }

  return humanize(value, fallback);
}

export function localizeCustomerText(text, language = 'en') {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return text;
  }

  if (language !== 'id') {
    return text;
  }

  const trimmedText = text.trim();

  if (EXACT_TEXT_ID[trimmedText]) {
    return EXACT_TEXT_ID[trimmedText];
  }

  const styleDescriptionMatch = trimmedText.match(
    /^(.+?) is a (low|medium|high) maintenance (.+?) style with a (.+?) vibe\. It is especially useful for (.+?) face shapes and is currently trending in (.+?)\.$/i
  );

  if (styleDescriptionMatch) {
    const [, name, maintenanceLevel, categoryLabel, vibeLabel, faceShapeLabel, regionLabel] = styleDescriptionMatch;
    return `${name} adalah gaya ${localizeMetadataValue(categoryLabel, language, categoryLabel)} dengan tingkat perawatan ${localizeMetadataValue(
      maintenanceLevel,
      language,
      maintenanceLevel
    ).toLowerCase()} dan nuansa ${localizeMetadataValue(vibeLabel, language, vibeLabel).toLowerCase()}. Gaya ini cocok untuk bentuk wajah ${localizeMetadataValue(
      faceShapeLabel,
      language,
      faceShapeLabel
    ).toLowerCase()} dan sedang tren di ${localizeMetadataValue(regionLabel, language, regionLabel)}.`;
  }

  const colorDescriptionMatch = trimmedText.match(
    /^(.+?) is a (low|medium|high) maintenance (.+?) direction with a (.+?) undertone\.$/i
  );

  if (colorDescriptionMatch) {
    const [, name, maintenanceLevel, directionLabel, undertoneLabel] = colorDescriptionMatch;
    return `${name} adalah arah warna ${localizeMetadataValue(directionLabel, language, directionLabel).toLowerCase()} dengan tingkat perawatan ${localizeMetadataValue(
      maintenanceLevel,
      language,
      maintenanceLevel
    ).toLowerCase()} dan undertone ${localizeMetadataValue(undertoneLabel, language, undertoneLabel).toLowerCase()}.`;
  }

  const genericStylingMatch = trimmedText.match(
    /^Use a (.+?) finish with (.+?) volume and keep the routine (low|medium|high)\.$/i
  );

  if (genericStylingMatch) {
    const [, finishLabel, volumeLabel, maintenanceLevel] = genericStylingMatch;
    return `Gunakan hasil akhir ${localizeMetadataValue(finishLabel, language, finishLabel).toLowerCase()} dengan volume ${localizeMetadataValue(
      volumeLabel,
      language,
      volumeLabel
    ).toLowerCase()} dan rutinitas perawatan ${localizeMetadataValue(
      maintenanceLevel,
      language,
      maintenanceLevel
    ).toLowerCase()}.`;
  }

  let localizedText = trimmedText;

  for (const [searchValue, replacement] of SENTENCE_REPLACEMENTS_ID) {
    localizedText = replaceCaseInsensitive(localizedText, searchValue, replacement);
  }

  for (const [searchValue, replacement] of Object.entries(VALUE_MAP_ID)) {
    localizedText = localizedText.replace(
      new RegExp(`\\b${escapeRegExp(searchValue)}\\b`, 'gi'),
      replacement
    );
  }

  return localizedText;
}
