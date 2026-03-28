import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, Upload, RefreshCw } from "lucide-react";

const Main = () => {
  const [meme, setMeme] = useState({
    imageUrl: "http://i.imgflip.com/1bij.jpg",
  });

  const [allMemes, setAllMemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fontSize, setFontSize] = useState(42);
  const [textColor, setTextColor] = useState("#ffffff");
  const [memeCount, setMemeCount] = useState(1);
  const [toasts, setToasts] = useState([]);
  
  // Simplified text system with exactly two fields
  const [topText, setTopText] = useState("One does not simply");
  const [bottomText, setBottomText] = useState("Walk into Mordor");
  const [showTopText, setShowTopText] = useState(true);
  const [showBottomText, setShowBottomText] = useState(true);
  
  const memeRef = useRef(null);
  
  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const isMobileDevice = window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    
    // Listen for changes in case device type changes (e.g., tablet with keyboard)
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    mediaQuery.addEventListener('change', checkMobile);
    
    return () => {
      mediaQuery.removeEventListener('change', checkMobile);
    };
  }, []);

  useEffect(() => {
    fetch("https://api.imgflip.com/get_memes")
      .then((res) => res.json())
      .then((data) => setAllMemes(data.data.memes));
  }, []);

  // Toast notification system
  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 2500);
  };

  // Keyboard shortcuts - desktop only
  useEffect(() => {
    // Don't set up keyboard shortcuts on mobile devices
    if (isMobile) return;

    const handleKeyPress = (e) => {
      // Check if focus is on an input
      const activeElement = document.activeElement;
      const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
      
      if (!isInputFocused) {
        if (e.key === 'Enter') {
          getMemeImage();
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        downloadMeme();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [allMemes, meme, topText, bottomText, showTopText, showBottomText, fontSize, textColor]);

  const getMemeImage = () => {
    if (allMemes.length === 0) return;
    
    setIsLoading(true);
    setIsImageLoading(true);
    setImageError(false);
    const randomNumber = Math.floor(Math.random() * allMemes.length);
    const newMemeUrl = allMemes[randomNumber].url;
    
    setMeme((prevMeme) => ({
      ...prevMeme,
      imageUrl: newMemeUrl,
    }));
    
    setMemeCount(prev => prev + 1);
    showToast("New meme loaded! 🎲");
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
    setImageError(false);
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
    setIsLoading(false);
  };

  const retryImage = () => {
    getMemeImage();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMeme((prevMeme) => ({
          ...prevMeme,
          imageUrl: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadMeme = async () => {
    if (!memeRef.current) return;
    
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        // Draw the image
        ctx.drawImage(img, 0, 0);
        
        // Set font properties for meme text
        ctx.font = `bold ${fontSize}px Impact, Bebas Neue, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Text style: selected color with black outline
        ctx.fillStyle = textColor;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = fontSize / 8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Draw top text if enabled
        if (showTopText && topText.trim()) {
          const topY = canvas.height * 0.1; // 10% from top
          const text = topText.toUpperCase();
          
          // Draw outline first
          ctx.strokeText(text, canvas.width / 2, topY);
          // Then fill
          ctx.fillText(text, canvas.width / 2, topY);
        }
        
        // Draw bottom text if enabled
        if (showBottomText && bottomText.trim()) {
          ctx.textBaseline = 'bottom';
          const bottomY = canvas.height * 0.9; // 10% from bottom
          const text = bottomText.toUpperCase();
          
          // Draw outline first
          ctx.strokeText(text, canvas.width / 2, bottomY);
          // Then fill
          ctx.fillText(text, canvas.width / 2, bottomY);
        }
        
        // Convert to data URL and download
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `meme-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        showToast("Meme downloaded! 🎉");
      };
      
      img.onerror = () => {
        console.error("Failed to load image for export");
        alert("Failed to export meme. Please try again.");
      };
      
      img.src = meme.imageUrl;
    } catch (error) {
      console.error("Error downloading meme:", error);
      alert("Failed to download meme. Please try again.");
    }
  };

  const shareMeme = async () => {
    if (!memeRef.current) return;
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        // Set font properties
        ctx.font = `bold ${fontSize}px Impact, Bebas Neue, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = textColor;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = fontSize / 8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Draw top text if enabled
        if (showTopText && topText.trim()) {
          ctx.textBaseline = 'top';
          const topY = canvas.height * 0.1;
          const text = topText.toUpperCase();
          ctx.strokeText(text, canvas.width / 2, topY);
          ctx.fillText(text, canvas.width / 2, topY);
        }
        
        // Draw bottom text if enabled
        if (showBottomText && bottomText.trim()) {
          ctx.textBaseline = 'bottom';
          const bottomY = canvas.height * 0.9;
          const text = bottomText.toUpperCase();
          ctx.strokeText(text, canvas.width / 2, bottomY);
          ctx.fillText(text, canvas.width / 2, bottomY);
        }
        
        // Convert to blob for sharing
        canvas.toBlob(async (blob) => {
          const file = new File([blob], "meme.png", { type: "image/png" });
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: "Check out my meme!",
                text: `${topText} - ${bottomText}`,
                files: [file],
              });
              showToast("Meme shared! 🚀");
            } catch (error) {
              console.log("Share cancelled or failed:", error);
            }
          } else {
            // Fallback to clipboard
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
              ]);
              showToast("Copied to clipboard! 📋");
            } catch (error) {
              console.error("Clipboard copy failed:", error);
              alert("Sharing is not available on this device");
            }
          }
        });
      };
      
      img.src = meme.imageUrl;
    } catch (error) {
      console.error("Error sharing meme:", error);
    }
  };

  return (
    <main className="main-container">
      <div className="content-wrapper">
        {/* Left side - Image */}
        <div className="image-section">
          <AnimatePresence mode="wait">
            <motion.div
              key={meme.imageUrl}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="meme-container"
              ref={memeRef}
            >
              <div className="image-wrapper">
                {isImageLoading && !imageError && (
                  <div className="skeleton" />
                )}
                {imageError ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <div className="empty-state-text">
                      Couldn't load image — try getting a new one!
                    </div>
                    <button className="retry-btn" onClick={retryImage}>
                      Retry
                    </button>
                  </div>
                ) : (
                  <img 
                    src={meme.imageUrl} 
                    alt="Meme" 
                    className={`meme-image ${isImageLoading ? 'loading' : 'loaded'}`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                )}
                
                {/* Top text overlay */}
                {showTopText && topText.trim() && !imageError && (
                  <div 
                    className="meme-text top-text"
                    style={{ 
                      fontSize: `${fontSize}px`,
                      color: textColor,
                      textShadow: `
                        2px 2px 0 #000,
                        -2px -2px 0 #000,
                        2px -2px 0 #000,
                        -2px 2px 0 #000,
                        0 2px 0 #000,
                        2px 0 0 #000,
                        0 -2px 0 #000,
                        -2px 0 0 #000,
                        2px 2px 5px #000
                      `
                    }}
                  >
                    {topText}
                  </div>
                )}
                
                {/* Bottom text overlay */}
                {showBottomText && bottomText.trim() && !imageError && (
                  <div 
                    className="meme-text bottom-text"
                    style={{ 
                      fontSize: `${fontSize}px`,
                      color: textColor,
                      textShadow: `
                        2px 2px 0 #000,
                        -2px -2px 0 #000,
                        2px -2px 0 #000,
                        -2px 2px 0 #000,
                        0 2px 0 #000,
                        2px 0 0 #000,
                        0 -2px 0 #000,
                        -2px 0 0 #000,
                        2px 2px 5px #000
                      `
                    }}
                  >
                    {bottomText}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right side - Controls */}
        <div className="controls-section">
          {/* Image controls */}
          <div className="control-card">
            <button 
              onClick={getMemeImage} 
              disabled={isLoading} 
              className="primary-btn"
              aria-label="Get a new random meme image"
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw size={18} style={{ marginRight: "8px" }} />
                  Get a new meme image
                </>
              )}
            </button>

            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="image-upload"
              />
              <label htmlFor="image-upload" className="file-input-label">
                <Upload size={16} style={{ marginRight: "8px" }} />
                Or upload your own image
              </label>
            </div>
          </div>

          {/* Text controls */}
          <div className="control-card">
            <h3 className="card-title">Text Settings</h3>
            
            {/* Top text */}
            <div className="text-control">
              <div className="text-header">
                <label htmlFor="top-text">Top Text</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={showTopText}
                    onChange={(e) => setShowTopText(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <input
                id="top-text"
                type="text"
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="Enter top text..."
                className="text-input"
              />
            </div>

            {/* Bottom text */}
            <div className="text-control">
              <div className="text-header">
                <label htmlFor="bottom-text">Bottom Text</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={showBottomText}
                    onChange={(e) => setShowBottomText(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <input
                id="bottom-text"
                type="text"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="Enter bottom text..."
                className="text-input"
              />
            </div>

            {/* Font size slider */}
            <div className="slider-control">
              <div className="slider-label">
                <span>Font Size</span>
                <span>Size: {fontSize}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="80"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="size-slider"
                aria-label="Adjust font size"
              />
            </div>

            {/* Color picker */}
            <div className="color-control">
              <span className="color-label">Text Color</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="color-picker"
                aria-label="Choose text color"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="action-buttons">
            <button 
              className="action-btn" 
              onClick={downloadMeme}
              aria-label="Download meme as image"
            >
              <Download size={18} />
              Download
            </button>
            <button 
              className="action-btn" 
              onClick={shareMeme}
              aria-label="Share meme"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>

          {/* Meme counter */}
          <div className="meme-counter">
            🎲 {memeCount} meme{memeCount !== 1 ? 's' : ''} generated this session
          </div>

          {/* Keyboard shortcuts - desktop only */}
          {!isMobile && (
            <div className="shortcuts-tooltip shortcuts-legend">
              ⌨️ <kbd>Enter</kbd>: new image · <kbd>Ctrl</kbd>+<kbd>D</kbd>: download
            </div>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {toast.message}
          </div>
        ))}
      </div>
    </main>
  );
};

export default Main;
