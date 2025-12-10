"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ButtonHero from "../UI/ButtonHero";

export default function HeroAnimatedText() {
  const words = ["Energy & Wealth", "Effort & Fitness", "Steps & Airdrop"];
  const buttonText = "Get Started";

  const [index, setIndex] = useState(0);
  const [height, setHeight] = useState(0);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const loop = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3500);

    return () => clearInterval(loop);
  }, [words.length]);

  // Auto detect height
  useEffect(() => {
    if (!textRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setHeight(textRef.current?.offsetHeight || 0);
    });

    resizeObserver.observe(textRef.current);

    return () => resizeObserver.disconnect();
  }, [index]);

  return (
 <div className="flex flex-col justify-start w-full py-20 px-6 md:px-20 bg-[#F8F4EC] select-none">
  <h1
    className="font-medium text-black leading-none 
    text-[26px] sm:text-[38px] md:text-[60px] lg:text-[80px]"
  >
    Convert
  </h1>

  <div
    className="
      relative flex items-center overflow-hidden
      min-h-14 sm:min-h-20 md:min-h-28 lg:min-h-36
    "
  >
    <AnimatePresence mode="wait">
      <motion.h1
        key={index}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        className="
          absolute font-medium text-black leading-none
          text-[32px] sm:text-[48px] md:text-[70px] lg:text-[80px]
        "
      >
        {words[index]}
      </motion.h1>
    </AnimatePresence>
  </div>

  <ButtonHero text={buttonText} />
</div>

  );
}
