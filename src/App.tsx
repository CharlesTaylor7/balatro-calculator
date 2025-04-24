import { JokerList } from "@/JokerList";
import { Rounds } from "@/Rounds";
import { ModeToggle } from "./components/mode-toggle";
import { BossBlindSelector } from "./components/boss-blind-selector";
import { HandCountTable } from "./components/hand-planet-table";

export default function App() {
  return (
    <>
      <div className="flex items-start justify-start gap-2">
        <div className="flex flex-col gap-2">
          <JokerList />
        </div>

        <div className="flex flex-col gap-2">
          <Rounds />
          <BossBlindSelector />
          <ModeToggle />
        </div>
        <HandCountTable />
      </div>
    </>
  );
}
