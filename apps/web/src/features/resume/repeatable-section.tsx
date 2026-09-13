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
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@resumind/ui';

export type Field = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'url' | 'month' | 'checkbox' | 'select' | 'list';
  required?: boolean;
  options?: string[];
  wide?: boolean;
};
export const sectionFields: Record<string, Field[]> = {
  workExperience: [
    { key: 'jobTitle', label: 'Job title', required: true },
    { key: 'company', label: 'Company', required: true },
    { key: 'location', label: 'Location' },
    {
      key: 'employmentType',
      label: 'Employment type',
      options: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
    },
    { key: 'startDate', label: 'Start date', type: 'month', required: true },
    { key: 'endDate', label: 'End date', type: 'month' },
    { key: 'currentlyWorking', label: 'I currently work here', type: 'checkbox', wide: true },
    { key: 'description', label: 'Description', type: 'textarea', wide: true },
    { key: 'achievements', label: 'Achievements (one per line)', type: 'list', wide: true },
  ],
  education: [
    { key: 'institution', label: 'Institution', required: true },
    { key: 'degree', label: 'Degree', required: true },
    { key: 'fieldOfStudy', label: 'Field of study' },
    { key: 'location', label: 'Location' },
    { key: 'startDate', label: 'Start date', type: 'month' },
    { key: 'endDate', label: 'End date', type: 'month' },
    { key: 'currentlyStudying', label: 'I currently study here', type: 'checkbox', wide: true },
    { key: 'grade', label: 'Grade' },
    { key: 'description', label: 'Description', type: 'textarea', wide: true },
  ],
  skills: [
    { key: 'name', label: 'Skill', required: true },
    { key: 'category', label: 'Category' },
    {
      key: 'level',
      label: 'Proficiency',
      options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    },
  ],
  projects: [
    { key: 'name', label: 'Project name', required: true },
    { key: 'role', label: 'Role' },
    { key: 'startDate', label: 'Start date', type: 'month' },
    { key: 'endDate', label: 'End date', type: 'month' },
    { key: 'projectUrl', label: 'Project URL', type: 'url' },
    { key: 'repositoryUrl', label: 'Repository URL', type: 'url' },
    { key: 'technologies', label: 'Technologies (one per line)', type: 'list', wide: true },
    { key: 'description', label: 'Description', type: 'textarea', wide: true },
  ],
  certifications: [
    { key: 'name', label: 'Certification', required: true },
    { key: 'issuer', label: 'Issuer' },
    { key: 'issueDate', label: 'Issue date', type: 'month' },
    { key: 'expiryDate', label: 'Expiry date', type: 'month' },
    { key: 'credentialId', label: 'Credential ID' },
    { key: 'credentialUrl', label: 'Credential URL', type: 'url' },
  ],
  languages: [
    { key: 'name', label: 'Language', required: true },
    {
      key: 'proficiency',
      label: 'Proficiency',
      options: [
        'Elementary',
        'Limited working',
        'Professional working',
        'Full professional',
        'Native or bilingual',
      ],
    },
  ],
  achievements: [
    { key: 'title', label: 'Title', required: true },
    { key: 'date', label: 'Date', type: 'month' },
    { key: 'description', label: 'Description', type: 'textarea', wide: true },
  ],
  volunteerExperience: [
    { key: 'organization', label: 'Organization', required: true },
    { key: 'role', label: 'Role', required: true },
    { key: 'startDate', label: 'Start date', type: 'month' },
    { key: 'endDate', label: 'End date', type: 'month' },
    {
      key: 'currentlyVolunteering',
      label: 'I currently volunteer here',
      type: 'checkbox',
      wide: true,
    },
    { key: 'description', label: 'Description', type: 'textarea', wide: true },
  ],
  customSections: [
    { key: 'title', label: 'Section title', required: true },
    { key: 'type', label: 'Content type', options: ['text', 'list'] },
    { key: 'content', label: 'Text content', type: 'textarea', wide: true },
    { key: 'items', label: 'List items (one per line)', type: 'list', wide: true },
  ],
};
type Item = Record<string, unknown> & { id: string; visible: boolean; order: number };
export function RepeatableSection({
  section,
  items,
  onChange,
}: {
  section: string;
  items: Item[];
  onChange: (items: Item[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const move = (from: number, to: number) =>
    onChange(arrayMove(items, from, to).map((x, i) => ({ ...x, order: i })));
  const drag = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id)
      move(
        items.findIndex((x) => x.id === e.active.id),
        items.findIndex((x) => x.id === e.over!.id),
      );
  };
  const add = () => {
    const defaults = Object.fromEntries(
      (sectionFields[section] ?? []).map((field) => [
        field.key,
        field.type === 'checkbox' ? false : field.type === 'list' ? [] : '',
      ]),
    );
    onChange([
      ...items,
      {
        ...defaults,
        id: crypto.randomUUID(),
        visible: true,
        order: items.length,
        ...(section === 'customSections' ? { type: 'text' } : {}),
      },
    ]);
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={drag}>
      <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {items.map((item, i) => (
            <SortableCard
              key={item.id}
              item={item}
              fields={sectionFields[section] ?? []}
              index={i}
              count={items.length}
              update={(next) => onChange(items.map((x) => (x.id === item.id ? next : x)))}
              duplicate={() =>
                onChange(
                  [
                    ...items.slice(0, i + 1),
                    { ...item, id: crypto.randomUUID() },
                    ...items.slice(i + 1),
                  ].map((x, n) => ({ ...x, order: n })),
                )
              }
              remove={() =>
                confirm('Delete this entry?') &&
                onChange(items.filter((x) => x.id !== item.id).map((x, n) => ({ ...x, order: n })))
              }
              move={move}
            />
          ))}
          <Button type="button" onClick={add}>
            <Plus size={16} />
            Add entry
          </Button>
        </div>
      </SortableContext>
    </DndContext>
  );
}
function SortableCard({
  item,
  fields,
  index,
  count,
  update,
  duplicate,
  remove,
  move,
}: {
  item: Item;
  fields: Field[];
  index: number;
  count: number;
  update: (x: Item) => void;
  duplicate: () => void;
  remove: () => void;
  move: (a: number, b: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border p-4 ${isDragging ? 'border-indigo-500 shadow-xl' : 'border-slate-200 dark:border-slate-700'}`}
    >
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical />
        </button>
        <button
          type="button"
          onClick={() => update({ ...item, visible: !item.visible })}
          aria-label={item.visible ? 'Hide entry' : 'Show entry'}
        >
          {item.visible ? <Eye /> : <EyeOff />}
        </button>
        <button type="button" onClick={duplicate} aria-label="Duplicate entry">
          <Copy />
        </button>
        <button
          type="button"
          disabled={!index}
          onClick={() => move(index, index - 1)}
          aria-label="Move up"
        >
          <ChevronUp />
        </button>
        <button
          type="button"
          disabled={index === count - 1}
          onClick={() => move(index, index + 1)}
          aria-label="Move down"
        >
          <ChevronDown />
        </button>
        <button type="button" onClick={remove} aria-label="Delete entry" className="text-rose-500">
          <Trash2 />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <FieldControl key={f.key} field={f} item={item} update={update} />
        ))}
      </div>
    </article>
  );
}
function FieldControl({
  field,
  item,
  update,
}: {
  field: Field;
  item: Item;
  update: (x: Item) => void;
}) {
  const value = item[field.key];
  const common = { id: `${item.id}-${field.key}`, required: field.required };
  if (field.type === 'checkbox')
    return (
      <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => update({ ...item, [field.key]: e.target.checked })}
        />
        {field.label}
      </label>
    );
  if (field.options)
    return (
      <label className={field.wide ? 'sm:col-span-2' : ''}>
        {field.label}
        <select
          {...common}
          className="input mt-2"
          value={String(value ?? '')}
          onChange={(e) => update({ ...item, [field.key]: e.target.value })}
        >
          <option value="">Select</option>
          {field.options.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
    );
  if (field.type === 'textarea' || field.type === 'list')
    return (
      <label className="sm:col-span-2">
        {field.label}
        <textarea
          {...common}
          className="input mt-2 min-h-24"
          value={Array.isArray(value) ? value.join('\n') : String(value ?? '')}
          onChange={(e) =>
            update({
              ...item,
              [field.key]:
                field.type === 'list' ? e.target.value.split('\n').filter(Boolean) : e.target.value,
            })
          }
        />
      </label>
    );
  return (
    <label className={field.wide ? 'sm:col-span-2' : ''}>
      {field.label}
      <input
        {...common}
        type={field.type ?? 'text'}
        className="input mt-2"
        value={String(value ?? '')}
        onChange={(e) => update({ ...item, [field.key]: e.target.value })}
      />
    </label>
  );
}
