// JSON-LD library for call arguments and returned results (See https://www.skypack.dev/view/jsonld)
import jsonld from 'https://cdn.skypack.dev/pin/jsonld@v8.1.0-HhtG5EE2PmUcTIacrag8/mode=imports,min/optimized/jsonld.js';
// N3 library for storing data (See https://www.skypack.dev/view/n3)
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
  Data     = Qworum.Data,
  Return   = Qworum.Return,
  Sequence = Qworum.Sequence,
  Goto     = Qworum.Goto,
  Call     = Qworum.Call,
  Fault    = Qworum.Fault,
  Try      = Qworum.Try,
  // Qworum script
  Script = Qworum.Script;

// Update the cart.
updateCart();

async function updateCart() {
  let lineItemsToAdd = await Qworum.getData('line items to add');

  try {
    // Validate the incoming line items to add
    if (!(lineItemsToAdd instanceof Qworum.message.SemanticData && lineItemsToAdd.type === 'json-ld')) {
      await Qworum.eval(Script(
        Fault('* the "line items to add" call parameter is missing or invalid')
      ));
      return;
    }
    lineItemsToAdd = JSON.parse(lineItemsToAdd.value);

    // Transform "line items to add" from JSON-LD to N-Quads string
    lineItemsToAdd = await jsonld.canonize(lineItemsToAdd, {
      algorithm: 'URDNA2015',
      format: 'application/n-quads'
    });

    // store for incoming line items to add
    let 
    lineItemsToAddStore = await buildNQuadsStore(lineItemsToAdd),
    lineItems = await Qworum.getData(['@', 'line items']);

    // Read cart's line items
    try {
      const lineItemsStore = await buildNQuadsStore(
        lineItems instanceof Qworum.message.SemanticData ? lineItems.value : null
      );

      // find the graph name for new items
      let i = 1, lineItemToAddGraph = `g${i}`;
      while (lineItemsStore.getGraphs().find((graph) => graph.value === lineItemToAddGraph)) {
        lineItemToAddGraph = `g${++i}`;
      }

      // add new items to the store
      lineItemsToAddStore.forEach((aQuad) => {
        lineItemsStore.add(quad(aQuad.subject, aQuad.predicate, aQuad.object, lineItemToAddGraph));
      });

      // persist the line items
      lineItems = SemanticData(
        nQuadsStoreToString(lineItemsStore), 'n-quads'
      );

      // Compute the cart total in euro cents
      const prices = lineItemsStore.getQuads(null, namedNode('https://schema.org/price'));
      let totalCents = prices.reduce(
        (totalCents, lineItem) => totalCents + Math.trunc(parseFloat(lineItem.object.value) * 100), 0
      );

      // store the cart contents and the total
      const 
      totalNQuadsString = await jsonld.canonize({
        "@context"     : { "@vocab": "https://schema.org/" },
        "@type"        : "TradeAction",
        "price"        : `${totalCents / 100}`,
        "priceCurrency": "EUR"
      }),
      totalNQuadsStore = await buildNQuadsStore(totalNQuadsString);

      totalCents = SemanticData(nQuadsStoreToString(totalNQuadsStore), 'n-quads');

      if (await Qworum.setData(['@', 'line items'], lineItems)) {
        if (await Qworum.setData(['@', 'total'], totalCents)) {
          // show the cart
          await Qworum.eval(Script(
            Call('@', '../show-cart/')
          ));
        } else {
          await Qworum.eval(Script(
            Fault('* the total was not updated')
          ));
        }
      } else {
        await Qworum.eval(Script(
          Fault('* the line items list was not updated')
        ));
      }
    } catch (error) {
      console.error(`error while updating shopping cart: ${error}`);
    }
  } catch (error) {
    console.error(`error while updating shopping cart: ${error}`);
  }
}
