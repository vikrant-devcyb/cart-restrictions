<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Shop;

class ShopifyController extends Controller
{
    public function install(Request $request)
    {
        $shop = $request->get('shop');
        $scopes = 'read_products,read_inventory,read_locations,read_script_tags,write_script_tags,read_customers,write_customers';
        $redirectUri = urlencode(env('APP_URL') . '/shopify/callback');
        $apiKey = config('shopify.api_key');
        $installUrl = "https://{$shop}/admin/oauth/authorize?client_id={$apiKey}&scope={$scopes}&redirect_uri={$redirectUri}&state=123&grant_options[]=per-user";
        return redirect($installUrl);
    }

    public function callback(Request $request)
    {
        if (!$this->validateHmac($request->all(), $request->get('hmac'))) {
            abort(403, 'Invalid HMAC');
        }

        $shop = $request->get('shop');
        $code = $request->get('code');
        $apiSecret = config('shopify.api_secret');
        $apiKey = config('shopify.api_key');

        $response = Http::post("https://{$shop}/admin/oauth/access_token", [
            'client_id' => $apiKey,
            'client_secret' => $apiSecret,
            'code' => $code,
        ]);

        $accessToken = $response['access_token'];

        Shop::updateOrCreate(
            ['shopify_domain' => $shop],
            ['access_token' => $accessToken]
        );

        session(['shop' => $shop, 'access_token' => $accessToken]);

        // Inject ScriptTag with APP_URL
        $this->injectScriptTag($shop, $accessToken);

        return view('shopify.installed', ['shop' => $shop]);
    }

    private function injectScriptTag($shop, $accessToken)
    {
        $scriptUrl = rtrim(env('APP_URL'), '/') . '/cart-check.js';

        Log::info("Injecting ScriptTag", ['shop' => $shop, 'src' => $scriptUrl]);
        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $accessToken,
        ])->post("https://{$shop}/admin/api/2024-04/script_tags.json", [
            'script_tag' => [
                'event' => 'onload',
                'src'   => $scriptUrl,
            ],
        ]);

        if ($response->status() == 201) {
            $scriptTagId = $response['script_tag']['id'] ?? 'unknown';
            Log::info("ScriptTag injected successfully! ID: {$scriptTagId}");
        } else {
            $this->error("Failed to inject ScriptTag: " . $response->body());
        }
    }

    private function validateHmac($params, $hmac)
    {
        unset($params['hmac'], $params['signature']);
        ksort($params);
        $computedHmac = hash_hmac('sha256', http_build_query($params), config('shopify.api_secret'));
        return hash_equals($computedHmac, $hmac);
    }
}

