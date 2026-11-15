// print-money: timing (video time = voice time + 0.1 s; Scribe word starts) and shot cuts.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.2; // voice ends 23.56 s (+0.1 lead) + ~0.5 s tail

export const T = {
  so: 0.1, country: 0.66, broke: 1.14, but0: 1.98, money: 2.62, printer: 2.9,
  easy: 3.46, fix: 3.78, right: 4.1, you: 4.82, print: 4.98, fat: 5.3, stack: 5.66, cash: 6.02, everyone: 6.58, everyoneEnd: 7.3,
  but: 7.54, bakery: 7.9, still: 8.42, bakes: 8.66, same: 9.18, bread: 9.38, breadEnd: 10.18,
  so2: 10.3, baker: 10.62, raises: 11.06, price: 11.62, priceEnd: 12.18,
  so3: 12.26, print2: 12.62, more: 12.9, moreEnd: 13.54,
  thats: 13.66, germany: 13.94, nineteen: 14.58, twenty3: 14.98, t23End: 16.02,
  soon: 16.22, loaf: 16.58, bread2: 16.98, costs: 17.3, two: 17.86, hundred: 18.18, billion: 18.66, marks: 19.14, marksEnd: 19.94,
  so4: 20.02, families: 20.18, burn: 20.66, cash2: 21.06, stove: 21.62, stoveEnd: 22.1,
  because: 22.22, cheaper: 22.62, firewood: 23.14, end: 23.66,
};
export const CUT_B = T.but; // glide to the bakery (continuous)
export const CUT_C = 12.2; // glide back to the printer (continuous)
export const CUT_D = 16.12; // hard cut: pushing the wheelbarrow
export const CUT_E = 19.98; // hard cut: the stove
