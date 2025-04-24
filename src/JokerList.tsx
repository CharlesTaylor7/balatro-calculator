import { useId } from "react";
import { useAppState } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Joker, JOKERS, displayCounter } from "@/calculator";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function JokerList() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 200,
        tolerance: 5,
      },
      canStartDragging: (event: PointerEvent) => {
        const target = event.target as HTMLElement;
        return !target.closest("button");
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { jokers, pushJoker, setJokers } = useAppState();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = jokers.findIndex((item) => item.id === active.id);
    const newIndex = jokers.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(jokers, oldIndex, newIndex);

    // Update positions in the state immediately for smooth UI
    setJokers(newItems);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="default" onClick={() => pushJoker(null)}>
        New Joker
      </Button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={jokers.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {jokers.map((joker, index) => (
            <JokerComponent key={joker.id} index={index} joker={joker} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

type JokerProps = {
  joker: Joker;
  index: number;
};

function JokerComponent({ joker, index }: JokerProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: joker.id });
  const { deleteJoker, updateJoker } = useAppState();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const counterId = useId();
  const chipsId = useId();
  const multId = useId();
  const xmultId = useId();

  // Get the joker name
  const jokerName = joker.vars.name || undefined;

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardHeader className="flex">
        <CardTitle>
          <Select
            value={jokerName}
            onValueChange={(name) => updateJoker(index, "vars", { name })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any Joker" />
            </SelectTrigger>
            <SelectContent>
              {JOKERS.map((j) => (
                <SelectItem key={j} value={j}>
                  {j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
        <Button variant="destructive" onClick={() => deleteJoker(joker.id)}>
          x
        </Button>
      </CardHeader>
      <CardContent>
        {joker.vars.kind === "counter" && (
          <div className="mb-3">
            <div className="flex flex-row gap-2 items-center mb-1">
              <Label htmlFor={counterId}>Counter</Label>
              <Input
                className="w-20"
                id={counterId}
                type="number"
                min={0}
                value={joker.vars.counter}
                onChange={(e) =>
                  updateJoker(index, "vars", {
                    counter: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              {displayCounter(joker.vars)}
            </div>
          </div>
        )}
        <div className="flex flex-row gap-2 items-center">
          <Label htmlFor={chipsId}>Chips</Label>
          <Input
            className="w-20"
            id={chipsId}
            type="number"
            min={0}
            value={joker.chips}
            onChange={(e) =>
              updateJoker(index, "chips", Number(e.target.value))
            }
          />

          <Label htmlFor={multId}>Mult</Label>
          <Input
            className="w-20"
            id={multId}
            type="number"
            min={0}
            value={joker.mult}
            onChange={(e) => updateJoker(index, "mult", Number(e.target.value))}
          />

          <Label htmlFor={xmultId}>xMult</Label>
          <Input
            className="w-20"
            id={xmultId}
            type="number"
            min={1}
            value={joker.xmult}
            onChange={(e) =>
              updateJoker(index, "xmult", Number(e.target.value))
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
