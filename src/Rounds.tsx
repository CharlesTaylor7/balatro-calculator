import { useAppStore } from "./store";

export function Rounds() {
  const { rounds, getScoredHands, setHand } = useAppStore();
  const hands = getScoredHands();
  return (
    <table className="table table-bordered table-info table-striped">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Hand</th>
          <th scope="col" className="text-center">
            Chips
          </th>
          <th scope="col" className="text-center">
            Mult
          </th>
          <th scope="col" className="text-center">
            Score
          </th>
          <th scope="col" className="text-center">
            Cumulative
          </th>
          <th scope="col" className="text-center">
            Type
          </th>
        </tr>
      </thead>
      <tbody>
        {rounds.map((raw, i) => {
          const hand = hands[i];
          return (
            <tr key={i} className="text-nowrap">
              <th>{i + 1}</th>
              <td style={{ width: "100px" }}>
                <input
                  className="form-control form-control-sm"
                  value={raw}
                  onChange={(e) => setHand(i, e.target.value)}
                />
              </td>
              <td className="text-end">{hand?.chips}</td>
              <td className="text-end">{hand?.mult}</td>
              <td className="text-end">{hand?.score}</td>
              <td className="text-end">{hand?.cumulative}</td>
              <td>{hand?.name}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
