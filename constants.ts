import { DiscQuestion, PapiQuestion, TestConfiguration } from './types';

// =========================================
// 1. DISC (24 Nomor x 4 Pilihan)
// =========================================
export const DISC_QUESTIONS: DiscQuestion[] = [
  {
    id: 1,
    options: [
      { text: "Gampang bergaul, ramah, mudah setuju", most: "I", least: "I" },
      { text: "Mempercayai, percaya pada orang lain", most: "S", least: "S" },
      { text: "Petualang, suka mengambil resiko", most: "D", least: "D" },
      { text: "Penuh toleransi, menghormati orang lain", most: "C", least: "C" }
    ]
  },
  {
    id: 2,
    options: [
      { text: "Lembut, tertutup", most: "S", least: "S" },
      { text: "Persuasif, meyakinkan", most: "I", least: "I" },
      { text: "Rendah hati, sederhana", most: "C", least: "C" },
      { text: "Asertif, agresif, penuntut", most: "D", least: "D" }
    ]
  },
  // Untuk produksi, Admin dapat mengedit butir 3-24 melalui menu Bank Soal
  ...Array.from({ length: 22 }, (_, i) => {
    const id = i + 3;
    return {
      id: id,
      options: [
        { text: `[${id}-D] Berani, Pengambil Keputusan`, most: "D", least: "D" },
        { text: `[${id}-I] Ceria, Menyenangkan`, most: "I", least: "I" },
        { text: `[${id}-S] Tenang, Pendengar Baik`, most: "S", least: "S" },
        { text: `[${id}-C] Teliti, Suka Aturan`, most: "C", least: "C" }
      ]
    };
  })
];

// =========================================
// 2. PAPI KOSTICK (90 Pasang)
// =========================================
// Array Dimensi PAPI untuk rotasi otomatis (Demo purpose)
const PAPI_DIMS = ['G', 'L', 'I', 'T', 'V', 'S', 'R', 'D', 'C', 'E', 'N', 'A', 'P', 'X', 'B', 'O', 'K', 'Z', 'F', 'W'];

export const PAPI_QUESTIONS: PapiQuestion[] = Array.from({ length: 90 }, (_, i) => {
  // Logic rotasi dimensi agar sebaran data merata di radar chart
  const dimA = PAPI_DIMS[i % 20]; 
  const dimB = PAPI_DIMS[(i + 5) % 20]; 

  return {
    id: i + 1,
    pair: {
      a: { 
        text: `Saya adalah orang yang pekerja keras dan suka tantangan (Dimensi: ${dimA})`, 
        dimension: dimA 
      },
      b: { 
        text: `Saya lebih suka mengikuti aturan yang jelas dan terstruktur (Dimensi: ${dimB})`, 
        dimension: dimB 
      }
    }
  };
});

// =========================================
// 3. KRAEPELIN DEFAULT CONFIG
// =========================================
export const KRAEPELIN_DEFAULTS: TestConfiguration = {
  timerPerLine: 15,      // 15 detik per kolom (Standar Industri)
  totalLines: 40,        // 40 kolom (Ukuran Standard Kertas Koran)
  digitsPerLine: 45,     // Tinggi tumpukan angka per kolom
  direction: 'UP_TO_DOWN' // Cara hitung: Bawah ke Atas (Standard Kraepelin)
};
