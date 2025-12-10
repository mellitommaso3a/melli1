import React, { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { OrientationQuiz } from './components/OrientationQuiz';
import { HomePage } from './components/HomePage';
import { Moon, Sun, HelpCircle, Lightbulb, X, Send, Sparkles, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLanding, setShowLanding] = useState(true); // Control Landing vs App
  
  const [autoQuestion, setAutoQuestion] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // Toggle theme handler
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const faqItems = [
    { icon: "🏫", text: "Quali indirizzi offre la scuola?" },
    { icon: "💼", text: "Sbocchi lavorativi post-diploma" },
    { icon: "👩‍🏫", text: "Chi sono le prof di economia?" },
    { icon: "🧪", text: "Come sono i laboratori?" },
    { icon: "🌍", text: "Progetti Erasmus e viaggi" },
    { icon: "🚌", text: "Dove si trova la sede?" },
  ];

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    
    // Simulate sending feedback
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackText('');
      setIsFeedbackOpen(false);
    }, 2000);
  };

  const handleFaqClick = (question: string) => {
    setAutoQuestion(question);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleQuizComplete = (result: string) => {
    setIsQuizOpen(false);
    setIsSidebarOpen(false);
    handleFaqClick(`Ho completato il quiz di orientamento e il risultato è: "${result}". Puoi darmi maggiori dettagli su questo indirizzo di studio e dirmi perché potrebbe essere adatto a me?`);
  };

  return (
    <div className={`h-[100dvh] w-screen flex overflow-hidden relative ${isDarkMode ? 'dark' : ''} bg-white dark:bg-slate-950`}>
      
      {showLanding ? (
        <HomePage 
          onStart={() => setShowLanding(false)} 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme}
        />
      ) : (
        <>
          {/* Mobile Sidebar Backdrop */}
          {isSidebarOpen && (
            <div 
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden animate-fade-in"
                onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar Navigation - Minimal */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-72 flex flex-col transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:z-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            ${isDarkMode ? 'bg-slate-950 border-r border-slate-800' : 'bg-white border-r border-slate-100'}
          `}>
            {/* Sidebar Header with Logo */}
            <div className="p-6 pb-4 flex justify-between items-start">
              <div className="cursor-pointer" onClick={() => setShowLanding(true)}>
                <div className="flex items-center gap-3">
                    <img 
                        src="https://20.gdromagnosi.it/img/xtra/logo.png" 
                        alt="ISIS Romagnosi Logo" 
                        className="h-8 w-8 object-contain"
                    />
                    <h1 className={`font-semibold text-lg tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Romagnosi AI
                    </h1>
                </div>
              </div>
              {/* Close button for mobile */}
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className={`md:hidden p-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Scrollable Middle Section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2">
                
                {/* Quiz CTA - Minimal */}
                <button 
                    onClick={() => setIsQuizOpen(true)}
                    className={`w-full mb-6 p-4 rounded-lg text-left transition-all border group ${
                        isDarkMode 
                        ? 'border-slate-800 hover:border-slate-700 bg-slate-900/50' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                         <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Quiz Orientamento</span>
                         <BrainCircuit size={18} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Non sai cosa scegliere? Fai il test.</p>
                </button>

                {/* FAQ Section */}
                <div className="mb-6">
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 px-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        Domande Frequenti
                    </h3>
                    <div className="space-y-1">
                        {faqItems.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleFaqClick(item.text)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                                    isDarkMode 
                                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <span className="opacity-70">{item.icon}</span>
                                <span>{item.text}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div className={`p-4 space-y-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              
               {/* Feedback Button */}
              <button 
                 onClick={() => setIsFeedbackOpen(true)}
                 className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg text-sm font-medium transition-colors ${
                     isDarkMode 
                     ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' 
                     : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                 }`}
              >
                  <Lightbulb size={16} />
                  Feedback
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                <span>{isDarkMode ? 'Modalità Chiara' : 'Modalità Scura'}</span>
              </button>
            </div>
          </div>

          {/* Main Content Area - Clean */}
          <main className="flex-1 h-full relative z-10 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
             <ChatInterface 
                isDarkMode={isDarkMode} 
                externalMessage={autoQuestion}
                onExternalMessageHandled={() => setAutoQuestion(null)}
                onToggleSidebar={() => setIsSidebarOpen(true)}
             />
          </main>

          {/* Quiz Modal */}
          {isQuizOpen && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
                 <OrientationQuiz 
                    onClose={() => setIsQuizOpen(false)}
                    onComplete={handleQuizComplete}
                    isDarkMode={isDarkMode}
                 />
             </div>
          )}

          {/* Feedback Modal */}
          {isFeedbackOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
               <div className={`w-full max-w-md rounded-xl shadow-lg border p-6 animate-message ${
                   isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
               }`}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Migliora il Bot
                      </h3>
                      <button onClick={() => setIsFeedbackOpen(false)} className={`p-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          <X size={20} />
                      </button>
                  </div>
                  
                  {feedbackSent ? (
                      <div className="text-center py-10">
                          <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Grazie! 🚀</p>
                      </div>
                  ) : (
                      <form onSubmit={handleSendFeedback}>
                          <textarea 
                              required
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              className={`w-full h-32 p-3 rounded-lg border text-sm resize-none outline-none transition-all ${
                                  isDarkMode 
                                  ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-slate-600' 
                                  : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
                              }`}
                              placeholder="Scrivi qui..."
                          />
                          <div className="mt-6 flex justify-end">
                              <button 
                                  type="submit"
                                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                      isDarkMode 
                                      ? 'bg-white text-black hover:bg-slate-200' 
                                      : 'bg-slate-900 text-white hover:bg-slate-800'
                                  }`}
                              >
                                  Invia
                              </button>
                          </div>
                      </form>
                  )}
               </div>
            </div>
          )}
        </>
      )}
      
    </div>
  );
};

export default App;