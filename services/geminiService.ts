
import { GoogleGenAI } from "@google/genai";
import { TestResults, RecommendationLevel, AIReportSections } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';

export const generatePsychologicalReport = async (results: TestResults, candidateName: string, position: string = "Kandidat"): Promise<{ sections: AIReportSections, recommendation: RecommendationLevel }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // CONTEXT: Senior Industrial Psychologist persona with modular instructions
  // Fix: Added null checks for results.kraepelin to prevent toFixed() errors if the test was skipped or failed.
  const prompt = `
    PERAN: Senior AI Prompt Engineer & Industrial Psychologist.
    KONTEKS: Analisis hasil asesmen rekrutmen untuk posisi: ${position}.
    KANDIDAT: ${candidateName}
    
    DATA MENTAH:
    - DISC: ${JSON.stringify(results.disc?.raw || null)}
    - PAPI: ${JSON.stringify(results.papi || null)}
    - KRAEPELIN: Kecepatan ${results.kraepelin ? results.kraepelin.panker.toFixed(2) : 'N/A'}, Ketelitian ${results.kraepelin ? (100 - (results.kraepelin.tianker || 0)).toFixed(2) : 'N/A'}%, Kestabilan ${results.kraepelin?.janker || 'N/A'}, Tren ${results.kraepelin?.trend || 'N/A'}.
    
    INSTRUKSI MODUL:
    
    MODUL A (Executive Summary): 
    Berikan kesimpulan "Helicopter View" dalam 1 paragraf padat (maks 60 kata). Kalimat indikatif, nada objektif, formal, dan tegas. Fokus pada potensi utama, risiko, dan rekomendasi posisi.
    
    MODUL B (Kepribadian DISC/PAPI): 
    Analisis gaya kerja, komunikasi, pengambilan keputusan, dan potensi konflik. Hindari definisi teoritis, langsung bahas perilaku nyata kandidat.
    
    MODUL C (Ketahanan Kraepelin): 
    Terjemahkan angka menjadi analisis stamina, fokus (error rate), dan respon terhadap tekanan deadline.
    
    MODUL D (Interview Guide): 
    Buat 3 pertanyaan Behavioral Event Interview (BEI) untuk menggali area kelemahan/red flags.
    
    BATASAN:
    - JANGAN HALUSINASI. Jika data null, jawab "Data tidak cukup untuk dianalisis".
    - Gunakan eufemisme bisnis (e.g., "Membutuhkan dorongan" vs "Malas").
    - Gunakan kata ganti "Kandidat" atau "Ybs".
    
    FORMAT OUTPUT (WAJIB):
    [SECTION_SUMMARY]
    ...
    [SECTION_PERSONALITY]
    ...
    [SECTION_PERFORMANCE]
    ...
    [SECTION_INTERVIEW]
    ...
    [RECOMMENDATION]
    (Pilih: Highly Recommended / Recommended / Consider with Notes / Not Recommended)
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.3, // Consistent professional tone
        topP: 0.8,
      }
    });
    
    const text = response.text || "";
    
    const extract = (marker: string, nextMarker?: string) => {
      const start = text.indexOf(marker);
      if (start === -1) return "Data tidak tersedia.";
      const realStart = start + marker.length;
      const end = nextMarker ? text.indexOf(nextMarker) : text.length;
      return text.substring(realStart, end).trim();
    };

    const sections: AIReportSections = {
      executiveSummary: extract("[SECTION_SUMMARY]", "[SECTION_PERSONALITY]"),
      personalityAnalysis: extract("[SECTION_PERSONALITY]", "[SECTION_PERFORMANCE]"),
      performanceAnalysis: extract("[SECTION_PERFORMANCE]", "[SECTION_INTERVIEW]"),
      interviewGuide: extract("[SECTION_INTERVIEW]", "[RECOMMENDATION]"),
      fullText: text
    };

    const recStr = extract("[RECOMMENDATION]");
    let recommendation: RecommendationLevel = 'Consider with Notes';
    if (recStr.includes('Highly Recommended')) recommendation = 'Highly Recommended';
    else if (recStr.includes('Not Recommended')) recommendation = 'Not Recommended';
    else if (recStr.includes('Recommended')) recommendation = 'Recommended';

    return { sections, recommendation };
  } catch (error) {
    console.error("AI Report Generation Error:", error);
    return { 
      sections: { 
        executiveSummary: "Gagal generate analisis.", 
        personalityAnalysis: "Error API.", 
        performanceAnalysis: "Error API.", 
        interviewGuide: "Error API.", 
        fullText: "" 
      }, 
      recommendation: 'Consider with Notes' 
    };
  }
};
