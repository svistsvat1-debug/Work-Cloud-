import React from 'react';
import {Composition, Still} from 'remotion';
import {OceanTrenchShort} from './ocean-trench/Short';
import {OceanTrenchCover} from './ocean-trench/Cover';
import {DURATION, FPS} from './ocean-trench/scene';
import {MoonTrashShort} from './moon-trash/Short';
import {MoonTrashCover} from './moon-trash/Cover';
import {DURATION as MT_DURATION, FPS as MT_FPS} from './moon-trash/scene';
import {LavaFireHoseShort} from './lava-fire-hose/Short';
import {LavaFireHoseCover} from './lava-fire-hose/Cover';
import {DURATION as LAVA_DURATION, FPS as LAVA_FPS} from './lava-fire-hose/scene';
import {Doomsday2026Short} from './doomsday-2026/Short';
import {Doomsday2026Cover} from './doomsday-2026/Cover';
import {DURATION as DOOM_DURATION, FPS as DOOM_FPS} from './doomsday-2026/scene';
import {NukeGasFireShort} from './nuke-gas-fire/Short';
import {NukeGasFireCover} from './nuke-gas-fire/Cover';
import {DURATION as NUKE_DURATION, FPS as NUKE_FPS} from './nuke-gas-fire/scene';
import {DesertIceShort} from './desert-ice/Short';
import {DesertIceCover} from './desert-ice/Cover';
import {DURATION as ICE_DURATION, FPS as ICE_FPS} from './desert-ice/scene';
import {TurkeyEggsShort} from './turkey-eggs/Short';
import {TurkeyEggsCover} from './turkey-eggs/Cover';
import {DURATION as TE_DURATION, FPS as TE_FPS} from './turkey-eggs/scene';
import {NuclearWarningShort} from './nuclear-warning/Short';
import {NuclearWarningCover} from './nuclear-warning/Cover';
import {DURATION as NW_DURATION, FPS as NW_FPS} from './nuclear-warning/scene';
import {KingfisherTrainShort} from './kingfisher-train/Short';
import {KingfisherTrainCover} from './kingfisher-train/Cover';
import {DURATION as KF_DURATION, FPS as KF_FPS} from './kingfisher-train/scene';
import {TsunamiWallShort} from './tsunami-wall/Short';
import {TsunamiWallCover} from './tsunami-wall/Cover';
import {DURATION as TW_DURATION, FPS as TW_FPS} from './tsunami-wall/scene';
import {EagleZapShort} from './eagle-zap/Short';
import {HooverDamPourShort} from './hoover-dam-pour/Short';
import {HooverDamPourCover} from './hoover-dam-pour/Cover';
import {DURATION as HD_DURATION, FPS as HD_FPS} from './hoover-dam-pour/scene';
import {EagleZapCover} from './eagle-zap/Cover';
import {BuildingMoveShort} from './building-move/Short';
import {VenicePilesShort} from './venice-piles/Short';
import {VenicePilesCover} from './venice-piles/Cover';
import {DURATION as VP_DURATION, FPS as VP_FPS} from './venice-piles/scene';
import {BuildingMoveCover} from './building-move/Cover';
import {DURATION as BM_DURATION, FPS as BM_FPS} from './building-move/scene';
import {DURATION as EZ_DURATION, FPS as EZ_FPS} from './eagle-zap/scene';

// One composition per Short (+ its cover still).
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="OceanTrench" component={OceanTrenchShort} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1080} height={1920} />
      <Still id="OceanTrenchCover" component={OceanTrenchCover} width={1080} height={1920} />
      <Composition id="MoonTrash" component={MoonTrashShort} durationInFrames={Math.round(MT_DURATION * MT_FPS)} fps={MT_FPS} width={1080} height={1920} />
      <Still id="MoonTrashCover" component={MoonTrashCover} width={1080} height={1920} />
      <Composition id="LavaFireHose" component={LavaFireHoseShort} durationInFrames={Math.round(LAVA_DURATION * LAVA_FPS)} fps={LAVA_FPS} width={1080} height={1920} />
      <Still id="LavaFireHoseCover" component={LavaFireHoseCover} width={1080} height={1920} />
      <Composition id="Doomsday2026" component={Doomsday2026Short} durationInFrames={Math.round(DOOM_DURATION * DOOM_FPS)} fps={DOOM_FPS} width={1080} height={1920} />
      <Still id="Doomsday2026Cover" component={Doomsday2026Cover} width={1080} height={1920} />
      <Composition id="NukeGasFire" component={NukeGasFireShort} durationInFrames={Math.round(NUKE_DURATION * NUKE_FPS)} fps={NUKE_FPS} width={1080} height={1920} />
      <Still id="NukeGasFireCover" component={NukeGasFireCover} width={1080} height={1920} />
      <Composition id="DesertIce" component={DesertIceShort} durationInFrames={Math.round(ICE_DURATION * ICE_FPS)} fps={ICE_FPS} width={1080} height={1920} />
      <Still id="DesertIceCover" component={DesertIceCover} width={1080} height={1920} />
      <Composition id="NuclearWarning" component={NuclearWarningShort} durationInFrames={Math.round(NW_DURATION * NW_FPS)} fps={NW_FPS} width={1080} height={1920} />
      <Still id="NuclearWarningCover" component={NuclearWarningCover} width={1080} height={1920} />
      <Composition id="TurkeyEggs" component={TurkeyEggsShort} durationInFrames={Math.round(TE_DURATION * TE_FPS)} fps={TE_FPS} width={1080} height={1920} />
      <Still id="TurkeyEggsCover" component={TurkeyEggsCover} width={1080} height={1920} />
      <Composition id="TsunamiWall" component={TsunamiWallShort} durationInFrames={Math.round(TW_DURATION * TW_FPS)} fps={TW_FPS} width={1080} height={1920} />
      <Still id="TsunamiWallCover" component={TsunamiWallCover} width={1080} height={1920} />
      <Composition id="EagleZap" component={EagleZapShort} durationInFrames={Math.round(EZ_DURATION * EZ_FPS)} fps={EZ_FPS} width={1080} height={1920} />
      <Still id="EagleZapCover" component={EagleZapCover} width={1080} height={1920} />
      <Composition id="KingfisherTrain" component={KingfisherTrainShort} durationInFrames={Math.round(KF_DURATION * KF_FPS)} fps={KF_FPS} width={1080} height={1920} />
      <Still id="KingfisherTrainCover" component={KingfisherTrainCover} width={1080} height={1920} />
      <Composition id="HooverDamPour" component={HooverDamPourShort} durationInFrames={Math.round(HD_DURATION * HD_FPS)} fps={HD_FPS} width={1080} height={1920} />
      <Still id="HooverDamPourCover" component={HooverDamPourCover} width={1080} height={1920} />
      <Composition id="BuildingMove" component={BuildingMoveShort} durationInFrames={Math.round(BM_DURATION * BM_FPS)} fps={BM_FPS} width={1080} height={1920} />
      <Still id="BuildingMoveCover" component={BuildingMoveCover} width={1080} height={1920} />
      <Composition id="VenicePiles" component={VenicePilesShort} durationInFrames={Math.round(VP_DURATION * VP_FPS)} fps={VP_FPS} width={1080} height={1920} />
      <Still id="VenicePilesCover" component={VenicePilesCover} width={1080} height={1920} />
    </>
  );
};
