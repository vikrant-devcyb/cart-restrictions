<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ShopifyController;
use App\Http\Controllers\ProxyController;
use App\Models\Shop;
use Illuminate\Support\Facades\Request;

Route::get('/cart-check.js', function () {
    return response()->view('js.cart-check')->header('Content-Type', 'application/javascript');
});

// OAuth start
Route::get('/shopify/install', [ShopifyController::class, 'install']);
Route::get('/shopify/callback', [ShopifyController::class, 'callback'])->name('shopify.callback');

// App proxy handler
Route::get('/checkout-proxy-handler', [ProxyController::class, 'handle']);

Route::get('/', function (Request $request) {
    $shop = request()->get('shop'); // Get ?shop= param if passed

    if (!$shop) {
        return view('welcome');
        //return response("Missing shop parameter.", 400);
    }
    $shopRecord = Shop::where('shopify_domain', $shop)->first();

    if ($shopRecord) {
        return view('shopify.dashboard', ['shop' => $shop]);
    } else {
        return view('shopify.not_installed', ['shop' => $shop]);
    }
})->name('shopify.home');
