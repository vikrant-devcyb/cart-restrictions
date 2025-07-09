<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Shop;

class ShopifyInjectScriptTag extends Command
{
    protected $signature = 'shopify:inject-scripttag {shopDomain}';
    protected $description = 'Inject the cart-check ScriptTag into the given Shopify store';

    public function handle()
    {
        $shopDomain = $this->argument('shopDomain');

        $shop = Shop::where('shopify_domain', $shopDomain)->first();

        if (!$shop) {
            $this->error("Shop not found in DB: $shopDomain");
            return;
        }

        $accessToken = $shop->access_token;
        $scriptUrl = rtrim(env('APP_URL'), '/') . '/cart-check.js';

        // Fetch existing ScriptTags
        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $accessToken
        ])->get("https://{$shopDomain}/admin/api/2024-04/script_tags.json");

        // echo"<pre>"; print_r($accessToken);  echo"<br>"; 
        // echo"<pre>"; print_r($response);  die;

        if (!$response->successful()) {
            $this->error("Failed to fetch ScriptTags: " . $response->body());
            return;
        }

        $tags = $response['script_tags'] ?? [];
        $this->info("Found " . count($tags) . " ScriptTags");

        // Delete existing
        foreach ($tags as $tag) {
            $del = Http::withHeaders([
                'X-Shopify-Access-Token' => $accessToken
            ])->delete("https://{$shopDomain}/admin/api/2024-04/script_tags/{$tag['id']}.json");

            if ($del->successful()) {
                $this->info("Deleted ScriptTag ID: {$tag['id']}");
            } else {
                $this->warn("Could not delete ScriptTag ID: {$tag['id']}");
            }
        }

        // Inject new
        $inject = Http::withHeaders([
            'X-Shopify-Access-Token' => $accessToken
        ])->post("https://{$shopDomain}/admin/api/2024-04/script_tags.json", [
            'script_tag' => [
                'event' => 'onload',
                'src' => $scriptUrl
            ]
        ]);

        if (in_array($inject->status(), [200, 201])) {
            $this->info("ScriptTag injected! ID: " . ($inject['script_tag']['id'] ?? 'unknown'));
        } else {
            $this->error("Injection failed: " . $inject->body());
        }
    }
}
