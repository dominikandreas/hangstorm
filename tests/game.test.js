import { test, expect, describe } from "bun:test";
import { createGameState, scoreSuccess, scoreFail, updateGameTime, generateEvents } from "../src/game.js";

describe("Game Logic & State Machines", () => {
  test("initial state is created cleanly", () => {
    const state = createGameState();
    expect(state.score).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.health).toBe(100);
    expect(state.flow).toBe(0);
  });

  test("scoring success adds points and increments combo", () => {
    const state = createGameState();
    
    scoreSuccess(state, 100);
    expect(state.score).toBe(100); // Base 100 points
    expect(state.combo).toBe(1);
    expect(state.flow).toBeGreaterThan(0);
    
    scoreSuccess(state, 100);
    expect(state.score).toBe(208); // Prev 100 + 100 + (1 combo * 8 pts)
    expect(state.combo).toBe(2);
  });

  test("scoring failure breaks combo and removes health", () => {
    const state = createGameState();
    scoreSuccess(state, 100);
    expect(state.combo).toBe(1);
    
    scoreFail(state);
    expect(state.combo).toBe(0);
    expect(state.health).toBe(90);
    expect(state.flow).toBe(0); // Flow drops but clamps to 0
  });

  test("health drop triggers game over", () => {
    const state = createGameState();
    state.health = 10;
    
    const result = scoreFail(state);
    expect(state.health).toBe(0);
    expect(result).toBe("FAIL_GAMEOVER");
  });

  test("overdrive charges over 10 consecutive hits", () => {
    const state = createGameState();
    
    for (let i = 0; i < 9; i++) {
        scoreSuccess(state, 100);
    }
    expect(state.overdriveCharge).toBeGreaterThan(0.8);
    expect(state.overdrive).toBe(0);
    
    // 10th hit triggers Overdrive
    const result = scoreSuccess(state, 100);
    expect(result).toBe("OVERDRIVE");
    expect(state.overdriveCharge).toBe(0); // Depletes charge
    expect(state.overdrive).toBe(6.5); // Activates overdrive timer
  });

  test("event generation returns logically ordered patterns", () => {
    const events = generateEvents('skyhook', 20); // 20 second run
    expect(events.length).toBeGreaterThan(0);
    
    // Time must constantly monotonically increase
    for (let i = 1; i < events.length; i++) {
      expect(events[i].time >= events[i-1].time).toBe(true);
    }
  });

  test("time update slowly drains states", () => {
    const state = createGameState();
    state.flow = 1.0;
    state.overdrive = 5.0;
    
    updateGameTime(state, 1.0); // Pass 1 real unit of time
    expect(state.flow).toBeLessThan(1.0);
    expect(state.overdrive).toBe(4.0);
  });
});
