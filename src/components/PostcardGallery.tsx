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
    new Array(postcards.length).fill(false)
  );

  const updatePostcardRotations = () => {
    const viewportHeight = window.innerHeight;
    const viewportMidHeight = viewportHeight / 2;

    const postcardElements = document.querySelectorAll(".postcard");
    const wrapperElements = document.querySelectorAll(".postcard-wrapper");

    postcardElements.forEach((postcardEl, index) => {
      const postcard = postcardEl as HTMLElement;
      const wrapper = wrapperElements[index] as HTMLElement;
      const rect = postcard.getBoundingClientRect();
      const postcardCenter = rect.top + rect.height / 2;

      // Calculate distance from viewport center
      const distanceFromCenter = postcardCenter - viewportMidHeight;

      // Normalize distance (0 at center, 1 at viewport edge)
      let normalizedDistance = Math.min(
        Math.abs(distanceFromCenter) / viewportMidHeight,
        1
      );

      if (selectedIndex === index) {
        // Check if card is fully off screen
        const isFullyOffScreen = rect.bottom > viewportHeight || rect.top < 0;

        if (isFullyOffScreen) {
          setSelectedIndex(-1);
          setFlippedStates((prev) => {
            const newStates = [...prev];
            newStates[index] = false;
            return newStates;
          });
          return;
        }

        postcard.style.transform = "rotateX(0deg)";
        wrapper.style.marginTop = "200px";
        wrapper.style.marginBottom = "0px";
      } else {
        // Reset margin-top and flipped state for non-selected cards
        wrapper.style.marginTop = "0px";

        // Remove flipped state if card is deselected
        if (flippedStates[index]) {
          setFlippedStates((prev) => {
            const newStates = [...prev];
            newStates[index] = false;
            return newStates;
          });
        }

        // Calculate rotation (0deg at center, 70deg at max distance)
        const maxRotation = 20;
        const rotation = 60 + normalizedDistance * maxRotation;

        // Calculate margin-bottom (-250px at max distance, 0px at center)
        const maxMargin = -100;
        const marginBottom = -150 + maxMargin * normalizedDistance;
        wrapper.style.marginBottom = `${marginBottom}px`;

        postcard.style.transform = `rotateX(${rotation}deg)`;
      }
    });
  };

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

      updatePostcardRotations();

      // Scroll to center the selected card
      setTimeout(() => {
        const postcardElements = document.querySelectorAll(".postcard");
        const selectedCard = postcardElements[index] as HTMLElement;

        if (selectedCard) {
          const rect = selectedCard.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const cardCenter = rect.top + window.scrollY + rect.height / 2;
          const viewportCenter = viewportHeight / 2;
          const scrollTarget = cardCenter - viewportCenter;

          window.scrollTo({
            top: scrollTarget,
          });
        }
      }, 50); // Small delay to allow state update
    }
  };

  useEffect(() => {
    // Initial update
    updatePostcardRotations();

    // Update on scroll and resize
    window.addEventListener("scroll", updatePostcardRotations);
    window.addEventListener("resize", updatePostcardRotations);

    return () => {
      window.removeEventListener("scroll", updatePostcardRotations);
      window.removeEventListener("resize", updatePostcardRotations);
    };
  }, [selectedIndex]);

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
        <div className="postcard-overlay">
          <button
            className="postcard-overlay-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
          <div className="postcard-overlay-content">
            {postcards[selectedIndex].name}
          </div>
        </div>
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
            <div
              className={`postcard ${flippedStates[index] ? "flipped" : ""}`}
              onClick={() => handlePostcardClick(index)}
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
