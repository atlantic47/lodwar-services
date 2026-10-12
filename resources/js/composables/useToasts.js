import { ref } from 'vue';

// Module-level state so every component shares the same toast list.
const toasts = ref([]);
let seq = 0;

export function useToasts() {
    function dismiss(id) {
        toasts.value = toasts.value.filter((t) => t.id !== id);
    }

    function push({ message, tone = 'info', action = null, timeout = 6000 }) {
        const id = ++seq;
        toasts.value.push({ id, message, tone, action });
        setTimeout(() => dismiss(id), timeout);
        return id;
    }

    return { toasts, push, dismiss };
}