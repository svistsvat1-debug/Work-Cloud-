// Marker-whiteboard theme shared by every video.
export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const C = {
  bg: '#FAF8F3',
  ink: '#1A1A1A',
  red: '#E8322B',
  orange: '#F58A1F',
  yellow: '#FFC93C',
  blue: '#1E88E5',
  green: '#3BA55C',
  olive: '#6B7B3A',
  khaki: '#C2B280',
  steel: '#6E7B85',
  grey: '#A9AEB3',
  lightBlue: '#9CCBF2',
  white: '#FFFFFF',
  pink: '#F4A6A0',
};

export const FONT_TITLE = "'Permanent Marker', cursive";
export const FONT_LABEL = "'Caveat Brush', cursive";

export type ColorName = keyof typeof C;
export const col = (c?: string) => (c && (C as Record<string, string>)[c]) || c || C.ink;
