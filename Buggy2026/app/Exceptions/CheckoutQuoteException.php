<?php

namespace App\Exceptions;

use RuntimeException;

class CheckoutQuoteException extends RuntimeException
{
    public function __construct(
        string $code,
        public readonly int $status = 422,
        public readonly ?string $field = null,
    ) {
        parent::__construct($code);
    }
}
