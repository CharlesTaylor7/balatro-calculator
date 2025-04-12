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
function JokerComponent({ joker, index }: JokerProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: joker.id });
  const { deleteJoker, updateJoker } = useAppStore();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const chipsId = useId();
  const multId = useId();
  const polychromeId = useId();
  const nameId = useId();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="card cursor-grab"
    >
      <div className="card-body">
        <div className="d-flex flex-row justify-content-between">
          <Select
            id={nameId}
            defaultValue={joker.name}
            options={JOKERS.map((j) => ({ value: j, label: j }))}
            placeholder="Any Joker"
            onChange={(option) =>
              updateJoker(index, { name: option as JokerName })
            }
            isClearable
            clearValue={() => updateJoker(index, { name: null })}
          />

          <button
            className="btn btn-sm btn-danger"
            onClick={() => deleteJoker(joker.id)}
          >
            x
          </button>
        </div>
        <div className="row">
          <div className="col">
            <label className="form-label d-block cursor-grab" htmlFor={chipsId}>
              Chips
            </label>

            <label className="form-label d-block cursor-grab" htmlFor={multId}>
              Mult
            </label>

            <label htmlFor={polychromeId} className="form-check-label d-block">
              Polychrome?
            </label>
          </div>
          <div className="col w-25">
            <input
              className="form-control form-control-sm"
              id={chipsId}
              type="number"
              defaultValue={joker.chips}
              onChange={(e) =>
                updateJoker(index, { chips: Number(e.target.value) })
              }
            />

            <input
              className="form-control form-control-sm"
              id={multId}
              type="number"
              defaultValue={joker.mult}
              onChange={(e) =>
                updateJoker(index, { chips: Number(e.target.value) })
              }
            />

            <input
              className="form-check-input"
              id={polychromeId}
              type="Checkbox"
              defaultChecked={joker.polychrome}
              onChange={(e) =>
                updateJoker(index, { polychrome: e.target.checked })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
