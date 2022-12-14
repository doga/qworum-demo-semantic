// N3 library for storing data (See https://www.skypack.dev/view/n3)
import N3 from 'https://cdn.skypack.dev/pin/n3@v1.16.2-B0kP2kiBFDju8f0s4X37/mode=imports,min/optimized/n3.js';
const { namedNode, literal, defaultGraph, quad } = N3.DataFactory;

// N-Quads store builder
// (for a SPARQL interface on top of in-memory N-Quads try this library: https://www.skypack.dev/view/oxigraph)
import { buildNQuadsStore, nQuadsStoreToString } from './modules/n-quads-store.mjs';

// Qworum library
import { Qworum } from "./modules/qworum/qworum-for-web-pages.mjs";
const
  // Qworum Data value types
  Json = Qworum.runtime.Json,
  SemanticData = Qworum.runtime.SemanticData,
  // Qworum instructions
  Data = Qworum.runtime.Data,
  Return = Qworum.runtime.Return,
  Sequence = Qworum.runtime.Sequence,
  Goto = Qworum.runtime.Goto,
  Call = Qworum.runtime.Call,
  Fault = Qworum.runtime.Fault,
  Try = Qworum.runtime.Try,
  // Qworum script
  Script = Qworum.runtime.Script;

// Web components
import { MySiteBanner } from "./modules/web-components/site-banner.mjs";
import { MyLineItems } from "./modules/web-components/line-items.mjs";
import { MyCheckoutButton } from "./modules/web-components/checkout-button.mjs";
window.customElements.define('my-site-banner', MySiteBanner);
window.customElements.define('my-line-items', MyLineItems);
window.customElements.define('my-checkout-button', MyCheckoutButton);

// UI
show();

async function show() {
  // Show the line items
  let lineItems = await Qworum.runtime.getData(['@', 'line items']);

  try {
    const lineItemsStore = await buildNQuadsStore(
      lineItems instanceof Qworum.runtime.message.SemanticData ? lineItems.value : null
    );

    lineItems = [];

    const products = lineItemsStore.getQuads(
      null, namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('https://schema.org/Product'), null
    );
    for (const product of products) {
      const
        productID = lineItemsStore.getQuads(product.subject, namedNode('https://schema.org/productID'), null, product.graph)[0].object.value,
        productName = lineItemsStore.getQuads(product.subject, namedNode('https://schema.org/name'), null, product.graph)[0].object.value,
        productOffers = lineItemsStore.getQuads(product.subject, namedNode('https://schema.org/offers'), null, product.graph)[0].object,
        productPrice = parseFloat(lineItemsStore.getQuads(productOffers, namedNode('https://schema.org/price'), null, product.graph)[0].object.value),
        lineItem = { id: productID, title: productName, count: 1, price: { EUR: productPrice } },
        existingLineItem = lineItems.find(e => e.id === lineItem.id);

      if (existingLineItem) {
        existingLineItem.count++;
      } else {
        lineItems.push(lineItem);
      }
    }

    lineItems = JSON.stringify(lineItems);
    document.querySelector('#line-items').setAttribute('line-items', lineItems);
  } catch (error) {
    console.error(`error while while displaying line items: ${error}`);
  }

  // Set up the close button
  document.querySelector('#close').addEventListener('click', async () => {
    // Execute a Qworum script
    await Qworum.runtime.eval(Script(
      Return(Json(0))
    ));
  });
}

