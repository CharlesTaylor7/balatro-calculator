import { create, type ExtractState } from "zustand";
import { persist, combine } from "zustand/middleware";
import type {
  Joker,
  JokerId,
  JokerName,
  BossBlind,
} from "./calculator";
import { newJoker, newHandInfo } from "./calculator";

type Stake = "white" | "green" | "purple";
export type State = ExtractState<typeof useAppState>;

// TODO:
// configuration:
// - plasma has a different scoring and different blind amounts
// - stake, green stake & purple stake increase the blind amounts
export const useAppState = create(
  persist(
    combine(
      {
        jokers: [] as Joker[],
        rounds: makeArray(4, () => ""),
        handInfo: newHandInfo(),
        stake: "white" as Stake,
        bossBlind: undefined as BossBlind | undefined,
      },
      (set, get) => ({
        setJokers: (jokers: Joker[]) => set({ jokers }),

        deleteJoker: (id: JokerId) =>
          set((state) => ({
            jokers: state.jokers.filter((joker) => joker.id !== id),
          })),

        pushJoker: (name: JokerName | null) =>
          set((state) => ({
            jokers: [...state.jokers, newJoker(name)],
          })),

        // Type-safe update for joker properties
        updateJoker: (index: number, key: keyof Joker, value: unknown) => {
          const { jokers } = get();
          if (index < 0 || index >= jokers.length) return;

          const jokersCopy = [...jokers];

          if (key === "vars") {
            // Handle vars updates based on the joker variant type
            if (isNameUpdate(value)) {
              // If changing the joker name, create a new joker
              jokersCopy[index] = newJoker(value.name);
            } else {
              const joker = { ...jokersCopy[index] };
              const currentVars = joker.vars;

              if (currentVars.kind === "counter" && isCounterUpdate(value)) {
                // Update counter joker
                joker.vars = {
                  ...currentVars,
                  counter: Number(value.counter),
                };
                jokersCopy[index] = joker;
              } else if (
                currentVars.kind === "photograph" &&
                isPhotographUpdate(value)
              ) {
                // Update photograph joker
                joker.vars = {
                  ...currentVars,
                  photograph: Boolean(value.photograph),
                };
                jokersCopy[index] = joker;
              }
            }
          } else if (key === "chips" || key === "mult" || key === "xmult") {
            // Handle direct number property updates
            const joker = { ...jokersCopy[index] };
            joker[key] = Number(value);
            jokersCopy[index] = joker;
          }

          set({ jokers: jokersCopy });
        },
        setHand: (index: number, hand: string) =>
          set((state) => {
            const rounds = [...state.rounds];
            rounds[index] = hand;
            return { rounds };
          }),

        setBossBlind: (bossBlind: BossBlind | undefined) => set({ bossBlind }),

        updateHandInfo: (hand: PokerHand, field: "lvl" | "count", value: number) => 
          set(state => {
            const newHandInfo = { ...state.handInfo };
            newHandInfo[hand][field] = value;
            return { handInfo: newHandInfo };
          }),
      }),
    ),
    {
      name: "balatro",
    },
  ),
);

// Type guards for update operations
function isNameUpdate(value: unknown): value is { name: string | null } {
  return typeof value === "object" && value !== null && "name" in value;
}

function isCounterUpdate(
  value: unknown,
): value is { counter: number | string } {
  return typeof value === "object" && value !== null && "counter" in value;
}

function isPhotographUpdate(
  value: unknown,
): value is { photograph: boolean | string } {
  return typeof value === "object" && value !== null && "photograph" in value;
}

function makeArray<T>(length: number, fn: (k: number) => T) {
  return Array.from({ length }, (_, k) => fn(k));
}
