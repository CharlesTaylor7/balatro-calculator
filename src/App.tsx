import { JokerList } from "./JokerList";
import { Rounds } from "./Rounds";

export default function App() {
  return (
    <div className="flex items-start justify-between gap-2">
      <JokerList />
      <Rounds />
    </div>
  );
}
