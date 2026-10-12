export class ApiError extends Error {
    constructor(status, message, errors = {}) {
        super(message);
        this.status = status;
        this.errors = errors; // Laravel validation errors: { field: [messages] }
    }
}

async function request(path, { method = 'GET', body, params } = {}) {
    const url = new URL(`/api${path}`, window.location.origin);
    Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') url.searchParams.set(key, value);
    });

    let res;
    try {
        res = await fetch(url, {
            method,
            headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
    }

    if (res.status === 204) return null;
    const json = await res.json().catch(() => null);
    if (!res.ok) {
        throw new ApiError(res.status, json?.message ?? 'Something went wrong. Try again.', json?.errors ?? {});
    }
    return json;
}

export const ticketsApi = {
    list: (params) => request('/tickets', { params }),
    stats: () => request('/tickets/stats'),
    create: (payload) => request('/tickets', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/tickets/${id}`, { method: 'PATCH', body: payload }),
    remove: (id) => request(`/tickets/${id}`, { method: 'DELETE' }),
    restore: (id) => request(`/tickets/${id}/restore`, { method: 'POST' }),
};