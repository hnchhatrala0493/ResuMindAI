import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import type { Resume } from '@resumind/shared';

type SectionKey = Resume['sectionOrder'][number];

const names: Record<string, string> = {
  personalDetails: 'Personal details',
  professionalSummary: 'Professional summary',
  workExperience: 'Work experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  achievements: 'Achievements',
  volunteerExperience: 'Volunteer experience',
  customSections: 'Custom sections',
};

function Row({
  id,
  index,
  total,
  move,
}: {
  id: string;
  index: number;
  total: number;
  move: (from: number, to: number) => void;
}) {
  const sortable = useSortable({ id });
  return (
    <li
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className="flex items-center gap-2 rounded-xl border bg-white p-3 dark:bg-slate-900"
    >
      <button
        type="button"
        aria-label={`Drag ${names[id]}`}
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical size={18} />
      </button>
      <span className="flex-1 text-sm font-semibold">{names[id]}</span>
      <button
        type="button"
        aria-label={`Move ${names[id]} up`}
        disabled={index === 0}
        onClick={() => move(index, index - 1)}
      >
        <ChevronUp size={18} />
      </button>
      <button
        type="button"
        aria-label={`Move ${names[id]} down`}
        disabled={index === total - 1}
        onClick={() => move(index, index + 1)}
      >
        <ChevronDown size={18} />
      </button>
    </li>
  );
}

export function SectionOrder({
  value,
  onChange,
}: {
  value: SectionKey[];
  onChange: (next: SectionKey[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const move = (from: number, to: number) => {
    if (to >= 0 && to < value.length) onChange(arrayMove(value, from, to));
  };
  const dropped = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(
      value.indexOf(String(active.id) as SectionKey),
      value.indexOf(String(over.id) as SectionKey),
    );
  };
  return (
    <section className="sm:col-span-2">
      <h3 className="mb-2 font-bold">Section order</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dropped}>
        <SortableContext items={value} strategy={verticalListSortingStrategy}>
          <ul className="grid gap-2">
            {value.map((id, index) => (
              <Row key={id} id={id} index={index} total={value.length} move={move} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
