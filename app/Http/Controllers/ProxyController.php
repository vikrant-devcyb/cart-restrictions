<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Shop;

class ProxyController extends Controller
{
    public function handle(Request $request)
    {
        $action = $request->query('action');
        Log::info('Proxy hit', $request->all());

        if (!$this->validateSignature($request->all(), $request->get('signature'))) {
            Log::error('Invalid app proxy signature', $request->all());
            return response()->json(['error' => 'Invalid app proxy signature'], 403);
        }

        $shop = $request->get('shop');
        $variantIds = explode(',', $request->get('variant_ids', ''));
        if (!$shop || empty($variantIds)) {
            Log::error('Missing shop or variant_ids');
            return response()->json(['error' => 'Missing shop or variant_ids'], 400);
        }

        $accessToken = $this->getShopToken($shop);
        if (!$accessToken) {
            Log::error('Access token not found for shop', ['shop' => $shop]);
            return response()->json(['error' => 'Access token not found'], 403);
        }

        try {
            $locationsResp = Http::withHeaders([
                'X-Shopify-Access-Token' => $accessToken
            ])->get("https://{$shop}/admin/api/2024-04/locations.json");

            $locationMap = collect($locationsResp['locations'] ?? [])
                ->mapWithKeys(fn($loc) => [$loc['id'] => $loc['name']])
                ->toArray();

            $allLocations = [];
            $conflicts = [];

            foreach ($variantIds as $variantId) {
                $variantResp = Http::withHeaders([
                    'X-Shopify-Access-Token' => $accessToken
                ])->get("https://{$shop}/admin/api/2024-04/variants/{$variantId}.json");

                if (!$variantResp->successful()) {
                    Log::error('Failed to fetch variant', ['variant_id' => $variantId]);
                    continue;
                }
                $variant = $variantResp['variant'];

                // Fetch product
                $productResp = Http::withHeaders([
                    'X-Shopify-Access-Token' => $accessToken
                ])->get("https://{$shop}/admin/api/2024-04/products/{$variant['product_id']}.json");

                $productTitle = $productResp['product']['title'] ?? 'Product';

                // Fetch inventory levels
                $inventoryResp = Http::withHeaders([
                    'X-Shopify-Access-Token' => $accessToken
                ])->get("https://{$shop}/admin/api/2024-04/inventory_levels.json", [
                    'inventory_item_ids' => $variant['inventory_item_id']
                ]);

                if (!$inventoryResp->successful()) {
                    Log::error('Failed to fetch inventory levels', ['inventory_item_id' => $variant['inventory_item_id']]);
                    continue;
                }

                $levels = $inventoryResp['inventory_levels'];
                if (!empty($levels)) {
                    $locationId = $levels[0]['location_id'];
                    $locationName = $locationMap[$locationId] ?? 'Unknown location';
                    $allLocations[] = $locationId;

                    $conflicts[] = [
                        'name' => "{$productTitle} - {$variant['title']} / {$variant['sku']}",
                        'location' => $locationName,
                        'sku' => @$variant['sku']
                    ];
                }
            }

            $uniqueLocations = array_unique($allLocations);

            return response()->json([
                'allow_checkout' => count($uniqueLocations) <= 1,
                'locations' => $uniqueLocations,
                'conflicts' => count($uniqueLocations) > 1 ? $conflicts : []
            ]);

        } catch (\Exception $e) {
            Log::error('Proxy handler exception', ['exception' => $e->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Validate signatures from Shopify
     * Returns: boolean (true if valid, false if invalid)
    */
    private function validateSignature($params, $signature)
    {
        if (!$signature){
            Log::warning('No signature provided');
            return false;

        }
        $shared_secret = config('shopify.api_secret');
        $params = request()->all();
        if (!$params['logged_in_customer_id']){
            $params['logged_in_customer_id'] = $params['logged_in_customer_id'] ?? "";

        }
        $params = array_diff_key($params, array('signature' => ''));
        ksort($params);
        $params = str_replace("%2F","/",http_build_query($params));
        $params = str_replace("&","",$params);
        $params = str_replace("%2C", ",", $params);
        $computed_hmac = hash_hmac('sha256', $params, $shared_secret);
        return hash_equals($signature, $computed_hmac);
    }


    private function getShopToken($shop)
    {
        $shopRecord = Shop::where('shopify_domain', $shop)->first();
        return $shopRecord ? $shopRecord->access_token : null;
    }

}

