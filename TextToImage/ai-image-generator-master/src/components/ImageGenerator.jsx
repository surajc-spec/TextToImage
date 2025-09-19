import React, { useRef, useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import { Bounce, toast } from "react-toastify";
import default_image from "../assets/default_image.svg";
import loading_svg from "../assets/loading-svgrepo-com.svg"; 
import "./ImageGenerator.scss";

const BACKEND_URL = "http://127.0.0.1:5000";

const ImageGenerator = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  let inputRef = useRef(null);

  const imageGenerator = async () => {
    if (!inputRef.current || inputRef.current.value.trim() === "") {
      toast.error("Please enter a prompt!");
      return;
    }

    setLoading(true);
    setImageUrl(null);
    setIsImageLoaded(false);

    try {
      const response = await fetch(`${BACKEND_URL}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputRef.current.value }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to start image generation");
      }

      const taskId = data.task_id;

      // Polling function
      const checkImageStatus = async () => {
        try {
          const statusResponse = await fetch(`${BACKEND_URL}/get-image/${taskId}`);
          const statusData = await statusResponse.json();

          if (statusResponse.ok && statusData.image_url) {
            setImageUrl(statusData.image_url);
            setLoading(false);
            return true;
          } else if (statusData.status === "processing") {
            return false; // Keep polling
          } else {
            throw new Error(statusData.error || "Failed to fetch image");
          }
        } catch (error) {
          console.error("Error checking status:", error);
          return false;
        }
      };

      let delay = 1000;
      let attempts = 0;
      const maxAttempts = 8;
      const multiplier = 1.5;

      const pollWithBackoff = async () => {
        if (await checkImageStatus()) return;

        if (attempts < maxAttempts) {
          setTimeout(pollWithBackoff, delay);
          delay *= multiplier;
          attempts++;
        } else {
          toast.error("Image generation took too long. Try again.");
          setLoading(false);
        }
      };

      pollWithBackoff();
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="ai-image-generator">
      <div className="header">
        AI Image <span>Generator</span>
      </div>
      <div className="img-loading">
        <div className="image">
          {loading ? (
            <img src={loading_svg} alt="Loading..." className="loading-animation" />
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Generated" 
              className={`fade-in ${isImageLoaded ? "loaded" : ""}`}
              onLoad={() => setIsImageLoaded(true)}
            />
          ) : (
            <img src={default_image} alt="Default" />
          )}
        </div>
      </div>
      <div className="search-box">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Describe What You Want To See"
        />
        <div
          className={`generate-btn ${loading ? "disable" : ""}`}
          onClick={imageGenerator}
        >
          {loading ? (
            <ThreeDots
              visible={true}
              height="70"
              width="70"
              color="#de1b89"
              radius="9"
              ariaLabel="three-dots-loading"
            />
          ) : (
            "Generate"
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
