// console.log("CartCheck loaded!!");

// // Detect context
// const isCartPage = window.location.pathname === '/cart';
// const isProductPage = !!document.querySelector('#ProductSubmitButton-template--24387196125473__main');

// // Main location check
// async function checkCartLocationStatus() {
//     console.log("Checking cart locations...");
//     showLoader();

//     try {
//         const cartResponse = await fetch('/cart.js');
//         const cartData = await cartResponse.json();

//         const items = cartData.items;
//         if (!items || items.length === 0) {
//             console.log("Cart is empty, skip location check.");
//             enableCheckout();
//             hideLoader();
//             return;
//         }

//         const variantIds = items.map(i => i.variant_id).join(',');
//         const shop = window.Shopify && window.Shopify.shop ? window.Shopify.shop : '';

//         if (!shop) {
//             console.warn("Could not detect shop domain.");
//             hideLoader();
//             return;
//         }

//         const url = `/apps/location-check-v2?shop=${shop}&variant_ids=${variantIds}`;
//         const response = await fetch(url);
//         const data = await response.json();

//         console.log("Location check result:", data);

//         if (!data.allow_checkout) {
//             disableCheckout();
//             showConflictToastSummary(data.locations.length, data.conflicts.length);
//             window.conflictData = data.conflicts; // store for modal
//         } else {
//             enableCheckout();
//         }
//     } catch (err) {
//         console.error("Error during location check:", err);
//     } finally {
//         hideLoader();
//     }
// }

// // Disable checkout buttons
// function disableCheckout() {
//     document.querySelectorAll('#CartDrawer-Checkout, #cHeckOout, [name="checkout"]').forEach(btn => {
//         btn.disabled = true;
//         btn.style.opacity = '0.5';
//         btn.style.cursor = 'not-allowed';
//         btn.style.pointerEvents = 'none';
//     });
// }

// // Enable checkout buttons
// function enableCheckout() {
//     document.querySelectorAll('#CartDrawer-Checkout, #cHeckOout, [name="checkout"]').forEach(btn => {
//         btn.disabled = false;
//         btn.style.opacity = '';
//         btn.style.cursor = '';
//         btn.style.pointerEvents = '';
//     });
// }

// // Loader
// function showLoader() {
//     let loader = document.getElementById('location-check-loader');
//     if (!loader) {
//         loader = document.createElement('div');
//         loader.id = 'location-check-loader';
//         loader.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;';
        
//         loader.innerHTML = `
//             <div style="border:8px solid #f3f3f3; border-top:8px solid #0073e6; border-radius:50%; width:60px; height:60px; animation:spin 1s linear infinite;"></div>
//             <div style="color:#fff; margin-top:10px; font-size:16px;">Please wait, checking shipping rules...</div>
//         `;
        
//         const style = document.createElement('style');
//         style.innerHTML = `@keyframes spin {0% {transform:rotate(0deg);} 100% {transform:rotate(360deg);}}`;
//         document.head.appendChild(style);

//         document.body.appendChild(loader);
//     }
//     loader.style.display = 'flex';
// }

// function hideLoader() {
//     const loader = document.getElementById('location-check-loader');
//     if (loader) loader.style.display = 'none';
// }

// // Toast summary
// function showConflictToastSummary(locationCount, itemCount) {
//     const toast = document.getElementById('location-conflict-toast') || createToastContainer();
//     toast.innerHTML = `
//         🚫 <strong>Shipping conflict:</strong> Your cart has ${itemCount} items from ${locationCount} locations. 
//         <a href="#" id="view-conflict-details" style="text-decoration:underline; color:#0073e6;">View Details</a>
//     `;
//     toast.style.display = 'block';

//     document.getElementById('view-conflict-details').onclick = (e) => {
//         e.preventDefault();
//         showConflictModal(window.conflictData || []);
//     };

//     setTimeout(() => { toast.style.display = 'none'; }, 6000);
// }
// function createToastContainer() {
//     const toast = document.createElement('div');
//     toast.id = 'location-conflict-toast';
//     toast.style = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#fff8e1;border:1px solid #fbc02d;padding:12px 18px;border-radius:6px;z-index:9999;font-size:14px;max-width:90%;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
//     document.body.appendChild(toast);
//     return toast;
// }

// //  Modal
// function showConflictModal(conflicts) {
//     let modal = document.getElementById('location-conflict-modal');
//     if (!modal) {
//         modal = document.createElement('div');
//         modal.id = 'location-conflict-modal';
//         modal.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
//         modal.innerHTML = `
//             <div style="background:#fff;padding:20px;max-height:80%;overflow-y:auto;width:90%;max-width:720px;border-radius:8px;position:relative;">
//                 <button id="close-conflict-modal" style="position:absolute;top:10px;right:10px;">✖</button>
//                 <h3 style="margin-top:0;">🚚 Location Shipping Conflict</h3>
//                 <div id="modal-conflict-list"></div>
//             </div>
//         `;
//         document.body.appendChild(modal);
//         document.getElementById('close-conflict-modal').onclick = () => {
//             modal.style.display = 'none';
//         };
//     }

//     // Determine majority location
//     const locCount = {};
//     conflicts.forEach(c => {
//         locCount[c.location] = (locCount[c.location] || 0) + 1;
//     });
//     const majorityLoc = Object.entries(locCount).sort((a, b) => b[1] - a[1])[0][0];

//     // Build list with highlights
//     const list = modal.querySelector('#modal-conflict-list');
//     list.innerHTML = conflicts.map(c => {
//         const bg = c.location === majorityLoc ? '#e8f5e9' : '#ffebee';  // green for majority, red for conflict
//         return `
//             <div style="background:${bg};border:1px solid #ccc; padding:8px; margin-bottom:6px; border-radius:4px;">
//                 <strong>${c.name}</strong><br>
//                 <small>Available from: ${c.location}</small>
//             </div>
//         `;
//     }).join('');

//     modal.style.display = 'flex';
// }


// // Event handlers
// function attachCartEventHandlers() {
//     document.addEventListener('click', (e) => {
//         if (e.target.closest('button.quantity__button') || e.target.closest('.button--tertiary')) {
//             setTimeout(checkCartLocationStatus, 500);
//         }
//     });
//     const addToBagBtn = document.querySelector('button#ProductSubmitButton-template--24387196125473__main');
//     if (addToBagBtn) {
//         addToBagBtn.addEventListener('click', () => {
//             setTimeout(checkCartLocationStatus, 1000);
//         });
//     }
// }

// // Init
// (function(){
//     if (isCartPage || isProductPage) {
//         if (document.readyState === 'loading') {
//             document.addEventListener('DOMContentLoaded', () => {
//                 checkCartLocationStatus();
//                 attachCartEventHandlers();
//             });
//         } else {
//             checkCartLocationStatus();
//             attachCartEventHandlers();
//         }
//     } else {
//         console.log("ℹ️ Location check not needed on this page.");
//     }
// })();

// CHECKOUT BUTTON HANDLE CODE
console.log("CartCheckJS loaded");
let lastVariantIds = '';
let locationTagCache = null;

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
    console.log("Validating cart before checkout...");
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

        const url = `/apps/location-check-v2?shop=${shop}&variant_ids=${variantIds}`;
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
// UNSUBSCRIBE FUNCTIONALITY
// ===========================

// async function unsubscribeCustomer(email, shop) {
//     if (!email) {
//         showCustomAlert("No email found to unsubscribe.", 'error');
//         return;
//     }
//     showLoader();

//     try {
//         const url = `/apps/location-check-v2?action=unsubscribe&email=${encodeURIComponent(email)}&shop=${encodeURIComponent(shop)}`;
//         const response = await fetch(url);
//         const data = await response.json();
//         if (data.message) {
//             showCustomAlert(data.message, 'success');
//         } else if (data.error) {
//             showCustomAlert("Error: " + data.error, 'error');
//         } else {
//             showCustomAlert("Unexpected response from unsubscribe API.", 'warning');
//         }
//     } catch (err) {
//         console.error("Error unsubscribing customer:", err);
//         showCustomAlert("Error unsubscribing customer. Please try again later.", 'error');
//     } finally {
//         hideLoader();
//     }
// }

// (function(){
//     const urlParams = new URLSearchParams(window.location.search);
//     let email = urlParams.get('email');
//     if (email) {
//         email = email.split('?')[0].trim();
//     }

//     function isValidEmail(email) {
//         const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         return re.test(email);
//     }

//     const shop = window.Shopify && window.Shopify.shop ? window.Shopify.shop : '';
//     const isUnsubscribePage = window.location.pathname.includes('/unsubscribe');
//     if (isUnsubscribePage) {
//         if (!isUnsubscribePage) {
//             return;
//         }
        
//         const unsubscribeBtn = document.getElementById('unsubscribeButton');
//         if (unsubscribeBtn) {
//             unsubscribeBtn.addEventListener('click', function(){
//                 unsubscribeCustomer(email, shop);
//             });
//         } else {
//             if (email) {
//                 unsubscribeCustomer(email, shop);
//             } else {
//                 showCustomAlert("No email provided in URL to unsubscribe.", 'error');
//             }
//         }
//     }
// })();

// function showCustomAlert(message, type = 'info') {
//     let container = document.getElementById('custom-alert-container');
//     if (!container) {
//         container = document.createElement('div');
//         container.id = 'custom-alert-container';
//         document.body.appendChild(container);
//     }

//     const alert = document.createElement('div');
//         alert.className = `custom-alert custom-alert-${type}`;
//         alert.innerHTML = `
//         <span>${message}</span>
//         <button onclick="this.parentElement.remove()">×</button>
//     `;  
//     container.appendChild(alert);
//     setTimeout(() => {
//         alert.remove();
//     }, 4000);
// }

// (function(){
//   const alertStyle = `
//     #custom-alert-container {
//       position: fixed;
//       top: 20px;
//       right: 20px;
//       z-index: 99999;
//       display: flex;
//       flex-direction: column;
//       gap: 10px;
//     }
//     .custom-alert {
//       min-width: 250px;
//       max-width: 320px;
//       padding: 14px 18px;
//       border-radius: 8px;
//       color: #fff;
//       font-family: 'Segoe UI', sans-serif;
//       box-shadow: 0 4px 12px rgba(0,0,0,0.2);
//       animation: fadeInOut 4s forwards;
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//     }
//     .custom-alert-success { background-color: #28a745; }
//     .custom-alert-error { background-color: #dc3545; }
//     .custom-alert-warning { background-color: #ffc107; color: #333; }
//     .custom-alert-info { background-color: #17a2b8; }
//     .custom-alert button {
//       background: transparent;
//       border: none;
//       color: inherit;
//       font-size: 18px;
//       cursor: pointer;
//     }
//     @keyframes fadeInOut {
//       0% { opacity: 0; transform: translateY(-10px); }
//       10%, 90% { opacity: 1; transform: translateY(0); }
//       100% { opacity: 0; transform: translateY(-10px); }
//     }
//   `;
//   const styleTag = document.createElement('style');
//   styleTag.innerHTML = alertStyle;
//   document.head.appendChild(styleTag);
// })();


async function unsubscribeCustomer(email, shop) {
    if (!email) {
        updateStatusMessage("No email found to unsubscribe.", 'error');
        return;
    }
    showLoader();

    try {
        const url = `/apps/location-check-v2?action=unsubscribe&email=${encodeURIComponent(email)}&shop=${encodeURIComponent(shop)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.message) {
            updateStatusMessage(data.message, 'success');
        } else if (data.error) {
            updateStatusMessage("Error: " + data.error, 'error');
        } else {
            updateStatusMessage("Unexpected response from unsubscribe API.", 'error');
        }
    } catch (err) {
        console.error("Error unsubscribing customer:", err);
        updateStatusMessage("Error unsubscribing customer. Please try again later.", 'error');
    } finally {
        hideLoader();
    }
}

(function(){
    const urlParams = new URLSearchParams(window.location.search);
    let email = urlParams.get('email');
    if (email) {
        email = email.split('?')[0].trim();
    }

    const shop = window.Shopify && window.Shopify.shop ? window.Shopify.shop : '';
    const isUnsubscribePage = window.location.pathname.includes('/unsubscribe');
    if (isUnsubscribePage) {
        const unsubscribeBtn = document.getElementById('unsubscribeButton');
        if (unsubscribeBtn) {
            unsubscribeBtn.addEventListener('click', function(){
                unsubscribeCustomer(email, shop);
            });
        } else {
            if (email) {
                unsubscribeCustomer(email, shop);
            } else {
                updateStatusMessage("No email provided in URL to unsubscribe.", 'error');
            }
        }
    }
})();

function updateStatusMessage(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.classList.remove('success', 'error', 'warning', 'info');
        statusElement.classList.add(type);
        statusElement.textContent = message;
    } else {
        console.warn('Status message element not found on the page.');
    }
}


// ===========================
// END UNSUBSCRIBE FUNCTIONALITY
// ===========================