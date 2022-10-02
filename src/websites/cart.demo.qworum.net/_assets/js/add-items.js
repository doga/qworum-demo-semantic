// JSON-LD library for call arguments and returned results
import jsonld from 'https://cdn.skypack.dev/pin/jsonld@v8.1.0-HhtG5EE2PmUcTIacrag8/mode=imports,min/optimized/jsonld.js';
// N3 library for storing data
import N3 from 'https://cdn.skypack.dev/pin/n3@v1.16.2-B0kP2kiBFDju8f0s4X37/mode=imports,min/optimized/n3.js';
const { namedNode, literal, defaultGraph, quad } = N3.DataFactory;

// N-Quads store builder
import { buildNQuadsStore, nQuadsStoreToString } from './modules/n-quads-store.mjs';

// Qworum library
import { Qworum } from "./modules/qworum/qworum-for-web-pages.mjs";
const
  // Qworum Data value types
  Json = Qworum.Json,
  SemanticData = Qworum.SemanticData,
  // Qworum instructions
  Data = Qworum.Data,
  Return = Qworum.Return,
  Sequence = Qworum.Sequence,
  Goto = Qworum.Goto,
  Call = Qworum.Call,
  Fault = Qworum.Fault,
  Try = Qworum.Try,
  // Qworum script
  Script = Qworum.Script;

// Update the cart.
updateCart();

function updateCart() {
  Qworum.getData('line items to add', (lineItemsToAdd) => {
    // Validate the call parameter
    if (!(lineItemsToAdd instanceof Qworum.message.SemanticData && lineItemsToAdd.type === 'json-ld')) {
      Qworum.eval(Script(
        Fault('* the "line items to add" call parameter is missing or invalid')
      ));
      return;
    }
    lineItemsToAdd = JSON.parse(lineItemsToAdd.value);

    addItemsToCart(lineItemsToAdd);
  });

}

async function addItemsToCart(lineItemsToAdd) {
  // Transform "line items to add" from JSON-LD to N-Quads string
  lineItemsToAdd = await jsonld.canonize(lineItemsToAdd, {
    algorithm: 'URDNA2015',
    format: 'application/n-quads'
  });

  buildNQuadsStore(lineItemsToAdd, addItemsToCart2);
}

async function addItemsToCart2(lineItemsToAddStore) {
  // for (const myQuad of lineItemsToAddStore.getQuads()) {
  //   console.log(`line items to add Quad: subject="${myQuad.subject.value}", predicate="${myQuad.predicate.value}", object="${myQuad.object.value}", graph="${myQuad.graph.value}"`);
  // }
  // Update the cart
  Qworum.getData(['@', 'line items'], (lineItems) => {
    // if (lineItems) {
    //   console.log(`read line items: ${lineItems.value}`);
    // } else {
    //   console.log(`line items empty`);
    // }
    buildNQuadsStore(
      lineItems instanceof Qworum.message.SemanticData ? lineItems.value : null,
      async (lineItemsStore) => {
        // for (const myQuad of lineItemsStore.getQuads()) {
        //   console.log(`line items Quad: subject="${myQuad.subject.value}", predicate="${myQuad.predicate.value}", object="${myQuad.object.value}", graph="${myQuad.graph.value}"`);
        // }

        // find the graph name for new items
        let i = 1, lineItemToAddGraph = `g${i}`;
        while (lineItemsStore.getGraphs().find((graph) => graph.value === lineItemToAddGraph)) {
          lineItemToAddGraph = `g${++i}`;
        }

        // add new items to the store
        lineItemsToAddStore.forEach((aQuad) => {
          lineItemsStore.add(quad(aQuad.subject, aQuad.predicate, aQuad.object, lineItemToAddGraph));
        });

        // for (const myQuad of lineItemsStore.getQuads()) {
        //   console.log(`line items after add new items; Quad: subject="${myQuad.subject.value}", predicate="${myQuad.predicate.value}", object="${myQuad.object.value}", graph="${myQuad.graph.value}"`);
        // }

        // persist the line items
        lineItems = SemanticData(
          nQuadsStoreToString(lineItemsStore), 'n-quads'
        );

        // Compute the cart total in euro cents
        const prices = lineItemsStore.getQuads(null, namedNode('https://schema.org/price'));
        // for (const myQuad of prices) {
        //   console.log(`price Quad: subject="${myQuad.subject.value}", predicate="${myQuad.predicate.value}", object="${myQuad.object.value}", graph="${myQuad.graph.value}"`);
        // }
        let totalCents = prices.reduce(
          (totalCents, lineItem) => totalCents + Math.trunc(parseFloat(lineItem.object.value) * 100), 0
        );
        // console.log(`computed total: ${totalCents}`); 

        const totalNQuadsString = await jsonld.canonize({
          "@context"     : { "@vocab": "https://schema.org/" },
          "@type"        : "TradeAction",
          "price"        : `${totalCents / 100}`,
          "priceCurrency": "EUR"
        });

        buildNQuadsStore(
          totalNQuadsString, async (totalNQuadsStore) => {
            const totalCents = SemanticData(
              nQuadsStoreToString(
                totalNQuadsStore
              ), 'n-quads'
            );

            // console.log(`storing total: ${totalNQuadsString}`); 
          
            Qworum.setData(['@', 'line items'], lineItems, (success) => {
              if (!success) {
                Qworum.eval(Script(
                  Fault('* the line items list was not updated')
                ));
                return;
              }
          
              Qworum.setData(['@', 'total'], totalCents, (success) => {
                if (!success) {
                  Qworum.eval(Script(
                    Fault('* the total was not updated')
                  ));
                  return;
                }
          
                // show the cart
                // window.location.replace('../show-cart/');
                Qworum.eval(Script(
                  Call('@', '../show-cart/')
                ));
              });
            });
          }
        );
      }
    );
  });
}

