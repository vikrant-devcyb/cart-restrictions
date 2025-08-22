<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Helpers\ShopStorage;

class ProxyController extends Controller
{
    public function handle(Request $request)
    {
        if (!$this->validateSignature($request->all(), $request->get('signature'))) {
            return response()->json(['error' => 'Invalid app proxy signature'], 403);
        }

        $shop = $request->get('shop');
        $variantIds = explode(',', $request->get('variant_ids', ''));
        
        if (!$shop || empty($variantIds)) {
            return response()->json(['error' => 'Missing shop or variant_ids'], 400);
        }

        $accessToken = $this->getShopToken($shop);
        if (!$accessToken) {
            return response()->json(['error' => 'Access token not found'], 403);
        }

        try {
            $locationsResp = Http::withHeaders([
                'X-Shopify-Access-Token' => $accessToken
            ])->get("https://{$shop}/admin/api/2024-04/locations.json");

            if (!$locationsResp->successful()) {
                return response()->json(['error' => 'Failed to fetch locations'], 500);
            }

            // Location name to country mapping
            $countryMapping = [
                'NL' => 'Netherlands',
                'BROOK STREET' => 'UK',
                'UK' => 'UK',
                'US' => 'USA',
                'NY' => 'USA',
                'DE' => 'Germany',
            ];

            // Clean and map location name + country
            $locationMap = collect($locationsResp['locations'] ?? [])
                ->mapWithKeys(function ($loc) use ($countryMapping) {
                    $cleanName = preg_replace('/^\d+\s*\|\s*/', '', $loc['name']);
                    $country = 'Unknown';

                    foreach ($countryMapping as $keyword => $mappedCountry) {
                        if (stripos($cleanName, $keyword) !== false) {
                            $country = $mappedCountry;
                            break;
                        }
                    }

                    return [$loc['id'] => [
                        'name' => $cleanName,
                        'country' => $country
                    ]];
                })
                ->toArray();

            $allLocations = [];
            $conflicts = [];

            foreach ($variantIds as $variantId) {
                if (empty(trim($variantId))) {
                    continue; // Skip empty variant IDs
                }

                $variantResp = Http::withHeaders([
                    'X-Shopify-Access-Token' => $accessToken
                ])->get("https://{$shop}/admin/api/2024-04/variants/{$variantId}.json");

                if (!$variantResp->successful()) {
                    continue;
                }

                $variant = $variantResp['variant'];

                // Fetch product
                $productResp = Http::withHeaders([
                    'X-Shopify-Access-Token' => $accessToken
                ])->get("https://{$shop}/admin/api/2024-04/products/{$variant['product_id']}.json");

                if (!$productResp->successful()) {
                    continue;
                }

                $productTitle = $productResp['product']['title'] ?? 'Product';
                $rawTitle = $variant['title'];
                $exploded = explode(' / ', $rawTitle);
                $size = trim($exploded[0]);
                $sku = $variant['sku'];

                // Fetch inventory levels
                $inventoryResp = Http::withHeaders([
                    'X-Shopify-Access-Token' => $accessToken
                ])->get("https://{$shop}/admin/api/2024-04/inventory_levels.json", [
                    'inventory_item_ids' => $variant['inventory_item_id']
                ]);

                if (!$inventoryResp->successful()) {
                    continue;
                }

                $levels = $inventoryResp['inventory_levels'];
                if (!empty($levels)) {
                    $locationId = $levels[0]['location_id'];
                    $locationInfo = $locationMap[$locationId] ?? ['name' => 'Unknown', 'country' => 'Unknown'];
                    $locationName = $locationInfo['name'];
                    $shippingCountry = $locationInfo['country'];

                    $allLocations[] = $locationId;

                    $conflicts[] = [
                        'name' => "{$productTitle} - {$variant['title']} / {$variant['sku']}",
                        'location' => $locationName,
                        'shipping_country' => $shippingCountry,
                        'sku' => $variant['sku'] ?? '',
                        'size' => $size
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
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Validate signatures from Shopify
     */
    private function validateSignature($params, $signature)
    {
        if (!$signature) {
            return false;
        }

        $shared_secret = config('shopify.api_secret');
        $params = request()->all();
        
        if (!isset($params['logged_in_customer_id'])) {
            $params['logged_in_customer_id'] = "";
        }

        $params = array_diff_key($params, array('signature' => ''));
        ksort($params);
        $params = str_replace("%2F", "/", http_build_query($params));
        $params = str_replace("&", "", $params);
        $params = str_replace("%2C", ",", $params);
        $computed_hmac = hash_hmac('sha256', $params, $shared_secret);
        
        return hash_equals($signature, $computed_hmac);
    }

    /**
     * Get access token for shop from JSON file
     */
    private function getShopToken($shop)
    {
        try {
            $accessToken = ShopStorage::get($shop);
            if (!$accessToken) {
                return null;
            }

            return $accessToken;
            
        } catch (\Exception $e) {
            return null;
        }
    }
}