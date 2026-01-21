
import { TestResults } from '../types';

export const calculateDiscScore = (answers: { id: number; most: number; least: number }[]) => {
  const scores: Record<string, { most: number; least: number; change: number }> = {
    D: { most: 0, least: 0, change: 0 },
    I: { most: 0, least: 0, change: 0 },
    S: { most: 0, least: 0, change: 0 },
    C: { most: 0, least: 0, change: 0 },
    N: { most: 0, least: 0, change: 0 }
  };

  const mapping = ["D", "I", "S", "C"];

  answers.forEach(ans => {
    const mostDim = mapping[ans.most] || "N";
    const leastDim = mapping[ans.least] || "N";
    if (scores[mostDim]) scores[mostDim].most++;
    if (scores[leastDim]) scores[leastDim].least++;
  });

  Object.keys(scores).forEach(key => {
    scores[key].change = scores[key].most - scores[key].least;
  });

  return { raw: scores, profileName: "Result-Oriented" };
};

export const calculatePapiScore = (answers: Record<number, 'a' | 'b'>) => {
  const dims = ['G', 'L', 'I', 'T', 'V', 'S', 'R', 'D', 'C', 'E', 'N', 'A', 'P', 'X', 'B', 'O', 'K', 'Z', 'F', 'W'];
  const dimensions: Record<string, number> = {};
  dims.forEach(d => dimensions[d] = 0);

  Object.keys(answers).forEach((key, idx) => {
    const choice = answers[Number(key)];
    const dim = choice === 'a' ? dims[idx % 20] : dims[(idx + 5) % 20];
    dimensions[dim] = (dimensions[dim] || 0) + 1;
  });

  return dimensions;
};

export const calculateKraepelinScore = (columns: number[][], userAnswers: number[][]) => {
  let totalCorrect = 0;
  let totalAttempted = 0;
  let totalWrong = 0;
  const workCurve: number[] = [];

  userAnswers.forEach((col, idx) => {
    let colCorrect = 0;
    col.forEach((ans, rowIdx) => {
      if (ans !== undefined) {
        totalAttempted++;
        const expected = (columns[idx][rowIdx] + columns[idx][rowIdx + 1]) % 10;
        if (ans === expected) {
          colCorrect++;
          totalCorrect++;
        } else {
          totalWrong++;
        }
      }
    });
    workCurve.push(colCorrect);
  });

  const numCols = workCurve.length;
  const panker = totalCorrect / (numCols || 1);
  const tianker = totalAttempted > 0 ? (totalWrong / totalAttempted) * 100 : 0;
  
  const maxCorrect = Math.max(...workCurve);
  const minCorrect = Math.min(...workCurve);
  const janker = maxCorrect - minCorrect;

  const first5 = workCurve.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const last5 = workCurve.slice(-5).reduce((a, b) => a + b, 0) / 5;
  let trend: 'Rising' | 'Falling' | 'Stable' = 'Stable';
  if (last5 > first5 + 2) trend = 'Rising';
  else if (last5 < first5 - 2) trend = 'Falling';

  return { panker, tianker, janker, trend, workCurve };
};

export const calculateIshiharaScore = (answers: Record<string, string>, correctKeys: Record<string, string>) => {
  let correctCount = 0;
  const total = Object.keys(correctKeys).length;
  
  Object.keys(correctKeys).forEach(id => {
    if (answers[id] === correctKeys[id]) {
      correctCount++;
    }
  });

  // Specific Medical Thresholds for 14-Plate Standard
  let status: 'Normal' | 'Partial Color Blind' | 'Total Color Blind' = 'Normal';
  if (correctCount >= 10) status = 'Normal';
  else if (correctCount >= 5) status = 'Partial Color Blind';
  else status = 'Total Color Blind';

  return { score: correctCount, status, totalPlates: total };
};
