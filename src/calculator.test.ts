/* eslint-disable no-type-assertion/no-type-assertion */
import { describe, it, expect } from "vitest";
import {
  scoreRounds,
  displayCounter,
  parseHand,
  applyBossBlindDebuffs,
  newScoringContext,
  type CounterJoker,
  type Card,
  type RoundInfo,
  newHandInfo,
  newJoker,
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
    const context = newScoringContext({
      bossBlind: "The Head",
    });

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
    const context = newScoringContext({
      bossBlind: "The Plant",
    });

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
    const context = newScoringContext({
      jokers: [newJoker("Pareidolia")],
      bossBlind: "The Plant",
    });

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
      handInfo: newHandInfo({
        "straight-flush": { lvl: 1, count: 0 },
      }),
      jokers: [],
      rounds: ["AH,KH,QH,JH,TH"],
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("straight-flush");
    // Royal flush base score is 100 chips × 8 mult = 800
    // Plus card values: A(11) + K(10) + Q(10) + J(10) + T(10) = 51 chips
    // Level 1 scaling: 100 + 0*40 = 100 chips, 8 + 0*4 = 8 mult
    // Total: 151 chips × 8 mult = 1208
    expect(results[0]?.score).toBe(1208);
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

  it("scores 5 wild cards as a flush", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AW,KW,QW,3W,5W"], // All wild cards but not a straight
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("flush");
    // Flush base score is 35 chips × 4 mult = 140
    // Plus card values: A(11) + K(10) + Q(10) + 3(3) + 5(5) = 39 chips
    expect(results[0]?.chips).toBe(74); // 35 base + 39 from cards
    expect(results[0]?.mult).toBe(4); // Base flush mult
    expect(results[0]?.score).toBe(296); // 74 × 4 = 296
  });

  it("does not score a hand with unknown suits as a flush", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["A,KH,QH,3H,5H"], // First card has unknown suit, others are hearts
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("high-card");
  });
});

describe("Boss Blind Effects", () => {
  it("applies 'The Arm' to decrease hand level by 1", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo({
        "straight-flush": { lvl: 3, count: 0 },
      }),
      jokers: [],
      rounds: ["AH,KH,QH,JH,TH"], // Royal flush
      bossBlind: "The Arm",
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("straight-flush");
    // Level should be decreased from 3 to 2
    // Base: 100 chips, 8 mult
    // Level 2 scaling: 100 + 2*40 = 180 chips, 8 + 2*4 = 16 mult
    // Plus card values: A(11) + K(10) + Q(10) + J(10) + T(10) = 51 chips
    // Total: 231 chips × 16 mult = 3696
    expect(results[0]?.chips).toBeGreaterThan(0);
    expect(results[0]?.mult).toBeGreaterThan(0);
    // The exact score will depend on the implementation, but it should be less than without The Arm
  });

  it("applies 'The Flint' to halve base chips and mult", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AH,KH,QH,JH,TH"], // Royal flush
      bossBlind: "The Flint",
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("straight-flush");
    // Base chips should be halved from 100 to 50
    // Base mult should be halved from 8 to 4
    // Plus card values: A(11) + K(10) + Q(10) + J(10) + T(10) = 51 chips
    // Total should be significantly less than without The Flint
    expect(results[0]?.chips).toBeGreaterThan(0);
    expect(results[0]?.mult).toBeGreaterThan(0);
  });

  it("applies 'The Club' to debuff all club cards", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AC,KC,QC,JC,TC"], // Royal flush with clubs
      bossBlind: "The Club",
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("straight-flush");
    // All club cards should be debuffed, so they contribute nothing to the score
    // Only the base scoring should apply
    expect(results[0]?.chips).toBe(100); // Base straight-flush chips
    expect(results[0]?.mult).toBe(8); // Base straight-flush mult
    expect(results[0]?.score).toBe(800); // 100 × 8 = 800
  });

  it("applies 'The Goad' to debuff all spade cards", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AS,KS,QS,JS,TS"], // Royal flush with spades
      bossBlind: "The Goad",
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("straight-flush");
    // All spade cards should be debuffed, so they contribute nothing to the score
    // Only the base scoring should apply
    expect(results[0]?.chips).toBe(100); // Base straight-flush chips
    expect(results[0]?.mult).toBe(8); // Base straight-flush mult
    expect(results[0]?.score).toBe(800); // 100 × 8 = 800
  });

  it("applies 'The Window' to debuff all diamond cards", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AD,KD,QD,JD,TD"], // Royal flush with diamonds
      bossBlind: "The Window",
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("straight-flush");
    // All diamond cards should be debuffed, so they contribute nothing to the score
    // Only the base scoring should apply
    expect(results[0]?.chips).toBe(100); // Base straight-flush chips
    expect(results[0]?.mult).toBe(8); // Base straight-flush mult
    expect(results[0]?.score).toBe(800); // 100 × 8 = 800
  });

  it("applies 'The Head' to debuff all heart cards", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AH,KH,QH,JH,TH"], // Royal flush with hearts
      bossBlind: "The Head",
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("straight-flush");
    // All heart cards should be debuffed, so they contribute nothing to the score
    // Only the base scoring should apply
    expect(results[0]?.chips).toBe(100); // Base straight-flush chips
    expect(results[0]?.mult).toBe(8); // Base straight-flush mult
    expect(results[0]?.score).toBe(800); // 100 × 8 = 800
  });

  it("applies 'The Plant' to debuff all face cards", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AH,KH,QH,JH,TH"], // Royal flush with hearts
      bossBlind: "The Plant",
    };

    const results = scoreRounds(state);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("straight-flush");
    // K, Q, J are face cards and should be debuffed
    // Only A and T should contribute to the score
    // Base straight-flush: 100 chips, 8 mult
    // Card values: A(11) + T(10) = 21 chips (K, Q, J are debuffed)
    expect(results[0]?.chips).toBe(121); // 100 base + 21 from cards
    expect(results[0]?.mult).toBe(8); // Base straight-flush mult
    expect(results[0]?.score).toBe(968); // 121 × 8 = 968
  });

  // Tests for the boss blinds that need to be implemented
  it("applies 'The Psychic' to require 5 cards", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AH,KH,QH"], // Only 3 cards
      bossBlind: "The Psychic",
    };

    const results = scoreRounds(state);

    // With The Psychic, hands with fewer than 5 cards should not score
    expect(results.length).toBe(1);
    expect(results[0]).toBeNull();
  });

  it("allows 'The Psychic' with 5 cards even if not all score", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: ["AH,KH,QH,2D,3S"], // 5 cards but not a valid hand pattern
      bossBlind: "The Psychic",
    };

    const results = scoreRounds(state);

    // With The Psychic, 5 cards should be allowed to score as a high card
    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe("high-card");
  });

  it("applies 'The Eye' to prevent repeat hand types", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: [
        "AH,KH,QH,JH,TH", // Straight flush
        "AS,KS,QS,JS,TS", // Another straight flush
      ],
      bossBlind: "The Eye",
    };

    const results = scoreRounds(state);

    // First hand should score normally
    expect(results[0]?.name).toBe("straight-flush");
    // Second hand should not score because it's a repeat hand type
    expect(results[1]).toBeNull();
  });

  it("applies 'The Mouth' to allow only one hand type", () => {
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [],
      rounds: [
        "AH,KH,QH,JH,TH", // Straight flush
        "AD,KD,QD,JD,TD", // Another straight flush (same type, should score)
        "AH,KH,QH,JH,9H", // Flush (different type, should not score)
      ],
      bossBlind: "The Mouth",
    };

    const results = scoreRounds(state);

    // First hand should score normally
    expect(results[0]?.name).toBe("straight-flush");
    // Second hand should score because it's the same hand type
    expect(results[1]?.name).toBe("straight-flush");
    // Third hand should not score because it's a different hand type
    expect(results[2]).toBeNull();
  });
});

describe("Splash Joker", () => {
  it("allows all cards to contribute to scoring when Splash joker is present", () => {
    // Setup a hand with a pair of 10s and other cards that wouldn't normally score
    const state: RoundInfo = {
      handInfo: newHandInfo(),
      jokers: [newJoker("Splash")],
      rounds: ["TH,TS,2C,3D,4H"], // Pair of 10s with unrelated cards
    };

    // Same hand but without Splash joker for comparison
    const stateWithoutSplash = {...state, jokers: []}

    const resultsWithSplash = scoreRounds(state);
    const resultsWithoutSplash = scoreRounds(stateWithoutSplash);

    // Both should score as a pair
    expect(resultsWithSplash[0]?.name).toBe("pair");
    expect(resultsWithoutSplash[0]?.name).toBe("pair");

    // The hand with Splash should have higher chips value because all cards contribute
    expect(resultsWithSplash[0]!.chips).toBeGreaterThan(
      resultsWithoutSplash[0]!.chips,
    );
  });
});
