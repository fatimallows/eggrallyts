import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  World,
  Egg,
  Eggnemies,
  Config,
  Model,
  Settings,
  Timer,
} from '../src/model';
import { Schema } from 'effect';


// ==== DEFAULT SCHEMAS =====

const defaultConfig = Config.make({
  screenWidth: 800,
  screenHeight: 600,
  worldWidth: 1600,
  worldHeight: 1200,
  fps: 60,
  canvasId: 'gameCanvas',
  velocity: 5,
  eggInvincibilityFrames: 120,
  eggnemiesCount: 10,
});

const defaultEgg = Egg.make({
  x: 50,
  y: 50,
  height: 20,
  width: 15,
  vx: 2,
  vy: 1,
  hp: 100,
  maxHp: 100,
  eggxperience: 0,
  attack: 10,
  speed: 3,
  levelUp: false,
  level: 1,
});

const defaultEggnemy = Eggnemies.make({
  x: 100,
  y: 100,
  height: 25,
  width: 20,
  vx: -1,
  vy: 0.5,
  id: 1,
  hp: 50,
  speed: 2,
  attack: 5,
  maxHp: 50,
});

const defaultBoss = Eggnemies.make({
  x: 200,
  y: 200,
  height: 50,
  width: 50,
  vx: 0,
  vy: 0,
  id: 101,
  hp: 200,
  speed: 1,
  attack: 20,
  maxHp: 200,
});

const defaultTimer = Timer.make({
  minutes: 0,
  seconds: 0
});

// ==== DEFAULT MODEL TO AVOID REPETITION ====

const defaultModel = Model.make({
  world: { x: 0, y: 0, width: 800, height: 600 },
  config: defaultConfig,
  egg: defaultEgg,
  eggnemies: [defaultEggnemy],
  eggnemiesSpawned: 1,
  bosses: [],
  defeatedBosses: 0,
  lastBossSpawnThreshold: 0,
  isGameOver: false,
  score: 0,
  ticks: 0,
  firstCollisionTick: -1,
  defeatedEggnemies: 0,
  timer: defaultTimer,
  leaderboard: [],
});

// ==== MODEL SCHEMA TESTS ====

describe('Model Schema', () => {

  it('should accept a valid Model object with typical data', () => { 
    const validModel = defaultModel;
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });

  it('should accept a valid Model object with an empty eggnemies array', () => { 
    const validModel = Model.make({
      ...defaultModel,
      eggnemies: [], // empty array
    });
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });

  it('should accept a valid Model object with multiple eggnemies and bosses', () => { 
    const validModel = Model.make({
      ...defaultModel,
      eggnemies: [...defaultModel.eggnemies, { ...defaultEggnemy, id: 2, x: 200 }],
      bosses: [...defaultModel.bosses, defaultBoss, { ...defaultBoss, id: 102, y: 300 }],
    });
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });

  it('should reject a Model with an incorrect type for isGameOver (not boolean)', () => { 
    const invalidModel = defaultModel;
    const modelToTest = {
      ...invalidModel,
      isGameOver: 123, // invalid type
    };
    expect(() => Schema.decodeSync(Model)(modelToTest as any)).toThrow();
  });

  it('should reject a Model with an invalid sub-schema (e.g., missing world height)', () => { 
    const invalidModel = defaultModel;
    const modelToTest = {
      ...invalidModel,
      world: { x: 0, y: 0, width: 100 }, // missing height
    };
    expect(() => Schema.decodeSync(Model)(modelToTest as any)).toThrow();
  });

  it('should reject a Model with non-Eggnemy in the eggnemies array', () => { 
    const invalidModel = defaultModel;
    const modelToTest = {
      ...invalidModel,
      eggnemies: ['not an eggnemy'] as any, // invalid item type
    };
    expect(() => Schema.decodeSync(Model)(modelToTest)).toThrow();
  });

  it('should accept a valid Model object with a score of zero', () => { 
    const validModel = Model.make({
      ...defaultModel,
      score: 0,
    });
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });

  it('should accept a valid Model object with ticks set to zero', () => { 
    const validModel = Model.make({
      ...defaultModel,
      ticks: 0,
    });
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });

  it('should accept a Model object with a valid non-zero timer', () => { 
    const validModel = Model.make({
      ...defaultModel,
      timer: { minutes: 1, seconds: 45 },
    });
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });

  it('should reject a Model with an invalid timer type', () => { 
    const invalidModel = defaultModel;
    const modelToTest = {
      ...invalidModel,
      timer: { minutes: 1, seconds: "not a number" },
    };
    expect(() => Schema.decodeSync(Model)(modelToTest as any)).toThrow();
  });

  it('should accept a valid Model object with an empty leaderboard', () => { 
    const validModel = Model.make({
      ...defaultModel,
      leaderboard: [],
    });
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });

  it('should accept a valid Model object with a leaderboard containing multiple entries (Timer objects)', () => { 
    const validModel = Model.make({
      ...defaultModel,
      leaderboard: [
        Timer.make({ minutes: 5, seconds: 30 }),
        Timer.make({ minutes: 6, seconds: 0 }),
      ],
    });
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });

  it('should reject a Model with an invalid leaderboard entry (i.e. string)', () => { 
    const invalidModel = defaultModel;
    const modelToTest = {
      ...invalidModel,
      leaderboard: [
        ...invalidModel.leaderboard,
        { minutes: 1, seconds: 'invalid_seconds_string' } 
      ],
    };
    expect(() => Schema.decodeSync(Model)(modelToTest as any)).toThrow();
  });

  it('should accept a Model with egg properties indicating damage and level up', () => { 
    const validModel = Model.make({
      ...defaultModel,
      egg: { ...defaultModel.egg, hp: 50, levelUp: true, level: 2, eggxperience: 150 },
    });
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });

  it('should accept a Model with eggnemy properties indicating damage and different ID', () => {     
    const validModel = Model.make({
      ...defaultModel,
      eggnemies: [{ ...defaultModel.eggnemies[0], hp: 10, id: 99 }],
    });
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });

  it('should accept a Model with boss properties indicating damage and different ID', () => {     
    const validModel = Model.make({
      ...defaultModel,
      bosses: [{ ...defaultBoss, hp: 150, id: 200 }],
    });
    const decoded = Schema.decodeSync(Model)(validModel);
    expect(decoded).toEqual(validModel);
  });
});

describe('Settings Schema', () => {
  it('should accept a valid Settings object', () => { 
    const validSettings = Settings.make({
      fps: 60,
      screenHeight: 600,
      screenWidth: 800,
      worldWidth: 1600,
      worldHeight: 1200,
      eggInitHP: 100,
      eggWidth: 15,
      eggHeight: 20,
      eggInitAttack: 10,
      eggInitSpeed: 3,
      eggxperienceLimit: 100,
      hpIncrement: 10,
      attackIncrement: 2,
      speedIncrement: 0.5,
      eggnemiesCount: 10,
      eggnemyWidth: 20,
      eggnemyHeight: 25,
      eggnemyInitHP: 50,
      eggnemyInitAttack: 5,
      eggnemyInitSpeed: 2,
      bossWidth: 50,
      bossHeight: 50,
      bossInitHP: 200,
      bossInitAttack: 20,
      bossInitSpeed: 1,
      bossSpeed: 0.8,
      eggnemiesToSpawnBoss: 5,
    });
    const decoded = Schema.decodeSync(Settings)(validSettings);
    expect(decoded).toEqual(validSettings);
  });

  it('should reject Settings with a missing property', () => { 
    const invalidSettings = {
      fps: 60,
      screenHeight: 600,
      screenWidth: 800,
      worldWidth: 1600,
      worldHeight: 1200,
      eggInitHP: 100,
      eggWidth: 15,
      eggHeight: 20,
      eggInitAttack: 10,
      eggInitSpeed: 3,
      eggxperienceLimit: 100,
      hpIncrement: 10,
      attackIncrement: 2,
      speedIncrement: 0.5,
      // no eggnemiesCount
      eggnemyWidth: 20,
      eggnemyHeight: 25,
      eggnemyInitHP: 50,
      eggnemyInitAttack: 5,
      eggnemyInitSpeed: 2,
      bossWidth: 50,
      bossHeight: 50,
      bossInitHP: 200,
      bossInitAttack: 20,
      bossInitSpeed: 1,
      bossSpeed: 0.8,
      eggnemiesToSpawnBoss: 5,
    };
    expect(() => Schema.decodeSync(Settings)(invalidSettings as any)).toThrow();
  });

  it('should reject Settings with an incorrect property type', () => { 
    const invalidSettings = {
      fps: 'sixty', // invalid type
      screenHeight: 600,
      screenWidth: 800,
      worldWidth: 1600,
      worldHeight: 1200,
      eggInitHP: 100,
      eggWidth: 15,
      eggHeight: 20,
      eggInitAttack: 10,
      eggInitSpeed: 3,
      eggxperienceLimit: 100,
      hpIncrement: 10,
      attackIncrement: 2,
      speedIncrement: 0.5,
      eggnemiesCount: 10,
      eggnemyWidth: 20,
      eggnemyHeight: 25,
      eggnemyInitHP: 50,
      eggnemyInitAttack: 5,
      eggnemyInitSpeed: 2,
      bossWidth: 50,
      bossHeight: 50,
      bossInitHP: 200,
      bossInitAttack: 20,
      bossInitSpeed: 1,
      bossSpeed: 0.8,
      eggnemiesToSpawnBoss: 5,
    };
    expect(() => Schema.decodeSync(Settings)(invalidSettings as any)).toThrow();
  });
});