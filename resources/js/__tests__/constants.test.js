import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRIORITIES, STATUSES, label, timeAgo } from '../constants';

describe('label', () => {
    it('returns the display label for a value', () => {
        expect(label(STATUSES, 'in_progress')).toBe('In progress');
    });

    it('falls back to the raw value when unknown', () => {
        expect(label(STATUSES, 'weird')).toBe('weird');
    });
});

describe('timeAgo', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-12T12:00:00Z'));
    });
    afterEach(() => vi.useRealTimers());

    it('formats recent times in plain language', () => {
        expect(timeAgo('2026-10-12T11:59:40Z')).toBe('just now');
        expect(timeAgo('2026-10-12T11:55:00Z')).toBe('5 min ago');
        expect(timeAgo('2026-10-12T09:00:00Z')).toBe('3 h ago');
        expect(timeAgo('2026-10-10T12:00:00Z')).toBe('2 d ago');
    });

    it('switches to a calendar date after 30 days', () => {
        expect(timeAgo('2026-01-01T12:00:00Z')).not.toMatch(/ago/);
    });
});

describe('option config', () => {
    it('gives every status and priority a label, hint and colours', () => {
        [...STATUSES, ...PRIORITIES].forEach((option) => {
            expect(option.label).toBeTruthy();
            expect(option.hint).toBeTruthy();
            expect(option.dot).toBeTruthy();
            expect(option.pill).toBeTruthy();
        });
    });
});