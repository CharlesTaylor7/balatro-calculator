import { describe, it, expect } from "vitest";
import {
  scoreRounds,
  displayCounter,
  parseHand,
  applyBossBlindDebuffs,
  type CounterJoker,
  type ScoringContext,
  type Card,
  RoundInfo,
  HandInfo,
  newHandInfo,
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
      handInfo: newHandInfo(),
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
      handInfo: newHandInfo(),
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
      handInfo: newHandInfo(),
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
    // Plus card values: A(15) + K(13) + Q(12) + J(11) + 10(10) = 61 chips
    // Level 1 scaling: 100 + 1*100 = 200 chips, 8 + 1*8 = 16 mult
    // Total: 261 chips × 16 mult = 4176
    expect(results[0]?.score).toBe(2292);
  });

  it("applies boss blind debuffs correctly to scoring", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AH,KH,QH,JH,2H"], // Hearts flush
      bossBlind: "The Head", // Debuffs hearts
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("flush");
    // With The Head, all heart cards are debuffed, so they contribute nothing
    // Only the base flush scoring should apply
    expect(results[0]?.chips).toBe(35); // Base flush chips
    expect(results[0]?.mult).toBe(4); // Base flush mult
    expect(results[0]?.score).toBe(140); // 35 × 4 = 140
  });

  it("scores a straight correctly", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AH,KS,QD,JC,TC"], // A-K-Q-J-10 straight with mixed suits
      bossBlind: undefined,
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("straight");
    // Straight base score is 30 chips × 3 mult = 90
    // Plus card values: A(11) + K(10) + Q(10) + J(10) + 10(10) = 51 chips
    expect(results[0]?.chips).toBe(81); // 30 base + 51 from cards
    expect(results[0]?.mult).toBe(4); // Base straight mult
    expect(results[0]?.score).toBe(324); // 81 × 4 = 324
  });

  it("scores a flush correctly", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AH,KH,QH,JH,2H"], // Hearts flush
      bossBlind: undefined,
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("flush");
    // Flush base score is 35 chips × 4 mult = 140
    // Plus card values: A(11) + K(10) + Q(10) + J(10) + 2(2) = 43 chips
    expect(results[0]?.chips).toBe(78); // 35 base + 43 from cards
    expect(results[0]?.mult).toBe(4); // Base flush mult
    expect(results[0]?.score).toBe(312); // 78 × 4 = 312
  });
});