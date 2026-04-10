interface OrnamentalDividerProps {
  symbol?: string;
  className?: string;
  variant?: "light" | "dark";
}

const OrnamentalDivider = ({ symbol = "✦", className = "", variant = "light" }: OrnamentalDividerProps) => {
  const lineColor = variant === "dark" ? "border-accent/20" : "border-accent/20";
  const symbolColor = variant === "dark" ? "text-accent/40" : "text-accent/50";

  return (
    <div className={`flex items-center justify-center gap-4 max-w-xs mx-auto py-1 ${className}`}>
      <div className={`flex-1 border-t ${lineColor}`} />
      <span className={`font-serif text-sm ${symbolColor} select-none`}>{symbol}</span>
      <div className={`flex-1 border-t ${lineColor}`} />
    </div>
  );
};

export default OrnamentalDivider;
