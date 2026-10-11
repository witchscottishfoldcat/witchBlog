'use client'

export default function WaveAnimation() {
  return (
    <div className="wave-container">
      <svg
        className="waves"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 20 150 32"
        preserveAspectRatio="none"
        shapeRendering="auto"
      >
        {/* Wave Layer 1 */}
        <path
          className="wave-layer wave-layer-1"
          d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v48h-352z"
          fill="var(--page-bg)"
        />
        {/* Wave Layer 2 */}
        <path
          className="wave-layer wave-layer-2"
          d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v48h-352z"
          fill="var(--page-bg)"
        />
        {/* Wave Layer 3 */}
        <path
          className="wave-layer wave-layer-3"
          d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v48h-352z"
          fill="var(--page-bg)"
        />
        {/* Wave Layer 4 */}
        <path
          className="wave-layer wave-layer-4"
          d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v48h-352z"
          fill="var(--theme-bg-start)"
        />
      </svg>
    </div>
  )
}

