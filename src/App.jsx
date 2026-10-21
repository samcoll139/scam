import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Sun, Moon, Settings as SettingsIcon, AlertTriangle, HelpCircle, RefreshCcw } from 'lucide-react';

import VoiceAssistant from './components/VoiceAssistant';
import ChatHistory from './components/ChatHistory';
import Settings from './components/Settings';

const API_BASE = 'http://localhost:5000';

export default function App() {
  // Session ID management (unique session per tab session)
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem('tamil_voice_session');
    if (saved) return saved;
    const newId = `session_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('tamil_voice_session', newId);
    return newId;
  });

  // Application States
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Settings & Theme
  const [theme, setTheme] = useState('dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    voice_gender: 'female',
    speech_rate: '+0%',
    theme: 'dark',
    wake_word_enabled: false
  });
  const [apiStatus, setApiStatus] = useState(null);

  // Audio References
  const [currentlyPlayingUrl, setCurrentlyPlayingUrl] = useState(null);
  const activeAudioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // Load and apply initial configuration
  useEffect(() => {
    // Check local storage for theme
    const savedTheme = localStorage.getItem('tamil_voice_theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    pingServer();
    fetchHistory();
    fetchBackendSettings();
  }, [sessionId]);

  // Ping Flask backend to confirm status
  const pingServer = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (res.ok) {
        const data = await res.json();
        setApiStatus(data);
        setErrorMessage("");
      } else {
        setApiStatus(null);
      }
    } catch (err) {
      console.error("Backend offline:", err);
      setApiStatus(null);
      setErrorMessage("சர்வர் ஆஃப்லைனில் உள்ளது. பிளாஸ்க் (Flask) சர்வர் இயங்குகிறதா என பார்க்கவும்.");
    }
  };

  // Retrieve chat history
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/history?session_id=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        // Standardize relative audio urls to absolute API urls
        const formatted = data.map(msg => ({
          ...msg,
          audio_url: msg.audio_path ? `${API_BASE}${msg.audio_path}` : null
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  // Fetch backend voice configurations
  const fetchBackendSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to load backend settings:", err);
    }
  };

  // Update Settings
  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Save to backend
    try {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error("Failed to save settings on backend:", err);
    }
  };

  // Toggle Dark/Light Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('tamil_voice_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateSettings({ theme: nextTheme });
  };

  // Stop any playing TTS audio
  const stopAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
      setCurrentlyPlayingUrl(null);
      if (status === 'speaking') {
        setStatus('idle');
      }
    }
  };

  // Play assistant voice audio file
  const playAudio = (audioUrl) => {
    // If the selected audio is already playing, clicking stops it
    if (currentlyPlayingUrl === audioUrl) {
      stopAudio();
      return;
    }

    stopAudio(); // Stop any existing playing speech
    setStatus('speaking');
    setCurrentlyPlayingUrl(audioUrl);

    const audio = new Audio(audioUrl);
    activeAudioRef.current = audio;
    
    audio.play().catch(err => {
      console.error("Audio playback error:", err);
      stopAudio();
      setErrorMessage("ஆடியோவை இயக்க முடியவில்லை.");
    });

    audio.onended = () => {
      setStatus('idle');
      setCurrentlyPlayingUrl(null);
      activeAudioRef.current = null;
    };
  };

  // Clear chat history
  const clearHistory = async () => {
    stopAudio();
    if (!window.confirm("உரையாடல் வரலாற்றை முழுமையாக அழிக்க வேண்டுமா?")) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/history/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      if (res.ok) {
        setMessages([]);
        setErrorMessage("");
      }
    } catch (err) {
      setErrorMessage("வரலாற்றை அழிக்க முடியவில்லை.");
    }
  };

  // Start Voice input (either Web Speech API or MediaRecorder fallback)
  const startRecording = async () => {
    stopAudio();
    setErrorMessage("");
    audioChunksRef.current = [];

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      console.log("Starting Web Speech API for Tamil...");
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.lang = 'ta-IN'; // Tamil (India)
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = () => {
          setStatus('listening');
          setErrorMessage("");
        };

        recognition.onresult = async (event) => {
          const speechResult = event.results[0][0].transcript;
          console.log("Web Speech API transcription result:", speechResult);
          if (speechResult && speechResult.trim() !== "") {
            await handleTranscribedText(speechResult);
          } else {
            setErrorMessage("மன்னிக்கவும், நீங்கள் பேசியது எதுவும் கேட்கவில்லை.");
            setStatus('idle');
          }
        };

        recognition.onerror = (event) => {
          console.error("Web Speech API error:", event.error);
          if (event.error === 'no-speech') {
            setErrorMessage("நீங்கள் பேசியது எதுவும் கேட்கவில்லை.");
            setStatus('idle');
          } else {
            // Fall back to standard MediaRecorder (Whisper) on speechrecognition issues
            console.log("Speech recognition failed. Falling back to MediaRecorder upload...");
            startFallbackMediaRecorder();
          }
        };

        recognition.onend = () => {
          // If still in listening status and didn't move to processing or speaking
          setStatus(prev => prev === 'listening' ? 'idle' : prev);
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn("SpeechRecognition start failed, using fallback:", err);
      }
    }

    // Fallback: Use standard media recorder if speech API is unavailable
    startFallbackMediaRecorder();
  };

  // Fallback MediaRecorder setup
  const startFallbackMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        processRecordedAudio(audioBlob);
      };

      recorder.start();
      setStatus('listening');
    } catch (err) {
      console.error("Mic Permission error:", err);
      setErrorMessage("மைக் அனுமதியை பெற முடியவில்லை. பிரவுசர் அனுமதிகளை சரிபார்க்கவும்.");
      setStatus('idle');
    }
  };

  // Stop Recording manually
  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Helper to handle raw text from voice input
  const handleTranscribedText = async (transcribedText) => {
    setStatus('processing');
    setErrorMessage("");

    // Add user message to state
    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: transcribedText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    // Get Gemini Response & Trigger TTS
    setIsGenerating(true);
    try {
      const responseRes = await fetch(`${API_BASE}/api/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          text: transcribedText
        })
      });

      if (!responseRes.ok) {
        throw new Error("பதில் உருவாக்க முடியவில்லை (Gemini Error).");
      }

      const responseData = await responseRes.json();
      const aiText = responseData.text;
      const messageId = responseData.message_id;

      // Add AI response to log
      const aiMsg = {
        id: messageId || Date.now() + 1,
        role: 'assistant',
        text: aiText,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsGenerating(false);

      // Call TTS to speak response
      setStatus('speaking');
      const ttsRes = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiText,
          gender: settings.voice_gender,
          message_id: messageId,
          session_id: sessionId
        })
      });

      if (!ttsRes.ok) {
        throw new Error("குரல் தொகுப்பு பிழை (TTS Error).");
      }

      const ttsData = await ttsRes.json();
      const absoluteAudioUrl = `${API_BASE}${ttsData.audio_url}`;

      // Update message with generated audio
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audio_url: absoluteAudioUrl } : m));

      // Play the audio
      playAudio(absoluteAudioUrl);

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "பதில் உருவாக்குவதில் பிழை.");
      setIsGenerating(false);
      setStatus('idle');
    }
  };

  // Upload audio to server, transcribe, generate Gemini answer, and play TTS
  const processRecordedAudio = async (audioBlob) => {
    setStatus('processing');
    setErrorMessage("");

    // Step 1: Transcribe user audio
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');

    let transcribedText = "";
    try {
      const transcribeRes = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (!transcribeRes.ok) {
        throw new Error("பேச்சை உரையாக்க முடியவில்லை (Whisper Error).");
      }

      const transcribeData = await transcribeRes.json();
      transcribedText = transcribeData.text;

      if (!transcribedText || transcribedText.trim() === "") {
        throw new Error("மன்னிக்கவும், நீங்கள் பேசியது எதுவும் கேட்கவில்லை.");
      }

      // Process the text
      await handleTranscribedText(transcribedText);

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "செயலாக்கம் தோல்வியடைந்தது.");
      setStatus('idle');
      return;
    }
  };

  // Summarize Text Document
  const handleSummarizeText = async (file) => {
    setIsSummarizing(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Render local notification of upload
      const uploadUserMsg = {
        id: Date.now(),
        role: 'user',
        text: `கோப்பு பதிவேற்றப்பட்டது: ${file.name} (சுருக்கம் செய்யப்படுகிறது)`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, uploadUserMsg]);

      // Call Flask
      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error("ஆவணத்தைச் சுருக்க முடியவில்லை.");
      }

      const data = await res.json();
      const summaryText = data.summary;

      // Add AI summary to database & state (using normal respond flow)
      const aiResponseRes = await fetch(`${API_BASE}/api/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          text: `கீழே உள்ள உரைக்கு தமிழ் சுருக்கம் தயார்: \n${summaryText}`
        })
      });

      if (aiResponseRes.ok) {
        const responseData = await aiResponseRes.json();
        // Pull updated history
        fetchHistory();
      }

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "சுருக்கத் தோல்வி.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      
      {/* Header Navbar */}
      <header className="flex justify-between items-center px-6 py-4 bg-slate-950/80 border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-900/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              தமிழ் குரல் AI உதவியாளர்
            </h1>
            <p className="text-[10px] text-rose-400 font-semibold tracking-wider uppercase">Tamil Voice AI Assistant</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          
          {/* Server Connection Retrying Status */}
          {!apiStatus && (
            <button 
              onClick={pingServer}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-medium hover:bg-rose-500/20 transition-all"
              title="மீண்டும் இணைக்க முயல்"
            >
              <RefreshCcw className="w-3 h-3 animate-spin" />
              <span>ஆஃப்லைன்</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="வண்ணப் பின்னணி மாற்று"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="அமைப்புகள்"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Grid Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Side: Circular Avatar & Recorder Interface */}
        <section className="lg:col-span-5 h-[400px] lg:h-full min-h-[380px]">
          <VoiceAssistant 
            status={status}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            errorMessage={errorMessage}
          />
        </section>

        {/* Right Side: Conversation History and Document Summarizer */}
        <section className="lg:col-span-7 h-[450px] lg:h-full">
          <ChatHistory 
            messages={messages}
            onPlayAudio={playAudio}
            currentlyPlayingUrl={currentlyPlayingUrl}
            onClearHistory={clearHistory}
            isGenerating={isGenerating}
            onSummarizeText={handleSummarizeText}
            isSummarizing={isSummarizing}
          />
        </section>
      </main>

      {/* Settings Dialog Overlay Modal */}
      <Settings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        apiStatus={apiStatus}
      />
    </div>
  );
}
