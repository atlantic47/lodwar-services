import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import OptionMenu from '../components/OptionMenu.vue';
import { STATUSES } from '../constants';

const mountMenu = (modelValue = 'open') =>
    mount(OptionMenu, { props: { modelValue, options: STATUSES, label: 'Status' } });

describe('OptionMenu', () => {
    it('shows the current option and keeps the list closed', () => {
        const wrapper = mountMenu('in_progress');

        expect(wrapper.text()).toContain('In progress');
        expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    });

    it('is labelled for screen readers', () => {
        const wrapper = mountMenu('open');

        expect(wrapper.find('button').attributes('aria-label')).toBe('Status: Open. Press to change.');
    });

    it('opens on click, emits the chosen value and closes', async () => {
        const wrapper = mountMenu('open');

        await wrapper.find('button').trigger('click');
        const options = wrapper.findAll('[role="option"]');
        expect(options).toHaveLength(3);

        await options[2].trigger('click');

        expect(wrapper.emitted('update:modelValue')[0]).toEqual(['closed']);
        expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    });

    it('does not emit when the current value is picked again', async () => {
        const wrapper = mountMenu('open');

        await wrapper.find('button').trigger('click');
        await wrapper.findAll('[role="option"]')[0].trigger('click');

        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('supports the keyboard: arrows move, Enter selects', async () => {
        const wrapper = mountMenu('open');

        await wrapper.find('button').trigger('click');
        const listbox = wrapper.find('[role="listbox"]');
        await listbox.trigger('keydown', { key: 'ArrowDown' });
        await listbox.trigger('keydown', { key: 'Enter' });

        expect(wrapper.emitted('update:modelValue')[0]).toEqual(['in_progress']);
    });

    it('closes with Escape without changing anything', async () => {
        const wrapper = mountMenu('open');

        await wrapper.find('button').trigger('click');
        await wrapper.find('[role="listbox"]').trigger('keydown', { key: 'Escape' });

        expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });
});