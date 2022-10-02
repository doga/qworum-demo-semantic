// N3 library for storing data
import N3 from 'https://cdn.skypack.dev/pin/n3@v1.16.2-B0kP2kiBFDju8f0s4X37/mode=imports,min/optimized/n3.js';
const { namedNode, literal, defaultGraph, quad } = N3.DataFactory;

// N-Quads store builder
import { buildNQuadsStore, nQuadsStoreToString } from './modules/n-quads-store.mjs';

// Qworum library
import { Qworum } from "./modules/qworum/qworum-for-web-pages.mjs";
const
// Qworum Data value types
Json         = Qworum.Json,
SemanticData = Qworum.SemanticData,
// Qworum instructions
Data         = Qworum.Data,
Return       = Qworum.Return,
Sequence     = Qworum.Sequence,
Goto         = Qworum.Goto,
Call         = Qworum.Call,
Fault        = Qworum.Fault,
Try          = Qworum.Try,
// Qworum script
Script       = Qworum.Script;

// Web components
import { MySiteBanner } from "./modules/web-components/site-banner.mjs";
import { MyLineItems } from "./modules/web-components/line-items.mjs";
import { MyCheckoutButton } from "./modules/web-components/checkout-button.mjs";
window.customElements.define('my-site-banner', MySiteBanner);
window.customElements.define('my-line-items', MyLineItems);
window.customElements.define('my-checkout-button', MyCheckoutButton);

// UI
console.log(`1`);

// Show the line items
Qworum.getData(['@', 'line items'], (lineItems) => {
  console.log(`20 line items string: ${lineItems.value}`);

  buildNQuadsStore(
    lineItems instanceof Qworum.message.SemanticData ? lineItems.value : null,
    (lineItemsStore) => {
      console.log(`21 line items: ${lineItemsStore.size}`);

      lineItems = [];
    
      const products = lineItemsStore.getQuads(
        null, namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('https://schema.org/Product'), null
      );
      console.log(`22 products: ${products.length}`);
      for (const product of products) {
        console.log(`3`);
        const
        productID        = lineItemsStore.getQuads(product.subject, namedNode('https://schema.org/productID'), null, product.graph)[0].object.value,
        productName      = lineItemsStore.getQuads(product.subject, namedNode('https://schema.org/name'), null, product.graph)[0].object.value,
        productOffers    = lineItemsStore.getQuads(product.subject, namedNode('https://schema.org/offers'), null, product.graph)[0].object,
        productPrice     = parseFloat(lineItemsStore.getQuads(productOffers, namedNode('https://schema.org/price'), null, product.graph)[0].object.value),
        lineItem         = {id: productID, title: productName, count: 1, price: {EUR: productPrice}},
        existingLineItem = lineItems.find(e => e.id === lineItem.id);
        console.log(`4`);
    
        if (existingLineItem) {
          existingLineItem.count++;
        } else {
          lineItems.push(lineItem);
        }
        console.log(`5`);
      }

      lineItems = JSON.stringify(lineItems);
      console.log(`lineItems: ${lineItems}`);
      document.querySelector('#line-items').setAttribute('line-items', lineItems);
    }
  );

});

// Set up the close button
document.querySelector('#close').addEventListener('click', () => {
  // Execute a Qworum script
  Qworum.eval(Script(
    Return(Json(0))
  ));
});

