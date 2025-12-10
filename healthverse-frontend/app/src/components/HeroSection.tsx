"use client";
import AutoTypeSolidity from "@/app/src/components/animation/FloatingCode";
import HeroAnimatedText from "./animation/HeroAnimation";

export default function HomePage() {
  return (
    <div
      className="
        w-full min-h-[auto] md:min-h-screen
        flex flex-col
        md:flex-row
        overflow-hidden
      "
    >
      <section className="w-full flex items-center justify-center bg-[#F8F4EC] py-20 md:py-0" >
        <div className="w-full max-w-[900px] mx-auto px-4">
          <HeroAnimatedText />
        </div>
      </section>

      {/* TENGAH — floating code */}
      <div
        className="
          w-full md:w-[25%]
          min-h-[200px] md:h-auto
          bg-[#332B38]
          relative
          overflow-hidden
        "
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <AutoTypeSolidity />
        </div>
      </div>

      {/* KANAN — background image */}
      <div
        className="
          w-full md:w-[22%]
          min-h-[200px] md:h-auto
          bg-[#43334C]
          bg-cover bg-right bg-no-repeat
        "
        style={{
          backgroundImage: 'url("/assets/background/backgroundHome.png")',
        }}
      />
    </div>
  );
}
