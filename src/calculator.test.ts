import { describe, it, expect } from "vitest";
import {
  scoreRounds,
  displayCounter,
  parseHand,
  applyBossBlindDebuffs,
  type CounterJoker,
  type BossBlind,
  type ScoringContext,
  type Card,
  RoundInfo,
  HandInfo,
} from "@/calculator";

describe("displayCounter", () => {
  it("formats Obelisk counter correctly", () => {
    const obelisk: CounterJoker = {
      kind: "counter",
      name: "Obelisk",
      counter: 5,
    };
    expect(displayCounter(obelisk)).toBe("x1.0 mult");
  });

  it("formats Green Joker counter correctly", () => {
    const greenJoker: CounterJoker = {
      kind: "counter",
      name: "Green Joker",
      counter: 10,
    };
    expect(displayCounter(greenJoker)).toBe("+10 mult");
  });

  it("formats Runner counter correctly", () => {
    const runner: CounterJoker = {
      kind: "counter",
      name: "Runner",
      counter: 3,
    };
    expect(displayCounter(runner)).toBe("+45 chips");
  });
});

describe("parseHand", () => {
  it("parses a simple hand correctly", () => {
    const hand = "AH,KH,QH,JH,TH";
    const cards = parseHand(hand);

    expect(cards.length).toBe(5);
    expect(cards[0].rank).toBe("A");
    expect(cards[0].suit).toBe("H");
    expect(cards[4].rank).toBe("T");
    expect(cards[4].suit).toBe("H");
  });

  it("parses a hand with custom values correctly", () => {
    const hand = "AH C10 M5,KH X2";
    const cards = parseHand(hand);

    expect(cards.length).toBe(2);
    expect(cards[0].chips).toBe(10);
    expect(cards[0].mult).toBe(5);
    expect(cards[1].xmult).toBe(2);
  });
});

describe("applyBossBlindDebuffs", () => {
  it("debuffs heart cards with The Head", () => {
    const context: ScoringContext = {
      chips: 0,
      mult: 0,
      handInfo: {},
      jokers: [],
      pareidolia: false,
      splash: false,
      bossBlind: "The Head",
    };

    const cards: Card[] = [
      {
        order: 0,
        rank: "A",
        suit: "H",
        chips: 0,
        mult: 0,
        xmult: 1,
        debuffed: false,
      },
      {
        order: 1,
        rank: "K",
        suit: "S",
        chips: 0,
        mult: 0,
        xmult: 1,
        debuffed: false,
      },
    ];

    applyBossBlindDebuffs(context, cards);

    expect(cards[0].debuffed).toBe(true); // Heart card should be debuffed
    expect(cards[1].debuffed).toBe(false); // Spade card should not be debuffed
  });

  it("debuffs face cards with The Plant", () => {
    const context: ScoringContext = {
      chips: 0,
      mult: 0,
      handInfo: {},
      jokers: [],
      pareidolia: false,
      splash: false,
      bossBlind: "The Plant",
    };

    const cards: Card[] = [
      {
        order: 0,
        rank: "A",
        suit: "H",
        chips: 0,
        mult: 0,
        xmult: 1,
        debuffed: false,
      },
      {
        order: 1,
        rank: "K",
        suit: "S",
        chips: 0,
        mult: 0,
        xmult: 1,
        debuffed: false,
      },
      {
        order: 2,
        rank: "Q",
        suit: "D",
        chips: 0,
        mult: 0,
        xmult: 1,
        debuffed: false,
      },
    ];

    applyBossBlindDebuffs(context, cards);

    expect(cards[0].debuffed).toBe(false); // A is not a face card
    expect(cards[1].debuffed).toBe(true); // K is a face card
    expect(cards[2].debuffed).toBe(true); // Q is a face card
  });

  it("debuffs all cards with The Plant when pareidolia is active", () => {
    const context: ScoringContext = {
      chips: 0,
      mult: 0,
      handInfo: {},
      jokers: [],
      pareidolia: true,
      splash: false,
      bossBlind: "The Plant",
    };

    const cards: Card[] = [
      {
        order: 0,
        rank: "A",
        suit: "H",
        chips: 0,
        mult: 0,
        xmult: 1,
        debuffed: false,
      },
      {
        order: 1,
        rank: "2",
        suit: "S",
        chips: 0,
        mult: 0,
        xmult: 1,
        debuffed: false,
      },
    ];

    applyBossBlindDebuffs(context, cards);

    expect(cards[0].debuffed).toBe(true); // With pareidolia, all cards are face cards
    expect(cards[1].debuffed).toBe(true); // With pareidolia, all cards are face cards
  });
});

// Add more test cases for specific scoring scenarios
describe("Scoring", () => {
  it("scores a royal flush correctly", () => {
    const state: RoundInfo = {
      handInfo: {
        "straight-flush": { lvl: 1, count: 0 },
      } as HandInfo,
      jokers: [],
      rounds: ["AH,KH,QH,JH,TH"],
      bossBlind: undefined,
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("straight-flush");
    // Royal flush base score is 100 chips × 8 mult = 800
    expect(results[0]?.score).toBe(800);
  });

  it("applies boss blind debuffs correctly to scoring", () => {
    const state = {
      handInfo: {
        Flush: { lvl: 1, count: 0 },
        // Add other hands as needed
      },
      jokers: [],
      rounds: ["AH,KH,QH,JH,2H"], // Hearts flush
      bossBlind: "The Head", // Debuffs hearts
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("Flush");
    // With The Head, all heart cards are debuffed, so they contribute nothing
    // Only the base flush scoring should apply
    expect(results[0]?.chips).toBe(20); // Base flush chips
    expect(results[0]?.mult).toBe(4); // Base flush mult
    expect(results[0]?.score).toBe(80); // 20 × 4 = 80
  });
});
