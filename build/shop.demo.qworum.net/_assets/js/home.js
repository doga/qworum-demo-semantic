// N3 library for storing data (See https://www.skypack.dev/view/n3)
import N3 from 'https://cdn.skypack.dev/pin/n3@v1.16.2-B0kP2kiBFDju8f0s4X37/mode=imports,min/optimized/n3.js';
const { namedNode, literal, defaultGraph, quad } = N3.DataFactory;

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
import { buildNQuadsStore } from "./modules/n-quads-store.mjs";
window.customElements.define('my-article', MyArticle);
window.customElements.define('my-site-banner', MySiteBanner);

// UI
displayTheArticlesOnSale();
displayCartTotal();

async function displayCartTotal() {
  let total = await Qworum.getData(['@', 'shopping cart', 'total']);

  if (total instanceof Qworum.message.SemanticData) {
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

function displayTheArticlesOnSale() {
  const contentArea = document.getElementById('content');

  for (let i = 0; i < articles.length; i++) {
    const
    article = {
      data   : articles[i],
      element: document.createElement('my-article')
    },
    button  = document.createElement('button');

    article.element.setAttribute('image', `../_assets/images/articles/${article.data.image}`);
    article.element.setAttribute('description', article.data.description);
    button.append(article.element);
    contentArea.append(button);

    button.addEventListener('click', async () => {
      // Execute a Qworum script
      // (See https://qworum.net/en/specification/v1/#script)
      await Qworum.eval(Script(
        Sequence(
          // Call the service end-point to view an article.
          // (See https://qworum.net/en/specification/v1/#call)
          Call(
            // The owner of this call is the same Qworum object as the owner of the current call.
            // (See https://qworum.net/en/specification/v1/#object)
            ['@'], 
            
            // URL of the end-point to call.
            '../view-article/', 

            // The data parameters of this call.
            [{
              name: 'article id', 
              value: SemanticData({
                "@context": {"@vocab": "https://schema.org/"},
                "@type": "Product",
                "productID": `${i}`
              })
            }]
          ),
          
          // Return to this page.
          Goto('index.html'),
        )
      ))
    });
  }
}

