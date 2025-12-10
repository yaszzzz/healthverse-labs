"use client";
import AutoTypeSolidity from "@/app/src/components/animation/FloatingCode";
import ButtonHero from "./UI/ButtonHero";

export default function SecondHeroSection() {
  const buttonText = "Get Started";

  return (
    <div
      className="
              w-full min-h-[auto] md:min-h-screen
              flex flex-col
              md:flex-row
              overflow-hidden
            "
    >

      <div className="w-full shrink-0 md:flex-1 md:h-auto overflow-visible">
        <div className="flex flex-col justify-center items-center text-center md:items-start md:text-left h-full px-6 md:px-20 bg-[#241F29] select-none py-16 md:py-0">
          <h1
            className="font-medium text-white leading-none
          text-[32px] sm:text-[38px] md:text-[60px] lg:text-[80px] mb-8"
          >
            Lorem Ipsum,
          </h1>

          <ButtonHero text={buttonText} />
        </div>
      </div>
      <div
        className="
        w-full h-[300px] md:w-[29%] md:h-auto overflow-visible bg-cover bg-center
        order-2 md:order-none
        "
        style={{ backgroundImage: "url('/assets/background/backgroundhome.png')" }}
      >
      </div>
      <div
        className="
                hidden md:block
                w-full md:w-[10%]
                min-h-[200px] md:h-auto
                bg-[#43334C]
                relative
                overflow-hidden
              "
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <AutoTypeSolidity />
        </div>
      </div>
    </div>
  );
}
