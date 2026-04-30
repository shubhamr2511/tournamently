import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { characterColor, initials } from '../../utils/formatting';
import { getCharacterImage } from '../../data/characterImages';

interface Props {
  name?: string;
  character?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-24 w-24 text-lg',
};

export function CharacterAvatar({
  name = '?',
  character,
  size = 'md',
  className,
}: Props) {
  const color = characterColor(character || name);
  const imageUrl = getCharacterImage(character);
  const [imageOk, setImageOk] = useState(true);

  useEffect(() => {
    setImageOk(true);
  }, [imageUrl]);

  const showImage = !!imageUrl && imageOk;

  return (
    <div
      className={clsx(
        'relative flex items-center justify-center font-display font-bold uppercase tracking-wider clip-angled-tl border border-border overflow-hidden',
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}55)`,
        boxShadow: `inset 0 0 12px ${color}33`,
      }}
      title={character || name}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={character || name}
          loading="lazy"
          onError={() => setImageOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="text-black/80 mix-blend-screen">{initials(name)}</span>
      )}
    </div>
  );
}
