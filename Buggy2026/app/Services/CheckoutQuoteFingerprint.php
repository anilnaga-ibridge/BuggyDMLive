<?php

namespace App\Services;

class CheckoutQuoteFingerprint
{
    public function hash(array $value): string
    {
        return hash('sha256', json_encode(
            $this->canonicalize($value),
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION
        ));
    }

    private function canonicalize(mixed $value): mixed
    {
        if (!is_array($value)) return $value;

        if (array_is_list($value)) {
            return array_map(fn (mixed $item) => $this->canonicalize($item), $value);
        }

        ksort($value);
        return array_map(fn (mixed $item) => $this->canonicalize($item), $value);
    }
}
