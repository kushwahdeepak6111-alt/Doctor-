import React from 'react';

export function ClinicLogo({
  label,
  inverted = false,
}: {
  label: string;
  inverted?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="30"
          height="30"
          rx="8"
          fill={inverted ? '#1C7ED6' : '#0B2D52'}
        />
        <path
          d="M15 7.5V22.5M7.5 15H22.5"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle
          cx="22"
          cy="8"
          r="2.2"
          fill="#93C5FD"
        />
      </svg>
      <span
        className={`font-display text-[17px] font-bold tracking-tight whitespace-nowrap shrink-0 ${
          inverted ? 'text-white' : 'text-[#0B2D52]'
        }`}
      >
        {label}
      </span>
    </span>
  );
}
