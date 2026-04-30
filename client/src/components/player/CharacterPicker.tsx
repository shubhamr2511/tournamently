import clsx from 'clsx';
import { CharacterAvatar } from './CharacterAvatar';

interface Props {
  characters: string[];
  selected?: string;
  onSelect: (c: string) => void;
  disabled?: boolean;
}

export function CharacterPicker({
  characters,
  selected,
  onSelect,
  disabled,
}: Props) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-72 overflow-y-auto p-1">
      {characters.map((c) => (
        <button
          type="button"
          disabled={disabled}
          key={c}
          onClick={() => onSelect(c)}
          className={clsx(
            'flex flex-col items-center gap-1 p-2 border transition-all',
            selected === c
              ? 'border-accent-yellow bg-accent-yellow/10 shadow-glow'
              : 'border-border hover:border-accent-blue/60',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <CharacterAvatar name={c} character={c} size="md" />
          <span className="text-[10px] text-text-secondary truncate w-full text-center">
            {c}
          </span>
        </button>
      ))}
    </div>
  );
}
