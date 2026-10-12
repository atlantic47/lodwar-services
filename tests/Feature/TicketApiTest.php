<?php

namespace Tests\Feature;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_ticket_with_defaults(): void
    {
        $this->postJson('/api/tickets', ['title' => 'Printer is down'])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Printer is down')
            ->assertJsonPath('data.status', 'open')
            ->assertJsonPath('data.priority', 'medium');

        $this->assertDatabaseHas('tickets', ['title' => 'Printer is down']);
    }

    public function test_it_validates_ticket_creation(): void
    {
        $this->postJson('/api/tickets', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('title');

        $this->postJson('/api/tickets', ['title' => 'x', 'priority' => 'urgent'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('priority');
    }

    public function test_it_lists_tickets_with_status_filter_and_pagination(): void
    {
        Ticket::factory()->count(3)->create(['status' => TicketStatus::Open]);
        Ticket::factory()->count(2)->create(['status' => TicketStatus::Closed]);

        $this->getJson('/api/tickets?status=open&limit=2&page=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.current_page', 2);

        $this->getJson('/api/tickets')->assertOk()->assertJsonPath('meta.total', 5);
    }

    public function test_it_rejects_invalid_list_params(): void
    {
        $this->getJson('/api/tickets?status=nope')->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->getJson('/api/tickets?limit=1000')->assertUnprocessable()->assertJsonValidationErrors('limit');
    }

    public function test_it_updates_status_and_priority(): void
    {
        $ticket = Ticket::factory()->create(['status' => TicketStatus::Open, 'priority' => 'low']);

        $this->patchJson("/api/tickets/{$ticket->id}", ['status' => 'in_progress', 'priority' => 'high'])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.priority', 'high');
    }

    public function test_patch_ignores_other_fields_and_rejects_empty_or_invalid_payloads(): void
    {
        $ticket = Ticket::factory()->create(['title' => 'Original']);

        $this->patchJson("/api/tickets/{$ticket->id}", ['title' => 'Hacked'])->assertUnprocessable();
        $this->patchJson("/api/tickets/{$ticket->id}", ['status' => 'bogus'])->assertUnprocessable();
        $this->assertSame('Original', $ticket->fresh()->title);
    }

    public function test_patch_unknown_ticket_returns_404(): void
    {
        $this->patchJson('/api/tickets/9999', ['status' => 'closed'])->assertNotFound();
    }

    public function test_stats_counts_by_status_and_zero_fills(): void
    {
        Ticket::factory()->count(2)->create(['status' => TicketStatus::Open]);
        Ticket::factory()->create(['status' => TicketStatus::Closed]);

        $this->getJson('/api/tickets/stats')
            ->assertOk()
            ->assertExactJson(['data' => ['open' => 2, 'in_progress' => 0, 'closed' => 1, 'total' => 3]]);
    }

    public function test_soft_deleted_tickets_are_hidden_and_restorable(): void
    {
        $ticket = Ticket::factory()->create(['status' => TicketStatus::Open]);

        $this->deleteJson("/api/tickets/{$ticket->id}")->assertNoContent();
        $this->assertSoftDeleted('tickets', ['id' => $ticket->id]);

        $this->getJson('/api/tickets')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/tickets/stats')->assertJsonPath('data.open', 0);
        $this->patchJson("/api/tickets/{$ticket->id}", ['status' => 'closed'])->assertNotFound();

        $this->postJson("/api/tickets/{$ticket->id}/restore")->assertOk();
        $this->getJson('/api/tickets/stats')->assertJsonPath('data.open', 1);
    }
}