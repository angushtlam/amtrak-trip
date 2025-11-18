import { useState, useEffect } from "react";
import type { ImageMetadata } from "astro";
import "./PostcardGallery.css";

interface Postcard {
  name: string;
  front: ImageMetadata;
  back: ImageMetadata;
}

interface PostcardGalleryProps {
  postcards: Postcard[];
}

export default function PostcardGallery({ postcards }: PostcardGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [flippedStates, setFlippedStates] = useState<boolean[]>(
    new Array(postcards.length).fill(false),
  );

  useEffect(() => {
    if (selectedIndex === -1) {
      // Re-enable scrolling
      document.body.style.overflow = "";
      return;
    }

    // Disable scrolling when a card is selected
    document.body.style.overflow = "hidden";

    // Handle Escape key to close selected card
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            setSelectedIndex(-1);
            setFlippedStates((prev) => {
              const newStates = [...prev];
              newStates[selectedIndex] = false;
              return newStates;
            });
          }
        });
      },
      { threshold: 0 },
    );

    const selectedWrapper = document.querySelector(
      `.postcard-wrapper[data-index="${selectedIndex}"]`,
    );

    if (selectedWrapper) {
      observer.observe(selectedWrapper);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      observer.disconnect();
      document.body.style.overflow = "";
    };
  }, [selectedIndex]);

  const handlePostcardClick = (index: number) => {
    if (selectedIndex === index) {
      // Flip the selected card instead of deselecting
      setFlippedStates((prev) => {
        const newStates = [...prev];
        newStates[index] = !newStates[index];
        return newStates;
      });
    } else {
      setSelectedIndex(index);

      // Scroll to center the selected card
      setTimeout(() => {
        const selectedWrapper = document.querySelector(
          `.postcard-wrapper[data-index="${index}"]`,
        ) as HTMLElement;

        if (selectedWrapper) {
          // Check if mobile (max-width: 768px)
          const isMobile = window.matchMedia("(max-width: 768px)").matches;

          if (isMobile) {
            // Use getBoundingClientRect and scrollTo for mobile
            const rect = selectedWrapper.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const centerY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);

            window.scrollTo({
              top: centerY,
              behavior: "smooth",
            });
          } else {
            // Use scrollIntoView for desktop
            selectedWrapper.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            });
          }
        }
      }, 100);
    }
  };

  const handlePostcardKeyDown = (
    event: React.KeyboardEvent,
    index: number,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePostcardClick(index);
    }
  };

  const handleClose = () => {
    if (selectedIndex >= 0) {
      setFlippedStates((prev) => {
        const newStates = [...prev];
        newStates[selectedIndex] = false;
        return newStates;
      });
    }
    setSelectedIndex(-1);
  };

  return (
    <>
      {selectedIndex >= 0 && (
        <>
          <div className="postcard-backdrop" onClick={handleClose}></div>
          <div className="postcard-overlay">
            <button
              className="postcard-overlay-close"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
            <div className="postcard-overlay-top-text">
              {postcards[selectedIndex].name}
            </div>
          </div>
          <div className="postcard-overlay-bottom-text">
            Tap postcard to flip!
          </div>
        </>
      )}
      <div className="postcard-gallery">
        {postcards.map((postcard, index) => (
          <div
            key={postcard.name}
            className={`postcard-wrapper ${
              selectedIndex === index ? "selected" : ""
            }`}
            data-index={index}
            style={{ zIndex: postcards.length - index }}
          >
            <div className="postcard-label">{postcard.name}</div>
            <div
              className={`postcard ${flippedStates[index] ? "flipped" : ""}`}
              onClick={() => handlePostcardClick(index)}
              onKeyDown={(e) => handlePostcardKeyDown(e, index)}
              tabIndex={0}
              role="button"
              aria-label={`${postcard.name} postcard`}
            >
              <img
                src={postcard.front.src}
                alt={`${postcard.name} postcard`}
                className="postcard-front"
              />
              <img
                src={postcard.back.src}
                alt={`${postcard.name} postcard back`}
                className="postcard-back"
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
