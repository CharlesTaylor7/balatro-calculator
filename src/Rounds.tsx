import { useAppStore } from "./store";

export function Rounds() {
  const { hands, setHand } = useAppStore();
  return (
    <table>
      <thead>
        <tr>
          <td>#</td>
          <td>Hand</td>
          <td>Chips</td>
          <td>Mult</td>
          <td>Score</td>
          <td>Cumulative</td>
          <td>Type</td>
        </tr>
      </thead>
      <tbody>
        {hands().map((hand, i) => (
          <tr key={i} className="text-nowrap">
            <td>{i + 1}</td>
            <td>
              <input
                value={hand.cards}
                onChange={(e) => setHand(i, e.target.value)}
              />
            </td>
            <td>{hand.chips}</td>
            <td>{hand.mult}</td>
            <td>{hand.score}</td>
            <td>{hand.cumulative}</td>
            <td>{hand.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
