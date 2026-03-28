import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, Upload, RefreshCw } from "lucide-react";

const Main = () => {
  const [meme, setMeme] = useState({
    imageUrl: "http://i.imgflip.com/1bij.jpg",
  });

  const [allMemes, setAllMemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Simplified text system with exactly two fields
  const [topText, setTopText] = useState("One does not simply");
  const [bottomText, setBottomText] = useState("Walk into Mordor");
  const [showTopText, setShowTopText] = useState(true);
  const [showBottomText, setShowBottomText] = useState(true);
  
  const memeRef = useRef(null);

  useEffect(() => {
    fetch("https://api.imgflip.com/get_memes")
      .then((res) => res.json())
      .then((data) => setAllMemes(data.data.memes));
  }, []);

  const getMemeImage = () => {
    if (allMemes.length === 0) return;
    
    setIsLoading(true);
    const randomNumber = Math.floor(Math.random() * allMemes.length);
    const newMemeUrl = allMemes[randomNumber].url;
    
    setMeme((prevMeme) => ({
      ...prevMeme,
      imageUrl: newMemeUrl,
    }));
    
    setTimeout(() => setIsLoading(false), 300);
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
        const fontSize = Math.max(24, Math.min(48, canvas.width / 15));
        ctx.font = `bold ${fontSize}px Impact, Bebas Neue, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Text style: white fill with black outline
        ctx.fillStyle = 'white';
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
        const fontSize = Math.max(24, Math.min(48, canvas.width / 15));
        ctx.font = `bold ${fontSize}px Impact, Bebas Neue, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
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
            } catch (error) {
              console.log("Share cancelled or failed:", error);
            }
          } else {
            // Fallback to clipboard
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
              ]);
              alert("Meme copied to clipboard!");
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
                <img src={meme.imageUrl} alt="Meme" className="meme-image" />
                
                {/* Top text overlay */}
                {showTopText && topText.trim() && (
                  <div className="meme-text top-text">
                    {topText}
                  </div>
                )}
                
                {/* Bottom text overlay */}
                {showBottomText && bottomText.trim() && (
                  <div className="meme-text bottom-text">
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
            <button onClick={getMemeImage} disabled={isLoading} className="primary-btn">
              <RefreshCw size={18} style={{ marginRight: "8px" }} />
              {isLoading ? "Loading..." : "Get a new meme image"}
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
          </div>

          {/* Action buttons */}
          <div className="action-buttons">
            <button className="action-btn" onClick={downloadMeme}>
              <Download size={18} />
              Download
            </button>
            <button className="action-btn" onClick={shareMeme}>
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Main;
