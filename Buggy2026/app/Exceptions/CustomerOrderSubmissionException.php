<?php

namespace App\Exceptions;

use RuntimeException;

class CustomerOrderSubmissionException extends RuntimeException
{
    public function __construct(string $code, public readonly int $status = 409)
    {
        parent::__construct($code);
    }
}
