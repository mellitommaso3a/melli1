import React from 'react';
import { ArrowRight, School, Compass, MessageCircle, Moon, Sun, BookOpen } from 'lucide-react';

interface HomePageProps {
  onStart: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStart, isDarkMode, toggleTheme }) => {
  const AVATAR_URL = "https://20.gdromagnosi.it/img/xtra/logo.png";

  const features = [
    {
      title: "Indirizzi di Studio",
      desc: "Economico, Tecnologico e Professionale."
    },
    {
      title: "Quiz Orientamento",
      desc: "Un breve test per capire la tua strada."
    },
    {
      title: "Vita Scolastica",
      desc: "Laboratori, progetti e orari."
    }
  ];

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col relative font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      
      {/* Navbar */}
      <nav className="w-full p-6 md:p-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={AVATAR_URL} alt="Logo" className="w-8 h-8 object-contain opacity-80" />
          <span className="font-semibold tracking-tight text-sm">ISIS Romagnosi</span>
        </div>
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-colors ${
             isDarkMode 
             ? 'text-slate-400 hover:text-white' 
             : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full">
        
        <div className="text-center space-y-8 animate-pop-in">
           <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-1.1">
             Scegli il tuo <br/>futuro.
           </h1>
           
           <p className={`text-lg md:text-xl font-light max-w-lg mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
             L'assistente virtuale dell'ISIS Romagnosi è qui per guidarti nella scelta della scuola superiore.
           </p>

           <div className="pt-8">
             <button 
                onClick={onStart}
                className={`group px-8 py-4 rounded-full font-medium text-lg transition-all flex items-center gap-3 mx-auto ${
                    isDarkMode 
                    ? 'bg-white text-black hover:bg-slate-200' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
             >
                <span>Inizia a Chattare</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </button>
           </div>
        </div>

        {/* Minimal Feature List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full mt-24 border-t pt-12 border-slate-100 dark:border-slate-900 animate-message [animation-delay:0.1s]">
           {features.map((feat, idx) => (
             <div key={idx} className="text-center md:text-left">
               <h3 className="font-semibold text-base mb-2">{feat.title}</h3>
               <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{feat.desc}</p>
             </div>
           ))}
        </div>

      </main>
    </div>
  );
};