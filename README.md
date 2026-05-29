# **Autoaddress Integration**

## Integrate [autoaddress.com](http://autoaddress.com/) lookup service with webform address field.
*May 2026*

## **Implementation**

Ensure the custom autoaddress\_integration  module is enabled before following the steps below:

### **Adding the Address Lookup to a Webform**

To enable the address lookup on a webform, you need to add a container element directly above your address field and configure it correctly.

### **Step 1:** Add a Container Element

In the Webform UI, add a Container element immediately above your address field.

### **Step 2:** Apply the Required CSS Class

1. Open the container element's edit form and navigate to the Advanced tab.

2. In the Element CSS classes field, select or type  custom.

3. A secondary field will appear below \- enter  autoaddress-search-wrapper  here.

### **Step 3:** Set the Target Address Field

The container needs to know which address field it should populate. You do this by setting a data-target-field attribute pointing to the address field's machine name (e.g. address).

1. Still on the Advanced tab, locate the Element custom attributes (YAML) field.

2. Add the following, replacing address with your field's actual machine name if different:  data-target-field: address 

Note: The steps above describe the Webform UI approach. The same result can be achieved through other methods, such as editing configuration directly.

## Required csp update

Add the following into the _**enforced**_ configuration of the content security module:

### connect-src - add these two domains:

<!-- -->https://api.autoaddress.com
<!-- -->https://integrations.autoaddress.com


### img-src - add this domain:

<!-- -->https://integrations.autoaddress.com

## **Module explanation:**

### **1\.  What Does This Module Do?**

This Drupal module connects your website's webforms to Autoaddress.com \- an Irish address-lookup service. When a visitor starts typing their address, a search box appears that queries the Autoaddress database and returns a matching, formatted address. Choosing a result automatically fills in all the address fields (street, city, postcode, county/region, and country) without the visitor having to type them out manually.

In short: it turns a standard address form into a smart address-autocomplete experience.

### **2\.  The Big Picture \- How All the Parts Fit Together**

The module is made up of nine files. Here is how they relate to each other:

**Drupal side (PHP/config):** Three config files (.yml) tell Drupal what the module is called, what libraries it uses, and what settings it stores. One PHP file (the .module file) acts as the glue \- it watches for a webform being loaded and, when it spots one, injects the API key and loads the JavaScript.

**Browser side (JavaScript):** One JS file runs in the visitor's browser. It finds the search-box placeholder on the form, starts the Autoaddress widget, waits for the visitor to pick an address, and then fills in all the individual address fields.

**External services (CDN):** Two files are not stored locally at all \- Autoaddress hosts them on their own servers. Your site loads them over the internet when the form is displayed.

The flow is:

* Visitor opens a webform page.

* Drupal detects it's a webform and tells the browser: load the Autoaddress scripts and pass along the API key.

* The browser loads the Autoaddress library from the Autoaddress CDN.

* The local JS file finds the search box, creates an Autoaddress widget inside it, and listens for a selection.

* Visitor types part of their address and picks a result.

* The JS maps each part of the returned address into the correct webform field.

### **3\.  File-by-File Breakdown**

**3.1  autoaddress\_integration.info.yml**

Think of this as the module's ID card. Drupal reads this file to know that the module exists and what version of Drupal it is compatible with.

| Property | Value / Meaning |
| :---- | :---- |
| **name** | Autoaddress Integration \- the human-readable name shown in the admin UI. |
| **type** | module \- confirms this is a regular Drupal module (not a theme or profile). |
| **description** | Short summary shown on the Extend (/admin/modules) page. |
| **package** | Custom \- groups it under the Custom heading in that page. |
| **core\_version\_requirement** | Works with Drupal 10 or 11\. |
| **dependencies** | Requires the Webform module to be installed and enabled first. |

Nothing in this file needs to change unless the module is being upgraded to support a future Drupal version.

**3.2  autoaddress\_integration.libraries.yml**

This file tells Drupal about every CSS and JavaScript asset the module needs, both local and external.

It defines one library called autoaddress-sdk, which contains:

* autoaddress-init.js (local): your custom initialisation code (described in section 3.8 below).

* Autoaddress CSS (external): a stylesheet from Autoaddress that styles the search-box dropdown.

* core/drupal and core/once: two small Drupal-provided utilities the JS relies on.

The once utility is particularly important \- it makes sure the widget is only created once per element, even if Drupal re-attaches behaviours (which happens on multi-page webforms).

**3.3  autoaddress\_integration.module**

This is the only PHP file in the module. PHP is the server-side language Drupal is built on. This file contains a single function \- a 'hook' \- that Drupal calls automatically whenever any form is being built.

**What it does, step by step:**

* Checks whether the form being built is a webform submission (by looking at the form's internal ID). If it is not a webform, it does nothing and exits.

* Attaches the autoaddress-sdk library to the form. This is the library defined in the .libraries.yml file above \- it causes Drupal to output the required \<script\> and \<link\> tags in the page HTML.

* Reads the API key from Drupal's configuration system (see section 3.5).

* Passes that API key to the browser through a mechanism called drupalSettings \- a JavaScript object Drupal generates on the page that PHP-land can write values into and JS-land can read.

In plain English: every time a webform loads, this PHP function secretly hands the API key to the browser so the JavaScript can use it to talk to Autoaddress.

**3.4  composer.json**

Composer is PHP's package manager \- a tool that handles downloading and managing code libraries. This file is the module's manifest for Composer.

| Property | Value / Meaning |
| :---- | :---- |
| **name** | cycling\_uk/autoaddress\_integration \- a unique package identifier (organisation/package-name). |
| **description** | Human-readable description. |
| **type** | drupal-module \- tells Composer/Drupal it should be placed in the modules folder. |
| **version** | 1.0.5 \- the current release number. |
| **license** | GPL-2.0-or-later \- open source licence (same as Drupal itself). |
| **minimum-stability** | dev \- allows development releases of dependencies to be used. |

This file is required if you ever want to distribute the module through Drupal's Packagist/composer infrastructure, or install it on another site via composer require.

**3.5  config/install/autoaddress\_integration.settings.yml**

This is a tiny configuration file with a single purpose: when the module is first installed, Drupal reads this file and creates an initial configuration object called autoaddress\_integration.settings in the database.

It sets api\_key to an empty string. That empty value is intentional \- the actual key is never stored in the database or in exported configuration. Instead it is supplied at runtime by the hosting environment, as described below.

**How the key is provided in practice:** This is a developer/infrastructure concern, not something a site builder needs to touch.

* Local development: the key is set in settings.local.php, which is never committed to version control:

$config\['autoaddress\_integration.settings'\]\['api\_key'\] \= 'YOUR\_DEV\_KEY\_HERE';

* Hosted environments: the key is injected via settings.php (typically reading from a server environment variable) or via the Key module, which provides a dedicated secrets-management UI for Drupal.

$config\['autoaddress\_integration.settings'\]\['api\_key'\] \= getenv('AUTOADDRESS\_API\_KEY');

Either way, the key is overlaid on top of the empty default at runtime \- so the empty string in this file is never used in a live environment.

**3.6  config/schema/autoaddress\_integration.schema.yml**

This is a companion to the settings file above. Drupal's configuration system requires a schema for every configuration object \- it is like a data dictionary that says 'the settings object has one field called api\_key and it must be a string'.

Without this file, Drupal would throw a warning during configuration export/import. It also enables translation tools to label the field properly in the admin UI if one is ever added.

Non-technical summary: this file defines the shape of the module's settings so Drupal can validate them correctly. You never need to edit it unless you add new settings to the module.

**3.7  js/autoaddress-init.js**

This is the heart of the module \- the JavaScript that runs in the visitor's browser and makes everything actually work.

**Structure**

The code is wrapped in Drupal's standard behaviours pattern. Drupal calls attach() whenever it finishes loading or reloading part of a page (important for multi-step/multi-page webforms where only part of the page refreshes).

**Step-by-step walkthrough**

* Reads the API key from drupalSettings (the value PHP put there \- see section 3.3).

* Uses the once() utility to find every element with the CSS class autoaddress-search-wrapper that has not already been initialised. The once() guard prevents the widget being created twice if Drupal re-runs the behaviour.

* For each such wrapper element: generates a short random ID (e.g. aa-instance-4271) and assigns it to the element. This is needed because the Autoaddress library requires an element ID, not a class.

* Reads the data-target-field attribute from the wrapper to know which webform field to populate (e.g. address). Falls back to 'address' if the attribute is absent.

* Calls Autoaddress({ ... }) \- the constructor from the external Autoaddress library \- passing in the API key, the element ID, and configuration options.

* onAddressResult callback: When a visitor selects an address, this function fires. It receives a result object from Autoaddress and maps the parts onto the address composite fields.

The field mapping is:

| Autoaddress data | Webform field filled |
| :---- | :---- |
| **lines\[0\].value** | \[fieldKey\]\[address\] \- first line of street address |
| **lines\[1\].value** | \[fieldKey\]\[address\_2\] \- second line (e.g. flat/apartment) |
| **city.value** | \[fieldKey\]\[city\] \- town or city |
| **postcode.value** | \[fieldKey\]\[postal\_code\] \- postcode / Eircode |
| **region.value** | \[fieldKey\]\[state\_province\] \- county |
| **country.iso** | \[fieldKey\]\[country\] \- ISO country code |

After setting each field value, the code fires a change event on it. This is important because Drupal's States API (which can show/hide other fields depending on field values) listens for change events \- without this trigger, dependent field logic would not fire.

**Select / dropdown handling:** If the Country or Region field is a \<select\> dropdown (common in the Drupal address composite element), the code loops through its options to find the one matching either the ISO code or the display name, and selects it.

**3.8  .gitignore**

A Git version-control file. It lists files and folders that should not be committed to the repository \- things that are generated automatically, specific to a developer's machine, or that could expose sensitive information. Key exclusions:

* .DS\_Store and Thumbs.db \- Mac and Windows operating system junk files.

* .idea/ and .vscode/ \- IDE/editor configuration folders.

* vendor/ \- PHP dependencies installed by Composer (these are downloaded fresh on each deployment, not stored in Git).

* Drupal-specific build artefacts that are never part of a distributable module.

This file has no effect on how the module runs \- it only affects what goes into version control.

### **4\.  Installation & Configuration Quick-Start**

The module is hosted on GitHub at https://github.com/Cycling-UK/autoaddress\_integration and must be installed via Composer \- Drupal's standard package manager.

**Note on the API key:** the key is managed at the server/infrastructure level and requires no action from the site builder. Locally it lives in settings.local.php; on hosted environments it is provided via settings.php or the Key module. See section 3.5 for details.

**Step 1 \- Tell Composer where to find the module**

Because this is a private/custom GitHub repository rather than a package on Drupal.org or Packagist, you first need to add it as a repository in your project's root composer.json:
```
"repositories": [  
    {  
        "type": "vcs",  
        "url": "https://github.com/Cycling-UK/autoaddress_integration"  
    }  
]
```
**Step 2 \- Require the module**

Run the following Composer command from your project root. Composer will download the module into web/modules/custom/ automatically:

composer require cycling\_uk/autoaddress\_integration

**Step 3 \- Enable it in Drupal**

Once Composer has downloaded the module, enable it via the Extend page (/admin/modules) or with Drush:

drush en autoaddress\_integration

**Step 4 \- Configure a webform**

In the webform builder, place a Container element directly above your address composite field. Add the CSS class autoaddress-search-wrapper and the data-target-field attribute set to the address field's machine name. Full details are at the top of this document.

**Step 5 \- Test**

Visit the webform, start typing an address, and confirm that the Autoaddress dropdown appears and fills the address fields on selection.

###  **5\.  Architecture Summary**

The table below summarises every file and its role at a glance:

| File | Type | Role |
| :---- | :---- | :---- |
| autoaddress\_integration.info.yml | Config | Module identity card \- name, version, Drupal compatibility, dependencies |
| autoaddress\_integration.libraries.yml | Config | Declares JS and CSS assets (local \+ CDN) that make up the widget |
| autoaddress\_integration.module | PHP | Glue code: detects webforms, loads assets, passes API key to the browser |
| composer.json | Package manifest | Composer metadata for distributing/requiring the module |
| config/install/...settings.yml | Config | Creates the api\_key setting (initially blank) when the module installs |
| config/schema/...schema.yml | Config | Defines the shape/type of the module's settings for Drupal's config system |
| js/autoaddress-init.js | JavaScript | Browser code: creates the widget, maps results into webform fields |
| README.md | Documentation | Quick-start instructions for site builders |
| .gitignore | Dev tooling | Keeps generated/sensitive files out of version control |

###  **6\.  Common Questions & Scenarios**

**I have more than one address field on the same webform.**

Each instance of the autoaddress-search-wrapper container needs its own data-target-field attribute pointing to the machine name of the address field it should fill. The JavaScript handles multiple instances independently.

**The widget appears but does not fill the fields.**

Check that the data-target-field value exactly matches the address element's machine name in the webform. Field names are case-sensitive. Also confirm the address element is a Drupal Address composite type \- the JS looks for sub-fields named address, address\_2, city, postal\_code, state\_province, and country.

**The API key is not working.**

Confirm the key has been supplied by the hosting environment \- check settings.local.php (local) or the relevant environment variable / Key module entry (hosted). Check the browser developer console for network errors on calls to integrations.autoaddress.com.

__See below for guidance on configuring the key in a local ddev environment.__

**The module is on a multi-page webform and the widget disappears after navigating between pages.**

This is handled by the once() utility combined with Drupal's attach() behaviour. Drupal re-runs attach() on each page of a multi-step webform, but once() ensures the widget is only initialised once per element, preventing duplication. If the container element is re-rendered on each page, the once() guard will allow re-initialisation correctly.

**I want to add more fields to the mapping.**

Edit js/autoaddress-init.js. Extend the mapping object in the onAddressResult callback with additional keys. The key should match the webform sub-field name and the value should come from the appropriate property on the Autoaddress result object.

**Is an API key required for development / testing?**

Yes \- Autoaddress requires a valid API key for all requests, including during development. Autoaddress.com provides test/sandbox keys for development use. 

__See below for guidance on configuring the key in a local ddev environment.__

### **7\.  Security Notes**

* The API key is exposed in the rendered HTML of any page that contains a webform. This is unavoidable with client-side address lookup widgets \- the browser must have the key to call the Autoaddress API. This is standard practice for this type of integration.

* Restrict the API key in the Autoaddress account dashboard to only the site's domain(s) to prevent misuse if the key is harvested.

* Never commit the API key to version control. Use environment variables or Drupal's settings.php override pattern (see section 3.5).

* The module does not store or log any address data itself \- all data is sent directly from the browser to Autoaddress's API and back.


## Configuring the AutoAddress API Key for local development with ddev

AutoAddress is used for address lookup. To use it locally, you need to add your API key to your ddev environment. This is kept out of version control.

### Steps

**1\. Get the API key**

Log in to [autoaddress.com](https://autoaddress.com) and copy the licence key.

**2\. Create (or open) `.ddev/config.local.yaml`**

This file is gitignored and is the correct place for local secrets. If it doesn't exist yet, create it:

touch .ddev/config.local.yaml

**3\. Add the API key**

Open `.ddev/config.local.yaml` and add the following, replacing the placeholder with your actual key:
```
web_environment:

  - AUTOADDRESS_API_KEY=your_key_here
```
⚠️ If you already have a `web_environment` block in the file, just add the new line to it rather than creating a second block.

**4\. Restart ddev**

ddev restart

**5\. Verify it worked**

ddev exec printenv AUTOADDRESS\_API\_KEY

This should print your key. If it returns nothing, double-check the file is named `.yaml` (not `.yml`) and that the `web_environment` block is formatted correctly.  

## Connecting the API key to Drupal

Putting the key in ddev makes it available as an environment variable inside the container, but Drupal also needs to be told to use it. This is done in `settings.local.php`.

Drupal stores the AutoAddress API key in its configuration system under `autoaddress_integration.settings`. 

The following line overrides that database value at runtime by reading the key from the environment variable you set above:

`$config['autoaddress_integration.settings']['api_key'] = getenv('AUTOADDRESS_API_KEY');`

Add this line to your `web/sites/default/settings.local.php`. If that file doesn't exist yet, copy it from the example file:

`cp docroot/sites/default/example.settings.local.php docroot/sites/default/settings.local.php`

Then open it and add the line anywhere after the opening `<?php` tag.

ℹ️ `settings.local.php` is gitignored, so this change stays on your machine only. This is intentional - it means each developer's local key never gets committed to the repository.  



*End of document*