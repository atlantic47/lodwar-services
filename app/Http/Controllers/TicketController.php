<?php

namespace App\Http\Controllers;

use App\Enums\TicketStatus;
use App\Http\Requests\ListTicketsRequest;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class TicketController extends Controller
{
    /** GET /tickets?status=&page=&limit= */
    public function index(ListTicketsRequest $request)
    {
        $tickets = Ticket::query()
            ->withStatus($request->status())
            ->orderByDesc('created_at')
            ->orderByDesc('id') // stable order for tickets created in the same second
            ->paginate($request->limit())
            ->withQueryString();

        return TicketResource::collection($tickets);
    }

    /** POST /tickets */
    public function store(StoreTicketRequest $request): TicketResource
    {
        $ticket = Ticket::create($request->validated());

        return new TicketResource($ticket); // 201 automatically (wasRecentlyCreated)
    }

    /** PATCH /tickets/{ticket} */
    public function update(UpdateTicketRequest $request, Ticket $ticket): TicketResource
    {
        $ticket->update($request->validated());

        return new TicketResource($ticket);
    }

    /** DELETE /tickets/{ticket}: soft delete */
    public function destroy(Ticket $ticket): Response
    {
        $ticket->delete();

        return response()->noContent();
    }

    /** POST /tickets/{id}/restore */
    public function restore(int $id): TicketResource
    {
        $ticket = Ticket::onlyTrashed()->findOrFail($id);
        $ticket->restore();

        return new TicketResource($ticket);
    }

    /** GET /tickets/stats: counts grouped by status (soft-deleted excluded, zero-filled). */
    public function stats(): JsonResponse
    {
        $counts = Ticket::query()
            ->toBase()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $data = [];
        foreach (TicketStatus::cases() as $status) {
            $data[$status->value] = (int) ($counts[$status->value] ?? 0);
        }
        $data['total'] = array_sum($data);

        return response()->json(['data' => $data]);
    }
}