import { useId, useRef } from "react";
import { useAppStore } from "./store";
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
    <div className="container-fluid px-4">
      <div className="d-flex gap-2">
        <button
          className="btn btn-sm btn-primary nowrap"
          onClick={() => pushJoker(null)}
        >
          New Joker
        </button>
        <Select />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={jokers.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {jokers.map((joker) => (
            <JokerComponent key={joker.id} joker={joker} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
function JokerComponent({ joker }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: joker.id });
  const deleteJoker = useAppStore((state) => state.deleteJoker);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const chipsId = useId();
  const multId = useId();
  const polychromeId = useId();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="d-flex align-items-center justify-content-between p-3 bg-white border rounded mb-2"
    >
      <label className="form-label">
        Name
        <input
          className="form-control form-control-sm"
          type="text"
          value={joker.name}
        />
      </label>
      <label className="form-label" htmlFor={chipsId}>
        Chips
        <input id={chipsId} type="number" value={joker.chips} />
      </label>

      <label htmlFor={multId}>
        Mult
        <input id={multId} type="number" value={joker.mult} />
      </label>

      <label htmlFor={polychromeId}>
        Polychrome?
        <input id={polychromeId} type="Checkbox" value={joker.polychrome} />
      </label>
      <button
        className="btn btn-sm btn-danger"
        onClick={() => deleteJoker(joker.id)}
      >
        Remove
      </button>
    </div>
  );
}
