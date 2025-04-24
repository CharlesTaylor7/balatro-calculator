import { useAppState } from "@/store";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PokerHand } from "@/calculator";

export function HandCountTable() {
  const { handInfo, updateHandInfo } = useAppState();

  // Handle hand count changes
  const handleHandCountChange = (hand: PokerHand, value: string, field: "lvl" | "count") => {
    const numValue = parseInt(value) || 0;
    updateHandInfo(hand, field, numValue);
  };

  // Reset all counts
  const resetCounts = () => {
    // Reset hand counts
    Object.keys(handInfo).forEach(hand => {
      updateHandInfo(hand as PokerHand, "lvl", 0);
      updateHandInfo(hand as PokerHand, "count", 0);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Poker Hand Counts</span>
          <Button variant="destructive" size="sm" onClick={resetCounts}>
            Reset All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hand</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(handInfo).map(([hand, info]) => (
              <TableRow key={hand}>
                <TableCell className="font-medium">{hand}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    className="w-16"
                    value={info.lvl}
                    onChange={(e) => handleHandCountChange(hand as PokerHand, e.target.value, "lvl")}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    className="w-16"
                    value={info.count}
                    onChange={(e) => handleHandCountChange(hand as PokerHand, e.target.value, "count")}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
