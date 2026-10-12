<script setup>
import { reactive } from 'vue';
import OptionMenu from './OptionMenu.vue';
import { PRIORITIES, PRIORITIES_DESC, STATUSES, fullDate, timeAgo } from '../constants';

defineProps({
    tickets: { type: Array, required: true },
    meta: { type: Object, required: true },
    loading: Boolean,
    filtered: Boolean,
});
const emit = defineEmits(['update', 'remove', 'page', 'create', 'clear-filter']);

const expanded = reactive(new Set());
const toggle = (id) => (expanded.has(id) ? expanded.delete(id) : expanded.add(id));
const edge = (priority) => PRIORITIES.find((p) => p.value === priority)?.edge;
</script>

<template>
    <section aria-label="Tickets" :aria-busy="loading">
        <!-- Loading skeleton (first load only) -->
        <ul
            v-if="loading && !tickets.length"
            class="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white"
            aria-hidden="true"
        >
            <li v-for="n in 4" :key="n" class="flex animate-pulse items-center gap-4 px-6 py-4">
                <div class="flex-1 space-y-2">
                    <div class="h-4 w-1/2 rounded bg-slate-200" />
                    <div class="h-3 w-24 rounded bg-slate-100" />
                </div>
                <div class="h-8 w-36 rounded-full bg-slate-200" />
                <div class="h-8 w-36 rounded-full bg-slate-200" />
            </li>
        </ul>

        <!-- Empty state -->
        <div
            v-else-if="!tickets.length"
            class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"
        >
            <template v-if="filtered">
                <p class="font-medium">No tickets with this status</p>
                <p class="mt-1 text-sm text-slate-500">Try another tab or show everything.</p>
                <button
                    type="button"
                    class="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800"
                    @click="emit('clear-filter')"
                >
                    Show all tickets
                </button>
            </template>
            <template v-else>
                <p class="font-medium">No tickets yet</p>
                <p class="mt-1 text-sm text-slate-500">Create the first one to start tracking support requests.</p>
                <button
                    type="button"
                    class="mt-4 rounded-lg bg-cyan-800 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800"
                    @click="emit('create')"
                >
                    Create ticket
                </button>
            </template>
        </div>

        <!-- Tickets -->
        <ul
            v-else
            class="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white transition-opacity"
            :class="{ 'opacity-70': loading }"
        >
            <li v-for="t in tickets" :key="t.id" class="relative hover:bg-slate-50/60">
                <span
                    class="absolute inset-y-4 left-0 w-1 rounded-r-full"
                    :class="edge(t.priority)"
                    aria-hidden="true"
                />

                <div class="flex flex-col gap-3 py-4 pl-6 pr-4 sm:flex-row sm:items-center sm:gap-4">
                    <button
                        type="button"
                        class="min-w-0 flex-1 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800"
                        :aria-expanded="expanded.has(t.id)"
                        @click="toggle(t.id)"
                    >
                        <span class="block font-medium text-slate-900" :class="expanded.has(t.id) ? '' : 'truncate'">
                            {{ t.title }}
                        </span>
                        <span class="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            <span class="font-medium tabular-nums text-slate-400">#{{ t.id }}</span>
                            <span>Opened {{ timeAgo(t.created_at) }}</span>
                        </span>
                    </button>

                    <div class="flex flex-wrap items-center gap-2">
                        <OptionMenu
                            label="Priority"
                            suffix="priority"
                            :options="PRIORITIES_DESC"
                            :model-value="t.priority"
                            @update:model-value="emit('update', t, { priority: $event })"
                        />
                        <OptionMenu
                            label="Status"
                            :options="STATUSES"
                            :model-value="t.status"
                            @update:model-value="emit('update', t, { status: $event })"
                        />
                    </div>
                </div>

                <div v-if="expanded.has(t.id)" class="border-t border-slate-100 bg-slate-50 py-4 pl-6 pr-4 text-sm">
                    <p v-if="t.description" class="max-w-prose whitespace-pre-line text-slate-700">
                        {{ t.description }}
                    </p>
                    <p v-else class="text-slate-500">No description added.</p>
                    <div class="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>Created {{ fullDate(t.created_at) }}</span>
                        <button
                            type="button"
                            class="rounded-md px-2.5 py-1.5 font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700"
                            @click="emit('remove', t)"
                        >
                            Delete ticket
                        </button>
                    </div>
                </div>
            </li>
        </ul>

        <div v-if="meta.last_page > 1" class="mt-3 flex items-center justify-between text-sm text-slate-600">
            <p>Showing {{ meta.from }} to {{ meta.to }} of {{ meta.total }}</p>
            <div class="flex gap-2">
                <button
                    type="button"
                    :disabled="meta.current_page <= 1"
                    class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40"
                    @click="emit('page', meta.current_page - 1)"
                >
                    Previous
                </button>
                <button
                    type="button"
                    :disabled="meta.current_page >= meta.last_page"
                    class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40"
                    @click="emit('page', meta.current_page + 1)"
                >
                    Next
                </button>
            </div>
        </div>
    </section>
</template>