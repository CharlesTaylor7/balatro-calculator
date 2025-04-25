import { groupBy, maxBy, range, cloneDeep } from "lodash";
import type { State } from "@/store";

// TODO:
//
// configuration:
// - plasma has a different scoring and different blind amounts
// - stake, green stake & purple stake increase the blind amounts
//

// TYPES
type Score = { chips: number; mult: number };
type Scored = Score & { name: PokerHand };

export type HandInfo = Record<PokerHand, { lvl: number; count: number }>;

export type ScoringContext = Score & {
  handInfo: HandInfo;
  jokers: Joker[];
  pareidolia: boolean;
  splash: boolean;
  bossBlind?: BossBlind;
  playedHandTypes: Set<PokerHand>; // Track played hand types for The Eye and The Mouth
};

// Define a discriminated union for joker variants
export type JokerVariant = CounterJoker | PhotographJoker | SimpleJoker;

// Counter jokers have a counter
export interface CounterJoker {
  kind: "counter";
  name: CounterJokerName;
  counter: number;
}

// Photograph joker has a photograph boolean
export interface PhotographJoker {
  kind: "photograph";
  name: "Photograph";
  photograph: boolean;
}

// Simple jokers just have a name
export interface SimpleJoker {
  kind: "simple";
  name: SimpleJokerName | null;
}

// The joker type with common properties and the variant
export interface Joker {
  id: string;
  chips: number;
  mult: number;
  xmult: number;
  vars: JokerVariant;
}

export type JokerId = Joker["id"];

// Names of jokers that use a counter
export type CounterJokerName =
  | "Green Joker"
  | "Ride The Bus"
  | "Obelisk"
  | "Runner"
  | "Square Joker"
  | "Ice Cream";

// All joker names excluding counter jokers and photograph
export type SimpleJokerName = Exclude<
  JokerName,
  CounterJokerName | "Photograph"
>;

export type Hand = {
  chips: number;
  mult: number;
  score: number;
  cumulative: number;
  name: PokerHand;
};

export type PokerHand = (typeof HANDS)[number];
export type JokerName = (typeof JOKERS)[number];
type HandNameAndDetails = { name: PokerHand } & HandDetails;
type HandDetails = Readonly<{
  groups: { rank: Rank; cards: Card[] }[];
  cards: Card[];
}>;
type Nullish = null | undefined;
type HandMatcher = (hand: HandDetails) => Card[] | Nullish;

export type Rank = (typeof RANKS)[number];
export type Suit = "C" | "D" | "H" | "S";
// W means wild
export type ExtendedSuit = Suit | "W" | Nullish;

// Base card properties that are readonly
export type Card = {
  // order the cards in the hand will score
  order: number;
  rank: Rank;
  suit: ExtendedSuit;
  chips: number;
  mult: number;
  xmult: number;
  debuffed: boolean;
};

// FUNCTIONS
export function newJoker(name: string | null): Joker {
  const id = newId();
  const baseJoker = {
    id,
    chips: 0,
    mult: 0,
    xmult: 1,
  };

  if (!name) {
    return {
      ...baseJoker,
      vars: {
        kind: "simple",
        name: null,
      },
    };
  }

  switch (name) {
    case "Ice Cream":
      return {
        ...baseJoker,
        vars: {
          kind: "counter",
          name,
          counter: 20,
        },
      };

    case "Photograph":
      return {
        ...baseJoker,
        vars: {
          kind: "photograph",
          name,
          photograph: false,
        },
      };

    case "Green Joker":
      return {
        ...baseJoker,
        vars: {
          kind: "counter",
          name,
          counter: 0,
        },
      };

    case "Obelisk":
      return {
        ...baseJoker,
        vars: {
          kind: "counter",
          name,
          counter: 0,
        },
      };

    case "Ride The Bus":
      return {
        ...baseJoker,
        vars: {
          kind: "counter",
          name,
          counter: 0,
        },
      };

    case "Square Joker":
      return {
        ...baseJoker,
        vars: {
          kind: "counter",
          name,
          counter: 0,
        },
      };

    case "Runner":
      return {
        ...baseJoker,
        vars: {
          kind: "counter",
          name,
          counter: 0,
        },
      };

    default:
      // Type guard to ensure name is a SimpleJokerName
      if (isSimpleJokerName(name)) {
        return {
          ...baseJoker,
          vars: {
            kind: "simple",
            name,
          },
        };
      }
      // Fallback for unknown names
      return {
        ...baseJoker,
        vars: {
          kind: "simple",
          name: null,
        },
      };
  }
}

// Type guard to check if a string is a SimpleJokerName
function isSimpleJokerName(name: string): name is SimpleJokerName {
  // This function checks if the name is in JOKERS but not in the counter jokers or "Photograph"
  const counterOrPhotographNames: string[] = [
    "Green Joker",
    "Ride The Bus",
    "Obelisk",
    "Runner",
    "Square Joker",
    "Ice Cream",
    "Photograph",
  ];
  // Check if name is in JOKERS array
  const isInJokers = JOKERS.some((jokerName) => jokerName === name);
  return isInJokers && !counterOrPhotographNames.includes(name);
}

function newId() {
  return Math.random().toString(36).slice(2);
}

export function newHandInfo(partialHandInfo?: Partial<HandInfo>): HandInfo {
  // Create base hand info with all hands at level 1
  // eslint-disable-next-line no-type-assertion/no-type-assertion
  const baseHandInfo = Object.fromEntries(
    HANDS.map((h) => [h, { lvl: 1, count: 0 }]),
  ) as HandInfo;

  // If partial hand info is provided, merge it with the base
  if (partialHandInfo) {
    return { ...baseHandInfo, ...partialHandInfo };
  }

  return baseHandInfo;
}

/**
 * Scores a given poker hand based on the provided context.
 *
 * This function processes a poker hand string, applying various scoring rules,
 * debuffs, and joker effects to calculate the final chip and multiplier values.
 * It modifies the `context` object to reflect these values and returns
 * a `Scored` object if a valid hand is identified, otherwise throws an error.
 *
 * @param context - The scoring context that holds current chip and multiplier totals,
 *                  joker effects, and hand metadata.
 * @param hand - A string representation of the poker hand to be scored.
 *
 * @returns A `Scored` object containing the final hand name, chip value,
 *          and multiplier if a valid hand is found; otherwise, null.
 *
 * @throws Error if no matching hand is found.
 */
export function scoreHand(
  context: ScoringContext,
  hand: string,
): Scored | null {
  // Parse the hand string into cards
  const cards = parseHand(hand);

  // Check for The Psychic boss blind (must play 5 cards)
  if (context.bossBlind === "The Psychic" && cards.length < 5) {
    return null;
  }

  // Apply boss blind debuffs to cards
  applyBossBlindDebuffs(context, cards);

  // Group cards by rank for hand detection
  const groups = Object.values(groupBy(cards, (card) => card.rank)).map(
    (cards) => ({ rank: cards[0].rank, cards }),
  );

  // Sort groups by size (descending) then by rank value (descending)
  groups.sort((a, b) => {
    const sizeA = a.cards.length;
    const sizeB = b.cards.length;
    if (sizeA !== sizeB) return sizeB - sizeA;
    return rankToOrder(b.rank) - rankToOrder(a.rank);
  });

  // Try to match the hand against known poker hands
  for (const handName of HANDS) {
    const handCards = HAND_MATCHERS[handName]({ cards, groups });
    if (handCards) {
      // Check for The Eye boss blind (no repeat hand types)
      if (
        context.bossBlind === "The Eye" &&
        context.playedHandTypes.has(handName)
      ) {
        return null;
      }

      // Check for The Mouth boss blind (only one hand type allowed)
      if (
        context.bossBlind === "The Mouth" &&
        context.playedHandTypes.size > 0 &&
        !context.playedHandTypes.has(handName)
      ) {
        return null;
      }

      // Add this hand type to the played types
      context.playedHandTypes.add(handName);

      // Update hand count in context
      context.handInfo[handName].count++;

      // Apply base scoring for the hand
      scorePokerHand(context, handName);

      // Add card values to chips (only for non-debuffed cards)
      for (const card of cards) {
        if (!card.debuffed) {
          context.chips += rankToChips(card.rank) + card.chips;
          context.mult += card.mult;
          context.mult *= card.xmult;
        }
      }

      // Apply joker effects
      for (const joker of context.jokers) {
        // Add base joker values
        context.chips += joker.chips;
        context.mult += joker.mult;
        context.mult *= joker.xmult;

        // Apply joker effects to each non-debuffed card
        for (const card of cards) {
          if (!card.debuffed) {
            visitCard(context, joker, card);
          }
        }

        // Apply joker effects to the hand as a whole
        visitHand(context, joker, { name: handName, cards, groups });
      }

      return {
        name: handName,
        chips: context.chips,
        mult: context.mult,
      };
    }
  }
  throw new Error("no matching hand");
}

function rankToOrder(rank: Rank): number {
  switch (rank) {
    case "2":
      return 2;
    case "3":
      return 3;
    case "4":
      return 4;
    case "5":
      return 5;
    case "6":
      return 6;
    case "7":
      return 7;
    case "8":
      return 8;
    case "9":
      return 9;
    case "T":
      return 10;
    case "J":
      return 11;
    case "Q":
      return 12;
    case "K":
      return 13;
    case "A":
      return 14;
    default:
      rank satisfies never;
      throw new Error("unreachable");
  }
}
function rankToChips(rank: Rank) {
  switch (rank) {
    case "T":
    case "J":
    case "Q":
    case "K":
      return 10;
    case "A":
      return 11;
    default:
      return Number(rank);
  }
}

export type RoundInfo = Pick<
  State,
  "handInfo" | "jokers" | "rounds" | "bossBlind"
>;
export function scoreRounds(state: RoundInfo): (Hand | null)[] {
  const scoringContext: ScoringContext = {
    chips: 0,
    mult: 0,
    handInfo: cloneDeep(state.handInfo),
    jokers: cloneDeep(state.jokers),
    pareidolia: state.jokers.some((j) => j.vars.name === "Pareidolia"),
    splash: state.jokers.some((j) => j.vars.name === "Splash"),
    bossBlind: state.bossBlind,
    playedHandTypes: new Set<PokerHand>(), // Track played hand types for The Eye and The Mouth
  };

  const hands: (Hand | null)[] = [];
  let cumulative = 0;
  for (const hand of state.rounds) {
    const scored = scoreHand(scoringContext, hand);

    if (scored == null) {
      hands.push(null);
    } else {
      const total = scored.chips * scored.mult;
      cumulative += total;
      hands.push({
        ...scored,
        score: total,
        cumulative,
      });
    }
  }
  return hands;
}

const CARD_REGEX =
  /(?<rank>[2-9AKQJT])(?<suit>[WCDHS])?\s*(C(?<chips>\d+))?\s*(M(?<mult>\d+))?\s*(X(?<xmult>[\d.]+))?/;

export function parseHand(hand: string): Card[] {
  const rawCards = hand.split(",");
  const cards: Card[] = [];
  for (let order = 0; order < rawCards.length; order++) {
    const raw = rawCards[order];
    const match = raw.match(CARD_REGEX);
    if (!match?.groups) continue;
    // eslint-disable-next-line no-type-assertion/no-type-assertion
    const rank = match.groups["rank"] as Rank;
    // eslint-disable-next-line no-type-assertion/no-type-assertion
    const suit = match.groups["suit"] as ExtendedSuit;
    const chips = match.groups["chips"];
    const mult = match.groups["mult"];
    const xmult = match.groups["xmult"];
    cards.push({
      order,
      rank,
      suit,
      chips: chips != null ? Number(chips) : 0,
      mult: mult != null ? Number(mult) : 0,
      xmult: xmult != null ? Number(xmult) : 1,
      debuffed: false, // Initialize all cards as not debuffed
    });
  }
  return cards;
}

function isFaceCard(rank: Rank, context: ScoringContext) {
  return rank === "K" || rank === "Q" || rank === "J" || context.pareidolia;
}

// Apply boss blind debuffs to cards in a hand
// Display function for counter jokers
export function displayCounter(joker: CounterJoker): string {
  const { name, counter } = joker;

  switch (name) {
    case "Ice Cream":
      return `+${5 * counter} chips`;
    case "Green Joker":
      return `+${counter} mult`;
    case "Ride The Bus":
      return `+${counter} mult`;
    case "Obelisk":
      return `x${(0.2 * counter).toFixed(1)} mult`;
    case "Square Joker":
      return `+${4 * counter} chips`;
    case "Runner":
      return `+${15 * counter} chips`;
    default:
      return `${counter}`;
  }
}

export function applyBossBlindDebuffs(
  context: ScoringContext,
  cards: Card[],
): void {
  if (!context.bossBlind) return;

  for (const card of cards) {
    // Check if this card should be debuffed based on the boss blind
    switch (context.bossBlind) {
      case "The Club":
        // Debuff if suit is Club, Wild, or null/undefined (unknown)
        if (card.suit === "C" || card.suit === "W" || card.suit == null) {
          card.debuffed = true;
        }
        break;
      case "The Goad":
        // Debuff if suit is Spade, Wild, or null/undefined (unknown)
        if (card.suit === "S" || card.suit === "W" || card.suit == null) {
          card.debuffed = true;
        }
        break;
      case "The Window":
        // Debuff if suit is Diamond, Wild, or null/undefined (unknown)
        if (card.suit === "D" || card.suit === "W" || card.suit == null) {
          card.debuffed = true;
        }
        break;
      case "The Head":
        // Debuff if suit is Heart, Wild, or null/undefined (unknown)
        if (card.suit === "H" || card.suit === "W" || card.suit == null) {
          card.debuffed = true;
        }
        break;
      case "The Plant":
        // Debuff if card is a face card (J, Q, K) or if pareidolia is active
        if (isFaceCard(card.rank, context)) {
          card.debuffed = true;
        }
        break;
    }
  }
}

function visitCard(context: ScoringContext, joker: Joker, card: Card) {
  // Skip debuffed cards
  if (card.debuffed) {
    return;
  }
  switch (joker.vars.name) {
    case "Scholar":
      if (card.rank === "A") {
        context.chips += 20;
        context.mult += 4;
      }
      return;
    case "Walkie Talkie":
      if (card.rank === "T" || card.rank === "4") {
        context.chips += 10;
        context.mult += 4;
      }
      return;
    case "Scary Face":
      if (isFaceCard(card.rank, context)) {
        context.chips += 30;
      }
      return;
    case "Smiley Joker":
      if (isFaceCard(card.rank, context)) {
        context.mult += 5;
      }
      return;
    case "Even Steven":
      switch (card.rank) {
        case "2":
        case "4":
        case "6":
        case "8":
        case "T":
          context.mult += 4;
          return;
      }
      return;
    case "Odd Todd":
      switch (card.rank) {
        case "A":
        case "3":
        case "5":
        case "7":
        case "9":
          context.chips += 31;
          return;
      }
      return;
    case "Greedy Joker":
      if (card.suit === "D") context.mult += 3;
      return;
    case "Lusty Joker":
      if (card.suit === "H") context.mult += 3;
      return;
    case "Wrathful Joker":
      if (card.suit === "S") context.mult += 3;
      return;
    case "Gluttonous Joker":
      if (card.suit === "C") context.mult += 3;
      return;

    case "Photograph":
      if (
        !joker.vars.photograph &&
        (card.rank === "K" || card.rank === "J" || card.rank === "Q")
      ) {
        joker.vars.photograph = true;
        context.mult *= 2;
      }
      return;
  }
}

function visitHand(
  context: ScoringContext,
  joker: Joker,
  hand: HandNameAndDetails,
) {
  switch (joker.vars.name) {
    case "Green Joker":
      context.mult += joker.vars.counter++;
      return;

    case "Ride The Bus":
      context.mult += joker.vars.counter++;
      return;

    case "Supernova":
      context.mult += context.handInfo[hand.name].count;
      return;
    case "Obelisk": {
      const handCounts = Object.entries(context.handInfo).map(
        // eslint-disable-next-line no-type-assertion/no-type-assertion
        ([h, o]) => [h, o.count] as [PokerHand, number],
      );
      const max = Math.max(...handCounts.map((x) => x[1]));
      const mostPlayed = handCounts
        .filter((pair) => pair[1] === max)
        .map((pair) => pair[0]);
      if (mostPlayed.includes(hand.name)) {
        joker.vars.counter = 0;
      } else {
        joker.vars.counter++;
      }
      context.mult *= joker.vars.counter * 0.2;
      return;
    }

    case "Square Joker":
      if (hand.cards.length === 4) joker.vars.counter++;
      context.chips += joker.vars.counter * 4;
      return;

    case "Ice Cream":
      joker.vars.counter--;
      context.chips += joker.vars.counter * 5;
      return;

    case "Sly Joker":
      if (HAND_MATCHERS.pair(hand)) context.chips += 50;
      return;

    case "Jolly Joker":
      if (HAND_MATCHERS.pair(hand)) context.mult += 8;
      return;

    case "Clever Joker":
      if (HAND_MATCHERS["two-pair"](hand)) context.chips += 80;
      return;

    case "Mad Joker":
      if (HAND_MATCHERS["two-pair"](hand)) context.mult += 10;
      return;

    case "Wily Joker":
      if (HAND_MATCHERS["three-of-a-kind"](hand)) context.chips += 100;
      return;

    case "Zany Joker":
      if (HAND_MATCHERS["three-of-a-kind"](hand)) context.mult += 12;
      return;

    case "Crafty Joker":
      if (HAND_MATCHERS.flush(hand)) context.chips += 80;
      return;

    case "Droll Joker":
      if (HAND_MATCHERS.flush(hand)) context.mult += 10;
      return;

    case "Devious Joker":
      if (HAND_MATCHERS.straight(hand)) context.chips += 100;
      return;

    case "Crazy Joker":
      if (HAND_MATCHERS.straight(hand)) context.mult += 12;
      return;

    case "Half Joker":
      if (hand.cards.length <= 3) context.mult += 20;
      return;
  }
}

function scorePokerHand(context: ScoringContext, hand: PokerHand) {
  let lvl = context.handInfo[hand].lvl;
  let baseChips = HAND_SCORING[hand].chips;
  let baseMult = HAND_SCORING[hand].mult;

  // Apply boss blind effects
  if (context.bossBlind) {
    switch (context.bossBlind) {
      case "The Arm":
        // Decrease level by 1 (minimum 1)
        lvl = Math.max(1, lvl - 1);
        break;
      case "The Flint":
        // Base chips and mult are halved
        baseChips = Math.floor(baseChips / 2);
        baseMult = Math.floor(baseMult / 2);
        break;
      // Other boss blinds affect cards, not the hand scoring directly
      // They would be applied during card processing
    }
  }
  // Apply level scaling
  let scaling = lvl - 1;

  context.chips += baseChips + scaling * HAND_SCALING[hand].chips;
  context.mult += baseMult + scaling * HAND_SCALING[hand].mult;
}

// Boss Blind Types
export const BOSS_BLINDS = [
  "The Arm",
  "The Club",
  "The Psychic",
  "The Goad",
  "The Window",
  "The Eye",
  "The Mouth",
  "The Plant",
  "The Head",
  "The Flint",
] as const;

export type BossBlind = (typeof BOSS_BLINDS)[number];

// Descriptions of boss blind effects
export const BOSS_BLIND_DESCRIPTIONS: Record<BossBlind, string> = {
  "The Arm": "Decrease level of played poker hand by 1",
  "The Club": "All Club cards are debuffed",
  "The Psychic": "Must play 5 cards (not all cards need to score)",
  "The Goad": "All Spade cards are debuffed",
  "The Window": "All Diamond cards are debuffed",
  "The Eye": "No repeat hand types this round",
  "The Mouth": "Only one hand type can be played this round",
  "The Plant": "All face cards are debuffed",
  "The Head": "All Heart cards are debuffed",
  "The Flint": "Base Chips and Mult for played poker hands are halved",
};

// CONSTANTS
const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
] as const;

const HANDS = [
  "flush-five",
  "flush-house",
  "five-of-a-kind",
  "straight-flush",
  "four-of-a-kind",
  "full-house",
  "flush",
  "straight",
  "three-of-a-kind",
  "two-pair",
  "pair",
  "high-card",
] as const;

const HAND_MATCHERS: Record<PokerHand, HandMatcher> = {
  "high-card": (hand) => {
    if (hand.cards.length === 0) return null;
    // eslint-disable-next-line no-type-assertion/no-type-assertion
    return [maxBy(hand.cards, (c) => rankToChips(c.rank))!];
  },
  pair: (hand) => hand.groups.find((g) => g.cards.length == 2)?.cards,
  "three-of-a-kind": (hand) =>
    hand.groups.find((g) => g.cards.length == 3)?.cards,

  "four-of-a-kind": (hand) =>
    hand.groups.find((g) => g.cards.length == 4)?.cards,

  "five-of-a-kind": (hand) =>
    hand.groups.find((g) => g.cards.length == 5)?.cards,

  "full-house": (hand) => {
    const three = hand.groups.find((g) => g.cards.length == 3)?.cards;
    const two = hand.groups.find((g) => g.cards.length == 2)?.cards;

    return three && two ? [...three, ...two] : null;
  },

  "two-pair": (hand) => {
    const pairs = hand.groups
      .filter((g) => g.cards.length == 2)
      .flatMap((g) => g.cards);

    return pairs.length === 4 ? pairs : null;
  },
  flush: (hand) =>
    hand.cards.length == 5 &&
    hand.cards.every((c) => c.suit != null) &&
    hand.cards.every(
      (c) =>
        c.suit == "W" || c.suit == hand.cards.find((c) => c.suit != "W")?.suit,
    )
      ? hand.cards
      : null,
  straight: (hand) => {
    if (hand.cards.length !== 5) return null;
    const sorted = hand.cards
      .map((c) => rankToOrder(c.rank))
      .toSorted((a, b) => b - a);

    // Check for A-5-4-3-2 straight (wheel straight)
    if (
      sorted[0] === 14 &&
      sorted[1] === 5 &&
      sorted[2] === 4 &&
      sorted[3] === 3 &&
      sorted[4] === 2
    ) {
      return hand.cards;
    }

    const isRegularStraight = range(4).every(
      (i) => sorted[i] === sorted[i + 1] + 1,
    );
    if (isRegularStraight) return hand.cards;

    return null;
  },
  "straight-flush": (hand) =>
    HAND_MATCHERS.flush(hand) && HAND_MATCHERS.straight(hand),

  "flush-five": (hand) =>
    HAND_MATCHERS.flush(hand) && HAND_MATCHERS["five-of-a-kind"](hand),

  "flush-house": (hand) =>
    HAND_MATCHERS.flush(hand) && HAND_MATCHERS["full-house"](hand),
};

const HAND_SCALING: Record<PokerHand, Score> = {
  "high-card": { chips: 10, mult: 1 },
  pair: { chips: 15, mult: 1 },
  "two-pair": { chips: 20, mult: 1 },
  "three-of-a-kind": { chips: 20, mult: 2 },
  straight: { chips: 30, mult: 3 },
  flush: { chips: 15, mult: 2 },
  "full-house": { chips: 25, mult: 2 },
  "four-of-a-kind": { chips: 30, mult: 3 },
  "straight-flush": { chips: 40, mult: 4 },
  "five-of-a-kind": { chips: 35, mult: 3 },
  "flush-house": { chips: 40, mult: 4 },
  "flush-five": { chips: 50, mult: 3 },
};

const HAND_SCORING: Record<PokerHand, Score> = {
  "high-card": { chips: 5, mult: 1 },
  pair: { chips: 10, mult: 2 },
  "two-pair": { chips: 20, mult: 2 },
  "three-of-a-kind": { chips: 30, mult: 3 },
  straight: { chips: 30, mult: 4 },
  flush: { chips: 35, mult: 4 },
  "full-house": { chips: 40, mult: 4 },
  "four-of-a-kind": { chips: 60, mult: 7 },
  "straight-flush": { chips: 100, mult: 8 },
  "five-of-a-kind": { chips: 120, mult: 12 },
  "flush-house": { chips: 140, mult: 14 },
  "flush-five": { chips: 160, mult: 16 },
};

// List is intentionally not exhaustive.
// focused on variable scoring jokers only,
// flat chips/mult/xmult can be added separately
export const JOKERS = [
  // scaling mult
  "Supernova",
  "Green Joker",
  "Ride The Bus",
  // scaling chips,
  "Runner",
  "Square Joker",
  // negative scaling,
  "Blue Joker",
  "Ice Cream",
  "Popcorn",
  // flat hand based
  "Sly Joker", // pair: +50 chips
  "Jolly Joker", // pair: +8 mult
  "Clever Joker", // two-pair: +80 chips
  "Mad Joker", // two-pair: +10 mult
  "Wily Joker", // three-of-a-kind: +100 chips
  "Zany Joker", // three-of-a-kind: +12 mult
  "Crafty Joker", // flush: +80 chips
  "Droll Joker", // flush: +10 mult
  "Devious Joker", // straight: +100 chips
  "Crazy Joker", // straight: +12 mult
  "Half Joker", // <3 cards: +20 mult
  // per card based
  "Scholar", // ace: +20 chips, +4 mult
  "Walkie Talkie", // 10/4: +10 chips, +4 mult
  "Scary Face", // face: +30 chips
  "Smiley Joker", // face: +5 mult
  "Even Steven", // even: +4 mult
  "Odd Todd", // odd: +31 chips
  "Greedy Joker", // diamond: +3 mult
  "Lusty Joker", // heart: +3 mult
  "Wrathful Joker", // spade: +3 mult
  "Gluttonous Joker", // club: +3 mult
  //misc
  "Obelisk",
  "Hanging Chad",
  "Photograph",
  "Misprint",
  "Hanging Fist",
  "Splash",
  "Pareidolia",
] as const;
