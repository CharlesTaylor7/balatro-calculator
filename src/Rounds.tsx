import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";

import { useAppStore } from "./store";
import { Input } from "./components/ui/input";

export function Rounds() {
  const { rounds, getScoredHands, setHand } = useAppStore();
  const hands = getScoredHands();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">#</TableHead>
          <TableHead scope="col">Hand</TableHead>
          <TableHead scope="col">Chips</TableHead>
          <TableHead scope="col">Mult</TableHead>
          <TableHead scope="col">Score</TableHead>
          <TableHead scope="col">Cumulative</TableHead>
          <TableHead scope="col">Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rounds.map((raw, i) => {
          const hand = hands[i];
          return (
            <TableRow key={i}>
              <TableHead>{i + 1}</TableHead>
              <TableCell>
                <Input
                  className="w-20"
                  type="text"
                  value={raw}
                  onChange={(e) => setHand(i, e.target.value)}
                />
              </TableCell>
              <TableCell>{hand?.chips}</TableCell>
              <TableCell>{hand?.mult}</TableCell>
              <TableCell>{hand?.score}</TableCell>
              <TableCell>{hand?.cumulative}</TableCell>
              <TableCell>{hand?.name}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
