(function() {

window.App = Object.create({
  ctor : Particulate.ctor,
  log : (window.console && window.console.log.bind &&
    window.console.log.bind(window.console)) || function () {},

  shaders : window.App && window.App.shaders,

  _register : {},
  register : function (name, fn) {
    this._register[name] = fn;
  },

  run : function (name) {
    if (!this._register[name]) { return; }
    this._register[name].call(this);
  }
});


})();

(function() {

var Dispatcher = App.Dispatcher = {};

Dispatcher.extend = function (proto) {
  proto.addListener = addListener;
  proto.triggerListeners = triggerListeners;
};

function addListener(type, context, fn) {
  var listeners = this._listeners;
  if (!listeners) { listeners = this._listeners = {}; }
  if (!listeners[type]) { listeners[type] = []; }

  listeners[type].push({
    context : context,
    fn : fn
  });
}

 function triggerListeners(type, event) {
  var listeners = this._listeners && this._listeners[type];
  if (!listeners) { return; }
  var listener, context, fn;

  for (var i = 0, il = listeners.length; i < il; i ++) {
    listener = listeners[i];
    context = listener.context;
    fn = listener.fn;

    if (typeof context === 'function') {
      fn = context;
      context = null;
    } else if (typeof fn === 'string') {
      fn = context[fn];
    }

    fn.call(context, event);
  }
}


})();

(function() {

var Faces = App.Faces = {};

Faces.quad = function (a, b, c, d, buffer) {
  buffer.push(
    a, b, c,
    c, d, a);

  return buffer;
};

Faces.quadDoubleSide = function (a, b, c, d, buffer) {
  buffer.push(
    a, b, c,
    c, d, a,
    d, c, b,
    b, a, d);

  return buffer;
};

Faces.radial = function (indexCenter, index, howMany, buffer) {
  var b, c;

  for (var i = 0, il = howMany - 1; i < il; i ++) {
    b = index + i + 1;
    c = index + i;

    buffer.push(indexCenter, b, c);
  }

  b = index;
  c = index + howMany - 1;

  buffer.push(indexCenter, b, c);

  return buffer;
};

Faces.rings = function (index0, index1, howMany, buffer) {
  var a, b, c, d;

  for (var i = 0, il = howMany - 1; i < il; i ++) {
    a = index0 + i;
    b = index0 + i + 1;
    c = index1 + i + 1;
    d = index1 + i;

    buffer.push(
      a, b, c,
      c, d, a);
  }

  a = index0 + howMany - 1;
  b = index0;
  c = index1;
  d = index1 + howMany - 1;

  buffer.push(
    a, b, c,
    c, d, a);

  return buffer;
};


})();

(function() {

/*global Promise*/
var Features = App.Features = {};

Features.detectWebAudio = function () {
  return new Promise(function (resolve, reject) {
    var prefixed = 'webkitAudioContext' in window;
    var unprefixed = 'AudioContext' in window;

    if (prefixed || unprefixed) {
      resolve();
    } else {
      reject();
    }
  });
};

Features.detectAudioCodecs = function (codecs) {
  return new Promise(function (resolve, reject) {
    var audio = new Audio();
    var canPlay = codecs.find(function (codec) {
      return !!audio.canPlayType(codec).replace(/^no$/, '');
    });

    if (canPlay) {
      resolve();
    } else {
      reject();
    }
  });
};

Features.detectAudioAutoplay = function () {
  return new Promise(function (resolve, reject) {
    var mp3 = 'data:audio/mpeg;base64,/+MYxAAAAANIAUAAAASEEB/jwOFM/0MM/90b/+RhST//w4NFwOjf///PZu////9lns5GFDv//l9GlUIEEIAAAgIg8Ir/JGq3/+MYxDsLIj5QMYcoAP0dv9HIjUcH//yYSg+CIbkGP//8w0bLVjUP///3Z0x5QCAv/yLjwtGKTEFNRTMuOTeqqqqqqqqqqqqq/+MYxEkNmdJkUYc4AKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
    var ogg = 'data:audio/ogg;base64,T2dnUwACAAAAAAAAAADqnjMlAAAAAOyyzPIBHgF2b3JiaXMAAAAAAUAfAABAHwAAQB8AAEAfAACZAU9nZ1MAAAAAAAAAAAAA6p4zJQEAAAANJGeqCj3//////////5ADdm9yYmlzLQAAAFhpcGguT3JnIGxpYlZvcmJpcyBJIDIwMTAxMTAxIChTY2hhdWZlbnVnZ2V0KQAAAAABBXZvcmJpcw9CQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBACAAAAYRqF1TCqDEEPKQ4QUY9AzoxBDDEzGHGNONKQMMogzxZAyiFssLqgQBKEhKwKAKAAAwBjEGGIMOeekZFIi55iUTkoDnaPUUcoolRRLjBmlEluJMYLOUeooZZRCjKXFjFKJscRUAABAgAMAQICFUGjIigAgCgCAMAYphZRCjCnmFHOIMeUcgwwxxiBkzinoGJNOSuWck85JiRhjzjEHlXNOSuekctBJyaQTAAAQ4AAAEGAhFBqyIgCIEwAwSJKmWZomipamiaJniqrqiaKqWp5nmp5pqqpnmqpqqqrrmqrqypbnmaZnmqrqmaaqiqbquqaquq6nqrZsuqoum65q267s+rZru77uqapsm6or66bqyrrqyrbuurbtS56nqqKquq5nqq6ruq5uq65r25pqyq6purJtuq4tu7Js664s67pmqq5suqotm64s667s2rYqy7ovuq5uq7Ks+6os+75s67ru2rrwi65r66os674qy74x27bwy7ouHJMnqqqnqq7rmarrqq5r26rr2rqmmq5suq4tm6or26os67Yry7aumaosm64r26bryrIqy77vyrJui67r66Ys67oqy8Lu6roxzLat+6Lr6roqy7qvyrKuu7ru+7JuC7umqrpuyrKvm7Ks+7auC8us27oxuq7vq7It/KosC7+u+8Iy6z5jdF1fV21ZGFbZ9n3d95Vj1nVhWW1b+V1bZ7y+bgy7bvzKrQvLstq2scy6rSyvrxvDLux8W/iVmqratum6um7Ksq/Lui60dd1XRtf1fdW2fV+VZd+3hV9pG8OwjK6r+6os68Jry8ov67qw7MIvLKttK7+r68ow27qw3L6wLL/uC8uq277v6rrStXVluX2fsSu38QsAABhwAAAIMKEMFBqyIgCIEwBAEHIOKQahYgpCCKGkEEIqFWNSMuakZM5JKaWUFEpJrWJMSuaclMwxKaGUlkopqYRSWiqlxBRKaS2l1mJKqcVQSmulpNZKSa2llGJMrcUYMSYlc05K5pyUklJrJZXWMucoZQ5K6iCklEoqraTUYuacpA46Kx2E1EoqMZWUYgupxFZKaq2kFGMrMdXUWo4hpRhLSrGVlFptMdXWWqs1YkxK5pyUzDkqJaXWSiqtZc5J6iC01DkoqaTUYiopxco5SR2ElDLIqJSUWiupxBJSia20FGMpqcXUYq4pxRZDSS2WlFosqcTWYoy1tVRTJ6XFklKMJZUYW6y5ttZqDKXEVkqLsaSUW2sx1xZjjqGkFksrsZWUWmy15dhayzW1VGNKrdYWY40x5ZRrrT2n1mJNMdXaWqy51ZZbzLXnTkprpZQWS0oxttZijTHmHEppraQUWykpxtZara3FXEMpsZXSWiypxNhirLXFVmNqrcYWW62ltVprrb3GVlsurdXcYqw9tZRrrLXmWFNtBQAADDgAAASYUAYKDVkJAEQBAADGMMYYhEYpx5yT0ijlnHNSKucghJBS5hyEEFLKnINQSkuZcxBKSSmUklJqrYVSUmqttQIAAAocAAACbNCUWByg0JCVAEAqAIDBcTRNFFXVdX1fsSxRVFXXlW3jVyxNFFVVdm1b+DVRVFXXtW3bFn5NFFVVdmXZtoWiqrqybduybgvDqKqua9uybeuorqvbuq3bui9UXVmWbVu3dR3XtnXd9nVd+Bmzbeu2buu+8CMMR9/4IeTj+3RCCAAAT3AAACqwYXWEk6KxwEJDVgIAGQAAgDFKGYUYM0gxphhjTDHGmAAAgAEHAIAAE8pAoSErAoAoAADAOeecc84555xzzjnnnHPOOeecc44xxhhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMMcYYY0wAwE6EA8BOhIVQaMhKACAcAABACCEpKaWUUkoRU85BSSmllFKqFIOMSkoppZRSpBR1lFJKKaWUIqWgpJJSSimllElJKaWUUkoppYw6SimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaVUSimllFJKKaWUUkoppRQAYPLgAACVYOMMK0lnhaPBhYasBAByAwAAhRiDEEJpraRUUkolVc5BKCWUlEpKKZWUUqqYgxBKKqmlklJKKbXSQSihlFBKKSWUUkooJYQQSgmhlFRCK6mEUkoHoYQSQimhhFRKKSWUzkEoIYUOQkmllNRCSB10VFIpIZVSSiklpZQ6CKGUklJLLZVSWkqpdBJSKamV1FJqqbWSUgmhpFZKSSWl0lpJJbUSSkklpZRSSymFVFJJJYSSUioltZZaSqm11lJIqZWUUkqppdRSSiWlkEpKqZSSUmollZRSaiGVlEpJKaTUSimlpFRCSamlUlpKLbWUSkmptFRSSaWUlEpJKaVSSksppRJKSqmllFpJKYWSUkoplZJSSyW1VEoKJaWUUkmptJRSSymVklIBAEAHDgAAAUZUWoidZlx5BI4oZJiAAgAAQABAgAkgMEBQMApBgDACAQAAAADAAAAfAABHARAR0ZzBAUKCwgJDg8MDAAAAAAAAAAAAAACAT2dnUwAEAAAAAAAAAADqnjMlAgAAADzQPmcBAQA=';
    var audio = new Audio();
    var src = audio.canPlayType('audio/ogg') ? ogg : mp3;

    audio.autoplay = true;
    audio.volume = 0;

    var _reject = setTimeout(reject, 20);
    audio.addEventListener('play', function() {
      clearTimeout(_reject);
      resolve();
    }, false);

    audio.src = src;
    audio.play();
  });
};

Features.detectInputType = function (type) {
  return new Promise(function (resolve, reject) {
    var el = document.createElement('input');
    el.setAttribute('type', type);

    if (el.type === type) {
      resolve();
    } else {
      reject();
    }
  });
};


})();

(function() {

var Format = App.Format = {};

Format.number = function (val) {
  var chars = ('' + val).split('');
  var str = '';
  var index;

  for (var i = 0, il = chars.length; i < il; i ++) {
    index = il - i - 1;
    str += chars[i];
    if (index % 3 === 0 && index > 0) {
      str += ',';
    }
  }

  return str;
};

Format.absoluteLength = function (val, length) {
  val = '' + val;
  while (val.length < length) {
    val = '0' + val;
  }
  return val;
};


})();

(function() {

var Geometry = App.Geometry = {};

Geometry.point = function (x, y, z, buffer) {
  buffer.push(x, y, z);
  return buffer;
};

Geometry.circle = function (segments, radius, y, buffer) {
  var step = Math.PI * 2 / segments;
  var angle = 0;
  var x, z;

  for (var i = 0; i < segments; i ++) {
    x = Math.cos(angle) * radius;
    z = Math.sin(angle) * radius;

    buffer.push(x, y, z);
    angle += step;
  }
  return buffer;
};


})();

(function() {

App.KeyDelegator = KeyDelegator;
function KeyDelegator() {
  this._bindings = {};
  document.addEventListener('keyup', this.onDocumentKey.bind(this), false);
}

KeyDelegator.create = App.ctor(KeyDelegator);

KeyDelegator.prototype.addBinding = function (key, context, fn) {
  this._bindings[key] = {
    context : context,
    fn : fn
  };
};

KeyDelegator.prototype.onDocumentKey = function (event) {
  var binding = this._bindings[event.which];
  if (!binding) { return; }

  binding.context[binding.fn].call(binding.context, event);
};


})();

(function() {

var Links = App.Links = {};

Links.line = function (index, howMany, buffer) {
  var a, b;

  for (var i = 0; i < howMany - 1; i ++) {
    a = index + i;
    b = index + i + 1;

    buffer.push(a, b);
  }

  return buffer;
};

Links.loop = function (index, howMany, buffer) {
  var a, b;

  for (var i = 0; i < howMany - 1; i ++) {
    a = index + i;
    b = index + i + 1;

    buffer.push(a, b);
  }

  a = index;
  b = index + howMany - 1;

  buffer.push(a, b);

  return buffer;
};

Links.rings = function (index0, index1, howMany, buffer) {
  var a, b;

  for (var i = 0; i < howMany; i ++) {
    a = index0 + i;
    b = index1 + i;

    buffer.push(a, b);
  }

  return buffer;
};

Links.radial = function (indexCenter, index, howMany, buffer) {
  var b;

  for (var i = 0; i < howMany; i ++) {
    b = index + i;

    buffer.push(indexCenter, b);
  }

  return buffer;
};


})();

(function() {

/*global requestAnimationFrame*/
App.Looper = Looper;
function Looper(context, update, render, delta) {
  var _this = this;
  var _update = context[update];
  var _render = context[render];

  var stepTime = 0;
  var targetDelta = delta || (1 / 30 * 1000);
  var maxDelta = targetDelta;

  var isLooping = false;
  var lastTime;

  function animateStep(delta) {
    stepTime += delta;
    var steps = Math.floor(stepTime / targetDelta);

    if (steps > 0) {
      stepTime -= steps * targetDelta;
      _this.didUpdate = true;
    }

    while (steps > 0) {
      _update.call(context, targetDelta);
      steps --;
    }

    var stepProgress = stepTime / targetDelta;
    _render.call(context, targetDelta, stepProgress);
  }

  function animate() {
    if (!isLooping) { return; }
    var time = Date.now();
    var delta = Math.min(maxDelta, time - lastTime);

    _this.didUpdate = false;
    animateStep(delta);
    requestAnimationFrame(animate);
    lastTime = time;
  }

  this.stop = function () {
    isLooping = false;
  };

  this.start = function () {
    lastTime = Date.now();
    isLooping = true;
    animate();
  };

  this.toggle = function () {
    if (isLooping) { this.stop(); }
    else { this.start(); }
  };
}

Looper.create = App.ctor(Looper);


})();

(function() {

var Tweens = App.Tweens = {};

Tweens.mapRange = function (a0, a1, b0, b1) {
  if (arguments.length === 2) {
    b1 = a1[1];
    b0 = a1[0];
    a1 = a0[1];
    a0 = a0[0];
  }

  var rangeAInv = 1 / (a1 - a0);
  var rangeB = b1 - b0;

  return function (x) {
    var t = (x - a0) * rangeAInv;
    return b0 + t * rangeB;
  };
};

// Tween to target by difference factor
Tweens.factorTween = function (context, defaultFactor) {
  return function (name, target, instanceFactor) {
    var state = context[name];
    if (state == null) { state = context[name] = target; }
    var factor = instanceFactor || defaultFactor;

    return context[name] += (target - state) * factor;
  };
};

// Tween to target by fixed step
Tweens.stepTween = function (context, defaultStep) {
  return function (name, target, instanceStep) {
    var state = context[name];
    if (state == null) { state = context[name] = target; }
    if (state === target) { return state; }
    var step = instanceStep || defaultStep;
    var dir = state < target ? 1 : -1;

    if ((target - state) * dir < step) {
      context[name] = target;
      return state;
    }

    return context[name] += step * dir;
  };
};


})();

(function() {

App.ColorComponent = ColorComponent;
function ColorComponent(opts) {
  opts = opts || {};

  var element = this.element = document.createElement('div');
  var input = this._input = document.createElement('input');
  var preview = this._previewEl = document.createElement('div');
  var label = this._labelEl = document.createElement('div');

  this.color = opts.color || new THREE.Color();
  this.setLabel(opts.label || '');
  this.setValue();
  this.syncState();

  element.className = this._className = 'color';
  preview.className = 'preview';
  label.className = 'label';

  input.setAttribute('type', 'color');
  element.appendChild(preview);
  element.appendChild(label);
  element.appendChild(input);

  input.addEventListener('change', this.syncState.bind(this), false);
  input.addEventListener('focus', this.focus.bind(this), false);
  input.addEventListener('blur', this.blur.bind(this), false);
}

ColorComponent.create = App.ctor(ColorComponent);
App.Dispatcher.extend(ColorComponent.prototype);

ColorComponent.prototype.setLabel = function (label) {
  this._labelEl.textContent = label;
};

ColorComponent.prototype.setValue = function (value) {
  value = value || ('#' + this.color.getHexString());
  this._input.setAttribute('value', value);
};

// FIXME: Losing focus when switching to color picker window
ColorComponent.prototype.focus = function (event) {
  this.element.className = this._className + ' focus';
};

ColorComponent.prototype.blur = function (event) {
  this.element.className = this._className;
};

ColorComponent.prototype.syncState = function (event) {
  var value = this._input.value;
  this._previewEl.style.background = value;
  this.color.setStyle(value);
  this.triggerListeners('change', value);
};


})();

(function() {

App.GraphComponent = GraphComponent;
function GraphComponent(opts) {
  opts = opts || {};

  this.max = 0;
  this.current = 0;

  this.updateFactor = opts.updateFactor || 0.1;
  this.drawOffset = opts.drawOffset || 2;
  this.pxRatio = opts.pixelRatio || window.devicePixelRatio;

  this.createBuffers();
  this.setSize(opts.width || 380, opts.height || 24);
  this.createLineBuffer();
  this.createElement();
  this.setLabel(opts.label || '');
}

GraphComponent.create = App.ctor(GraphComponent);

GraphComponent.prototype.setSize = function (width, height) {
  var pxRatio = this.pxRatio;

  this.width = width;
  this.height = height;
  this.fullWidth = width * pxRatio;
  this.fullHeight = height * pxRatio;

  this.canvas.width = this.buffer.width = this.fullWidth;
  this.canvas.height = this.buffer.height = this.fullHeight;

  this.canvas.style.width = width + 'px';
  this.canvas.style.height = height + 'px';
};

GraphComponent.prototype.appendTo = function (parent) {
  parent.appendChild(this.element);
};

GraphComponent.prototype.createElement = function () {
  var el = this.element = document.createElement('div');
  var labelContainer = document.createElement('div');
  var label = this._labelEl = document.createTextNode('');
  var value = this._valueEl = document.createTextNode('');
  var canvas = this.canvas;

  el.className = 'graph';
  labelContainer.className = 'label';

  el.appendChild(canvas);
  el.appendChild(labelContainer);

  labelContainer.appendChild(label);
  labelContainer.appendChild(value);
};

GraphComponent.prototype.setLabel = function (label) {
  this._labelEl.textContent = label + ' ';
};

GraphComponent.prototype.createBuffers = function () {
  this.canvas = document.createElement('canvas');
  this.ctx = this.canvas.getContext('2d');
  this.buffer = document.createElement('canvas');
  this.btx = this.buffer.getContext('2d');
};

GraphComponent.prototype.grayscale = function (v, a) {
  return 'rgba(' + [v, v, v, a].join(',') + ')';
};

GraphComponent.prototype.createLineBuffer = function () {
  var height = this.fullHeight;
  var pxRatio = this.pxRatio;

  var line = document.createElement('canvas');
  var ltx = line.getContext('2d');

  line.width = pxRatio;
  line.height = height * 2 + 10;

  ltx.fillStyle = this.grayscale(255, 0.7);
  ltx.fillRect(0, height, pxRatio, pxRatio);
  ltx.fillStyle = this.grayscale(255, 0.1);
  ltx.fillRect(0, height + 2 * pxRatio, pxRatio, height + 10);

  this.line = line;
};

GraphComponent.prototype.start = function () {
  this._startTime = Date.now();
};

GraphComponent.prototype.end = function () {
  this._endTime = Date.now();
};

GraphComponent.prototype.reset = function () {
  this._startTime = this._endTime = 0;
};

GraphComponent.prototype._startTime = 0;
GraphComponent.prototype._endTime = 0;
GraphComponent.prototype._textTick = 0;

GraphComponent.prototype.update = function (value, skipLabel) {
  var width = this.fullWidth;
  var height = this.fullHeight;
  var pxRatio = this.pxRatio;
  var drawOffset = this.drawOffset;

  var buffer = this.buffer;
  var canvas = this.canvas;
  var btx = this.btx;
  var ctx = this.ctx;

  var current, max;

  if (value == null) {
    value = this._endTime - this._startTime;
    current = this.current += (value - this.current) * this.updateFactor;
    max = this.max *= 0.99;
  } else {
    current = max = value;
  }

  if (current > max) {
    max = this.max = current;
  }

  btx.clearRect(0, 0, width, height);
  btx.drawImage(canvas, -drawOffset * pxRatio, 0, width, height);

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(buffer, 0, 0, width, height);
  ctx.drawImage(this.line,
    0, current * height / (max || 1), pxRatio, height,
    width - pxRatio, 0, pxRatio, height);

  if (!skipLabel && ++ this._textTick > 6) {
    this._textTick = 0;
    this._valueEl.textContent = current.toFixed(3);
  }

  this._startTime = this._endTime = 0;
};


})();

(function() {

App.ModalComponent = ModalComponent;
function ModalComponent(config) {
  var name = config.name;
  var cover = document.getElementById('cover-' + name);
  var toggle = this.toggle = document.getElementById('toggle-' + name);
  var modal = this.modal = document.getElementById(name);

  this.isActive = false;
  this._toggleClassName = toggle.className;
  this._modalClassName = modal.className;

  toggle.addEventListener('click', this.toggleState.bind(this), false);
  cover.addEventListener('click', this.toggleState.bind(this), false);
}

ModalComponent.create = App.ctor(ModalComponent);

ModalComponent.prototype.toggleState = function (event) {
  if (this.isActive) {
    this.modal.className = this._modalClassName;
    this.toggle.className = this._toggleClassName;
    this.isActive = false;
  } else {
    this.modal.className += ' active';
    this.toggle.className += ' active';
    this.isActive = true;
  }
};


})();

(function() {

App.ToggleComponent = ToggleComponent;
function ToggleComponent(config) {
  var name = config.name;
  var toggle = this.toggle = document.getElementById('toggle-' + name);

  this.setupKey(config.key);
  this.setupMenu(config.menu);

  this.isActive = config.isActive != null ? config.isActive : false;
  this._toggleClassName = toggle.className;
  this.syncState();

  toggle.addEventListener('click', this.toggleState.bind(this), false);
}

ToggleComponent.create = App.ctor(ToggleComponent);
App.Dispatcher.extend(ToggleComponent.prototype);

ToggleComponent.prototype.setupKey = function (key) {
  if (!key) { return; }
  this.keyDelegator.addBinding(key, this, 'toggleState');
};

ToggleComponent.prototype.setupMenu = function (name) {
  if (!name) { return; }

  var menu = this.menu = document.getElementById('menu-' + name);
  var inner = this.menuInner = document.createElement('div');

  inner.className = 'inner';
  menu.appendChild(inner);

  this._menuClassName = menu.className;
  this.toggle.className += ' has-menu';
};

ToggleComponent.prototype.toggleState = function (event) {
  this.isActive = !this.isActive;
  this.syncState();
  this.triggerListeners('toggle', this.isActive);
};

ToggleComponent.prototype.syncState = function () {
  this.updateElClass(this.toggle, this._toggleClassName);
  this.updateElClass(this.menu, this._menuClassName);
  this.updateElHeight(this.menu, this.menuInner);
};

ToggleComponent.prototype.updateElClass = function (element, className) {
  if (!element) { return; }
  if (this.isActive) {
    element.className += ' active';
  } else {
    element.className = className;
  }
};

ToggleComponent.prototype.updateElHeight = function (element, inner) {
  if (!element) { return; }
  if (this.isActive) {
    element.style.height = inner.offsetHeight + 'px';
    this._willBecomeVisible = setTimeout(
      this.becomeVisible.bind(null, element), 200);
  } else {
    element.style.height = '';
  }
};

ToggleComponent.prototype.becomeVisible = function (element) {
  element.className += ' visible';
};

ToggleComponent.prototype.hide = function () {
  this.toggle.className += ' hidden';
  this.menu.className += ' hidden';
};

ToggleComponent.prototype.keyDelegator = App.KeyDelegator.create();


})();

(function() {

App.LocalPlaneConstraint = LocalPlaneConstraint;
function LocalPlaneConstraint(planeA, planeB, planeC, a) {
  Particulate.PlaneConstraint.apply(this, arguments);
  this.distance = 0;
}

LocalPlaneConstraint.create = Particulate.ctor(LocalPlaneConstraint);
LocalPlaneConstraint.prototype = Object.create(Particulate.PlaneConstraint.prototype);
LocalPlaneConstraint.prototype.constructor = LocalPlaneConstraint;

LocalPlaneConstraint.prototype.applyConstraint = function (index, p0, p1) {
  var b0 = this.bufferVec3;
  var ii = this.indices;
  var bi = ii[1], pi = ii[index + 3];

  var bix = bi * 3, biy = bix + 1, biz = bix + 2;
  var pix = pi * 3, piy = pix + 1, piz = pix + 2;

  if (index === 0) {
    this._calculateNormal(index, p0);
  }

  if (!this._hasNormal) { return; }

  // N (plane normal vector)
  var nX = b0[0];
  var nY = b0[1];
  var nZ = b0[2];

  // BP (B -> P)
  var opX = p0[pix] - p0[bix];
  var opY = p0[piy] - p0[biy];
  var opZ = p0[piz] - p0[biz];

  // Project BP onto normal vector N
  var pt = opX * nX + opY * nY + opZ * nZ;
  if (pt > this.distance) { return; }

  p0[pix] -= nX * pt;
  p0[piy] -= nY * pt;
  p0[piz] -= nZ * pt;
};


})();

(function() {

var PMath = Particulate.Math;
App.PointRepulsorForce = PointRepulsorForce;

function PointRepulsorForce(position, opts) {
  opts = opts || {};
  Particulate.Force.apply(this, arguments);

  this.position = this.vector;
  this.intensity = opts.intensity != null ? opts.intensity : 0.05;
  this.setRadius(opts.radius || 0);
}

PointRepulsorForce.create = Particulate.ctor(PointRepulsorForce);
PointRepulsorForce.prototype = Object.create(Particulate.Force.prototype);
PointRepulsorForce.prototype.constructor = PointRepulsorForce;

PointRepulsorForce.prototype.setRadius = function (r) {
  this._radius2 = r * r;
};

PointRepulsorForce.prototype.applyForce = function (ix, f0, p0, p1) {
  var v0 = this.vector;
  var iy = ix + 1;
  var iz = ix + 2;

  var dx = p0[ix] - v0[0];
  var dy = p0[iy] - v0[1];
  var dz = p0[iz] - v0[2];

  var dist = dx * dx + dy * dy + dz * dz;
  var diff = PMath.clamp(0.001, 100,
    dist - this._radius2 * this.intensity);
  var diffInv = 1 / diff;
  var scale = PMath.clamp(0, 10,
    diffInv * diffInv * diffInv);

  f0[ix] += dx * scale;
  f0[iy] += dy * scale;
  f0[iz] += dz * scale;
};


})();

(function() {

function compileShader(templateName) {
  var template = App.shaders[templateName];
  return template({
    chunks : THREE.ShaderChunk
  });
}

App.ShaderMaterial = ShaderMaterial;
function ShaderMaterial(parameters) {
  if (!this.shader) { return; }

  this.uniforms = THREE.UniformsUtils.clone(this.shader.uniforms);
  this.setUniformParameters(parameters);

  THREE.ShaderMaterial.call(this, {
    uniforms : this.uniforms,
    fragmentShader : compileShader(this.shader.fragmentShader),
    vertexShader : compileShader(this.shader.vertexShader)
  });

  this.transparent = parameters.transparent || false;
  this.blending = parameters.blending || THREE.NormalBlending;
  this.side = parameters.side || THREE.FrontSide;
  this.linewidth = parameters.linewidth || 1;
  this.depthTest = parameters.depthTest != null ? parameters.depthTest : true;
  this.depthWrite = parameters.depthWrite != null ? parameters.depthWrite : true;

  this.size = parameters.size || 1;
  this.sizeAttenuation = parameters.sizeAttenuation;

  this.fog = !!parameters.fog;
  this.map = !!parameters.map;
  this.bumpMap = !!parameters.bumpMap;
  this.normalMap = !!parameters.normalMap;
  this.specularMap = !!parameters.specularMap;
}

ShaderMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);

ShaderMaterial.prototype.setUniformParameters = function (parameters) {
  var uniforms = this.uniforms;
  Object.keys(parameters).forEach(function (key) {
    var uniform = uniforms[key];
    if (!uniform) { return; }
    switch (uniform.type) {
    case 'c':
      this[key] = uniforms[key].value = new THREE.Color(parameters[key]);
      break;
    default:
      this[key] = uniforms[key].value = parameters[key];
      break;
    }
  }.bind(this));
};


})();

(function() {

var ShaderMaterial = App.ShaderMaterial;
var uniforms = THREE.UniformsLib;

App.AlphaMaterial = AlphaMaterial;
function AlphaMaterial(parameters) {
  parameters = parameters || {};
  ShaderMaterial.call(this, parameters);
}

AlphaMaterial.prototype = Object.create(ShaderMaterial.prototype);

AlphaMaterial.prototype.shader = {
  vertexShader : 'alpha-vert',
  fragmentShader : 'alpha-frag',

  uniforms : THREE.UniformsUtils.merge([
    uniforms.common
  ])
};


})();

(function() {

var ShaderMaterial = App.ShaderMaterial;
var uniforms = THREE.UniformsLib;

App.BulbMaterial = BulbMaterial;
function BulbMaterial(parameters) {
  parameters = parameters || {};
  parameters.map = true;
  ShaderMaterial.call(this, parameters);
}

BulbMaterial.prototype = Object.create(ShaderMaterial.prototype);

BulbMaterial.prototype.shader = {
  vertexShader : 'normal-vert',
  fragmentShader : 'bulb-frag',

  uniforms : THREE.UniformsUtils.merge([
    uniforms.common,
    {
      diffuseB : { type : 'c', value : null },
      stepProgress : { type : 'f', value : 0 },
      time : { type : 'f', value : 0 }
    }
  ])
};


})();

(function() {

var ShaderMaterial = App.ShaderMaterial;
var uniforms = THREE.UniformsLib;

App.DustMaterial = DustMaterial;
function DustMaterial(parameters) {
  parameters = parameters || {};
  ShaderMaterial.call(this, parameters);
}

DustMaterial.prototype = Object.create(ShaderMaterial.prototype);

DustMaterial.prototype.shader = {
  vertexShader : 'dust-vert',
  fragmentShader : 'dust-frag',

  uniforms : THREE.UniformsUtils.merge([
    uniforms.common,
    uniforms.points,
    {
      time : { type : 'f', value : 0 },
      area : { type : 'f', value : 1 }
    }
  ])
};


})();

(function() {

var ShaderMaterial = App.ShaderMaterial;
var uniforms = THREE.UniformsLib;

App.GelMaterial = GelMaterial;
function GelMaterial(parameters) {
  parameters = parameters || {};
  ShaderMaterial.call(this, parameters);
}

GelMaterial.prototype = Object.create(ShaderMaterial.prototype);

GelMaterial.prototype.shader = {
  vertexShader : 'gel-vert',
  fragmentShader : 'gel-frag',

  uniforms : THREE.UniformsUtils.merge([
    uniforms.common,
    {
      stepProgress : { type : 'f', value : 0 }
    }
  ])
};


})();

(function() {

var ShaderMaterial = App.ShaderMaterial;
var uniforms = THREE.UniformsLib;

App.LerpMaterial = LerpMaterial;
function LerpMaterial(parameters) {
  parameters = parameters || {};
  ShaderMaterial.call(this, parameters);
}

LerpMaterial.prototype = Object.create(ShaderMaterial.prototype);

LerpMaterial.prototype.shader = {
  vertexShader : 'lerp-vert',
  fragmentShader : 'basic-frag',

  uniforms : THREE.UniformsUtils.merge([
    uniforms.common,
    {
      stepProgress : { type : 'f', value : 0 }
    }
  ])
};


})();

(function() {

var ShaderMaterial = App.ShaderMaterial;
var uniforms = THREE.UniformsLib;

App.LerpPointMaterial = LerpPointMaterial;
function LerpPointMaterial(parameters) {
  parameters = parameters || {};
  parameters.sizeAttenuation = true;
  ShaderMaterial.call(this, parameters);
}

LerpPointMaterial.prototype = Object.create(ShaderMaterial.prototype);

LerpPointMaterial.prototype.shader = {
  vertexShader : 'lerp-point-vert',
  fragmentShader : 'basic-point-frag',

  uniforms : THREE.UniformsUtils.merge([
    uniforms.points,
    {
      stepProgress : { type : 'f', value : 0 }
    }
  ])
};


})();

(function() {

var ShaderMaterial = App.ShaderMaterial;
var uniforms = THREE.UniformsLib;

App.TailMaterial = TailMaterial;
function TailMaterial(parameters) {
  parameters = parameters || {};
  parameters.map = true;
  ShaderMaterial.call(this, parameters);
}

TailMaterial.prototype = Object.create(ShaderMaterial.prototype);

TailMaterial.prototype.shader = {
  vertexShader : 'normal-vert',
  fragmentShader : 'tail-frag',

  uniforms : THREE.UniformsUtils.merge([
    uniforms.common,
    {
      diffuseB : { type : 'c', value : null },
      scale : { type : 'f', value : 1 },
      stepProgress : { type : 'f', value : 0 }
    }
  ])
};


})();

(function() {

var ShaderMaterial = App.ShaderMaterial;
var uniforms = THREE.UniformsLib;

App.TentacleMaterial = TentacleMaterial;
function TentacleMaterial(parameters) {
  parameters = parameters || {};
  ShaderMaterial.call(this, parameters);
}

TentacleMaterial.prototype = Object.create(ShaderMaterial.prototype);

TentacleMaterial.prototype.shader = {
  vertexShader : 'tentacle-vert',
  fragmentShader : 'tentacle-frag',

  uniforms : THREE.UniformsUtils.merge([
    uniforms.common,
    {
      stepProgress : { type : 'f', value : 0 },
      area : { type : 'f', value : 1 }
    }
  ])
};


})();

(function() {

var ShaderMaterial = App.ShaderMaterial;
var uniforms = THREE.UniformsLib;

App.UVMaterial = UVMaterial;
function UVMaterial(parameters) {
  parameters = parameters || {};
  parameters.map = true;
  ShaderMaterial.call(this, parameters);
}

UVMaterial.prototype = Object.create(ShaderMaterial.prototype);

UVMaterial.prototype.shader = {
  vertexShader : 'basic-vert',
  fragmentShader : 'uvs-frag',

  uniforms : THREE.UniformsUtils.merge([
    uniforms.common
  ])
};


})();

(function() {

App.LensDirtTexture = LensDirtTexture;
function LensDirtTexture(size, cells, opts) {
  this.canvas = document.createElement('canvas');
  this.ctx = this.canvas.getContext('2d');
  this.texture = new THREE.Texture(this.canvas);
  this.drawTexture(size, cells, opts);
}

LensDirtTexture.prototype.grayscaleColor = function (start, range, alpha) {
  var c = Math.floor(Math.random() * range) + start;
  return 'rgba(' + [c, c, c, alpha].join(',') + ')';
};

LensDirtTexture.prototype.createGradients = function (ctx, count, radius) {
  var step = Math.PI * 2 / (count + 1);
  var angle = 0;

  var gradients = [];
  var colorA, colorB, alphaA, alphaB;
  var gradient, gx0, gy0, gx1, gy1;

  for (var i = 0; i < count; i ++) {
    gx0 = Math.cos(angle) * radius;
    gy0 = Math.sin(angle) * radius;
    gx1 = Math.cos(angle + Math.PI) * radius;
    gy1 = Math.sin(angle + Math.PI) * radius;

    alphaA = Math.random() * 0.1;
    alphaB = Math.random() * 0.5;
    colorA = this.grayscaleColor(100, 100, alphaA);
    colorB = this.grayscaleColor(100, 100, alphaB);

    gradient = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    gradient.addColorStop(0.2, colorA);
    gradient.addColorStop(0.8, colorB);
    gradients.push(gradient);
    gradient._alpha = alphaB;

    angle += step;
  }

  return gradients;
};

LensDirtTexture.prototype.drawBlob = function (ctx, rx, ry, segments) {
  var step = Math.PI * 2 / segments;
  var angle = 0;
  var sx = Math.random() * 100;
  var sy = Math.random() * 100;
  var x, y, nx, ny;

  ctx.beginPath();

  for (var i = 0, il = segments - 1; i < il; i ++) {
    x = Math.cos(angle) * rx;
    y = Math.sin(angle) * ry;
    nx = (sx + x) * 0.01;
    ny = (sy + y) * 0.01;
    x += noise.simplex2(nx, ny) * 5;
    y += noise.simplex2(nx, ny) * 5;

    angle += step;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.fill();
};

LensDirtTexture.prototype.drawShadow = function (ctx, iterations) {
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowColor = this.grayscaleColor(200, 10, 1);

  for (var i = 0; i < iterations; i ++) {
    ctx.stroke();
  }

  ctx.restore();
};

LensDirtTexture.prototype.drawTexture = function (size, cells, opts) {
  opts = opts || {};

  var canvas = this.canvas;
  var ctx = this.ctx;

  var detail = opts.detail || 10;
  var cellPad = opts.cellPad || 10;

  var cellSize = size / cells;
  var cellSizeHalf = cellSize * 0.5;
  var blobRad = (cellSize - cellPad) * 0.5;
  var blobRadHalf = blobRad * 0.5;

  var gradients = this.createGradients(ctx, cells, cellSize);
  var gradient, gi, rx, ry;

  canvas.width = canvas.height = size;
  ctx.lineWidth = 1;

  for (var i = 0; i < cells; i ++) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(0, cellSize * i + cellSizeHalf);

    for (var j = 0; j < cells; j ++) {
      ctx.translate(j === 0 ? cellSizeHalf : cellSize, 0);
      rx = Math.random() * blobRadHalf + blobRadHalf;
      ry = Math.random() * blobRadHalf + blobRadHalf;
      gi = Math.floor(Math.random() * gradients.length);
      gradient = gradients[gi];

      ctx.fillStyle = gradient;
      ctx.strokeStyle = this.grayscaleColor(
        60, 30, gradient._alpha * 0.5);

      this.drawBlob(ctx, rx, ry, detail);
      this.drawShadow(ctx, 2);
    }
  }

  this.texture.needsUpdate = true;
};


})();

(function() {

App.LensDirtPass = LensDirtPass;
function LensDirtPass(opts) {
  opts = opts || {};

  var quads = opts.quads || 100;
  var textureSize = opts.textureSize || 1024;
  var textureCells = opts.textureCells || 10;
  var textureCellPad = opts.textureCellPad || 20;
  var textureDetail = opts.textureDetail || 50;

  this.renderToScreen = false;
  this.enabled = true;
  this.needsSwap = false;
  this.clear = false;

  this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  this.scene = new THREE.Scene();
  this.scale = 1;

  this.textureMap = new App.LensDirtTexture(textureSize, textureCells, {
    detail : textureDetail,
    cellPad : textureCellPad
  });

  this.geom = this.createQuadGeom(quads, textureCells);
  this.mesh = new THREE.Mesh(this.geom, new App.AlphaMaterial({
    color : 0xffffff,
    opacity : 0.5,
    map : this.textureMap.texture,
    blending : THREE.AdditiveBlending,
    transparent : true
  }));

  this.scene.add(this.mesh);

  this._quadIndex = 0;
  this._quadCount = quads;
}

LensDirtPass.prototype.setSize = function (width, height) {
  var camera = this.camera;
  var w, h, s;

  if (width > height) {
    w = 1;
    h = s = height / width;
  } else {
    w = s = width / height;
    h = 1;
  }

  camera.left = -w;
  camera.right = w;
  camera.top = h;
  camera.bottom = -h;
  this.scale = s;

  camera.updateProjectionMatrix();
};

// ..................................................
// Quad geometry
//

LensDirtPass.prototype._quadGeomPosition = function (count) {
  var verts = new Float32Array(count * 4 * 3);
  var positionAttr = new THREE.BufferAttribute(verts, 3);

  return positionAttr;
};

LensDirtPass.prototype._quadGeomIndex = function (count) {
  var indices = new Uint16Array(count * 6);
  var indexAttr = new THREE.BufferAttribute(indices, 1);
  var qi = 0, qj = 0;
  var a, b, c, d;

  for (var i = 0; i < count; i ++) {
    a = qi;
    b = qi + 1;
    c = qi + 2;
    d = qi + 3;

    indices[qj]     = a;
    indices[qj + 1] = b;
    indices[qj + 2] = c;
    indices[qj + 3] = c;
    indices[qj + 4] = d;
    indices[qj + 5] = a;

    qi += 4;
    qj += 6;
  }

  return indexAttr;
};

LensDirtPass.prototype._quadGeomUv = function (count, cells) {
  var uvs = new Float32Array(count * 4 * 2);
  var uvAttr = new THREE.BufferAttribute(uvs, 2);
  var step = 1 / cells;
  var qi = 0, row = 0, col = 0;

  for (var i = 0; i < count; i ++) {
    uvs[qi]     = uvs[qi + 6] = step * col;       // au, du
    uvs[qi + 1] = uvs[qi + 3] = step * row;       // av, bv
    uvs[qi + 2] = uvs[qi + 4] = step * (col + 1); // bu, cu
    uvs[qi + 5] = uvs[qi + 7] = step * (row + 1); // cv, dv

    qi += 8;

    if (++ col === cells) {
      col = 0;
      if (++ row === cells) {
        row = 0;
      }
    }
  }

  return uvAttr;
};

LensDirtPass.prototype._quadGeomAlpha = function (count) {
  var alpha = new Float32Array(count * 4);
  var alphaAttr = new THREE.BufferAttribute(alpha, 1);

  return alphaAttr;
};

LensDirtPass.prototype.createQuadGeom = function (count, cells) {
  var geom = new THREE.BufferGeometry();

  geom.addAttribute('position', this._quadGeomPosition(count));
  geom.addAttribute('uv', this._quadGeomUv(count, cells));
  geom.addAttribute('alpha', this._quadGeomAlpha(count));
  geom.setIndex(this._quadGeomIndex(count));

  return geom;
};

// ..................................................
// Geometry updates
//

LensDirtPass.prototype._quadIndex = 0;

LensDirtPass.prototype.setQuadPosition = (function () {
  var pos = new THREE.Matrix4();
  var rot = new THREE.Matrix4();
  var scale = new THREE.Matrix4();
  var transform = new THREE.Matrix4();

  var a = new THREE.Vector3();
  var b = new THREE.Vector3();
  var c = new THREE.Vector3();
  var d = new THREE.Vector3();

  return function (index, x, y, r, s) {
    var position = this.geom.attributes.position;
    var ai = index * 4, bi = ai + 1, ci = ai + 2, di = ai + 3;

    scale.makeScale(s * this.scale, s * this.scale, 1);
    rot.makeRotationZ(r);
    pos.makeTranslation(x, y, 0);

    transform.identity();
    transform.multiply(pos);
    transform.multiply(rot);
    transform.multiply(scale);

    a.set(-1, -1, 0);
    b.set( 1, -1, 0);
    c.set( 1,  1, 0);
    d.set(-1,  1, 0);

    a.applyMatrix4(transform);
    b.applyMatrix4(transform);
    c.applyMatrix4(transform);
    d.applyMatrix4(transform);

    position.setXY(ai, a.x, a.y);
    position.setXY(bi, b.x, b.y);
    position.setXY(ci, c.x, c.y);
    position.setXY(di, d.x, d.y);

    position.needsUpdate = true;
  };
}());

LensDirtPass.prototype.setQuadAlpha = function (index, alpha) {
  var attr = this.geom.attributes.alpha;
  var array = attr.array;
  var ai = index * 4;

  array[ai]     = alpha;
  array[ai + 1] = alpha;
  array[ai + 2] = alpha;
  array[ai + 3] = alpha;

  attr.needsUpdate = true;
};

LensDirtPass.prototype.setGroup = function (count, x, y, spread) {
  var total = this._quadCount;
  var index = this._quadIndex;
  var qi = index;
  var xi, yi, rot, scale;

  for (var i = 0; i < count; i ++) {
    xi = x + (Math.random() - 0.5) * spread;
    yi = y + (Math.random() - 0.5) * spread;
    rot = Math.random() * Math.PI * 2;
    scale = Math.random() * 0.15;

    this.setQuadPosition(qi, xi, yi, rot, scale);
    this.setQuadAlpha(qi, 1);

    qi = index + i;
    if (qi >= total) {
      index = this._quadIndex = 0;
    }
  }

  this._quadIndex = qi;
};

LensDirtPass.prototype.update = function (delta) {
  var alphaAttr = this.geom.attributes.alpha;
  var alphaArray = alphaAttr.array;

  for (var i = 0, il = alphaArray.length; i < il; i ++) {
    alphaArray[i] *= 0.995;
  }

  alphaAttr.needsUpdate = true;
};

LensDirtPass.prototype.render = function (renderer, writeBuffer, readBuffer, delta) {
  if (this.renderToScreen) {
    renderer.render(this.scene, this.camera);
  } else {
    renderer.render(this.scene, this.camera, readBuffer, this.clear);
  }
};


})();

(function() {

var DEBUG_TEXTURE = false;
var mapLinear = THREE.Math.mapLinear;

App.Dust = Dust;
function Dust(opts) {
  this.pxRatio = opts.pxRatio || 1;
  this.particleSize = 32 * this.pxRatio;
  this.particleCount = 8000;
  this.area = 300;
  this.createParticles();
  this.createMaterials();
  this.createItem();
}

Dust.create = App.ctor(Dust);

Dust.prototype.createParticles = function () {
  var count = this.particleCount;
  var geom = this.geometry = new THREE.BufferGeometry();
  var verts = new Float32Array(count * 3);

  var area = this.area;
  var areaHalf = area * 0.5;
  var ix;

  for (var i = 0, il = verts.length / 3; i < il; i ++) {
    ix = i * 3;
    verts[ix]     = Math.random() * area - areaHalf;
    verts[ix + 1] = Math.random() * area - areaHalf;
    verts[ix + 2] = Math.random() * area - areaHalf;
  }

  geom.addAttribute('position',
    new THREE.BufferAttribute(verts, 3));
};

Dust.prototype.createTexture = function () {
  var canvas = document.createElement('canvas');
  var texture = new THREE.Texture(canvas);
  var ctx = canvas.getContext('2d');

  var size = Math.pow(2, 6);
  var sizeHalf = size * 0.5;
  var rings = 2;
  var t, radius, alpha;

  canvas.width = canvas.height = size;
  ctx.fillStyle = '#fff';

  for (var i = 0; i < rings; i ++) {
    t = i / (rings - 1);
    radius = mapLinear(t * t, 0, 1, 4, sizeHalf);
    alpha = mapLinear(t, 0, 1, 1, 0.05);

    ctx.beginPath();
    ctx.arc(sizeHalf, sizeHalf, radius, 0, Math.PI * 2);
    ctx.globalAlpha = alpha;
    ctx.fill();
  }

  texture.needsUpdate = true;

  if (DEBUG_TEXTURE) {
    document.body.appendChild(canvas);
    canvas.style.position = 'absolute';
  }

  return texture;
};

Dust.prototype.createMaterials = function () {
  var params = {
    psColor : 0xffffff,
    opacity : 0.95,
    size : this.particleSize,
    map : this.createTexture(),
    scale : 150,
    area : this.area,
    blending: THREE.AdditiveBlending,
    transparent : true,
    depthTest : false,
    depthWrite : false
  };

  this.materialFore = new App.DustMaterial(params);

  // params.depthTest = false;
  // params.opacity = 0.25;
  // this.materialFaint = new App.DustMaterial(params);

  // this.timeAttrFaint = this.materialFaint.uniforms.time;
  this.timeAttrFore = this.materialFore.uniforms.time;
};

Dust.prototype.createItem = function () {
  // this.itemFaint = new THREE.PointCloud(this.geometry, this.materialFaint);
  this.itemFore = new THREE.Points(this.geometry, this.materialFore);
};

Dust.prototype.addTo = function (scene) {
  // scene.add(this.itemFaint);
  scene.add(this.itemFore);
};

Dust.prototype.updateGraphics = function (delta) {
  // this.timeAttrFaint.value += delta * 0.005;
  this.timeAttrFore.value += delta * 0.005;
};


})();

(function() {

var PTCL = Particulate;
var GEOM = App.Geometry;
var LINKS = App.Links;
var FACES = App.Faces;
var Tweens = App.Tweens;

var Vec3 = PTCL.Vec3;
var PointConstraint = PTCL.PointConstraint;
var DistanceConstraint = PTCL.DistanceConstraint;
var AxisConstraint = PTCL.AxisConstraint;

var sin = Math.sin;
var cos = Math.cos;
// var tan = Math.tan;
var round = Math.round;
var log = Math.log;
var floor = Math.floor;
var PI = Math.PI;
var PI_HALF = PI * 0.5;

var push = Array.prototype.push;

// ..................................................
// Medusae
// ..................................................

App.Medusae = Medusae;
function Medusae(opts) {
  this.pxRatio = opts.pxRatio || 1;
  this.animTime = 0;

  this.size = 40;
  this.yOffset = 20;

  this.segmentsCount = 4;
  this.totalSegments = this.segmentsCount * 3 * 3;

  this.ribsCount = 20;
  this.ribRadius = 15;

  this.tentacleGroupStart = 6;
  this.tentacleGroupOffset = 4;
  this.tentacleGroupCount = 3;
  this.tentacleSegments = 120;
  this.tentacleSegmentLength = 1.5;
  this.tentacleWeightFactor = 1.25;

  this.tailRibsCount = 15;
  this.tailRibRadiusFactor = 20;
  this.tailLinkOffset = 2;

  this.tailArmSegments = 100;
  this.tailArmSegmentLength = 1;
  this.tailArmWeight = 0.5;

  this.createTempBuffers();
  this.createGeometry();
  this.createSystem();
  this.createSceneItem();
  this.removeTempBuffers();
  this.initTweens();
}

Medusae.create = App.ctor(Medusae);
App.Dispatcher.extend(Medusae.prototype);

Medusae.tempBuffers = [
  'queuedConstraints',
  'verts',
  'links',
  'weights',
  'bulbFaces',
  'tailFaces',
  'mouthFaces',
  'uvs',
  'tentacles',
  'tentLinks',
  'innerLinks',
  'skins'
];

Medusae.prototype.createTempBuffers = function () {
  var names = Medusae.tempBuffers;
  var name;

  for (var i = names.length - 1; i >= 0; i --) {
    name = names[i];
    this[name] = [];
  }
};

Medusae.prototype.removeTempBuffers = function () {
  var names = Medusae.tempBuffers;
  var name;

  for (var i = names.length - 1; i >= 0; i --) {
    name = names[i];
    delete this[name];
  }
};

Medusae.prototype.createGeometry = function () {
  this.createCore();
  this.createBulb();
  this.createTail();
  this.createMouth();
  this.createTentacles();
};

// ..................................................
// Core
//

// TODO: Minimize top spine connection deformation
// Perhaps by constraining top few rib rows to top center point
Medusae.prototype.createCore = function () {
  var verts = this.verts;
  var uvs = this.uvs;
  var segments = this.totalSegments;
  var size = this.size;

  var pinTop = this.pinTop = 0;
  var pinMid = this.pinMid = 1;
  var pinBottom = this.pinBottom = 2;
  this.pinTail = 3;
  this.pinTentacle = 4;

  var indexTop = this.indexTop = 5;
  var indexMid = this.indexMid = 6;
  var indexBottom = this.indexBottom = 7;
  var topStart = this.topStart = 8;

  var rangeTop = [0, size * 0.5];
  var rangeMid = [size * 0.5, size * 0.7];
  var rangeTopBottom = [size, size * 2];
  var rangeBottom = [0, size * 0.5];

  var spineA = DistanceConstraint.create(rangeTop, [pinTop, indexTop]);
  var spineB = DistanceConstraint.create(rangeMid, [indexTop, indexMid]);
  var spineC = DistanceConstraint.create(rangeBottom, [pinBottom, indexBottom]);
  var spineD = DistanceConstraint.create(rangeTopBottom, [indexTop, indexBottom]);
  var axis = AxisConstraint.create(pinTop, pinMid, [indexTop, indexMid, indexBottom]);

  var yOffset = this.yOffset;
  var posTop = this.posTop = yOffset + size;
  var posMid = this.posMid = yOffset;
  var posBottom = this.posBottom = yOffset - size;
  var posTail = this.posTail = yOffset - this.tailArmSegments * this.tailArmSegmentLength;
  var posTentacle = this.posTentacle = yOffset - this.tentacleSegments * this.tentacleSegmentLength * 1.5;

  var offsets = [
    posTop, posMid, posBottom, posTail, posTentacle, // Pin offsets
    size * 1.5, -size * 0.5, -size // Floating pin offsets
  ];

  for (var i = 0, il = offsets.length; i < il; i ++) {
    GEOM.point(0, offsets[i], 0, verts);
    uvs.push(0, 0);
  }

  this.queueConstraints(spineA, spineB, spineC, spineD, axis);
  FACES.radial(indexTop, topStart, segments, this.bulbFaces);
};

// ..................................................
// Bulb
//

Medusae.prototype.createBulb = function () {
  var ribsCount = this.ribsCount;

  this.ribs = [];

  for (var i = 0, il = ribsCount; i < il; i ++) {
    this.createRib(i, ribsCount);
    if (i > 0) {
      this.createSkin(i - 1, i);
    }
  }
};

function ribRadius(t) {
  return sin(PI - PI * 0.55 * t * 1.8) + log(t * 100 + 2) / 3;
}

function innerRibIndices(offset, start, segments, buffer) {
  var step = floor(segments / 3);
  var a, b;
  for (var i = 0; i < 3; i ++) {
    a = offset + step * i;
    b = offset + step * (i + 1);

    buffer.push(
      start + a % segments,
      start + b % segments);
  }
  return buffer;
}

function ribUvs(sv, howMany, buffer) {
  var st, su;
  for (var i = 1, il = howMany; i < il; i ++) {
    st = i / howMany;
    su = (st <= 0.5 ? st : 1 - st) * 2;
    buffer.push(su, sv);
  }
  buffer.push(0, sv);
  return buffer;
}

Medusae.prototype.createInnerRib = function (start, length) {
  var segmentGroups = this.segmentsCount;
  var segments = this.totalSegments;
  var indices = [];

  for (var i = 0, il = segmentGroups; i < il; i ++) {
    innerRibIndices(i * 3, start, segments, indices);
  }

  return DistanceConstraint.create([length * 0.8, length], indices);
};

Medusae.prototype.createRib = function (index, total) {
  var segments = this.totalSegments;
  var verts = this.verts;
  var uvs = this.uvs;
  var size = this.size;
  var yParam = index / total;
  var yPos = size + this.yOffset - yParam * size;

  var start = index * segments + this.topStart;
  var radiusT = ribRadius(yParam);
  var radius = radiusT * this.ribRadius;

  GEOM.circle(segments, radius, yPos, verts);
  ribUvs(yParam, segments, uvs);

  // Outer rib structure
  var ribIndices = LINKS.loop(start, segments, []);
  var outerLen = 2 * PI * radius / segments;
  var outerRib = DistanceConstraint.create([outerLen * 0.9, outerLen], ribIndices);

  // Inner rib sub-structure
  var innerLen = 2 * PI * radius / 3;
  var innerRib = this.createInnerRib(start, innerLen);

  // Attach bulb to spine
  var isTop = index === 0;
  var isBottom = index === total - 1;
  var spine, spineCenter, radiusSpine;
  if (isTop || isBottom) {
    spineCenter = index === 0 ? this.indexTop : this.indexBottom;
    radiusSpine = index === 0 ? radius * 1.25 : radius;
    spine = DistanceConstraint.create([radius * 0.5, radiusSpine],
      LINKS.radial(spineCenter, start, segments, []));

    this.queueConstraints(spine);
    if (isTop) {
      this.addLinks(spine.indices);
    } else {
      this.addLinks(spine.indices, this.innerLinks);
    }
  }

  this.addLinks(outerRib.indices, this.innerLinks);
  this.addLinks(innerRib.indices, this.innerLinks);
  this.queueConstraints(outerRib, innerRib);

  this.ribs.push({
    start : start,
    radius : radius,
    radiusSpine : radiusSpine,
    yParam : yParam,
    yPos : yPos,
    outer : outerRib,
    inner : innerRib,
    spine : spine,
  });
};

Medusae.prototype.createSkin = function (r0, r1) {
  var segments = this.totalSegments;
  var rib0 = this.ribs[r0];
  var rib1 = this.ribs[r1];

  var dist = Vec3.distance(this.verts, rib0.start, rib1.start);
  var skin = DistanceConstraint.create([dist * 0.5, dist],
    LINKS.rings(rib0.start, rib1.start, segments, []));

  // FIXME
  // var distCross = Vec3.distance(this.verts, rib0.start, rib1.start + 1);
  // var skinCross0 = DistanceConstraint.create([distCross * 0.5, distCross],
  //   LINKS.rings(rib0.start, rib1.start + 1, segments - 1, [rib0.start + segments - 1, rib1.start]));
  // var skinCross1 = DistanceConstraint.create([distCross * 0.5, distCross],
  //   LINKS.rings(rib0.start + 1, rib1.start, segments - 1, [rib0.start, rib1.start + segments - 1]));

  this.queueConstraints(skin);
  // this.queuedConstraints(skinCross0, skinCross1);

  this.addLinks(skin.indices);
  // this.addLinks(skinCross0.indices, this.innerLinks);
  // this.addLinks(skinCross1.indices, this.innerLinks);

  FACES.rings(rib0.start, rib1.start, segments, this.bulbFaces);

  this.skins.push({
    a : r0,
    b : r1
  });
};

Medusae.prototype.updateRibs = function (ribs, phase) {
  var radiusOffset = 15;

  var segments = this.totalSegments;
  var rib, radius, radiusOuter, radiusSpine, outerLen, innerLen;

  for (var i = 0, il = ribs.length; i < il; i ++) {
    rib = ribs[i];
    radius = rib.radius + rib.yParam * phase * radiusOffset;
    radiusOuter = (rib.radiusOuter || rib.radius) + rib.yParam * phase * radiusOffset;
    radiusSpine = (rib.radiusSpine || rib.radius) + rib.yParam * phase * radiusOffset;

    if (rib.outer) {
      outerLen = 2 * PI * radiusOuter / segments;
      rib.outer.setDistance(outerLen * 0.9, outerLen);
    }

    if (rib.inner) {
      innerLen = 2 * PI * radius / 3;
      rib.inner.setDistance(innerLen * 0.8, innerLen);
    }

    if (rib.spine) {
      rib.spine.setDistance(radius * 0.8, radiusSpine);
    }
  }
};

Medusae.prototype.ribAt = function (index) {
  var ribs = this.ribs;
  var tailRibs = this.tailRibs;

  return tailRibs[tailRibs.length - index - 1] ||
    ribs[ribs.length - index + tailRibs.length - 1];
};

// ..................................................
// Tentacles
//

Medusae.prototype.createTentacles = function () {
  var tentacleGroupCount = this.tentacleGroupCount;

  for (var i = 0, il = tentacleGroupCount; i < il; i ++) {
    this.createTentacleGroup(i, tentacleGroupCount);
  }
};

Medusae.prototype.createTentacleGroup = function (index, total) {
  var ribIndex = this.tentacleGroupStart + this.tentacleGroupOffset * index;
  var rib = this.ribAt(ribIndex);
  var ratio = 1 - index / total;
  var segments = this.tentacleSegments;
  var count = segments * ratio * 0.25 + segments * 0.75;

  for (var i = 0, il = count; i < il; i ++) {
    this.createTentacleSegment(index, i, count, rib);

    if (i > 0) {
      this.linkTentacle(index, i - 1, i);
    } else {
      this.attachTentacles(index, rib);
    }
  }

  this.attachTentaclesSpine(index);
};

function tentacleUvs(howMany, buffer) {
  for (var i = 0, il = howMany; i < il; i ++) {
    buffer.push(0, 0);
  }
  return buffer;
}

function tentacleWeight(t) {
  return t * t * t;
}

Medusae.prototype.createTentacleSegment = function (groupIndex, index, total, rib) {
  var segments = this.totalSegments;
  var verts = this.verts;
  var uvs = this.uvs;

  var radius = rib.radius * (0.25 * sin(index * 0.25) + 0.5);
  var yPos = - index * this.tentacleSegmentLength + this.yOffset;
  var start = verts.length / 3;
  var weight = tentacleWeight(index / total) * this.tentacleWeightFactor;

  GEOM.circle(segments, radius, yPos, verts);
  tentacleUvs(segments, uvs);
  this.queueWeights(start, segments, weight);

  if (index === 0) {
    this.tentacles.push([]);
  }

  this.tentacles[groupIndex].push({
    start : start
  });
};

Medusae.prototype.attachTentacles = function (groupIndex, rib) {
  var tent = this.tentacles[groupIndex][0];
  var segments = this.totalSegments;
  var dist = this.tentacleSegmentLength;

  var tentacle = DistanceConstraint.create([dist * 0.5, dist],
    LINKS.rings(rib.start, tent.start, segments, []));

  this.queueConstraints(tentacle);
  this.addLinks(tentacle.indices, this.tentLinks);
};

Medusae.prototype.attachTentaclesSpine = function (groupIndex) {
  var group = this.tentacles[groupIndex];
  var tent = group[group.length - 1];
  var start = tent.start;
  var center = this.pinTentacle;
  var segments = this.totalSegments;
  var dist = this.tentacleSegments * this.tentacleSegmentLength;

  var spine = DistanceConstraint.create([dist * 0.5, dist],
    LINKS.radial(center, start, segments, []));

  this.queueConstraints(spine);
  // this.addLinks(spine.indices, this.innerLinks);
};

Medusae.prototype.linkTentacle = function (groupIndex, i0, i1) {
  var segments = this.totalSegments;
  var tentacleGroup = this.tentacles[groupIndex];
  var tent0 = tentacleGroup[i0];
  var tent1 = tentacleGroup[i1];
  var dist = this.tentacleSegmentLength;

  var tentacle = DistanceConstraint.create([dist * 0.5, dist],
    LINKS.rings(tent0.start, tent1.start, segments, []));

  this.queueConstraints(tentacle);
  this.addLinks(tentacle.indices, this.tentLinks);
  this.addLinks(tentacle.indices, this.innerLinks);
};

// ..................................................
// Tail
//

Medusae.prototype.createTail = function () {
  var ribsCount = this.tailRibsCount;

  this.tailRibs = [];

  for (var i = 0, il = ribsCount; i < il; i ++) {
    this.createTailRib(i, ribsCount);
    this.createTailSkin(i - 1, i);
  }
};

function tailRibRadius(t) {
  return sin(0.25 * t * PI + 0.5 * PI) * (1 - 0.9 * t);
}

// function tailRibUvs(sv, howMany, buffer) {
//   var su;
//   for (var i = 1, il = howMany; i < il; i ++) {
//     su = i % 2;
//     buffer.push(su, sv);
//   }
//   buffer.push(0, sv);
//   return buffer;
// }

Medusae.prototype.createTailRib = function (index, total) {
  var lastRib = this.ribs[this.ribs.length - 1];
  var segments = this.totalSegments;
  var verts = this.verts;
  var uvs = this.uvs;
  var size = this.size;
  var yParam = index / total;
  var yPos = lastRib.yPos - yParam * size * 0.8;

  var start = this.verts.length / 3;
  var radiusT = tailRibRadius(yParam);
  var radius = radiusT * lastRib.radius;
  var radiusOuter = radius + yParam * this.tailRibRadiusFactor;

  GEOM.circle(segments, radius, yPos, verts);
  ribUvs(yParam, segments, uvs);

  // Main folding structure
  var mainIndices = LINKS.loop(start, segments, []);
  var mainLen = 2 * PI * radiusOuter / segments;
  var mainRib = DistanceConstraint.create([mainLen * 0.9, mainLen * 1.5], mainIndices);

  // Inner rib sub-structure
  var innerLen = 2 * PI * radius / 3;
  var innerRib = this.createInnerRib(start, innerLen);

  // Attach to spine
  var spine, spineCenter;
  if (index === total - 1) {
    spineCenter = this.indexMid;
    spine = DistanceConstraint.create([radius * 0.8, radius],
      LINKS.radial(spineCenter, start, segments, []));

    this.queueConstraints(spine);
    this.addLinks(spine.indices, this.innerLinks);
  }

  this.queueConstraints(mainRib, innerRib);
  if (index > this.tailLinkOffset) {
    this.addLinks(mainRib.indices);
  }

  this.tailRibs.push({
    start : start,
    yParam : 1 - yParam,
    radius : radius,
    radiusOuter : radiusOuter,
    inner : innerRib,
    outer : mainRib,
    spine : spine
  });
};

Medusae.prototype.createTailSkin = function (r0, r1) {
  var segments = this.totalSegments;
  var rib0 = r0 < 0 ? this.ribs[this.ribs.length - 1] : this.tailRibs[r0];
  var rib1 = this.tailRibs[r1];

  var dist = Vec3.distance(this.verts, rib0.start, rib1.start);
  var skin = DistanceConstraint.create([dist * 0.5, dist],
    LINKS.rings(rib0.start, rib1.start, segments, []));

  this.queueConstraints(skin);
  this.addLinks(skin.indices, this.innerLinks);

  FACES.rings(rib0.start, rib1.start, segments, this.tailFaces);
};

// ..................................................
// Mouth
//

Medusae.prototype.createMouth = function () {
  // this.createMouthArmGroup(1, 3, s12, s12);
  this.createMouthArmGroup(1.0, 0, 4, 3);
  this.createMouthArmGroup(0.8, 1, 8, 3, 3);
  this.createMouthArmGroup(0.5, 7, 9, 6);
};

Medusae.prototype.createMouthArmGroup = function (vScale, r0, r1, count, offset) {
  for (var i = 0, il = count; i < il; i ++) {
    this.createMouthArm(vScale, r0, r1, i, count, offset);
  }
};

Medusae.prototype.createMouthArm = function (vScale, r0, r1, index, total, offset) {
  var tParam = index / total;
  var verts = this.verts;
  var uvs = this.uvs;
  var startOffset = this.posMid;

  var ribInner = this.ribAt(r0);
  var ribOuter = this.ribAt(r1);
  var ribSegments = this.totalSegments;
  var ribIndex = (round(ribSegments * tParam) + (offset || 0)) % ribSegments;

  var innerPin = ribInner.start + ribIndex;
  var outerPin = ribOuter.start + ribIndex;
  var scale = Vec3.distance(verts, innerPin, outerPin);

  var maxSegments = this.tailArmSegments;
  var segments = round(vScale * maxSegments);
  var innerSize = this.tailArmSegmentLength;
  var outerSize = innerSize * 2.4;
  var bottomPinMax = 20 + (maxSegments - segments) * this.tailArmSegmentLength;

  var innerStart = verts.length / 3;
  var innerEnd = innerStart + segments - 1;
  var outerStart = innerStart + segments;
  // var outerEnd = outerStart + segments - 1;

  var innerIndices = LINKS.line(innerStart, segments, [innerPin, innerStart]);
  var outerIndices = LINKS.line(outerStart, segments, [outerPin, outerStart]);

  var linkConstraints = [];
  var braceIndices = [];
  var linkIndices = [];

  var outerAngle = Math.PI * 2 * tParam;
  var baseX = cos(outerAngle);
  var baseZ = sin(outerAngle);

  var outerX, outerY, outerZ;
  var innerIndex, outerIndex;
  var linkSize, t;

  for (var i = 0; i < segments; i ++) {
    t = i / (segments - 1);

    GEOM.point(0, startOffset - i * innerSize, 0, verts);
    uvs.push(t, 0);
  }

  for (i = 0; i < segments; i ++) {
    t = i / (segments - 1);
    innerIndex = innerStart + i;
    outerIndex = outerStart + i;

    linkSize = scale *
      (sin(PI_HALF + 10 * t) * 0.25 + 0.75) *
      (sin(PI_HALF + 20 * t) * 0.25 + 0.75) *
      (sin(PI_HALF + 26 * t) * 0.15 + 0.85) *
      (sin(PI_HALF + PI * 0.45 * t));

    outerX = baseX * linkSize;
    outerZ = baseZ * linkSize;
    outerY = startOffset - i * innerSize;

    GEOM.point(outerX, outerY, outerZ, verts);
    uvs.push(t, 1);

    linkConstraints.push(DistanceConstraint.create(
      linkSize, innerIndex, outerIndex));

    if (i > 10) {
      braceIndices.push(innerIndex - 10, outerIndex);
    }

    if (i > 1) {
      linkIndices.push(innerIndex - 1, outerIndex);
    }

    if (i > 1) {
      FACES.quadDoubleSide(innerIndex - 1, outerIndex - 1, outerIndex, innerIndex, this.mouthFaces);
    }
  }

  var inner = DistanceConstraint.create([innerSize * 0.25, innerSize], innerIndices);
  var outer = DistanceConstraint.create([outerSize * 0.25, outerSize], outerIndices);
  var brace = DistanceConstraint.create([linkSize * 0.5, Infinity], braceIndices);
  var pin = DistanceConstraint.create([0, bottomPinMax], innerEnd, this.pinTail);

  this.queueConstraints(inner, outer, brace, pin);
  this.queueConstraints(linkConstraints);

  this.queueWeights(innerStart, segments * 2, this.tailArmWeight);

  this.addLinks(innerIndices);
  this.addLinks(outerIndices);

  this.addLinks(linkIndices, this.tentLinks);
  this.addLinks(braceIndices, this.tentLinks);

  this.addLinks(innerIndices, this.innerLinks);
  this.addLinks(outerIndices, this.innerLinks);
  this.addLinks(linkIndices, this.innerLinks);
  this.addLinks(braceIndices, this.innerLinks);
  this.addLinks(pin.indices, this.innerLinks);
};

// ..................................................
// Physics simulation
//

Medusae.prototype.queueConstraints = function (constraints) {
  push.apply(this.queuedConstraints, constraints.length ? constraints : arguments);
};

Medusae.prototype.queueWeights = function (start, howMany, weight) {
  var weights = this.weights;
  var end = start + howMany;
  var i, il;

  if (weights.length - 1 < end) {
    for (i = 0, il = end - weights.length; i < il; i ++) {
      weights.push(1);
    }
  }

  for (i = start, il = end; i < il; i ++) {
    weights[i] = weight;
  }
};

// TODO: Improve constraining system world position
// Switch from absolute pin to axis constraints
// Pin top end of axis, allow bottom to be affected by forces
Medusae.prototype.createSystem = function () {
  var queuedConstraints = this.queuedConstraints;
  var queuedWeights = this.weights;
  var system = this.system = PTCL.ParticleSystem.create(this.verts, 2);

  for (var i = 0, il = queuedConstraints.length; i < il; i ++) {
    system.addConstraint(queuedConstraints[i]);
  }

  for (i = 0, il = queuedWeights.length; i < il; i ++) {
    system.weights[i] = queuedWeights[i];
  }

  system.setWeight(this.pinTop, 0);
  system.setWeight(this.pinMid, 0);
  system.setWeight(this.pinBottom, 0);
  system.setWeight(this.pinTail, 0);

  system.addPinConstraint(PointConstraint.create([0, this.posTop, 0], this.pinTop));
  system.addPinConstraint(PointConstraint.create([0, this.posMid, 0], this.pinMid));
  system.addPinConstraint(PointConstraint.create([0, this.posBottom, 0], this.pinBottom));
  system.addPinConstraint(PointConstraint.create([0, this.posTail, 0], this.pinTail));
  system.addPinConstraint(PointConstraint.create([0, this.posTentacle, 0], this.pinTentacle));
};

Medusae.prototype.relax = function (iterations) {
  var system = this.system;

  for (var i = 0; i < iterations; i ++) {
    system.tick(1);
  }
};

// ..................................................
// Mesh rendering
//

function pushToBuffer(attr) {
  return function (items, buffer) {
    buffer = buffer || this[attr];
    push.apply(buffer, items);
  };
}

Medusae.prototype.addLinks = pushToBuffer('links');
Medusae.prototype.addFaces = pushToBuffer('bulbFaces');

Medusae.prototype.addTimeAttr = function (item) {
  if (!this.timeAttrs) { this.timeAttrs = []; }
  this.timeAttrs.push(item.material.uniforms.time);
};

Medusae.prototype.addStepAttr = function (item) {
  if (!this.stepAttrs) { this.stepAttrs = []; }
  this.stepAttrs.push(item.material.uniforms.stepProgress);
};

Medusae.prototype.createSceneItem = function () {
  this.item = new THREE.Group();
  this.position = new THREE.BufferAttribute(this.system.positions, 3);
  this.positionPrev = new THREE.BufferAttribute(this.system.positionsPrev, 3);
  this.uvs = new THREE.BufferAttribute(new Float32Array(this.uvs), 2);

  this.colors = [];
  this.stepAttrs = [];
  this.createMaterialsDots();
  this.createMaterialsTentacles();
  this.createMaterialsLines();
  this.createMaterialsInnerLines();
  this.createMaterialsTail();
  this.createMaterialsMouth();
  this.createMaterialsBulb();

  this.item.position.setY(20);
};

Medusae.prototype.addColor = function (label, material, path) {
  path = path || 'diffuse';
  var uniform = material.uniforms[path];

  this.colors.push({
    label : label,
    uniform : uniform
  });
};

Medusae.prototype.createTextureDots = function () {
  var canvas = document.createElement('canvas');
  var texture = new THREE.Texture(canvas);
  var ctx = canvas.getContext('2d');

  var size = Math.pow(2, 6);
  var center = size * 0.5;
  var offset = 0;

  canvas.width = canvas.height = size;

  ctx.lineWidth = size * 0.25;
  ctx.strokeStyle = '#fff';

  ctx.beginPath();
  ctx.moveTo(center, offset);
  ctx.lineTo(center, size - offset);
  ctx.moveTo(offset, center);
  ctx.lineTo(size - offset, center);
  ctx.stroke();

  texture.needsUpdate = true;
  return texture;
};

Medusae.prototype.createMaterialsDots = function () {
  var geom = new THREE.BufferGeometry();

  geom.addAttribute('position', this.position);
  geom.addAttribute('positionPrev', this.positionPrev);

  var dots = this.dots = new THREE.Points(geom,
    new App.LerpPointMaterial({
      psColor : 0xffffff,
      size : this.pxRatio * 2000,
      map : this.createTextureDots(),
      transparent : true,
      depthTest : false,
      depthWrite : false
    }));

  this.dotsOpacity = dots.material.uniforms.opacity;
  this.addStepAttr(dots);
  this.item.add(dots);
};

Medusae.prototype.createMaterialsLines = function () {
  var geom = new THREE.BufferGeometry();
  var indices = new THREE.BufferAttribute(new Uint16Array(this.links), 1);

  geom.addAttribute('position', this.position);
  geom.addAttribute('positionPrev', this.positionPrev);
  geom.setIndex(indices);

  var fore = this.linesFore = new THREE.LineSegments(geom,
    new App.TentacleMaterial({
      diffuse : 0xffdde9,
      area : 1200,
      transparent : true,
      blending: THREE.AdditiveBlending,
      depthTest : false,
      depthWrite : false
    }));

  this.linesForeOpacity = fore.material.uniforms.opacity;
  this.addStepAttr(fore);
  this.addColor('Hood Contour', fore.material);
  this.item.add(fore);
};

Medusae.prototype.createMaterialsInnerLines = function () {
  var geom = new THREE.BufferGeometry();
  var indices = new THREE.BufferAttribute(new Uint16Array(this.innerLinks), 1);

  geom.addAttribute('position', this.position);
  geom.addAttribute('positionPrev', this.positionPrev);
  geom.setIndex(indices);

  var inner = this.linesInner = new THREE.LineSegments(geom,
    new App.LerpMaterial({
      diffuse : 0xf99ebd,
      transparent : true,
      blending : THREE.AdditiveBlending,
      depthTest : false,
      depthWrite : false
    }));

  this.linesInnerOpacity = inner.material.uniforms.opacity;
  this.addStepAttr(inner);
  // this.addColor('System Debug', inner.material);
  this.item.add(inner);
};

Medusae.prototype.createMaterialsTentacles = function () {
  var geom = new THREE.BufferGeometry();
  var indices = new THREE.BufferAttribute(new Uint16Array(this.tentLinks), 1);

  geom.addAttribute('position', this.position);
  geom.addAttribute('positionPrev', this.positionPrev);
  geom.setIndex(indices);

  var tentacle = this.tentacleFore = new THREE.LineSegments(geom,
    new App.TentacleMaterial({
      diffuse : 0x997299,
      area : 2000,
      transparent : true,
      // blending : THREE.AdditiveBlending,
      depthTest : false,
      depthWrite : false
    }));

  this.tentacleOpacity = tentacle.material.uniforms.opacity;
  this.addStepAttr(tentacle);
  this.addColor('Tentacles', tentacle.material);
  this.item.add(tentacle);
};

Medusae.prototype.createMaterialsBulb = function () {
  var geom = new THREE.BufferGeometry();
  var indices = new THREE.BufferAttribute(new Uint16Array(this.bulbFaces), 1);

  geom.addAttribute('position', this.position);
  geom.addAttribute('positionPrev', this.positionPrev);
  geom.addAttribute('uv', this.uvs);
  geom.setIndex(indices);

  var bulb = this.bulbMesh = new THREE.Mesh(geom,
    new App.BulbMaterial({
      diffuse : 0xFFA9D2,
      diffuseB : 0x70256C,
      transparent : true
    }));

  var bulbFaint = new THREE.Mesh(geom,
    new App.GelMaterial({
      diffuse : 0x415AB5,
      blending : THREE.AdditiveBlending,
      transparent : true,
      depthTest : false,
      depthWrite : false
    }));

  bulb.scale.multiplyScalar(0.95);
  bulbFaint.scale.multiplyScalar(1.05);

  this.bulbFaintOpacity = bulbFaint.material.uniforms.opacity;
  this.bulbOpacity = bulb.material.uniforms.opacity;

  this.addStepAttr(bulbFaint);
  this.addStepAttr(bulb);
  this.addTimeAttr(bulb);

  this.addColor('Hood Primary', bulb.material);
  this.addColor('Hood Secondary', bulb.material, 'diffuseB');
  this.addColor('Hood Tertiary', bulbFaint.material);

  this.item.add(bulbFaint);
  this.item.add(bulb);
};

Medusae.prototype.createMaterialsTail = function () {
  var geom = new THREE.BufferGeometry();
  var indices = new THREE.BufferAttribute(new Uint16Array(this.tailFaces), 1);

  geom.addAttribute('position', this.position);
  geom.addAttribute('positionPrev', this.positionPrev);
  geom.addAttribute('uv', this.uvs);
  geom.setIndex(indices);

  var tail = this.tailMesh = new THREE.Mesh(geom,
    new App.TailMaterial({
      diffuse : 0xE4BBEE,
      diffuseB : 0x241138,
      scale : 20,
      transparent : true
    }));

  this.tailMesh.scale.multiplyScalar(0.95);
  this.tailOpacity = tail.material.uniforms.opacity;
  this.addStepAttr(tail);
  this.addColor('Belly Primary', tail.material);
  this.addColor('Belly Secondary', tail.material, 'diffuseB');
  this.item.add(tail);
};

Medusae.prototype.createMaterialsMouth = function () {
  var geom = new THREE.BufferGeometry();
  var indices = new THREE.BufferAttribute(new Uint16Array(this.mouthFaces), 1);

  geom.addAttribute('position', this.position);
  geom.addAttribute('positionPrev', this.positionPrev);
  geom.addAttribute('uv', this.uvs);
  geom.setIndex(indices);

  var mouth = this.mouthMesh = new THREE.Mesh(geom,
    new App.TailMaterial({
      diffuse : 0xEFA6F0,
      diffuseB : 0x4A67CE,
      scale : 3,
      // blending : THREE.AdditiveBlending,
      transparent : true
    }));

  this.mouthOpacity = mouth.material.uniforms.opacity;
  this.addStepAttr(mouth);
  this.addColor('Mouth Primary', mouth.material);
  this.addColor('Mouth Secondary', mouth.material, 'diffuseB');
  this.item.add(mouth);
};

Medusae.prototype.addTo = function (scene) {
  scene.add(this.item);
};

Medusae.prototype.toggleDots = function () {
  var visible = this._dotsAreVisible = !this._dotsAreVisible;

  this._meshOpacity = visible ? 0.1 : 1;
  this._dotsOpacity = visible ? 1 : 0;
};

// ..................................................
// Animation
//

Medusae.prototype.initTweens = function () {
  this._tweens = {};
  this.tween = Tweens.factorTween(this._tweens, 0.05);
};

Medusae.prototype.updateTweens = function (delta) {
  var meshOpacity = this.tween('mesh', this._meshOpacity || 1);
  var dotOpacity = this.tween('dots', this._dotsOpacity || 0);
  var dotsAreVisible = dotOpacity > 0.001;

  this.bulbOpacity.value = meshOpacity * 0.75;
  this.bulbFaintOpacity.value = meshOpacity * 0.25;
  this.tentacleOpacity.value = meshOpacity * 0.25;
  this.tailOpacity.value = meshOpacity * 0.75;
  this.mouthOpacity.value = meshOpacity * 0.65;
  this.linesForeOpacity.value = meshOpacity * 0.35;

  this.linesInnerOpacity.value = dotOpacity * 0.15;
  this.dotsOpacity.value = dotOpacity * 0.25;

  this.linesInner.visible = dotsAreVisible;
  this.dots.visible = dotsAreVisible;

  this.needsRender = Math.abs(dotOpacity - this._dotsOpacity) > 0.001;
};

Medusae.prototype.updateLineWidth = function (lineWidth) {
  var thin = round(lineWidth);
  var thick = round(lineWidth * 2);

  this.linesFore.material.linewidth = thin;
  this.linesInner.material.linewidth = thin;
  this.tentacleFore.material.linewidth = thick;
};

Medusae.prototype.PHASE_ZERO = 0.001;
Medusae.prototype.PHASE_OFFSET = 0.485;

Medusae.prototype.timePhase = function (time) {
  return (sin(time * Math.PI - Math.PI * 0.5) + 1) * 0.5;
};

Medusae.prototype.update = function (delta) {
  var time = this.animTime += delta * 0.001;
  var phase = this.timePhase(time);
  var phaseOffset = this.timePhase(time - this.PHASE_OFFSET);

  if (!this._didPhaseTop && 1 - phaseOffset < this.PHASE_ZERO) {
    this.triggerListeners('phase:top');
    this._didPhaseTop = true;
  }

  if (phaseOffset < this.PHASE_ZERO) {
    this.triggerListeners('phase:bottom');
    this._didPhaseTop = false;
  }

  this.updateRibs(this.ribs, phase);
  this.updateRibs(this.tailRibs, phase);
  this.system.tick(delta * 0.001);

  this.position.needsUpdate = true;
  this.positionPrev.needsUpdate = true;
};

Medusae.prototype.updateGraphics = function (delta, stepProgress) {
  var timeAttrs = this.timeAttrs;
  var stepAttrs = this.stepAttrs;
  var time = this.animTime;
  var i;

  for (i = 0; i < timeAttrs.length; i++) {
    timeAttrs[i].value = time;
  }

  for (i = 0; i < stepAttrs.length; i++) {
    stepAttrs[i].value = stepProgress;
  }
};


})();

(function() {

/*global Promise*/
var Tweens = App.Tweens;

App.AudioController = AudioController;
function AudioController(params) {
  params = params || {};

  this.ctx = this.createAudioContext();
  this.baseUrl = params.baseUrl;
  this.volume = 0;
  this.distance = 0;
  this.tween = Tweens.factorTween({ volume : 0 }, 0.1);

  this._bufferCache = {};
  this._activeRequests = {};
  this._activeSounds = [];
}

AudioController.create = App.ctor(AudioController);
App.Dispatcher.extend(AudioController.prototype);
AudioController.prototype.VOLUME_ZERO = 0.001;

AudioController.prototype.AUDIO_TYPES = [
  {
    ext : 'ogg',
    type : 'audio/ogg; codecs=vorbis'
  }, {
    ext : 'mp3',
    type : 'audio/mpeg;'
  }
];

AudioController.prototype.createAudioContext = function () {
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  return new AudioContext();
};

AudioController.prototype.canCopyBuffers = window.AudioBuffer &&
  window.AudioBuffer.prototype.copyFromChannel;

AudioController.prototype.getAudioType = function () {
  if (this._audioType) { return this._audioType; }

  var audio = new Audio();
  var type = this.AUDIO_TYPES.find(function (codec) {
    return !!audio.canPlayType(codec.type).replace(/^no$/, '');
  });

  this._audioType = type;
  return type;
};

AudioController.prototype._findOrLoadBuffer = function (path) {
  var cached = this._bufferCache[path];
  if (!cached) {
    return this._loadBuffer(path);
  }

  return new Promise(function (resolve) {
    resolve(cached);
  });
};

AudioController.prototype._loadBuffer = function (path) {
  var activeRequests = this._activeRequests;
  var request = activeRequests[path];
  if (request) { return request; }

  var cache = this._bufferCache;
  var ctx = this.ctx;
  var audioType = this.getAudioType();
  var fullUrl = this.baseUrl + path + '.' + audioType.ext;
  var xhr = new XMLHttpRequest();

  xhr.open('GET', fullUrl, true);
  xhr.responseType = 'arraybuffer';

  request = activeRequests[path] = new Promise(function (resolve, reject) {
    xhr.addEventListener('load', function() {
      ctx.decodeAudioData(xhr.response, resolve);
    });

    xhr.send();
  }).then(function (buffer) {
    cache[path] = buffer;
    delete activeRequests[path];
    return buffer;
  });

  return request;
};

AudioController.prototype._addActiveSound = function (sound, sounds) {
  sounds = sounds || this._activeSounds;
  sound.sourceNode.onended = this._removeActiveSound.bind(this, sound, sounds);
  return sounds.push(sound);
};

AudioController.prototype._removeActiveSound = function (sound, sounds) {
  sounds = sounds || this._activeSounds;
  var index = sounds.indexOf(sound);

  if (index !== -1) {
    sounds.splice(index, 1);
  }

  return sounds.length;
};

AudioController.prototype.loadBuffer = function (params) {
  var path = params.path;
  return this._findOrLoadBuffer(path);
};

AudioController.prototype.sliceBuffer = function (buffer, begin, end) {
  var ctx = this.ctx;
  var channels = buffer.numberOfChannels;
  var rate = buffer.sampleRate;

  var startOffset = rate * begin;
  var endOffset = rate * end;
  var frameCount = endOffset - startOffset;

  var slicedBuffer = ctx.createBuffer(channels, frameCount * 2, rate);
  var copyBuffer = new Float32Array(frameCount);
  var channel;

  for (channel = 0; channel < channels; channel ++) {
    buffer.copyFromChannel(copyBuffer, channel, startOffset);
    slicedBuffer.copyToChannel(copyBuffer, channel, 0);
    copyBuffer.reverse();
    slicedBuffer.copyToChannel(copyBuffer, channel, frameCount);
  }

  return slicedBuffer;
};

AudioController.prototype.createSound = function (buffer, params) {
  var ctx = this.ctx;
  var sourceNode = ctx.createBufferSource();
  var gainNode = ctx.createGain();
  var filterNode = ctx.createBiquadFilter();

  var globalVolume = this.volume;
  var volume = params.volume != null ? params.volume : 1;
  var offsetTime = params.offsetTime;

  var sound = {
    volume : volume,
    buffer : buffer,
    startTime : ctx.currentTime,
    offsetTime : offsetTime,
    sourceNode : sourceNode,
    gainNode : gainNode,
    filterNode : filterNode
  };

  filterNode.type = 'lowpass';
  filterNode.frequency.value = 320;
  sourceNode.buffer = buffer;
  sourceNode.loop = !!params.loop;
  gainNode.gain.value = globalVolume * volume;

  sourceNode.connect(gainNode);
  gainNode.connect(filterNode);
  filterNode.connect(ctx.destination);

  if (offsetTime != null) {
    sourceNode.start(0, offsetTime);
  }

  return sound;
};

AudioController.prototype.createSoundSlice = function (duration, sound) {
  var ctx = this.ctx;
  var buffer = sound.buffer;
  var soundStart = sound.startTime;
  var soundOffset = sound.offsetTime || 0;
  var offsetTime = (ctx.currentTime - soundStart + soundOffset) % buffer.duration;
  var bufferSlice = this.sliceBuffer(buffer, offsetTime, offsetTime + duration);

  sound.offsetTime = offsetTime;

  return this.createSound(bufferSlice, {
    volume : sound.volume * 0.8,
    offsetTime : 0,
    loop : true
  });
};

AudioController.prototype.playSound = function (params) {
  var path = params.path;

  return this._findOrLoadBuffer(path).then(function (buffer) {
    var sound = this.createSound(buffer, {
      volume : params.volume,
      loop : params.loop,
      offsetTime : 0
    });

    this._addActiveSound(sound);
    return sound;
  }.bind(this));
};

AudioController.prototype.updateVolume = function (volume) {
  this._activeSounds.forEach(function (sound) {
    sound.gainNode.gain.value = volume * sound.volume;
  });
};

AudioController.prototype.pause = function () {
  if (!this.canCopyBuffers) { return; }

  var sounds = this._activeSounds.slice();
  var soundSlices = sounds.map(
    this.createSoundSlice.bind(this, 0.5));

  sounds.forEach(function (sound) {
    sound.sourceNode.stop();
  });

  this._pausedSounds = sounds;
  this._activeSounds = soundSlices;
  this.updateVolume(this.volume);
};

AudioController.prototype.resume = function () {
  if (!this.canCopyBuffers) { return; }

  var prevSounds = this._activeSounds;
  var pausedSounds = this._pausedSounds;
  if (!pausedSounds) { return; }

  var activeSounds = [];

  pausedSounds.forEach(function (sound) {
    var newSound = this.createSound(sound.buffer, {
      offsetTime : sound.offsetTime,
      volume : sound.volume,
      loop : sound.sourceNode.loop
    });

    this._addActiveSound(newSound, activeSounds);
  }.bind(this));

  prevSounds.forEach(function (sound) {
    sound.sourceNode.stop();
  });

  this._pausedSounds = null;
  this._activeSounds = activeSounds;
  this.updateVolume(this.volume);
};

AudioController.prototype.update = function () {
  var volume = this.tween('volume', this.volume) * (1 - this.distance);

  if (volume !== this.volume) {
    this.updateVolume(volume);
  }

  if (this.isMuted && volume > this.VOLUME_ZERO) {
    this.triggerListeners('unmute');
    this.isMuted = false;
  }

  if (!this.isMuted && volume <= this.VOLUME_ZERO) {
    this.triggerListeners('mute');
    this.isMuted = true;
  }
};


})();

(function() {

var ToggleComponent = App.ToggleComponent;
var ModalComponent = App.ModalComponent;
var ColorComponent = App.ColorComponent;
var Features = App.Features;
var keysTop = [85, 73, 79, 80];

App.register('index', function index() {
  var scene = App.MainScene.create();
  var controls = document.getElementById('container-controls');

  var dotsToggle = ToggleComponent.create({
    name : 'dots',
    key : keysTop[0]
  });

  var postFxToggle = ToggleComponent.create({
    name : 'postfx',
    key : keysTop[3],
    isActive : scene.usePostFx
  });

  var simToggle = ToggleComponent.create({
    name : 'sim',
    key : 32,
    isActive : scene.shouldAnimate
  });

  ModalComponent.create({
    name : 'info'
  });

  scene.initItems();
  scene.initForces();
  scene.appendRenderer();

  postFxToggle.addListener('toggle', scene, 'togglePostFx');
  dotsToggle.addListener('toggle', scene, 'toggleDots');
  dotsToggle.addListener('toggle', scene, 'toggleStats');
  simToggle.addListener('toggle', scene, 'toggleAnimate');

  setupAudio(scene);
  setupColors(scene);
  setupSystemUI(scene);

  setTimeout(function () {
    scene.loop.start();
    controls.className = 'active';
  }, 0);
});

function setupAudio(scene) {
  /*global Promise*/
  var tests = [
    Features.detectWebAudio(),
    Features.detectAudioCodecs(['audio/ogg; codecs=vorbis', 'audio/mpeg;']),
    Features.detectAudioAutoplay()
  ];

  var audioToggle = ToggleComponent.create({
    name : 'audio',
    key : keysTop[2]
  });

  Promise.all(tests).then(function () {
    scene.initAudio();
    scene.addListener('load:audio', function () {
      audioToggle.addListener('toggle', scene, 'toggleAudio');
      audioToggle.toggleState();
    });
  }, function (err) {
    audioToggle.hide();
    App.log('Audio features not supported');
  });
}

function setupColors(scene) {
  var colorsToggle = ToggleComponent.create({
    name : 'colors',
    menu : 'colors',
    key : keysTop[1]
  });

  Features.detectInputType('color').then(function () {
    scene.medusae.colors.forEach(function (color) {
      var controller = ColorComponent.create({
        label : color.label,
        color : color.uniform.value
      });

      controller.addListener('change', scene, 'makeDirty');
      colorsToggle.menuInner.appendChild(controller.element);
    });
  }, function (err) {
    colorsToggle.hide();
    App.log('Color input not supported');
  });
}

function setupSystemUI(scene) {
  var Format = App.Format;
  var system = scene.medusae.system;
  var particleEl = document.getElementById('particle-count');
  var constraintEl = document.getElementById('constraint-count');
  var forceEl = document.getElementById('force-count');

  var constraintCount = system._localConstraints.reduce(function (prev, current) {
    return prev + current._count;
  }, 0);

  particleEl.textContent = Format.number(system._count);
  constraintEl.textContent = Format.number(constraintCount);
  forceEl.textContent = Format.number(system._forces.length);
}


})();

(function() {

App.register('tests', function tests() {
  document.body.className = 'testing';
});


})();

(function() {

var PMath = Particulate.Math;
var Tweens = App.Tweens;

var ENABLE_ZOOM = true;
var ENABLE_PAN = false;
var DEBUG_NUDGE = false;

App.MainScene = MainScene;
function MainScene() {
  var scene = this.scene = new THREE.Scene();
  var camera = this.camera = new THREE.PerspectiveCamera(30, 1, 5, 3500);
  var el = this.element = document.getElementById('container');
  this.statsElement = document.getElementById('container-graphs');

  this.mouse = new THREE.Vector2();
  this.raycaster = new THREE.Raycaster();
  this.nudgeIndex = 0;

  this.pxRatio = PMath.clamp(1.5, 2, window.devicePixelRatio);
  this.gravity = -2;

  this.usePostFx = true;
  this.shouldAnimate = true;

  this.initRenderer();
  this.initFxComposer();
  this.addPostFx();
  this.initControls();
  this.initStats();
  this.onWindowResize();

  var scale = this.height / 1000;
  camera.position.set(scale * 400, scale * 300, 0);
  camera.lookAt(scene.position);

  this.loop = App.Looper.create(this, 'update', 'preRender', 1 / 30 * 1000);

  el.addEventListener('mousedown', this.onMouseDown.bind(this), false);
  el.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  el.addEventListener('mouseup', this.onMouseUp.bind(this), false);

  window.addEventListener('resize', this.onWindowResize.bind(this), false);
}

MainScene.create = App.ctor(MainScene);
App.Dispatcher.extend(MainScene.prototype);

// ..................................................
// Graphics
//

MainScene.prototype.initRenderer = function () {
  var renderer = this.renderer = new THREE.WebGLRenderer({
    antialias : false
  });

  this.updateClearColor();
  renderer.setPixelRatio(this.pxRatio);
  renderer.autoClear = false;
  renderer.sortObjects = false;
};

MainScene.prototype.updateClearColor = function () {
  var color = this.usePostFx ? 0x0A060E : 0x100A17;
  this.renderer.setClearColor(color, 1);
};

MainScene.prototype.appendRenderer = function () {
  var canvas = this.renderer.domElement;

  this.element.appendChild(canvas);
  setTimeout(function () {
    canvas.className = 'active';
  }, 0);
};

MainScene.prototype.initFxComposer = function () {
  var renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
    minFilter : THREE.LinearFilter,
    magFilter : THREE.LinearMipMapLinearFilter,
    format : THREE.RGBAFormat
  });

  this.composer = new THREE.EffectComposer(this.renderer, renderTarget);
  this._passIndex = {};
};

// TODO: Tweak bloom fidelity
MainScene.prototype.addPostFx = function () {
  var bloomStrength = 0.8;
  var bloomKernel = 25;
  var bloomSigma = 8;
  var bloomRes = 512;

  var renderPass = new THREE.RenderPass(this.scene, this.camera);
  var bloomPass = new THREE.BloomPass(bloomStrength, bloomKernel, bloomSigma, bloomRes);
  var vignettePass = new THREE.ShaderPass(THREE.VignetteShader);

  var lensDirtPass = this.lensDirtPass = new App.LensDirtPass({
    quads : 200,
    textureSize : 2048
  });

  vignettePass.material.uniforms.darkness.value = 0.5;
  vignettePass.material.uniforms.offset.value = 1.25;
  vignettePass.material.uniforms.color.value = new THREE.Color(0x07070C);

  this.addPass(renderPass);
  this.addPass(bloomPass);
  this.addPass(lensDirtPass);
  this.addPass(vignettePass, true);
};

MainScene.prototype.addPass = function (name, pass, renderToScreen) {
  if (typeof name === 'string') {
    this._passIndex[name] = pass;
  } else {
    renderToScreen = pass;
    pass = name;
  }

  pass.renderToScreen = renderToScreen || false;
  this.composer.addPass(pass);
  return pass;
};

MainScene.prototype.getPass = function (name) {
  return this._passIndex[name];
};

MainScene.prototype.enablePass = function (name) {
  var pass = this.getPass(name);
  if (!pass) { return; }
  pass.enabled = true;
};

MainScene.prototype.disablePass = function (name) {
  var pass = this.getPass(name);
  if (!pass) { return; }
  pass.enabled = false;
};

MainScene.prototype.initItems = function () {
  var medusae = this.medusae = App.Medusae.create({
    pxRatio : this.pxRatio
  });

  var dust = this.dust = App.Dust.create({
    pxRatio : this.pxRatio
  });

  medusae.addTo(this.scene);
  dust.addTo(this.scene);
};

MainScene.prototype.makeDirty = function () {
  this.needsRender = true;
};

MainScene.prototype.togglePostFx = function (isEnabled) {
  this.usePostFx = isEnabled;
  this.updateClearColor();
  this.needsRender = true;
};

// TODO: Improve calculation of zoom range
MainScene.prototype.onWindowResize = function () {
  var width = window.innerWidth;
  var height = window.innerHeight;
  var pxRatio = this.pxRatio;

  var postWidth = width * pxRatio;
  var postHeight = height * pxRatio;
  var aspect = width / height;

  var scale = height / 1000;
  var minDistance = scale * 200;
  var maxDistance = scale * 1200;

  this.width = width;
  this.height = height;

  this.camera.aspect = aspect;
  this.camera.updateProjectionMatrix();

  this.controls.minDistance = minDistance;
  this.controls.maxDistance = maxDistance;
  this.controls.handleResize();

  this.mapDistance = Tweens.mapRange(minDistance, maxDistance, 0, 1);
  this.mapSoundDistance = Tweens.mapRange(minDistance, maxDistance * 1.3, 0, 1);

  this.renderer.setSize(width, height);
  this.composer.setSize(postWidth, postHeight);
  this.lensDirtPass.setSize(postWidth, postHeight);
  this.needsRender = true;
};

// ..................................................
// Forces
//

MainScene.prototype.initForces = function () {
  var medusae = this.medusae;
  var gravityForce = Particulate.DirectionalForce.create([0, this.gravity, 0]);
  var nudgeRadius = 50;
  var nudgeForce = App.PointRepulsorForce.create([20, 5, 0], {
    radius : nudgeRadius,
    intensity : 0
  });

  medusae.system.addForce(gravityForce);
  medusae.system.addForce(nudgeForce);

  this.gravityForce = gravityForce;
  this.nudgeForce = nudgeForce;

  if (DEBUG_NUDGE) { this.initDebugNudge(nudgeRadius); }
};

MainScene.prototype.initDebugNudge = function (radius) {
  var item = this.debugNudge = new THREE.Mesh(
    new THREE.SphereBufferGeometry(radius, 8, 6),
    new THREE.MeshBasicMaterial({
      color : 0xffffff,
      opacity : 0.2,
      transparent : true
    }));

  var wire = new THREE.WireframeHelper(item, 0xffffff);

  this.scene.add(wire);
  this.scene.add(item);
};

MainScene.prototype.updateDebugNudge = function () {
  var force = this.nudgeForce;
  var position = force.position;
  var intensity = Math.max(force.intensity, 0.0001);
  var item = this.debugNudge;

  item.scale.set(intensity, intensity, intensity);
  item.position.set(position[0], position[1], position[2]);
};

// ..................................................
// Controls
//

MainScene.prototype.initControls = function () {
  var controls = new THREE.TrackballControls(this.camera, this.element);

  controls.rotateSpeed = 0.75;
  controls.zoomSpeed = 0.75;
  controls.panSpeed = 0.6;

  controls.noZoom = !ENABLE_ZOOM;
  controls.noPan = !ENABLE_PAN;
  controls.staticMoving = false;

  controls.dynamicDampingFactor = 0.2;
  controls.keys = [65, 17, 16];

  controls.addEventListener('change', this.onControlsChange.bind(this));

  this.controls = controls;
};

MainScene.prototype.onControlsChange = function () {
  this.needsRender = true;
};

MainScene.prototype.toggleAnimate = function (event) {
  var audio = this.audio;
  var audioIsPlaying = this.audioIsPlaying;
  var shouldAnimate = !this.shouldAnimate;

  if (audio) {
    if (shouldAnimate) {
      audio.resume();
    } else {
      audio.pause();
    }

    if (audioIsPlaying) {
      audio.volume = shouldAnimate ? 1 : 0.7;
    }
  }

  this.shouldAnimate = shouldAnimate;
};

MainScene.prototype.toggleStats = function () {
  document.body.classList.toggle('show-info');
};

// ..................................................
// Interaction
//

MainScene.prototype.onMouseDown = function (event) {
  this.didDrag = false;
};

MainScene.prototype.onMouseMove = function (event) {
  this.didDrag = true;
};

MainScene.prototype.onMouseUp = function (event) {
  if (this.didDrag || !this.shouldAnimate) { return; }
  var mouse = this.mouse;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  this.nudgeMedusae();
  event.preventDefault();
};

MainScene.prototype.nudgeMedusae = (function () {
  var offset = new THREE.Vector3();

  return function () {
    var lastNudge = this.lastNudge;
    var timeDiff = Date.now() - lastNudge;
    if (timeDiff < 250) { return; }
    if (timeDiff > 800) {
      this.nudgeIndex = 0;
    }

    var bubbleSequence = this.bubbleSequence;
    var nudgeIndex = this.nudgeIndex;
    if (nudgeIndex > bubbleSequence.length - 1) { return; }

    var raycaster = this.raycaster;
    var mouse = this.mouse;
    var sound = this.sounds[bubbleSequence[nudgeIndex]];

    raycaster.setFromCamera(mouse, this.camera);

    var intersects = raycaster.intersectObject(this.medusae.bulbMesh);
    if (!intersects.length) { return; }
    var nudge = this.nudgeForce;
    var point = intersects[0].point;
    var spots = nudgeIndex * 5;
    var intensity = (nudgeIndex + 1) / (bubbleSequence.length) + 0.5;

    offset.copy(point).normalize().multiplyScalar(15);
    point.add(offset);

    nudge.intensity = intensity;
    nudge.set(point.x, point.y, point.z);

    this.playSound(sound);
    this.lensDirtPass.setGroup(spots, mouse.x, mouse.y, 0.8);

    this.lastNudge = Date.now();
    this.nudgeIndex ++;
  };
}());

// ..................................................
// Audio
//

MainScene.prototype.sounds = {
  bg : {
    path : 'bg-loop',
    volume : 1,
    loop : true
  },
  wave : {
    path : 'buzz-wave-4',
    volume : 0.8
  },
  bubblesLow : {
    path : 'bubbles-1',
    volume : 0.6
  },
  bubblesHigh : {
    path : 'bubbles-2',
    volume : 0.6
  }
};

MainScene.prototype.bubbleSequence = [
  'bubblesLow',
  'bubblesLow',
  'bubblesHigh'
];

MainScene.prototype.initAudio = function () {
  var sounds = this.sounds;
  var audio = this.audio = App.AudioController.create({
    baseUrl : App.STATIC_URL + 'audio/'
  });

  audio.loadBuffer(sounds.bg).then(function () {
    audio.playSound(sounds.bg);
    audio.addListener('mute', this, 'muteSounds');
    audio.addListener('unmute', this, 'unmuteSounds');
    setTimeout(this.triggerListeners.bind(this, 'load:audio'), 0);
  }.bind(this));

  audio.loadBuffer(sounds.wave).then(function () {
    this.medusae.addListener('phase:top', this, 'audioPhaseTop');
  }.bind(this));

  audio.loadBuffer(sounds.bubblesLow);
  audio.loadBuffer(sounds.bubblesHigh);
};

MainScene.prototype.playSound = function (params) {
  if (!this.audio || !this.audioIsPlaying) { return; }
  this.audio.playSound(params);
};

// TODO: Stop / restart playback
MainScene.prototype.muteSounds = function () {};
MainScene.prototype.unmuteSounds = function () {};

MainScene.prototype.startAudio = function () {
  this.audio.volume = 1;
  this.audioIsPlaying = true;
};

MainScene.prototype.stopAudio = function () {
  this.audio.volume = 0;
  this.audioIsPlaying = false;
};

MainScene.prototype.toggleAudio = function () {
  if (this.audioIsPlaying) {
    this.stopAudio();
  } else {
    this.startAudio();
  }
};

MainScene.prototype.audioPhaseTop = function () {
  this.playSound(this.sounds.wave);
};

// ..................................................
// Vis
//

// TODO: Improve naming
MainScene.prototype.toggleDots = function () {
  if (!this.medusae) { return; }
  this._renderStats = !this._renderStats;
  this.medusae.toggleDots();
};

// ..................................................
// Stats
//

MainScene.prototype.initStats = function () {
  var el = this.statsElement;

  this.statsPhysics = App.GraphComponent.create({
    label : 'Physics (ms)'
  });

  this.statsGraphics = App.GraphComponent.create({
    label : 'Graphics (ms)',
    updateFactor : 0.025
  });

  this.statsPhysics.appendTo(el);
  this.statsGraphics.appendTo(el);
};

// ..................................................
// Loop
//

MainScene.prototype.update = function (delta) {
  var medusae = this.medusae;
  var audio = this.audio;
  var nudgeForce = this.nudgeForce;

  var distance = this.camera.position.length();
  var distNorm = this.mapDistance(distance);
  var distSound = this.mapSoundDistance(distance);
  var lineWidth = Math.max(0.5, Math.round((1 - distNorm) * 2 * 1.5) / 2);

  medusae.updateLineWidth(lineWidth);
  nudgeForce.intensity *= 0.8;

  if (this.shouldAnimate) {
    this.statsPhysics.start();
    medusae.update(delta);
    this.statsPhysics.end();
    this.lensDirtPass.update(delta);
  }

  if (audio) {
    audio.distance = distSound;
    audio.update(delta);
  }

  if (DEBUG_NUDGE) { this.updateDebugNudge(delta); }
};

MainScene.prototype.preRender = function (delta, stepProgress) {
  this.controls.update();
  this.medusae.updateTweens(delta);

  if (this.shouldAnimate || this.needsRender || this.medusae.needsRender) {
    this.render(delta, stepProgress);
    this.needsRender = false;
  } else {
    this.statsGraphics.reset();
  }

  if (this._renderStats) {
    if (this.loop.didUpdate) {
      this.statsPhysics.update();
    } else {
      this.statsPhysics.update(0, true);
    }

    this.statsGraphics.update();
  }
};

MainScene.prototype.render = function (delta, stepProgress) {
  this.statsGraphics.start();

  if (this.shouldAnimate) {
    this.medusae.updateGraphics(delta, stepProgress);
    this.dust.updateGraphics(delta, stepProgress);
  }

  if (this.usePostFx) {
    this.composer.render(0.01);
  } else {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  }

  this.statsGraphics.end();
};


})();

(function() {

setTimeout(function setup() {
  var DEBUG = true;
  if (DEBUG && location.search.indexOf('test=true') > -1) {
    App.run('tests');
  } else {
    App.run('index');
    App.log('Particulate.js ' + Particulate.VERSION);
  }
}, 0);


})();