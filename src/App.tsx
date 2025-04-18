import { JokerList } from "@/JokerList";
import { Rounds } from "@/Rounds";
import { HandInfo } from "@/HandInfo";
import { ModeToggle } from "./components/mode-toggle";

export default function App() {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <JokerList />
        <Rounds />
        <ModeToggle />
      </div>
      <HandInfo />
    </>
  );
}
