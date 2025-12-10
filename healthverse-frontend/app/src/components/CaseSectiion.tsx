import CaseCard from "./UI/Card";
import ButtonHero from "./UI/ButtonHero";

export default function CaseSection() {
  return (
    <div className="bg-[#F8F4EC] flex flex-col py-12 space-y-8">
      <div className="w-full md:pl-20">
        {/* Title */}
        <div className="px-8 text-black p-5">
          <h1 className="text-3xl font-bold">What runs on Aptos?
            Just about everything</h1>
        </div>

        {/* Button */}
        <ButtonHero text="All Use Cases" />
      </div>

      {/* Manual Scroll Slider */}
      <div className="px-8 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex gap-10 snap-x snap-mandatory">
          <div className="snap-start shrink-0">
            <CaseCard title="Title 1" description="Desc" discoverLink="#" />
          </div>
          <div className="snap-start shrink-0">
            <CaseCard title="Title 2" description="Desc" discoverLink="#" />
          </div>
          <div className="snap-start shrink-0">
            <CaseCard title="Title 3" description="Desc" discoverLink="#" />
          </div>
          <div className="snap-start shrink-0">
            <CaseCard title="Title 4" description="Desc" discoverLink="#" />
          </div>
          <div className="snap-start shrink-0">
            <CaseCard title="Title 5" description="Desc" discoverLink="#" />
          </div>
        </div>
      </div>
    </div>
  );
}
