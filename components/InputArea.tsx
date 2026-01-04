
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface InputAreaProps {
  value: string;
  onChange: (val: string | ((prev: string) => string)) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ value, onChange, onSubmit, isLoading }) => {
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Helper functions for audio encoding/decoding as required by Gemini Live API
  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function createBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      // Clamping to avoid overflow and internal server errors
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  const stopListening = () => {
    setIsListening(false);
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    sessionPromiseRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopListening();
  }, []);

  const startListening = async () => {
    try {
      setIsListening(true);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (!audioContextRef.current || !streamRef.current) return;
            const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
            const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              if (sessionPromiseRef.current) {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                }).catch(() => {});
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text) {
                onChange(prev => {
                  const currentStr = typeof prev === 'string' ? prev : '';
                  const space = currentStr && !currentStr.endsWith(' ') ? ' ' : '';
                  return currentStr + space + text;
                });
              }
            }
          },
          onerror: (e) => {
            console.error('Gemini Live API Error:', e);
            stopListening();
          },
          onclose: () => {
            stopListening();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are a transcription assistant. Only transcribe the user speech into Romanized Hindi (Hinglish). Do not talk back.',
        },
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error('Connection failed:', err);
      stopListening();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Enter Romanized Hindi</label>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">Example: "Namaste" or "Aap kaise hain?"</span>
      </div>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type Hinglish text or use the mic..."
          className="w-full h-48 p-5 text-lg leading-relaxed border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-0 transition-all resize-none bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 overflow-y-auto"
          style={{ fontSize: '1.125rem', minHeight: '12rem' }}
          disabled={isLoading}
        />
        
        {isListening && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full animate-pulse border border-red-500/20">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Live Voice</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {value && !isLoading && !isListening && (
            <button
              onClick={handleClear}
              className="flex-1 sm:flex-none px-4 py-3.5 rounded-xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear</span>
            </button>
          )}

          <button
            onClick={handleMicClick}
            disabled={isLoading}
            className={`p-3.5 rounded-xl transition-all flex items-center justify-center shadow-lg flex-1 sm:flex-none
              ${isListening 
                ? 'bg-red-500 text-white shadow-red-200 dark:shadow-none animate-pulse ring-4 ring-red-500/20' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500'}`}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={onSubmit}
          disabled={isLoading || !value.trim() || isListening}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center space-x-3 
            ${isLoading || !value.trim() || isListening
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:transform active:scale-95 shadow-indigo-200/50 dark:shadow-none'}`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Converting...</span>
            </>
          ) : (
            <>
              <span>Convert to Hindi</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputArea;
