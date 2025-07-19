<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Jobs\InjectScriptTagToShop;
use App\Helpers\ShopStorage;

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

        if (!$response->successful() || !isset($response['access_token'])) {
            Log::error('Failed to get access token', ['response' => $response->json()]);
            abort(500, 'Failed to authenticate with Shopify');
        }


        $accessToken = $response['access_token'];
        ShopStorage::set($shop, $accessToken);
        session(['shop' => $shop, 'access_token' => $accessToken]);

        // Inject ScriptTag with APP_URL
        InjectScriptTagToShop::dispatch($shop, $accessToken);
        return view('shopify.installed', ['shop' => $shop]);
    }

    private function validateHmac($params, $hmac)
    {
        unset($params['hmac'], $params['signature']);
        ksort($params);
        $computedHmac = hash_hmac('sha256', http_build_query($params), config('shopify.api_secret'));
        return hash_equals($computedHmac, $hmac);
    }
}

