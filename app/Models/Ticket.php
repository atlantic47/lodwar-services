<?php

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use HasFactory, SoftDeletes;

    /** Mass-assignable: only fields a client may legitimately set. */
    protected $fillable = ['title', 'description', 'status', 'priority'];

    /** Defaults applied in PHP so they also show on the freshly created model. */
    protected $attributes = [
        'status' => 'open',
        'priority' => 'medium',
    ];

    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'priority' => TicketPriority::class,
        ];
    }

    public function scopeWithStatus(Builder $query, ?TicketStatus $status): Builder
    {
        return $status ? $query->where('status', $status->value) : $query;
    }
}