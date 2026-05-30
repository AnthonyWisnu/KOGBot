import { PrismaClient, type Prisma } from '@prisma/client';
import pino from 'pino';

const prisma = new PrismaClient();
const logger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
});

type OptionKey = 'A' | 'B' | 'C' | 'D';

type QuizSeed = {
  level: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: OptionKey;
  explanation?: string;
};

type FamilyAnswerSeed = {
  answer: string;
  points: number;
};

type FamilyQuestionSeed = {
  question: string;
  answers: FamilyAnswerSeed[];
};

type FamilyTopicSeed = {
  subject: string;
  answers: FamilyAnswerSeed[];
};

type WordScrambleSeed = {
  category: string;
  answer: string;
};

type EmojiGuessSeed = {
  emoji: string;
  answer: string;
};

const optionKeys = ['A', 'B', 'C', 'D'] as const;
const gameSeedTarget = 200;

function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}'"`~_\-]/g, '')
    .replace(/\s+/g, ' ');
}

function createQuizSeed(
  level: string,
  question: string,
  options: [string, string, string, string],
  correctOption: OptionKey,
  explanation?: string,
): QuizSeed {
  return {
    level,
    question,
    optionA: options[0],
    optionB: options[1],
    optionC: options[2],
    optionD: options[3],
    correctOption,
    explanation,
  };
}

function createNumberQuiz(
  level: string,
  question: string,
  answer: number,
  seed: number,
  unit = '',
  step = 1,
): QuizSeed {
  const correctAnswer = formatAnswer(answer, unit);
  const wrongAnswers = createWrongNumbers(answer, step).map((value) => formatAnswer(value, unit));
  const options = buildOptions(correctAnswer, wrongAnswers, seed);

  return createQuizSeed(level, question, options, getOptionKey(seed));
}

function createTextQuiz(
  level: string,
  question: string,
  correctAnswer: string,
  wrongAnswers: [string, string, string],
  seed: number,
): QuizSeed {
  const options = buildOptions(correctAnswer, wrongAnswers, seed);

  return createQuizSeed(level, question, options, getOptionKey(seed));
}

function formatAnswer(answer: number, unit: string): string {
  return unit ? `${answer} ${unit}` : `${answer}`;
}

function buildOptions(
  correctAnswer: string,
  wrongAnswers: readonly string[],
  seed: number,
): [string, string, string, string] {
  const uniqueWrongAnswers = Array.from(
    new Set(wrongAnswers.filter((answer) => answer !== correctAnswer)),
  );

  let fallback = 1;

  while (uniqueWrongAnswers.length < 3) {
    const fallbackAnswer = `${correctAnswer}-${fallback}`;

    if (!uniqueWrongAnswers.includes(fallbackAnswer)) {
      uniqueWrongAnswers.push(fallbackAnswer);
    }

    fallback += 1;
  }

  const correctIndex = seed % 4;
  const result: string[] = [];
  let wrongIndex = 0;

  for (let index = 0; index < 4; index += 1) {
    if (index === correctIndex) {
      result.push(correctAnswer);
      continue;
    }

    const wrongAnswer = uniqueWrongAnswers[wrongIndex];

    if (!wrongAnswer) {
      throw new Error('Pilihan jawaban salah tidak cukup');
    }

    result.push(wrongAnswer);
    wrongIndex += 1;
  }

  return createOptionTuple(result);
}

function createWrongNumbers(answer: number, step: number): number[] {
  const candidates = [
    answer - step,
    answer + step,
    answer + step * 2,
    answer - step * 2,
    answer + step * 3,
    answer + step * 4,
  ];

  return Array.from(
    new Set(candidates.filter((candidate) => candidate > 0 && candidate !== answer)),
  );
}

function createOptionTuple(options: string[]): [string, string, string, string] {
  const optionA = options[0];
  const optionB = options[1];
  const optionC = options[2];
  const optionD = options[3];

  if (!optionA || !optionB || !optionC || !optionD) {
    throw new Error('Pilihan jawaban harus berjumlah empat');
  }

  return [optionA, optionB, optionC, optionD];
}

function getOptionKey(seed: number): OptionKey {
  const optionKey = optionKeys[seed % 4];

  if (!optionKey) {
    throw new Error('Index pilihan jawaban tidak valid');
  }

  return optionKey;
}

function pickItem<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length];

  if (!item) {
    throw new Error('Data seed kosong');
  }

  return item;
}

function buildQuizQuestions(): QuizSeed[] {
  const questions: QuizSeed[] = [];

  addAdditionQuestions(questions);
  addSubtractionQuestions(questions);
  addMultiplicationQuestions(questions);
  addDivisionQuestions(questions);

  if (questions.length !== 300) {
    throw new Error(`Jumlah soal MTK harus 300, saat ini ${questions.length}`);
  }

  return questions;
}

function addAdditionQuestions(questions: QuizSeed[]): void {
  for (let index = 0; index < 75; index += 1) {
    const firstNumber = 5 + ((index * 7) % 95);
    const secondNumber = 3 + ((index * 11) % 87);
    const question = `${firstNumber} + ${secondNumber} = ?`;

    questions.push(createNumberQuiz('SD', question, firstNumber + secondNumber, index, '', 5));
  }
}

function addSubtractionQuestions(questions: QuizSeed[]): void {
  for (let index = 0; index < 75; index += 1) {
    const secondNumber = 4 + ((index * 7) % 76);
    const answer = 3 + ((index * 9) % 90);
    const firstNumber = answer + secondNumber;
    const question = `${firstNumber} - ${secondNumber} = ?`;

    questions.push(createNumberQuiz('SD', question, answer, index + 75, '', 4));
  }
}

function addMultiplicationQuestions(questions: QuizSeed[]): void {
  for (let index = 0; index < 75; index += 1) {
    const firstNumber = 2 + (index % 11);
    const secondNumber = 3 + ((index * 5) % 10);
    const question = `${firstNumber} x ${secondNumber} = ?`;

    questions.push(createNumberQuiz('SD', question, firstNumber * secondNumber, index + 150, '', 3));
  }
}

function addDivisionQuestions(questions: QuizSeed[]): void {
  for (let index = 0; index < 75; index += 1) {
    const divisor = 2 + (index % 11);
    const quotient = 3 + ((index * 5) % 18);
    const dividend = divisor * quotient;
    const question = `${dividend} : ${divisor} = ?`;

    questions.push(createNumberQuiz('SD', question, quotient, index + 225, '', 2));
  }
}

function addPercentageQuestions(questions: QuizSeed[]): void {
  const templates = [
    'Voucher {p}% dari {a} poin bernilai berapa poin?',
    'Diskon {p}% dari harga {a}. Besar diskonnya berapa?',
    'Bonus {p}% dari {a} koin adalah berapa koin?',
    'Jika {p}% dari {a} peserta hadir, jumlah yang hadir berapa?',
    'Hadiah tambahan {p}% dari {a} tiket adalah berapa tiket?',
  ];
  const percentages = [5, 10, 20, 25, 30, 40, 50, 75];
  const baseNumbers = [40, 60, 80, 100, 120, 160, 200, 240, 300, 400];

  for (let index = 0; index < 40; index += 1) {
    const percentage = pickItem(percentages, index);
    const baseNumber = pickItem(baseNumbers, index * 3);
    const answer = (percentage * baseNumber) / 100;
    const template = pickItem(templates, index);
    const question = template
      .replace('{p}', `${percentage}`)
      .replace('{a}', `${baseNumber}`);

    questions.push(createNumberQuiz('SD', question, answer, index + 200, '', 5));
  }
}

function addProbabilityQuestions(questions: QuizSeed[]): void {
  const probabilityQuestions = [
    createTextQuiz('SMP', 'Peluang muncul angka genap saat melempar dadu adalah?', '1/2', ['1/6', '1/3', '2/3'], 240),
    createTextQuiz('SMP', 'Peluang muncul angka 5 saat melempar dadu adalah?', '1/6', ['1/2', '1/3', '5/6'], 241),
    createTextQuiz('SMP', 'Peluang muncul sisi gambar saat melempar koin adalah?', '1/2', ['1/4', '1/3', '1'], 242),
    createTextQuiz('SMP', 'Dalam kotak ada 3 merah dan 2 biru. Peluang mengambil merah adalah?', '3/5', ['2/5', '1/2', '3/2'], 243),
    createTextQuiz('SMP', 'Peluang muncul angka kurang dari 3 pada dadu adalah?', '1/3', ['1/6', '1/2', '2/3'], 244),
    createTextQuiz('SMP', 'Peluang kejadian pasti adalah?', '1', ['0', '1/4', '1/2'], 245),
    createTextQuiz('SMP', 'Peluang kejadian mustahil adalah?', '0', ['1/4', '1/2', '1'], 246),
    createTextQuiz('SMP', 'Ada 4 hijau dan 4 kuning. Peluang mengambil kuning adalah?', '1/2', ['1/4', '1/3', '2/3'], 247),
    createTextQuiz('SMP', 'Peluang muncul angka prima pada dadu adalah?', '1/2', ['1/6', '1/3', '2/3'], 248),
    createTextQuiz('SMP', 'Ada 1 hadiah utama dari 10 kupon. Peluang mendapat hadiah utama adalah?', '1/10', ['1/2', '1/5', '9/10'], 249),
    createTextQuiz('SMP', 'Dari 5 kartu, 2 kartu berwarna merah. Peluang mengambil kartu merah adalah?', '2/5', ['1/5', '3/5', '2/3'], 250),
    createTextQuiz('SMP', 'Peluang muncul angka 1 atau 2 pada dadu adalah?', '1/3', ['1/6', '1/2', '2/3'], 251),
    createTextQuiz('SMP', 'Ada 6 minuman, 3 di antaranya dingin. Peluang memilih minuman dingin adalah?', '1/2', ['1/3', '2/3', '3/4'], 252),
    createTextQuiz('SMP', 'Dari 8 kursi, 2 kursi kosong. Peluang memilih kursi kosong adalah?', '1/4', ['1/2', '1/3', '3/4'], 253),
    createTextQuiz('SMP', 'Peluang muncul angka lebih dari 4 pada dadu adalah?', '1/3', ['1/6', '1/2', '2/3'], 254),
    createTextQuiz('SMP', 'Ada 10 kartu, 5 kartu bernomor ganjil. Peluang mengambil nomor ganjil adalah?', '1/2', ['1/5', '2/5', '3/5'], 255),
    createTextQuiz('SMP', 'Ada 12 kupon, 3 kupon menang. Peluang mengambil kupon menang adalah?', '1/4', ['1/3', '1/2', '3/4'], 256),
    createTextQuiz('SMP', 'Peluang muncul angka 6 pada dadu adalah?', '1/6', ['1/2', '1/3', '5/6'], 257),
    createTextQuiz('SMP', 'Dari 9 gelas, 3 gelas berisi teh. Peluang memilih teh adalah?', '1/3', ['1/9', '1/2', '2/3'], 258),
    createTextQuiz('SMP', 'Ada 20 tiket, 10 tiket sudah dipakai. Peluang memilih tiket yang sudah dipakai adalah?', '1/2', ['1/4', '1/3', '3/4'], 259),
    createTextQuiz('SMP', 'Peluang muncul angka ganjil pada dadu adalah?', '1/2', ['1/6', '1/3', '2/3'], 260),
    createTextQuiz('SMP', 'Ada 7 hadiah kecil dari 14 hadiah. Peluang mendapat hadiah kecil adalah?', '1/2', ['1/7', '1/4', '3/4'], 261),
    createTextQuiz('SMP', 'Dari 6 nomor, 2 nomor adalah kelipatan 3. Peluang memilih kelipatan 3 adalah?', '1/3', ['1/6', '1/2', '2/3'], 262),
    createTextQuiz('SMP', 'Ada 15 kertas, 5 kertas warna biru. Peluang memilih biru adalah?', '1/3', ['1/5', '2/5', '2/3'], 263),
    createTextQuiz('SMP', 'Dari 4 pilihan, hanya 1 yang benar. Peluang menebak benar adalah?', '1/4', ['1/2', '1/3', '3/4'], 264),
    createTextQuiz('SMP', 'Ada 8 hadiah, 4 hadiah berupa voucher. Peluang mendapat voucher adalah?', '1/2', ['1/4', '1/3', '3/4'], 265),
    createTextQuiz('SMP', 'Dari 10 bola, 2 bola putih. Peluang memilih putih adalah?', '1/5', ['1/2', '2/5', '4/5'], 266),
    createTextQuiz('SMP', 'Peluang muncul angka kurang dari 5 pada dadu adalah?', '2/3', ['1/6', '1/3', '1/2'], 267),
    createTextQuiz('SMP', 'Ada 16 kartu, 4 kartu bonus. Peluang mengambil kartu bonus adalah?', '1/4', ['1/2', '1/3', '3/4'], 268),
    createTextQuiz('SMP', 'Dari 12 tempat duduk, 6 berada di depan. Peluang memilih tempat depan adalah?', '1/2', ['1/3', '1/4', '2/3'], 269),
  ];

  questions.push(...probabilityQuestions);
}

function addSquareAreaQuestions(questions: QuizSeed[]): void {
  for (let index = 0; index < 15; index += 1) {
    const side = 3 + index;
    const question = `Karpet persegi punya sisi ${side} m. Luas karpet itu berapa?`;

    questions.push(createNumberQuiz('SD', question, side * side, index + 270, 'm2', side));
  }
}

function addRectangleAreaQuestions(questions: QuizSeed[]): void {
  for (let index = 0; index < 15; index += 1) {
    const length = 5 + index;
    const width = 3 + (index % 8);
    const question = `Meja persegi panjang berukuran ${length} m x ${width} m. Luasnya berapa?`;

    questions.push(createNumberQuiz('SD', question, length * width, index + 285, 'm2', width));
  }
}

function buildFamilyQuestions(): FamilyQuestionSeed[] {
  const variants = [
    (subject: string): string => `Sebutkan ${subject}!`,
    (subject: string): string => `Apa saja contoh ${subject}?`,
    (subject: string): string => `Sebutkan ${subject} yang sering muncul di pikiran orang!`,
    (subject: string): string => `Kalau ditanya cepat, sebutkan ${subject}!`,
  ];
  const questions: FamilyQuestionSeed[] = [];

  for (const topic of familyTopics) {
    for (const variant of variants) {
      questions.push({
        question: variant(topic.subject),
        answers: topic.answers,
      });
    }
  }

  if (questions.length !== 200) {
    throw new Error(`Jumlah pertanyaan Family 100 harus 200, saat ini ${questions.length}`);
  }

  return questions;
}

function answers(items: [string, number][]): FamilyAnswerSeed[] {
  return items.map(([answer, points]) => ({ answer, points }));
}

const familyTopics: FamilyTopicSeed[] = [
  { subject: 'benda yang biasanya ada di dapur', answers: answers([['Kompor', 40], ['Piring', 25], ['Sendok', 20], ['Pisau', 15]]) },
  { subject: 'benda yang biasanya ada di kamar tidur', answers: answers([['Kasur', 40], ['Bantal', 25], ['Selimut', 20], ['Lemari', 15]]) },
  { subject: 'alat tulis yang sering dipakai di sekolah', answers: answers([['Pulpen', 35], ['Pensil', 30], ['Penghapus', 20], ['Penggaris', 15]]) },
  { subject: 'buah yang sering dibuat jus', answers: answers([['Alpukat', 35], ['Jeruk', 30], ['Mangga', 20], ['Jambu', 15]]) },
  { subject: 'makanan yang sering dimakan saat sarapan', answers: answers([['Nasi goreng', 35], ['Roti', 25], ['Bubur', 25], ['Telur', 15]]) },
  { subject: 'minuman yang cocok diminum saat panas', answers: answers([['Es teh', 35], ['Air putih', 30], ['Es jeruk', 20], ['Jus', 15]]) },
  { subject: 'benda yang biasa dibawa saat hujan', answers: answers([['Payung', 45], ['Jas hujan', 30], ['Sandal', 15], ['Tas plastik', 10]]) },
  { subject: 'tempat yang sering dikunjungi saat libur', answers: answers([['Pantai', 35], ['Mall', 30], ['Gunung', 20], ['Taman', 15]]) },
  { subject: 'pekerjaan yang memakai seragam', answers: answers([['Polisi', 35], ['Tentara', 30], ['Dokter', 20], ['Satpam', 15]]) },
  { subject: 'benda yang ada di ruang tamu', answers: answers([['Sofa', 40], ['Meja', 25], ['TV', 20], ['Karpet', 15]]) },
  { subject: 'kendaraan umum yang sering terlihat', answers: answers([['Bus', 35], ['Angkot', 30], ['Kereta', 20], ['Taksi', 15]]) },
  { subject: 'warna lampu lalu lintas', answers: answers([['Merah', 40], ['Kuning', 30], ['Hijau', 30]]) },
  { subject: 'benda yang ada di kamar mandi', answers: answers([['Sabun', 35], ['Sikat gigi', 30], ['Handuk', 20], ['Gayung', 15]]) },
  { subject: 'olahraga yang memakai bola', answers: answers([['Sepak bola', 35], ['Basket', 25], ['Voli', 25], ['Tenis', 15]]) },
  { subject: 'benda yang ada di tas sekolah', answers: answers([['Buku', 35], ['Pulpen', 25], ['Pensil', 20], ['Penghapus', 20]]) },
  { subject: 'makanan yang rasanya pedas', answers: answers([['Sambal', 40], ['Seblak', 25], ['Rendang', 20], ['Mie pedas', 15]]) },
  { subject: 'benda untuk membersihkan rumah', answers: answers([['Sapu', 40], ['Pel', 25], ['Kemoceng', 20], ['Lap', 15]]) },
  { subject: 'tempat membeli makanan', answers: answers([['Warung', 35], ['Restoran', 30], ['Pasar', 20], ['Kantin', 15]]) },
  { subject: 'benda elektronik di rumah', answers: answers([['TV', 35], ['Kulkas', 30], ['Kipas angin', 20], ['Mesin cuci', 15]]) },
  { subject: 'pelajaran yang ada di sekolah', answers: answers([['Matematika', 35], ['Bahasa Indonesia', 25], ['IPA', 20], ['IPS', 20]]) },
  { subject: 'benda yang ada di meja makan', answers: answers([['Piring', 35], ['Sendok', 25], ['Gelas', 20], ['Garpu', 20]]) },
  { subject: 'lauk yang sering dimakan dengan nasi', answers: answers([['Ayam', 35], ['Telur', 30], ['Ikan', 20], ['Tempe', 15]]) },
  { subject: 'benda yang dipakai saat tidur', answers: answers([['Bantal', 35], ['Selimut', 30], ['Guling', 20], ['Sprei', 15]]) },
  { subject: 'tempat yang biasanya ramai', answers: answers([['Pasar', 35], ['Mall', 30], ['Terminal', 20], ['Stasiun', 15]]) },
  { subject: 'benda yang digunakan untuk memasak', answers: answers([['Wajan', 35], ['Panci', 30], ['Spatula', 20], ['Kompor', 15]]) },
  { subject: 'buah berwarna kuning', answers: answers([['Pisang', 40], ['Mangga', 25], ['Nanas', 20], ['Lemon', 15]]) },
  { subject: 'benda yang ada di kantor', answers: answers([['Komputer', 35], ['Meja', 30], ['Kursi', 20], ['Printer', 15]]) },
  { subject: 'hal yang dilakukan sebelum tidur', answers: answers([['Sikat gigi', 35], ['Cuci muka', 25], ['Berdoa', 25], ['Matikan lampu', 15]]) },
  { subject: 'makanan yang biasa dijual di kantin', answers: answers([['Nasi goreng', 30], ['Mie ayam', 25], ['Bakso', 25], ['Gorengan', 20]]) },
  { subject: 'benda yang ada di sekolah', answers: answers([['Papan tulis', 35], ['Meja', 25], ['Kursi', 25], ['Buku', 15]]) },
  { subject: 'alat transportasi roda dua', answers: answers([['Motor', 45], ['Sepeda', 35], ['Skuter', 20]]) },
  { subject: 'benda yang digunakan saat mandi', answers: answers([['Sabun', 40], ['Sampo', 30], ['Handuk', 20], ['Sikat gigi', 10]]) },
  { subject: 'makanan yang dibungkus daun', answers: answers([['Lontong', 35], ['Lemper', 30], ['Pepes', 20], ['Nasi bakar', 15]]) },
  { subject: 'benda yang sering hilang di rumah', answers: answers([['Kunci', 40], ['Remote', 30], ['Dompet', 20], ['Kacamata', 10]]) },
  { subject: 'kegiatan yang dilakukan di pantai', answers: answers([['Berenang', 35], ['Foto', 25], ['Main pasir', 20], ['Makan', 20]]) },
  { subject: 'benda yang dipakai di kepala', answers: answers([['Topi', 40], ['Helm', 30], ['Kerudung', 20], ['Bando', 10]]) },
  { subject: 'makanan yang digoreng', answers: answers([['Tempe', 30], ['Ayam', 30], ['Tahu', 25], ['Pisang', 15]]) },
  { subject: 'benda yang ada di dompet', answers: answers([['Uang', 40], ['KTP', 30], ['Kartu ATM', 20], ['Foto', 10]]) },
  { subject: 'benda yang biasa ada di mobil', answers: answers([['Setir', 35], ['Kursi', 25], ['Spion', 20], ['Sabuk pengaman', 20]]) },
  { subject: 'rasa makanan yang umum', answers: answers([['Manis', 35], ['Asin', 30], ['Pedas', 20], ['Asam', 15]]) },
  { subject: 'benda yang dipakai untuk menulis', answers: answers([['Pulpen', 40], ['Pensil', 35], ['Spidol', 15], ['Kapur', 10]]) },
  { subject: 'tempat menyimpan makanan agar dingin', answers: answers([['Kulkas', 60], ['Freezer', 25], ['Cooler box', 15]]) },
  { subject: 'kegiatan saat ulang tahun', answers: answers([['Tiup lilin', 35], ['Potong kue', 30], ['Foto', 20], ['Makan', 15]]) },
  { subject: 'benda yang dipakai saat olahraga', answers: answers([['Sepatu', 35], ['Baju olahraga', 25], ['Bola', 20], ['Handuk', 20]]) },
  { subject: 'tempat yang ada di rumah', answers: answers([['Kamar', 35], ['Dapur', 30], ['Ruang tamu', 20], ['Kamar mandi', 15]]) },
  { subject: 'benda yang dipakai saat bepergian', answers: answers([['Tas', 35], ['Dompet', 25], ['HP', 25], ['Jaket', 15]]) },
  { subject: 'makanan yang biasa ada di warung nasi', answers: answers([['Ayam goreng', 30], ['Telur balado', 25], ['Sayur', 25], ['Tempe', 20]]) },
  { subject: 'benda yang menghasilkan cahaya', answers: answers([['Lampu', 45], ['Senter', 25], ['Lilin', 20], ['Matahari', 10]]) },
  { subject: 'hal yang dilakukan saat listrik mati', answers: answers([['Nyalakan senter', 35], ['Nyalakan lilin', 30], ['Tidur', 20], ['Cek meteran', 15]]) },
  { subject: 'aplikasi yang sering dibuka di HP', answers: answers([['WhatsApp', 35], ['Instagram', 25], ['TikTok', 25], ['YouTube', 15]]) },
];

const wordScrambleQuestions: WordScrambleSeed[] = [
  { category: 'Buah', answer: 'Mangga' },
  { category: 'Buah', answer: 'Pisang' },
  { category: 'Buah', answer: 'Jeruk' },
  { category: 'Buah', answer: 'Apel' },
  { category: 'Buah', answer: 'Semangka' },
  { category: 'Buah', answer: 'Melon' },
  { category: 'Buah', answer: 'Nanas' },
  { category: 'Buah', answer: 'Pepaya' },
  { category: 'Hewan', answer: 'Kucing' },
  { category: 'Hewan', answer: 'Anjing' },
  { category: 'Hewan', answer: 'Kelinci' },
  { category: 'Hewan', answer: 'Harimau' },
  { category: 'Hewan', answer: 'Gajah' },
  { category: 'Hewan', answer: 'Burung' },
  { category: 'Hewan', answer: 'Ikan' },
  { category: 'Hewan', answer: 'Kuda' },
  { category: 'Benda', answer: 'Kursi' },
  { category: 'Benda', answer: 'Meja' },
  { category: 'Benda', answer: 'Pintu' },
  { category: 'Benda', answer: 'Jendela' },
  { category: 'Benda', answer: 'Lampu' },
  { category: 'Benda', answer: 'Bantal' },
  { category: 'Benda', answer: 'Selimut' },
  { category: 'Benda', answer: 'Gelas' },
  { category: 'Makanan', answer: 'Bakso' },
  { category: 'Makanan', answer: 'Sate' },
  { category: 'Makanan', answer: 'Rendang' },
  { category: 'Makanan', answer: 'Soto' },
  { category: 'Makanan', answer: 'Seblak' },
  { category: 'Makanan', answer: 'Nasi goreng' },
  { category: 'Makanan', answer: 'Mie ayam' },
  { category: 'Makanan', answer: 'Gado gado' },
  { category: 'Tempat', answer: 'Sekolah' },
  { category: 'Tempat', answer: 'Pasar' },
  { category: 'Tempat', answer: 'Pantai' },
  { category: 'Tempat', answer: 'Taman' },
  { category: 'Tempat', answer: 'Masjid' },
  { category: 'Tempat', answer: 'Stasiun' },
  { category: 'Tempat', answer: 'Terminal' },
  { category: 'Tempat', answer: 'Kantor' },
  { category: 'Profesi', answer: 'Dokter' },
  { category: 'Profesi', answer: 'Guru' },
  { category: 'Profesi', answer: 'Polisi' },
  { category: 'Profesi', answer: 'Koki' },
  { category: 'Profesi', answer: 'Pilot' },
  { category: 'Profesi', answer: 'Petani' },
  { category: 'Kendaraan', answer: 'Motor' },
  { category: 'Kendaraan', answer: 'Mobil' },
  { category: 'Kendaraan', answer: 'Sepeda' },
  { category: 'Kendaraan', answer: 'Kereta' },
  { category: 'Kendaraan', answer: 'Pesawat' },
  { category: 'Kendaraan', answer: 'Kapal' },
  ...buildWordScrambleExtraQuestions(),
];

const emojiGuessQuestions: EmojiGuessSeed[] = [
  { emoji: '\u{1F431} + \u{1F41F}', answer: 'Kucing makan ikan' },
  { emoji: '\u{1F436} + \u{1F9B4}', answer: 'Anjing makan tulang' },
  { emoji: '\u{1F697} + \u{1F4A8}', answer: 'Mobil cepat' },
  { emoji: '\u{1F34E} + \u{1F4DA}', answer: 'Apel untuk belajar' },
  { emoji: '\u{2615} + \u{1F35E}', answer: 'Sarapan roti dan kopi' },
  { emoji: '\u{1F36B} + \u{1F37C}', answer: 'Susu cokelat' },
  { emoji: '\u{1F525} + \u{1F35C}', answer: 'Mie pedas' },
  { emoji: '\u{1F35A} + \u{1F414}', answer: 'Nasi ayam' },
  { emoji: '\u{1F35F} + \u{1F354}', answer: 'Burger dan kentang' },
  { emoji: '\u{1F382} + \u{1F389}', answer: 'Pesta ulang tahun' },
  { emoji: '\u{1F3EB} + \u{1F4D6}', answer: 'Belajar di sekolah' },
  { emoji: '\u{1F3E0} + \u{1F6CF}', answer: 'Tidur di rumah' },
  { emoji: '\u{1F3D6} + \u{1F30A}', answer: 'Liburan ke pantai' },
  { emoji: '\u{1F327} + \u{2602}', answer: 'Hujan pakai payung' },
  { emoji: '\u{2600} + \u{1F60E}', answer: 'Hari panas' },
  { emoji: '\u{1F319} + \u{1F634}', answer: 'Tidur malam' },
  { emoji: '\u{1F4F1} + \u{1F4AC}', answer: 'Chat di hp' },
  { emoji: '\u{1F4F7} + \u{1F60A}', answer: 'Foto senyum' },
  { emoji: '\u{1F3A7} + \u{1F3B5}', answer: 'Dengar musik' },
  { emoji: '\u{1F3AE} + \u{1F3C6}', answer: 'Menang game' },
  { emoji: '\u{1F4B8} + \u{1F6CD}', answer: 'Belanja mahal' },
  { emoji: '\u{1F511} + \u{1F6AA}', answer: 'Kunci pintu' },
  { emoji: '\u{1F4A1} + \u{1F4D6}', answer: 'Ide belajar' },
  { emoji: '\u{1F36F} + \u{1F41D}', answer: 'Madu lebah' },
  { emoji: '\u{1F42E} + \u{1F95B}', answer: 'Susu sapi' },
  { emoji: '\u{1F414} + \u{1F95A}', answer: 'Telur ayam' },
  { emoji: '\u{1F41F} + \u{1F35A}', answer: 'Nasi ikan' },
  { emoji: '\u{1F33D} + \u{1F336}', answer: 'Jagung pedas' },
  { emoji: '\u{1F34C} + \u{1F95B}', answer: 'Susu pisang' },
  { emoji: '\u{1F349} + \u{1F9CA}', answer: 'Semangka dingin' },
  { emoji: '\u{1F355} + \u{1F9C0}', answer: 'Pizza keju' },
  { emoji: '\u{1F37F} + \u{1F3AC}', answer: 'Nonton film' },
  { emoji: '\u{26BD} + \u{1F945}', answer: 'Main bola' },
  { emoji: '\u{1F3C0} + \u{1F3DF}', answer: 'Basket di stadion' },
  { emoji: '\u{1F6B2} + \u{1F6E3}', answer: 'Naik sepeda' },
  { emoji: '\u{2708} + \u{1F30D}', answer: 'Keliling dunia' },
  { emoji: '\u{1F689} + \u{1F39F}', answer: 'Tiket kereta' },
  { emoji: '\u{1F6A2} + \u{1F30A}', answer: 'Kapal di laut' },
  { emoji: '\u{1F692} + \u{1F525}', answer: 'Pemadam kebakaran' },
  { emoji: '\u{1F691} + \u{1FA7A}', answer: 'Ambulans darurat' },
  { emoji: '\u{1F46E} + \u{1F6A8}', answer: 'Polisi patroli' },
  { emoji: '\u{1F468}\u{200D}\u{1F373} + \u{1F372}', answer: 'Koki memasak' },
  { emoji: '\u{1F468}\u{200D}\u{2695}\u{FE0F} + \u{1F48A}', answer: 'Dokter memberi obat' },
  { emoji: '\u{1F468}\u{200D}\u{1F3EB} + \u{1F4DD}', answer: 'Guru memberi tugas' },
  { emoji: '\u{1F468}\u{200D}\u{1F33E} + \u{1F33D}', answer: 'Petani panen jagung' },
  { emoji: '\u{1F9F9} + \u{1F3E0}', answer: 'Membersihkan rumah' },
  { emoji: '\u{1F9FA} + \u{1F455}', answer: 'Mencuci baju' },
  { emoji: '\u{1F6BF} + \u{1F9FC}', answer: 'Mandi pakai sabun' },
  { emoji: '\u{1FAA5} + \u{1F9D1}', answer: 'Bercermin' },
  { emoji: '\u{1F4A4} + \u{23F0}', answer: 'Bangun tidur' },
  { emoji: '\u{1F52A} + \u{1F35E}', answer: 'Memotong roti' },
  { emoji: '\u{1F4DD} + \u{1F4A1}', answer: 'Menulis ide' },
  ...buildEmojiGuessExtraQuestions(),
];

const quizQuestions = buildQuizQuestions();
const familyQuestions = buildFamilyQuestions();

function buildWordScrambleExtraQuestions(): WordScrambleSeed[] {
  const banks: Record<string, string[]> = {
    Warna: ['Merah', 'Biru', 'Hijau', 'Kuning', 'Ungu', 'Putih', 'Hitam', 'Cokelat', 'Abu abu', 'Oranye', 'Pink', 'Emas'],
    Tubuh: ['Kepala', 'Rambut', 'Mata', 'Hidung', 'Mulut', 'Telinga', 'Tangan', 'Kaki', 'Jari', 'Lutut', 'Pipi', 'Gigi'],
    Sekolah: ['Buku', 'Pulpen', 'Pensil', 'Penghapus', 'Penggaris', 'Tas', 'Papan tulis', 'Kapur', 'Seragam', 'Bel', 'Kelas', 'Kantin'],
    Dapur: ['Piring', 'Sendok', 'Garpu', 'Pisau', 'Wajan', 'Panci', 'Kompor', 'Kulkas', 'Mangkok', 'Talenan', 'Saringan', 'Centong'],
    Elektronik: ['Televisi', 'Radio', 'Laptop', 'Komputer', 'Kamera', 'Kipas angin', 'Jam', 'Speaker', 'Keyboard', 'Mouse', 'Printer', 'Kalkulator'],
    Alam: ['Gunung', 'Sungai', 'Danau', 'Hutan', 'Awan', 'Bintang', 'Bulan', 'Matahari', 'Hujan', 'Angin', 'Pelangi', 'Tanah'],
    Alat: ['Palu', 'Obeng', 'Tang', 'Gergaji', 'Bor', 'Sekop', 'Sapu', 'Pel', 'Ember', 'Kunci', 'Meteran', 'Lem'],
    Pakaian: ['Baju', 'Celana', 'Jaket', 'Kemeja', 'Kaos', 'Topi', 'Kaos kaki', 'Sandal', 'Sarung', 'Rok', 'Dasi', 'Sabuk'],
    Olahraga: ['Badminton', 'Renang', 'Lari', 'Tinju', 'Voli', 'Futsal', 'Tenis', 'Catur', 'Senam', 'Karate', 'Panahan', 'Golf'],
    Kegiatan: ['Makan', 'Minum', 'Tidur', 'Mandi', 'Belajar', 'Menulis', 'Membaca', 'Memasak', 'Menyapu', 'Mencuci', 'Bermain', 'Bekerja'],
    Sifat: ['Cepat', 'Lambat', 'Panas', 'Dingin', 'Manis', 'Asin', 'Pedas', 'Lucu', 'Ramai', 'Sepi', 'Tinggi', 'Pendek'],
    Hiburan: ['Film', 'Lagu', 'Musik', 'Drama', 'Komik', 'Novel', 'Kartun', 'Konser', 'Panggung', 'Festival', 'Lomba', 'Hadiah', 'Tiket', 'Poster', 'Album', 'Bioskop'],
  };

  return Object.entries(banks)
    .flatMap(([category, answers]) => {
      return answers.map((answer) => ({ category, answer }));
    })
    .slice(0, gameSeedTarget - 52);
}

function buildEmojiGuessExtraQuestions(): EmojiGuessSeed[] {
  const foodItems = [
    item('\u{1F34E}', 'Apel'),
    item('\u{1F34C}', 'Pisang'),
    item('\u{1F349}', 'Semangka'),
    item('\u{1F347}', 'Anggur'),
    item('\u{1F353}', 'Stroberi'),
    item('\u{1F34D}', 'Nanas'),
    item('\u{1F955}', 'Wortel'),
    item('\u{1F33D}', 'Jagung'),
    item('\u{1F35E}', 'Roti'),
    item('\u{1F35C}', 'Mie'),
    item('\u{1F35A}', 'Nasi'),
    item('\u{1F414}', 'Ayam'),
    item('\u{1F41F}', 'Ikan'),
    item('\u{1F95A}', 'Telur'),
    item('\u{1F95B}', 'Susu'),
    item('\u{2615}', 'Kopi'),
    item('\u{1F36A}', 'Kue'),
    item('\u{1F366}', 'Es krim'),
    item('\u{1F355}', 'Pizza'),
    item('\u{1F354}', 'Burger'),
  ];
  const foodTraits = [
    item('\u{1F534}', 'merah'),
    item('\u{1F525}', 'panas'),
    item('\u{1F9CA}', 'dingin'),
    item('\u{1F336}', 'pedas'),
  ];
  const placeItems = [
    item('\u{1F3EB}', 'Sekolah'),
    item('\u{1F3E0}', 'Rumah'),
    item('\u{1F3D6}', 'Pantai'),
    item('\u{1F3DE}', 'Taman'),
    item('\u{1F3DF}', 'Stadion'),
    item('\u{1F3E5}', 'Rumah sakit'),
    item('\u{1F3E6}', 'Bank'),
    item('\u{1F3EA}', 'Toko'),
    item('\u{1F54C}', 'Masjid'),
    item('\u{1F689}', 'Stasiun'),
    item('\u{1F68F}', 'Halte'),
    item('\u{1F3EC}', 'Kantor'),
    item('\u{1F3ED}', 'Pabrik'),
    item('\u{1F3D5}', 'Kemah'),
    item('\u{1F3D4}', 'Gunung'),
    item('\u{1F332}', 'Hutan'),
    item('\u{1F30A}', 'Laut'),
    item('\u{1F30B}', 'Gunung api'),
    item('\u{1F3A1}', 'Pasar malam'),
    item('\u{1F3A5}', 'Bioskop'),
  ];
  const placeTraits = [
    item('\u{1F4D6}', 'belajar'),
    item('\u{1F465}', 'ramai'),
    item('\u{1F319}', 'malam'),
    item('\u{2600}', 'siang'),
  ];

  return [
    ...combineEmojiItems(foodItems, foodTraits),
    ...combineEmojiItems(placeItems, placeTraits),
  ].slice(0, gameSeedTarget - 52);
}

function item(emoji: string, answer: string): { emoji: string; answer: string } {
  return { emoji, answer };
}

function combineEmojiItems(
  leftItems: Array<{ emoji: string; answer: string }>,
  rightItems: Array<{ emoji: string; answer: string }>,
): EmojiGuessSeed[] {
  return leftItems.flatMap((leftItem) => {
    return rightItems.map((rightItem) => ({
      emoji: `${leftItem.emoji} + ${rightItem.emoji}`,
      answer: `${leftItem.answer} ${rightItem.answer}`,
    }));
  });
}

async function seedQuizQuestions(): Promise<Prisma.BatchPayload> {
  try {
    return await prisma.quizQuestion.createMany({
      data: quizQuestions.map((question) => ({
        category: 'MTK',
        ...question,
      })),
    });
  } catch (error) {
    logger.error({ error }, 'Gagal membuat seed kuis MTK');
    throw error;
  }
}

async function seedFamilyQuestions(): Promise<void> {
  try {
    for (const familyQuestion of familyQuestions) {
      await prisma.family100Question.create({
        data: {
          question: familyQuestion.question,
          answers: {
            create: familyQuestion.answers.map((answer) => ({
              answer: answer.answer,
              normalizedAnswer: normalizeAnswer(answer.answer),
              points: answer.points,
            })),
          },
        },
      });
    }
  } catch (error) {
    logger.error({ error }, 'Gagal membuat seed Family 100');
    throw error;
  }
}

async function seedWordScrambleQuestions(): Promise<Prisma.BatchPayload> {
  try {
    if (wordScrambleQuestions.length !== gameSeedTarget) {
      throw new Error(`Seed Tebak Kata harus ${gameSeedTarget} data, saat ini ${wordScrambleQuestions.length}`);
    }

    return await prisma.wordScrambleQuestion.createMany({
      data: wordScrambleQuestions.map((question) => ({
        category: question.category,
        answer: question.answer,
        normalizedAnswer: normalizeAnswer(question.answer),
      })),
    });
  } catch (error) {
    logger.error({ error }, 'Gagal membuat seed Tebak Kata');
    throw error;
  }
}

async function seedEmojiGuessQuestions(): Promise<Prisma.BatchPayload> {
  try {
    if (emojiGuessQuestions.length !== gameSeedTarget) {
      throw new Error(`Seed Tebak Emoji harus ${gameSeedTarget} data, saat ini ${emojiGuessQuestions.length}`);
    }

    return await prisma.emojiGuessQuestion.createMany({
      data: emojiGuessQuestions.map((question) => ({
        emoji: question.emoji,
        answer: question.answer,
        normalizedAnswer: normalizeAnswer(question.answer),
      })),
    });
  } catch (error) {
    logger.error({ error }, 'Gagal membuat seed Tebak Emoji');
    throw error;
  }
}

async function clearGameSeedData(): Promise<void> {
  try {
    await prisma.emojiGuessQuestion.deleteMany();
    await prisma.wordScrambleQuestion.deleteMany();
    await prisma.family100Answer.deleteMany();
    await prisma.family100Question.deleteMany();
    await prisma.quizQuestion.deleteMany();
  } catch (error) {
    logger.error({ error }, 'Gagal membersihkan data seed game');
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    await clearGameSeedData();
    const quizResult = await seedQuizQuestions();
    await seedFamilyQuestions();
    const wordScrambleResult = await seedWordScrambleQuestions();
    const emojiGuessResult = await seedEmojiGuessQuestions();

    const familyAnswerCount = familyQuestions.reduce(
      (total, question) => total + question.answers.length,
      0,
    );

    logger.info(
      {
        quizQuestionCount: quizResult.count,
        familyQuestionCount: familyQuestions.length,
        familyAnswerCount,
        wordScrambleQuestionCount: wordScrambleResult.count,
        emojiGuessQuestionCount: emojiGuessResult.count,
      },
      'Seed data berhasil dibuat',
    );
  } catch (error) {
    logger.error({ error }, 'Seed data gagal dijalankan');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
