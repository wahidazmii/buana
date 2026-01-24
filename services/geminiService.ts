import { GoogleGenAI, Type } from "@google/genai";
import { TestResults, RecommendationLevel, AIReportSections } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';

/**
 * Generates a comprehensive psychological report based on candidate's test results.
 * Uses a persona-driven approach for PT. Buana Megah Paper Mills pasuruan.
 */
export const generatePsychologicalReport = async (
  results: TestResults, 
  candidateName: string, 
  position: string = "Kandidat"
): Promise<{ sections: AIReportSections, recommendation: RecommendationLevel }> => {
  
  // Initialize AI client inside the function to ensure up-to-date environment variables
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Data Contextualization
  const kraepelinContext = results.kraepelin ? `
    - Panker (Kecepatan Rata-rata): ${results.kraepelin.panker || results.kraepelin.avg_speed || 0}
    - Tianker (Ketelitian/Deviasi): ${results.kraepelin.tianker || results.kraepelin.accuracy_deviation || 0}
    - Janker (Ketahanan/Rentang): ${results.kraepelin.janker || 0}
    - Tren Performa: ${results.kraepelin.trend || 0} (Positif: Konsisten/Naik, Negatif: Mudah Lelah)
  ` : "Data Kraepelin Tidak Tersedia";

  const discContext = results.disc ? JSON.stringify(results.disc.raw || results.disc) : "Data DISC Tidak Tersedia";
  const papiContext = results.papi ? JSON.stringify(results.papi) : "Data PAPI Tidak Tersedia";
  const ishiharaContext = results.ishihara ? `Hasil Tes Buta Warna: ${results.ishihara.status} (${results.ishihara.score}/${results.ishihara.total})` : "Data Ishihara Tidak Tersedia";

  // 2. Persona-Driven Prompt Construction
  const prompt = `
    Anda adalah Senior Psikolog Industri & Asesor Rekrutmen Utama di PT. Buana Megah (Paper Mills Pasuruan).
    
    Tugas Anda: Memberikan analisis psikometri yang tajam, profesional, dan objektif untuk kandidat berikut:
    NAMA KANDIDAT: ${candidateName}
    POSISI YANG DILAMAR: ${position}

    DATA ASESMEN:
    - DISC (Kepribadian): ${discContext}
    - PAPI KOSTICK (Perilaku Kerja): ${papiContext}
    - KRAEPELIN (Daya Tahan & Kecepatan Kerja): ${kraepelinContext}
    - ISHIHARA (Kesehatan Mata): ${ishiharaContext}

    TUJUAN LAPORAN:
    1. Executive Summary: Hubungkan antara profil kepribadian (DISC) dengan kemampuan kognitif/daya tahan (Kraepelin). Apakah dia cocok untuk lingkungan pabrik kertas yang dinamis?
    2. Strengths: 3-5 poin kekuatan utama dalam bekerja.
    3. Weaknesses: Risiko perilaku atau area yang perlu diawasi.
    4. Recommendation: Highly Recommended / Recommended / Consider with Notes / Not Recommended.

    Gunakan Bahasa Indonesia formal yang elegan.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          },
          required: ["executiveSummary", "strengths", "areasForImprovement", "recommendation"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");

    const sections: AIReportSections = {
      executiveSummary: parsed.executiveSummary || "Ringkasan tidak tersedia.",
      strengths: parsed.strengths || [],
      areasForImprovement: parsed.areasForImprovement || [],
      fullText: response.text || ""
    };

    let validRec: RecommendationLevel = 'Consider with Notes';
    const recRaw = (parsed.recommendation || '').toLowerCase();
    
    if (recRaw.includes('highly')) validRec = 'Highly Recommended';
    else if (recRaw.includes('not')) validRec = 'Not Recommended';
    else if (recRaw.includes('recommended')) validRec = 'Recommended';

    return { sections, recommendation: validRec };

  } catch (error) {
    console.error("AI Generation Failed:", error);
    return { 
      sections: { 
        executiveSummary: "Gagal memproses analisis AI. Hubungi administrator IT.", 
        strengths: ["Internal Error"], 
        areasForImprovement: ["Koneksi Gemini API terputus"], 
        fullText: "" 
      }, 
      recommendation: 'Consider with Notes' 
    };
  }
};