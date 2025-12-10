"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

const statsData = [
  {
    number: "3.8B",
    subtitle: "transactions processed",
    label: "TOTAL TRANSACTIONS PROCESSED ACROSS THE NETWORK.",
  },
  {
    number: "7.2B",
    subtitle: "smart contracts executed",
    label: "TOTAL CONTRACTS DEPLOYED ACROSS THE NETWORK.",
  },
  {
    number: "12.4M",
    subtitle: "active users worldwide",
    label: "REAL USERS INTERACTING IN THE ECOSYSTEM.",
  },
];

export default function StatsRotatingText() {
  const [index, setIndex] = useState(0);
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % statsData.length);
    }, 5000); // Diubah dari 3200ms menjadi 5000ms (5 detik)
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      setHeight(contentRef.current?.offsetHeight || 0);
    });
    resizeObserver.observe(contentRef.current);
    return () => resizeObserver.disconnect();
  }, [index]);

  return (
    <div className="relative overflow-hidden" style={{ height }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          ref={contentRef}
          className="space-y-6 z-10 absolute w-full"
          initial={{ opacity: 0, x: -160 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 160 }}
          transition={{ 
            type: "tween",
            ease: "easeInOut",
            damping: 15,
            stiffness: 200,
            duration: 0.7 // Ditambah durasinya
          }}
        >
          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, x: -140 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              type: "spring",
              damping: 12,
              stiffness: 180,
              delay: 0.2 // Delay sedikit lebih lama
            }}
            className="text-[56px] sm:text-[72px] md:text-[96px] lg:text-[120px] font-semibold leading-[none]"
          >
            {statsData[index].number}
            <span className="text-[#BDBDBD]">+</span>
          </motion.h1>

          {/* H2 */}
          <motion.h2
            initial={{ opacity: 0, x: -160 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              type: "spring",
              damping: 12,
              stiffness: 160,
              delay: 0.4 // Delay lebih lama
            }}
            className="text-[28px] sm:text-[36px] md:text-[48px] font-light leading-tight opacity-95"
          >
            {statsData[index].subtitle}
          </motion.h2>

          {/* Paragraph */}
          <motion.p
            initial={{ opacity: 0, x: -200 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              type: "spring",
              damping: 10,
              stiffness: 140,
              delay: 0.6 // Delay paling lama
            }}
            className="text-[10px] sm:text-xs tracking-widest opacity-70"
          >
            {statsData[index].label}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}