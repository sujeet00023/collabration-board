'use client'
import { RemoteCursor } from "@/hooks/useCursor"

interface Props {
    cursors: Record<string, RemoteCursor>

}

export default function LiveCursors({ cursors }: Props) {
    return(
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
        {Object.values(cursors).map((cursor) =>(
        <CursorDot key={cursor.socketId} cursor={cursor} />
        ))}
</div>
    )
}


function CursorDot({cursor}: {cursor: RemoteCursor}) {
    return (
        <div
      className="absolute transition-[left,top] duration-75 ease-linear"
      style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
    >
      {/* SVG cursor arrow */}
      <svg
        width="18"
        height="22"
        viewBox="0 0 18 22"
        fill="none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M0 0L0 18L4.5 13.5L8 20L10 19L6.5 12L12 12Z"
          fill={cursor.color}
          stroke="white"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name tag */}
      <div
        className="absolute left-4 top-3 whitespace-nowrap text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-md"
        style={{ backgroundColor: cursor.color }}
      >
        {cursor.name.split(' ')[0]}
      </div>
    </div>
    )
}