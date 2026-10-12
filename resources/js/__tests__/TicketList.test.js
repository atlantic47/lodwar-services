import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TicketList from '../components/TicketList.vue';

const ticket = {
    id: 1,
    title: 'Printer down',
    description: 'Floor 2 printer is offline',
    status: 'open',
    priority: 'high',
    created_at: '2026-10-12T10:00:00Z',
    updated_at: '2026-10-12T10:00:00Z',
};
const meta = { current_page: 1, last_page: 1, total: 1, from: 1, to: 1 };

const mountList = (props = {}) =>
    mount(TicketList, { props: { tickets: [ticket], meta, loading: false, filtered: false, ...props } });

const button = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().includes(text));
const option = (wrapper, text) => wrapper.findAll('[role="option"]').find((o) => o.text().startsWith(text));

describe('TicketList', () => {
    it('renders the ticket title and id', () => {
        const wrapper = mountList();

        expect(wrapper.text()).toContain('Printer down');
        expect(wrapper.text()).toContain('#1');
    });

    it('changes priority in place and emits the patch', async () => {
        const wrapper = mountList();
        const [priorityMenu] = wrapper.findAll('[aria-haspopup="listbox"]');

        await priorityMenu.trigger('click');
        await option(wrapper, 'Low').trigger('click');

        expect(wrapper.emitted('update')[0]).toEqual([ticket, { priority: 'low' }]);
    });

    it('changes status in place and emits the patch', async () => {
        const wrapper = mountList();
        const statusMenu = wrapper.findAll('[aria-haspopup="listbox"]')[1];

        await statusMenu.trigger('click');
        await option(wrapper, 'Closed').trigger('click');

        expect(wrapper.emitted('update')[0]).toEqual([ticket, { status: 'closed' }]);
    });

    it('expands to show the description, and delete emits remove', async () => {
        const wrapper = mountList();
        expect(wrapper.text()).not.toContain('Floor 2 printer is offline');

        await wrapper.find('[aria-expanded]').trigger('click');
        expect(wrapper.text()).toContain('Floor 2 printer is offline');

        await button(wrapper, 'Delete ticket').trigger('click');
        expect(wrapper.emitted('remove')[0]).toEqual([ticket]);
    });

    it('shows a create call to action when there are no tickets', async () => {
        const wrapper = mountList({ tickets: [] });

        expect(wrapper.text()).toContain('No tickets yet');
        await button(wrapper, 'Create ticket').trigger('click');

        expect(wrapper.emitted('create')).toHaveLength(1);
    });

    it('offers to clear the filter when a status has no tickets', async () => {
        const wrapper = mountList({ tickets: [], filtered: true });

        expect(wrapper.text()).toContain('No tickets with this status');
        await button(wrapper, 'Show all tickets').trigger('click');

        expect(wrapper.emitted('clear-filter')).toHaveLength(1);
    });

    it('shows a skeleton instead of the empty state while the first load runs', () => {
        const wrapper = mountList({ tickets: [], loading: true });

        expect(wrapper.text()).not.toContain('No tickets yet');
        expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true);
    });

    it('emits the requested page from the pagination controls', async () => {
        const wrapper = mountList({ meta: { current_page: 2, last_page: 3, total: 25, from: 11, to: 20 } });

        expect(wrapper.text()).toContain('Showing 11 to 20 of 25');
        await button(wrapper, 'Next').trigger('click');
        await button(wrapper, 'Previous').trigger('click');

        expect(wrapper.emitted('page')).toEqual([[3], [1]]);
    });
});