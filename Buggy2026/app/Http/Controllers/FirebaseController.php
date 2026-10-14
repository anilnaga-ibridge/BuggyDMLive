<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FirebaseController extends Controller
{
    protected $messaging;

    public function __construct()
    {
        $this->messaging = app('firebase.messaging');
    }

    public function subscribeToTopic(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'topic' => 'required|string',
        ]);

        $token = $request->input('token');
        $topic = $request->input('topic');

        try {
            if($this->messaging){
                $this->messaging->subscribeToTopic($topic, $token);
                return response()->json(['message' => 'Successfully subscribed to topic'], 200);
            }
            return response()->json(['message' => 'Firebase push notification is not configured'], 200);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 200);
        }
    }
}
