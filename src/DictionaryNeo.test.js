/* eslint-disable no-useless-escape */
const DictionaryNeo = require('./DictionaryNeo');
const chai = require('chai'); chai.should();
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

describe('DictionaryNeo.js', () => {

  const testURLBase = 'http://test';
  const dict =
    new DictionaryNeo({ baseURL: testURLBase, log: true, optimap: false });
  const dictOptimized =
    new DictionaryNeo({ baseURL: testURLBase, log: true }); // optimap: true

  const melanomaStr = 'melanoma';
  const broStr = 'protein bro';

  const getIDPath = path.join(__dirname, '..', 'resources', 'id.json');
  const getMelanomaPath = path.join(__dirname, '..', 'resources', 'melanoma.json');

  const getIDStr = fs.readFileSync(getIDPath, 'utf8');
  const getMatchesForMelanomaStr = fs.readFileSync(getMelanomaPath, 'utf8');

  describe('getDictInfos', () => {
    it('returns empty result when the list of dictIDs does not '
      + ' include the NEO dictID', cb => {
      dict.getDictInfos({ filter: { id: [
        ' ',
        'https://www.uniprot.org',
        'https://www.ensemblgenomes.org' ]}},
      (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
        cb();
      });
    });

    it('returns proper dictInfo object when `options.filter` is not properly ' +
      'defined or NEO dictID is in the list of specified dictIDs', cb => {
      let expectedResult = { items: [
        {
          id: 'http://golr-aux.geneontology.io',
          abbrev: 'NEO',
          name: 'Noctua Entity Ontology'
        }
      ]};

      dict.getDictInfos({}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(expectedResult);
      });

      dict.getDictInfos({ filter: { id: [
        'http://www.ensemblgenomes.org',
        'https://www.ebi.ac.uk/complexportal',
        'http://golr-aux.geneontology.io' ]}},
      (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(expectedResult);
      });

      cb();
    });
  });

  describe('getEntries', () => {
    it('returns empty result when the `options.filter.dictID` is properly ' +
      'defined and in the list of dictIDs the NEO dictID is not included', cb => {
      dict.getEntries({filter: { dictID: ['']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
      });

      dict.getEntries({filter: { dictID: [
        ' ',
        'https://www.uniprot.org',
        'http://www.ensemblgenomes.org'
      ]}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
      });

      cb();
    });
  });

  describe('getEntryMatchesForString', () => {
    it('returns empty result when the `options.filter.dictID` is properly ' +
      'defined and in the list of dictIDs the Neo dictID is not included', cb => {
      dict.getEntryMatchesForString(melanomaStr, {filter: { dictID: ['']}},
        (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({ items: [] });
        });

      dict.getEntryMatchesForString(melanomaStr, {filter: { dictID: [
        ' ',
        'https://www.uniprot.org',
        'http://www.ensemblgenomes.org']}},
      (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
      });

      cb();
    });
  });

  describe('mapNeoResToEntryObj', () => {
    it('properly maps Neo\'s Solr Search returned JSON object to a VSM entry '
      + 'object', cb => {
      dict.mapNeoResToEntryObj(JSON.parse(getIDStr)).should.deep.equal(
        [
          {
            id: 'UniProtKB:P35222',
            dictID: 'http://golr-aux.geneontology.io',
            descr: 'Catenin beta-1',
            terms: [
              {
                str: 'CTNNB1'
              },
              {
                str: 'CTNNB'
              },
              {
                str: 'OK/SW-cl.35'
              },
              {
                str: 'PRO2286'
              },
              {
                str: 'UniProtKB:P35222'
              }
            ],
            z: {
              species: 'Homo sapiens; 9606',
              type: 'protein'
            }
          }
        ]
      );

      dictOptimized.mapNeoResToEntryObj(JSON.parse(getIDStr))
        .should.deep.equal(
          [
            {
              id: 'UniProtKB:P35222',
              dictID: 'http://golr-aux.geneontology.io',
              descr: 'Homo sapiens; protein; CTNNB1|CTNNB|OK/SW-cl.35|PRO2286|UniProtKB:P35222; Catenin beta-1',
              terms: [
                {
                  str: 'CTNNB1'
                },
                {
                  str: 'CTNNB'
                },
                {
                  str: 'OK/SW-cl.35'
                },
                {
                  str: 'PRO2286'
                },
                {
                  str: 'UniProtKB:P35222'
                }
              ],
              z: {
                species: 'Homo sapiens; 9606',
                type: 'protein'
              }
            }
          ]
        );

      cb();
    });
  });

  describe('mapNeoResToMatchObj', () => {
    it('properly maps Neo\'s Solr Search returned JSON object to a VSM match '
      + 'object', cb => {
      dict.mapNeoResToMatchObj(JSON.parse(getMatchesForMelanomaStr), 'melanoma')
        .should.deep.equal(
          [
            {
              id: 'UniProtKB:A0A2I2URV1',
              dictID: 'http://golr-aux.geneontology.io',
              str: 'MUM1',
              descr: 'Melanoma associated antigen (mutated) 1',
              type: 'T',
              terms: [
                {
                  str: 'MUM1'
                },
                {
                  str: 'UniProtKB:A0A2I2URV1'
                },
                {
                  str: 'PTN002043176'
                }
              ],
              z: {
                species: 'Felis catus; 9685',
                type: 'protein'
              }
            }
          ]
        );

      dictOptimized.mapNeoResToMatchObj(JSON.parse(getMatchesForMelanomaStr), 'melanoma')
        .should.deep.equal(
          [
            {
              id: 'UniProtKB:A0A2I2URV1',
              dictID: 'http://golr-aux.geneontology.io',
              str: 'MUM1',
              descr: 'Felis catus; protein; MUM1|UniProtKB:A0A2I2URV1|PTN002043176; Melanoma associated antigen (mutated) 1',
              type: 'T',
              terms: [
                {
                  str: 'MUM1'
                },
                {
                  str: 'UniProtKB:A0A2I2URV1'
                },
                {
                  str: 'PTN002043176'
                }
              ],
              z: {
                species: 'Felis catus; 9685',
                type: 'protein'
              }
            }
          ]
        );

      cb();
    });
  });

  describe('prepareEntrySearchURL', () => {
    it('returns proper URL(s)', cb => {
      const url1 = dict.prepareEntrySearchURL({});
      const url2 = dict.prepareEntrySearchURL({ page: 1, perPage: 2 });
      const url3 = dict.prepareEntrySearchURL({ filter: { id: ['']}, page: 1, perPage: 2 });
      const url4 = dict.prepareEntrySearchURL({ sort: 'id', page: 2, perPage: 50 });
      const url5 = dict.prepareEntrySearchURL({ sort: 'dictID', page: 3, perPage: 50 });
      const url6 = dict.prepareEntrySearchURL({ sort: 'dictID', page: 100, perPage: 100 });
      const url7 = dict.prepareEntrySearchURL({ filter: {
        id: ['RNAcentral:URS0000530EBF_9606', 'noCURIE:', ':noCURIE', 'noCurie']
      }, page: 3, perPage: 20 });
      const url8 = dict.prepareEntrySearchURL({ filter: {
        id: [ '', 'RNAcentral:URS0000530EBF_9606', 'UniProtKB:P35222',
          'GeneDB:Tb927.10.11630:mRNA', 'https://www.ensembl.org/id/LRG_321', ' : ' ]
      }, page: -1, perPage: 101 });

      const formatURLPart = '&wt=json';
      const sortURLPart = '&sort=bioentity%20asc';
      const URLfields = '&fl=bioentity,bioentity_label,bioentity_name,synonym_searchable,taxon,taxon_label,type';
      const expectedURL1 = testURLBase + URLfields + '&rows=50&start=0'
        + sortURLPart + formatURLPart;
      const expectedURL2 = testURLBase + URLfields + '&rows=2&start=0'
        + sortURLPart + formatURLPart;
      const expectedURL3 = testURLBase + URLfields + '&rows=2&start=0'
        + sortURLPart + formatURLPart;
      const expectedURL4 = testURLBase + URLfields + '&rows=50&start=50'
        + sortURLPart + formatURLPart;
      const expectedURL5 = testURLBase + URLfields + '&rows=50&start=100'
        + sortURLPart + formatURLPart;
      const expectedURL6 = testURLBase + URLfields + '&rows=100&start=9900'
        + sortURLPart + formatURLPart;
      const expectedURL7 = testURLBase + '&fq=(bioentity:"RNAcentral:URS0000530EBF_9606")'
        + URLfields + '&rows=20&start=40' + sortURLPart +formatURLPart;
      const expectedURL8 = testURLBase + '&fq=(bioentity:"RNAcentral:URS0000530EBF_9606" bioentity:"UniProtKB:P35222" bioentity:"GeneDB:Tb927.10.11630:mRNA" bioentity:"https://www.ensembl.org/id/LRG_321")'
        + URLfields + '&rows=50&start=0' + sortURLPart + formatURLPart;

      url1.should.equal(expectedURL1);
      url2.should.equal(expectedURL2);
      url3.should.equal(expectedURL3);
      url4.should.equal(expectedURL4);
      url5.should.equal(expectedURL5);
      url6.should.equal(expectedURL6);
      url7.should.equal(expectedURL7);
      url8.should.equal(expectedURL8);

      cb();
    });
  });

  describe('prepareMatchStringSearchURL', () => {
    it('returns proper URL', cb => {
      const url1 = dict.prepareMatchStringSearchURL(melanomaStr, {});
      const melanomaQuery = '&fq=(bioentity_label_searchable:melanoma* bioentity_name_searchable:melanoma* synonym_searchable:melanoma* taxon_label_searchable:melanoma*)';
      const broQuery = '&fq=(bioentity_label_searchable:protein* bioentity_name_searchable:protein* synonym_searchable:protein* taxon_label_searchable:protein*) AND (bioentity_label_searchable:bro* bioentity_name_searchable:bro* synonym_searchable:bro* taxon_label_searchable:bro*)';
      const expectedURL1 = testURLBase + melanomaQuery;
      const expectedURL2 = testURLBase + broQuery;
      const paginationURLPart1 = '&rows=50&start=0';
      const queryFields = '&fl=bioentity,bioentity_label,bioentity_name,synonym_searchable,taxon,taxon_label,type';
      const formatURLPart = '&wt=json';

      url1.should.equal(expectedURL1 + queryFields + paginationURLPart1
        + formatURLPart);

      const url2 = dict.prepareMatchStringSearchURL(broStr, { page: 'String' });
      url2.should.equal(expectedURL2 + queryFields + paginationURLPart1
        + formatURLPart);

      const url3 = dict.prepareMatchStringSearchURL(melanomaStr, { page: 0 });
      url3.should.equal(expectedURL1 + queryFields + paginationURLPart1
        + formatURLPart);

      const url4 = dict.prepareMatchStringSearchURL(broStr, { page: 4 });
      const paginationURLPart2 = '&rows=50&start=150';
      url4.should.equal(expectedURL2 + queryFields + paginationURLPart2
        + formatURLPart);

      const url5 = dict.prepareMatchStringSearchURL(melanomaStr, { perPage: ['Str'] });
      url5.should.equal(expectedURL1 + queryFields + paginationURLPart1
        + formatURLPart);

      const url6 = dict.prepareMatchStringSearchURL(melanomaStr, { perPage: 0 });
      url6.should.equal(expectedURL1 + queryFields + paginationURLPart1
        + formatURLPart);

      const url7 = dict.prepareMatchStringSearchURL(melanomaStr,
        { page: 3, perPage: 100 });
      const paginationURLPart3 = '&rows=100&start=200';
      url7.should.equal(expectedURL1 + queryFields + paginationURLPart3
        + formatURLPart);

      const url8 = dict.prepareMatchStringSearchURL(melanomaStr,
        { page: 1, perPage: 2 });
      const paginationURLPart4 = '&rows=2&start=0';
      url8.should.equal(expectedURL1 + queryFields + paginationURLPart4
        + formatURLPart);

      cb();
    });
  });

  describe('buildQuery', () => {
    it('returns a proper query string for NEO\'s Solr system to process', cb => {
      // 1 word
      dict.buildQuery('  a ').should.equal('(bioentity_label_searchable:a* bioentity_name_searchable:a* synonym_searchable:a* taxon_label_searchable:a*)');
      dict.buildQuery('miRN').should.equal('(bioentity_label_searchable:miRN* bioentity_name_searchable:miRN* synonym_searchable:miRN* taxon_label_searchable:miRN*)');
      dict.buildQuery('s"').should.equal('(bioentity_label_searchable:"s\\"*" bioentity_name_searchable:"s\\"*" synonym_searchable:"s\\"*" taxon_label_searchable:"s\\"*")');
      dict.buildQuery('pro:?').should.equal('(bioentity_label_searchable:"pro\\:\\?*" bioentity_name_searchable:"pro\\:\\?*" synonym_searchable:"pro\\:\\?*" taxon_label_searchable:"pro\\:\\?*")');

      // 2 words
      dict.buildQuery('hey bro').should.equal('(bioentity_label_searchable:hey* bioentity_name_searchable:hey* synonym_searchable:hey* taxon_label_searchable:hey*) AND (bioentity_label_searchable:bro* bioentity_name_searchable:bro* synonym_searchable:bro* taxon_label_searchable:bro*)');
      dict.buildQuery('beta-1 catenin').should.equal('(bioentity_label_searchable:"beta\\-1*" bioentity_name_searchable:"beta\\-1*" synonym_searchable:"beta\\-1*" taxon_label_searchable:"beta\\-1*") AND (bioentity_label_searchable:catenin* bioentity_name_searchable:catenin* synonym_searchable:catenin* taxon_label_searchable:catenin*)');

      // 3 words
      dict.buildQuery('mi hist:a *').should.equal('(bioentity_label_searchable:mi* bioentity_name_searchable:mi* synonym_searchable:mi* taxon_label_searchable:mi*) AND (bioentity_label_searchable:"hist\\:a*" bioentity_name_searchable:"hist\\:a*" synonym_searchable:"hist\\:a*" taxon_label_searchable:"hist\\:a*") AND (bioentity_label_searchable:"\\**" bioentity_name_searchable:"\\**" synonym_searchable:"\\**" taxon_label_searchable:"\\**")');
      cb();
    });
  });

  describe('buildTerms', () => {
    it('returns proper array of term objects', cb => {
      let label = 'atpB';
      let synonyms = ['P06541', 'PTN001807781'];
      let bioentity = 'UniProtKB:P06541'; // always there!

      let expectedRes = [
        { str: label }, { str: synonyms[0] },
        { str: synonyms[1] }, { str: bioentity }
      ];

      dict.buildTerms(label, synonyms, bioentity).should.deep.equal(expectedRes);
      expectedRes.shift(); // remove 1st element
      dict.buildTerms('', synonyms, bioentity).should.deep.equal(expectedRes);
      dict.buildTerms(undefined, synonyms, bioentity)
        .should.deep.equal(expectedRes);

      dict.buildTerms(undefined, [], bioentity)
        .should.deep.equal([{ str: bioentity }]);
      dict.buildTerms(undefined, undefined, bioentity)
        .should.deep.equal([{ str: bioentity }]);

      cb();
    });
  });

  describe('buildSpecies', () => {
    it('returns proper species string', cb => {
      let taxon = 'NCBITaxon:9606';
      let taxon_label = 'Homo Sapiens';

      dict.buildSpecies(taxon, taxon_label).should.equal('Homo Sapiens; 9606');
      dict.buildSpecies(undefined, taxon_label).should.equal('Homo Sapiens');
      dict.buildSpecies(taxon, undefined).should.equal('No label; 9606');
      dict.buildSpecies(undefined, undefined).should.equal('No taxon label or number given');

      cb();
    });
  });

  describe('getMainTerm', () => {
    it('returns proper main term', cb => {
      let label = 'atpB';
      let synonyms = ['P06541', 'PTN001807781'];
      let bioentity = 'UniProtKB:P06541'; // always there!

      dict.getMainTerm(label, synonyms, bioentity).should.equal(label);
      dict.getMainTerm('', synonyms, bioentity).should.equal(synonyms[0]);
      dict.getMainTerm(undefined, synonyms, bioentity).should.equal(synonyms[0]);

      dict.getMainTerm(undefined, [], bioentity).should.equal(bioentity);
      dict.getMainTerm(undefined, undefined, bioentity).should.equal(bioentity);

      cb();
    });
  });

  describe('buildDescr', () => {
    it('returns proper description string', cb => {
      let bioentity_name = 'A description string';
      let taxon_label = 'Homo sapiens';
      let type = 'protein';
      let terms = [
        { str: 'mainTerm' }, { str: 'Synonym-2' }, { str: 'Synonym-3' }
      ];

      dict.buildDescr(bioentity_name, taxon_label, type, terms).should.equal('A description string');
      dictOptimized.buildDescr(bioentity_name, taxon_label, type, terms).should.equal('Homo sapiens; protein; mainTerm|Synonym-2|Synonym-3; A description string');

      dict.buildDescr('', taxon_label, type, terms).should.equal('');
      dictOptimized.buildDescr('', taxon_label, type, terms).should.equal('Homo sapiens; protein; mainTerm|Synonym-2|Synonym-3');
      dictOptimized.buildDescr('', undefined, type, terms).should.equal('protein; mainTerm|Synonym-2|Synonym-3');

      terms = [{ str: 'mainTerm' }];
      dict.buildDescr(bioentity_name, taxon_label, type, terms).should.equal('A description string');
      dict.buildDescr(undefined, taxon_label, type, terms).should.equal('');
      dictOptimized.buildDescr(bioentity_name, taxon_label, type, terms).should.equal('Homo sapiens; protein; mainTerm; A description string');
      dictOptimized.buildDescr(undefined, taxon_label, type, terms).should.equal('Homo sapiens; protein; mainTerm');

      cb();
    });
  });

  describe('trimEntryObjArray', () => {
    it('properly trims given array of VSM entry objects', cb => {
      const arr = [
        { id:'a', dictID: 'A', terms: [{ str: 'aaa'}] },
        { id:'b', dictID: 'B', terms: [{ str: 'bbb'}] },
        { id:'c', dictID: 'C', terms: [{ str: 'ccc'}] }
      ];

      let options = {};
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr);

      options.page = 2;
      dict.trimEntryObjArray([], options).should.deep.equal([]);

      options.page = -1;
      options.perPage = 'no';
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr);

      options.page = 1;
      options.perPage = 2;
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr.slice(0,2));

      options.page = 2;
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr.slice(2,3));

      options.page = 3;
      dict.trimEntryObjArray(arr, options).should.deep.equal([]);

      cb();
    });
  });

});
