import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, ticketsApi } from '../api';

const fetchMock = vi.fn();
const reply = (body, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
});

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('ticketsApi', () => {
    it('builds the list URL and skips empty params', async () => {
        fetchMock.mockResolvedValue(reply({ data: [], meta: {} }));

        await ticketsApi.list({ status: '', page: 2, limit: 10 });

        const url = fetchMock.mock.calls[0][0];
        expect(url.pathname).toBe('/api/tickets');
        expect(url.searchParams.get('page')).toBe('2');
        expect(url.searchParams.get('limit')).toBe('10');
        expect(url.searchParams.has('status')).toBe(false);
    });

    it('sends JSON when creating a ticket', async () => {
        fetchMock.mockResolvedValue(reply({ data: { id: 1 } }, 201));

        await ticketsApi.create({ title: 'Printer down' });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url.pathname).toBe('/api/tickets');
        expect(init.method).toBe('POST');
        expect(init.headers).toMatchObject({ Accept: 'application/json', 'Content-Type': 'application/json' });
        expect(JSON.parse(init.body)).toEqual({ title: 'Printer down' });
    });

    it('PATCHes status and priority to the ticket URL', async () => {
        fetchMock.mockResolvedValue(reply({ data: { id: 7 } }));

        await ticketsApi.update(7, { status: 'closed' });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url.pathname).toBe('/api/tickets/7');
        expect(init.method).toBe('PATCH');
        expect(JSON.parse(init.body)).toEqual({ status: 'closed' });
    });

    it('returns null for 204 responses (delete)', async () => {
        fetchMock.mockResolvedValue({ ok: true, status: 204 });

        await expect(ticketsApi.remove(3)).resolves.toBeNull();
        expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    });

    it('throws an ApiError carrying Laravel validation errors', async () => {
        fetchMock.mockResolvedValue(
            reply({ message: 'The title field is required.', errors: { title: ['The title field is required.'] } }, 422),
        );

        const error = await ticketsApi.create({}).catch((e) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(422);
        expect(error.errors.title[0]).toBe('The title field is required.');
    });

    it('turns network failures into a friendly ApiError', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

        const error = await ticketsApi.stats().catch((e) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(0);
        expect(error.message).toMatch(/cannot reach the server/i);
    });

    it('falls back to a generic message when the error body is not JSON', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => {
                throw new Error('bad json');
            },
        });

        const error = await ticketsApi.stats().catch((e) => e);

        expect(error.message).toBe('Something went wrong. Try again.');
    });
});