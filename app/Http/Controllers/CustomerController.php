<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Shop;

class CustomerController extends Controller
{
    public function unsubscribeCustomer(Request $request)
    {
        echo"<pre>"; print_r($request->all());  die;
        $email = $request->input('email');
        $shopDomain = $request->input('shop');

        // Retrieve shop access token
        $shop = Shop::where('shopify_domain', $shopDomain)->first();
        if (!$shop) {
            return response()->json(['error' => 'Shop not found'], 404);
        }
        $accessToken = $shop->access_token;

        // Fetch customer by email
        $searchResponse = Http::withHeaders([
            'X-Shopify-Access-Token' => $accessToken,
        ])->get("https://{$shopDomain}/admin/api/2024-04/customers/search.json", [
            'query' => $email
        ]);

        if ($searchResponse->failed() || empty($searchResponse['customers'])) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        $customerId = $searchResponse['customers'][0]['id'];

        // Update customer to unsubscribe from marketing
        $updateResponse = Http::withHeaders([
            'X-Shopify-Access-Token' => $accessToken,
            'Content-Type' => 'application/json'
        ])->put("https://{$shopDomain}/admin/api/2024-04/customers/{$customerId}.json", [
            'customer' => [
                'id' => $customerId,
                'accepts_marketing' => false,
            ]
        ]);

        if ($updateResponse->successful()) {
            return response()->json(['message' => 'Customer unsubscribed successfully']);
        } else {
            return response()->json(['error' => 'Failed to unsubscribe customer'], 500);
        }
    }   
}

