/** sound-effect cue list: file (public/why-you-see-stars/sfx/<f>.wav), start time in s, level in dB under the voice */
export const CUES: {f: string; at: number; db: number}[] = [
	// S1 living room
	{f: 'whoosh_up', at: 0.3, db: -24},
	{f: 'boing', at: 0.4, db: -21},
	{f: 'thud', at: 0.8, db: -20},
	{f: 'twinkle', at: 0.88, db: -27},
	{f: 'bell', at: 1.03, db: -17},
	// S2 x-ray
	{f: 'scan', at: 2.62, db: -24},
	{f: 'pop', at: 4.08, db: -18},
	{f: 'pop', at: 4.47, db: -23},
	{f: 'glug', at: 5.27, db: -20},
	{f: 'pop', at: 6.78, db: -18},
	{f: 'slide_down', at: 7.2, db: -24},
	{f: 'womp', at: 8.3, db: -23},
	// S3 eyeball
	{f: 'gulp', at: 10.37, db: -21},
	{f: 'gulp', at: 10.67, db: -21},
	{f: 'gulp', at: 10.97, db: -21},
	{f: 'gulp', at: 11.27, db: -21},
	{f: 'glitch', at: 11.33, db: -21},
	// S4 POV
	{f: 'sparkle', at: 12.5, db: -25},
	{f: 'sparkle', at: 12.95, db: -29},
	{f: 'tunnel', at: 13.62, db: -29},
	// S5 jet + pilot
	{f: 'jet', at: 15.05, db: -17},
	{f: 'rush', at: 16.12, db: -21},
	{f: 'rumble', at: 16.45, db: -22},
	{f: 'thud', at: 17.98, db: -17},
	// S6 neck sensors
	{f: 'scan', at: 18.85, db: -27},
	{f: 'pop', at: 19.41, db: -21},
	{f: 'pop', at: 19.61, db: -21},
	{f: 'ping', at: 19.75, db: -26},
	{f: 'alarm', at: 20.63, db: -24},
	{f: 'whoosh_up', at: 21.0, db: -26},
	// S7 heart + vessel
	...[21.78, 22.16, 22.48, 22.76, 23.0, 23.22, 23.43, 23.63].map((at) => ({f: 'heartbeat', at, db: -17})),
	{f: 'squeeze', at: 22.78, db: -23},
	{f: 'rush', at: 23.1, db: -29},
	// S8 vision back
	{f: 'whoosh_up', at: 24.1, db: -26},
	{f: 'chime', at: 24.62, db: -22},
	// S9
	{f: 'pop', at: 25.42, db: -19},
	{f: 'pop', at: 27.2, db: -19},
	{f: 'pop', at: 29.15, db: -22},
];
