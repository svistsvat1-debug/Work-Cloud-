import type React from "react";
import {SHOTS1} from './shots1';
import {SHOTS2} from './shots2';
export const JWM_SHOTS: Record<string, React.FC> = {...SHOTS1, ...SHOTS2};
