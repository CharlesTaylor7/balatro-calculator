import { groupBy, maxBy, range } from "lodash";
// TODO:
//
// configuration:
// - plasma has a different scoring and different blind amounts
// - stake, green stake & purple stake increase the blind amounts
//

// TYPES
type Score = { chips: number; mult: number };
type Scored = Score & { name: HandName | null };

type ScoringContext = Score & {
  // levels
  planets: Record<HandName, number>;
  hands: Record<HandName, number>;
};

type AnyJoker = {
  // name is nullable, because plenty of jokers either:
  // have flat scoring: e.x. Jimbo, Gros Michel, etc.
  // have no scoring but have an edition that makes them score
  name: JokerName | null;
  id: string;
  chips: number;
  mult: number;
  polychrome: boolean;
};

type JokerWithContext =
  | { name: "Green Joker"; counter: number }
  | { name: "Ride The Bus"; counter: number }
  | { name: AnyJoker["name"] };

type Joker = AnyJoker & JokerWithContext;

function __assertJokerContextHasJokerName(
  item: JokerWithContext["name"],
): AnyJoker["name"] {
  return item;
}

export type JokerId = Joker["id"];
export type Hand = {
  cards: string;
  chips: number;
  mult: number;
  score: number;
  cumulative: number;
  name: HandName | null;
};

export type HandName = (typeof HANDS)[number];
export type JokerName = (typeof JOKERS)[number];
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
  polychrome: boolean;
}>;

// FUNCTIONS
// ts-nocheck
function score(hand: string, jokers: Joker[]): Scored {
  const cards = parseHand(hand);
  //  nothing matches an empty hand
  if (cards.length === 0) return { name: null, chips: 0, mult: 0 };

  const groups = Object.entries(groupBy(cards, (c) => c.rank)).map((group) => ({
    rank: group[0] as Rank,
    cards: group[1],
  }));

  for (const handName of HANDS) {
    let scoring = HAND_MATCHERS[handName]({ cards, groups });
    if (scoring == null) continue;

    // splash uses all the cards in the initial order
    scoring = jokers.some((j) => j.name === "Splash")
      ? cards
      : scoring.toSorted((a, b) => a.order - b.order);
    console.log("scoring", scoring);

    const { chips, mult } = HAND_SCORING[handName];
    const card_chips = scoring.reduce(
      (acc, card) => acc + rankToChips(card.rank),
      chips,
    );
    const card_mult = scoring.reduce((acc, card) => {
      const mult = acc + card.mult;
      return card.polychrome ? mult * 1.5 : mult;
    }, mult);

    return {
      name: handName,
      chips: card_chips,
      mult: card_mult,
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

export function scoreRounds(rounds: string[], jokers: Joker[]): Hand[] {
  const hands: Hand[] = [];
  let cumulative = 0;
  for (const hand of rounds) {
    const scored = score(hand, jokers);
    const total = scored.chips * scored.mult;
    cumulative += total;
    hands.push({
      ...scored,
      cards: hand,
      score: total,
      cumulative,
    });
  }
  return hands;
}

const CARD_REGEX =
  /(?<rank>[2-9AKQJT])(?<suit>[WCDHS])\s+(C(?<chips>\d+))?\s+(M(?<mult>\d+))?\s+(?<polychrome>[P])?/;

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
    const polychrome = match.groups["polychrome"] != null;
    cards.push({
      order,
      rank,
      suit,
      chips: chips != null ? Number(chips) : 0,
      mult: mult != null ? Number(mult) : 0,
      polychrome,
    });
  }
  return cards;
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

const HAND_MATCHERS: Record<HandName, HandMatcher> = {
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
    hand.cards.filter((c) => c.suit == hand.cards[0].suit)
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

const HAND_SCORING: Record<HandName, Score> = {
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
  "flush-five": { chips: 140, mult: 14 },
  "flush-house": { chips: 160, mult: 16 },
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
] as const;

function visitCard(context: ScoringContext, joker: Joker, card: Card) {}

function visitHand(context: ScoringContext, joker: Joker, hand: Hand) {}
// const SCORING_JOKERS = {
//   // Scaling mult jokers
//   Supernova: {
//     visitHand: (context, hand) => {
//       context.mult += context.hands[hand.name];
//     },
//   },
//   "Green Joker": {
//     visitHand: (context) => {
//       context.mult = context.jokers["Green Joker"]++;
//     },
//   },
//   "Ride The Bus": {
//     visitHand: (context, hand) => {
//       context.jokers["Ride The Bus"] =
//         (context.jokers["Ride The Bus"] || 0) + 1;
//     },
//   },
//
//   // Scaling chips jokers
//   Runner: {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS["straight"](hand)) context.jokers["Runner"] += 15;
//       context.chips += context.jokers["Runner"];
//     },
//   },
//   "Square Joker": {
//     visitHand: (context, hand) => {
//       if (hand.cards.length === 4) context.jokers["Square Joker"] += 4;
//       context.chips += context.jokers["Square Joker"];
//     },
//   },
//
//   // Negative scaling jokers
//   "Blue Joker": {
//     visitHand: (context, hand) => {
//       context.chips += context.deckSize;
//     },
//   },
//   "Ice Cream": {
//     visitHand: (context, hand) => {
//       context.chips += context.jokers.IceCream;
//       context.jokers.IceCream -= 5;
//     },
//   },
//   Popcorn: {
//     visitHand: (context, hand) => {
//       context.mult += context.jokers.Popcorn;
//     },
//   },
//
//   // Flat hand based jokers
//   "Sly Joker": {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS.pair(hand)) context.chips += 50;
//     },
//   },
//   "Jolly Joker": {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS.pair(hand)) context.mult += 8;
//     },
//   },
//   "Clever Joker": {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS["two-pair"](hand)) context.chips += 80;
//     },
//   },
//   "Mad Joker": {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS["two-pair"](hand)) context.mult += 10;
//     },
//   },
//   "Wily Joker": {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS["three-of-a-kind"](hand)) context.chips += 100;
//     },
//   },
//   "Zany Joker": {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS["three-of-a-kind"](hand)) context.mult += 12;
//     },
//   },
//   "Crafty Joker": {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS.flush(hand)) context.chips += 80;
//     },
//   },
//   "Droll Joker": {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS.flush(hand)) context.mult += 10;
//     },
//   },
//   "Devious Joker": {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS.straight(hand)) context.chips += 100;
//     },
//   },
//   "Crazy Joker": {
//     visitHand: (context, hand) => {
//       if (HAND_MATCHERS.straight(hand)) context.mult += 12;
//     },
//   },
//   "Half Joker": {
//     visitHand: (context, hand) => {
//       if (hand.cards.length <= 3) context.mult += 20;
//     },
//   },
//
//   // Per card based jokers
//   Scholar: {
//     visitCard: (context, card) => {
//       if (card.rank === "A") {
//         context.chips += 20;
//         context.mult += 4;
//       }
//     },
//   },
//   "Walkie Talkie": {
//     visitCard: (context, card) => {
//       if (card.rank === "T" || card.rank === "4") {
//         context.chips += 10;
//         context.mult += 4;
//       }
//     },
//   },
//   "Scary Face": {
//     visitCard: (context, card) => {
//       if (card.rank === "J" || card.rank === "Q" || card.rank === "K") {
//         context.chips += 30;
//       }
//     },
//   },
//   "Smiley Joker": {
//     visitCard: (context, card) => {
//       if (card.rank === "J" || card.rank === "Q" || card.rank === "K") {
//         context.mult += 5;
//       }
//     },
//   },
//   "Even Steven": {
//     visitCard: (context, card) => {
//       switch (card.rank) {
//         case "2":
//         case "4":
//         case "6":
//         case "8":
//         case "T":
//           context.mult += 4;
//           return;
//       }
//     },
//   },
//   "Odd Todd": {
//     visitCard: (context, card) => {
//       switch (card.rank) {
//         case "A":
//         case "3":
//         case "5":
//         case "7":
//         case "9":
//           context.chips += 31;
//           return;
//       }
//     },
//   },
//   "Greedy Joker": {
//     visitCard: (context, card) => {
//       if (card.suit === "D") context.mult += 3;
//     },
//   },
//   "Lusty Joker": {
//     visitCard: (context, card) => {
//       if (card.suit === "H") context.mult += 3;
//     },
//   },
//   "Wrathful Joker": {
//     visitCard: (context, card) => {
//       if (card.suit === "S") context.mult += 3;
//     },
//   },
//   "Gluttonous Joker": {
//     visitCard: (context, card) => {
//       if (card.suit === "C") context.mult += 3;
//     },
//   },
//
//   // Misc jokers that affect card behavior rather than scoring
//   Photograph: {
//     visitCard: (context, card) => {
//       if (
//         !context.jokers.Photograph &&
//         (card.rank === "K" || card.rank === "J" || card.rank === "Q")
//       ) {
//         context.jokers.Photograph = true;
//         context.mult *= 2;
//       }
//     },
//   },
// };
