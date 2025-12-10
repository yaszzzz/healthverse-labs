"use client";

import { motion, Variants } from "framer-motion";


const marqueeContainerStyle: React.CSSProperties = {
    overflow: "hidden",
    whiteSpace: "nowrap",
    background: "#241F29",
    padding: "20px 0",

};

const marqueeTextStyle: React.CSSProperties = {
    display: "inline-block",
    fontWeight: 400,
    textTransform: "uppercase",
    color: "white",
    fontFamily: "serif",
    letterSpacing: "2px",
};



const TEXT_CONTENT: string =
    "HealthVerse - Empowering Healthcare with Blockchain Technology";

const MARQUEE_TEXT: string = TEXT_CONTENT.repeat(5);


const marqueeVariants: Variants = {
    animate: {
        // Geser dari 0% ke -20%
        x: ["0%", "-20%"],
        transition: {
            x: {

                duration: 15,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop",
            },
        },
    },
};


export default function RunningTextMarquee() {
    return (
        <div style={marqueeContainerStyle}>
            <motion.div
                style={marqueeTextStyle}
                className="text-[60px] md:text-[120px]"
                variants={marqueeVariants}
                animate="animate"
            >
                {MARQUEE_TEXT}
            </motion.div>
        </div>
    );
}
