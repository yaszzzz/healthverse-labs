export default function AboutSection() {
  return (
    <section className="w-full bg-[#1A151E] flex items-center px-6 md:px-20 py-16 md:py-24">
      <div className="w-full flex flex-col md:flex-row">

        {/* Left Title */}
        <div className="md:w-1/2">
          <h3 className="text-white font-medium text-[26px] sm:text-[32px] leading-tight">
            Built for a Healthier Future
          </h3>

          {/* Line */}
          <div className="w-24 h-0.5 bg-white mt-4 mb-4"></div>
        </div>

        {/* Right Paragraph */}
        <div className="md:w-1/2 md:pl-16 flex items-end">
          <p className="text-[#CCCCCC] text-[15px] sm:text-[17px] leading-relaxed">
            HealthVerse helps people transform healthy actions into real
            rewards. Every step and every effort matters, and we believe
            in turning progress into value. Combining technology and wellbeing,
            we build motivation through real benefits and long-term results.
          </p>
        </div>
      </div>
    </section>
  );
}
