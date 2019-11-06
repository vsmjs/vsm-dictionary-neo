const Dictionary = require('vsm-dictionary');
const { removeDuplicates, isJSONString } = require('./fun');

module.exports = class DictionaryNeo extends Dictionary {

  constructor(options) {
    const opt = options || {};
    super(opt);

    // optimized mapping for curators
    this.optimap = (typeof opt.optimap === 'boolean')
      ? opt.optimap
      : true;

    // Neo-specific parameters
    this.neoDictID = 'http://golr-aux.geneontology.io';
    this.neoQueryFields = 'bioentity,bioentity_label,bioentity_name,synonym_searchable,taxon,taxon_label,type';
    this.solrBioentityURLPart = '/solr/select?fq=document_category:bioentity&q=%2A%3A%2A'; // q=*:*
    this.neoMaxPageSize = 100;
    this.neoMinStart = 0;
    this.neoFormat = opt.format || 'json';

    const baseURL = opt.baseURL || this.neoDictID + this.solrBioentityURLPart;

    this.perPageDefault = 50;

    // enable the console.log() usage
    this.enableLogging = opt.log || false;

    this.urlGetEntries = opt.urlGetEntries || baseURL;
    this.urlGetMatches = opt.urlGetMatches || baseURL;
  }

  getDictInfos(options, cb) {
    let res = {
      items: [
        {
          id: this.neoDictID,
          abbrev: 'NEO',
          name: 'Noctua Entity Ontology'
        }
      ]
    };

    if (!this.hasProperFilterIDProperty(options)) {
      return cb(null, res);
    } else {
      return (options.filter.id.includes(this.neoDictID))
        ? cb(null, res)
        : cb(null, { items: [] });
    }
  }

  getEntries(options, cb) {
    if (this.hasProperFilterDictIDProperty(options)
      && !options.filter.dictID.includes(this.neoDictID)) {
      return cb(null, { items: [] });
    }

    const url = this.prepareEntrySearchURL(options);

    if (this.enableLogging)
      console.log('URL: ' + url);

    this.request(url, (err, res) => {
      if (err) return cb(err);
      let entryObjArray = this.mapNeoResToEntryObj(res);

      // z-prune results
      let arr = Dictionary.zPropPrune(entryObjArray, options.z);

      cb(err, { items: arr });
    });
  }

  getEntryMatchesForString(str, options, cb) {
    if ((!str) || (str.trim() === '')) return cb(null, {items: []});

    if (this.hasProperFilterDictIDProperty(options)
      && !options.filter.dictID.includes(this.neoDictID)) {
      return cb(null, { items: [] });
    }

    const url = this.prepareMatchStringSearchURL(str, options);

    if (this.enableLogging)
      console.log('URL: ' + url);

    this.request(url, (err, res) => {
      if (err) return cb(err);
      let matchObjArray = this.mapNeoResToMatchObj(res, str);

      // z-prune results
      let arr = Dictionary.zPropPrune(matchObjArray, options.z);

      cb(err, { items: arr });
    });
  }

  mapNeoResToEntryObj(res) {
    return res.response.docs.map(entry => {
      const terms = this.buildTerms(entry.bioentity_label,
        entry.synonym_searchable, entry.bioentity);
      const species = this.buildSpecies(entry.taxon, entry.taxon_label);
      const descr = this.buildDescr(entry.bioentity_name, entry.taxon_label,
        entry.type, terms);
      return {
        id: entry.bioentity,
        dictID: this.neoDictID,
        descr: descr,
        terms: terms,
        z: {
          type: entry.type,
          species: species
        }
      };
    });
  }

  mapNeoResToMatchObj(res, str) {
    return res.response.docs.map(entry => {
      const terms = this.buildTerms(entry.bioentity_label,
        entry.synonym_searchable, entry.bioentity);
      const species = this.buildSpecies(entry.taxon, entry.taxon_label);
      const descr = this.buildDescr(entry.bioentity_name, entry.taxon_label,
        entry.type, terms);
      return {
        id: entry.bioentity,
        dictID: this.neoDictID,
        str: terms[0].str,
        descr: descr,
        type: terms[0].str.startsWith(str) ? 'S' : 'T',
        terms: terms,
        z: {
          type: entry.type,
          species: species
        }
      };
    });
  }

  prepareEntrySearchURL(options) {
    let url = this.urlGetEntries;
    let curieList = [];

    // remove non-CURIEs
    if (this.hasProperFilterIDProperty(options)) {
      let CurieRegex = /\S+:\S+/;
      curieList = options.filter.id.filter(id => id.match(CurieRegex) !== null);
    }

    if (curieList.length !== 0) {
      // specific CURIEs
      let curieURLStr = curieList.join('" bioentity:"');
      url += '&fq=(bioentity:"' + curieURLStr + '")&fl=' + this.neoQueryFields;
    } else {
      // all CURIEs/IDs
      url = url + '&fl=' + this.neoQueryFields ;
    }

    // add rows and start URL parameters
    let pageSize = this.perPageDefault;
    if (this.hasProperPerPageProperty(options)
      && options.perPage <= this.neoMaxPageSize
    ) {
      pageSize = options.perPage;
    }

    url += '&rows=' + pageSize;

    if (this.hasProperPageProperty(options)) {
      url += '&start=' + (options.page - 1) * pageSize;
    } else
      url += '&start=' + this.neoMinStart;

    // Always sort by CURIE/bioentity/id
    url += '&sort=bioentity%20asc';

    // JSON format
    url += '&wt=' + this.neoFormat;
    return url;
  }

  prepareMatchStringSearchURL(str, options) {
    let url = this.urlGetMatches;

    url += '&fq=' + this.buildQuery(str);
    url += '&fl=' + this.neoQueryFields;

    // add rows and start URL parameters
    let pageSize = this.perPageDefault;
    if (this.hasProperPerPageProperty(options)
      && options.perPage <= this.neoMaxPageSize
    ) {
      pageSize = options.perPage;
    }

    url += '&rows=' + pageSize;

    if (this.hasProperPageProperty(options)) {
      url += '&start=' + (options.page - 1) * pageSize;
    } else
      url += '&start=' + this.neoMinStart;

    // JSON format
    url += '&wt=' + this.neoFormat;
    return url;
  }

  buildQuery(str) {
    let specialSolrChars = /[+\-&|!(){}[\]^"~*?:/]/g;
    let words = str.trim().split(' ');
    let queryStr = '';

    for (let word of words) {
      if (queryStr !== '') queryStr += ' AND ';
      if (specialSolrChars.test(word)) {
        word = '"' + word.replace(specialSolrChars, '\\$&') + '*"';
      } else {
        word = word + '*';
      }
      queryStr += '('
        + 'bioentity_label_searchable:' + word
        + ' bioentity_name_searchable:' + word
        + ' synonym_searchable:'        + word
        + ' taxon_label_searchable:'    + word + ')';
    }

    return queryStr;
  }

  buildTerms(bioentity_label, synonym_searchable, bioentity) {
    let res = [];

    let mainTerm =
      this.getMainTerm(bioentity_label, synonym_searchable, bioentity);
    res.push({ str: mainTerm });

    let synonyms = [];
    if (typeof(synonym_searchable) !== 'undefined' && synonym_searchable.length !== 0)
      synonyms = synonyms.concat(synonym_searchable);
    if (typeof(bioentity_label) !== 'undefined' && bioentity_label.length !== 0)
      synonyms = synonyms.concat(bioentity_label);
    synonyms = removeDuplicates(synonyms.concat(bioentity));

    synonyms = synonyms.filter(syn => syn !== mainTerm);

    for (let synonym of synonyms) {
      res.push({ str: synonym });
    }

    return res;
  }

  getMainTerm(bioentity_label, synonym_searchable, bioentity) {
    // priority is: label > synonym > id (bioentity)
    if (typeof(bioentity_label) !== 'undefined' && bioentity_label.length !== 0)
      return bioentity_label;
    else if (typeof(synonym_searchable) !== 'undefined' && synonym_searchable.length !== 0)
      return synonym_searchable[0];
    else
      return bioentity;
  }

  buildSpecies(taxon, taxon_label) {
    let hasTaxonLabel = (typeof taxon_label !== 'undefined' && taxon_label.length !== 0);
    let hasTaxonNumber = (typeof taxon !== 'undefined' && taxon.length !== 0);

    if (hasTaxonLabel && hasTaxonNumber)
      return taxon_label + '; ' + taxon.replace('NCBITaxon:', '');
    else if (hasTaxonLabel)
      return taxon_label;
    else if (hasTaxonNumber)
      return 'No label' + '; ' + taxon.replace('NCBITaxon:', '');
    else
      return 'No taxon label or number given';
  }

  buildDescr(bioentity_name, taxon_label, type, terms) {
    const descr = typeof(bioentity_name) !== 'undefined' ? bioentity_name : '';
    if (this.optimap) {
      // type, species, bioentity_name
      let termArr = terms.map(term => term.str);
      let termStrings = termArr.join('|');
      let str = (descr.length !== 0) ? termStrings + '; ' + descr : termStrings;
      return (typeof taxon_label !== 'undefined' && taxon_label.length !== 0)
        ? taxon_label.concat('; ', type, '; ', str)
        : type + '; ' + str;
    } else {
      return descr;
    }
  }

  trimEntryObjArray(arr, options) {
    let numOfResults = arr.length;
    let page = this.hasProperPageProperty(options)
      ? options.page
      : 1;
    let pageSize = this.hasProperPerPageProperty(options)
      ? options.perPage
      : this.perPageDefault;

    return arr.slice(
      ((page - 1) * pageSize),
      Math.min(page * pageSize, numOfResults)
    );
  }

  hasProperFilterDictIDProperty(options) {
    return options.hasOwnProperty('filter')
      && options.filter.hasOwnProperty('dictID')
      && Array.isArray(options.filter.dictID)
      && options.filter.dictID.length !== 0;
  }

  hasProperFilterIDProperty(options) {
    return options.hasOwnProperty('filter')
      && options.filter.hasOwnProperty('id')
      && Array.isArray(options.filter.id)
      && options.filter.id.length !== 0;
  }

  hasProperPageProperty(options) {
    return options.hasOwnProperty('page')
      && Number.isInteger(options.page)
      && options.page >= 1;
  }

  hasProperPerPageProperty(options) {
    return options.hasOwnProperty('perPage')
      && Number.isInteger(options.perPage)
      && options.perPage >= 1;
  }

  request(url, cb) {
    const req = this.getReqObj();
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status !== 200) {
          let response = req.responseText;
          isJSONString(response)
            ? cb(JSON.parse(response))
            : cb(JSON.parse('{ "status": ' + req.status
            + ', "error": ' + JSON.stringify(response) + '}'));
        }
        else {
          try {
            const response = JSON.parse(req.responseText);
            cb(null, response);
          } catch (err) {
            cb(err);
          }
        }
      }
    };
    req.open('GET', url, true);
    req.send();
  }

  getReqObj() {
    return new (typeof XMLHttpRequest !== 'undefined'
      ? XMLHttpRequest // In browser
      : require('xmlhttprequest').XMLHttpRequest  // In Node.js
    )();
  }

};
