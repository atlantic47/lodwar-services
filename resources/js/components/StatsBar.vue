<script setup>
import { computed } from 'vue';
import { STATUSES } from '../constants';

const props = defineProps({
    stats: { type: Object, required: true },
    active: { type: String, default: '' },
});
defineEmits(['select']);

const tabs = [{ value: '', label: 'All', key: 'total', dot: null }, ...STATUSES.map((s) => ({ ...s, key: s.value }))];

const segments = computed(() =>
    STATUSES.map((s) => ({
        ...s,
        pct: props.stats.total ? (props.stats[s.value] / props.stats.total) * 100 : 0,
    })),
);
</script>

<template>
    <section aria-label="Ticket overview">
        <div
            class="flex h-2 gap-0.5 overflow-hidden rounded-full bg-slate-200"
            role="img"
            :aria-label="`${stats.open} open, ${stats.in_progress} in progress, ${stats.closed} closed`"
        >
            <div
                v-for="s in segments"
                :key="s.value"
                class="h-full transition-[width] duration-500"
                :class="s.dot"
                :style="{ width: `${s.pct}%` }"
            />
        </div>

        <div class="mt-3 flex gap-1 overflow-x-auto border-b border-slate-300" role="group" aria-label="Filter by status">
            <button
                v-for="tab in tabs"
                :key="tab.value"
                type="button"
                :aria-pressed="active === tab.value"
                class="-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-800"
                :class="
                    active === tab.value
                        ? 'border-cyan-800 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                "
                @click="$emit('select', tab.value)"
            >
                <span v-if="tab.dot" class="size-2 rounded-full" :class="tab.dot" aria-hidden="true" />
                {{ tab.label }}
                <span
                    class="rounded-full px-1.5 text-xs tabular-nums"
                    :class="active === tab.value ? 'bg-cyan-800 text-white' : 'bg-slate-200 text-slate-600'"
                >
                    {{ stats[tab.key] }}
                </span>
            </button>
        </div>
    </section>
</template>