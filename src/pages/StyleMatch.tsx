import { useState, useRef } from 'react';
import { Sparkles, Upload, Camera, Loader2, ArrowRight, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Recommendation {
  styleName: string;
  description: string;
  whySuited: string;
  referenceKeyword: string;
}

interface AnalysisResult {
  faceShape: string;
  faceShapeDescription: string;
  recommendations: Recommendation[];
  error?: string;
}

export default function StyleMatch() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Recommendation | null>(null);
  const [saved, setSaved] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG or PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      // Extract base64 data without the data:image/xxx;base64, prefix
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      // Reset previous results
      setResult(null);
      setSelectedStyle(null);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFace = async () => {
    if (!imageBase64) return;

    try {
      setLoading(true);
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Analysis failed');
      }

      const data = await response.json();

      let parsed = data.result;
      if (typeof parsed === 'string') {
        const cleaned = parsed.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      if (parsed.error) {
        toast.error(parsed.error);
        return;
      }

      setResult(parsed);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to analyze face. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = (rec: Recommendation) => {
    setSelectedStyle(rec);
    const brief = {
      faceShape: result?.faceShape,
      recommendedStyle: rec.styleName,
      styleDescription: rec.description,
    };
    localStorage.setItem('activeBrief', JSON.stringify(brief));
    setSaved(true);
    toast.success('Style saved! Attach it to your next booking.');
  };

  const resetAll = () => {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setSelectedStyle(null);
    setSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#e94560] to-purple-600 mb-4 shadow-[0_0_30px_rgba(233,69,96,0.3)]">
          <Sparkles size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">AI Style Match</h1>
        <p className="text-[#a0a0b0] mt-2">
          Upload a photo and let AI find the perfect hairstyle for your face shape.
        </p>
      </div>

      {/* Upload Section */}
      {!result && (
        <div className="bg-[#16213e] p-6 sm:p-10 rounded-3xl border border-white/5 relative overflow-hidden animate-fade-in">
          {loading && (
            <div className="absolute inset-0 bg-[#16213e]/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-[#e94560]/20 border-t-[#e94560] animate-spin" />
                <Sparkles className="absolute inset-0 m-auto text-[#e94560]" size={24} />
              </div>
              <p className="font-bold text-lg mt-6 animate-pulse text-[#eaeaea]">Analyzing your face shape...</p>
              <p className="text-sm text-[#a0a0b0] mt-2">This may take a few seconds</p>
            </div>
          )}

          <div className="flex flex-col items-center">
            {/* Circular preview */}
            <div
              className="w-48 h-48 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center overflow-hidden mb-6 relative group cursor-pointer hover:border-[#e94560]/50 transition-colors bg-black/20"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={32} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-[#a0a0b0]">
                  <Camera size={48} className="mb-2 opacity-50" />
                  <span className="text-xs font-medium">Click to upload</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all border border-white/10 mb-4"
            >
              <Upload size={18} />
              {imagePreview ? 'Change Photo' : 'Upload Your Photo'}
            </button>

            <p className="text-xs text-[#a0a0b0] text-center mb-8 max-w-sm">
              Upload a clear, front-facing photo for best results. JPG or PNG, max 10MB.
            </p>

            <button
              onClick={analyzeFace}
              disabled={!imageBase64 || loading}
              className="flex items-center gap-2 bg-[#e94560] hover:bg-[#ff5c77] text-white px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(233,69,96,0.3)] hover:-translate-y-1 disabled:hover:translate-y-0 disabled:shadow-none"
            >
              <Sparkles size={20} />
              Analyze My Face
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && !saved && (
        <div className="space-y-6 animate-fade-in">
          {/* Face Shape Badge */}
          <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e94560]/10 border border-[#e94560]/30 text-[#e94560] font-bold text-lg mb-3">
              ✦ {result.faceShape} Face Shape
            </div>
            <p className="text-[#a0a0b0] max-w-lg mx-auto">{result.faceShapeDescription}</p>

            {/* Photo thumbnail */}
            {imagePreview && (
              <div className="mt-4 flex justify-center">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10">
                  <img src={imagePreview} alt="Your face" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Recommendation Cards */}
          <div>
            <h2 className="text-xl font-bold text-[#eaeaea] mb-4 text-center">Recommended Styles for You</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.recommendations?.map((rec, index) => (
                <div
                  key={index}
                  className={`bg-[#16213e] p-6 rounded-2xl border transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] ${
                    selectedStyle?.styleName === rec.styleName
                      ? 'border-[#e94560] shadow-[0_0_15px_rgba(233,69,96,0.2)]'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <h3 className="text-lg font-bold text-white mb-2">{rec.styleName}</h3>
                  <p className="text-sm text-[#c0c0d0] leading-relaxed mb-3">{rec.description}</p>
                  <div className="inline-block px-2 py-1 rounded bg-[#e94560]/10 border border-[#e94560]/20 text-xs font-medium text-[#e94560] mb-4">
                    {rec.whySuited}
                  </div>
                  <button
                    onClick={() => selectStyle(rec)}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all bg-white/5 hover:bg-[#e94560] hover:text-white text-[#eaeaea] border border-white/10 hover:border-[#e94560]"
                  >
                    <Check size={16} />
                    Select This Style
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Try Again */}
          <div className="text-center">
            <button
              onClick={resetAll}
              className="text-[#a0a0b0] hover:text-white text-sm font-medium transition-colors flex items-center gap-1 mx-auto"
            >
              <X size={14} /> Upload a different photo
            </button>
          </div>
        </div>
      )}

      {/* Saved / Success State */}
      {saved && selectedStyle && (
        <div className="animate-scale-in">
          <div className="bg-gradient-to-br from-[#16213e] to-[#e94560]/10 p-8 sm:p-10 rounded-3xl border border-[#e94560]/30 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <Check size={32} className="text-green-500" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Style Saved!</h2>
            <p className="text-[#a0a0b0] mb-6">Attach it to your next booking so your barber knows exactly what you want.</p>

            <div className="bg-black/20 p-5 rounded-2xl border border-white/5 text-left mb-8 max-w-md mx-auto">
              <div className="inline-flex items-center px-2 py-1 rounded bg-[#e94560]/10 border border-[#e94560]/20 text-xs font-bold text-[#e94560] uppercase tracking-wider mb-2">
                ✦ {result?.faceShape} Face
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{selectedStyle.styleName}</h3>
              <p className="text-sm text-[#a0a0b0]">{selectedStyle.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/explore')}
                className="flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#ff5c77] text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(233,69,96,0.3)] hover:-translate-y-1"
              >
                Book with This Style <ArrowRight size={18} />
              </button>
              <button
                onClick={resetAll}
                className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-bold transition-all border border-white/10"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
