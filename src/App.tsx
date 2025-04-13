import { JokerList } from "./JokerList";
import { Rounds } from "./Rounds";

export default function App() {
  return (
    <div className="d-flex align-items-start justify-content-between">
      <JokerList />
      <Rounds />
    </div>
  );
}
