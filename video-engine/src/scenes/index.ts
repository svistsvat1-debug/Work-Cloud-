import React from 'react';
import * as P1 from './part1';
import * as P2 from './part2';
import * as P3 from './part3';
import * as P4 from './part4';

const all: Record<string, unknown> = {...P1, ...P2, ...P3, ...P4};

export const SCENES: Record<number, React.FC> = {};
for (const [k, v] of Object.entries(all)) {
  const m = /^S(\d+)$/.exec(k);
  if (m) SCENES[Number(m[1])] = v as React.FC;
}
