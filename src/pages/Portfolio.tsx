import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Image as ImageIcon, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Portfolio() {
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'barbers', user.uid));
        if (snap.exists() && snap.data().portfolioImages) {
          setImages(snap.data().portfolioImages);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [user]);

  const addImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newImageUrl.startsWith('http')) return toast.error("Please enter a valid image URL");
    
    try {
      const updatedImages = [...images, newImageUrl];
      await updateDoc(doc(db, 'barbers', user.uid), { portfolioImages: updatedImages });
      setImages(updatedImages);
      setNewImageUrl('');
      toast.success("Image added to portfolio");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add image");
    }
  };

  const removeImage = async (index: number) => {
    if (!user) return;
    try {
      const updatedImages = images.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'barbers', user.uid), { portfolioImages: updatedImages });
      setImages(updatedImages);
      toast.success("Image removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove image");
    }
  };

  if (loading) return <div className="text-white text-center p-12">Loading portfolio...</div>;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">Portfolio</h1>
        <p className="text-[#a0a0b0] mt-2">Showcase your best haircuts to attract new clients.</p>
      </div>

      <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5 mb-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus size={20} className="text-[#e94560]" /> Add Image</h2>
        <form onSubmit={addImage} className="flex gap-4 items-start sm:items-center flex-col sm:flex-row">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-[#a0a0b0]" />
            </div>
            <input 
              type="url" 
              required 
              value={newImageUrl} 
              onChange={e => setNewImageUrl(e.target.value)} 
              className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 placeholder-[#a0a0b0] focus:ring-2 focus:ring-[#e94560] transition-all" 
              placeholder="https://example.com/image.jpg" 
            />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-[#e94560] hover:bg-[#ff5c77] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg whitespace-nowrap">
            Add Image
          </button>
        </form>
      </div>

      {images.length === 0 ? (
        <div className="bg-[#16213e] p-12 text-center rounded-3xl border border-white/5 flex flex-col items-center justify-center">
          <div className="text-7xl mb-6">📸</div>
          <h3 className="text-2xl font-bold mb-2 text-[#eaeaea]">Your portfolio is empty</h3>
          <p className="text-[#a0a0b0]">Add some URLs to images of your best work to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((url, index) => (
            <div key={index} className="group relative aspect-square bg-[#1a1a2e] rounded-3xl overflow-hidden border border-white/5 shadow-lg">
              <img src={url} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button 
                  onClick={() => removeImage(index)}
                  className="bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white p-3 rounded-full transition-all border border-red-500/50"
                  title="Remove image"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
