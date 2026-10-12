<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';

const props = defineProps({
    modelValue: { type: String, required: true },
    options: { type: Array, required: true },
    label: { type: String, required: true }, // "Status" or "Priority", used for screen readers
    suffix: { type: String, default: '' }, // e.g. "priority" -> "High priority"
});
const emit = defineEmits(['update:modelValue']);

const root = ref(null);
const trigger = ref(null);
const listEl = ref(null);
const open = ref(false);
const active = ref(0);
const id = `menu-${Math.random().toString(36).slice(2, 8)}`;

const current = computed(() => props.options.find((o) => o.value === props.modelValue) ?? props.options[0]);

function onOutside(event) {
    if (!root.value?.contains(event.target)) close();
}

async function show() {
    active.value = Math.max(0, props.options.findIndex((o) => o.value === props.modelValue));
    open.value = true;
    document.addEventListener('pointerdown', onOutside);
    await nextTick();
    listEl.value?.focus();
}

function close(refocus = false) {
    open.value = false;
    document.removeEventListener('pointerdown', onOutside);
    if (refocus) trigger.value?.focus();
}

function choose(index) {
    const option = props.options[index];
    close(true);
    if (option.value !== props.modelValue) emit('update:modelValue', option.value);
}

function onListKey(e) {
    const count = props.options.length;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        active.value = (active.value + 1) % count;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        active.value = (active.value - 1 + count) % count;
    } else if (e.key === 'Home') {
        e.preventDefault();
        active.value = 0;
    } else if (e.key === 'End') {
        e.preventDefault();
        active.value = count - 1;
    } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose(active.value);
    } else if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
    } else if (e.key === 'Tab') {
        close();
    }
}

onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside));
</script>

<template>
    <div ref="root" class="relative inline-block">
        <button
            ref="trigger"
            type="button"
            class="inline-flex items-center justify-between gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800 sm:min-w-[10.5rem]"
            :class="current.pill"
            aria-haspopup="listbox"
            :aria-expanded="open"
            :aria-label="`${label}: ${current.label}. Press to change.`"
            @click="open ? close() : show()"
            @keydown.down.prevent="show"
        >
            <span class="flex items-center gap-2">
                <span class="size-2 rounded-full" :class="current.dot" aria-hidden="true" />
                {{ current.label }}{{ suffix ? ` ${suffix}` : '' }}
            </span>
            <svg class="size-3.5 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M5.25 7.5 10 12.25 14.75 7.5z" />
            </svg>
        </button>

        <ul
            v-if="open"
            ref="listEl"
            role="listbox"
            tabindex="-1"
            :aria-label="label"
            :aria-activedescendant="`${id}-${active}`"
            class="absolute right-0 z-30 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1 shadow-lg focus:outline-none"
            @keydown="onListKey"
        >
            <li
                v-for="(option, index) in options"
                :id="`${id}-${index}`"
                :key="option.value"
                role="option"
                :aria-selected="option.value === modelValue"
                class="flex items-start gap-3 rounded-lg px-3 py-2"
                :class="index === active ? 'bg-slate-100' : ''"
                @mouseenter="active = index"
                @click="choose(index)"
            >
                <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="option.dot" aria-hidden="true" />
                <span class="flex-1">
                    <span class="block text-sm font-medium text-slate-900">{{ option.label }}</span>
                    <span class="block text-xs text-slate-500">{{ option.hint }}</span>
                </span>
                <svg
                    v-if="option.value === modelValue"
                    class="mt-0.5 size-4 text-cyan-800"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fill-rule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z"
                        clip-rule="evenodd"
                    />
                </svg>
            </li>
        </ul>
    </div>
</template>