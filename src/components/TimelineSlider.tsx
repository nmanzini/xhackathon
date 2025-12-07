interface TimelineSliderProps {
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export function TimelineSlider({ max, value, onChange }: TimelineSliderProps) {
  return (
    <div className="w-full p-6 bg-[var(--card-bg)] border-b border-[var(--border-color)] transition-colors duration-300">
      <div className="flex items-center gap-4">
        <span className="text-[var(--text-secondary)] text-sm font-mono min-w-[3ch] select-none">
          {value + 1} / {max + 1}
        </span>
        <input
          type="range"
          min="0"
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="
            flex-1 h-8
            appearance-none cursor-pointer
            rounded-lg border
            focus:outline-none
            transition-all duration-200
            
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-2
            [&::-webkit-slider-thumb]:h-8
            [&::-webkit-slider-thumb]:bg-[var(--primary-color)]
            [&::-webkit-slider-thumb]:rounded-sm
            [&::-webkit-slider-thumb]:shadow-sm
            
            [&::-moz-range-thumb]:w-2
            [&::-moz-range-thumb]:h-8
            [&::-moz-range-thumb]:bg-[var(--primary-color)]
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:rounded-sm
            [&::-moz-range-thumb]:shadow-sm
          "
          style={{
            background:
              "linear-gradient(to bottom, var(--slider-bg-start), var(--slider-bg-end))",
            borderColor: "var(--slider-border)",
            boxShadow: "var(--slider-shadow)",
          }}
        />
      </div>
    </div>
  );
}
