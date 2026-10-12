<script setup>
import { useToasts } from '../composables/useToasts';

const { toasts, dismiss } = useToasts();

function run(toast) {
    toast.action.run();
    dismiss(toast.id);
}
</script>

<template>
    <div
        class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
    >
        <div
            v-for="t in toasts"
            :key="t.id"
            class="pointer-events-auto flex max-w-md items-center gap-4 rounded-xl px-4 py-3 text-sm text-white shadow-lg"
            :class="t.tone === 'error' ? 'bg-red-700' : 'bg-slate-900'"
        >
            <span class="flex-1">{{ t.message }}</span>
            <button
                v-if="t.action"
                type="button"
                class="rounded px-1 font-semibold text-cyan-300 hover:underline focus-visible:outline-2 focus-visible:outline-cyan-300"
                @click="run(t)"
            >
                {{ t.action.label }}
            </button>
            <button
                type="button"
                class="rounded px-1 text-white/70 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                aria-label="Dismiss"
                @click="dismiss(t.id)"
            >
                ✕
            </button>
        </div>
    </div>
</template>