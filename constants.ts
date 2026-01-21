import { DiscQuestion, PapiQuestion } from './types';

// Fix: Removed API_KEY export; access process.env.API_KEY directly in service initializations.

export const DISC_QUESTIONS: DiscQuestion[] = [
  {
    id: 1,
    options: [
      { text: "Gampang bergaul, ramah, setuju", most: "I", least: "I" },
      { text: "Mempercayai, percaya pada orang lain", most: "S", least: "S" },
      { text: "Petualang, suka mengambil resiko", most: "D", least: "D" },
      { text: "Penuh toleransi, menghormati orang lain", most: "C", least: "C" }
    ]
  },
  {
    id: 2,
    options: [
      { text: "Lembut, tertutup", most: "C", least: "C" },
      { text: "Persuasif, meyakinkan", most: "I", least: "I" },
      { text: "Rendah hati, sederhana", most: "S", least: "S" },
      { text: "Asertif, percaya diri", most: "D", least: "D" }
    ]
  },
  // Simplified for demo - Real DISC has 24 items
  ...Array.from({ length: 22 }, (_, i) => ({
    id: i + 3,
    options: [
      { text: `Pernyataan A - Ke-${i+3}`, most: "D", least: "S" },
      { text: `Pernyataan B - Ke-${i+3}`, most: "I", least: "C" },
      { text: `Pernyataan C - Ke-${i+3}`, most: "S", least: "D" },
      { text: `Pernyataan D - Ke-${i+3}`, most: "C", least: "I" }
    ]
  }))
];

export const PAPI_QUESTIONS: PapiQuestion[] = Array.from({ length: 90 }, (_, i) => ({
  id: i + 1,
  pair: {
    a: { text: `Saya bekerja keras (Pernyataan A-${i+1})`, dimension: i % 20 === 0 ? "G" : "L" },
    b: { text: `Saya suka memimpin (Pernyataan B-${i+1})`, dimension: i % 20 === 0 ? "P" : "I" }
  }
}));

export const KRAEPELIN_CONFIG = {
  COLUMNS: 20,
  ROWS: 15,
  TIME_PER_COLUMN: 15, // seconds
};