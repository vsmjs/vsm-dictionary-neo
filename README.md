# vsm-dictionary-neo

<!-- badges: start -->
[![Build Status](https://travis-ci.com/UniBioDicts/vsm-dictionary-neo.svg?branch=master)](https://travis-ci.com/UniBioDicts/vsm-dictionary-neo)
[![npm version](https://img.shields.io/npm/v/vsm-dictionary-neo)](https://www.npmjs.com/package/vsm-dictionary-neo)
[![Downloads](https://img.shields.io/npm/dm/vsm-dictionary-neo)](https://www.npmjs.com/package/vsm-dictionary-neo)
<!-- badges: end -->

## Summary

`vsm-dictionary-neo` is an implementation 
of the 'VsmDictionary' parent-class/interface (from the package
[`vsm-dictionary`](https://github.com/vsmjs/vsm-dictionary)), that uses 
the [Noctua Entity Ontology's (NEO) Solr Web Service](http://golr-aux.geneontology.io) 
to translate information about different types of bioentites (proteins, genes, RNAs 
and complexes) into VSM-specific format.

## Install

Run: `npm install`

## Example use

Create a `test.js` file and include this code:
    
```javascript
const DictionaryNeo = require('./DictionaryNeo');
const dict = new DictionaryNeo({log: true});

dict.getEntryMatchesForString('tp53', { page: 1, perPage: 10 }, 
  (err, res) => {
    if (err) 
      console.log(JSON.stringify(err, null, 4));
    else
      console.log(JSON.stringify(res, null, 4));
  }
);
```
Then, run `node test.js`

## Tests

Run `npm test`, which runs the source code tests with Mocha.  
If you want to quickly live test NEO's Solr Web Service, go to the 
`test` directory and run:
```
node getEntries.test.js
node getEntryMatchesForString.test.js
```

## 'Build' configuration

To use a VsmDictionary in Node.js, one can simply run `npm install` and then
use `require()`. But it is also convenient to have a version of the code that
can just be loaded via a &lt;script&gt;-tag in the browser.

Therefore, we included `webpack.config.js`, which is a Webpack configuration file for 
generating such a browser-ready package.

By running `npm build`, the built file will appear in a 'dist' subfolder. 
You can use it by including: 
`<script src="../dist/vsm-dictionary-neo.min.js"></script>` in the
header of an HTML file. 

## Specification

Like all VsmDictionary subclass implementations, this package follows
the parent class
[specification](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md).
In the next sections we will explain the mapping between the data 
offered by NEO's Solr Web Service and the corresponding VSM objects. 
NEO's API is based on [Solr](https://lucene.apache.org/solr/).

Note that if we receive an error response from NEO's Solr Web Service (see the 
URL requests for `getEnties` and `getEntryMatchesForString` below) that is not a
JSON string that we can parse, we formulate the error as a JSON object ourselves 
in the following format:
```
{
  status: <number>,
  error: <response> 
}
```
where the *response* from the server is JSON stringified.


### Map NEO to DictInfo VSM object

This specification relates to the function:  
 `getDictInfos(options, cb)`

If the `options.filter.id` is not properly defined 
or the `http://golr-aux.geneontology.io` dictID is included in the 
list of ids used for filtering, `getDictInfos` returns a static object 
with the following properties:
- `id`: 'http://golr-aux.geneontology.io' (will be used as a `dictID`)
- `abbrev`: 'NEO'
- `name`: 'Noctua Entity Ontology'

Otherwise, an empty result is returned.

### Map NEO to Entry VSM object

This specification relates to the function:  
 `getEntries(options, cb)`

Firstly, if the `options.filter.dictID` is properly defined and in the list of 
dictIDs the `http://golr-aux.geneontology.io` dictID is not included, then 
an **empty array** of entry objects is returned.

If the `options.filter.id` is properly defined (with compact URIs - 
[CURIEs](https://en.wikipedia.org/wiki/CURIE) - like
`UniProtKB:P35222` or `RNAcentral:URS0000530EBF_9606`) then we use a query like this:

```
http://golr-aux.geneontology.io/solr/select?fq=document_category:bioentity&q=*:*&fq=(bioentity:"RNAcentral:URS0000530EBF_9606" bioentity:"UniProtKB:P35222")&fl=bioentity,bioentity_label,bioentity_name,synonym_searchable,taxon,taxon_label,type&rows=2&start=0&sort=bioentity%20asc&wt=json
```

For the above URL, we provide a brief description for each sub-part: 
1. The first part refers to NEO's Solr select endpoint: `http://golr-aux.geneontology.io/solr/select?`
2. The second part (*fq=document_category:bioentity*) refers to the category of 
entries we are searching/filtering for
    - Note that each bioentity has a type, and all the possible returned types 
    can be clustered to 4 categories: **proteins, genes, complexes and RNAs**.
3. The third part (_q=\*:\*_) means that we will perform a query on any field and search for any string 
4. The fourth part means that we will filter the query to specific entries: those
that have *either* the bioentity field equal to `RNAcentral:URS0000530EBF_9606` 
or equal to `UniProtKB:P35222`. 
5. The fifth part is the *fields* of interest - i.e. the information related to 
the entries that we will map to VSM-entry properties (*fl=...*).
6. The sixth part refers to the pagination parameters (`rows` = how many results,
`start` = where to start)
    - The values of `rows` and `start` depend on `options.page` and `options.perPage` options
    - The `rows` requested can be between 0 and 100 and if it's not in those 
    limits or not properly defined, we set it to the default page size which is **50**.
    - The `start` (offset, zero-based) has a default value of 0 but if 
    `options.page` is properly defined, it is set in the value of 
    `(options.page - 1) * rows`.
7. The sixth part refers to the *sorting* of the returned results by `bioentity`/CURIE
(alphabetically from A to Z).
8. The last part defines the format of the returned data (JSON).

Otherwise, we ask for all CURIEs (by default **CURIE/bioentity sorted**) with 
this query that does not filter on the bioentities requested:
```
http://golr-aux.geneontology.io/solr/select?fq=document_category:bioentity&q=*:*&fl=bioentity,bioentity_label,bioentity_name,synonym_searchable,taxon,taxon_label,type&rows=3&start=0&sort=bioentity%20asc&wt=json
```

When using NEO's Solr API, we get back a JSON object with a *response* 
property, whose value is an object with a *docs* property. The *docs*'s 
value is an array of objects (the entries). Every entry object has as attributes 
the *fields* requested in the query above. We now provide a mapping of the 
attributes' values to VSM-entry specific properties:

NEO Solr field | Type | Required | VSM entry/match object property | Notes  
:---:|:---:|:---:|:---:|:---:
`bioentity` | String | YES | `id`, `terms[i].str` | The VSM entry id is the CURIE string
`bioentity_label` | String | NO | `terms[0].str`, `str` |  
`bioentity_name` | String | NO | `descr` | 
`synonym_searchable` | Array | NO | `terms[i].str` | We map the whole array if present
`taxon`, `taxon_label` | String | NO | `z.species` | Example: `Homo sapiens; 9606` 
`type` | String | NO | `z.type` | Example types: `protein`, `transcript`, `gene` 

Note that the above mapping describes what we as developers thought as the most
reasonable. There is though a global option `optimap` that you can pass to the 
`DictionaryNeo` object, which optimizes the above mapping for curator clarity
and use. The **default value is true** and what changes in the mapping table
above (which is the mapping for `optimap: false` actually) is that the VSM's `descr` 
entry/match object property takes the combined value of the `taxon_label`, the 
`type`, the synonyms/terms (`terms[i].str`) and the `bioentity_name` (in that 
order).

### Map Neo to Match VSM object

This specification relates to the function:  
 `getEntryMatchesForString(str, options, cb)`

Firstly, if the `options.filter.dictID` is properly defined and in the list of 
dictIDs the `http://golr-aux.geneontology.io` dictID is not included, then 
an **empty array** of match objects is returned.

Otherwise, an example of a URL string that is being built and send to NEO's Solr
 Web Service when requesting for `tp53`, is:
```
http://golr-aux.geneontology.io/solr/select?fq=document_category:bioentity&q=*:*&fq=(bioentity_label_searchable:tp53* bioentity_name_searchable:tp53* synonym_searchable:tp53* taxon_label_searchable:tp53*)&fl=bioentity,bioentity_label,bioentity_name,synonym_searchable,taxon,taxon_label,type&rows=30&start=0&wt=json
```

The fields requested are the same as in the `getEntries(options, cb)` 
case as well as the mapping shown in the table above. The only thing that changes 
in the above URL compared to the one given for the `getEntries` case is that 
there is **no sorting on the server side** and that we try to find `tp53` matches 
with a wildcard query search (as `tp53*`) in **4 fields** using `OR` logic: 
`bioentity_label_searchable`, `bioentity_name_searchable`, `synonym_searchable` and `taxon_label_searchable`.
If the request string `str` is comprised of multiple words (separated by space)
**we search for each word in the 4 fields** previously mentioned and we combine the 
search results with `AND` logic. Also if a word has any of the following special
characters: `+ - & | ! ( ) { } [ ] ^ " ~ * ? : /`, we escape them (according to 
the standard Solr Query Parser) and put the
resulting word in quotes. For example, if `str` = `Catenin beta-1 sapiens`,
the query field option in the above URL query would be:
```
fq=(bioentity_label_searchable:Catenin* bioentity_name_searchable:Catenin* synonym_searchable:Catenin* taxon_label_searchable:Catenin*) AND
   (bioentity_label_searchable:"beta\-1*" bioentity_name_searchable:"beta\-1*" synonym_searchable:"beta\-1*" taxon_label_searchable:"beta\-1*") AND 
   (bioentity_label_searchable:sapiens* bioentity_name_searchable:sapiens* synonym_searchable:sapiens* taxon_label_searchable:sapiens*)
```

Searching in all of 4 fields gives the user the flexibility to appropriately 
choose the words in the `str` that will filter/minimize the returned results. 

## License

This project is licensed under the AGPL license - see [LICENSE.md](LICENSE.md).
