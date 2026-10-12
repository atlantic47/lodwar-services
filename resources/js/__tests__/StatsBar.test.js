import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import StatsBar from '../components/StatsBar.vue';

const stats = { open: 4, in_progress: 2, closed: 9, total: 15 };
const mountBar = (active = '') => mount(StatsBar, { props: { stats, active } });
const tab = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().includes(text));

describe('StatsBar', () => {
    it('shows a count on every tab', () => {
        const wrapper = mountBar();

        expect(tab(wrapper, 'All').text()).toContain('15');
        expect(tab(wrapper, 'Open').text()).toContain('4');
        expect(tab(wrapper, 'In progress').text()).toContain('2');
        expect(tab(wrapper, 'Closed').text()).toContain('9');
    });

    it('emits the status when a tab is clicked, and an empty string for All', async () => {
        const wrapper = mountBar();

        await tab(wrapper, 'Closed').trigger('click');
        await tab(wrapper, 'All').trigger('click');

        expect(wrapper.emitted('select')).toEqual([['closed'], ['']]);
    });

    it('marks the active tab as pressed', () => {
        const wrapper = mountBar('open');

        expect(tab(wrapper, 'Open').attributes('aria-pressed')).toBe('true');
        expect(tab(wrapper, 'Closed').attributes('aria-pressed')).toBe('false');
    });

    it('describes the distribution for screen readers', () => {
        const wrapper = mountBar();

        expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe('4 open, 2 in progress, 9 closed');
    });
});