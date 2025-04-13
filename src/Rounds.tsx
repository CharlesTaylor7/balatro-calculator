import { useAppStore } from "./store";

export function Rounds() {
  const { getScoredHands, setHand } = useAppStore();
  const hands = getScoredHands();
  return (
    <table className="table table-info table-striped">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Hand</th>
          <th scope="col">Chips</th>
          <th scope="col">Mult</th>
          <th scope="col">Score</th>
          <th scope="col">Cumulative</th>
          <th scope="col">Type</th>
        </tr>
      </thead>
      <tbody>
        {hands.map((hand, i) => (
          <tr key={i} className="text-nowrap">
            <th>{i + 1}</th>
            <td>
              <input
                className="form-control form-control-sm"
                value={hand?.cards}
                onChange={(e) => setHand(i, e.target.value)}
              />
            </td>
            <td className="text-end">{hand?.chips}</td>
            <td className="text-end">{hand?.mult}</td>
            <td className="text-end">{hand?.score}</td>
            <td className="text-end">{hand?.cumulative}</td>
            <td>{hand?.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
