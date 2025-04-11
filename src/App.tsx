import { useRef, useMemo, useCallback, useState, useEffect } from "react";
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
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);

  const { jokers, createJoker } = useAppStore();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onClickCreateJoker() {
    createJoker(inputRef.current!.value);
    inputRef.current!.value = "";
  }
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
          onClick={onClickCreateJoker}
        >
          New Jonkler
        </button>
        <input className="form-control" ref={inputRef} />
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

type JokerProps = { joker: Joker; deleteJoker: () => void };
function JokerComponent({ joker, deleteJoker }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: joker.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="d-flex align-items-center justify-content-between p-3 bg-white border rounded mb-2"
    >
      {name}
    </div>
  );
}
