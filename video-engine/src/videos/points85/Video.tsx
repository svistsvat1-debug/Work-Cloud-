import React, {useMemo} from 'react';
import {Boards} from '../../../components/Board';
import {FontGate} from '../../../components/Fonts';
import {buildBoards, makeK, Timing} from '../../../components/types';
import timing from './timing.json';
import {boardDefs} from './boards';

export const T = timing as unknown as Timing;
export const DURATION_S = T.scenes[T.scenes.length - 1].end;

export const Points85: React.FC = () => {
  const boards = useMemo(() => buildBoards(boardDefs(makeK(T)), T), []);
  return (
    <FontGate>
      <Boards boards={boards} />
    </FontGate>
  );
};
