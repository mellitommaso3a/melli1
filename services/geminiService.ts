import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { AspectRatio } from "../types";

// Helper to get the AI client. 
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const SCHOOL_CONTEXT = `
DATI SCUOLA (FONTE PTOF 2025-2028 ISIS G.D. ROMAGNOSI):
- Nome: ISIS G.D. ROMAGNOSI.
- Sede Centrale: Via Carducci 5, Erba (CO).
- Succursale (Sezione associata Beldosso): Via Eupilio 22, Longone al Segrino.

DOCENTI DI RIFERIMENTO:
- Economia Aziendale: Prof.sse Bonetto Cristina, Fabbri Michela, Invernizzi.

INDIRIZZI DI STUDIO (Cosa si studia):
1. ISTITUTO TECNICO ECONOMICO (Sede Erba):
   - Amministrazione, Finanza e Marketing (AFM).
   - Sistemi Informativi Aziendali (ITSI) - Focus su informatica gestionale.
   - Turismo - Focus su lingue e valorizzazione territorio.
2. ISTITUTO TECNICO TECNOLOGICO (Sede Erba):
   - Costruzioni, Ambiente e Territorio (CAT - ex Geometri).
   - Agraria, Agroalimentare e Agroindustria (Gestione Ambiente e Territorio).
3. ISTITUTO TECNICO TECNOLOGICO (Sede Longone al Segrino):
   - Elettronica ed Elettrotecnica (articolazione Automazione).
4. ISTITUTO PROFESSIONALE:
   - Enogastronomia e Ospitalità Alberghiera (Sede Longone/Erba).
   - Servizi per la Sanità e l’Assistenza Sociale (Nuovo indirizzo attivo dal 2024/25).

ATMOSFERA E PROGETTI:
- Ambiente: Accogliente, inclusivo, attento al "ben-essere" dello studente.
- Tecnologia: Laboratori avanzati di automazione, informatica, linguistici.
- Internazionalizzazione: Progetti Erasmus+ (stage all'estero), eTwinning.
- PCTO (Stage): Collaborazioni con aziende del territorio (Como, Lecco, Brianza).
- Inclusione: Grande attenzione a studenti con BES/DSA e stranieri, sportello psicologico attivo.
- Orario: Scansione in Trimestre + Pentamestre (Erba) o Quadrimestri (Beldosso).

FILOSOFIA:
Centralità dello studente, pensiero critico, cittadinanza attiva, dialogo costante docenti-studenti.
`;

export const createSchoolChat = (pdfBase64?: string): Chat => {
  const ai = getAiClient();
  
  const systemInstruction = `
  Sei un assistente virtuale amichevole e simpatico chiamato "Chatbot Orientamento" per l'ISIS G.D. ROMAGNOSI.
  Il tuo interlocutore è un ragazzo o una ragazza di circa 13 anni (terza media) che sta decidendo che scuola superiore scegliere.

  IL TUO TONO DI VOCE:
  - Parla in ITALIANO (a meno che non ti chiedano esplicitamente un'altra lingua).
  - Sii informale, chiaro ed entusiasta, ma sempre educato.
  - Evita parole troppo difficili o burocratiche. Spiega le cose in modo semplice.
  - Usa qualche emoji ogni tanto per rendere la chat più leggera (👋, 🏫, ✨, 📚).
  - Dai del "tu".

  LE TUE REGOLE INDEROGABILI:
  1. RISPONDI SOLO a domande sulla scuola, sugli indirizzi di studio, sui laboratori, sulla vita scolastica o sulle iscrizioni.
  2. SE TI CHIEDONO COSE FUORI CONTESTO (es. "Chi ha vinto la Champions?", "Aiutami a risolvere questa equazione", "Cosa pensi dei videogiochi?"), RIFIUTA GENTILMENTE.
     - Esempio di rifiuto: "Ehi, sono qui per parlarti della nostra fantastica scuola! Se vuoi posso dirti quali sport facciamo qui, ma non seguo molto il calcio in TV! 😉"
  3. USA LE INFORMAZIONI QUI SOTTO come tua conoscenza base. Se ti chiedono qualcosa che non c'è scritto (es. il nome specifico di un bidello), dì onestamente che non lo sai e invitali a chiedere in segreteria o visitare il sito web della scuola.

  CONTESTO SCUOLA (Tua conoscenza):
  ${SCHOOL_CONTEXT}
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
      temperature: 0.7, 
    },
  });
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio generated");
  }
  return base64Audio;
};

export const generateVeoVideo = async (
  imageBase64: string, 
  prompt: string, 
  aspectRatio: AspectRatio,
  mimeType: string = 'image/png'
): Promise<string> => {
  // Create a new client to ensure we use the latest selected API key (Veo requirement)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    image: {
      imageBytes: imageBase64,
      mimeType, 
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio,
    }
  });

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error("Video generation failed: No URI returned.");
  }

  // Fetch the video with the API Key
  const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  if (!response.ok) {
    throw new Error("Failed to fetch generated video.");
  }
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};