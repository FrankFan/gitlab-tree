var assert = require('assert');
var code = require('./code');

describe('Array', function() {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function() {
      assert.equal([1,2,3].indexOf(6), -1);
    });
  });
});

describe('Functions', function() {
  it('revertPath', function() {
    assert.equal(code.revertPath('java/main/src/'), 'src/main/java');
  });

  it('removeElement', function () {
    assert.equal(code.removeElement(0, ['java', 'main', 'src']).sort().toString(), ['main', 'src'].sort().toString());
  });

  it('makeRequestArr', function () {
    assert.equal(code.makeRequestArr('src/main/webapp').sort().toString(), ['src', 'src/main', 'src/main/webapp'].sort().toString());
  });
});
