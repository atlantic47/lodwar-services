<script setup>
import { computed, onMounted, ref } from 'vue';
import { useTickets } from './composables/useTickets';
import StatsBar from './components/StatsBar.vue';
import TicketList from './components/TicketList.vue';
import NewTicketDialog from './components/NewTicketDialog.vue';
import ToastStack from './components/ToastStack.vue';

const { tickets, meta, stats, filter, loading, error, load, create, updateTicket, remove, setFilter, setPage } =
    useTickets();

const dialogOpen = ref(false);
const needsAttention = computed(() => stats.value.open + stats.value.in_progress);

onMounted(() => load());
</script>

<template>
    <main class="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header class="flex items-end justify-between gap-4">
            <div>
                <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Support tickets</h1>
                <p class="mt-1 text-sm text-slate-600">
                    <template v-if="stats.total === 0">Lodwar Services</template>
                    <template v-else-if="needsAttention === 0">Everything is resolved. Nice work.</template>
                    <template v-else>
                        {{ needsAttention }} {{ needsAttention === 1 ? 'ticket needs' : 'tickets need' }} attention
                    </template>
                </p>
            </div>
            <button
                type="button"
                class="flex shrink-0 items-center gap-2 rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800"
                @click="dialogOpen = true"
            >
                <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                        d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z"
                    />
                </svg>
                New ticket
            </button>
        </header>

        <div class="mt-6">
            <StatsBar :stats="stats" :active="filter" @select="setFilter" />
        </div>

        <div
            v-if="error"
            role="alert"
            class="mt-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
            <span>{{ error }}</span>
            <button type="button" class="font-semibold underline" @click="load()">Try again</button>
        </div>

        <div class="mt-4">
            <TicketList
                :tickets="tickets"
                :meta="meta"
                :loading="loading"
                :filtered="filter !== ''"
                @update="updateTicket"
                @remove="remove"
                @page="setPage"
                @create="dialogOpen = true"
                @clear-filter="setFilter('')"
            />
        </div>
    </main>

    <NewTicketDialog v-model="dialogOpen" :create="create" />
    <ToastStack />
</template>