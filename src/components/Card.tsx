import { CardType } from '../Game';
import cardFrontImage from '../assets/card-front.png';

type CardProps = CardType & {
  isSpymasterView: boolean;
};

export default function Card({ word, color, isRevealed, isSpymasterView }: CardProps) {
  const colorMap = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    black: 'bg-black',
    neutral: 'bg-slate-700',
  };

  return (
    <div className='relative  transform transition-transform hover:scale-105'>
      <img src={cardFrontImage} alt='Card background' className='w-full' />
      {/* Colored circle for profile area to show spymaster the card color */}
      {isSpymasterView && color !== 'neutral' && !isRevealed && (
        <div
          className={`absolute top-[18%] left-[12%] w-[15%] aspect-square ${colorMap[color]} opacity-80 rounded-sm`}
        />
      )}
      {/* Full-color mask for revealed cards */}
      {isRevealed && (
        <div className={`absolute top-0 left-0 w-full h-full ${colorMap[color]} opacity-80`} />
      )}
      {/* Word overlay */}
      <div className='absolute bottom-2 left-0 right-0 text-center font-bold text-xs sm:bottom-3 md:text-base md:bottom-4'>
        {word}
      </div>
    </div>
  );
}
