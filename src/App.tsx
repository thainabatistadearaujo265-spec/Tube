import React, { useState } from 'react';
import { Search, Download, Music, Loader2, Youtube, AlertCircle, CheckCircle2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
  downloadUrl: string;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [history, setHistory] = useState<VideoInfo[]>(() => {
    const saved = localStorage.getItem('yt_download_history');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const response = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video info');
      }

      setVideoInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!videoInfo) return;
    
    setDownloading(true);
    
    // Add to history
    const newHistory = [videoInfo, ...history.filter(item => item.downloadUrl !== videoInfo.downloadUrl)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('yt_download_history', JSON.stringify(newHistory));

    // Trigger download
    window.location.href = videoInfo.downloadUrl;
    
    setTimeout(() => setDownloading(false), 2000);
  };

  const formatDuration = (seconds: string) => {
    const s = parseInt(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-red-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f0f0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">YT Music <span className="text-red-500">Downloader</span></h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-white/60">
            <span>Fast</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>High Quality</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>Free</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Search Section */}
        <section className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"
          >
            Sua música favorita, offline.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40 text-lg mb-8"
          >
            Cole o link do YouTube abaixo para converter em MP3 de alta qualidade.
          </motion.p>

          <form onSubmit={fetchInfo} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-focus-within:opacity-75"></div>
            <div className="relative flex items-center bg-[#1a1a1a] rounded-xl border border-white/10 p-2 focus-within:border-red-500/50 transition-all">
              <Search className="w-6 h-6 ml-3 text-white/30" />
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-lg placeholder:text-white/20"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analisar'}
              </button>
            </div>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center justify-center gap-2 text-red-400 bg-red-400/10 py-2 px-4 rounded-lg border border-red-400/20"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Result Section */}
        <AnimatePresence mode="wait">
          {videoInfo && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-1/3 relative aspect-video sm:aspect-square">
                  <img 
                    src={videoInfo.thumbnail} 
                    alt={videoInfo.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-mono">
                    {formatDuration(videoInfo.duration)}
                  </div>
                </div>
                <div className="p-6 sm:w-2/3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 leading-tight">{videoInfo.title}</h3>
                    <p className="text-white/40 flex items-center gap-2 text-sm">
                      <Music className="w-4 h-4" />
                      {videoInfo.author}
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/50 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all group"
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Iniciando Download...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" />
                          <span>Baixar MP3</span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-white/20 mt-3 uppercase tracking-widest font-medium">
                      Alta Qualidade • 320kbps • Estéreo
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Section */}
        {history.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center gap-2 mb-6 text-white/40">
              <History className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Downloads Recentes</h3>
            </div>
            <div className="grid gap-4">
              {history.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx}
                  className="flex items-center gap-4 bg-[#1a1a1a]/50 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
                >
                  <img 
                    src={item.thumbnail} 
                    className="w-16 h-16 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.title}</h4>
                    <p className="text-xs text-white/30 truncate">{item.author}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setUrl(`https://www.youtube.com/watch?v=${item.downloadUrl.split('url=')[1]}`);
                      setVideoInfo(item);
                    }}
                    className="p-2 text-white/20 hover:text-white transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-white/5 mt-20">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-white/20 text-sm">
          <p>© 2026 YT Music Downloader. Apenas para uso pessoal.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
