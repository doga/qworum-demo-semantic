// N3 library for storing data
import N3 from 'https://cdn.skypack.dev/pin/n3@v1.16.2-B0kP2kiBFDju8f0s4X37/mode=imports,min/optimized/n3.js';

// TODO async version of buildNQuadsStore? (currently callback hell)

function buildNQuadsStore(nQuadsString, callback) { // callback(nQuadsStore)
  const
  n3Parser    = new N3.Parser(),
  nQuadsStore = new N3.Store();

  if (!nQuadsString) {
    callback(nQuadsStore);
    return;
  }

  // Populate the N-Quads store
  n3Parser.parse(
    nQuadsString,
    (error, myQuad, prefixes) => {
      if (myQuad) {
        // console.log(`Quad: subject="${myQuad.subject.value}", predicate="${myQuad.predicate.value}", object="${myQuad.object.value}", graph="${myQuad.graph}"`);
        nQuadsStore.add(myQuad);
      } else {
        // console.log(`Parsing finished. Prefixes: ${JSON.stringify(prefixes)}`);
        if(typeof callback === 'function') callback(nQuadsStore);
      }
    }
  );
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
