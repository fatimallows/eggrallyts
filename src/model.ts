import { Array, Schema as S, pipe } from "effect"

export const Rectangle = S.Struct({
  x: S.Number,
  y: S.Number,
  height: S.Number,
  width: S.Number,
})
export type Rectangle = typeof Rectangle.Type

export const Config = S.Struct({
  screenWidth: S.Number,
  screenHeight: S.Number,
  worldWidth: S.Number,
  worldHeight: S.Number,
  fps: S.Number,
  canvasId: S.String,
  velocity: S.Number,
  maxHp: S.Number,
  eggInvincibilityFrames: S.Int,
})
export type Config = typeof Config.Type

export const Egg = S.Struct({
  x: S.Number,
  y: S.Number,
  height: S.Number,
  width: S.Number,
  vx: S.Number,
  vy: S.Number,
  hp: S.Number,
})
export type Egg = typeof Egg.Type

export const Eggnemies = S.Struct({
  x: S.Number,
  y: S.Number,
  height: S.Number,
  width: S.Number,
  vx: S.Number,
  vy: S.Number,
  id: S.Number,
})
export type Eggnemies = typeof Eggnemies.Type

export const Model = S.Struct({
  config: Config,
  egg: Egg,
  eggnemies: S.Array(Eggnemies),
  isGameOver: S.Boolean,
  score: S.Number,
  ticks: S.Number,
  firstCollisionTick: S.Int,
})
export type Model = typeof Model.Type

export const Settings = S.Struct({
  fps: S.Number,
  screenHeight: S.Number,
  screenWidth: S.Number,
  worldWidth: S.Number,
  worldHeight: S.Number,
  eggInitHP: S.Number,
  eggWidth: S.Number,
  eggHeight: S.Number,
  eggnemiesCount: S.Number,
  eggnemyWidth: S.Number,
  eggnemyHeight: S.Number,
})
export type Settings = typeof Settings.Type

export const EggnemiesUtils = {
  top: (eggnemies: Eggnemies) => eggnemies.y,
  bottom: (eggnemies: Eggnemies) => eggnemies.y + eggnemies.height,
  left: (eggnemies: Eggnemies) => eggnemies.x,
  right: (eggnemies: Eggnemies) => eggnemies.x + eggnemies.width,
  updateInModel: (model: Model, updates: Partial<Eggnemies>[]) =>
    Model.make({
      ...model,
      eggnemies: pipe(model.eggnemies, Array.map((eggnemy) => Eggnemies.make({...eggnemy, ...updates})))
    }),
}

export const EggUtils = {
  top: (egg: Egg) => egg.y,
  bottom: (egg: Egg) => egg.y + egg.height,
  left: (egg: Egg) => egg.x,
  right: (egg: Egg) => egg.x + egg.width,
  updateInModel: (model: Model, updates: Partial<Egg>) =>
    Model.make({
      ...model,
      egg: Egg.make({
        ...model.egg,
        ...updates,
      }),
    }),
}
