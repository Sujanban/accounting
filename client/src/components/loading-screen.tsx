type LoadingScreenProps = {
  label?: string;
  description?: string;
  fullScreen?: boolean;
};

/** A calm, accessible loading state shown while the secure workspace is being restored. */
export function LoadingScreen({
  label = "Preparing your workspace",
  description = "Securing your financial data…",
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <main className={`financial-loader ${fullScreen ? "" : "financial-loader--inline"}`} aria-busy="true" aria-live="polite">
      <div className="financial-loader__ambient" aria-hidden="true" />
      <section className="financial-loader__content">
        <div className="financial-loader__brand"><span className="financial-loader__mark">L</span><span>Ledgerly</span></div>
        <div className="financial-loader__visual" aria-hidden="true">
          <svg viewBox="0 0 240 126" role="presentation">
            <defs>
              <linearGradient id="chart-line" x1="0" x2="1">
                <stop stopColor="#27a881" />
                <stop offset="1" stopColor="#d7a64a" />
              </linearGradient>
              <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#27a881" stopOpacity=".24" />
                <stop offset="1" stopColor="#27a881" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="financial-loader__grid" d="M8 24H232M8 55H232M8 86H232M8 117H232" />
            <path className="financial-loader__area" d="M12 108 45 88 71 96 102 61 133 73 163 39 195 51 228 16V118H12Z" />
            <path className="financial-loader__chart" d="M12 108 45 88 71 96 102 61 133 73 163 39 195 51 228 16" />
            <circle className="financial-loader__dot" cx="228" cy="16" r="5" />
          </svg>
        </div>
        <div className="financial-loader__copy">
          <p>{label}</p>
          <span>{description}</span>
        </div>
        <div className="financial-loader__progress"><span /></div>
      </section>
    </main>
  );
}
