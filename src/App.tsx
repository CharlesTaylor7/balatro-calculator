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
import Select from "react-select";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const Jokers = ["Supernova", "Green Joker", "Ride The Bus"];

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);

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

  const {
    jokers,
    pushJoker,
    setJokers,
    hands,
    setHand = () => {},
  } = useAppStore();

  function onClickCreateJoker() {
    pushJoker(inputRef.current!.value);
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
    <div className="d-flex">
      <div className="container-fluid px-4">
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-primary nowrap"
            onClick={onClickCreateJoker}
          >
            New Jonkler
          </button>
          <Select options={Jokers} />
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
      <table>
        <thead>
          <tr>
            <td>#</td>
            <td>Hand</td>
            <td>Chips</td>
            <td>Mult</td>
            <td>Score</td>
            <td>Cumulative</td>
          </tr>
        </thead>
        <tbody>
          {hands.map((hand, i) => (
            <tr>
              <td>{i + 1}</td>
              <td>
                <input
                  value={hand.cards}
                  onChange={(e) => setHand(i, e.target.value)}
                />
              </td>
              <td>{hand.chips}</td>
              <td>{hand.mult}</td>
              <td>{hand.score}</td>
              <td>{hand.cumulative}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="d-flex align-items-center justify-content-between p-3 bg-white border rounded mb-2"
    >
      {joker.name}
      <button onClick={() => deleteJoker(joker.id)}>Remove</button>
    </div>
  );
}
