"use client";

import { motion } from "framer-motion";

export default function VerticalTextReverse() {
  return (
    <div className="overflow-hidden h-full flex items-center justify-center relative">
      <motion.div
        initial={{ opacity: 0, y: "150%" }}     // muncul dari bawah + fade in
        animate={{
          opacity: [0, 1, 1, 0],                 // fade in → stay → fade out
          y: ["150%", "0%", "-150%"],            // jalan smooth sampai hilang
        }}
        transition={{
          duration: 12,                           // pelan, cinematic
          ease: "easeInOut",
          repeat: Infinity,
        }}
        className="text-white text-5xl font-[DreamingOutloudSans] font-bold whitespace-pre-line text-center"
      >
        H{"\n"}E{"\n"}A{"\n"}L{"\n"}T{"\n"}H{"\n"}{"\n"}V{"\n"}E{"\n"}R{"\n"}S{"\n"}E
      </motion.div>
    </div>
  );
}
