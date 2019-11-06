const { fixedEncodeURIComponent, removeDuplicates, isJSONString } = require('./fun');
const chai = require('chai'); chai.should();
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

describe('fun.js', () => {

  const getIDPath = path.join(__dirname, '..', 'resources', 'id.json');
  const getMelanomaPath = path.join(__dirname, '..', 'resources', 'melanoma.json');

  const getIDStr = fs.readFileSync(getIDPath, 'utf8');
  const getMatchesForMelanomaStr = fs.readFileSync(getMelanomaPath, 'utf8');

  describe('fixedEncodeURIComponent', () => {
    it('tests the difference between the standard encoding function ' +
      'and the updated implementation (compatible with RFC 3986)', cb => {
      encodeURIComponent('!').should.equal('!');
      fixedEncodeURIComponent('!').should.equal('%21');

      encodeURIComponent('\'').should.equal('\'');
      fixedEncodeURIComponent('\'').should.equal('%27');

      encodeURIComponent('(').should.equal('(');
      fixedEncodeURIComponent('(').should.equal('%28');

      encodeURIComponent(')').should.equal(')');
      fixedEncodeURIComponent(')').should.equal('%29');

      encodeURIComponent('*').should.equal('*');
      fixedEncodeURIComponent('*').should.equal('%2A');

      cb();
    });
  });

  describe('removeDuplicates', () => {
    it('returns proper results', cb => {
      removeDuplicates([]).should.deep.equal([]);
      removeDuplicates([1,2,3]).should.deep.equal([1,2,3]);
      removeDuplicates([1,2,1,3,1,2]).should.deep.equal([1,2,3]);
      removeDuplicates(['r','t','t','s','r','e','s'])
        .should.deep.equal(['r','t','s','e']);
      cb();
    });
  });

  describe('isJSONString', () => {
    it('returns true or false whether the given string is a JSON string or ' +
      'not!', cb => {
      expect(isJSONString('')).to.equal(false);
      expect(isJSONString('melanoma')).to.equal(false);
      expect(isJSONString('<h1>Not Found</h1>')).to.equal(false);
      expect(isJSONString([])).to.equal(false);
      expect(isJSONString({})).to.equal(false);
      expect(isJSONString('This is not a JSON string.')).to.equal(false);

      expect(isJSONString('{}')).to.equal(true);
      expect(isJSONString('[]')).to.equal(true);
      expect(isJSONString('["foo","bar",{"foo":"bar"}]')).to.equal(true);
      expect(isJSONString('{"myCount": null}')).to.equal(true);
      expect(isJSONString(getIDStr)).to.equal(true);
      expect(isJSONString(getMatchesForMelanomaStr)).to.equal(true);

      cb();
    });
  });
});