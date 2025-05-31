import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import {
    updateCollision,
    updateTicks,
    updateEgg,
    updateEggnemies,
    updateGameOver,
    updateTime,
    updateEggxperience,
    attack,
    restart,
    spawnEggnemies,
    spawnBoss,
    updateBoss,
    makeUpdate,
} from '../src/update'
import { 
    Model, 
    Eggnemies, 
    Settings, 
    World, 
    Timer, 
    Rectangle, 
    Config,
    Egg
} from '../src/model'
import { CanvasMsg } from 'cs12242-mvu/src/canvas'

// MOCK MODELS

const mockWorld = (partial: Partial<World> = {}): World =>
  World.make({
    x: 0,
    y: 0,
    width: 1000,
    height: 1000,
    ...partial,
  });

const mockTimer = (partial: Partial<Timer> = {}): Timer =>
  Timer.make({
    minutes: 0,
    seconds: 0,
    ...partial,
  });

const mockConfig = (partial: Partial<Config> = {}): Config =>
  Config.make({
    screenWidth: 800,
    screenHeight: 600,
    worldWidth: 1600,
    worldHeight: 1200,
    fps: 60,
    canvasId: "game-canvas",
    velocity: 5,
    eggInvincibilityFrames: 30,
    eggnemiesCount: 10,
    ...partial,
  });

const mockEgg = (partial: Partial<Egg> = {}): Egg =>
  Egg.make({
    x: 100,
    y: 100,
    width: 26,
    height: 30,
    vx: 0,
    vy: 0,
    hp: 25,
    maxHp: 25,
    eggxperience: 0,
    attack: 1,
    speed: 7,
    levelUp: false,
    level: 1,
    ...partial,
  });

const mockEggnemy = (partial: Partial<Eggnemies> = {}): Eggnemies =>
  Eggnemies.make({
    x: 200,
    y: 200,
    width: 17,
    height: 30,
    vx: 0,
    vy: 0,
    id: 1,
    hp: 5,
    maxHp: 5,
    attack: 1,
    speed: 2,
    ...partial,
  });

const mockSettings = (partial: Partial<Settings> = {}): Settings =>
  Settings.make({
    fps: 30,
    screenWidth: 1920,
    screenHeight: 1080,
    worldWidth: 600,
    worldHeight: 600,
    eggInitHP: 25,
    eggInitAttack: 1,
    eggInitSpeed: 7,
    eggWidth: 26,
    eggHeight: 30,
    eggxperienceLimit: 3,
    hpIncrement: 5,
    attackIncrement: 1,
    speedIncrement: 1,
    eggnemiesCount: 5,
    eggnemyInitHP: 5,
    eggnemyInitAttack: 1,
    eggnemyInitSpeed: 2,
    eggnemyWidth: 17,
    eggnemyHeight: 30,
    eggnemiesToSpawnBoss: 3,
    bossWidth: 37,
    bossHeight: 60,
    bossInitHP: 10,
    bossInitAttack: 3,
    bossInitSpeed: 3,
    bossSpeed: 3,
    ...partial,
  });

const mockModel = (partial: Partial<Model> = {}): Model =>
  Model.make({
    world: mockWorld(),
    config: mockConfig(),
    egg: mockEgg(),
    eggnemies: [],
    eggnemiesSpawned: 0,
    bosses: [],
    defeatedBosses: 0,
    lastBossSpawnThreshold: 0,
    isGameOver: false,
    score: 0,
    ticks: 0,
    firstCollisionTick: -1,
    defeatedEggnemies: 0,
    timer: mockTimer(),
    leaderboard: [],
    ...partial,
  });


// TESTS

describe('update.ts', () => {
  let mockMathRandom: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMathRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

    describe('updateCollision', () => {
        it('should reduce egg HP if colliding with an eggnemy and not invincible', () => {
            const eggnemies = [
                mockEggnemy({x: 55, y: 55, width: 15, height: 15, attack: 1,}),
            ];
            const model = mockModel({
                egg: mockEgg({ x: 55, y: 55, hp: 25 }),
                eggnemies,
                firstCollisionTick: -30,
                ticks: 0,
            });

            const updated = updateCollision(model);
            expect(updated.egg.hp).toBe(24);
            expect(updated.firstCollisionTick).toBe(0);
        });

        it('should reduce egg HP by 3 if colliding with a boss and not invincible', () => {
            const bosses = [
                mockEggnemy({x: 55, y: 55, width: 37, height: 60, attack: 3,}),
            ];
            const model = mockModel({
                egg: mockEgg({ x: 50, y: 50, hp: 25 }),
                bosses,
                firstCollisionTick: -60,
                ticks: 0,
            });

            const updated = updateCollision(model);
            expect(updated.egg.hp).toBe(22);
            expect(updated.firstCollisionTick).toBe(0);
        });

        it('should not reduce egg HP if invincible', () => {
            const eggnemies = [
                mockEggnemy({ x: 55, y: 55, width: 15, height: 15, attack: 1 }),
            ];
            const model = mockModel({
                egg: mockEgg({ hp: 25 }),
                eggnemies,
                firstCollisionTick: 0,
                ticks: 15,
                config: mockConfig({ eggInvincibilityFrames: 60 }),
            });

            const updated = updateCollision(model);
            expect(updated.egg.hp).toBe(25);
            expect(updated.firstCollisionTick).toBe(0);
        });

        it('should not reduce egg HP if egg is leveling up', () => {
            const eggnemies = [
                mockEggnemy({ x: 55, y: 55, width: 15, height: 15, attack: 1 }),
            ];
            const model = mockModel({
                egg: mockEgg({ levelUp: true }),
                eggnemies,
                firstCollisionTick: -60,
                ticks: 0,
            });

            const updated = updateCollision(model);
            expect(updated.egg.hp).toBe(25);
        });

        it('should have egg HP threshold at 0', () => {
            const eggnemies = [
                mockEggnemy({ x: 55, y: 55, width: 15, height: 15, attack: 1 }),
            ];
            const bosses = [
                mockEggnemy({ x: 55, y: 55, width: 37, height: 60, attack: 3 }),
            ];
            const model = mockModel({
                egg: mockEgg({ x: 55, y: 55, hp: 2 }),
                eggnemies,
                bosses,
                firstCollisionTick: -60,
                ticks: 0,
            });

            const updated = updateCollision(model);
            expect(updated.egg.hp).toBe(0);
        });
        });

    describe('updateTicks', () => {
        it('should increment ticks by 1', () => {
        const model = mockModel({ ticks: 0 });
        const updatedModel = updateTicks(model);
        expect(updatedModel.ticks).toBe(1);
        });
    });

    describe('updateEgg', () => {
        it('should keep egg within world bounds', () => {
        const { worldWidth, worldHeight } = mockConfig();
        const eggWidth = 26;
        const eggHeight = 30;

        let model = mockModel({
            egg: mockEgg({ x: -100, y: -100, width: eggWidth, height: eggHeight }),
            world: mockWorld({ width: worldWidth, height: worldHeight })
        });
        model = updateEgg(model);
        expect(model.egg.x).toBe(0);
        expect(model.egg.y).toBe(0);

        model = mockModel({
            egg: mockEgg({ x: worldWidth, y: worldHeight, width: eggWidth, height: eggHeight }),
            world: mockWorld({ width: worldWidth, height: worldHeight },)
        });
        model = updateEgg(model);
        expect(model.egg.x).toBe(worldWidth - eggWidth);
        expect(model.egg.y).toBe(worldHeight - eggHeight);
        });
    });

    describe('updateEggnemies', () => {
        const mockMathRandom = vi.fn();
        let originalMathRandom: () => number;

        beforeEach(() => {
            originalMathRandom = Math.random;
            Math.random = mockMathRandom;
        });

        afterEach(() => {
            Math.random = originalMathRandom;
            vi.restoreAllMocks();
        });

        it('should not update eggnemies if game is over', () => {
            const model = mockModel({ 
                isGameOver: true, 
                eggnemies: [mockEggnemy({ x: 10, y: 10, vx: 1, vy: 1 })],
                egg: mockEgg(),
                world: mockWorld(),
            });

            const updated = updateEggnemies(model, mockSettings());
            expect(updated.eggnemies[0].x).toBe(10);
            expect(updated.eggnemies[0].y).toBe(10);
        });

        it('should not update eggnemies if egg is leveling up', () => {
            const model = mockModel({
                egg: mockEgg({ levelUp: true }), 
                eggnemies: [mockEggnemy({ x: 10, y: 10, vx: 1, vy: 1 })],
                world: mockWorld(),
            });

            const updated = updateEggnemies(model, mockSettings());
            expect(updated.eggnemies[0].x).toBe(10);
            expect(updated.eggnemies[0].y).toBe(10);
        });

        it('should move eggnemies towards the egg (attraction)', () => {
            const model = mockModel({
                egg: mockEgg({ x: 100, y: 100, width: 26, height: 30 }),
                eggnemies: [mockEggnemy({ x: 0, y: 0, speed: 2 })],
                world: mockWorld(),
            });

            const updated = updateEggnemies(model, mockSettings());
            expect(updated.eggnemies[0].x).toBeGreaterThan(model.eggnemies[0].x);
            expect(updated.eggnemies[0].y).toBeGreaterThan(model.eggnemies[0].y);
        });

        it('should repel eggnemies from each other if colliding', () => {
            const { eggnemyWidth, eggnemyHeight } = mockSettings();

            const model = mockModel({
                eggnemies: [
                    mockEggnemy({ x: 50, y: 50, width: eggnemyWidth, height: eggnemyHeight, speed: 1 }),
                    mockEggnemy({ x: 55, y: 55, width: eggnemyWidth, height: eggnemyHeight, speed: 1 }),
                ],
                egg: mockEgg(),
                world: mockWorld(),
            });

            const initialDistance = Math.hypot(
                model.eggnemies[0].x - model.eggnemies[1].x,
                model.eggnemies[0].y - model.eggnemies[1].y
            );

            const updated = updateEggnemies(model, mockSettings());

            const newDistance = Math.hypot(
                updated.eggnemies[0].x - updated.eggnemies[1].x,
                updated.eggnemies[0].y - updated.eggnemies[1].y
            );

            expect(newDistance).toBeGreaterThan(initialDistance);
        });
    });


    describe('updateGameOver', () => {
        beforeAll(() => {
            (globalThis as any).Audio = function (src: string) {
            return {
                src,
                play: vi.fn(),
            };
            };
        });


        it('should set isGameOver to true', () => {
            const modelEggDead = mockModel({
                egg: mockEgg({ hp: 0 }),
            });
            const updatedModel = updateGameOver(modelEggDead);
            expect(updatedModel.isGameOver).toBe(true);
        });

        it('should not change model if game is already over', () => {
            const modelAlreadyOver = mockModel({
                isGameOver: true,
                egg: mockEgg({ hp: 0 }),
            });
            const updatedModel = updateGameOver(modelAlreadyOver);
            expect(updatedModel).toEqual(modelAlreadyOver);
        });

        it('should not change model if egg HP is > 0', () => {
            const modelEggAlive = mockModel({
                egg: mockEgg({ hp: 5 }),
            });
            const updatedModel = updateGameOver(modelEggAlive);
            expect(updatedModel).toEqual(modelEggAlive);
        });
    });


    describe('updateTime', () => {
       it('should update seconds correctly based on ticks', () => {
            let model = mockModel({ ticks: 0 });
            model = updateTime(model);
            expect(model.timer.seconds).toBe(0);

            model = mockModel({ ticks: 29 });
            model = updateTime(model);
            expect(model.timer.seconds).toBe(0);

            model = mockModel({ ticks: 30 });
            model = updateTime(model);
            expect(model.timer.seconds).toBe(1);

            model = mockModel({ ticks: 59 });
            model = updateTime(model);
            expect(model.timer.seconds).toBe(1);

            model = mockModel({ ticks: 1779 }); 
            model = updateTime(model);
            expect(model.timer.seconds).toBe(59); 
            expect(model.timer.minutes).toBe(0); 
        });

        it('should update minutes and seconds correctly after 60 seconds (30 ticks/sec)', () => {
            let model = mockModel({ ticks: 1770 });
            model = updateTime(model);
            expect(model.timer.minutes).toBe(0);
            expect(model.timer.seconds).toBe(59);

            model = mockModel({ ticks: 1800 });
            model = updateTime(model);
            expect(model.timer.minutes).toBe(1);
            expect(model.timer.seconds).toBe(0);

            model = mockModel({ ticks: 2700 });
            model = updateTime(model);
            expect(model.timer.minutes).toBe(1);
            expect(model.timer.seconds).toBe(30);
        });
    });


    describe('updateEggxperience', () => {
        it('should set eggxperience to defeatedEggnemies', () => {
            const model = mockModel({ defeatedEggnemies: 5 });
            const updatedModel = updateEggxperience(model, mockSettings());
            expect(updatedModel.egg.eggxperience).toBe(5);
        });

        it('should set levelUp to true when eggxperience reaches a new multiple of eggxperienceLimit', () => {
            let model = mockModel({
                defeatedEggnemies: 2,
                egg: mockEgg({ level: 0, eggxperience: 1 }), 
            });
            model = updateEggxperience(model, mockSettings());
            expect(model.egg.eggxperience).toBe(2);
            expect(model.egg.levelUp).toBe(false);

            model = mockModel({
                defeatedEggnemies: 3,
                egg: mockEgg({ level: 0, eggxperience: 2 }), 
            });
            model = updateEggxperience(model, mockSettings());
            expect(model.egg.eggxperience).toBe(3);
            expect(model.egg.levelUp).toBe(true);
        });
    });

    describe('attack', () => {
        it('should reduce eggnemy HP on collision', () => {
            const model = mockModel({
                egg: mockEgg({ x: 50, y: 50, attack: 5, width: 20, height: 20 }),
                eggnemies: [mockEggnemy({ x: 55, y: 55, width: 20, height: 20, hp: 10 })],
            });
            const updatedModel = attack(model);
            expect(updatedModel.eggnemies[0].hp).toBe(5); 
        });

        it('should remove defeated eggnemies and increment defeatedEggnemies count', () => {
            const model = mockModel({
                egg: mockEgg({ x: 50, y: 50, attack: 5, width: 20, height: 20 }),
                eggnemies: [mockEggnemy({ x: 55, y: 55, width: 20, height: 20, hp: 5 })],
                defeatedEggnemies: 0,
            });
            const updatedModel = attack(model);
            expect(updatedModel.eggnemies.length).toBe(0);
            expect(updatedModel.defeatedEggnemies).toBe(1);
        });

        it('should reduce boss HP on collision', () => {
            const model = mockModel({
                egg: mockEgg({ x: 50, y: 50, attack: 10, width: 20, height: 20 }),
                bosses: [mockEggnemy({ x: 55, y: 55, width: 40, height: 40, hp: 100 })],
            });
            const updatedModel = attack(model);
            expect(updatedModel.bosses[0].hp).toBe(90); 
        });

        it('should not attack if egg is leveling up', () => {
            const model = mockModel({
                egg: mockEgg({ x: 50, y: 50, attack: 10, levelUp: true, width: 20, height: 20 }),
                eggnemies: [mockEggnemy({ x: 55, y: 55, width: 20, height: 20, hp: 10 })],
            });
            const updatedModel = attack(model);
            expect(updatedModel.eggnemies[0].hp).toBe(10); 
        });
    });
    
    describe('restart', () => {
        it('should reset model to initial state but preserve leaderboard', () => {
            const initialRestartModel = mockModel({
                isGameOver: true,
                egg: mockEgg({ hp: 0 }),
                defeatedEggnemies: 100,
                defeatedBosses: 5,
                eggnemies: [mockEggnemy({ hp: 1 })],
                bosses: [mockEggnemy({ hp: 1 })],
                ticks: 1000,
                timer: { minutes: 10, seconds: 0 },
                lastBossSpawnThreshold: 50,
            });

            const updatedModel = restart(initialRestartModel, mockSettings());

            expect(updatedModel.isGameOver).toBe(false);
            expect(updatedModel.egg.hp).toBe(mockSettings().eggInitHP);
            expect(updatedModel.defeatedEggnemies).toBe(0);
            expect(updatedModel.defeatedBosses).toBe(0);
            expect(updatedModel.eggnemies.length).toBe(0);
            expect(updatedModel.bosses.length).toBe(0);
            expect(updatedModel.ticks).toBe(0);
            expect(updatedModel.timer).toEqual({ minutes: 0, seconds: 0 });
            expect(updatedModel.lastBossSpawnThreshold).toBe(0); 
        });
    });

    describe('spawnEggnemies', () => {
        it('should not spawn eggnemies if egg is leveling up', () => {
            const model = mockModel({ egg: mockEgg({ levelUp: true }), eggnemies: [] });
            const updatedModel = spawnEggnemies(model, mockSettings());
            expect(updatedModel.eggnemies.length).toBe(0);
        });

        it('should spawn 1 to 3 eggnemies if shouldSpawn is true', () => {
            mockMathRandom.mockReturnValueOnce(0.005); 
            mockMathRandom.mockReturnValueOnce(0.5); 
            mockMathRandom.mockReturnValue(0.5); 

            const model = mockModel({ eggnemies: [] });
            const updatedModel = spawnEggnemies(model, mockSettings());
            expect(updatedModel.eggnemies.length).toBe(2); 
            expect(updatedModel.eggnemiesSpawned).toBe(2);
        });
    });

    describe('spawnBoss', () => {
        it('should spawn a boss when defeatedEggnemies reaches a new multiple of eggnemiesToSpawnBoss', () => {
            const modelNotYet = mockModel({
                defeatedEggnemies: 14,
                lastBossSpawnThreshold: 0,
            });
            let updatedModel = spawnBoss(modelNotYet, mockSettings());
            expect(updatedModel.bosses.length).toBe(0);

            updatedModel = spawnBoss(
                mockModel({ ...modelNotYet, defeatedEggnemies: 15 }),
                mockSettings(),
            );
            expect(updatedModel.bosses.length).toBe(1);
            expect(updatedModel.lastBossSpawnThreshold).toBe(15);
        });

        it('should not spawn a boss if defeatedEggnemies is 0', () => {
            const modelZeroDefeated = mockModel({
                defeatedEggnemies: 0,
                lastBossSpawnThreshold: 0,
            });
            const updatedModel = spawnBoss(modelZeroDefeated, mockSettings());
            expect(updatedModel.bosses.length).toBe(0);
        });

        it('should not spawn a boss if the current threshold has already spawned a boss', () => {
            const modelAlreadySpawned = mockModel({
                defeatedEggnemies: 15,
                lastBossSpawnThreshold: 15,
            });
            const updatedModel = spawnBoss(modelAlreadySpawned, mockSettings());
            expect(updatedModel.bosses.length).toBe(0);
            expect(updatedModel.lastBossSpawnThreshold).toBe(15);
        });

        it('should spawn a new boss when a new multiple is reached', () => {
            let model = mockModel({
                defeatedEggnemies: 15,
                lastBossSpawnThreshold: 15,
            });

            model = mockModel({ ...model, defeatedEggnemies: 29, lastBossSpawnThreshold: 15 });
            model = spawnBoss(model, mockSettings());
            expect(model.bosses.length).toBe(0);

            model = mockModel({ ...model, defeatedEggnemies: 30, lastBossSpawnThreshold: 15 });
            model = spawnBoss(model, mockSettings());
            expect(model.bosses.length).toBe(1);
            expect(model.lastBossSpawnThreshold).toBe(30);

            model = mockModel({ ...model, defeatedEggnemies: 30, lastBossSpawnThreshold: 30 });
            model = spawnBoss(model, mockSettings());
            expect(model.bosses.length).toBe(1);
        });
    });

    describe('updateBoss', () => {
        it('should not update bosses if egg is leveling up', () => {
            const modelLevelingUp = mockModel({
                egg: mockEgg({ levelUp: true }),
                bosses: [mockEggnemy({ x: 10, y: 10, vx: 1, vy: 1 })],
            });
            const updatedModel = updateBoss(modelLevelingUp, mockSettings());
            expect(updatedModel.bosses[0].x).toBe(10);
            expect(updatedModel.bosses[0].y).toBe(10);
        });

        it('should remove  increment defeatedBosses count after defeating boss', () => {
            const model = mockModel({
                bosses: [mockEggnemy({x: 100, y: 100, width: 20, height: 20, hp: 1})],
                egg: mockEgg({x: 100, y: 100, attack: 1,}),
                defeatedBosses: 0,
            });
            const updatedModel = attack(model);
            expect(updatedModel.defeatedBosses).toBe(1); 
            });

        it('should move bosses towards the egg (attraction)', () => {
            const modelBossFar = mockModel({
                egg: mockEgg({ x: 100, y: 100, width: 20, height: 20 }),
                bosses: [mockEggnemy({ x: 0, y: 0, width: 40, height: 40, hp: 100, speed: 3 })],
            });
            const updatedModel = updateBoss(modelBossFar, mockSettings());
            expect(updatedModel.bosses[0].x).toBeGreaterThan(modelBossFar.bosses[0].x);
            expect(updatedModel.bosses[0].y).toBeGreaterThan(modelBossFar.bosses[0].y);
        });

        it('should repel bosses away from colliding eggnemies', () => {
            const bossX = 100;
            const bossY = 100;

            const eggnemyX = 98;
            const eggnemyY = 100;

            const boss = mockEggnemy({
                x: bossX,
                y: bossY,
                width: 20,
                height: 20,
                speed: 0,
            });

            const eggnemy = mockEggnemy({
                x: eggnemyX,
                y: eggnemyY,
                width: 20,
                height: 20,
                hp: 3,
            });

            const model = mockModel({
                bosses: [boss],
                eggnemies: [eggnemy],
                egg: mockEgg({ x: bossX, y: bossY }), 
            });

            const updatedModel = updateBoss(model, mockSettings());
            const updatedBoss = updatedModel.bosses[0];

            expect(updatedBoss.x).toBeGreaterThan(bossX);
        });
    });
});