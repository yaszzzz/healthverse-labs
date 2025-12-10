import Image from "next/image";

const logos = [
  { name: "NBCUniversal", src: "/logo-placeholder.png" },
  { name: "BlackRock", src: "/logo-placeholder.png" },
];

export default function SupportSection() {
  return (
    <section className="relative w-full bg-[#241F29] py-12 md:py-20 overflow-hidden">
      <div className="relative z-10 text-center py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <p className="text-white text-lg sm:text-xl md:text-2xl font-medium max-w-3xl mx-auto">
          Trusted by global brands and the next generation of unicorns
          redefining whats possible on-chain
        </p>
      </div>

      <div className="relative lg:pb-200 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12 justify-items-center mb-40 ">
        {logos.map((logo) => (
          <div
            key={logo.name}
            className="flex items-center justify-center h-12"
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={120}
              height={48}
              className="max-h-full max-w-full object-contain filter grayscale brightness-150 opacity-70 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[200px] md:h-[300px] overflow-hidden lg:h-[400px] z-0">
        <div className="relative w-full h-full ">
          <Image
            src="/assets/background/backgroundhome.png"
            alt="Decorative support background"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
