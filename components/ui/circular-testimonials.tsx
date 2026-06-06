"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

export interface CircularTestimonialItem {
  src: string;              // image
  name: string;             // headline
  designation?: string;     // sub-headline
  quote?: string;           // optional text
  payload?: unknown;        // creator / entity object
}

interface CircularTestimonialsProps {
  testimonials: CircularTestimonialItem[];
  autoplay?: boolean;

  /** Primary CTA (e.g. "View Packages") */
  viewPackage?: (item: CircularTestimonialItem) => void;
  primaryActionLabel?: string;

  /** Secondary CTA (e.g. "Request Custom Package") */
  onRequestCustom?: (item: CircularTestimonialItem) => void;
  customActionLabel?: string;
}

/* ------------------------------------------------------------------ */
/* HELPERS */
/* ------------------------------------------------------------------ */

function calculateGap(width: number) {
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;

  if (width <= minWidth) return minGap;
  if (width >= maxWidth)
    return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));

  return (
    minGap +
    (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth))
  );
}

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

export default function CircularTestimonials({
  testimonials,
  autoplay = true,
  viewPackage,
  primaryActionLabel = "View",
  onRequestCustom,
  customActionLabel = "Request Custom",
}: CircularTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1200);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const autoplayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const count = testimonials.length;
  const active = testimonials[activeIndex];

  /* ---------------- Resize ---------------- */

  useEffect(() => {
    const handleResize = () => {
      if (imageContainerRef.current) {
        setContainerWidth(imageContainerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------------- Autoplay ---------------- */

  useEffect(() => {
    if (!autoplay || count <= 1) return;

    autoplayIntervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 5000);

    return () => {
      if (autoplayIntervalRef.current)
        clearInterval(autoplayIntervalRef.current);
    };
  }, [autoplay, count]);

  /* ---------------- Navigation ---------------- */

  const handleNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % count);
  }, [count]);

  const handlePrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + count) % count);
  }, [count]);

  /* ---------------- Image transforms ---------------- */

  function getImageStyle(index: number): React.CSSProperties {
    const gap = calculateGap(containerWidth);
    const lift = gap * 0.8;

    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + count) % count === index;
    const isRight = (activeIndex + 1) % count === index;

    if (isActive)
      return {
        zIndex: 3,
        opacity: 1,
        transform: "translateX(0) translateY(0) scale(1)",
      };

    if (isLeft)
      return {
        zIndex: 2,
        opacity: 1,
        transform: `translateX(-${gap}px) translateY(-${lift}px) scale(0.85) rotateY(15deg)`,
      };

    if (isRight)
      return {
        zIndex: 2,
        opacity: 1,
        transform: `translateX(${gap}px) translateY(-${lift}px) scale(0.85) rotateY(-15deg)`,
      };

    return { opacity: 0, pointerEvents: "none" };
  }

  /* ------------------------------------------------------------------ */

  return (
    <div className="testimonial-container">
      <div className="testimonial-grid">
        {/* IMAGES */}
        <div className="image-container" ref={imageContainerRef}>
          {testimonials.map((t, i) => (
            <img
              key={`${t.src}-${i}`}
              src={t.src}
              alt={t.name}
              className="testimonial-image"
              style={getImageStyle(i)}
            />
          ))}
        </div>

        {/* CONTENT */}
        <div className="testimonial-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="name text-white">{active.name}</h3>
              {active.designation && (
                <p className="designation">{active.designation}</p>
              )}

              {active.quote && (
                <p className="quote">{active.quote}</p>
              )}

              {/* PRIMARY ACTION */}
              {(viewPackage || onRequestCustom) && (
                <div className="actionbuttons flex flex-row gap-5">
                  {viewPackage && (
                    <button
                      onClick={() => viewPackage(active)}
                      className="mt-6 px-6 py-2 rounded-lg bg-[#7b52d3] text-white font-medium hover:bg-[#6a43c0] transition"
                    >
                      {primaryActionLabel}
                    </button>
                  )}
                  {onRequestCustom && (
                    <button
                      onClick={() => onRequestCustom(active)}
                      className="mt-6 px-6 py-2 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition"
                    >
                      {customActionLabel}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ARROWS */}
          <div className="arrow-buttons">
            <button onClick={handlePrev} aria-label="Previous" className="flex items-center justify-center">
              <FaArrowLeft />
            </button>
            <button onClick={handleNext} aria-label="Next" className="flex items-center justify-center">
              <FaArrowRight />
            </button>
          </div>
        </div>
      </div>

      {/* STYLES */}
      <style jsx>{`
        .testimonial-container {
          max-width: 56rem;
          padding: 2rem;
        }
        .testimonial-grid {
          display: grid;
          gap: 4rem;
        }
        .image-container {
          position: relative;
          height: 24rem;
        }
        .testimonial-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 1.5rem;
          transition: all 0.8s cubic-bezier(.4,2,.3,1);
        }
        .testimonial-content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .name {
          font-size: 1.6rem;
          font-weight: 700;
        }
        .designation {
          color: #9ca3af;
          margin-bottom: 1rem;
        }
        .quote {
          line-height: 1.7;
          color: #d1d5db;
        }
        .arrow-buttons {
          display: flex;
          gap: 1.2rem;
          margin-top: 2rem;
        }
        .arrow-buttons button {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          background: #111827;
          color: white;
          cursor: pointer;
        }
        @media (min-width: 768px) {
          .testimonial-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
