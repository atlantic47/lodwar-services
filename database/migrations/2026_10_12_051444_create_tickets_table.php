<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            // Strings (not DB enums): portable across MySQL/Postgres and easy to extend.
            // Allowed values are enforced by PHP enums + request validation.
            $table->string('status', 20)->default('open');
            $table->string('priority', 20)->default('medium');
            $table->timestamps();
            $table->softDeletes();

            // Serves the filtered, newest-first list query.
            $table->index(['status', 'created_at']);
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};