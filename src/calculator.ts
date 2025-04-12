import { groupBy, maxBy, range } from "lodash";
// TODO:
//
// configuration:
// - plasma has a different scoring and different blind amounts
// - stake, green stake & purple stake increase the blind amounts
//

// TYPES
type Score = { chips: number; mult: number };
export type Joker = { name: string; id: string };
export type JokerId = Joker["id"];
export type Hand = {
  cards: string;
  chips: number;
  mult: number;
  score: number;
  cumulative: number;
};

type HAND_NAME = (typeof HANDS)[number];
type HandDetails = {
  groups: { rank: Rank; cards: Card[] }[];
  cards: Card[];
};
type Nullish = null | undefined;
type HandMatcher = (hand: HandDetails) => Card[] | Nullish;

type Rank = (typeof RANKS)[number];
type Suit = "clubs" | "diamonds" | "hearts" | "spades";
type ExtendedSuit = Suit | "wild" | "unknown";

type Card = {
  // order the cards in the hand will score
  order: number;
  rank: Rank;
  suit: ExtendedSuit;

  chips: number;
  mult: number;
  polychrome: boolean;
};

// FUNCTIONS
// ts-nocheck
function score(hand: string, _jokers: Joker[]): Score {
  const cards = parseHand(hand);
  const groups = Object.entries(groupBy(cards, (c) => c.rank)).map((group) => ({
    rank: group[0] as Rank,
    cards: group[1],
  }));

  for (const handName of HANDS) {
    const scoring = HAND_MATCHERS[handName]({ cards, groups });
    if (scoring == null) continue;
    const sorted = scoring.sort((a, b) => a.order - b.order);

    const { chips, mult } = HAND_SCORING[handName];
    const card_chips = sorted.reduce(
      (acc, card) => acc + rankToChips(card.rank),
      chips,
    );
    const card_mult = sorted.reduce((acc, card) => {
      const mult = acc + card.mult;
      return card.polychrome ? mult * 1.5 : mult;
    }, mult);

    return {
      chips: card_chips,
      mult: card_mult,
    };
  }
  // high-card should always match
  throw new Error("no match");
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

export function scoreRounds(rounds: string[], jokers: Joker[]) {
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
  /(?<rank>[2-9AKQJT])(C(?<chips>\d+))?(M(?<mult>\d+))?(?<polychrome>P)?/;

export function parseHand(hand: string): Card[] {
  const rawCards = hand.split(",");
  const cards: Card[] = [];
  for (let order = 0; order < rawCards.length; order++) {
    const raw = rawCards[order];
    const match = raw.match(CARD_REGEX);
    const rank = match!.groups!["rank"] as Rank;
    const suit = "unknown" as Suit;
    const chips = match!.groups!["chips"];
    const mult = match!.groups!["mult"];
    const polychrome = match!.groups!["polychrome"] === "P";
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

const HAND_MATCHERS: Record<HAND_NAME, HandMatcher> = {
  "high-card": (hand) => [maxBy(hand.cards, (c) => rankToChips(c.rank))!],
  pair: (hand) => hand.groups.find((g) => g.cards.length == 2)?.cards,
  "three-of-a-kind": (hand) =>
    hand.groups.find((g) => g.cards.length == 3)?.cards,

  "four-of-a-kind": (hand) =>
    hand.groups.find((g) => g.cards.length == 4)?.cards,

  "five-of-a-kind": (hand) =>
    hand.groups.find((g) => g.cards.length == 5)?.cards,

  "full-house": (hand) => {
    /* eslint-disable */
    const three = hand.groups.find((g) => g.cards.length == 3)?.cards!;
    const two = hand.groups.find((g) => g.cards.length == 2)?.cards!;
    /* eslint-enable */
    return [...three, ...two];
  },

  "two-pair": (hand) =>
    hand.groups.filter((g) => g.cards.length == 2).flatMap((g) => g.cards),
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

const HAND_SCORING: Record<HAND_NAME, Score> = {
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
