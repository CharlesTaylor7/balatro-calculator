import { useId } from "react";
import { useAppStore } from "./store";
import { Joker, JokerName, JOKERS } from "./calculator";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import Select from "react-select";
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
    <div className="col-4">
      <button
        className="btn btn-sm btn-primary nowrap"
        onClick={() => pushJoker(null)}
      >
        New Joker
      </button>

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const counterId = useId();
  const chipsId = useId();
  const multId = useId();
  const xmultId = useId();

  console.log("joker", joker);
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="d-flex flex-row justify-content-between">
        <Select
          // @ts-ignore
          defaultValue={joker.vars.name}
          // @ts-ignore
          options={JOKERS.map((j) => ({ value: j, label: j }))}
          placeholder="Any Joker"
          // @ts-ignore
          onChange={(option: Option) => {
            // @ts-ignore
            updateJoker(index, "vars", { name: option?.value });
          }}
          // isClearable
          // clearValue={() => updateJoker(index, "name", null)}
        />

        <button
          className="btn btn-sm btn-danger"
          onClick={() => deleteJoker(joker.id)}
        >
          x
        </button>
      </div>

      {joker.vars && "counter" in joker.vars ? (
        <div className="d-flex flex-row justify-content-between">
          <label className="form-label d-block cursor-grab" htmlFor={chipsId}>
            Counter
          </label>
          <input
            className="form-control form-control-sm"
            id={counterId}
            type="number"
            value={joker.vars.counter}
            onChange={(e) =>
              updateJoker(index, "vars", { counter: Number(e.target.value) })
            }
          />
        </div>
      ) : null}
      <div className="d-flex flex-row justify-content-between">
        <label className="form-label d-block cursor-grab" htmlFor={chipsId}>
          Chips
        </label>
        <input
          className="form-control form-control-sm"
          id={chipsId}
          type="number"
          defaultValue={joker.chips}
          onChange={(e) => updateJoker(index, "chips", Number(e.target.value))}
        />
      </div>

      <div className="d-flex flex-row justify-content-between">
        <label className="form-label d-block cursor-grab" htmlFor={multId}>
          Mult
        </label>
        <input
          className="form-control form-control-sm"
          id={multId}
          type="number"
          defaultValue={joker.mult}
          onChange={(e) => updateJoker(index, "mult", Number(e.target.value))}
        />

        <div className="d-flex flex-row justify-content-between">
          <label htmlFor={xmultId} className="form-check-label d-block">
            xMult
          </label>

          <input
            className="form-control form-control-sm"
            id={xmultId}
            type="number"
            defaultValue={joker.xmult}
            onChange={(e) =>
              updateJoker(index, "xmult", Number(e.target.value))
            }
          />
        </div>
      </div>
    </div>
  );
}
