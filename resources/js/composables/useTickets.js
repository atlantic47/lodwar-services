import { ref } from 'vue';
import { ticketsApi } from '../api';
import { PRIORITIES, STATUSES, label } from '../constants';
import { useToasts } from './useToasts';

const LIMIT = 10;
const short = (text) => (text.length > 32 ? `${text.slice(0, 31)}…` : text);

export function useTickets() {
    const tickets = ref([]);
    const meta = ref({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });
    const stats = ref({ open: 0, in_progress: 0, closed: 0, total: 0 });
    const filter = ref('');
    const page = ref(1);
    const loading = ref(false);
    const error = ref('');
    const { push } = useToasts();

    let latest = 0; // ignore out-of-order responses

    // silent = refresh in the background without dimming the list
    async function load({ silent = false } = {}) {
        const requestId = ++latest;
        if (!silent) loading.value = true;
        error.value = '';
        try {
            const [list, summary] = await Promise.all([
                ticketsApi.list({ status: filter.value, page: page.value, limit: LIMIT }),
                ticketsApi.stats(),
            ]);
            if (requestId !== latest) return;

            // e.g. deleted the last item on the last page: step back one page
            if (list.meta.last_page >= 1 && page.value > list.meta.last_page) {
                page.value = list.meta.last_page;
                return await load({ silent });
            }
            tickets.value = list.data;
            meta.value = list.meta;
            stats.value = summary.data;
        } catch (e) {
            if (requestId === latest) error.value = e.message;
        } finally {
            if (requestId === latest) loading.value = false;
        }
    }

    async function create(payload) {
        await ticketsApi.create(payload); // errors bubble up so the dialog can show field messages
        filter.value = ''; // make sure the new ticket is visible
        page.value = 1;
        await load({ silent: true });
        push({ message: 'Ticket created' });
    }

    // Optimistic: the UI changes immediately, then rolls back if the server refuses.
    async function updateTicket(ticket, patch, { isUndo = false } = {}) {
        const before = Object.fromEntries(Object.keys(patch).map((key) => [key, ticket[key]]));
        if (Object.keys(patch).every((key) => patch[key] === before[key])) return;

        Object.assign(ticket, patch);
        try {
            await ticketsApi.update(ticket.id, patch);
        } catch (e) {
            Object.assign(ticket, before);
            push({ tone: 'error', message: `Could not update "${short(ticket.title)}". ${e.message}` });
            return;
        }

        if (!isUndo) {
            const what = patch.status
                ? `Moved to ${label(STATUSES, patch.status)}`
                : `Priority set to ${label(PRIORITIES, patch.priority)}`;
            push({
                message: `${what}: ${short(ticket.title)}`,
                action: { label: 'Undo', run: () => updateTicket(ticket, before, { isUndo: true }) },
            });
        }
        await load({ silent: true }); // refresh counts and filter membership
    }

    async function remove(ticket) {
        try {
            await ticketsApi.remove(ticket.id);
        } catch (e) {
            push({ tone: 'error', message: e.message });
            return;
        }
        push({
            message: `Deleted "${short(ticket.title)}"`,
            timeout: 8000,
            action: {
                label: 'Undo',
                run: async () => {
                    try {
                        await ticketsApi.restore(ticket.id);
                    } catch (e) {
                        push({ tone: 'error', message: e.message });
                    }
                    await load({ silent: true });
                },
            },
        });
        await load({ silent: true });
    }

    function setFilter(value) {
        filter.value = value;
        page.value = 1;
        return load();
    }

    function setPage(value) {
        page.value = value;
        return load();
    }

    return { tickets, meta, stats, filter, loading, error, load, create, updateTicket, remove, setFilter, setPage };
}