interface ButtonHeroProps {
  text: string;

  onclick?: () => void;
}

export default function ButtonHero({ text, onclick }: ButtonHeroProps) {
  return (
    <button
      className="mt-8 w-32 sm:w-36 md:w-40 text-white py-2 sm:py-3
          bg-[#332B38] hover:bg-[#4B3946] rounded-full text-sm sm:text-base
          font-medium shadow hover:shadow-lg transition-colors duration-200 ease-in-out"
      onClick={onclick}
    >
      {text}
    </button>
  );
}   
