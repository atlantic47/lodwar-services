<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ApiError } from '../api';
import { PRIORITIES } from '../constants';

const props = defineProps({
    modelValue: Boolean,
    create: { type: Function, required: true },
});
const emit = defineEmits(['update:modelValue']);

const dlg = ref(null);
const blank = () => ({ title: '', description: '', priority: 'medium' });
const form = reactive(blank());
const errors = ref({});
const message = ref('');
const saving = ref(false);

const priorityHint = computed(() => PRIORITIES.find((p) => p.value === form.priority)?.hint);

// A draft is kept if the dialog is closed by accident; it is only cleared after a successful save.
watch(
    () => props.modelValue,
    (open) => {
        if (open && !dlg.value.open) {
            errors.value = {};
            message.value = '';
            dlg.value.showModal();
        } else if (!open && dlg.value.open) {
            dlg.value.close();
        }
    },
);

const close = () => emit('update:modelValue', false);

async function submit() {
    if (saving.value) return;
    errors.value = {};
    message.value = '';

    if (!form.title.trim()) {
        errors.value = { title: ['Give the ticket a short title.'] };
        return;
    }

    saving.value = true;
    try {
        await props.create({ ...form });
        Object.assign(form, blank());
        close();
    } catch (e) {
        if (e instanceof ApiError && Object.keys(e.errors).length) errors.value = e.errors;
        else message.value = e.message ?? 'Could not create the ticket. Try again.';
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <dialog
        ref="dlg"
        class="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40"
        aria-labelledby="new-ticket-title"
        @close="close"
        @click.self="close"
    >
        <form class="p-6" novalidate @submit.prevent="submit">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h2 id="new-ticket-title" class="text-lg font-semibold">New ticket</h2>
                    <p class="text-sm text-slate-500">Describe the problem so someone can pick it up.</p>
                </div>
                <button
                    type="button"
                    class="-mr-2 -mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-cyan-800"
                    aria-label="Close"
                    @click="close"
                >
                    <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                            d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4L11.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 0 1-1.4-1.4L8.6 10 5.3 6.7a1 1 0 0 1 0-1.4z"
                        />
                    </svg>
                </button>
            </div>

            <div class="mt-5 space-y-5">
                <div>
                    <label for="title" class="mb-1.5 block text-sm font-medium">Title</label>
                    <input
                        id="title"
                        v-model="form.title"
                        type="text"
                        maxlength="255"
                        autofocus
                        autocomplete="off"
                        placeholder="e.g. Printer on floor 2 is offline"
                        class="w-full rounded-lg border px-3 py-2 focus-visible:outline-2 focus-visible:outline-cyan-800"
                        :class="errors.title ? 'border-red-500' : 'border-slate-300'"
                        :aria-invalid="!!errors.title"
                        aria-describedby="title-error"
                    />
                    <p v-if="errors.title" id="title-error" class="mt-1 text-sm text-red-700">{{ errors.title[0] }}</p>
                </div>

                <div>
                    <label for="description" class="mb-1.5 block text-sm font-medium">
                        Description <span class="font-normal text-slate-500">(optional)</span>
                    </label>
                    <textarea
                        id="description"
                        v-model="form.description"
                        rows="4"
                        placeholder="What happened, and what have you tried?"
                        class="w-full rounded-lg border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-cyan-800"
                        @keydown.ctrl.enter="submit"
                        @keydown.meta.enter="submit"
                    />
                    <p v-if="errors.description" class="mt-1 text-sm text-red-700">{{ errors.description[0] }}</p>
                </div>

                <fieldset>
                    <legend class="mb-1.5 text-sm font-medium">Priority</legend>
                    <div class="grid grid-cols-3 gap-2">
                        <label v-for="p in PRIORITIES" :key="p.value" class="cursor-pointer">
                            <input
                                v-model="form.priority"
                                type="radio"
                                name="priority"
                                :value="p.value"
                                class="peer sr-only"
                            />
                            <span
                                class="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium transition peer-checked:border-cyan-800 peer-checked:bg-cyan-50 peer-checked:text-cyan-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-800"
                            >
                                <span class="size-2 rounded-full" :class="p.dot" aria-hidden="true" />
                                {{ p.label }}
                            </span>
                        </label>
                    </div>
                    <p class="mt-1.5 text-xs text-slate-500">{{ priorityHint }}</p>
                    <p v-if="errors.priority" class="mt-1 text-sm text-red-700">{{ errors.priority[0] }}</p>
                </fieldset>

                <p v-if="message" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                    {{ message }}
                </p>
            </div>

            <div class="mt-6 flex justify-end gap-2">
                <button
                    type="button"
                    class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-cyan-800"
                    @click="close"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    :disabled="saving"
                    class="rounded-lg bg-cyan-800 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800 disabled:opacity-60"
                >
                    {{ saving ? 'Creating…' : 'Create ticket' }}
                </button>
            </div>
        </form>
    </dialog>
</template>