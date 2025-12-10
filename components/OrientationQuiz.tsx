import React, { useState } from 'react';
import { ArrowRight, Trophy, X, BrainCircuit } from 'lucide-react';

interface QuizProps {
  onClose: () => void;
  onComplete: (result: string) => void;
  isDarkMode: boolean;
}

type Category = 'ECONOMICO' | 'TURISMO' | 'COSTRUZIONI' | 'AGRARIA' | 'ELETTRONICA' | 'PROFESSIONALE';

interface Option {
  text: string;
  points: Partial<Record<Category, number>>;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Quali materie ti piacciono di più a scuola?",
    options: [
      { text: "Matematica, Informatica e numeri", points: { ECONOMICO: 3, ELETTRONICA: 2 } },
      { text: "Lingue straniere e Geografia", points: { TURISMO: 3, ECONOMICO: 1 } },
      { text: "Tecnologia, Disegno tecnico", points: { COSTRUZIONI: 3, ELETTRONICA: 1 } },
      { text: "Scienze, Biologia, Natura", points: { AGRARIA: 3, PROFESSIONALE: 1 } },
      { text: "Preferisco le attività pratiche e laboratoriali", points: { PROFESSIONALE: 3, AGRARIA: 1 } }
    ]
  },
  {
    id: 2,
    text: "Cosa ti piacerebbe fare 'da grande'?",
    options: [
      { text: "Lavorare in ufficio, gestire aziende o programmare", points: { ECONOMICO: 3, TURISMO: 1 } },
      { text: "Viaggiare, lavorare in hotel o aeroporti", points: { TURISMO: 3, ECONOMICO: 1 } },
      { text: "Progettare case, edifici o lavorare in cantiere", points: { COSTRUZIONI: 3 } },
      { text: "Costruire circuiti, robotica o impianti elettrici", points: { ELETTRONICA: 3 } },
      { text: "Cucinare o aiutare le persone (Sanità)", points: { PROFESSIONALE: 3 } }
    ]
  },
  {
    id: 3,
    text: "Come ti piace passare il tuo tempo libero?",
    options: [
      { text: "Al computer, videogiochi o social media", points: { ECONOMICO: 2, ELETTRONICA: 2 } },
      { text: "Guardare serie TV in lingua o scoprire posti nuovi", points: { TURISMO: 3 } },
      { text: "Stare all'aria aperta, natura o animali", points: { AGRARIA: 3 } },
      { text: "Smontare oggetti, capire come funzionano le cose", points: { ELETTRONICA: 3, COSTRUZIONI: 2 } },
      { text: "Stare con gli amici, cucinare o fare volontariato", points: { PROFESSIONALE: 3 } }
    ]
  },
  {
    id: 4,
    text: "Scegli la parola che ti rappresenta di più:",
    options: [
      { text: "Organizzazione e Logica", points: { ECONOMICO: 3 } },
      { text: "Comunicazione e Apertura", points: { TURISMO: 3 } },
      { text: "Precisione e Progettazione", points: { COSTRUZIONI: 3, ELETTRONICA: 2 } },
      { text: "Natura e Ambiente", points: { AGRARIA: 3 } },
      { text: "Creatività e Servizio", points: { PROFESSIONALE: 3 } }
    ]
  },
  {
    id: 5,
    text: "In quale ambiente ti vedresti meglio a lavorare?",
    options: [
      { text: "Un ufficio moderno e tecnologico", points: { ECONOMICO: 3, ELETTRONICA: 2 } },
      { text: "In giro per il mondo o a contatto con turisti", points: { TURISMO: 3 } },
      { text: "Uno studio di architettura o all'esterno", points: { COSTRUZIONI: 3, AGRARIA: 2 } },
      { text: "Un laboratorio tecnico o scientifico", points: { ELETTRONICA: 2, AGRARIA: 2 } },
      { text: "Un ristorante, un ospedale o a contatto con la gente", points: { PROFESSIONALE: 3 } }
    ]
  }
];

const RESULTS_MAP: Record<Category, string> = {
  ECONOMICO: "Istituto Tecnico Economico (AFM / Sistemi Informativi Aziendali)",
  TURISMO: "Istituto Tecnico Economico - Indirizzo Turismo",
  COSTRUZIONI: "Istituto Tecnico Tecnologico - Costruzioni, Ambiente e Territorio (CAT)",
  AGRARIA: "Istituto Tecnico Tecnologico - Agraria e Agroalimentare",
  ELETTRONICA: "Istituto Tecnico Tecnologico - Elettronica ed Automazione",
  PROFESSIONALE: "Istituto Professionale (Enogastronomia o Sanità/Assistenza)"
};

export const OrientationQuiz: React.FC<QuizProps> = ({ onClose, onComplete, isDarkMode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<Category, number>>({
    ECONOMICO: 0,
    TURISMO: 0,
    COSTRUZIONI: 0,
    AGRARIA: 0,
    ELETTRONICA: 0,
    PROFESSIONALE: 0
  });
  const [showResult, setShowResult] = useState(false);
  const [calculatedResult, setCalculatedResult] = useState<string>("");

  const handleOptionSelect = (points: Partial<Record<Category, number>>) => {
    const newScores = { ...scores };
    (Object.keys(points) as Category[]).forEach((key) => {
      newScores[key] = (newScores[key] || 0) + (points[key] || 0);
    });
    setScores(newScores);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateResult(newScores);
    }
  };

  const calculateResult = (finalScores: Record<Category, number>) => {
    let maxScore = -1;
    let winningCategory: Category = 'ECONOMICO'; // Default fallback

    (Object.keys(finalScores) as Category[]).forEach((key) => {
      if (finalScores[key] > maxScore) {
        maxScore = finalScores[key];
        winningCategory = key;
      }
    });

    setCalculatedResult(RESULTS_MAP[winningCategory]);
    setShowResult(true);
  };

  const handleFinish = () => {
    onComplete(calculatedResult);
  };

  if (showResult) {
    return (
      <div className={`w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-pop-in ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
        <div className="p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
             <Trophy size={32} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Risultato</h2>
          <p className={`text-sm opacity-80 mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>In base alle tue risposte, il percorso ideale è:</p>
          
           <h3 className={`text-xl font-bold mb-8 px-4 py-4 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
             {calculatedResult}
           </h3>

           <div className="flex gap-3">
             <button 
                onClick={onClose}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                }`}
             >
               Chiudi
             </button>
             <button 
                onClick={handleFinish}
                className={`flex-[2] py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                    isDarkMode ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
             >
               Approfondisci <ArrowRight size={18} />
             </button>
           </div>
        </div>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <div className={`w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-message border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      
      {/* Header */}
      <div className={`p-6 flex justify-between items-center ${isDarkMode ? 'border-b border-slate-800' : 'border-b border-slate-100'}`}>
         <div className="flex items-center gap-3">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Quiz Orientamento</h3>
         </div>
         <button onClick={onClose} className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
           <X size={20} />
         </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
         <div className="h-full bg-slate-900 dark:bg-white transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Question Content */}
      <div className="p-6">
         <div className="mb-8">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Domanda {currentStep + 1} / {QUESTIONS.length}
            </span>
            <h2 className={`text-xl font-semibold mt-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              {currentQuestion.text}
            </h2>
         </div>

         <div className="space-y-2">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(option.points)}
                className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between group ${
                   isDarkMode 
                   ? 'border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white' 
                   : 'border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                }`}
              >
                <span className="text-sm font-medium">{option.text}</span>
              </button>
            ))}
         </div>
      </div>
    </div>
  );
};