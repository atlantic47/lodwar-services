export const STATUSES = [
    {
        value: 'open',
        label: 'Open',
        hint: 'Waiting for someone to pick it up',
        dot: 'bg-blue-500',
        pill: 'bg-blue-50 text-blue-800 ring-blue-200',
    },
    {
        value: 'in_progress',
        label: 'In progress',
        hint: 'Someone is working on it',
        dot: 'bg-violet-500',
        pill: 'bg-violet-50 text-violet-800 ring-violet-200',
    },
    {
        value: 'closed',
        label: 'Closed',
        hint: 'Resolved, no more work needed',
        dot: 'bg-emerald-500',
        pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    },
];

// Ascending (low to high) for the create form.
export const PRIORITIES = [
    {
        value: 'low',
        label: 'Low',
        hint: 'Can wait. Nobody is blocked.',
        dot: 'bg-slate-400',
        edge: 'bg-slate-300',
        pill: 'bg-slate-100 text-slate-700 ring-slate-300',
    },
    {
        value: 'medium',
        label: 'Medium',
        hint: 'Normal. Handle in order.',
        dot: 'bg-amber-500',
        edge: 'bg-amber-400',
        pill: 'bg-amber-50 text-amber-900 ring-amber-200',
    },
    {
        value: 'high',
        label: 'High',
        hint: 'Blocking someone. Handle today.',
        dot: 'bg-red-500',
        edge: 'bg-red-500',
        pill: 'bg-red-50 text-red-800 ring-red-200',
    },
];

// Descending (high to low) for menus.
export const PRIORITIES_DESC = [...PRIORITIES].reverse();

export const label = (list, value) => list.find((o) => o.value === value)?.label ?? value;

export function timeAgo(iso) {
    const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} d ago`;
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export const fullDate = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });