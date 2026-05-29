/**
 * @file
 * Custom Autoaddress initialization for Multipage Drupal Webforms.
 * Enhanced with verbose logging for troubleshooting.
 */

(function (Drupal, once, drupalSettings) { // Map drupalSettings into the IIFE parameters
    Drupal.behaviors.myAutoaddress = {
        attach: function (context) {
            // console.log('%c[Autoaddress] Drupal Behavior attached.', 'color: #007bff; font-weight: bold;');

            // Safely extract the API key provided by the module's form alter hook
            const apiKeyFromSettings = drupalSettings.autoaddressIntegration?.apiKey;

            if (!apiKeyFromSettings) {
                console.error('[Autoaddress] API Key is missing from drupalSettings! Check module configuration.');
                return;
            }

            // Find our wrapper using once()
            const elements = once('autoaddressInit', '.autoaddress-search-wrapper', context);

            console.log(`[Autoaddress] Found ${elements.length} new wrapper(s) to initialize.`);

            elements.forEach(function (el) {
                // Determine target field
                const fieldKey = el.getAttribute('data-target-field') || 'address';
                // console.log(`[Autoaddress] Processing element for field key: "${fieldKey}"`, el);

                // Clear any existing content inside the wrapper 
                // console.log(`[Autoaddress] Clearing innerHTML for instance stability.`);
                el.innerHTML = '';

                const uniqueId = 'aa-instance-' + Math.floor(Math.random() * 10000);
                el.id = uniqueId;
                // console.log(`[Autoaddress] Assigned unique ID: ${uniqueId}`);

                // Initialize with a slight delay
                // console.log(`[Autoaddress] Setting 100ms timeout for library initialization...`);

                setTimeout(function () {
                    // console.log(`[Autoaddress] Initializing Autoaddress library on #${uniqueId}...`);

                    const aa = Autoaddress({
                        apiKey: apiKeyFromSettings, // Swap out the hardcoded string for the dynamic variable
                        elementId: uniqueId,
                        integrationType: "Combo",
                        hideOnSelect: false,
                        onAddressResult: function (result) {
                            console.log('%c[Autoaddress] Address Result Received:', 'color: #28a745; font-weight: bold;', result);

                            const form = el.closest('form');
                            const addr = result.address || {};

                            const line1 = addr.lines && addr.lines[0] ? addr.lines[0].value : '';
                            const line2 = addr.lines && addr.lines[1] ? addr.lines[1].value : '';

                            const mapping = {
                                'address': line1,
                                'address_2': line2,
                                'city': addr.city ? addr.city.value : '',
                                'postal_code': addr.postcode ? addr.postcode.value : '',
                                'state_province': addr.region ? addr.region.value : '',
                                'country': addr.country ? addr.country.value : ''
                            };

                           // console.log(`[Autoaddress] Starting field mapping for ${fieldKey}...`);

                            for (const [key, value] of Object.entries(mapping)) {
                                const selector = `[name="${fieldKey}[${key}]"]`;
                                const input = form.querySelector(selector);

                                if (input) {
                                    // console.log(`   -> Mapping "${key}": Setting ${selector} to "${value}"`);
                                    input.value = value || '';

                                    // Trigger 'change' for Drupal's States API and validation
                                    input.dispatchEvent(new Event('change', { bubbles: true }));
                                } else {
                                    console.warn(`   -> [!] Target field NOT FOUND: ${selector}`);
                                }
                            }
                            console.log('[Autoaddress] Mapping complete.');
                        }
                    });
                }, 100);
            });
        }
    };
})(Drupal, once, drupalSettings); // Pass drupalSettings into the bottom execution call