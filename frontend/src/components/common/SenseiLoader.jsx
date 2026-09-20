import React, { useId } from 'react'

/**
 * SenseiLoader - High-Speed Comic Page-Flip Animated Loader
 * Directly ported from Stitch design "Sensei AI - High-Speed Comic Page-Flip Loader"
 * Features 3-layer rapid 3D page turns, action speed streaks, dynamic manga panel bursts, and whipping ribbon.
 */
export default function SenseiLoader({ 
  size = 110, 
  text = 'Flipping to your page...', 
  showText = true,
  className = '' 
}) {
  const id = useId().replace(/:/g, '')

  const coverGradId = `bookCoverGrad-${id}`
  const leftPaperGradId = `leftPaperGrad-${id}`
  const rightPaperGradId = `rightPaperGrad-${id}`
  const fastPageGradId = `fastPageGrad-${id}`

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-3.5 select-none ${className}`}>
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: (size * 240) / 280 }}
      >
      <svg
        viewBox="0 0 280 240"
        width="100%"
        height="100%"
        style={{ background: 'transparent', overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            @keyframes fastPageTurn1_${id} {
              0% { transform: rotateY(0deg) skewY(0deg); opacity: 0.95; }
              35% { transform: rotateY(-85deg) skewY(-6deg) scaleX(0.9); opacity: 0.8; }
              65% { transform: rotateY(-180deg) skewY(0deg); opacity: 0.15; }
              100% { transform: rotateY(-180deg) skewY(0deg); opacity: 0; }
            }
            @keyframes fastPageTurn2_${id} {
              0% { transform: rotateY(0deg) skewY(0deg); opacity: 0; }
              15% { transform: rotateY(0deg) skewY(0deg); opacity: 0.95; }
              50% { transform: rotateY(-90deg) skewY(-5deg) scaleX(0.9); opacity: 0.85; }
              80% { transform: rotateY(-180deg) skewY(0deg); opacity: 0.2; }
              100% { transform: rotateY(-180deg) skewY(0deg); opacity: 0; }
            }
            @keyframes fastPageTurn3_${id} {
              0% { transform: rotateY(0deg) skewY(0deg); opacity: 0; }
              35% { transform: rotateY(0deg) skewY(0deg); opacity: 0.95; }
              70% { transform: rotateY(-90deg) skewY(-4deg) scaleX(0.9); opacity: 0.85; }
              95% { transform: rotateY(-180deg) skewY(0deg); opacity: 0.25; }
              100% { transform: rotateY(-180deg) skewY(0deg); opacity: 0; }
            }
            @keyframes comicSpeedLine_${id} {
              0% { stroke-dashoffset: 60; opacity: 0; }
              30% { opacity: 0.9; }
              70% { opacity: 0.8; }
              100% { stroke-dashoffset: -60; opacity: 0; }
            }
            @keyframes comicActionDash_${id} {
              0%, 100% { transform: translateX(0px); opacity: 0.4; }
              50% { transform: translateX(-8px); opacity: 1; }
            }
            @keyframes ribbonWhip_${id} {
              0%, 100% { transform: rotate(0deg); }
              30% { transform: rotate(-12deg) skewX(-8deg); }
              70% { transform: rotate(8deg) skewX(6deg); }
            }
            @keyframes pageRhythmBounce_${id} {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-3px) scale(1.01); }
            }

            .book-container-${id} {
              transform-origin: 140px 125px;
              animation: pageRhythmBounce_${id} 0.8s ease-in-out infinite;
            }
            .flip-layer-1-${id} {
              transform-origin: 140px 125px;
              animation: fastPageTurn1_${id} 0.75s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
            }
            .flip-layer-2-${id} {
              transform-origin: 140px 125px;
              animation: fastPageTurn2_${id} 0.75s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
            }
            .flip-layer-3-${id} {
              transform-origin: 140px 125px;
              animation: fastPageTurn3_${id} 0.75s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
            }
            .speed-line-fast-${id} {
              stroke-dasharray: 20 40;
              animation: comicSpeedLine_${id} 0.5s linear infinite;
            }
            .speed-line-fast-delay-${id} {
              stroke-dasharray: 25 35;
              animation: comicSpeedLine_${id} 0.5s linear infinite 0.2s;
            }
            .comic-burst-dash-${id} {
              animation: comicActionDash_${id} 0.45s ease-in-out infinite;
            }
            .ribbon-fast-${id} {
              transform-origin: 140px 65px;
              animation: ribbonWhip_${id} 0.5s ease-in-out infinite;
            }
          `}</style>

          {/* Gradients for dark theme comic tones */}
          <linearGradient id={coverGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F2229" />
            <stop offset="100%" stopColor="#14161B" />
          </linearGradient>
          <linearGradient id={leftPaperGradId} x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#282C36" />
            <stop offset="100%" stopColor="#1B1E25" />
          </linearGradient>
          <linearGradient id={rightPaperGradId} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#2D323E" />
            <stop offset="100%" stopColor="#222630" />
          </linearGradient>
          <linearGradient id={fastPageGradId} x1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6C8CFF" stopOpacity="0.35" />
            <stop offset="35%" stopColor="#2E3442" />
            <stop offset="100%" stopColor="#1E222A" />
          </linearGradient>
        </defs>

        {/* Speed Action Lines Behind Book (Comic manga / superhero speed trails) */}
        <g className={`comic-burst-dash-${id}`} opacity="0.85">
          <path
            className={`speed-line-fast-${id}`}
            d="M 235 68 Q 185 52 135 62"
            fill="none"
            stroke="#6C8CFF"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <path
            className={`speed-line-fast-delay-${id}`}
            d="M 248 82 Q 195 66 142 75"
            fill="none"
            stroke="#5FD38D"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            className={`speed-line-fast-${id}`}
            d="M 220 54 Q 170 42 125 52"
            fill="none"
            stroke="#F5B95F"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
          <path
            className={`speed-line-fast-${id}`}
            d="M 245 182 Q 192 195 138 184"
            fill="none"
            stroke="#6C8CFF"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            className={`speed-line-fast-delay-${id}`}
            d="M 230 196 Q 180 205 130 196"
            fill="none"
            stroke="#F5B95F"
            strokeLinecap="round"
            strokeWidth="2.2"
          />
        </g>

        {/* Main Open Comic Tome */}
        <g className={`book-container-${id}`}>
          {/* Hardcover Outer Shell */}
          <path
            d="M 52 178 C 88 186, 134 182, 140 178 C 146 182, 192 186, 228 178 L 228 78 C 192 86, 146 82, 140 78 C 134 82, 88 86, 52 78 Z"
            fill={`url(#${coverGradId})`}
            stroke="#2F343D"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />

          {/* Left Book Page (Static Base) with Comic Grid */}
          <path
            d="M 56 76 C 92 84, 132 80, 140 76 L 140 174 C 132 178, 92 182, 56 174 Z"
            fill={`url(#${leftPaperGradId})`}
            stroke="#2F343D"
            strokeWidth="1.5"
          />

          {/* Left Page Comic Panels */}
          {/* Panel 1 (Top Left) */}
          <rect x="66" y="88" width="30" height="34" rx="2" fill="#1B1E26" stroke="#2F343D" strokeWidth="1.2" />
          {/* Dynamic action burst inside panel 1 */}
          <path
            d="M 73 98 L 77 93 L 81 99 L 88 95 L 85 102 L 91 106 L 84 108 L 86 115 L 79 111 L 76 117 L 74 110 L 68 111 L 71 105 L 67 101 L 73 100 Z"
            fill="#F5B95F"
            opacity="0.85"
          />

          {/* Panel 2 (Top Right on Left Page) */}
          <rect x="101" y="88" width="31" height="34" rx="2" fill="#20242E" stroke="#2F343D" strokeWidth="1.2" />
          <path
            d="M 106 97 L 126 97 L 126 113 L 115 113 L 110 118 L 112 113 L 106 113 Z"
            fill="#292F3D"
            stroke="#6C8CFF"
            strokeWidth="1"
          />
          <line x1="110" y1="102" x2="122" y2="102" stroke="#E8EAED" strokeLinecap="round" strokeWidth="1.6" />
          <line x1="110" y1="107" x2="119" y2="107" stroke="#5FD38D" strokeLinecap="round" strokeWidth="1.6" />

          {/* Bottom Wide Action Panel */}
          <rect x="66" y="127" width="66" height="38" rx="2" fill="#1C1F27" stroke="#2F343D" strokeWidth="1.2" />
          <line x1="72" y1="137" x2="104" y2="137" stroke="#A9AFB8" strokeLinecap="round" strokeWidth="2" opacity="0.5" />
          <line x1="72" y1="145" x2="124" y2="145" stroke="#6C8CFF" strokeLinecap="round" strokeWidth="2" opacity="0.75" />
          <line x1="72" y1="153" x2="114" y2="153" stroke="#A9AFB8" strokeLinecap="round" strokeWidth="2" opacity="0.4" />

          {/* Right Book Page (Static Base) */}
          <path
            d="M 140 76 C 148 80, 188 84, 224 76 L 224 174 C 188 182, 148 178, 140 174 Z"
            fill={`url(#${rightPaperGradId})`}
            stroke="#2F343D"
            strokeWidth="1.5"
          />

          {/* Right Page Comic Panels */}
          <rect x="149" y="88" width="67" height="42" rx="2" fill="#222632" stroke="#2F343D" strokeWidth="1.2" />
          {/* Character / Speech Bubble in Comic Style */}
          <path
            d="M 158 97 L 206 97 C 208 97, 210 99, 210 101 L 210 115 C 210 117, 208 119, 206 119 L 180 119 L 172 125 L 175 119 L 158 119 C 156 119, 154 117, 154 115 L 154 101 C 154 99, 156 97, 158 97 Z"
            fill="#1C202B"
            stroke="#6C8CFF"
            strokeWidth="1.4"
          />
          <line x1="162" y1="105" x2="200" y2="105" stroke="#F5B95F" strokeLinecap="round" strokeWidth="2" />
          <line x1="162" y1="111" x2="192" y2="111" stroke="#E8EAED" strokeLinecap="round" strokeWidth="1.8" />

          {/* Lower Right Split Panels */}
          <rect x="149" y="135" width="31" height="30" rx="2" fill="#1C1F27" stroke="#2F343D" strokeWidth="1.2" />
          <rect x="185" y="135" width="31" height="30" rx="2" fill="#1F232D" stroke="#2F343D" strokeWidth="1.2" />
          <line x1="154" y1="144" x2="173" y2="144" stroke="#5FD38D" strokeLinecap="round" strokeWidth="1.8" opacity="0.8" />
          <line x1="154" y1="151" x2="168" y2="151" stroke="#A9AFB8" strokeLinecap="round" strokeWidth="1.8" opacity="0.4" />
          <line x1="190" y1="144" x2="209" y2="144" stroke="#6C8CFF" strokeLinecap="round" strokeWidth="1.8" opacity="0.8" />
          <line x1="190" y1="151" x2="204" y2="151" stroke="#A9AFB8" strokeLinecap="round" strokeWidth="1.8" opacity="0.4" />

          {/* Center Spine Depth Lines */}
          <line x1="140" y1="72" x2="140" y2="182" stroke="#121419" strokeLinecap="round" strokeWidth="4" />
          <line x1="140" y1="74" x2="140" y2="180" stroke="#363C47" strokeLinecap="round" strokeWidth="1.8" />

          {/* Fast Dynamic Flipping Pages (3 Layers Staggered) */}
          {/* Flipping Page 3 (Deepest trail layer) */}
          <g className={`flip-layer-3-${id}`}>
            <path
              d="M 140 76 C 148 80, 186 83, 222 76 L 222 173 C 186 180, 148 177, 140 174 Z"
              fill="#262B37"
              stroke="#3D4452"
              strokeWidth="1.2"
              opacity="0.75"
            />
            <line x1="158" y1="98" x2="204" y2="98" stroke="#A9AFB8" strokeLinecap="round" strokeWidth="1.8" opacity="0.4" />
            <line x1="158" y1="112" x2="194" y2="112" stroke="#A9AFB8" strokeLinecap="round" strokeWidth="1.8" opacity="0.3" />
            <line x1="158" y1="126" x2="208" y2="126" stroke="#A9AFB8" strokeLinecap="round" strokeWidth="1.8" opacity="0.25" />
          </g>

          {/* Flipping Page 2 (Mid-speed layer) */}
          <g className={`flip-layer-2-${id}`}>
            <path
              d="M 140 76 C 148 80, 187 83, 223 76 L 223 173 C 187 180, 148 177, 140 174 Z"
              fill="#2A303D"
              stroke="#4B5364"
              strokeWidth="1.4"
              opacity="0.88"
            />
            <rect x="156" y="92" width="52" height="34" rx="2" fill="#1C202A" stroke="#5FD38D" strokeWidth="1.2" />
            <line x1="164" y1="103" x2="198" y2="103" stroke="#5FD38D" strokeLinecap="round" strokeWidth="1.8" />
            <line x1="164" y1="112" x2="190" y2="112" stroke="#E8EAED" strokeLinecap="round" strokeWidth="1.8" opacity="0.8" />
            <line x1="156" y1="138" x2="206" y2="138" stroke="#A9AFB8" strokeLinecap="round" strokeWidth="1.8" opacity="0.4" />
            <line x1="156" y1="147" x2="196" y2="147" stroke="#A9AFB8" strokeLinecap="round" strokeWidth="1.8" opacity="0.3" />
          </g>

          {/* Flipping Page 1 (Primary High-Speed Glowing Action Page) */}
          <g className={`flip-layer-1-${id}`}>
            <path
              d="M 140 76 C 148 80, 188 84, 224 76 L 224 174 C 188 182, 148 178, 140 174 Z"
              fill={`url(#${fastPageGradId})`}
              stroke="#6C8CFF"
              strokeWidth="2"
            />
            <rect x="154" y="90" width="55" height="38" rx="2" fill="#1E232E" stroke="#6C8CFF" strokeWidth="1.4" />
            <path
              d="M 180 97 L 183 104 L 190 102 L 186 108 L 192 113 L 184 113 L 183 120 L 178 115 L 172 119 L 174 112 L 168 109 L 175 106 L 175 99 Z"
              fill="#F5B95F"
            />
            <line x1="154" y1="140" x2="208" y2="140" stroke="#6C8CFF" strokeLinecap="round" strokeWidth="2.2" />
            <line x1="154" y1="149" x2="198" y2="149" stroke="#5FD38D" strokeLinecap="round" strokeWidth="2" />
            <line x1="154" y1="158" x2="188" y2="158" stroke="#E8EAED" strokeLinecap="round" strokeWidth="1.6" opacity="0.7" />
          </g>

          {/* Whipping Bookmark Ribbon */}
          <g className={`ribbon-fast-${id}`}>
            <path d="M 137 68 L 143 68 L 143 106 L 140 101 L 137 106 Z" fill="#6C8CFF" stroke="#121419" strokeWidth="1.2" />
          </g>

          {/* Rapid Page Whisk Wind Streaks */}
          <g opacity="0.75">
            <path d="M 132 82 Q 105 88 88 102" fill="none" stroke="#6C8CFF" strokeDasharray="8 12" strokeLinecap="round" strokeWidth="1.5" />
            <path d="M 134 165 Q 108 160 90 148" fill="none" stroke="#5FD38D" strokeDasharray="10 14" strokeLinecap="round" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
      </div>

      {showText && text && (
        <span className="text-xs font-mono tracking-wider text-[#9ca3af] animate-pulse">
          {text}
        </span>
      )}
    </div>
  )
}
