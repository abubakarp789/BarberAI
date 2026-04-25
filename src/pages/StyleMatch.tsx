import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Scissors, User as UserIcon, Loader2, ArrowRight, Check } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function StyleMatch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [preferences, setPreferences] = useState({
    faceShape: '',
    hairType: '',
    maintenance: '',
    styleVibe: ''
  });

  const handleSelect = (key: keyof typeof preferences, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const getRecommendations = async () => {
    if (!preferences.faceShape || !preferences.hairType || !preferences.maintenance || !preferences.styleVibe) {
      return toast.error("Please answer all questions");
    }

    try {
      setLoading(true);
      // Call the server endpoint for Gemini since we should secure the API key
      const response = await fetch('/api/style-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response");
      }
      
      const data = await response.json();
      
      // Attempt to parse if it's a string, or it might already be JSON
      let parsed = data.result;
      if (typeof parsed === 'string') {
        const cleaned = parsed.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }
      
      setResult(parsed);
      setStep(5);
    } catch (error) {
      console.error(error);
      toast.error('Failed to get style recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const attachToBooking = () => {
    // We can store this in localStorage and retrieve it on the booking page
    localStorage.setItem('styleMatchBrief', JSON.stringify({
      faceShape: preferences.faceShape,
      recommendedStyle: result.recommendedStyle,
      styleDescription: result.description,
      barberInstructions: result.barberInstructions
    }));
    toast.success("Style Brief Saved!");
    navigate('/explore');
  };

  const StepIndicator = () => (
    <div className="flex justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`h-2 rounded-full transition-all ${step === i ? 'w-8 bg-[#e94560]' : step > i ? 'w-4 bg-green-500' : 'w-4 bg-white/10'}`}></div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#e94560] to-purple-600 mb-4 shadow-[0_0_30px_rgba(233,69,96,0.3)]">
          <Sparkles size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">AI Style Match</h1>
        <p className="text-[#a0a0b0] mt-2">Find the perfect haircut based on your specific features.</p>
      </div>

      {step < 5 && <StepIndicator />}

      <div className="bg-[#16213e] p-6 sm:p-10 rounded-3xl border border-white/5 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-[#16213e]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 size={48} className="text-[#e94560] animate-spin mb-4" />
            <p className="font-bold text-lg animate-pulse text-[#eaeaea]">Analyzing your profile...</p>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-bold mb-6 text-center">What is your face shape?</h2>
            <div className="grid grid-cols-2 gap-4">
              {['Oval', 'Square', 'Round', 'Diamond', 'Heart', 'Oblong'].map(shape => (
                <button
                  key={shape}
                  onClick={() => handleSelect('faceShape', shape)}
                  className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${preferences.faceShape === shape ? 'border-[#e94560] bg-[#e94560]/10 text-white' : 'border-white/5 bg-black/20 text-[#a0a0b0] hover:bg-white/5'}`}
                >
                  {shape}
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button disabled={!preferences.faceShape} onClick={() => setStep(2)} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold disabled:opacity-50 transition-all hover:bg-gray-200">
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-bold mb-6 text-center">What is your hair type?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'Straight', desc: 'Lays flat, smooth' },
                { id: 'Wavy', desc: 'Loose ' },
                { id: 'Curly', desc: 'Coiled, lots of volume' },
                { id: 'Thinning', desc: 'Receding or light density' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => handleSelect('hairType', type.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${preferences.hairType === type.id ? 'border-[#e94560] bg-[#e94560]/10' : 'border-white/5 bg-black/20 hover:bg-white/5'}`}
                >
                  <div className={`font-bold ${preferences.hairType === type.id ? 'text-white' : 'text-[#eaeaea]'}`}>{type.id}</div>
                  <div className="text-sm text-[#a0a0b0] mt-1">{type.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(1)} className="text-[#a0a0b0] hover:text-white font-medium px-4 py-2">Back</button>
              <button disabled={!preferences.hairType} onClick={() => setStep(3)} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold disabled:opacity-50 transition-all hover:bg-gray-200">
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-bold mb-6 text-center">How much time do you spend styling?</h2>
            <div className="flex flex-col gap-3">
              {[
                { id: 'Low', desc: 'Wash and go, minimal products (1-2 mins)' },
                { id: 'Medium', desc: 'A quick blow dry or some pomade (3-5 mins)' },
                { id: 'High', desc: 'Full styling routine, precise hold (5+ mins)' }
              ].map(level => (
                <button
                  key={level.id}
                  onClick={() => handleSelect('maintenance', level.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${preferences.maintenance === level.id ? 'border-[#e94560] bg-[#e94560]/10' : 'border-white/5 bg-black/20 hover:bg-white/5'}`}
                >
                  <div className={`font-bold ${preferences.maintenance === level.id ? 'text-white' : 'text-[#eaeaea]'}`}>{level.id} Maintenance</div>
                  <div className="text-sm text-[#a0a0b0] mt-1">{level.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(2)} className="text-[#a0a0b0] hover:text-white font-medium px-4 py-2">Back</button>
              <button disabled={!preferences.maintenance} onClick={() => setStep(4)} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold disabled:opacity-50 transition-all hover:bg-gray-200">
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-bold mb-6 text-center">What's your desired vibe?</h2>
            <div className="grid grid-cols-2 gap-4">
              {['Professional', 'Trendy/Modern', 'Classic', 'Edgy', 'Sporty'].map(vibe => (
                <button
                  key={vibe}
                  onClick={() => handleSelect('styleVibe', vibe)}
                  className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${preferences.styleVibe === vibe ? 'border-[#e94560] bg-[#e94560]/10 text-white' : 'border-white/5 bg-black/20 text-[#a0a0b0] hover:bg-white/5'}`}
                >
                  {vibe}
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(3)} className="text-[#a0a0b0] hover:text-white font-medium px-4 py-2">Back</button>
              <button disabled={!preferences.styleVibe} onClick={getRecommendations} className="flex items-center gap-2 bg-[#e94560] hover:bg-[#ff5c77] text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(233,69,96,0.3)] hover:-translate-y-1">
                Find My Style <Sparkles size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 5 && result && (
          <div className="animate-in zoom-in-95 duration-500">
            <div className="text-center mb-8">
              <div className="inline-block bg-green-500/20 text-green-500 p-2 rounded-full mb-4">
                <Check size={32} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Your Perfect Match</h2>
              <p className="text-[#a0a0b0]">Based on your {preferences.faceShape} face shape and {preferences.hairType} hair.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#1a1a2e] to-black rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 text-white/5">
                  <Scissors size={120} />
                </div>
                <h3 className="text-2xl font-bold text-[#e94560] mb-3 relative z-10">{result.recommendedStyle}</h3>
                <p className="text-[#eaeaea] leading-relaxed relative z-10">{result.description}</p>
              </div>

              <div className="bg-black/30 rounded-2xl p-6 border border-white/5">
                <h4 className="text-sm uppercase tracking-wider font-bold text-[#a0a0b0] mb-3 flex items-center gap-2">
                  <Scissors size={16} /> Barber Instructions
                </h4>
                <p className="text-[#c0c0d0] font-mono text-sm leading-relaxed whitespace-pre-wrap">{result.barberInstructions}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button onClick={attachToBooking} className="flex-1 flex justify-center items-center gap-2 bg-[#e94560] hover:bg-[#ff5c77] text-white px-6 py-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(233,69,96,0.3)] hover:-translate-y-1">
                Save & Find Barber
              </button>
              <button onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-xl font-bold transition-all border border-white/10 text-center">
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
