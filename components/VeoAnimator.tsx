import React, { useState } from 'react';
import { Film, Upload, Loader, Play, AlertCircle, Settings } from 'lucide-react';
import { generateVeoVideo } from '../services/geminiService';
import { AspectRatio } from '../types';

interface VeoAnimatorProps {
  isDarkMode: boolean;
}

export const VeoAnimator: React.FC<VeoAnimatorProps> = ({ isDarkMode }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      
      // Reset state
      setImageFile(file);
      setResultVideo(null);
      setError(null);

      // Preview
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) return;
    
    setIsGenerating(true);
    setError(null);
    setResultVideo(null);
    setProgressMessage('Initializing Veo...');

    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      const base64 = await base64Promise;

      setProgressMessage('Checking API permissions...');
      
      // Simulate steps for UX
      setTimeout(() => setProgressMessage('Generating video frames... this takes about 1-2 minutes...'), 2000);

      const videoUrl = await generateVeoVideo(base64, prompt, aspectRatio);
      
      setResultVideo(videoUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate video. Please check your API Key and try again.");
    } finally {
      setIsGenerating(false);
      setProgressMessage('');
    }
  };

  const handleApiKeyConfig = async () => {
      try {
          if (window.aistudio) {
             await window.aistudio.openSelectKey();
          } else {
              alert("AI Studio environment not detected.");
          }
      } catch (e) {
          console.error(e);
          alert("Failed to open key selector.");
      }
  }

  return (
    <div className={`rounded-2xl shadow-sm border h-full overflow-y-auto p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 text-rose-600">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-rose-900/30' : 'bg-rose-100'}`}>
             <Film size={24} />
          </div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Veo Animator</h2>
        </div>
        <button 
            onClick={handleApiKeyConfig}
            className={`text-xs flex items-center gap-1 border px-3 py-1.5 rounded-full transition-colors ${
                isDarkMode 
                  ? 'text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600' 
                  : 'text-slate-500 border-slate-200 hover:text-slate-700'
            }`}
        >
            <Settings size={12} /> Configure API Key
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          
          {/* Image Dropzone */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>1. Upload Source Image</label>
            <div className="relative group">
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  imagePreview 
                    ? 'border-rose-400 bg-rose-50/10' 
                    : (isDarkMode ? 'border-slate-700 hover:border-rose-500 hover:bg-slate-800' : 'border-slate-300 hover:border-rose-400 hover:bg-slate-50')
              }`}>
                {imagePreview ? (
                  <div className="relative h-48 flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="max-h-full max-w-full rounded-lg shadow-sm object-contain" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                       <span className="text-white font-medium">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center text-slate-400">
                    <Upload size={48} className={`mb-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs mt-1 opacity-70">PNG or JPG recommended</p>
                  </div>
                )}
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" disabled={isGenerating} />
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>2. Animation Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              placeholder="Describe how the image should move (e.g., 'The leaves rustle in the wind', 'Cinematic slow motion pan')..."
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 min-h-[100px] text-sm resize-none placeholder:text-slate-400 transition-colors ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>3. Output Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAspectRatio(AspectRatio.LANDSCAPE)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  aspectRatio === AspectRatio.LANDSCAPE
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : (isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-rose-500' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300')
                }`}
                disabled={isGenerating}
              >
                <div className="w-6 h-4 border-2 border-current rounded-sm"></div>
                Landscape (16:9)
              </button>
              <button
                onClick={() => setAspectRatio(AspectRatio.PORTRAIT)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  aspectRatio === AspectRatio.PORTRAIT
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : (isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-rose-500' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300')
                }`}
                disabled={isGenerating}
              >
                <div className="w-4 h-6 border-2 border-current rounded-sm"></div>
                Portrait (9:16)
              </button>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={handleGenerate}
            disabled={!imageFile || isGenerating}
            className="w-full p-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader size={20} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Film size={20} />
                <span>Generate Video</span>
              </>
            )}
          </button>

          {isGenerating && (
              <p className="text-center text-xs text-slate-500 animate-pulse">{progressMessage}</p>
          )}

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm border ${
                isDarkMode ? 'bg-red-900/30 text-red-200 border-red-800' : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="bg-slate-950 rounded-2xl p-1 flex items-center justify-center min-h-[400px] relative overflow-hidden border border-slate-800">
          {resultVideo ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <video 
                src={resultVideo} 
                controls 
                autoPlay 
                loop 
                className="max-w-full max-h-full rounded-xl shadow-2xl"
              />
              <a 
                href={resultVideo} 
                download 
                className="mt-4 text-white/80 hover:text-white text-sm underline flex items-center gap-1"
                target="_blank"
                rel="noreferrer"
              >
                Open in new tab
              </a>
            </div>
          ) : (
            <div className="text-center p-8">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                   <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-4 border-rose-500/30 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-rose-500 rounded-full border-t-transparent animate-spin"></div>
                   </div>
                   <p className="text-slate-400 text-sm font-medium">Creating magic...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-600">
                  <Play size={48} className="opacity-20" />
                  <p className="font-medium text-slate-500">Your masterpiece will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className={`mt-8 border-t pt-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
         <p className="text-xs text-slate-400 text-center">
            Powered by <strong>Veo</strong>. Make sure you have enabled the API Key with valid billing settings in Google AI Studio.
            <br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">Billing Documentation</a>
         </p>
      </div>
    </div>
  );
};