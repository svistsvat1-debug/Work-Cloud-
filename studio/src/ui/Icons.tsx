import React from 'react';

type P = {size?: number; color?: string; stroke?: number; style?: React.CSSProperties};

const Svg: React.FC<P & {children: React.ReactNode; fill?: boolean}> = ({size = 48, color = 'currentColor', stroke = 2.4, style, fill, children}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill ? color : 'none'}
    stroke={fill ? 'none' : color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {children}
  </svg>
);

export const Sparkle: React.FC<P> = (p) => (
  <Svg {...p} fill>
    <path d="M12 1.5l2.2 6.6a2.4 2.4 0 0 0 1.6 1.6L22.5 12l-6.7 2.3a2.4 2.4 0 0 0-1.6 1.6L12 22.5l-2.2-6.6a2.4 2.4 0 0 0-1.6-1.6L1.5 12l6.7-2.3a2.4 2.4 0 0 0 1.6-1.6z" />
  </Svg>
);
export const Send: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Svg>
);
export const Search: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
);
export const Pin: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);
export const UserIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </Svg>
);
export const Check: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Svg>
);
export const Cross: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const Wrench: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M14.7 6.3a4 4 0 0 0 5 5L21 12.6a6 6 0 0 1-7.4 1.3L6.4 21.1a2 2 0 0 1-2.8-2.8l7.2-7.2A6 6 0 0 1 12.1 3.7l1.3 1.3a4 4 0 0 0 1.3 1.3z" />
  </Svg>
);
export const Dice: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
    <circle cx="8.5" cy="8.5" r="1.2" fill={p.color ?? 'currentColor'} />
    <circle cx="15.5" cy="15.5" r="1.2" fill={p.color ?? 'currentColor'} />
    <circle cx="12" cy="12" r="1.2" fill={p.color ?? 'currentColor'} />
  </Svg>
);
export const Star: React.FC<P> = (p) => (
  <Svg {...p} fill>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
  </Svg>
);
export const Plus: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const Globe: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </Svg>
);
export const ImageIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M21 16l-5-5-9 9" />
  </Svg>
);
export const Bolt: React.FC<P> = (p) => (
  <Svg {...p} fill>
    <path d="M13.5 2L4 13.5h6.5L9.5 22 20 9.5h-6.6z" />
  </Svg>
);
export const CalendarIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);
export const Mail: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
  </Svg>
);
export const Kanban: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="4" width="4.5" height="16" rx="1.5" />
    <rect x="9.75" y="4" width="4.5" height="10" rx="1.5" />
    <rect x="16" y="4" width="4.5" height="13" rx="1.5" />
  </Svg>
);
export const Mic: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </Svg>
);
