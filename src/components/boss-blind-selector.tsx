import { useAppState } from "@/store";
import { BossBlind, BOSS_BLINDS, BOSS_BLIND_DESCRIPTIONS } from "@/calculator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function BossBlindSelector() {
  const { bossBlind, setBossBlind } = useAppState();

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="boss-blind">Boss Blind:</Label>
        <Select
          value={bossBlind || "none"}
          onValueChange={(value) => {
            // eslint-disable-next-line no-type-assertion/no-type-assertion
            setBossBlind(value === "none" ? undefined : (value as BossBlind));
          }}
        >
          <SelectTrigger id="boss-blind" className="w-[200px]">
            <SelectValue placeholder="Select a boss blind" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {BOSS_BLINDS.map((blind) => (
              <SelectItem key={blind} value={blind}>
                {blind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {bossBlind && (
        <div className="text-sm text-muted-foreground">
          {BOSS_BLIND_DESCRIPTIONS[bossBlind]}
        </div>
      )}
    </div>
  );
}
