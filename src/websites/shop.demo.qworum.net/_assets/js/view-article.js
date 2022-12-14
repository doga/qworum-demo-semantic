// JSON-LD library for call arguments and returned results (See https://www.skypack.dev/view/jsonld)
import jsonld from 'https://cdn.skypack.dev/pin/jsonld@v8.1.0-HhtG5EE2PmUcTIacrag8/mode=imports,min/optimized/jsonld.js';
// N3 library for storing data (See https://www.skypack.dev/view/n3)
// (for a SPARQL interface on top of in-memory N-Quads try this library: https://www.skypack.dev/view/oxigraph)
import N3 from 'https://cdn.skypack.dev/pin/n3@v1.16.2-B0kP2kiBFDju8f0s4X37/mode=imports,min/optimized/n3.js';
const
  { namedNode, literal, defaultGraph, quad } = N3.DataFactory;

// N-Quads store builder
import { buildNQuadsStore } from './modules/n-quads-store.mjs';

// Qworum library
import { Qworum } from "./modules/qworum/qworum-for-web-pages.mjs";
console.log(`Qworum.version: ${Qworum.version}`);
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

// Application data
import { articles } from "./modules/articles.mjs";
console.log(`articles: ${JSON.stringify(articles)}`);

// Web components
import { MyArticle } from "./modules/web-components/article.mjs";
import { MySiteBanner } from "./modules/web-components/site-banner.mjs";
window.customElements.define('my-article', MyArticle);
window.customElements.define('my-site-banner', MySiteBanner);

// UI
show();

async function show() {
  let articleId = await Qworum.runtime.getData('article id');
  if (!(articleId instanceof Qworum.runtime.message.SemanticData && articleId.type === 'json-ld')) {
    await Qworum.runtime.eval(Script(
      Fault('* the "article id" call argument is missing or has the wrong type')
    ));
    return;
  }
  articleId = await jsonld.expand(JSON.parse(articleId.value));
  articleId = articleId[0]['https://schema.org/productID'][0]['@value'];
  displayTheArticleOnSale(articleId);
  displayCartTotal();
}

async function displayCartTotal() { // TODO factor out this duplicate from home.js
  let total = await Qworum.runtime.getData(['@', 'shopping cart', 'total']);
  if (total instanceof Qworum.runtime.message.SemanticData) {
    try {
      const totalStore = await buildNQuadsStore(total.value);
      total = totalStore.getQuads(null, namedNode('https://schema.org/price'))[0].object.value;

      console.log(`total: ${total}`);
      document.querySelector('#banner').setAttribute('cart-total', `${total}`);
    } catch (error) {
      console.error(`error while loading shopping cart total: ${error}`);
    }
  }

}

async function displayTheArticleOnSale(articleId) {
  // alert(`article id: ${articleId}`);
  const
    contentArea = document.getElementById('content'),
    addToCartButton = document.getElementById('add-to-cart-button'),
    homepageButton = document.getElementById('homepage-button'),
    article = {
      id: articleId,
      data: articles[articleId],
      element: document.createElement('my-article')
    };

  article.element.setAttribute('image', `../_assets/images/articles/${article.data.image}`);
  article.element.setAttribute('description', article.data.description);
  contentArea.append(article.element);

  addToCartButton.addEventListener('click', async () => {
    // Execute a Qworum script
    await Qworum.runtime.eval(Script(
      Sequence(
        Call(
          ['@', 'shopping cart'], '@@cart/add-items/',
          {
            name: 'line items to add',
            value: SemanticData({
              "@context": { "@vocab": "https://schema.org/" },
              "@type": "Product",
              "productID": `${article.id}`,
              "name": article.data.title,
              "offers": {
                "@type": "Offer",
                "price": `${article.data.price.EUR}`,
                "priceCurrency": "EUR"
              }
            })
          }
        ),
        // Goto('index.html')
      )
    ));
  });

  homepageButton.addEventListener('click', async () => {
    // Execute a Qworum script
    await Qworum.runtime.eval(Script(
      Return(Json(0))
    ));
  });
}
