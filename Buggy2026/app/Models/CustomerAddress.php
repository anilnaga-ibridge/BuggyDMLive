<?php

namespace App\Models;

use App\Traits\DemoMaskable;
use Illuminate\Database\Eloquent\Model;

class CustomerAddress extends Model
{
    use DemoMaskable;

    protected $fillable = [
        'user_id',
        'contact_person_name',
        'contact_person_number',
        'address_type',
        'address',
        'floor',
        'road',
        'landmark',
        'house',
        'longitude',
        'latitude',
        'zone_id',
        'is_default',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'zone_id' => 'integer',
        'is_default' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
}
