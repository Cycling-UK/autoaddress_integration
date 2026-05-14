# Autoaddress Integration

### The very basic basics"

1. Enable this custom __autoaddress_integration__ module

2. On the webform where you want the lookup, just above the address field add a div and give it a class of "`autoaddress-search-wrapper`". 

    In the webform UI this can be done adding a container type element. Add the class by going into the edit of that element, then the Advanced tab. In the Element CSS classes field add "`custom`". In the field that appears just below, add "`autoaddress-search-wrapper`"

    You must set a default target field on the container. This default target field needs to be the address field's machine name, which for example might simply be "address". To do this in the UI, again in the advanced tab of the edit of the container element, in the field labelled "`Element custom attributes (YAML)`", in this example you would add
    
     `data-target-field: address`
     
     There are other ways to do this, Im just giving the direct UI way.