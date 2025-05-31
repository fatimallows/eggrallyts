import { Array, Schema as S, pipe } from "effect"

// OBJECTS

export type World = typeof World.Type
export const World = S.Struct({
  x: S.Number,
  y: S.Number,
  width: S.Number,
  height: S.Number,
})

export type Timer = typeof Timer.Type
export const Timer = S.Struct({
    seconds: S.Number,
    minutes: S.Number,
})

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
  eggInvincibilityFrames: S.Number, 
  eggnemiesCount: S.Number,
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
  maxHp: S.Number,
  eggxperience: S.Number,
  attack: S.Number,
  speed: S.Number,
  levelUp: S.Boolean,
  level: S.Number,
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
  hp: S.Number, 
  speed: S.Number,
  attack: S.Number,
  maxHp: S.Number,
})
export type Eggnemies = typeof Eggnemies.Type

// MODEL & SETTINGS

export const Model = S.Struct({
  world: World,
  config: Config,
  egg: Egg,
  eggnemies: S.Array(Eggnemies),
  eggnemiesSpawned: S.Number,
  bosses: S.Array(Eggnemies),
  defeatedBosses: S.Number,
  lastBossSpawnThreshold: S.Number,
  isGameOver: S.Boolean,
  score: S.Number,
  ticks: S.Number,
  firstCollisionTick: S.Int,
  defeatedEggnemies: S.Number,
  timer: Timer,
  leaderboard: S.Array(Timer),
})
export type Model = typeof Model.Type

export const Settings = S.Struct({
  fps: S.Number,
  screenHeight: S.Number,
  screenWidth: S.Number,
  worldWidth: S.Number,
  worldHeight: S.Number,
  // egg properties
  eggInitHP: S.Number,
  eggWidth: S.Number,
  eggHeight: S.Number,
  eggInitAttack: S.Number,
  eggInitSpeed: S.Number,
  eggxperienceLimit: S.Number,
  hpIncrement: S.Number,
  attackIncrement: S.Number,
  speedIncrement: S.Number,
  // eggnemies properties
  eggnemiesCount: S.Number,
  eggnemyWidth: S.Number,
  eggnemyHeight: S.Number,
  eggnemyInitHP: S.Number,
  eggnemyInitAttack: S.Number,
  eggnemyInitSpeed: S.Number,
  // boss properties
  bossWidth: S.Number,
  bossHeight: S.Number,
  bossInitHP: S.Number,
  bossInitAttack: S.Number,
  bossInitSpeed: S.Number,
  bossSpeed: S.Number,
  eggnemiesToSpawnBoss: S.Number,
})
export type Settings = typeof Settings.Type

export const Point = S.Struct({
  x: S.Number,
  y: S.Number,
})
export type Point = typeof Point.Type

// UTILS

export const EggnemiesUtils = {
  top: (eggnemies: Eggnemies) => eggnemies.y,
  bottom: (eggnemies: Eggnemies) => eggnemies.y + eggnemies.height,
  left: (eggnemies: Eggnemies) => eggnemies.x,
  right: (eggnemies: Eggnemies) => eggnemies.x + eggnemies.width,
  center: (eggnemies: Eggnemies) => Point.make({
    x: eggnemies.x + eggnemies.width / 2,
    y: eggnemies.y + eggnemies.height / 2,
  }),
  updateInModel: (model: Model, updates: Partial<Eggnemies>[]) =>
    Model.make({
      ...model,
      eggnemies: pipe(model.eggnemies, Array.map((eggnemy) => Eggnemies.make({...eggnemy, ...updates})))
    }),
  spawn: (config: Config, onScreen: boolean = true, eggnemies: Eggnemies) => {
    const x = onScreen 
      ? Math.random() * config.screenWidth
      : Math.random() * config.worldWidth - config.worldWidth / 2
    const y = onScreen
      ? Math.random() * config.screenHeight
      : Math.random() * config.worldHeight - config.worldHeight / 2
    return Eggnemies.make({
      ...eggnemies,
      x,
      y,
    })
  }
}

export const EggUtils = {
  top: (egg: Egg) => egg.y,
  bottom: (egg: Egg) => egg.y + egg.height,
  left: (egg: Egg) => egg.x,
  right: (egg: Egg) => egg.x + egg.width,
  updateInModel: (model: Model, updates: Partial<Egg>) => {
    const updatedModel = Model.make({
      ...model,
      egg: Egg.make({
        ...model.egg,
        ...updates,
      }),
    });
    return updatedModel;
  },
  handleDefeat: (model: Model, eggnemiesId: number) => { 
    const updatedEggnemies = model.eggnemies.filter(e => e.id !== eggnemiesId)
    return Model.make({
      ...model,
      eggnemies: updatedEggnemies,
      defeatedEggnemies: model.defeatedEggnemies + 1,
    })
  }
}

export const WorldUtils = {
  top: (world: World) => world.y,
  bottom: (world: World) => world.y + world.height,
  left:  (world: World) => world.x,
  right:  (world: World) => world.x + world.width,
  updateInModel: (model: Model, updates: Partial<World>) =>
    Model.make({
      ...model,
      world: World.make({
        ...model.world,
        ...updates,
      })
    }),
}

export const LeaderboardUtils = {
  read: (): Timer[] => {
    try {
      const raw = localStorage.getItem("leaderboard");
      const parsed = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(parsed)) return [];

      return parsed.filter((e): e is Timer =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as any).minutes === "number" &&
        typeof (e as any).seconds === "number"
      );
    } catch {
      return [];
    }
  },

  write: (leaderboard: Timer[]): void => {
    try {
      localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    } catch (error) {
      console.error("Failed to write leaderboard:", error);
    }
  },
};
