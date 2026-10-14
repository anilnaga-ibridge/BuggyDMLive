<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerPushDevice extends Model
{
    protected $guarded = [];

    protected $hidden = [
        'installation_id_hash',
        'token_hash',
        'token_ciphertext',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
        'disabled_at' => 'datetime',
    ];
}
