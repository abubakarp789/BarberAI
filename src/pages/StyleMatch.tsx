import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ArrowRight, Camera, Check, RefreshCcw, Sparkles, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';

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

interface SavedStyleMatch {
  userId: string;
  imageDataUrl: string;
  faceShape: string;
  faceShapeDescription: string;
  recommendations: Recommendation[];
  selectedStyleName?: string | null;
  selectedStyleDescription?: string | null;
}

const MAX_IMAGE_DIMENSION = 768;
const JPEG_QUALITY = 0.86;

function dataUrlToBase64(dataUrl: string) {
  return dataUrl.split(',')[1] ?? '';
}

async function convertFileToJpegDataUrl(file: File) {
  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to process image'));
    img.src = fileDataUrl;
  });

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Image processing is unavailable in this browser');
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export default function StyleMatch() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSavedMatch, setLoadingSavedMatch] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Recommendation | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeAction, setActiveAction] = useState<'analyze' | 'regenerate' | null>(null);

  const applySavedMatch = (savedMatch: SavedStyleMatch) => {
    const restoredResult: AnalysisResult = {
      faceShape: savedMatch.faceShape,
      faceShapeDescription: savedMatch.faceShapeDescription,
      recommendations: savedMatch.recommendations,
    };

    setImagePreview(savedMatch.imageDataUrl);
    setImageBase64(dataUrlToBase64(savedMatch.imageDataUrl));
    setResult(restoredResult);
    setSaved(false);

    if (savedMatch.selectedStyleName) {
      const restoredSelection = savedMatch.recommendations.find(
        (recommendation) => recommendation.styleName === savedMatch.selectedStyleName,
      );
      setSelectedStyle(restoredSelection ?? null);
    } else {
      setSelectedStyle(null);
    }
  };

  useEffect(() => {
    const loadSavedMatch = async () => {
      if (!user) {
        setLoadingSavedMatch(false);
        return;
      }

      try {
        const savedMatchRef = doc(db, 'styleMatches', user.uid);
        const savedMatchSnap = await getDoc(savedMatchRef);

        if (savedMatchSnap.exists()) {
          applySavedMatch(savedMatchSnap.data() as SavedStyleMatch);
        }
      } catch (error) {
        console.error('Failed to load saved style match', error);
        toast.error('Failed to load your saved style recommendations.');
      } finally {
        setLoadingSavedMatch(false);
      }
    };

    loadSavedMatch();
  }, [user]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, or WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    try {
      const normalizedDataUrl = await convertFileToJpegDataUrl(file);
      setImagePreview(normalizedDataUrl);
      setImageBase64(dataUrlToBase64(normalizedDataUrl));
      setResult(null);
      setSelectedStyle(null);
      setSaved(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process the image. Please try a different photo.');
    }
  };

  const persistMatch = async (analysis: AnalysisResult, imageDataUrl: string, selectedRecommendation?: Recommendation | null) => {
    if (!user) return;

    await setDoc(doc(db, 'styleMatches', user.uid), {
      userId: user.uid,
      imageDataUrl,
      faceShape: analysis.faceShape,
      faceShapeDescription: analysis.faceShapeDescription,
      recommendations: analysis.recommendations,
      selectedStyleName: selectedRecommendation?.styleName ?? null,
      selectedStyleDescription: selectedRecommendation?.description ?? null,
      updatedAt: serverTimestamp(),
    });
  };

  const analyzeFace = async (mode: 'analyze' | 'regenerate' = 'analyze') => {
    if (!imageBase64 || !imagePreview) return;

    try {
      setLoading(true);
      setActiveAction(mode);

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
      setSelectedStyle(null);
      setSaved(false);
      await persistMatch(parsed, imagePreview, null);
      toast.success(mode === 'regenerate' ? 'Recommendations regenerated.' : 'Recommendations saved.');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to analyze face. Please try again.');
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const selectStyle = async (recommendation: Recommendation) => {
    if (!result) return;

    setSelectedStyle(recommendation);
    const brief = {
      faceShape: result.faceShape,
      recommendedStyle: recommendation.styleName,
      styleDescription: recommendation.description,
    };

    try {
      localStorage.setItem('activeBrief', JSON.stringify(brief));
      await persistMatch(result, imagePreview!, recommendation);
      setSaved(true);
      toast.success('Style saved! Attach it to your next booking.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save this style selection.');
    }
  };

  const resetAll = () => {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setSelectedStyle(null);
    setSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loadingSavedMatch) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-[#a0a0b0]">
        Loading your saved style recommendations...
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-12">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#e94560] to-purple-600 mb-4 shadow-[0_0_30px_rgba(233,69,96,0.3)]">
          <Sparkles size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">AI Style Match</h1>
        <p className="text-[#a0a0b0] mt-2">
          Upload a photo and let AI find the perfect hairstyle for your face shape.
        </p>
      </div>

      {!result && (
        <div className="bg-[#16213e] p-6 sm:p-10 rounded-3xl border border-white/5 relative overflow-hidden animate-fade-in">
          {loading && (
            <div className="absolute inset-0 bg-[#16213e]/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-[#e94560]/20 border-t-[#e94560] animate-spin" />
                <Sparkles className="absolute inset-0 m-auto text-[#e94560]" size={24} />
              </div>
              <p className="font-bold text-lg mt-6 animate-pulse text-[#eaeaea]">
                {activeAction === 'regenerate' ? 'Refreshing your recommendations...' : 'Analyzing your face shape...'}
              </p>
              <p className="text-sm text-[#a0a0b0] mt-2">This may take a few seconds</p>
            </div>
          )}

          <div className="flex flex-col items-center">
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
              Upload a clear, front-facing photo for best results. JPG, PNG, or WebP, max 10MB.
            </p>

            <button
              onClick={() => analyzeFace('analyze')}
              disabled={!imageBase64 || loading}
              className="flex items-center gap-2 bg-[#e94560] hover:bg-[#ff5c77] text-white px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(233,69,96,0.3)] hover:-translate-y-1 disabled:hover:translate-y-0 disabled:shadow-none"
            >
              <Sparkles size={20} />
              Analyze My Face
            </button>
          </div>
        </div>
      )}

      {result && !saved && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e94560]/10 border border-[#e94560]/30 text-[#e94560] font-bold text-lg mb-3">
              ✦ {result.faceShape} Face Shape
            </div>
            <p className="text-[#a0a0b0] max-w-lg mx-auto">{result.faceShapeDescription}</p>

            {imagePreview && (
              <div className="mt-4 flex justify-center">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10">
                  <img src={imagePreview} alt="Your face" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-xl font-bold text-[#eaeaea] text-center sm:text-left">Recommended Styles for You</h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => analyzeFace('regenerate')}
                  disabled={loading || !imageBase64}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all bg-white/5 hover:bg-white/10 text-[#eaeaea] border border-white/10 disabled:opacity-50"
                >
                  <RefreshCcw size={16} />
                  Regenerate Styles
                </button>
                <button
                  onClick={resetAll}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all bg-black/20 hover:bg-white/5 text-[#a0a0b0] border border-white/10"
                >
                  <Upload size={16} />
                  Upload Another Photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.recommendations?.map((recommendation, index) => (
                <div
                  key={index}
                  className={`bg-[#16213e] p-6 rounded-2xl border transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] ${
                    selectedStyle?.styleName === recommendation.styleName
                      ? 'border-[#e94560] shadow-[0_0_15px_rgba(233,69,96,0.2)]'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <h3 className="text-lg font-bold text-white mb-2">{recommendation.styleName}</h3>
                  <p className="text-sm text-[#c0c0d0] leading-relaxed mb-3">{recommendation.description}</p>
                  <div className="inline-block px-2 py-1 rounded bg-[#e94560]/10 border border-[#e94560]/20 text-xs font-medium text-[#e94560] mb-4">
                    {recommendation.whySuited}
                  </div>
                  <button
                    onClick={() => selectStyle(recommendation)}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all bg-white/5 hover:bg-[#e94560] hover:text-white text-[#eaeaea] border border-white/10 hover:border-[#e94560]"
                  >
                    <Check size={16} />
                    Select This Style
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                onClick={() => setSaved(false)}
                className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-bold transition-all border border-white/10"
              >
                View All 4 Styles
              </button>
              <button
                onClick={resetAll}
                className="bg-black/20 hover:bg-white/5 text-[#a0a0b0] px-8 py-4 rounded-xl font-bold transition-all border border-white/10"
              >
                Try Another Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
