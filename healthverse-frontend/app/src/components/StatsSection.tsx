"use client";
import Image from "next/image";
import AutoTypeSolidity from "./animation/FloatingCode";
import StatsRotatingText from "./animation/StatsRotating";
import { useRef } from "react";

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-screen md:h-screen bg-[#241F29] text-[#E8E3EE] flex relative overflow-hidden flex-col md:flex-row"
    >

      {/* BACKGROUND IMAGE */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-40 z-0 lg:pr-70">
        <Image
          src="/assets/view.png"
          alt="bg"
          width={1100}
          height={1100}
          className="object-contain w-[900px] lg:w-[1100px]"
          priority
        />
      </div>

      {/* LEFT SIDE CONTENT */}
      <div className="flex-1 flex items-center px-6 lg:px-12 relative z-10 md:pl-20 py-20 md:py-0">
        <div className="space-y-6 max-w-xl">
          <StatsRotatingText />
          <p className="max-w-md text-sm sm:text-base opacity-80 leading-relaxed mt-10">
            While other chains fork, fail, or fall behind, Aptos runs quietly at
            enterprise scale. Zero downtime. Sub-second finality. This is
            performance you can build on.
          </p>
        </div>
      </div>

      {/* RIGHT AUTOTYPE COLUMN */}
      <div
        className="
          hidden md:flex
          w-[5%]
          h-screen
          bg-[#241F29]
          items-center justify-center
          flex-none
          z-20
          relative
          overflow-hidden 
        "
      >
        <AutoTypeSolidity containerRef={sectionRef} />
      </div>
    </section>
  );
}