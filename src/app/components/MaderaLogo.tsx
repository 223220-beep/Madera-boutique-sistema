export function MaderaLogo({ className = "" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className={className}
        >
            {/* Hexagon Outline */}
            <polygon points="50,10 89,32.5 89,77.5 50,100 11,77.5 11,32.5" />

            {/* Inner Y shapes outlining faces */}
            <polyline points="11,32.5 50,55 89,32.5" />
            <line x1="50" y1="55" x2="50" y2="100" />

            {/* Left interlocking puzzle peg */}
            <polyline points="11,62 24,69.5 24,54.5 37,62 37,77 50,84.5" />

            {/* Right interlocking puzzle peg */}
            <polyline points="50,84.5 63,77 63,62 76,54.5 76,69.5 89,62" />

            {/* Top face wood grain curves */}
            <path d="M 25 30 Q 35 20 55 16 M 22 37 Q 45 35 68 23 M 32 43 Q 50 40 78 28 M 45 50 Q 60 48 83 34" strokeWidth="4" />
        </svg>
    );
}
