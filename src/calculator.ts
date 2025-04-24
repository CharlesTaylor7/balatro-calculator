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

type ScoringContext = Score & {
  handInfo: HandInfo;
  jokers: Joker[];
  pareidolia: boolean;
  splash: boolean;
};

// Define a discriminated union for joker variants
export type JokerVariant = CounterJoker | PhotographJoker | SimpleJoker;

// Counter jokers have a counter and display function
export interface CounterJoker {
  kind: "counter";
  name: CounterJokerName;
  counter: number;
  display(): string;
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

type Card = Readonly<{
  // order the cards in the hand will score
  order: number;
  rank: Rank;
  suit: ExtendedSuit;

  chips: number;
  mult: number;
  xmult: number;
}>;

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
          display: function () {
            return `+${this.counter} chips`;
          },
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
          display: function () {
            return `+${this.counter} mult`;
          },
        },
      };

    case "Obelisk":
      return {
        ...baseJoker,
        vars: {
          kind: "counter",
          name,
          counter: 0,
          display: function () {
            return `x${0.2 * this.counter} mult`;
          },
        },
      };

    case "Ride The Bus":
      return {
        ...baseJoker,
        vars: {
          kind: "counter",
          name,
          counter: 0,
          display: function () {
            return `+${this.counter} mult`;
          },
        },
      };

    case "Square Joker":
      return {
        ...baseJoker,
        vars: {
          kind: "counter",
          name,
          counter: 0,
          display: function () {
            return `+${4 * this.counter} chips`;
          },
        },
      };

    case "Runner":
      return {
        ...baseJoker,
        vars: {
          kind: "counter",
          name,
          counter: 0,
          display: function () {
            return `+${15 * this.counter} chips`;
          },
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
  const isInJokers = JOKERS.some(jokerName => jokerName === name);
  return isInJokers && !counterOrPhotographNames.includes(name);
}

function newId() {
  return Math.random().toString(36).slice(2);
}

export function newHandInfo(): HandInfo {
  return Object.fromEntries(
    HANDS.map((h) => [h, { lvl: 0, count: 0 }]),
  ) as HandInfo;
}

function scoreHand(context: ScoringContext, hand: string): Scored | null {
  context.chips = 0;
  context.mult = 0;
  const cards = parseHand(hand);
  console.log("cards", cards);

  //  nothing matches an empty hand
  if (cards.length === 0) return null;

  const groups = Object.entries(groupBy(cards, (c) => c.rank)).map((group) => ({
    rank: group[0] as Rank,
    cards: group[1],
  }));

  for (const handName of HANDS) {
    let scoring = HAND_MATCHERS[handName]({ cards, groups });
    if (scoring == null) continue;

    // splash uses all the cards in the initial order
    scoring = context.splash
      ? cards
      : scoring.toSorted((a, b) => a.order - b.order);

    scorePokerHand(context, handName);
    for (const card of scoring) {
      context.chips += card.chips + rankToChips(card.rank);
      context.mult += card.mult;
      context.mult *= card.xmult;
      for (const joker of context.jokers) {
        visitCard(context, joker, card);
      }
    }
    context.handInfo[handName].count++;
    for (const joker of context.jokers) {
      context.chips += joker.chips;
      context.mult += joker.mult;
      context.mult *= joker.xmult;
      visitHand(context, joker, { name: handName, cards, groups });
    }

    return {
      name: handName,
      chips: context.chips,
      mult: context.mult,
    };
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

export function scoreRounds(
  state: Pick<State, "handInfo" | "jokers" | "rounds">,
): (Hand | null)[] {
  const scoringContext: ScoringContext = {
    chips: 0,
    mult: 0,
    handInfo: state.handInfo,
    jokers: cloneDeep(state.jokers),
    pareidolia: state.jokers.some((j) => j.vars.name === "Pareidolia"),
    splash: state.jokers.some((j) => j.vars.name === "Splash"),
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
    if (!match?.groups) return cards;
    const rank = match.groups["rank"] as Rank;
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
    });
  }
  return cards;
}

function isFaceCard(rank: Rank, context: ScoringContext) {
  return rank === "K" || rank === "Q" || rank === "J" || context.pareidolia;
}

function visitCard(context: ScoringContext, joker: Joker, card: Card) {
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
  const { lvl } = context.handInfo[hand];
  context.chips += HAND_SCORING[hand].chips + lvl * HAND_SCALING[hand].chips;
  context.mult += HAND_SCORING[hand].mult + lvl * HAND_SCALING[hand].mult;
}

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
    if (hand.cards.length !== 5) return;
    const sorted = hand.cards
      .map((c) => rankToOrder(c.rank))
      .toSorted((a, b) => a - b);
    const isStraight = range(4).every((i) => {
      // 5 to A straight
      if (i == 0 && sorted[0] === 14 && sorted[1] === 5) return true;
      // regular straight
      return sorted[i] - sorted[i + 1] == 1;
    });
    if (isStraight) return hand.cards;
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
