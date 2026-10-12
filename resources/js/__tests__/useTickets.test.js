import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ticketsApi } from '../api';
import { useTickets } from '../composables/useTickets';
import { useToasts } from '../composables/useToasts';

vi.mock('../api', () => ({
    ticketsApi: {
        list: vi.fn(),
        stats: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        restore: vi.fn(),
    },
}));

const listOf = (data, meta = {}) => ({
    data,
    meta: { current_page: 1, last_page: 1, total: data.length, from: data.length ? 1 : 0, to: data.length, ...meta },
});
const statsOf = (counts = {}) => ({ data: { open: 0, in_progress: 0, closed: 0, total: 0, ...counts } });
const makeTicket = () => ({ id: 1, title: 'Printer down', status: 'open', priority: 'low' });

const { toasts } = useToasts();

beforeEach(() => {
    vi.resetAllMocks();
    toasts.value = [];
    ticketsApi.list.mockResolvedValue(listOf([]));
    ticketsApi.stats.mockResolvedValue(statsOf());
    ticketsApi.update.mockResolvedValue({});
    ticketsApi.remove.mockResolvedValue(null);
    ticketsApi.restore.mockResolvedValue({});
    ticketsApi.create.mockResolvedValue({});
});

describe('load', () => {
    it('fills tickets, pagination meta and stats', async () => {
        ticketsApi.list.mockResolvedValue(listOf([makeTicket()]));
        ticketsApi.stats.mockResolvedValue(statsOf({ open: 1, total: 1 }));
        const { tickets, meta, stats, loading, load } = useTickets();

        await load();

        expect(tickets.value).toHaveLength(1);
        expect(meta.value.total).toBe(1);
        expect(stats.value.open).toBe(1);
        expect(loading.value).toBe(false);
    });

    it('exposes an error message when the request fails', async () => {
        ticketsApi.list.mockRejectedValue(new Error('Cannot reach the server.'));
        const { error, loading, load } = useTickets();

        await load();

        expect(error.value).toBe('Cannot reach the server.');
        expect(loading.value).toBe(false);
    });

    it('steps back a page when the current page no longer exists', async () => {
        ticketsApi.list.mockResolvedValueOnce(listOf([], { current_page: 2, last_page: 1 }));
        ticketsApi.list.mockResolvedValue(listOf([makeTicket()]));
        const { tickets, setPage } = useTickets();

        await setPage(2);

        expect(ticketsApi.list).toHaveBeenCalledTimes(2);
        expect(ticketsApi.list).toHaveBeenLastCalledWith({ status: '', page: 1, limit: 10 });
        expect(tickets.value).toHaveLength(1);
    });
});

describe('setFilter', () => {
    it('requests the chosen status from page 1', async () => {
        const { setFilter } = useTickets();

        await setFilter('closed');

        expect(ticketsApi.list).toHaveBeenLastCalledWith({ status: 'closed', page: 1, limit: 10 });
    });
});

describe('create', () => {
    it('clears the filter so the new ticket is visible, and confirms with a toast', async () => {
        const { setFilter, create, filter } = useTickets();
        await setFilter('closed');

        await create({ title: 'New one' });

        expect(ticketsApi.create).toHaveBeenCalledWith({ title: 'New one' });
        expect(filter.value).toBe('');
        expect(ticketsApi.list).toHaveBeenLastCalledWith({ status: '', page: 1, limit: 10 });
        expect(toasts.value[0].message).toBe('Ticket created');
    });

    it('lets API errors bubble up so the dialog can show them', async () => {
        ticketsApi.create.mockRejectedValue(new Error('invalid'));
        const { create } = useTickets();

        await expect(create({ title: '' })).rejects.toThrow('invalid');
    });
});

describe('updateTicket', () => {
    it('changes the ticket immediately (optimistic), then confirms with an Undo toast', async () => {
        let finish;
        ticketsApi.update.mockReturnValue(new Promise((resolve) => (finish = resolve)));
        const { updateTicket } = useTickets();
        const ticket = makeTicket();

        const pending = updateTicket(ticket, { status: 'closed' });
        expect(ticket.status).toBe('closed'); // before the server answered

        finish({});
        await pending;

        expect(ticketsApi.update).toHaveBeenCalledWith(1, { status: 'closed' });
        expect(toasts.value[0].message).toContain('Moved to Closed');
        expect(toasts.value[0].action.label).toBe('Undo');
    });

    it('describes priority changes in the toast', async () => {
        const { updateTicket } = useTickets();

        await updateTicket(makeTicket(), { priority: 'high' });

        expect(toasts.value[0].message).toContain('Priority set to High');
    });

    it('rolls back and shows an error toast when the server refuses', async () => {
        ticketsApi.update.mockRejectedValue(new Error('Server exploded'));
        const { updateTicket } = useTickets();
        const ticket = makeTicket();

        await updateTicket(ticket, { status: 'closed' });

        expect(ticket.status).toBe('open');
        expect(toasts.value[0].tone).toBe('error');
        expect(toasts.value[0].message).toContain('Server exploded');
    });

    it('does nothing when the value did not change', async () => {
        const { updateTicket } = useTickets();

        await updateTicket(makeTicket(), { status: 'open' });

        expect(ticketsApi.update).not.toHaveBeenCalled();
        expect(toasts.value).toHaveLength(0);
    });

    it('Undo restores the previous value without adding another toast', async () => {
        const { updateTicket } = useTickets();
        const ticket = makeTicket();
        await updateTicket(ticket, { status: 'closed' });

        await toasts.value[0].action.run();

        expect(ticketsApi.update).toHaveBeenLastCalledWith(1, { status: 'open' });
        expect(ticket.status).toBe('open');
        expect(toasts.value).toHaveLength(1);
    });
});

describe('remove', () => {
    it('soft deletes and offers Undo, which restores the ticket', async () => {
        const { remove } = useTickets();

        await remove(makeTicket());

        expect(ticketsApi.remove).toHaveBeenCalledWith(1);
        expect(toasts.value[0].message).toContain('Deleted');

        await toasts.value[0].action.run();

        expect(ticketsApi.restore).toHaveBeenCalledWith(1);
    });

    it('shows an error toast when deleting fails', async () => {
        ticketsApi.remove.mockRejectedValue(new Error('Nope'));
        const { remove } = useTickets();

        await remove(makeTicket());

        expect(toasts.value[0].tone).toBe('error');
    });
});