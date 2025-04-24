import { JokerList } from "@/JokerList";
import { Rounds } from "@/Rounds";
import { HandInfo } from "@/HandInfo";
import { ModeToggle } from "./components/mode-toggle";
import { BossBlindSelector } from "./components/boss-blind-selector";

export default function App() {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <BossBlindSelector />
          <JokerList />
        </div>
        <Rounds />
        <ModeToggle />
      </div>
      <HandInfo />
    </>
  );
}
