<?php

use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

// All routes are served under /api (Laravel's default API prefix).
Route::middleware('throttle:60,1')->group(function () {
    Route::get('tickets', [TicketController::class, 'index']);
    Route::post('tickets', [TicketController::class, 'store']);
    Route::get('tickets/stats', [TicketController::class, 'stats']); // declared before {ticket}
    Route::patch('tickets/{ticket}', [TicketController::class, 'update'])->whereNumber('ticket');
    Route::delete('tickets/{ticket}', [TicketController::class, 'destroy'])->whereNumber('ticket');
    Route::post('tickets/{id}/restore', [TicketController::class, 'restore'])->whereNumber('id');
});
