/**
 * File used to quick test the `getEntries` function of
 * `DictionaryNeo.js`
 */

const DictionaryNeo = require('../src/DictionaryNeo');

const dict = new DictionaryNeo({log: true, optimap: false});

dict.getEntries({
  filter: { id: [
    'RNAcentral:URS0000530EBF_9606',
    'UniProtKB:P35222',
    'GeneDB:Tb927.10.11630:mRNA',
  ]},
  page: 1,
  perPage: 3
}, (err, res) => {
  if (err) console.log(JSON.stringify(err, null, 4));
  else {
    console.log(JSON.stringify(res, null, 4));
    console.log('\n#Results: ' + res.items.length);
  }
});
