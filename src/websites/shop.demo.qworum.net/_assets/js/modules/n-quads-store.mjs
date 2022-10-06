// N3 library for storing data (See https://www.skypack.dev/view/n3)
import N3 from 'https://cdn.skypack.dev/pin/n3@v1.16.2-B0kP2kiBFDju8f0s4X37/mode=imports,min/optimized/n3.js';

// returns a promise of an N3.Store
function buildNQuadsStore(nQuadsString) {
  if (!nQuadsString) {
    return new Promise((resolve, reject) => resolve(new N3.Store()));
  }

  const
  n3Parser    = new N3.Parser(),
  nQuadsStore = new N3.Store();

  return new Promise((resolve, reject) => {
    // Populate the N-Quads store
    n3Parser.parse(
      nQuadsString,
      (error, quad, prefixes) => {
        if (quad) {
          // console.log(`Quad: subject="${quad.subject.value}", predicate="${quad.predicate.value}", object="${quad.object.value}", graph="${quad.graph.value}"`);
          nQuadsStore.add(quad);
        } else if(prefixes) {
          // console.log(`N-Quads parsing finished. Prefixes: ${JSON.stringify(prefixes)}`);
          resolve(nQuadsStore);
        } else { // error
          console.error(`N-Quads parsing error: ${JSON.stringify(prefixes)}`);
          reject(new Error(`${error}`));
        }
      }
    );
  });
}


// returns a string
function nQuadsStoreToString(store) {
  let nQuadsString = '';
  if (!(store instanceof N3.Store)) return nQuadsString;

  const
    quads = store.getQuads(),
    writer = new N3.Writer({ format: 'N-Triples' });

  for (const quad of quads) {
    writer.addQuad(quad.subject, quad.predicate, quad.object, quad.graph);
  }
  writer.end((error, res) => nQuadsString = res);
  return nQuadsString;
}

export { buildNQuadsStore, nQuadsStoreToString };
