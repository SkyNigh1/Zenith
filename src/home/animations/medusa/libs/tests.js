(function() {

window.Test = { assert : {} };


})();

(function() {

Test.assert.close = assert_close;
function assert_close(actual, expected, maxDifference, message) {
  var passes = (actual === expected) || Math.abs(actual - expected) <= maxDifference;
  QUnit.push(passes, actual, expected, message);
}

Test.assert.closeArray = assert_closeMany;
function assert_closeMany(actual, expected, maxDifference, message) {
  var passes;
  for (var i = 0, il = actual.length; i < il; i ++) {
    passes = (actual[i] === expected[i]) || Math.abs(actual[i] - expected[i]) <= maxDifference;
    if (!passes) { break; }
  }
  QUnit.push(passes, actual, expected, message);
}

Test.assert.notClose = assert_notClose;
function assert_notClose(actual, expected, minDifference, message) {
  QUnit.push(Math.abs(actual - expected) > minDifference, actual, expected, message);
}


})();

(function() {

Test.assert.equalArray = assert_equalArray;
function assert_equalArray(actual, expected, message) {
  var isEqual = true;

  for (var i = 0, il = expected.length; i < il; i ++) {
    if (actual[i] !== expected[i]) {
      isEqual = false;
      break;
    }
  }

  QUnit.push(isEqual, actual, expected, message);
}


})();

(function() {

Test.assert.range = assert_range;
function assert_range(actual, min, max, message) {
  var passes = actual >= min && actual <= max;
  var expected = [min, max];
  QUnit.push(passes, actual, expected, message);
}


})();

(function() {

module('Constraint.LocalPlane');

var ParticleSystem = Particulate.ParticleSystem;
var LocalPlaneConstraint = App.LocalPlaneConstraint;
var Vec3 = Particulate.Vec3;

test('Creation', function () {
  var pa = 0, pb = 1, pc = 2;
  var a = 3;
  var indices = [3, 4, 5];
  var fromArgs = LocalPlaneConstraint.create(pa, pb, pc, a);
  var fromArray = LocalPlaneConstraint.create(pa, pb, pc, indices);

  Test.assert.equalArray(fromArgs.indices, [pa, pb, pc, a],
    'Should create indices from int arguments.');
  Test.assert.equalArray(fromArray.indices, [pa, pb, pc].concat(indices),
    'Should create indices from int array.');
});

function testPlane(expectedZ, v0, v1, v2) {
  var system = ParticleSystem.create(10, 10);
  var singleIndex = 3;
  var single = LocalPlaneConstraint.create(0, 1, 2, singleIndex);
  var manyIndices = [4, 5, 6, 7, 8, 9];
  var many = LocalPlaneConstraint.create(0, 1, 2, manyIndices);
  var pos = Vec3.create();

  function getZ(index) {
    return system.getPosition(index, pos)[2];
  }

  function returnExpected() {
    return expectedZ;
  }

  system.setPosition(0, v0);
  system.setPosition(1, v1);
  system.setPosition(2, v2);

  system.addConstraint(single);
  system.addConstraint(many);
  system.tick(20);

  Test.assert.closeArray(many.bufferVec3, [0, 0, 1], 0.1,
    'Should cache plane normal vector.');
  Test.assert.close(getZ(singleIndex), expectedZ, 0.1,
    'Should constrain single set of particles to plane.');
  Test.assert.closeArray(manyIndices.map(getZ), manyIndices.map(returnExpected), 0.1,
    'Should constrain multiple sets of particles to plane.');
}

test('Application', function () {
  testPlane(10,
    [25, 15, 10],
    [10, 10, 10],
    [50, 30, 10]);
});

test('Application with inline segments', function () {
  testPlane(10,
    [ 5,  5, 10],
    [10, 10, 10],
    [15, 15, 10]);
});

// Plane behind particles, should have no effect
test('Non-application when behind particles', function () {
  testPlane(0,
    [10, 10, -2],
    [ 0,  0, -2],
    [20, 20, -2]);
});


})();

(function() {

module('Pass.LensDirt');

var _slice = Array.prototype.slice;
var equalArray = Test.assert.equalArray;
var pass = App.LensDirtPass;

test('Set quad uvs', function () {
  var count = 5;
  var cells = 2;
  var uvAttr = pass.prototype._quadGeomUv(count, cells);
  var uvArray = uvAttr.array;

  var c0 = 0;
  var c1 = 1 / cells;
  var c2 = c1 * 2;

  equalArray(_slice.call(uvArray, 0, 8),
    [c0, c0, c1, c0, c1, c1, c0, c1],
    'first quad uvs');
  equalArray(_slice.call(uvArray, 8, 16),
    [c1, c0, c2, c0, c2, c1, c1, c1],
    'second quad uvs');
  equalArray(_slice.call(uvArray, 16, 24),
    [c0, c1, c1, c1, c1, c2, c0, c2],
    'third quad uvs');
  equalArray(_slice.call(uvArray, 24, 32),
    [c1, c1, c2, c1, c2, c2, c1, c2],
    'fourth quad uvs');
  equalArray(_slice.call(uvArray, 32, 40),
    [c0, c0, c1, c0, c1, c1, c0, c1],
    'fifth quad uvs');
});


})();

(function() {

function setFavicon(uri) {
  var link = document.getElementById('favicon');
  if (link) {
    document.head.removeChild(link);
  } else {
    link = document.createElement('link');
  }

  link.setAttribute('id', 'favicon');
  link.setAttribute('type', 'image/x-icon');
  link.setAttribute('rel', 'icon');
  link.setAttribute('href', uri);
  document.head.appendChild(link);
}

QUnit.done(function (results) {
  if (results.failed) {
    setFavicon('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAANElEQVQ4T2NkoBAwUqifgboG/GdgACLCAGgr3GIUF4waAA7B0UCkNAwIp0FMFdTNC+S4AAAt7hQR+uwkyQAAAABJRU5ErkJggg==');
    document.title = results.failed + ' of ' + results.total + ' failed.';
  } else {
    setFavicon('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAM0lEQVQ4T2NkoBAwUqifgcoG/Gf4T5SLGBEWo7pg1AAGYBCOBiLFYUBUMkRVROW8QIYLACPuFBFvqDn4AAAAAElFTkSuQmCC');
    document.title = 'All ' + results.total + ' passed.';
  }
});


})();