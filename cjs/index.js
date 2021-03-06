/*! (c) Andrea Giammarchi - ISC */
var self = this || /* istanbul ignore next */ {};
try {
  self.EventTarget = (new EventTarget).constructor;
} catch(EventTarget) {
  (function (Object, wm) {
    var create = Object.create;
    var defineProperty = Object.defineProperty;
    var proto = EventTarget.prototype;
    function getListenerObj(secret, type) {
      if (!secret[type]) {
        secret[type] = {
          inline: null,
          list: [],
        };
      }
      return secret[type];
    }
    define(proto, 'addEventListener', function (type, listener, options) {
      var secret = wm.get(this);
      var listeners = getListenerObj(secret, type).list;
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (listeners[i].listener === listener)
          return;
      }
      listeners.push({target: this, listener: listener, options: options});
    });
    define(proto, '_on', function (type, listener) {
      var secret = wm.get(this);
      var listenerObj = getListenerObj(secret, type);
      var listeners = listenerObj.list;
      var lastInline = listenerObj.inline;
      listenerObj.inline = listener;
      if (listener == null) {
        this.removeEventListener(type, lastInline);
        return;
      }
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (listeners[i].listener === lastInline) {
          listeners[i].listener = listener;
          return;
        }
      }
      listeners.push({target: this, listener: listener});
    });
    define(proto, 'dispatchEvent', function (event) {
      var secret = wm.get(this);
      var listenerObj = secret[event.type];
      if (listenerObj) {
        var listeners = listenerObj.list;
        if (listeners) {
          define(event, 'target', this);
          define(event, 'currentTarget', this);
          listeners.slice(0).forEach(dispatch, event);
          delete event.currentTarget;
          delete event.target;
        }
      }
      return true;
    });
    define(proto, 'removeEventListener', function (type, listener) {
      var secret = wm.get(this);
      var listeners = getListenerObj(secret, type).list;
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (listeners[i].listener === listener) {
          listeners.splice(i, 1);
          return;
        }
      }
    });
    self.EventTarget = EventTarget;
    function EventTarget() {'use strict';
      wm.set(this, create(null));
    }
    function define(target, name, value) {
      defineProperty(
        target,
        name,
        {
          configurable: true,
          writable: true,
          value: value
        }
      );
    }
    function dispatch(info) {
      var options = info.options;
      if (options && options.once)
        info.target.removeEventListener(this.type, info.listener);
      if (typeof info.listener === 'function')
        info.listener.call(info.target, this);
      else
        info.listener.handleEvent(this);
    }
  }(Object, new WeakMap));
}
module.exports = self.EventTarget;
