import { useId } from "react";
import { useAppStore } from "./store";
import { Joker, JOKERS } from "./calculator";
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
    <div className="">
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
    <div
      className="card"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="d-flex align-items-center ">
        <Select
          // @ts-ignore
          style={{ width: "220px" }}
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

        <button
          className="btn btn-sm btn-danger "
          style={{ width: "2rem", height: "2rem" }}
          onClick={() => deleteJoker(joker.id)}
        >
          x
        </button>
      </div>
      <div
        className="d-grid align-items-center justify-items-center"
        style={{ gridTemplateColumns: "auto auto" }}
      >
        {joker.vars && "counter" in joker.vars ? (
          <>
            <label className="form-label d-block cursor-grab" htmlFor={chipsId}>
              Counter
            </label>
            <input
              className="form-control form-control-sm"
              style={{ width: "3rem" }}
              id={counterId}
              type="number"
              value={joker.vars.counter}
              onChange={(e) =>
                updateJoker(index, "vars", { counter: Number(e.target.value) })
              }
            />
          </>
        ) : null}

        <label className="form-label d-block cursor-grab" htmlFor={chipsId}>
          Chips
        </label>
        <input
          className="form-control form-control-sm"
          style={{ width: "3rem" }}
          id={chipsId}
          type="number"
          defaultValue={joker.chips}
          onChange={(e) => updateJoker(index, "chips", Number(e.target.value))}
        />

        <label className="form-label d-block cursor-grab" htmlFor={multId}>
          Mult
        </label>
        <input
          className="form-control form-control-sm"
          style={{ width: "3rem" }}
          id={multId}
          type="number"
          defaultValue={joker.mult}
          onChange={(e) => updateJoker(index, "mult", Number(e.target.value))}
        />

        <label htmlFor={xmultId} className="form-check-label d-block">
          xMult
        </label>

        <input
          className="form-control form-control-sm"
          style={{ width: "3rem" }}
          id={xmultId}
          type="number"
          defaultValue={joker.xmult}
          onChange={(e) => updateJoker(index, "xmult", Number(e.target.value))}
        />
      </div>
    </div>
  );
}
