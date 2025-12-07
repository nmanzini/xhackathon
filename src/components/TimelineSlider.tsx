interface TimelineSliderProps {
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export function TimelineSlider({ max, value, onChange }: TimelineSliderProps) {
  return (
    <div className="w-full p-6 bg-zinc-900 border-b border-zinc-700">
      <div className="flex items-center gap-4">
        <span className="text-zinc-400 text-sm font-mono">
          {value + 1} / {max + 1}
        </span>
        <input
          type="range"
          min="0"
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0"
        />
      </div>
    </div>
  );
}
