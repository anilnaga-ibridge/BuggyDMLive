<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerOrderSubmission extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = ['response_body' => 'array', 'completed_at' => 'datetime'];
}
