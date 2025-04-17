import { useId } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Joker, JOKERS } from "@/calculator";
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
      canStartDragging: (event: any) => {
        return !event.target.closest("button");
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { jokers, pushJoker, setJokers } = useAppStore();

  async function handleDragEnd(event: DragEndEvent) {
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
type Option = Readonly<{
  label: string;
  value: string;
}>;
function JokerComponent({ joker, index }: JokerProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: joker.id });
  const { deleteJoker, updateJoker } = useAppStore();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const counterId = useId();
  const chipsId = useId();
  const multId = useId();
  const xmultId = useId();

  const name = joker.vars.name;
  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardHeader className="flex">
        <CardTitle>
          <Select
            className="w-60"
            // @ts-ignore

            value={name && { value: name, label: name }}
            options={JOKERS.map((j) => ({ value: j, label: j }))}
            placeholder="Any Joker"
            // @ts-ignore
            onChange={(option: Option) => {
              // @ts-ignore
              updateJoker(index, "vars", { name: option?.value });
            }}
            isClearable={name != null}
            clearValue={() => updateJoker(index, "vars", { name: null })}
          />
        </CardTitle>
        <Button variant="destructive" onClick={() => deleteJoker(joker.id)}>
          x
        </Button>
      </CardHeader>
      <CardContent>
        {joker.vars && "counter" in joker.vars ? (
          <>
            <Label htmlFor={chipsId}>Counter</Label>
            <Input
              className="w-20"
              id={counterId}
              type="number"
              value={joker.vars.counter}
              onChange={(e) =>
                // @ts-ignore
                updateJoker(index, "vars", { counter: Number(e.target.value) })
              }
            />
          </>
        ) : null}
        <div className="flex flex-row gap-2 items-center">
          <Label htmlFor={chipsId}>Chips</Label>
          <Input
            className="w-20"
            id={chipsId}
            type="number"
            defaultValue={joker.chips}
            onChange={(e) =>
              updateJoker(index, "chips", Number(e.target.value))
            }
          />

          <Label htmlFor={multId}>Mult</Label>
          <Input
            className="w-20"
            id={multId}
            type="number"
            defaultValue={joker.mult}
            onChange={(e) => updateJoker(index, "mult", Number(e.target.value))}
          />

          <Label htmlFor={xmultId}>xMult</Label>
          <Input
            className="w-20"
            id={xmultId}
            type="number"
            defaultValue={joker.xmult}
            onChange={(e) =>
              updateJoker(index, "xmult", Number(e.target.value))
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
