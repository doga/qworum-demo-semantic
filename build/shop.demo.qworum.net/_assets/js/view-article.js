// JSON-LD library for call arguments and returned results
import jsonld from 'https://cdn.skypack.dev/pin/jsonld@v8.1.0-HhtG5EE2PmUcTIacrag8/mode=imports,min/optimized/jsonld.js';
// N3 library for storing data
import N3 from 'https://cdn.skypack.dev/pin/n3@v1.16.2-B0kP2kiBFDju8f0s4X37/mode=imports,min/optimized/n3.js';
const 
{ namedNode, literal, defaultGraph, quad } = N3.DataFactory;

// N-Quads store builder
import {buildNQuadsStore} from './modules/n-quads-store.mjs';

// Qworum library
import { Qworum } from "./modules/qworum/qworum-for-web-pages.mjs";
console.log(`Qworum.version: ${Qworum.version}`);
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

// Application data
import { articles } from "./modules/articles.mjs";
console.log(`articles: ${JSON.stringify(articles)}`);

// Web components
import { MyArticle } from "./modules/web-components/article.mjs";
import { MySiteBanner } from "./modules/web-components/site-banner.mjs";
window.customElements.define('my-article', MyArticle);
window.customElements.define('my-site-banner', MySiteBanner);

// UI

Qworum.getData('article id', (articleId) => {
  if (!(articleId instanceof Qworum.message.SemanticData && articleId.type === 'json-ld')) {
    Qworum.eval(Script(
      Fault('* the "article id" call argument is missing or has the wrong type')
    ));
    return;
  }
  show(JSON.parse(articleId.value));
});

async function show(articleId) {
  articleId = await jsonld.expand(articleId);
  articleId = articleId[0]['https://schema.org/productID'][0]['@value']; 
  displayTheArticleOnSale(articleId);
  displayCartTotal();
}

function displayCartTotal() { // TODO factor out this duplicate from home.js
  Qworum.getData(['@', 'shopping cart', 'total'], async (total) => {
    if (total instanceof Qworum.message.SemanticData) {
      try {
        const totalStore = await buildNQuadsStore(total.value);
        total = totalStore.getQuads(null, namedNode('https://schema.org/price'))[0].object.value;

        console.log(`total: ${total}`);
        document.querySelector('#banner').setAttribute('cart-total', `${total}`);
      } catch (error) {
        console.error(`error while loading shopping cart total: ${error}`);
      }
    } else {
      total = 0.0;
      document.querySelector('#banner').setAttribute('cart-total', `${total}`);
    }
  });
}

function displayTheArticleOnSale(articleId) {
  // alert(`article id: ${articleId}`);
  const
  contentArea     = document.getElementById('content'),
  addToCartButton = document.getElementById('add-to-cart-button'),
  homepageButton  = document.getElementById('homepage-button'),
  article         = {
    id     : articleId,
    data   : articles[articleId],
    element: document.createElement('my-article')
  };

  article.element.setAttribute('image', `../_assets/images/articles/${article.data.image}`);
  article.element.setAttribute('description', article.data.description);
  contentArea.append(article.element);

  addToCartButton.addEventListener('click', () => {
    // Execute a Qworum script
    Qworum.eval(Script(
      Sequence(
        Call(
          ['@', 'shopping cart'], '/build/cart.demo.qworum.net/add-items/', 
          {
            name: 'line items to add', 
            value: SemanticData({
              "@context" : {"@vocab": "https://schema.org/"},
              "@type"    : "Product",
              "productID": `${article.id}`,
              "name"     : article.data.title,
              "offers"   : {
                "@type"        : "Offer",
                "price"        : `${article.data.price.EUR}`,
                "priceCurrency": "EUR"
              }
            })
          }
        ),
        // Goto('index.html')
      )
    ));
  });

  homepageButton.addEventListener('click', () => {
    // Execute a Qworum script
    Qworum.eval(Script(
      Return(Json(0))
    ));
  });
}
