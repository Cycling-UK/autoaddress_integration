/**
 * @file
 * Custom Autoaddress initialization for Multipage Drupal Webforms.
 */

(function (Drupal, once, drupalSettings) {
    Drupal.behaviors.myAutoaddress = {
        attach: function (context) {
            // Retrieve the API key from drupalSettings.
            const apiKey = drupalSettings.autoaddress_integration.api_key;

            // Target the wrapper class to find the search box on any page.
            const elements = once('autoaddressInit', '.autoaddress-search-wrapper', context);

            elements.forEach(function (el) {
                // 1. Generate a unique ID for this specific search box instance.
                const uniqueId = 'aa-instance-' + Math.floor(Math.random() * 10000);
                el.id = uniqueId;

                // 2. Determine which address field to fill.
                const fieldKey = el.getAttribute('data-target-field') || 'address';

                const aa = Autoaddress({
                    apiKey: apiKey, // Use the dynamic key from drupalSettings.
                    elementId: uniqueId,
                    integrationType: "Combo",
                    hideOnSelect: false,

                    onAddressResult: function (result) {
                        const form = el.closest('form');
                        const addr = result.address || {};

                        const line1 = addr.lines && addr.lines[0] ? addr.lines[0].value : '';
                        const line2 = addr.lines && addr.lines[1] ? addr.lines[1].value : '';

                        const mapping = {
                            'address': line1,
                            'address_2': line2,
                            'city': addr.city ? addr.city.value : '',
                            'postal_code': addr.postcode ? addr.postcode.value : '',
                            'state_province': addr.region ? addr.region.value : '', // UK County
                            'country': addr.country ? addr.country.iso : ''      // ISO Country Name
                        };

                        for (const [key, value] of Object.entries(mapping)) {
                            const selector = `[name="${fieldKey}[${key}]"]`;
                            const input = form.querySelector(selector);

                            if (input) {
                                input.value = value || '';

                                // Handle Country/State dropdowns if they exist.
                                if (input.tagName === 'SELECT') {
                                    const countryText = addr.country ? addr.country.value : '';
                                    Array.from(input.options).forEach(opt => {
                                        if (opt.value === value || opt.text.trim() === countryText) {
                                            input.value = opt.value;
                                        }
                                    });
                                }

                                // Trigger 'change' for Drupal's States API and validation.
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    }
                });
            });
        }
    };
})(Drupal, once, drupalSettings);