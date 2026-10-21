import React from 'react';
import { Settings as SettingsIcon, X, Sliders, Volume2, UserCheck, ShieldAlert, MonitorPlay, KeyRound } from 'lucide-react';

export default function Settings({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings, 
  apiStatus 
}) {
  if (!isOpen) return null;

  const handleGenderChange = (e) => {
    onUpdateSettings({ voice_gender: e.target.value });
  };

  const handleRateChange = (e) => {
    onUpdateSettings({ speech_rate: e.target.value });
  };

  const handleWakeWordChange = (e) => {
    onUpdateSettings({ wake_word_enabled: e.target.checked });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-lg">
            <SettingsIcon className="w-5 h-5" />
            <span>அமைப்புகள் (Settings)</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* TTS Voice Profile */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <UserCheck className="w-4 h-4 text-rose-400" />
              குரல் வகை (Voice Profile)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                settings.voice_gender === 'female' 
                  ? 'bg-rose-500/10 border-rose-500 text-rose-300' 
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80'
              }`}>
                <input 
                  type="radio" 
                  name="gender" 
                  value="female" 
                  checked={settings.voice_gender === 'female'}
                  onChange={handleGenderChange}
                  className="sr-only" 
                />
                பெண் குரல் (Female Voice)
              </label>
              
              <label className={`flex items-center justify-center p-3 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                settings.voice_gender === 'male' 
                  ? 'bg-rose-500/10 border-rose-500 text-rose-300' 
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80'
              }`}>
                <input 
                  type="radio" 
                  name="gender" 
                  value="male" 
                  checked={settings.voice_gender === 'male'}
                  onChange={handleGenderChange}
                  className="sr-only" 
                />
                ஆண் குரல் (Male Voice)
              </label>
            </div>
          </div>

          {/* Speech Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-slate-300">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-400" />
                குரல் வேகம் (Speech Rate)
              </span>
              <span className="text-xs text-rose-400">{settings.speech_rate === '+0%' ? 'சாதாரண (Normal)' : settings.speech_rate}</span>
            </div>
            <select
              value={settings.speech_rate}
              onChange={handleRateChange}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-rose-500"
            >
              <option value="-20%">மெதுவாக (-20%)</option>
              <option value="-10%">சற்று மெதுவாக (-10%)</option>
              <option value="+0%">சாதாரண வேகம் (Normal)</option>
              <option value="+10%">சற்று வேகமாக (+10%)</option>
              <option value="+20%">வேகமாக (+20%)</option>
            </select>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <KeyRound className="w-4 h-4 text-rose-400" />
              Gemini API Key
            </label>
            <input
              type="password"
              value={settings.gemini_api_key || ""}
              onChange={(e) => onUpdateSettings({ gemini_api_key: e.target.value })}
              placeholder="உங்களது Gemini API Key-ஐ உள்ளிடவும்"
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-rose-500"
            />
            <p className="text-[10px] text-slate-400">
              குறிப்பு: உங்கள் விசை உள்ளூரில் உள்ள database/settings.json கோப்பில் பாதுகாப்பாக சேமிக்கப்படும்.
            </p>
          </div>

          {/* Wake Word Option */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="space-y-1 pr-4">
              <h4 className="text-sm font-semibold text-slate-200">
                Wake Word Activation
              </h4>
              <p className="text-xs text-slate-400">
                say <strong className="text-rose-400">"வணக்கம் AI"</strong> to automatically trigger voice response.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.wake_word_enabled}
                onChange={handleWakeWordChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>

          {/* Backend API Status Diagnostics */}
          <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800 space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <MonitorPlay className="w-4 h-4 text-emerald-400" />
              API Diagnostics
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                Server: <span className="font-semibold text-slate-100">{apiStatus ? 'இணைக்கப்பட்டது' : 'பிழை'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${apiStatus?.gemini_api === 'Configured' ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
                Gemini API: <span className="font-semibold text-slate-100">{apiStatus?.gemini_api || 'துண்டிக்கப்பட்டது'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                Whisper: <span className="font-semibold text-slate-100">Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                Edge TTS: <span className="font-semibold text-slate-100">Ready</span>
              </div>
            </div>
            
            {apiStatus?.gemini_api === 'Missing' && (
              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-yellow-400" />
                <span>
                  <strong>Gemini API Key missing!</strong> Please add GEMINI_API_KEY in the backend .env file.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm transition-all"
          >
            சேமி (Save)
          </button>
        </div>
      </div>
    </div>
  );
}
