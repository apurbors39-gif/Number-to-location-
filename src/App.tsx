import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Phone, Signal, Shield, Info, History, Trash2, Crosshair } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Map } from './components/Map';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface TrackingResult {
  number: string;
  location: string;
  district: string;
  division: string;
  operator: string;
  signal: string;
  timestamp: string;
}

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [history, setHistory] = useState<TrackingResult[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedHistory = localStorage.getItem('tracking_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (newResult: TrackingResult) => {
    const updatedHistory = [newResult, ...history].slice(0, 5);
    setHistory(updatedHistory);
    localStorage.setItem('tracking_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tracking_history');
  };

  const validateBDNumber = (num: string) => {
    const cleanNum = num.replace(/\s+/g, '');
    const bdRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    return bdRegex.test(cleanNum);
  };

  const getOperator = (num: string) => {
    const prefix = num.substring(num.length - 11, num.length - 8);
    switch (prefix) {
      case '017':
      case '013': return 'Grameenphone';
      case '018': return 'Robi';
      case '019':
      case '014': return 'Banglalink';
      case '015': return 'Teletalk';
      case '016': return 'Airtel';
      default: return 'Unknown';
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateBDNumber(phoneNumber)) {
      setError('অনুগ্রহ করে একটি সঠিক বাংলাদেশি নাম্বার দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    setIsTracking(true);
    setResult(null);

    try {
      // Simulate network delay for "tracking" feel
      await new Promise(resolve => setTimeout(resolve, 3000));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a realistic but fake Bangladeshi address for a phone number tracking app. 
        The address should include a specific area, road, and district in Bangladesh.
        Format the response as JSON with keys: area, district, division.
        Example: { "area": "Road 12, Sector 4, Uttara", "district": "Dhaka", "division": "Dhaka" }`,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || '{}');
      
      const newResult: TrackingResult = {
        number: phoneNumber,
        location: data.area || "Unknown Area",
        district: data.district || "Unknown District",
        division: data.division || "Unknown Division",
        operator: getOperator(phoneNumber),
        signal: `${Math.floor(Math.random() * 40) + 60}%`,
        timestamp: new Date().toLocaleString('bn-BD'),
      };

      setResult(newResult);
      saveToHistory(newResult);
    } catch (err) {
      console.error(err);
      setError('সার্ভার ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full text-center mb-12"
      >
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">BD Secure Tracker v2.0</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          নাম্বার লোকেশন ট্র্যাকার
        </h1>
        <p className="text-white/40 max-w-md mx-auto text-sm">
          যেকোনো বাংলাদেশি মোবাইল নাম্বারের বর্তমান সম্ভাব্য অবস্থান এবং নেটওয়ার্ক তথ্য খুঁজুন।
        </p>
      </motion.header>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Results */}
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-panel p-6">
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/10"
                />
              </div>
              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs px-2"
                >
                  {error}
                </motion.p>
              )}
              <button
                disabled={isTracking}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                {isTracking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>ট্র্যাকিং হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>লোকেশন খুঁজুন</span>
                  </>
                )}
              </button>
            </form>
          </section>

          <AnimatePresence mode="wait">
            {result && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-6 space-y-6 overflow-hidden relative"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-mono text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <Crosshair className="w-4 h-4" />
                    Target Identified
                  </h2>
                  <span className="text-[10px] text-white/30">{result.timestamp}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase text-white/40 font-mono">Operator</p>
                    <p className="font-medium text-emerald-400">{result.operator}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase text-white/40 font-mono">Signal Strength</p>
                    <div className="flex items-center gap-2">
                      <Signal className="w-4 h-4 text-emerald-500" />
                      <p className="font-medium">{result.signal}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                    <div>
                      <p className="text-xs text-white/40 mb-1">Current Location (Estimated)</p>
                      <p className="text-lg font-semibold leading-tight">{result.location}</p>
                      <p className="text-sm text-white/60">{result.district}, {result.division}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-white/20 font-mono bg-white/5 p-2 rounded-lg">
                  <Info className="w-3 h-3" />
                  <span>Note: This data is simulated for demonstration purposes.</span>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* History */}
          {history.length > 0 && (
            <section className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Recent Scans
                </h3>
                <button 
                  onClick={clearHistory}
                  className="text-white/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors cursor-pointer group"
                    onClick={() => setResult(item)}
                  >
                    <div>
                      <p className="text-sm font-medium group-hover:text-emerald-400 transition-colors">{item.number}</p>
                      <p className="text-[10px] text-white/40">{item.district}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/20">{item.timestamp.split(' ')[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Visual Map */}
        <div className="lg:col-span-7 h-[400px] lg:h-auto min-h-[500px]">
          <Map 
            isTracking={isTracking} 
            location={result ? { lat: 23, lng: 90, name: result.location, district: result.district } : undefined} 
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-white/5 w-full text-center">
        <p className="text-white/20 text-xs font-mono">
          &copy; {new Date().getFullYear()} BD Number Tracker System. For educational use only.
        </p>
      </footer>
    </div>
  );
}
