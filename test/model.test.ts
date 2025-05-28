import { describe, it, expect } from 'vitest'
import * as ModelModule from '../src/model/'


const { World, WorldUtils, Egg, EggUtils, Model, Config, Eggnemies } = ModelModule;

describe('WorldUtils', () => {
  const initialWorld = World.make({ x: 10, y: 20, width: 100, height: 150 });
  const initialModel = Model.make({
    world: initialWorld,
    config: Config.make({
      screenWidth: 800,
      screenHeight: 600,
      worldWidth: 200,
      worldHeight: 300,
      fps: 60,
      canvasId: 'testCanvas',
      velocity: 5,
      eggInvincibilityFrames: 30,
      eggnemiesCount: 5,
    }),
    egg: Egg.make({ x: 50, y: 50, height: 20, width: 30, vx: 0, vy: 0, hp: 3, maxHp: 3 }),
    eggnemies: [],
    isGameOver: false,
    score: 0,
    ticks: 0,
    firstCollisionTick: -30,
    defeatedEggnemies: 0,
    timer: { seconds: 0, minutes: 0 },
  });

  it('top returns y', () => {
    expect(WorldUtils.top(initialWorld)).toBe(20)
  });

  it('bottom returns y plus height', () => {
    expect(WorldUtils.bottom(initialWorld)).toBe(20 + 150)
  });

  it('left returns x', () => {
    expect(WorldUtils.left(initialWorld)).toBe(10)
  });

  it('right returns the x plus width', () => {
    expect(WorldUtils.right(initialWorld)).toBe(10 + 100)
  });

  it('updateInModel updates the world in the model', () => {
    const updates = { x: 15, width: 120 }
    const updatedModel = WorldUtils.updateInModel(initialModel, updates);
    expect(updatedModel.world.x).toBe(15)
    expect(updatedModel.world.y).toBe(20)
    expect(updatedModel.world.width).toBe(120)
    expect(updatedModel.world.height).toBe(150)
  })
})