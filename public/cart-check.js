// CHECKOUT BUTTON HANDLE CODE
console.warn("CartCheckJS Railway..!!!");
let lastVariantIdsss = '';
let locationTagCachess = null;

// Loader
function showLoader() {
    let loader = document.getElementById('location-check-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'location-check-loader';
        loader.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:9999;';
        loader.innerHTML = `
            <div style="text-align:center;">
                <div style="border:8px solid #f3f3f3; border-top:8px solid #0073e6; border-radius:50%; width:60px; height:60px; animation:spin 1s linear infinite; margin:auto;"></div>
                <div style="margin-top:10px;color:#fff;">Please wait...</div>
            </div>
        `;
        const style = document.createElement('style');
        style.innerHTML = `@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`;
        document.head.appendChild(style);
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('location-check-loader');
    if (loader) loader.style.display = 'none';
}

// Toast
function showToast(message) {
    let toast = document.getElementById('location-conflict-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'location-conflict-toast';
        toast.style = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#fff8e1;border:1px solid #fbc02d;padding:12px 18px;border-radius:6px;z-index:9999;font-size:14px;max-width:90%;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 6000);
}

// Main validation
async function validateCartBeforeCheckout() {
    console.warn("Validating cart before checkout...");
    showLoader();

    try {
        const cartResponse = await fetch('/cart.js');
        const cartData = await cartResponse.json();
        const items = cartData.items;

        if (!items || items.length === 0) {
            hideLoader();
            return true;
        }

        const variantIds = items.map(i => i.variant_id).join(',');
        const shop = window.Shopify && window.Shopify.shop ? window.Shopify.shop : '';

        if (!shop) {
            console.warn("Shop domain missing, cannot validate.");
            hideLoader();
            return false;
        }

        const url = `/apps/single-location-checkout-contr?shop=${shop}&variant_ids=${variantIds}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.allow_checkout) {
            const conflicts = data.conflicts || [];
            window.conflictData = conflicts;
            insertLocationTagsInCart(conflicts);  // ✅ No duplicate API call
            showConflictModal();
            hideLoader();
            return false;
        }

        hideLoader();
        return true;

    } catch (err) {
        console.error("Error during validation:", err);
        hideLoader();
        showToast("Error validating cart. Please try again.");
        return false;
    }
}

// Minimal Warning Modal
function showConflictModal() {
    let modal = document.getElementById('location-conflict-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'location-conflict-modal';
        modal.style = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        modal.innerHTML = `
            <div class="simple-warning-modal">
                <button id="close-conflict-modal" class="warning-close">×</button>
                <div class="warning-header">🚫 Shipping Conflict Detected</div>
                <div class="warning-message">
                    Your cart contains items from multiple locations.<br>
                    Please ensure all products come from the same location to proceed with checkout.
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        if (!document.getElementById('simple-warning-style')) {
            const style = document.createElement('style');
            style.id = 'simple-warning-style';
            style.innerHTML = `
                .simple-warning-modal {
                    background: #1b1b2d;
                    border-radius: 10px;
                    padding: 24px;
                    max-width: 500px;
                    width: 90%;
                    color: #fff;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
                    animation: fadeIn 0.3s ease-out;
                    position: relative;
                    font-family: 'Segoe UI', sans-serif;
                    text-align: center;
                }
                .warning-close {
                    position: absolute;
                    top: 10px; right: 10px;
                    background: #444;
                    color: #fff;
                    border: none;
                    border-radius: 50%;
                    width: 30px; height: 30px;
                    font-size: 20px;
                    cursor: pointer;
                }
                .warning-close:hover {
                    background: #666;
                }
                .warning-header {
                    font-size: 20px;
                    font-weight: bold;
                    margin-bottom: 16px;
                    color: #ffc107;
                }
                .warning-message {
                    font-size: 15px;
                    color: #f0f0f0;
                    line-height: 1.6;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.getElementById('close-conflict-modal').onclick = () => {
            modal.style.display = 'none';
        };
    }

    modal.style.display = 'flex';
}

// Inject location tags (no API calls)
function insertLocationTagsInCart(conflicts) {
  try {
    if (!conflicts || conflicts.length === 0) return;

    conflicts.forEach(item => {
      const sku = item.sku;
      const dlElements = Array.from(document.querySelectorAll('dl')).filter(dl => dl.textContent.includes(sku));
      if (!dlElements.length) return;

      dlElements.forEach(dl => {
        if (dl.querySelector('.location-tag')) return;

        const locationTag = document.createElement('div');
        locationTag.className = 'location-tag';
        locationTag.textContent = `Available from: ${item.location}`;
        locationTag.style.cssText = 'font-family: NHaasGrotesk-Regular; letter-spacing: .05rem; line-height: 1.7; font-size: 14px; text-transform: capitalize; color:#df1818;';
        dl.appendChild(locationTag);
      });
    });
  } catch (err) {
    console.warn('[Location Tag Error]', err);
  }
}

// Form & button binding
function bindCheckoutValidation() {
    document.querySelectorAll('form[action="/checkout"]').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const allowed = await validateCartBeforeCheckout();
            if (allowed) {
                form.submit();
            } else {
                console.warn("Checkout blocked by location validation.");
            }
        });
    });

    bindDynamicCheckoutButtons();

    const observer = new MutationObserver(() => {
        bindDynamicCheckoutButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Dynamic buttons
function bindDynamicCheckoutButtons() {
    document.querySelectorAll('#CartDrawer-Checkout, #cHeckOout_1').forEach(button => {
        if (button.dataset.bound !== "true") {
            button.dataset.bound = "true";
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                button.disabled = true;
                console.log('Drawer Checkout Clicked');

                const allowed = await validateCartBeforeCheckout();
                if (allowed) {
                    window.location.href = '/checkout';
                } else {
                    button.disabled = false;
                    console.warn("Drawer checkout blocked by validation.");
                }
            });
        }
    });
}

// Initialize
(function () {
  const init = () => {
    bindCheckoutValidation(); // no more insertLocationTagsInCart here
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // No insertLocationTagsInCart in observer either
  const observer = new MutationObserver(() => {
    bindCheckoutValidation();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();

// ===========================
// END FUNCTIONALITY
// ===========================