<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerCheckoutQuote extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'snapshot' => 'array',
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];
}
