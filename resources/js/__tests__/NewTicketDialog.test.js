import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import NewTicketDialog from '../components/NewTicketDialog.vue';
import { ApiError } from '../api';

// jsdom does not implement <dialog>.showModal()/close(), so provide minimal versions.
beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function () {
        this.removeAttribute('open');
    };
});

let create;

async function openDialog() {
    const wrapper = mount(NewTicketDialog, { props: { modelValue: false, create } });
    await wrapper.setProps({ modelValue: true });
    return wrapper;
}

const submit = async (wrapper) => {
    await wrapper.find('form').trigger('submit');
    await flushPromises();
};

beforeEach(() => {
    create = vi.fn().mockResolvedValue(undefined);
});

describe('NewTicketDialog', () => {
    it('opens the native dialog when modelValue becomes true', async () => {
        const wrapper = await openDialog();

        expect(wrapper.find('dialog').element.hasAttribute('open')).toBe(true);
    });

    it('blocks an empty title with an inline message and does not call the API', async () => {
        const wrapper = await openDialog();

        await submit(wrapper);

        expect(wrapper.text()).toContain('Give the ticket a short title.');
        expect(create).not.toHaveBeenCalled();
    });

    it('submits the form values and closes on success', async () => {
        const wrapper = await openDialog();

        await wrapper.find('#title').setValue('Printer down');
        await wrapper.find('#description').setValue('Floor 2');
        await wrapper.findAll('input[type="radio"]')[2].setChecked(true); // High
        await submit(wrapper);

        expect(create).toHaveBeenCalledWith({ title: 'Printer down', description: 'Floor 2', priority: 'high' });
        expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false]);
    });

    it('defaults priority to medium', async () => {
        const wrapper = await openDialog();

        await wrapper.find('#title').setValue('Keyboard request');
        await submit(wrapper);

        expect(create).toHaveBeenCalledWith(expect.objectContaining({ priority: 'medium' }));
    });

    it('shows server validation errors and stays open', async () => {
        create.mockRejectedValue(new ApiError(422, 'invalid', { title: ['The title may not be that long.'] }));
        const wrapper = await openDialog();

        await wrapper.find('#title').setValue('x');
        await submit(wrapper);

        expect(wrapper.text()).toContain('The title may not be that long.');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('shows a general error when the server cannot be reached', async () => {
        create.mockRejectedValue(new ApiError(0, 'Cannot reach the server. Check your connection and try again.'));
        const wrapper = await openDialog();

        await wrapper.find('#title').setValue('x');
        await submit(wrapper);

        expect(wrapper.find('[role="alert"]').text()).toContain('Cannot reach the server');
    });
});