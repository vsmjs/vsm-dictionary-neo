/**
 * File used to quick test the `getEntryMatchesForString` function of
 * `DictionaryNeo.js`
 */

const DictionaryNeo = require('../src/DictionaryNeo');

const dict = new DictionaryNeo({log: true});

dict.getEntryMatchesForString('Catenin beta-1 sapiens', { page: 1, perPage: 30 },
  (err, res) => {
    if (err) console.log(JSON.stringify(err, null, 4));
    else {
      console.log(JSON.stringify(res, null, 4));
      console.log('\n#Results: ' + res.items.length);
    }
  }
);
