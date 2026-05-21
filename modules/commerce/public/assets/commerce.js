(() => {
  var gr = Object.create;
  var io = Object.defineProperty;
  var br = Object.getOwnPropertyDescriptor;
  var pr = Object.getOwnPropertyNames;
  var Sr = Object.getPrototypeOf,
    Nr = Object.prototype.hasOwnProperty;
  var dl = (t, l) => () => (l || t((l = { exports: {} }).exports, l), l.exports);
  var zr = (t, l, a, e) => {
    if ((l && typeof l == 'object') || typeof l == 'function') for (let u of pr(l)) !Nr.call(t, u) && u !== a && io(t, u, { get: () => l[u], enumerable: !(e = br(l, u)) || e.enumerable });
    return t;
  };
  var $ = (t, l, a) => ((a = t != null ? gr(Sr(t)) : {}), zr(l || !t || !t.__esModule ? io(a, 'default', { value: t, enumerable: !0 }) : a, t));
  var go = dl((et) => {
    'use strict';
    function pi(t, l) {
      var a = t.length;
      t.push(l);
      t: for (; 0 < a; ) {
        var e = (a - 1) >>> 1,
          u = t[e];
        if (0 < Cu(u, l)) ((t[e] = l), (t[a] = u), (a = e));
        else break t;
      }
    }
    function ml(t) {
      return t.length === 0 ? null : t[0];
    }
    function Hu(t) {
      if (t.length === 0) return null;
      var l = t[0],
        a = t.pop();
      if (a !== l) {
        t[0] = a;
        t: for (var e = 0, u = t.length, n = u >>> 1; e < n; ) {
          var i = 2 * (e + 1) - 1,
            c = t[i],
            f = i + 1,
            m = t[f];
          if (0 > Cu(c, a)) f < u && 0 > Cu(m, c) ? ((t[e] = m), (t[f] = a), (e = f)) : ((t[e] = c), (t[i] = a), (e = i));
          else if (f < u && 0 > Cu(m, a)) ((t[e] = m), (t[f] = a), (e = f));
          else break t;
        }
      }
      return l;
    }
    function Cu(t, l) {
      var a = t.sortIndex - l.sortIndex;
      return a !== 0 ? a : t.id - l.id;
    }
    et.unstable_now = void 0;
    typeof performance == 'object' && typeof performance.now == 'function'
      ? ((co = performance),
        (et.unstable_now = function () {
          return co.now();
        }))
      : ((yi = Date),
        (fo = yi.now()),
        (et.unstable_now = function () {
          return yi.now() - fo;
        }));
    var co,
      yi,
      fo,
      pl = [],
      Xl = [],
      Tr = 1,
      Wt = null,
      At = 3,
      Si = !1,
      Me = !1,
      De = !1,
      Ni = !1,
      mo = typeof setTimeout == 'function' ? setTimeout : null,
      ro = typeof clearTimeout == 'function' ? clearTimeout : null,
      oo = typeof setImmediate < 'u' ? setImmediate : null;
    function qu(t) {
      for (var l = ml(Xl); l !== null; ) {
        if (l.callback === null) Hu(Xl);
        else if (l.startTime <= t) (Hu(Xl), (l.sortIndex = l.expirationTime), pi(pl, l));
        else break;
        l = ml(Xl);
      }
    }
    function zi(t) {
      if (((De = !1), qu(t), !Me))
        if (ml(pl) !== null) ((Me = !0), Ya || ((Ya = !0), Ra()));
        else {
          var l = ml(Xl);
          l !== null && Ti(zi, l.startTime - t);
        }
    }
    var Ya = !1,
      Ue = -1,
      vo = 5,
      ho = -1;
    function yo() {
      return Ni ? !0 : !(et.unstable_now() - ho < vo);
    }
    function gi() {
      if (((Ni = !1), Ya)) {
        var t = et.unstable_now();
        ho = t;
        var l = !0;
        try {
          t: {
            ((Me = !1), De && ((De = !1), ro(Ue), (Ue = -1)), (Si = !0));
            var a = At;
            try {
              l: {
                for (qu(t), Wt = ml(pl); Wt !== null && !(Wt.expirationTime > t && yo()); ) {
                  var e = Wt.callback;
                  if (typeof e == 'function') {
                    ((Wt.callback = null), (At = Wt.priorityLevel));
                    var u = e(Wt.expirationTime <= t);
                    if (((t = et.unstable_now()), typeof u == 'function')) {
                      ((Wt.callback = u), qu(t), (l = !0));
                      break l;
                    }
                    (Wt === ml(pl) && Hu(pl), qu(t));
                  } else Hu(pl);
                  Wt = ml(pl);
                }
                if (Wt !== null) l = !0;
                else {
                  var n = ml(Xl);
                  (n !== null && Ti(zi, n.startTime - t), (l = !1));
                }
              }
              break t;
            } finally {
              ((Wt = null), (At = a), (Si = !1));
            }
            l = void 0;
          }
        } finally {
          l ? Ra() : (Ya = !1);
        }
      }
    }
    var Ra;
    typeof oo == 'function'
      ? (Ra = function () {
          oo(gi);
        })
      : typeof MessageChannel < 'u'
        ? ((bi = new MessageChannel()),
          (so = bi.port2),
          (bi.port1.onmessage = gi),
          (Ra = function () {
            so.postMessage(null);
          }))
        : (Ra = function () {
            mo(gi, 0);
          });
    var bi, so;
    function Ti(t, l) {
      Ue = mo(function () {
        t(et.unstable_now());
      }, l);
    }
    et.unstable_IdlePriority = 5;
    et.unstable_ImmediatePriority = 1;
    et.unstable_LowPriority = 4;
    et.unstable_NormalPriority = 3;
    et.unstable_Profiling = null;
    et.unstable_UserBlockingPriority = 2;
    et.unstable_cancelCallback = function (t) {
      t.callback = null;
    };
    et.unstable_forceFrameRate = function (t) {
      0 > t || 125 < t ? console.error('forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported') : (vo = 0 < t ? Math.floor(1e3 / t) : 5);
    };
    et.unstable_getCurrentPriorityLevel = function () {
      return At;
    };
    et.unstable_next = function (t) {
      switch (At) {
        case 1:
        case 2:
        case 3:
          var l = 3;
          break;
        default:
          l = At;
      }
      var a = At;
      At = l;
      try {
        return t();
      } finally {
        At = a;
      }
    };
    et.unstable_requestPaint = function () {
      Ni = !0;
    };
    et.unstable_runWithPriority = function (t, l) {
      switch (t) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          t = 3;
      }
      var a = At;
      At = t;
      try {
        return l();
      } finally {
        At = a;
      }
    };
    et.unstable_scheduleCallback = function (t, l, a) {
      var e = et.unstable_now();
      switch ((typeof a == 'object' && a !== null ? ((a = a.delay), (a = typeof a == 'number' && 0 < a ? e + a : e)) : (a = e), t)) {
        case 1:
          var u = -1;
          break;
        case 2:
          u = 250;
          break;
        case 5:
          u = 1073741823;
          break;
        case 4:
          u = 1e4;
          break;
        default:
          u = 5e3;
      }
      return (
        (u = a + u),
        (t = { id: Tr++, callback: l, priorityLevel: t, startTime: a, expirationTime: u, sortIndex: -1 }),
        a > e ? ((t.sortIndex = a), pi(Xl, t), ml(pl) === null && t === ml(Xl) && (De ? (ro(Ue), (Ue = -1)) : (De = !0), Ti(zi, a - e))) : ((t.sortIndex = u), pi(pl, t), Me || Si || ((Me = !0), Ya || ((Ya = !0), Ra()))),
        t
      );
    };
    et.unstable_shouldYield = yo;
    et.unstable_wrapCallback = function (t) {
      var l = At;
      return function () {
        var a = At;
        At = l;
        try {
          return t.apply(this, arguments);
        } finally {
          At = a;
        }
      };
    };
  });
  var po = dl((Cy, bo) => {
    'use strict';
    bo.exports = go();
  });
  var Uo = dl((H) => {
    'use strict';
    var Oi = Symbol.for('react.transitional.element'),
      Er = Symbol.for('react.portal'),
      Ar = Symbol.for('react.fragment'),
      Or = Symbol.for('react.strict_mode'),
      _r = Symbol.for('react.profiler'),
      Mr = Symbol.for('react.consumer'),
      Dr = Symbol.for('react.context'),
      Ur = Symbol.for('react.forward_ref'),
      xr = Symbol.for('react.suspense'),
      Cr = Symbol.for('react.memo'),
      Eo = Symbol.for('react.lazy'),
      qr = Symbol.for('react.activity'),
      So = Symbol.iterator;
    function Hr(t) {
      return t === null || typeof t != 'object' ? null : ((t = (So && t[So]) || t['@@iterator']), typeof t == 'function' ? t : null);
    }
    var Ao = {
        isMounted: function () {
          return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
      },
      Oo = Object.assign,
      _o = {};
    function Xa(t, l, a) {
      ((this.props = t), (this.context = l), (this.refs = _o), (this.updater = a || Ao));
    }
    Xa.prototype.isReactComponent = {};
    Xa.prototype.setState = function (t, l) {
      if (typeof t != 'object' && typeof t != 'function' && t != null) throw Error('takes an object of state variables to update or a function which returns an object of state variables.');
      this.updater.enqueueSetState(this, t, l, 'setState');
    };
    Xa.prototype.forceUpdate = function (t) {
      this.updater.enqueueForceUpdate(this, t, 'forceUpdate');
    };
    function Mo() {}
    Mo.prototype = Xa.prototype;
    function _i(t, l, a) {
      ((this.props = t), (this.context = l), (this.refs = _o), (this.updater = a || Ao));
    }
    var Mi = (_i.prototype = new Mo());
    Mi.constructor = _i;
    Oo(Mi, Xa.prototype);
    Mi.isPureReactComponent = !0;
    var No = Array.isArray;
    function Ai() {}
    var P = { H: null, A: null, T: null, S: null },
      Do = Object.prototype.hasOwnProperty;
    function Di(t, l, a) {
      var e = a.ref;
      return { $$typeof: Oi, type: t, key: l, ref: e !== void 0 ? e : null, props: a };
    }
    function Br(t, l) {
      return Di(t.type, l, t.props);
    }
    function Ui(t) {
      return typeof t == 'object' && t !== null && t.$$typeof === Oi;
    }
    function Rr(t) {
      var l = { '=': '=0', ':': '=2' };
      return (
        '$' +
        t.replace(/[=:]/g, function (a) {
          return l[a];
        })
      );
    }
    var zo = /\/+/g;
    function Ei(t, l) {
      return typeof t == 'object' && t !== null && t.key != null ? Rr('' + t.key) : l.toString(36);
    }
    function Yr(t) {
      switch (t.status) {
        case 'fulfilled':
          return t.value;
        case 'rejected':
          throw t.reason;
        default:
          switch (
            (typeof t.status == 'string'
              ? t.then(Ai, Ai)
              : ((t.status = 'pending'),
                t.then(
                  function (l) {
                    t.status === 'pending' && ((t.status = 'fulfilled'), (t.value = l));
                  },
                  function (l) {
                    t.status === 'pending' && ((t.status = 'rejected'), (t.reason = l));
                  },
                )),
            t.status)
          ) {
            case 'fulfilled':
              return t.value;
            case 'rejected':
              throw t.reason;
          }
      }
      throw t;
    }
    function Qa(t, l, a, e, u) {
      var n = typeof t;
      (n === 'undefined' || n === 'boolean') && (t = null);
      var i = !1;
      if (t === null) i = !0;
      else
        switch (n) {
          case 'bigint':
          case 'string':
          case 'number':
            i = !0;
            break;
          case 'object':
            switch (t.$$typeof) {
              case Oi:
              case Er:
                i = !0;
                break;
              case Eo:
                return ((i = t._init), Qa(i(t._payload), l, a, e, u));
            }
        }
      if (i)
        return (
          (u = u(t)),
          (i = e === '' ? '.' + Ei(t, 0) : e),
          No(u)
            ? ((a = ''),
              i != null && (a = i.replace(zo, '$&/') + '/'),
              Qa(u, l, a, '', function (m) {
                return m;
              }))
            : u != null && (Ui(u) && (u = Br(u, a + (u.key == null || (t && t.key === u.key) ? '' : ('' + u.key).replace(zo, '$&/') + '/') + i)), l.push(u)),
          1
        );
      i = 0;
      var c = e === '' ? '.' : e + ':';
      if (No(t)) for (var f = 0; f < t.length; f++) ((e = t[f]), (n = c + Ei(e, f)), (i += Qa(e, l, a, n, u)));
      else if (((f = Hr(t)), typeof f == 'function')) for (t = f.call(t), f = 0; !(e = t.next()).done; ) ((e = e.value), (n = c + Ei(e, f++)), (i += Qa(e, l, a, n, u)));
      else if (n === 'object') {
        if (typeof t.then == 'function') return Qa(Yr(t), l, a, e, u);
        throw ((l = String(t)), Error('Objects are not valid as a React child (found: ' + (l === '[object Object]' ? 'object with keys {' + Object.keys(t).join(', ') + '}' : l) + '). If you meant to render a collection of children, use an array instead.'));
      }
      return i;
    }
    function Bu(t, l, a) {
      if (t == null) return t;
      var e = [],
        u = 0;
      return (
        Qa(t, e, '', '', function (n) {
          return l.call(a, n, u++);
        }),
        e
      );
    }
    function Qr(t) {
      if (t._status === -1) {
        var l = t._result;
        ((l = l()),
          l.then(
            function (a) {
              (t._status === 0 || t._status === -1) && ((t._status = 1), (t._result = a));
            },
            function (a) {
              (t._status === 0 || t._status === -1) && ((t._status = 2), (t._result = a));
            },
          ),
          t._status === -1 && ((t._status = 0), (t._result = l)));
      }
      if (t._status === 1) return t._result.default;
      throw t._result;
    }
    var To =
        typeof reportError == 'function'
          ? reportError
          : function (t) {
              if (typeof window == 'object' && typeof window.ErrorEvent == 'function') {
                var l = new window.ErrorEvent('error', { bubbles: !0, cancelable: !0, message: typeof t == 'object' && t !== null && typeof t.message == 'string' ? String(t.message) : String(t), error: t });
                if (!window.dispatchEvent(l)) return;
              } else if (typeof process == 'object' && typeof process.emit == 'function') {
                process.emit('uncaughtException', t);
                return;
              }
              console.error(t);
            },
      Xr = {
        map: Bu,
        forEach: function (t, l, a) {
          Bu(
            t,
            function () {
              l.apply(this, arguments);
            },
            a,
          );
        },
        count: function (t) {
          var l = 0;
          return (
            Bu(t, function () {
              l++;
            }),
            l
          );
        },
        toArray: function (t) {
          return (
            Bu(t, function (l) {
              return l;
            }) || []
          );
        },
        only: function (t) {
          if (!Ui(t)) throw Error('React.Children.only expected to receive a single React element child.');
          return t;
        },
      };
    H.Activity = qr;
    H.Children = Xr;
    H.Component = Xa;
    H.Fragment = Ar;
    H.Profiler = _r;
    H.PureComponent = _i;
    H.StrictMode = Or;
    H.Suspense = xr;
    H.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = P;
    H.__COMPILER_RUNTIME = {
      __proto__: null,
      c: function (t) {
        return P.H.useMemoCache(t);
      },
    };
    H.cache = function (t) {
      return function () {
        return t.apply(null, arguments);
      };
    };
    H.cacheSignal = function () {
      return null;
    };
    H.cloneElement = function (t, l, a) {
      if (t == null) throw Error('The argument must be a React element, but you passed ' + t + '.');
      var e = Oo({}, t.props),
        u = t.key;
      if (l != null) for (n in (l.key !== void 0 && (u = '' + l.key), l)) !Do.call(l, n) || n === 'key' || n === '__self' || n === '__source' || (n === 'ref' && l.ref === void 0) || (e[n] = l[n]);
      var n = arguments.length - 2;
      if (n === 1) e.children = a;
      else if (1 < n) {
        for (var i = Array(n), c = 0; c < n; c++) i[c] = arguments[c + 2];
        e.children = i;
      }
      return Di(t.type, u, e);
    };
    H.createContext = function (t) {
      return ((t = { $$typeof: Dr, _currentValue: t, _currentValue2: t, _threadCount: 0, Provider: null, Consumer: null }), (t.Provider = t), (t.Consumer = { $$typeof: Mr, _context: t }), t);
    };
    H.createElement = function (t, l, a) {
      var e,
        u = {},
        n = null;
      if (l != null) for (e in (l.key !== void 0 && (n = '' + l.key), l)) Do.call(l, e) && e !== 'key' && e !== '__self' && e !== '__source' && (u[e] = l[e]);
      var i = arguments.length - 2;
      if (i === 1) u.children = a;
      else if (1 < i) {
        for (var c = Array(i), f = 0; f < i; f++) c[f] = arguments[f + 2];
        u.children = c;
      }
      if (t && t.defaultProps) for (e in ((i = t.defaultProps), i)) u[e] === void 0 && (u[e] = i[e]);
      return Di(t, n, u);
    };
    H.createRef = function () {
      return { current: null };
    };
    H.forwardRef = function (t) {
      return { $$typeof: Ur, render: t };
    };
    H.isValidElement = Ui;
    H.lazy = function (t) {
      return { $$typeof: Eo, _payload: { _status: -1, _result: t }, _init: Qr };
    };
    H.memo = function (t, l) {
      return { $$typeof: Cr, type: t, compare: l === void 0 ? null : l };
    };
    H.startTransition = function (t) {
      var l = P.T,
        a = {};
      P.T = a;
      try {
        var e = t(),
          u = P.S;
        (u !== null && u(a, e), typeof e == 'object' && e !== null && typeof e.then == 'function' && e.then(Ai, To));
      } catch (n) {
        To(n);
      } finally {
        (l !== null && a.types !== null && (l.types = a.types), (P.T = l));
      }
    };
    H.unstable_useCacheRefresh = function () {
      return P.H.useCacheRefresh();
    };
    H.use = function (t) {
      return P.H.use(t);
    };
    H.useActionState = function (t, l, a) {
      return P.H.useActionState(t, l, a);
    };
    H.useCallback = function (t, l) {
      return P.H.useCallback(t, l);
    };
    H.useContext = function (t) {
      return P.H.useContext(t);
    };
    H.useDebugValue = function () {};
    H.useDeferredValue = function (t, l) {
      return P.H.useDeferredValue(t, l);
    };
    H.useEffect = function (t, l) {
      return P.H.useEffect(t, l);
    };
    H.useEffectEvent = function (t) {
      return P.H.useEffectEvent(t);
    };
    H.useId = function () {
      return P.H.useId();
    };
    H.useImperativeHandle = function (t, l, a) {
      return P.H.useImperativeHandle(t, l, a);
    };
    H.useInsertionEffect = function (t, l) {
      return P.H.useInsertionEffect(t, l);
    };
    H.useLayoutEffect = function (t, l) {
      return P.H.useLayoutEffect(t, l);
    };
    H.useMemo = function (t, l) {
      return P.H.useMemo(t, l);
    };
    H.useOptimistic = function (t, l) {
      return P.H.useOptimistic(t, l);
    };
    H.useReducer = function (t, l, a) {
      return P.H.useReducer(t, l, a);
    };
    H.useRef = function (t) {
      return P.H.useRef(t);
    };
    H.useState = function (t) {
      return P.H.useState(t);
    };
    H.useSyncExternalStore = function (t, l, a) {
      return P.H.useSyncExternalStore(t, l, a);
    };
    H.useTransition = function () {
      return P.H.useTransition();
    };
    H.version = '19.2.4';
  });
  var il = dl((Hy, xo) => {
    'use strict';
    xo.exports = Uo();
  });
  var qo = dl((_t) => {
    'use strict';
    var Gr = il();
    function Co(t) {
      var l = 'https://react.dev/errors/' + t;
      if (1 < arguments.length) {
        l += '?args[]=' + encodeURIComponent(arguments[1]);
        for (var a = 2; a < arguments.length; a++) l += '&args[]=' + encodeURIComponent(arguments[a]);
      }
      return 'Minified React error #' + t + '; visit ' + l + ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.';
    }
    function Gl() {}
    var Ot = {
        d: {
          f: Gl,
          r: function () {
            throw Error(Co(522));
          },
          D: Gl,
          C: Gl,
          L: Gl,
          m: Gl,
          X: Gl,
          S: Gl,
          M: Gl,
        },
        p: 0,
        findDOMNode: null,
      },
      jr = Symbol.for('react.portal');
    function Zr(t, l, a) {
      var e = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
      return { $$typeof: jr, key: e == null ? null : '' + e, children: t, containerInfo: l, implementation: a };
    }
    var xe = Gr.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function Ru(t, l) {
      if (t === 'font') return '';
      if (typeof l == 'string') return l === 'use-credentials' ? l : '';
    }
    _t.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Ot;
    _t.createPortal = function (t, l) {
      var a = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
      if (!l || (l.nodeType !== 1 && l.nodeType !== 9 && l.nodeType !== 11)) throw Error(Co(299));
      return Zr(t, l, null, a);
    };
    _t.flushSync = function (t) {
      var l = xe.T,
        a = Ot.p;
      try {
        if (((xe.T = null), (Ot.p = 2), t)) return t();
      } finally {
        ((xe.T = l), (Ot.p = a), Ot.d.f());
      }
    };
    _t.preconnect = function (t, l) {
      typeof t == 'string' && (l ? ((l = l.crossOrigin), (l = typeof l == 'string' ? (l === 'use-credentials' ? l : '') : void 0)) : (l = null), Ot.d.C(t, l));
    };
    _t.prefetchDNS = function (t) {
      typeof t == 'string' && Ot.d.D(t);
    };
    _t.preinit = function (t, l) {
      if (typeof t == 'string' && l && typeof l.as == 'string') {
        var a = l.as,
          e = Ru(a, l.crossOrigin),
          u = typeof l.integrity == 'string' ? l.integrity : void 0,
          n = typeof l.fetchPriority == 'string' ? l.fetchPriority : void 0;
        a === 'style' ? Ot.d.S(t, typeof l.precedence == 'string' ? l.precedence : void 0, { crossOrigin: e, integrity: u, fetchPriority: n }) : a === 'script' && Ot.d.X(t, { crossOrigin: e, integrity: u, fetchPriority: n, nonce: typeof l.nonce == 'string' ? l.nonce : void 0 });
      }
    };
    _t.preinitModule = function (t, l) {
      if (typeof t == 'string')
        if (typeof l == 'object' && l !== null) {
          if (l.as == null || l.as === 'script') {
            var a = Ru(l.as, l.crossOrigin);
            Ot.d.M(t, { crossOrigin: a, integrity: typeof l.integrity == 'string' ? l.integrity : void 0, nonce: typeof l.nonce == 'string' ? l.nonce : void 0 });
          }
        } else l == null && Ot.d.M(t);
    };
    _t.preload = function (t, l) {
      if (typeof t == 'string' && typeof l == 'object' && l !== null && typeof l.as == 'string') {
        var a = l.as,
          e = Ru(a, l.crossOrigin);
        Ot.d.L(t, a, {
          crossOrigin: e,
          integrity: typeof l.integrity == 'string' ? l.integrity : void 0,
          nonce: typeof l.nonce == 'string' ? l.nonce : void 0,
          type: typeof l.type == 'string' ? l.type : void 0,
          fetchPriority: typeof l.fetchPriority == 'string' ? l.fetchPriority : void 0,
          referrerPolicy: typeof l.referrerPolicy == 'string' ? l.referrerPolicy : void 0,
          imageSrcSet: typeof l.imageSrcSet == 'string' ? l.imageSrcSet : void 0,
          imageSizes: typeof l.imageSizes == 'string' ? l.imageSizes : void 0,
          media: typeof l.media == 'string' ? l.media : void 0,
        });
      }
    };
    _t.preloadModule = function (t, l) {
      if (typeof t == 'string')
        if (l) {
          var a = Ru(l.as, l.crossOrigin);
          Ot.d.m(t, { as: typeof l.as == 'string' && l.as !== 'script' ? l.as : void 0, crossOrigin: a, integrity: typeof l.integrity == 'string' ? l.integrity : void 0 });
        } else Ot.d.m(t);
    };
    _t.requestFormReset = function (t) {
      Ot.d.r(t);
    };
    _t.unstable_batchedUpdates = function (t, l) {
      return t(l);
    };
    _t.useFormState = function (t, l, a) {
      return xe.H.useFormState(t, l, a);
    };
    _t.useFormStatus = function () {
      return xe.H.useHostTransitionStatus();
    };
    _t.version = '19.2.4';
  });
  var Ro = dl((Ry, Bo) => {
    'use strict';
    function Ho() {
      if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'))
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Ho);
        } catch (t) {
          console.error(t);
        }
    }
    (Ho(), (Bo.exports = qo()));
  });
  var k0 = dl((fi) => {
    'use strict';
    var ht = po(),
      fd = il(),
      Lr = Ro();
    function b(t) {
      var l = 'https://react.dev/errors/' + t;
      if (1 < arguments.length) {
        l += '?args[]=' + encodeURIComponent(arguments[1]);
        for (var a = 2; a < arguments.length; a++) l += '&args[]=' + encodeURIComponent(arguments[a]);
      }
      return 'Minified React error #' + t + '; visit ' + l + ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.';
    }
    function od(t) {
      return !(!t || (t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11));
    }
    function gu(t) {
      var l = t,
        a = t;
      if (t.alternate) for (; l.return; ) l = l.return;
      else {
        t = l;
        do ((l = t), (l.flags & 4098) !== 0 && (a = l.return), (t = l.return));
        while (t);
      }
      return l.tag === 3 ? a : null;
    }
    function sd(t) {
      if (t.tag === 13) {
        var l = t.memoizedState;
        if ((l === null && ((t = t.alternate), t !== null && (l = t.memoizedState)), l !== null)) return l.dehydrated;
      }
      return null;
    }
    function dd(t) {
      if (t.tag === 31) {
        var l = t.memoizedState;
        if ((l === null && ((t = t.alternate), t !== null && (l = t.memoizedState)), l !== null)) return l.dehydrated;
      }
      return null;
    }
    function Yo(t) {
      if (gu(t) !== t) throw Error(b(188));
    }
    function Vr(t) {
      var l = t.alternate;
      if (!l) {
        if (((l = gu(t)), l === null)) throw Error(b(188));
        return l !== t ? null : t;
      }
      for (var a = t, e = l; ; ) {
        var u = a.return;
        if (u === null) break;
        var n = u.alternate;
        if (n === null) {
          if (((e = u.return), e !== null)) {
            a = e;
            continue;
          }
          break;
        }
        if (u.child === n.child) {
          for (n = u.child; n; ) {
            if (n === a) return (Yo(u), t);
            if (n === e) return (Yo(u), l);
            n = n.sibling;
          }
          throw Error(b(188));
        }
        if (a.return !== e.return) ((a = u), (e = n));
        else {
          for (var i = !1, c = u.child; c; ) {
            if (c === a) {
              ((i = !0), (a = u), (e = n));
              break;
            }
            if (c === e) {
              ((i = !0), (e = u), (a = n));
              break;
            }
            c = c.sibling;
          }
          if (!i) {
            for (c = n.child; c; ) {
              if (c === a) {
                ((i = !0), (a = n), (e = u));
                break;
              }
              if (c === e) {
                ((i = !0), (e = n), (a = u));
                break;
              }
              c = c.sibling;
            }
            if (!i) throw Error(b(189));
          }
        }
        if (a.alternate !== e) throw Error(b(190));
      }
      if (a.tag !== 3) throw Error(b(188));
      return a.stateNode.current === a ? t : l;
    }
    function md(t) {
      var l = t.tag;
      if (l === 5 || l === 26 || l === 27 || l === 6) return t;
      for (t = t.child; t !== null; ) {
        if (((l = md(t)), l !== null)) return l;
        t = t.sibling;
      }
      return null;
    }
    var at = Object.assign,
      Kr = Symbol.for('react.element'),
      Yu = Symbol.for('react.transitional.element'),
      Xe = Symbol.for('react.portal'),
      Ka = Symbol.for('react.fragment'),
      rd = Symbol.for('react.strict_mode'),
      sc = Symbol.for('react.profiler'),
      vd = Symbol.for('react.consumer'),
      _l = Symbol.for('react.context'),
      nf = Symbol.for('react.forward_ref'),
      dc = Symbol.for('react.suspense'),
      mc = Symbol.for('react.suspense_list'),
      cf = Symbol.for('react.memo'),
      jl = Symbol.for('react.lazy'),
      rc = Symbol.for('react.activity'),
      Jr = Symbol.for('react.memo_cache_sentinel'),
      Qo = Symbol.iterator;
    function Ce(t) {
      return t === null || typeof t != 'object' ? null : ((t = (Qo && t[Qo]) || t['@@iterator']), typeof t == 'function' ? t : null);
    }
    var wr = Symbol.for('react.client.reference');
    function vc(t) {
      if (t == null) return null;
      if (typeof t == 'function') return t.$$typeof === wr ? null : t.displayName || t.name || null;
      if (typeof t == 'string') return t;
      switch (t) {
        case Ka:
          return 'Fragment';
        case sc:
          return 'Profiler';
        case rd:
          return 'StrictMode';
        case dc:
          return 'Suspense';
        case mc:
          return 'SuspenseList';
        case rc:
          return 'Activity';
      }
      if (typeof t == 'object')
        switch (t.$$typeof) {
          case Xe:
            return 'Portal';
          case _l:
            return t.displayName || 'Context';
          case vd:
            return (t._context.displayName || 'Context') + '.Consumer';
          case nf:
            var l = t.render;
            return ((t = t.displayName), t || ((t = l.displayName || l.name || ''), (t = t !== '' ? 'ForwardRef(' + t + ')' : 'ForwardRef')), t);
          case cf:
            return ((l = t.displayName || null), l !== null ? l : vc(t.type) || 'Memo');
          case jl:
            ((l = t._payload), (t = t._init));
            try {
              return vc(t(l));
            } catch {}
        }
      return null;
    }
    var Ge = Array.isArray,
      U = fd.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      V = Lr.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      Sa = { pending: !1, data: null, method: null, action: null },
      hc = [],
      Ja = -1;
    function gl(t) {
      return { current: t };
    }
    function pt(t) {
      0 > Ja || ((t.current = hc[Ja]), (hc[Ja] = null), Ja--);
    }
    function I(t, l) {
      (Ja++, (hc[Ja] = t.current), (t.current = l));
    }
    var yl = gl(null),
      eu = gl(null),
      Il = gl(null),
      gn = gl(null);
    function bn(t, l) {
      switch ((I(Il, l), I(eu, t), I(yl, null), l.nodeType)) {
        case 9:
        case 11:
          t = (t = l.documentElement) && (t = t.namespaceURI) ? Ks(t) : 0;
          break;
        default:
          if (((t = l.tagName), (l = l.namespaceURI))) ((l = Ks(l)), (t = H0(l, t)));
          else
            switch (t) {
              case 'svg':
                t = 1;
                break;
              case 'math':
                t = 2;
                break;
              default:
                t = 0;
            }
      }
      (pt(yl), I(yl, t));
    }
    function se() {
      (pt(yl), pt(eu), pt(Il));
    }
    function yc(t) {
      t.memoizedState !== null && I(gn, t);
      var l = yl.current,
        a = H0(l, t.type);
      l !== a && (I(eu, t), I(yl, a));
    }
    function pn(t) {
      (eu.current === t && (pt(yl), pt(eu)), gn.current === t && (pt(gn), (vu._currentValue = Sa)));
    }
    var xi, Xo;
    function ya(t) {
      if (xi === void 0)
        try {
          throw Error();
        } catch (a) {
          var l = a.stack.trim().match(/\n( *(at )?)/);
          ((xi = (l && l[1]) || ''),
            (Xo =
              -1 <
              a.stack.indexOf(`
    at`)
                ? ' (<anonymous>)'
                : -1 < a.stack.indexOf('@')
                  ? '@unknown:0:0'
                  : ''));
        }
      return (
        `
` +
        xi +
        t +
        Xo
      );
    }
    var Ci = !1;
    function qi(t, l) {
      if (!t || Ci) return '';
      Ci = !0;
      var a = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      try {
        var e = {
          DetermineComponentFrameRoot: function () {
            try {
              if (l) {
                var y = function () {
                  throw Error();
                };
                if (
                  (Object.defineProperty(y.prototype, 'props', {
                    set: function () {
                      throw Error();
                    },
                  }),
                  typeof Reflect == 'object' && Reflect.construct)
                ) {
                  try {
                    Reflect.construct(y, []);
                  } catch (v) {
                    var d = v;
                  }
                  Reflect.construct(t, [], y);
                } else {
                  try {
                    y.call();
                  } catch (v) {
                    d = v;
                  }
                  t.call(y.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (v) {
                  d = v;
                }
                (y = t()) && typeof y.catch == 'function' && y.catch(function () {});
              }
            } catch (v) {
              if (v && d && typeof v.stack == 'string') return [v.stack, d.stack];
            }
            return [null, null];
          },
        };
        e.DetermineComponentFrameRoot.displayName = 'DetermineComponentFrameRoot';
        var u = Object.getOwnPropertyDescriptor(e.DetermineComponentFrameRoot, 'name');
        u && u.configurable && Object.defineProperty(e.DetermineComponentFrameRoot, 'name', { value: 'DetermineComponentFrameRoot' });
        var n = e.DetermineComponentFrameRoot(),
          i = n[0],
          c = n[1];
        if (i && c) {
          var f = i.split(`
`),
            m = c.split(`
`);
          for (u = e = 0; e < f.length && !f[e].includes('DetermineComponentFrameRoot'); ) e++;
          for (; u < m.length && !m[u].includes('DetermineComponentFrameRoot'); ) u++;
          if (e === f.length || u === m.length) for (e = f.length - 1, u = m.length - 1; 1 <= e && 0 <= u && f[e] !== m[u]; ) u--;
          for (; 1 <= e && 0 <= u; e--, u--)
            if (f[e] !== m[u]) {
              if (e !== 1 || u !== 1)
                do
                  if ((e--, u--, 0 > u || f[e] !== m[u])) {
                    var h =
                      `
` + f[e].replace(' at new ', ' at ');
                    return (t.displayName && h.includes('<anonymous>') && (h = h.replace('<anonymous>', t.displayName)), h);
                  }
                while (1 <= e && 0 <= u);
              break;
            }
        }
      } finally {
        ((Ci = !1), (Error.prepareStackTrace = a));
      }
      return (a = t ? t.displayName || t.name : '') ? ya(a) : '';
    }
    function kr(t, l) {
      switch (t.tag) {
        case 26:
        case 27:
        case 5:
          return ya(t.type);
        case 16:
          return ya('Lazy');
        case 13:
          return t.child !== l && l !== null ? ya('Suspense Fallback') : ya('Suspense');
        case 19:
          return ya('SuspenseList');
        case 0:
        case 15:
          return qi(t.type, !1);
        case 11:
          return qi(t.type.render, !1);
        case 1:
          return qi(t.type, !0);
        case 31:
          return ya('Activity');
        default:
          return '';
      }
    }
    function Go(t) {
      try {
        var l = '',
          a = null;
        do ((l += kr(t, a)), (a = t), (t = t.return));
        while (t);
        return l;
      } catch (e) {
        return (
          `
Error generating stack: ` +
          e.message +
          `
` +
          e.stack
        );
      }
    }
    var gc = Object.prototype.hasOwnProperty,
      ff = ht.unstable_scheduleCallback,
      Hi = ht.unstable_cancelCallback,
      Wr = ht.unstable_shouldYield,
      $r = ht.unstable_requestPaint,
      Zt = ht.unstable_now,
      Fr = ht.unstable_getCurrentPriorityLevel,
      hd = ht.unstable_ImmediatePriority,
      yd = ht.unstable_UserBlockingPriority,
      Sn = ht.unstable_NormalPriority,
      Ir = ht.unstable_LowPriority,
      gd = ht.unstable_IdlePriority,
      Pr = ht.log,
      tv = ht.unstable_setDisableYieldValue,
      bu = null,
      Lt = null;
    function wl(t) {
      if ((typeof Pr == 'function' && tv(t), Lt && typeof Lt.setStrictMode == 'function'))
        try {
          Lt.setStrictMode(bu, t);
        } catch {}
    }
    var Vt = Math.clz32 ? Math.clz32 : ev,
      lv = Math.log,
      av = Math.LN2;
    function ev(t) {
      return ((t >>>= 0), t === 0 ? 32 : (31 - ((lv(t) / av) | 0)) | 0);
    }
    var Qu = 256,
      Xu = 262144,
      Gu = 4194304;
    function ga(t) {
      var l = t & 42;
      if (l !== 0) return l;
      switch (t & -t) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 4:
          return 4;
        case 8:
          return 8;
        case 16:
          return 16;
        case 32:
          return 32;
        case 64:
          return 64;
        case 128:
          return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
          return t & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return t & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return t & 62914560;
        case 67108864:
          return 67108864;
        case 134217728:
          return 134217728;
        case 268435456:
          return 268435456;
        case 536870912:
          return 536870912;
        case 1073741824:
          return 0;
        default:
          return t;
      }
    }
    function Jn(t, l, a) {
      var e = t.pendingLanes;
      if (e === 0) return 0;
      var u = 0,
        n = t.suspendedLanes,
        i = t.pingedLanes;
      t = t.warmLanes;
      var c = e & 134217727;
      return (
        c !== 0 ? ((e = c & ~n), e !== 0 ? (u = ga(e)) : ((i &= c), i !== 0 ? (u = ga(i)) : a || ((a = c & ~t), a !== 0 && (u = ga(a))))) : ((c = e & ~n), c !== 0 ? (u = ga(c)) : i !== 0 ? (u = ga(i)) : a || ((a = e & ~t), a !== 0 && (u = ga(a)))),
        u === 0 ? 0 : l !== 0 && l !== u && (l & n) === 0 && ((n = u & -u), (a = l & -l), n >= a || (n === 32 && (a & 4194048) !== 0)) ? l : u
      );
    }
    function pu(t, l) {
      return (t.pendingLanes & ~(t.suspendedLanes & ~t.pingedLanes) & l) === 0;
    }
    function uv(t, l) {
      switch (t) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
          return l + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return l + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return -1;
      }
    }
    function bd() {
      var t = Gu;
      return ((Gu <<= 1), (Gu & 62914560) === 0 && (Gu = 4194304), t);
    }
    function Bi(t) {
      for (var l = [], a = 0; 31 > a; a++) l.push(t);
      return l;
    }
    function Su(t, l) {
      ((t.pendingLanes |= l), l !== 268435456 && ((t.suspendedLanes = 0), (t.pingedLanes = 0), (t.warmLanes = 0)));
    }
    function nv(t, l, a, e, u, n) {
      var i = t.pendingLanes;
      ((t.pendingLanes = a), (t.suspendedLanes = 0), (t.pingedLanes = 0), (t.warmLanes = 0), (t.expiredLanes &= a), (t.entangledLanes &= a), (t.errorRecoveryDisabledLanes &= a), (t.shellSuspendCounter = 0));
      var c = t.entanglements,
        f = t.expirationTimes,
        m = t.hiddenUpdates;
      for (a = i & ~a; 0 < a; ) {
        var h = 31 - Vt(a),
          y = 1 << h;
        ((c[h] = 0), (f[h] = -1));
        var d = m[h];
        if (d !== null)
          for (m[h] = null, h = 0; h < d.length; h++) {
            var v = d[h];
            v !== null && (v.lane &= -536870913);
          }
        a &= ~y;
      }
      (e !== 0 && pd(t, e, 0), n !== 0 && u === 0 && t.tag !== 0 && (t.suspendedLanes |= n & ~(i & ~l)));
    }
    function pd(t, l, a) {
      ((t.pendingLanes |= l), (t.suspendedLanes &= ~l));
      var e = 31 - Vt(l);
      ((t.entangledLanes |= l), (t.entanglements[e] = t.entanglements[e] | 1073741824 | (a & 261930)));
    }
    function Sd(t, l) {
      var a = (t.entangledLanes |= l);
      for (t = t.entanglements; a; ) {
        var e = 31 - Vt(a),
          u = 1 << e;
        ((u & l) | (t[e] & l) && (t[e] |= l), (a &= ~u));
      }
    }
    function Nd(t, l) {
      var a = l & -l;
      return ((a = (a & 42) !== 0 ? 1 : of(a)), (a & (t.suspendedLanes | l)) !== 0 ? 0 : a);
    }
    function of(t) {
      switch (t) {
        case 2:
          t = 1;
          break;
        case 8:
          t = 4;
          break;
        case 32:
          t = 16;
          break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          t = 128;
          break;
        case 268435456:
          t = 134217728;
          break;
        default:
          t = 0;
      }
      return t;
    }
    function sf(t) {
      return ((t &= -t), 2 < t ? (8 < t ? ((t & 134217727) !== 0 ? 32 : 268435456) : 8) : 2);
    }
    function zd() {
      var t = V.p;
      return t !== 0 ? t : ((t = window.event), t === void 0 ? 32 : K0(t.type));
    }
    function jo(t, l) {
      var a = V.p;
      try {
        return ((V.p = t), l());
      } finally {
        V.p = a;
      }
    }
    var da = Math.random().toString(36).slice(2),
      Nt = '__reactFiber$' + da,
      Bt = '__reactProps$' + da,
      Ne = '__reactContainer$' + da,
      bc = '__reactEvents$' + da,
      iv = '__reactListeners$' + da,
      cv = '__reactHandles$' + da,
      Zo = '__reactResources$' + da,
      Nu = '__reactMarker$' + da;
    function df(t) {
      (delete t[Nt], delete t[Bt], delete t[bc], delete t[iv], delete t[cv]);
    }
    function wa(t) {
      var l = t[Nt];
      if (l) return l;
      for (var a = t.parentNode; a; ) {
        if ((l = a[Ne] || a[Nt])) {
          if (((a = l.alternate), l.child !== null || (a !== null && a.child !== null)))
            for (t = $s(t); t !== null; ) {
              if ((a = t[Nt])) return a;
              t = $s(t);
            }
          return l;
        }
        ((t = a), (a = t.parentNode));
      }
      return null;
    }
    function ze(t) {
      if ((t = t[Nt] || t[Ne])) {
        var l = t.tag;
        if (l === 5 || l === 6 || l === 13 || l === 31 || l === 26 || l === 27 || l === 3) return t;
      }
      return null;
    }
    function je(t) {
      var l = t.tag;
      if (l === 5 || l === 26 || l === 27 || l === 6) return t.stateNode;
      throw Error(b(33));
    }
    function ee(t) {
      var l = t[Zo];
      return (l || (l = t[Zo] = { hoistableStyles: new Map(), hoistableScripts: new Map() }), l);
    }
    function bt(t) {
      t[Nu] = !0;
    }
    var Td = new Set(),
      Ed = {};
    function Ua(t, l) {
      (de(t, l), de(t + 'Capture', l));
    }
    function de(t, l) {
      for (Ed[t] = l, t = 0; t < l.length; t++) Td.add(l[t]);
    }
    var fv = RegExp(
        '^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$',
      ),
      Lo = {},
      Vo = {};
    function ov(t) {
      return gc.call(Vo, t) ? !0 : gc.call(Lo, t) ? !1 : fv.test(t) ? (Vo[t] = !0) : ((Lo[t] = !0), !1);
    }
    function ln(t, l, a) {
      if (ov(l))
        if (a === null) t.removeAttribute(l);
        else {
          switch (typeof a) {
            case 'undefined':
            case 'function':
            case 'symbol':
              t.removeAttribute(l);
              return;
            case 'boolean':
              var e = l.toLowerCase().slice(0, 5);
              if (e !== 'data-' && e !== 'aria-') {
                t.removeAttribute(l);
                return;
              }
          }
          t.setAttribute(l, '' + a);
        }
    }
    function ju(t, l, a) {
      if (a === null) t.removeAttribute(l);
      else {
        switch (typeof a) {
          case 'undefined':
          case 'function':
          case 'symbol':
          case 'boolean':
            t.removeAttribute(l);
            return;
        }
        t.setAttribute(l, '' + a);
      }
    }
    function Sl(t, l, a, e) {
      if (e === null) t.removeAttribute(a);
      else {
        switch (typeof e) {
          case 'undefined':
          case 'function':
          case 'symbol':
          case 'boolean':
            t.removeAttribute(a);
            return;
        }
        t.setAttributeNS(l, a, '' + e);
      }
    }
    function Ft(t) {
      switch (typeof t) {
        case 'bigint':
        case 'boolean':
        case 'number':
        case 'string':
        case 'undefined':
          return t;
        case 'object':
          return t;
        default:
          return '';
      }
    }
    function Ad(t) {
      var l = t.type;
      return (t = t.nodeName) && t.toLowerCase() === 'input' && (l === 'checkbox' || l === 'radio');
    }
    function sv(t, l, a) {
      var e = Object.getOwnPropertyDescriptor(t.constructor.prototype, l);
      if (!t.hasOwnProperty(l) && typeof e < 'u' && typeof e.get == 'function' && typeof e.set == 'function') {
        var u = e.get,
          n = e.set;
        return (
          Object.defineProperty(t, l, {
            configurable: !0,
            get: function () {
              return u.call(this);
            },
            set: function (i) {
              ((a = '' + i), n.call(this, i));
            },
          }),
          Object.defineProperty(t, l, { enumerable: e.enumerable }),
          {
            getValue: function () {
              return a;
            },
            setValue: function (i) {
              a = '' + i;
            },
            stopTracking: function () {
              ((t._valueTracker = null), delete t[l]);
            },
          }
        );
      }
    }
    function pc(t) {
      if (!t._valueTracker) {
        var l = Ad(t) ? 'checked' : 'value';
        t._valueTracker = sv(t, l, '' + t[l]);
      }
    }
    function Od(t) {
      if (!t) return !1;
      var l = t._valueTracker;
      if (!l) return !0;
      var a = l.getValue(),
        e = '';
      return (t && (e = Ad(t) ? (t.checked ? 'true' : 'false') : t.value), (t = e), t !== a ? (l.setValue(t), !0) : !1);
    }
    function Nn(t) {
      if (((t = t || (typeof document < 'u' ? document : void 0)), typeof t > 'u')) return null;
      try {
        return t.activeElement || t.body;
      } catch {
        return t.body;
      }
    }
    var dv = /[\n"\\]/g;
    function tl(t) {
      return t.replace(dv, function (l) {
        return '\\' + l.charCodeAt(0).toString(16) + ' ';
      });
    }
    function Sc(t, l, a, e, u, n, i, c) {
      ((t.name = ''),
        i != null && typeof i != 'function' && typeof i != 'symbol' && typeof i != 'boolean' ? (t.type = i) : t.removeAttribute('type'),
        l != null ? (i === 'number' ? ((l === 0 && t.value === '') || t.value != l) && (t.value = '' + Ft(l)) : t.value !== '' + Ft(l) && (t.value = '' + Ft(l))) : (i !== 'submit' && i !== 'reset') || t.removeAttribute('value'),
        l != null ? Nc(t, i, Ft(l)) : a != null ? Nc(t, i, Ft(a)) : e != null && t.removeAttribute('value'),
        u == null && n != null && (t.defaultChecked = !!n),
        u != null && (t.checked = u && typeof u != 'function' && typeof u != 'symbol'),
        c != null && typeof c != 'function' && typeof c != 'symbol' && typeof c != 'boolean' ? (t.name = '' + Ft(c)) : t.removeAttribute('name'));
    }
    function _d(t, l, a, e, u, n, i, c) {
      if ((n != null && typeof n != 'function' && typeof n != 'symbol' && typeof n != 'boolean' && (t.type = n), l != null || a != null)) {
        if (!((n !== 'submit' && n !== 'reset') || l != null)) {
          pc(t);
          return;
        }
        ((a = a != null ? '' + Ft(a) : ''), (l = l != null ? '' + Ft(l) : a), c || l === t.value || (t.value = l), (t.defaultValue = l));
      }
      ((e = e ?? u), (e = typeof e != 'function' && typeof e != 'symbol' && !!e), (t.checked = c ? t.checked : !!e), (t.defaultChecked = !!e), i != null && typeof i != 'function' && typeof i != 'symbol' && typeof i != 'boolean' && (t.name = i), pc(t));
    }
    function Nc(t, l, a) {
      (l === 'number' && Nn(t.ownerDocument) === t) || t.defaultValue === '' + a || (t.defaultValue = '' + a);
    }
    function ue(t, l, a, e) {
      if (((t = t.options), l)) {
        l = {};
        for (var u = 0; u < a.length; u++) l['$' + a[u]] = !0;
        for (a = 0; a < t.length; a++) ((u = l.hasOwnProperty('$' + t[a].value)), t[a].selected !== u && (t[a].selected = u), u && e && (t[a].defaultSelected = !0));
      } else {
        for (a = '' + Ft(a), l = null, u = 0; u < t.length; u++) {
          if (t[u].value === a) {
            ((t[u].selected = !0), e && (t[u].defaultSelected = !0));
            return;
          }
          l !== null || t[u].disabled || (l = t[u]);
        }
        l !== null && (l.selected = !0);
      }
    }
    function Md(t, l, a) {
      if (l != null && ((l = '' + Ft(l)), l !== t.value && (t.value = l), a == null)) {
        t.defaultValue !== l && (t.defaultValue = l);
        return;
      }
      t.defaultValue = a != null ? '' + Ft(a) : '';
    }
    function Dd(t, l, a, e) {
      if (l == null) {
        if (e != null) {
          if (a != null) throw Error(b(92));
          if (Ge(e)) {
            if (1 < e.length) throw Error(b(93));
            e = e[0];
          }
          a = e;
        }
        (a == null && (a = ''), (l = a));
      }
      ((a = Ft(l)), (t.defaultValue = a), (e = t.textContent), e === a && e !== '' && e !== null && (t.value = e), pc(t));
    }
    function me(t, l) {
      if (l) {
        var a = t.firstChild;
        if (a && a === t.lastChild && a.nodeType === 3) {
          a.nodeValue = l;
          return;
        }
      }
      t.textContent = l;
    }
    var mv = new Set(
      'animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp'.split(
        ' ',
      ),
    );
    function Ko(t, l, a) {
      var e = l.indexOf('--') === 0;
      a == null || typeof a == 'boolean' || a === '' ? (e ? t.setProperty(l, '') : l === 'float' ? (t.cssFloat = '') : (t[l] = '')) : e ? t.setProperty(l, a) : typeof a != 'number' || a === 0 || mv.has(l) ? (l === 'float' ? (t.cssFloat = a) : (t[l] = ('' + a).trim())) : (t[l] = a + 'px');
    }
    function Ud(t, l, a) {
      if (l != null && typeof l != 'object') throw Error(b(62));
      if (((t = t.style), a != null)) {
        for (var e in a) !a.hasOwnProperty(e) || (l != null && l.hasOwnProperty(e)) || (e.indexOf('--') === 0 ? t.setProperty(e, '') : e === 'float' ? (t.cssFloat = '') : (t[e] = ''));
        for (var u in l) ((e = l[u]), l.hasOwnProperty(u) && a[u] !== e && Ko(t, u, e));
      } else for (var n in l) l.hasOwnProperty(n) && Ko(t, n, l[n]);
    }
    function mf(t) {
      if (t.indexOf('-') === -1) return !1;
      switch (t) {
        case 'annotation-xml':
        case 'color-profile':
        case 'font-face':
        case 'font-face-src':
        case 'font-face-uri':
        case 'font-face-format':
        case 'font-face-name':
        case 'missing-glyph':
          return !1;
        default:
          return !0;
      }
    }
    var rv = new Map([
        ['acceptCharset', 'accept-charset'],
        ['htmlFor', 'for'],
        ['httpEquiv', 'http-equiv'],
        ['crossOrigin', 'crossorigin'],
        ['accentHeight', 'accent-height'],
        ['alignmentBaseline', 'alignment-baseline'],
        ['arabicForm', 'arabic-form'],
        ['baselineShift', 'baseline-shift'],
        ['capHeight', 'cap-height'],
        ['clipPath', 'clip-path'],
        ['clipRule', 'clip-rule'],
        ['colorInterpolation', 'color-interpolation'],
        ['colorInterpolationFilters', 'color-interpolation-filters'],
        ['colorProfile', 'color-profile'],
        ['colorRendering', 'color-rendering'],
        ['dominantBaseline', 'dominant-baseline'],
        ['enableBackground', 'enable-background'],
        ['fillOpacity', 'fill-opacity'],
        ['fillRule', 'fill-rule'],
        ['floodColor', 'flood-color'],
        ['floodOpacity', 'flood-opacity'],
        ['fontFamily', 'font-family'],
        ['fontSize', 'font-size'],
        ['fontSizeAdjust', 'font-size-adjust'],
        ['fontStretch', 'font-stretch'],
        ['fontStyle', 'font-style'],
        ['fontVariant', 'font-variant'],
        ['fontWeight', 'font-weight'],
        ['glyphName', 'glyph-name'],
        ['glyphOrientationHorizontal', 'glyph-orientation-horizontal'],
        ['glyphOrientationVertical', 'glyph-orientation-vertical'],
        ['horizAdvX', 'horiz-adv-x'],
        ['horizOriginX', 'horiz-origin-x'],
        ['imageRendering', 'image-rendering'],
        ['letterSpacing', 'letter-spacing'],
        ['lightingColor', 'lighting-color'],
        ['markerEnd', 'marker-end'],
        ['markerMid', 'marker-mid'],
        ['markerStart', 'marker-start'],
        ['overlinePosition', 'overline-position'],
        ['overlineThickness', 'overline-thickness'],
        ['paintOrder', 'paint-order'],
        ['panose-1', 'panose-1'],
        ['pointerEvents', 'pointer-events'],
        ['renderingIntent', 'rendering-intent'],
        ['shapeRendering', 'shape-rendering'],
        ['stopColor', 'stop-color'],
        ['stopOpacity', 'stop-opacity'],
        ['strikethroughPosition', 'strikethrough-position'],
        ['strikethroughThickness', 'strikethrough-thickness'],
        ['strokeDasharray', 'stroke-dasharray'],
        ['strokeDashoffset', 'stroke-dashoffset'],
        ['strokeLinecap', 'stroke-linecap'],
        ['strokeLinejoin', 'stroke-linejoin'],
        ['strokeMiterlimit', 'stroke-miterlimit'],
        ['strokeOpacity', 'stroke-opacity'],
        ['strokeWidth', 'stroke-width'],
        ['textAnchor', 'text-anchor'],
        ['textDecoration', 'text-decoration'],
        ['textRendering', 'text-rendering'],
        ['transformOrigin', 'transform-origin'],
        ['underlinePosition', 'underline-position'],
        ['underlineThickness', 'underline-thickness'],
        ['unicodeBidi', 'unicode-bidi'],
        ['unicodeRange', 'unicode-range'],
        ['unitsPerEm', 'units-per-em'],
        ['vAlphabetic', 'v-alphabetic'],
        ['vHanging', 'v-hanging'],
        ['vIdeographic', 'v-ideographic'],
        ['vMathematical', 'v-mathematical'],
        ['vectorEffect', 'vector-effect'],
        ['vertAdvY', 'vert-adv-y'],
        ['vertOriginX', 'vert-origin-x'],
        ['vertOriginY', 'vert-origin-y'],
        ['wordSpacing', 'word-spacing'],
        ['writingMode', 'writing-mode'],
        ['xmlnsXlink', 'xmlns:xlink'],
        ['xHeight', 'x-height'],
      ]),
      vv = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function an(t) {
      return vv.test('' + t) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : t;
    }
    function Ml() {}
    var zc = null;
    function rf(t) {
      return ((t = t.target || t.srcElement || window), t.correspondingUseElement && (t = t.correspondingUseElement), t.nodeType === 3 ? t.parentNode : t);
    }
    var ka = null,
      ne = null;
    function Jo(t) {
      var l = ze(t);
      if (l && (t = l.stateNode)) {
        var a = t[Bt] || null;
        t: switch (((t = l.stateNode), l.type)) {
          case 'input':
            if ((Sc(t, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name), (l = a.name), a.type === 'radio' && l != null)) {
              for (a = t; a.parentNode; ) a = a.parentNode;
              for (a = a.querySelectorAll('input[name="' + tl('' + l) + '"][type="radio"]'), l = 0; l < a.length; l++) {
                var e = a[l];
                if (e !== t && e.form === t.form) {
                  var u = e[Bt] || null;
                  if (!u) throw Error(b(90));
                  Sc(e, u.value, u.defaultValue, u.defaultValue, u.checked, u.defaultChecked, u.type, u.name);
                }
              }
              for (l = 0; l < a.length; l++) ((e = a[l]), e.form === t.form && Od(e));
            }
            break t;
          case 'textarea':
            Md(t, a.value, a.defaultValue);
            break t;
          case 'select':
            ((l = a.value), l != null && ue(t, !!a.multiple, l, !1));
        }
      }
    }
    var Ri = !1;
    function xd(t, l, a) {
      if (Ri) return t(l, a);
      Ri = !0;
      try {
        var e = t(l);
        return e;
      } finally {
        if (((Ri = !1), (ka !== null || ne !== null) && (ui(), ka && ((l = ka), (t = ne), (ne = ka = null), Jo(l), t)))) for (l = 0; l < t.length; l++) Jo(t[l]);
      }
    }
    function uu(t, l) {
      var a = t.stateNode;
      if (a === null) return null;
      var e = a[Bt] || null;
      if (e === null) return null;
      a = e[l];
      t: switch (l) {
        case 'onClick':
        case 'onClickCapture':
        case 'onDoubleClick':
        case 'onDoubleClickCapture':
        case 'onMouseDown':
        case 'onMouseDownCapture':
        case 'onMouseMove':
        case 'onMouseMoveCapture':
        case 'onMouseUp':
        case 'onMouseUpCapture':
        case 'onMouseEnter':
          ((e = !e.disabled) || ((t = t.type), (e = !(t === 'button' || t === 'input' || t === 'select' || t === 'textarea'))), (t = !e));
          break t;
        default:
          t = !1;
      }
      if (t) return null;
      if (a && typeof a != 'function') throw Error(b(231, l, typeof a));
      return a;
    }
    var ql = !(typeof window > 'u' || typeof window.document > 'u' || typeof window.document.createElement > 'u'),
      Tc = !1;
    if (ql)
      try {
        ((Ga = {}),
          Object.defineProperty(Ga, 'passive', {
            get: function () {
              Tc = !0;
            },
          }),
          window.addEventListener('test', Ga, Ga),
          window.removeEventListener('test', Ga, Ga));
      } catch {
        Tc = !1;
      }
    var Ga,
      kl = null,
      vf = null,
      en = null;
    function Cd() {
      if (en) return en;
      var t,
        l = vf,
        a = l.length,
        e,
        u = 'value' in kl ? kl.value : kl.textContent,
        n = u.length;
      for (t = 0; t < a && l[t] === u[t]; t++);
      var i = a - t;
      for (e = 1; e <= i && l[a - e] === u[n - e]; e++);
      return (en = u.slice(t, 1 < e ? 1 - e : void 0));
    }
    function un(t) {
      var l = t.keyCode;
      return ('charCode' in t ? ((t = t.charCode), t === 0 && l === 13 && (t = 13)) : (t = l), t === 10 && (t = 13), 32 <= t || t === 13 ? t : 0);
    }
    function Zu() {
      return !0;
    }
    function wo() {
      return !1;
    }
    function Rt(t) {
      function l(a, e, u, n, i) {
        ((this._reactName = a), (this._targetInst = u), (this.type = e), (this.nativeEvent = n), (this.target = i), (this.currentTarget = null));
        for (var c in t) t.hasOwnProperty(c) && ((a = t[c]), (this[c] = a ? a(n) : n[c]));
        return ((this.isDefaultPrevented = (n.defaultPrevented != null ? n.defaultPrevented : n.returnValue === !1) ? Zu : wo), (this.isPropagationStopped = wo), this);
      }
      return (
        at(l.prototype, {
          preventDefault: function () {
            this.defaultPrevented = !0;
            var a = this.nativeEvent;
            a && (a.preventDefault ? a.preventDefault() : typeof a.returnValue != 'unknown' && (a.returnValue = !1), (this.isDefaultPrevented = Zu));
          },
          stopPropagation: function () {
            var a = this.nativeEvent;
            a && (a.stopPropagation ? a.stopPropagation() : typeof a.cancelBubble != 'unknown' && (a.cancelBubble = !0), (this.isPropagationStopped = Zu));
          },
          persist: function () {},
          isPersistent: Zu,
        }),
        l
      );
    }
    var xa = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (t) {
          return t.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
      },
      wn = Rt(xa),
      zu = at({}, xa, { view: 0, detail: 0 }),
      hv = Rt(zu),
      Yi,
      Qi,
      qe,
      kn = at({}, zu, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: hf,
        button: 0,
        buttons: 0,
        relatedTarget: function (t) {
          return t.relatedTarget === void 0 ? (t.fromElement === t.srcElement ? t.toElement : t.fromElement) : t.relatedTarget;
        },
        movementX: function (t) {
          return 'movementX' in t ? t.movementX : (t !== qe && (qe && t.type === 'mousemove' ? ((Yi = t.screenX - qe.screenX), (Qi = t.screenY - qe.screenY)) : (Qi = Yi = 0), (qe = t)), Yi);
        },
        movementY: function (t) {
          return 'movementY' in t ? t.movementY : Qi;
        },
      }),
      ko = Rt(kn),
      yv = at({}, kn, { dataTransfer: 0 }),
      gv = Rt(yv),
      bv = at({}, zu, { relatedTarget: 0 }),
      Xi = Rt(bv),
      pv = at({}, xa, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
      Sv = Rt(pv),
      Nv = at({}, xa, {
        clipboardData: function (t) {
          return 'clipboardData' in t ? t.clipboardData : window.clipboardData;
        },
      }),
      zv = Rt(Nv),
      Tv = at({}, xa, { data: 0 }),
      Wo = Rt(Tv),
      Ev = { Esc: 'Escape', Spacebar: ' ', Left: 'ArrowLeft', Up: 'ArrowUp', Right: 'ArrowRight', Down: 'ArrowDown', Del: 'Delete', Win: 'OS', Menu: 'ContextMenu', Apps: 'ContextMenu', Scroll: 'ScrollLock', MozPrintableKey: 'Unidentified' },
      Av = {
        8: 'Backspace',
        9: 'Tab',
        12: 'Clear',
        13: 'Enter',
        16: 'Shift',
        17: 'Control',
        18: 'Alt',
        19: 'Pause',
        20: 'CapsLock',
        27: 'Escape',
        32: ' ',
        33: 'PageUp',
        34: 'PageDown',
        35: 'End',
        36: 'Home',
        37: 'ArrowLeft',
        38: 'ArrowUp',
        39: 'ArrowRight',
        40: 'ArrowDown',
        45: 'Insert',
        46: 'Delete',
        112: 'F1',
        113: 'F2',
        114: 'F3',
        115: 'F4',
        116: 'F5',
        117: 'F6',
        118: 'F7',
        119: 'F8',
        120: 'F9',
        121: 'F10',
        122: 'F11',
        123: 'F12',
        144: 'NumLock',
        145: 'ScrollLock',
        224: 'Meta',
      },
      Ov = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
    function _v(t) {
      var l = this.nativeEvent;
      return l.getModifierState ? l.getModifierState(t) : (t = Ov[t]) ? !!l[t] : !1;
    }
    function hf() {
      return _v;
    }
    var Mv = at({}, zu, {
        key: function (t) {
          if (t.key) {
            var l = Ev[t.key] || t.key;
            if (l !== 'Unidentified') return l;
          }
          return t.type === 'keypress' ? ((t = un(t)), t === 13 ? 'Enter' : String.fromCharCode(t)) : t.type === 'keydown' || t.type === 'keyup' ? Av[t.keyCode] || 'Unidentified' : '';
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: hf,
        charCode: function (t) {
          return t.type === 'keypress' ? un(t) : 0;
        },
        keyCode: function (t) {
          return t.type === 'keydown' || t.type === 'keyup' ? t.keyCode : 0;
        },
        which: function (t) {
          return t.type === 'keypress' ? un(t) : t.type === 'keydown' || t.type === 'keyup' ? t.keyCode : 0;
        },
      }),
      Dv = Rt(Mv),
      Uv = at({}, kn, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }),
      $o = Rt(Uv),
      xv = at({}, zu, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: hf }),
      Cv = Rt(xv),
      qv = at({}, xa, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
      Hv = Rt(qv),
      Bv = at({}, kn, {
        deltaX: function (t) {
          return 'deltaX' in t ? t.deltaX : 'wheelDeltaX' in t ? -t.wheelDeltaX : 0;
        },
        deltaY: function (t) {
          return 'deltaY' in t ? t.deltaY : 'wheelDeltaY' in t ? -t.wheelDeltaY : 'wheelDelta' in t ? -t.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0,
      }),
      Rv = Rt(Bv),
      Yv = at({}, xa, { newState: 0, oldState: 0 }),
      Qv = Rt(Yv),
      Xv = [9, 13, 27, 32],
      yf = ql && 'CompositionEvent' in window,
      Ve = null;
    ql && 'documentMode' in document && (Ve = document.documentMode);
    var Gv = ql && 'TextEvent' in window && !Ve,
      qd = ql && (!yf || (Ve && 8 < Ve && 11 >= Ve)),
      Fo = ' ',
      Io = !1;
    function Hd(t, l) {
      switch (t) {
        case 'keyup':
          return Xv.indexOf(l.keyCode) !== -1;
        case 'keydown':
          return l.keyCode !== 229;
        case 'keypress':
        case 'mousedown':
        case 'focusout':
          return !0;
        default:
          return !1;
      }
    }
    function Bd(t) {
      return ((t = t.detail), typeof t == 'object' && 'data' in t ? t.data : null);
    }
    var Wa = !1;
    function jv(t, l) {
      switch (t) {
        case 'compositionend':
          return Bd(l);
        case 'keypress':
          return l.which !== 32 ? null : ((Io = !0), Fo);
        case 'textInput':
          return ((t = l.data), t === Fo && Io ? null : t);
        default:
          return null;
      }
    }
    function Zv(t, l) {
      if (Wa) return t === 'compositionend' || (!yf && Hd(t, l)) ? ((t = Cd()), (en = vf = kl = null), (Wa = !1), t) : null;
      switch (t) {
        case 'paste':
          return null;
        case 'keypress':
          if (!(l.ctrlKey || l.altKey || l.metaKey) || (l.ctrlKey && l.altKey)) {
            if (l.char && 1 < l.char.length) return l.char;
            if (l.which) return String.fromCharCode(l.which);
          }
          return null;
        case 'compositionend':
          return qd && l.locale !== 'ko' ? null : l.data;
        default:
          return null;
      }
    }
    var Lv = { color: !0, date: !0, datetime: !0, 'datetime-local': !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
    function Po(t) {
      var l = t && t.nodeName && t.nodeName.toLowerCase();
      return l === 'input' ? !!Lv[t.type] : l === 'textarea';
    }
    function Rd(t, l, a, e) {
      (ka ? (ne ? ne.push(e) : (ne = [e])) : (ka = e), (l = Xn(l, 'onChange')), 0 < l.length && ((a = new wn('onChange', 'change', null, a, e)), t.push({ event: a, listeners: l })));
    }
    var Ke = null,
      nu = null;
    function Vv(t) {
      x0(t, 0);
    }
    function Wn(t) {
      var l = je(t);
      if (Od(l)) return t;
    }
    function ts(t, l) {
      if (t === 'change') return l;
    }
    var Yd = !1;
    ql && (ql ? ((Vu = 'oninput' in document), Vu || ((Gi = document.createElement('div')), Gi.setAttribute('oninput', 'return;'), (Vu = typeof Gi.oninput == 'function')), (Lu = Vu)) : (Lu = !1), (Yd = Lu && (!document.documentMode || 9 < document.documentMode)));
    var Lu, Vu, Gi;
    function ls() {
      Ke && (Ke.detachEvent('onpropertychange', Qd), (nu = Ke = null));
    }
    function Qd(t) {
      if (t.propertyName === 'value' && Wn(nu)) {
        var l = [];
        (Rd(l, nu, t, rf(t)), xd(Vv, l));
      }
    }
    function Kv(t, l, a) {
      t === 'focusin' ? (ls(), (Ke = l), (nu = a), Ke.attachEvent('onpropertychange', Qd)) : t === 'focusout' && ls();
    }
    function Jv(t) {
      if (t === 'selectionchange' || t === 'keyup' || t === 'keydown') return Wn(nu);
    }
    function wv(t, l) {
      if (t === 'click') return Wn(l);
    }
    function kv(t, l) {
      if (t === 'input' || t === 'change') return Wn(l);
    }
    function Wv(t, l) {
      return (t === l && (t !== 0 || 1 / t === 1 / l)) || (t !== t && l !== l);
    }
    var Jt = typeof Object.is == 'function' ? Object.is : Wv;
    function iu(t, l) {
      if (Jt(t, l)) return !0;
      if (typeof t != 'object' || t === null || typeof l != 'object' || l === null) return !1;
      var a = Object.keys(t),
        e = Object.keys(l);
      if (a.length !== e.length) return !1;
      for (e = 0; e < a.length; e++) {
        var u = a[e];
        if (!gc.call(l, u) || !Jt(t[u], l[u])) return !1;
      }
      return !0;
    }
    function as(t) {
      for (; t && t.firstChild; ) t = t.firstChild;
      return t;
    }
    function es(t, l) {
      var a = as(t);
      t = 0;
      for (var e; a; ) {
        if (a.nodeType === 3) {
          if (((e = t + a.textContent.length), t <= l && e >= l)) return { node: a, offset: l - t };
          t = e;
        }
        t: {
          for (; a; ) {
            if (a.nextSibling) {
              a = a.nextSibling;
              break t;
            }
            a = a.parentNode;
          }
          a = void 0;
        }
        a = as(a);
      }
    }
    function Xd(t, l) {
      return t && l ? (t === l ? !0 : t && t.nodeType === 3 ? !1 : l && l.nodeType === 3 ? Xd(t, l.parentNode) : 'contains' in t ? t.contains(l) : t.compareDocumentPosition ? !!(t.compareDocumentPosition(l) & 16) : !1) : !1;
    }
    function Gd(t) {
      t = t != null && t.ownerDocument != null && t.ownerDocument.defaultView != null ? t.ownerDocument.defaultView : window;
      for (var l = Nn(t.document); l instanceof t.HTMLIFrameElement; ) {
        try {
          var a = typeof l.contentWindow.location.href == 'string';
        } catch {
          a = !1;
        }
        if (a) t = l.contentWindow;
        else break;
        l = Nn(t.document);
      }
      return l;
    }
    function gf(t) {
      var l = t && t.nodeName && t.nodeName.toLowerCase();
      return l && ((l === 'input' && (t.type === 'text' || t.type === 'search' || t.type === 'tel' || t.type === 'url' || t.type === 'password')) || l === 'textarea' || t.contentEditable === 'true');
    }
    var $v = ql && 'documentMode' in document && 11 >= document.documentMode,
      $a = null,
      Ec = null,
      Je = null,
      Ac = !1;
    function us(t, l, a) {
      var e = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
      Ac ||
        $a == null ||
        $a !== Nn(e) ||
        ((e = $a),
        'selectionStart' in e && gf(e) ? (e = { start: e.selectionStart, end: e.selectionEnd }) : ((e = ((e.ownerDocument && e.ownerDocument.defaultView) || window).getSelection()), (e = { anchorNode: e.anchorNode, anchorOffset: e.anchorOffset, focusNode: e.focusNode, focusOffset: e.focusOffset })),
        (Je && iu(Je, e)) || ((Je = e), (e = Xn(Ec, 'onSelect')), 0 < e.length && ((l = new wn('onSelect', 'select', null, l, a)), t.push({ event: l, listeners: e }), (l.target = $a))));
    }
    function ha(t, l) {
      var a = {};
      return ((a[t.toLowerCase()] = l.toLowerCase()), (a['Webkit' + t] = 'webkit' + l), (a['Moz' + t] = 'moz' + l), a);
    }
    var Fa = {
        animationend: ha('Animation', 'AnimationEnd'),
        animationiteration: ha('Animation', 'AnimationIteration'),
        animationstart: ha('Animation', 'AnimationStart'),
        transitionrun: ha('Transition', 'TransitionRun'),
        transitionstart: ha('Transition', 'TransitionStart'),
        transitioncancel: ha('Transition', 'TransitionCancel'),
        transitionend: ha('Transition', 'TransitionEnd'),
      },
      ji = {},
      jd = {};
    ql && ((jd = document.createElement('div').style), 'AnimationEvent' in window || (delete Fa.animationend.animation, delete Fa.animationiteration.animation, delete Fa.animationstart.animation), 'TransitionEvent' in window || delete Fa.transitionend.transition);
    function Ca(t) {
      if (ji[t]) return ji[t];
      if (!Fa[t]) return t;
      var l = Fa[t],
        a;
      for (a in l) if (l.hasOwnProperty(a) && a in jd) return (ji[t] = l[a]);
      return t;
    }
    var Zd = Ca('animationend'),
      Ld = Ca('animationiteration'),
      Vd = Ca('animationstart'),
      Fv = Ca('transitionrun'),
      Iv = Ca('transitionstart'),
      Pv = Ca('transitioncancel'),
      Kd = Ca('transitionend'),
      Jd = new Map(),
      Oc =
        'abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
          ' ',
        );
    Oc.push('scrollEnd');
    function ol(t, l) {
      (Jd.set(t, l), Ua(l, [t]));
    }
    var zn =
        typeof reportError == 'function'
          ? reportError
          : function (t) {
              if (typeof window == 'object' && typeof window.ErrorEvent == 'function') {
                var l = new window.ErrorEvent('error', { bubbles: !0, cancelable: !0, message: typeof t == 'object' && t !== null && typeof t.message == 'string' ? String(t.message) : String(t), error: t });
                if (!window.dispatchEvent(l)) return;
              } else if (typeof process == 'object' && typeof process.emit == 'function') {
                process.emit('uncaughtException', t);
                return;
              }
              console.error(t);
            },
      $t = [],
      Ia = 0,
      bf = 0;
    function $n() {
      for (var t = Ia, l = (bf = Ia = 0); l < t; ) {
        var a = $t[l];
        $t[l++] = null;
        var e = $t[l];
        $t[l++] = null;
        var u = $t[l];
        $t[l++] = null;
        var n = $t[l];
        if ((($t[l++] = null), e !== null && u !== null)) {
          var i = e.pending;
          (i === null ? (u.next = u) : ((u.next = i.next), (i.next = u)), (e.pending = u));
        }
        n !== 0 && wd(a, u, n);
      }
    }
    function Fn(t, l, a, e) {
      (($t[Ia++] = t), ($t[Ia++] = l), ($t[Ia++] = a), ($t[Ia++] = e), (bf |= e), (t.lanes |= e), (t = t.alternate), t !== null && (t.lanes |= e));
    }
    function pf(t, l, a, e) {
      return (Fn(t, l, a, e), Tn(t));
    }
    function qa(t, l) {
      return (Fn(t, null, null, l), Tn(t));
    }
    function wd(t, l, a) {
      t.lanes |= a;
      var e = t.alternate;
      e !== null && (e.lanes |= a);
      for (var u = !1, n = t.return; n !== null; ) ((n.childLanes |= a), (e = n.alternate), e !== null && (e.childLanes |= a), n.tag === 22 && ((t = n.stateNode), t === null || t._visibility & 1 || (u = !0)), (t = n), (n = n.return));
      return t.tag === 3 ? ((n = t.stateNode), u && l !== null && ((u = 31 - Vt(a)), (t = n.hiddenUpdates), (e = t[u]), e === null ? (t[u] = [l]) : e.push(l), (l.lane = a | 536870912)), n) : null;
    }
    function Tn(t) {
      if (50 < lu) throw ((lu = 0), (wc = null), Error(b(185)));
      for (var l = t.return; l !== null; ) ((t = l), (l = t.return));
      return t.tag === 3 ? t.stateNode : null;
    }
    var Pa = {};
    function th(t, l, a, e) {
      ((this.tag = t),
        (this.key = a),
        (this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null),
        (this.index = 0),
        (this.refCleanup = this.ref = null),
        (this.pendingProps = l),
        (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
        (this.mode = e),
        (this.subtreeFlags = this.flags = 0),
        (this.deletions = null),
        (this.childLanes = this.lanes = 0),
        (this.alternate = null));
    }
    function Gt(t, l, a, e) {
      return new th(t, l, a, e);
    }
    function Sf(t) {
      return ((t = t.prototype), !(!t || !t.isReactComponent));
    }
    function Ul(t, l) {
      var a = t.alternate;
      return (
        a === null ? ((a = Gt(t.tag, l, t.key, t.mode)), (a.elementType = t.elementType), (a.type = t.type), (a.stateNode = t.stateNode), (a.alternate = t), (t.alternate = a)) : ((a.pendingProps = l), (a.type = t.type), (a.flags = 0), (a.subtreeFlags = 0), (a.deletions = null)),
        (a.flags = t.flags & 65011712),
        (a.childLanes = t.childLanes),
        (a.lanes = t.lanes),
        (a.child = t.child),
        (a.memoizedProps = t.memoizedProps),
        (a.memoizedState = t.memoizedState),
        (a.updateQueue = t.updateQueue),
        (l = t.dependencies),
        (a.dependencies = l === null ? null : { lanes: l.lanes, firstContext: l.firstContext }),
        (a.sibling = t.sibling),
        (a.index = t.index),
        (a.ref = t.ref),
        (a.refCleanup = t.refCleanup),
        a
      );
    }
    function kd(t, l) {
      t.flags &= 65011714;
      var a = t.alternate;
      return (
        a === null
          ? ((t.childLanes = 0), (t.lanes = l), (t.child = null), (t.subtreeFlags = 0), (t.memoizedProps = null), (t.memoizedState = null), (t.updateQueue = null), (t.dependencies = null), (t.stateNode = null))
          : ((t.childLanes = a.childLanes),
            (t.lanes = a.lanes),
            (t.child = a.child),
            (t.subtreeFlags = 0),
            (t.deletions = null),
            (t.memoizedProps = a.memoizedProps),
            (t.memoizedState = a.memoizedState),
            (t.updateQueue = a.updateQueue),
            (t.type = a.type),
            (l = a.dependencies),
            (t.dependencies = l === null ? null : { lanes: l.lanes, firstContext: l.firstContext })),
        t
      );
    }
    function nn(t, l, a, e, u, n) {
      var i = 0;
      if (((e = t), typeof t == 'function')) Sf(t) && (i = 1);
      else if (typeof t == 'string') i = ey(t, a, yl.current) ? 26 : t === 'html' || t === 'head' || t === 'body' ? 27 : 5;
      else
        t: switch (t) {
          case rc:
            return ((t = Gt(31, a, l, u)), (t.elementType = rc), (t.lanes = n), t);
          case Ka:
            return Na(a.children, u, n, l);
          case rd:
            ((i = 8), (u |= 24));
            break;
          case sc:
            return ((t = Gt(12, a, l, u | 2)), (t.elementType = sc), (t.lanes = n), t);
          case dc:
            return ((t = Gt(13, a, l, u)), (t.elementType = dc), (t.lanes = n), t);
          case mc:
            return ((t = Gt(19, a, l, u)), (t.elementType = mc), (t.lanes = n), t);
          default:
            if (typeof t == 'object' && t !== null)
              switch (t.$$typeof) {
                case _l:
                  i = 10;
                  break t;
                case vd:
                  i = 9;
                  break t;
                case nf:
                  i = 11;
                  break t;
                case cf:
                  i = 14;
                  break t;
                case jl:
                  ((i = 16), (e = null));
                  break t;
              }
            ((i = 29), (a = Error(b(130, t === null ? 'null' : typeof t, ''))), (e = null));
        }
      return ((l = Gt(i, a, l, u)), (l.elementType = t), (l.type = e), (l.lanes = n), l);
    }
    function Na(t, l, a, e) {
      return ((t = Gt(7, t, e, l)), (t.lanes = a), t);
    }
    function Zi(t, l, a) {
      return ((t = Gt(6, t, null, l)), (t.lanes = a), t);
    }
    function Wd(t) {
      var l = Gt(18, null, null, 0);
      return ((l.stateNode = t), l);
    }
    function Li(t, l, a) {
      return ((l = Gt(4, t.children !== null ? t.children : [], t.key, l)), (l.lanes = a), (l.stateNode = { containerInfo: t.containerInfo, pendingChildren: null, implementation: t.implementation }), l);
    }
    var ns = new WeakMap();
    function ll(t, l) {
      if (typeof t == 'object' && t !== null) {
        var a = ns.get(t);
        return a !== void 0 ? a : ((l = { value: t, source: l, stack: Go(l) }), ns.set(t, l), l);
      }
      return { value: t, source: l, stack: Go(l) };
    }
    var te = [],
      le = 0,
      En = null,
      cu = 0,
      It = [],
      Pt = 0,
      ca = null,
      rl = 1,
      vl = '';
    function Al(t, l) {
      ((te[le++] = cu), (te[le++] = En), (En = t), (cu = l));
    }
    function $d(t, l, a) {
      ((It[Pt++] = rl), (It[Pt++] = vl), (It[Pt++] = ca), (ca = t));
      var e = rl;
      t = vl;
      var u = 32 - Vt(e) - 1;
      ((e &= ~(1 << u)), (a += 1));
      var n = 32 - Vt(l) + u;
      if (30 < n) {
        var i = u - (u % 5);
        ((n = (e & ((1 << i) - 1)).toString(32)), (e >>= i), (u -= i), (rl = (1 << (32 - Vt(l) + u)) | (a << u) | e), (vl = n + t));
      } else ((rl = (1 << n) | (a << u) | e), (vl = t));
    }
    function Nf(t) {
      t.return !== null && (Al(t, 1), $d(t, 1, 0));
    }
    function zf(t) {
      for (; t === En; ) ((En = te[--le]), (te[le] = null), (cu = te[--le]), (te[le] = null));
      for (; t === ca; ) ((ca = It[--Pt]), (It[Pt] = null), (vl = It[--Pt]), (It[Pt] = null), (rl = It[--Pt]), (It[Pt] = null));
    }
    function Fd(t, l) {
      ((It[Pt++] = rl), (It[Pt++] = vl), (It[Pt++] = ca), (rl = l.id), (vl = l.overflow), (ca = t));
    }
    var zt = null,
      lt = null,
      Z = !1,
      Pl = null,
      al = !1,
      _c = Error(b(519));
    function fa(t) {
      var l = Error(b(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? 'text' : 'HTML', ''));
      throw (fu(ll(l, t)), _c);
    }
    function is(t) {
      var l = t.stateNode,
        a = t.type,
        e = t.memoizedProps;
      switch (((l[Nt] = t), (l[Bt] = e), a)) {
        case 'dialog':
          (Q('cancel', l), Q('close', l));
          break;
        case 'iframe':
        case 'object':
        case 'embed':
          Q('load', l);
          break;
        case 'video':
        case 'audio':
          for (a = 0; a < mu.length; a++) Q(mu[a], l);
          break;
        case 'source':
          Q('error', l);
          break;
        case 'img':
        case 'image':
        case 'link':
          (Q('error', l), Q('load', l));
          break;
        case 'details':
          Q('toggle', l);
          break;
        case 'input':
          (Q('invalid', l), _d(l, e.value, e.defaultValue, e.checked, e.defaultChecked, e.type, e.name, !0));
          break;
        case 'select':
          Q('invalid', l);
          break;
        case 'textarea':
          (Q('invalid', l), Dd(l, e.value, e.defaultValue, e.children));
      }
      ((a = e.children),
        (typeof a != 'string' && typeof a != 'number' && typeof a != 'bigint') || l.textContent === '' + a || e.suppressHydrationWarning === !0 || q0(l.textContent, a)
          ? (e.popover != null && (Q('beforetoggle', l), Q('toggle', l)), e.onScroll != null && Q('scroll', l), e.onScrollEnd != null && Q('scrollend', l), e.onClick != null && (l.onclick = Ml), (l = !0))
          : (l = !1),
        l || fa(t, !0));
    }
    function cs(t) {
      for (zt = t.return; zt; )
        switch (zt.tag) {
          case 5:
          case 31:
          case 13:
            al = !1;
            return;
          case 27:
          case 3:
            al = !0;
            return;
          default:
            zt = zt.return;
        }
    }
    function ja(t) {
      if (t !== zt) return !1;
      if (!Z) return (cs(t), (Z = !0), !1);
      var l = t.tag,
        a;
      if (((a = l !== 3 && l !== 27) && ((a = l === 5) && ((a = t.type), (a = !(a !== 'form' && a !== 'button') || Ic(t.type, t.memoizedProps))), (a = !a)), a && lt && fa(t), cs(t), l === 13)) {
        if (((t = t.memoizedState), (t = t !== null ? t.dehydrated : null), !t)) throw Error(b(317));
        lt = Ws(t);
      } else if (l === 31) {
        if (((t = t.memoizedState), (t = t !== null ? t.dehydrated : null), !t)) throw Error(b(317));
        lt = Ws(t);
      } else l === 27 ? ((l = lt), ma(t.type) ? ((t = af), (af = null), (lt = t)) : (lt = l)) : (lt = zt ? ul(t.stateNode.nextSibling) : null);
      return !0;
    }
    function Aa() {
      ((lt = zt = null), (Z = !1));
    }
    function Vi() {
      var t = Pl;
      return (t !== null && (qt === null ? (qt = t) : qt.push.apply(qt, t), (Pl = null)), t);
    }
    function fu(t) {
      Pl === null ? (Pl = [t]) : Pl.push(t);
    }
    var Mc = gl(null),
      Ha = null,
      Dl = null;
    function Ll(t, l, a) {
      (I(Mc, l._currentValue), (l._currentValue = a));
    }
    function xl(t) {
      ((t._currentValue = Mc.current), pt(Mc));
    }
    function Dc(t, l, a) {
      for (; t !== null; ) {
        var e = t.alternate;
        if (((t.childLanes & l) !== l ? ((t.childLanes |= l), e !== null && (e.childLanes |= l)) : e !== null && (e.childLanes & l) !== l && (e.childLanes |= l), t === a)) break;
        t = t.return;
      }
    }
    function Uc(t, l, a, e) {
      var u = t.child;
      for (u !== null && (u.return = t); u !== null; ) {
        var n = u.dependencies;
        if (n !== null) {
          var i = u.child;
          n = n.firstContext;
          t: for (; n !== null; ) {
            var c = n;
            n = u;
            for (var f = 0; f < l.length; f++)
              if (c.context === l[f]) {
                ((n.lanes |= a), (c = n.alternate), c !== null && (c.lanes |= a), Dc(n.return, a, t), e || (i = null));
                break t;
              }
            n = c.next;
          }
        } else if (u.tag === 18) {
          if (((i = u.return), i === null)) throw Error(b(341));
          ((i.lanes |= a), (n = i.alternate), n !== null && (n.lanes |= a), Dc(i, a, t), (i = null));
        } else i = u.child;
        if (i !== null) i.return = u;
        else
          for (i = u; i !== null; ) {
            if (i === t) {
              i = null;
              break;
            }
            if (((u = i.sibling), u !== null)) {
              ((u.return = i.return), (i = u));
              break;
            }
            i = i.return;
          }
        u = i;
      }
    }
    function Te(t, l, a, e) {
      t = null;
      for (var u = l, n = !1; u !== null; ) {
        if (!n) {
          if ((u.flags & 524288) !== 0) n = !0;
          else if ((u.flags & 262144) !== 0) break;
        }
        if (u.tag === 10) {
          var i = u.alternate;
          if (i === null) throw Error(b(387));
          if (((i = i.memoizedProps), i !== null)) {
            var c = u.type;
            Jt(u.pendingProps.value, i.value) || (t !== null ? t.push(c) : (t = [c]));
          }
        } else if (u === gn.current) {
          if (((i = u.alternate), i === null)) throw Error(b(387));
          i.memoizedState.memoizedState !== u.memoizedState.memoizedState && (t !== null ? t.push(vu) : (t = [vu]));
        }
        u = u.return;
      }
      (t !== null && Uc(l, t, a, e), (l.flags |= 262144));
    }
    function An(t) {
      for (t = t.firstContext; t !== null; ) {
        if (!Jt(t.context._currentValue, t.memoizedValue)) return !0;
        t = t.next;
      }
      return !1;
    }
    function Oa(t) {
      ((Ha = t), (Dl = null), (t = t.dependencies), t !== null && (t.firstContext = null));
    }
    function Tt(t) {
      return Id(Ha, t);
    }
    function Ku(t, l) {
      return (Ha === null && Oa(t), Id(t, l));
    }
    function Id(t, l) {
      var a = l._currentValue;
      if (((l = { context: l, memoizedValue: a, next: null }), Dl === null)) {
        if (t === null) throw Error(b(308));
        ((Dl = l), (t.dependencies = { lanes: 0, firstContext: l }), (t.flags |= 524288));
      } else Dl = Dl.next = l;
      return a;
    }
    var lh =
        typeof AbortController < 'u'
          ? AbortController
          : function () {
              var t = [],
                l = (this.signal = {
                  aborted: !1,
                  addEventListener: function (a, e) {
                    t.push(e);
                  },
                });
              this.abort = function () {
                ((l.aborted = !0),
                  t.forEach(function (a) {
                    return a();
                  }));
              };
            },
      ah = ht.unstable_scheduleCallback,
      eh = ht.unstable_NormalPriority,
      mt = { $$typeof: _l, Consumer: null, Provider: null, _currentValue: null, _currentValue2: null, _threadCount: 0 };
    function Tf() {
      return { controller: new lh(), data: new Map(), refCount: 0 };
    }
    function Tu(t) {
      (t.refCount--,
        t.refCount === 0 &&
          ah(eh, function () {
            t.controller.abort();
          }));
    }
    var we = null,
      xc = 0,
      re = 0,
      ie = null;
    function uh(t, l) {
      if (we === null) {
        var a = (we = []);
        ((xc = 0),
          (re = kf()),
          (ie = {
            status: 'pending',
            value: void 0,
            then: function (e) {
              a.push(e);
            },
          }));
      }
      return (xc++, l.then(fs, fs), l);
    }
    function fs() {
      if (--xc === 0 && we !== null) {
        ie !== null && (ie.status = 'fulfilled');
        var t = we;
        ((we = null), (re = 0), (ie = null));
        for (var l = 0; l < t.length; l++) (0, t[l])();
      }
    }
    function nh(t, l) {
      var a = [],
        e = {
          status: 'pending',
          value: null,
          reason: null,
          then: function (u) {
            a.push(u);
          },
        };
      return (
        t.then(
          function () {
            ((e.status = 'fulfilled'), (e.value = l));
            for (var u = 0; u < a.length; u++) (0, a[u])(l);
          },
          function (u) {
            for (e.status = 'rejected', e.reason = u, u = 0; u < a.length; u++) (0, a[u])(void 0);
          },
        ),
        e
      );
    }
    var os = U.S;
    U.S = function (t, l) {
      ((m0 = Zt()), typeof l == 'object' && l !== null && typeof l.then == 'function' && uh(t, l), os !== null && os(t, l));
    };
    var za = gl(null);
    function Ef() {
      var t = za.current;
      return t !== null ? t : F.pooledCache;
    }
    function cn(t, l) {
      l === null ? I(za, za.current) : I(za, l.pool);
    }
    function Pd() {
      var t = Ef();
      return t === null ? null : { parent: mt._currentValue, pool: t };
    }
    var Ee = Error(b(460)),
      Af = Error(b(474)),
      In = Error(b(542)),
      On = { then: function () {} };
    function ss(t) {
      return ((t = t.status), t === 'fulfilled' || t === 'rejected');
    }
    function tm(t, l, a) {
      switch (((a = t[a]), a === void 0 ? t.push(l) : a !== l && (l.then(Ml, Ml), (l = a)), l.status)) {
        case 'fulfilled':
          return l.value;
        case 'rejected':
          throw ((t = l.reason), ms(t), t);
        default:
          if (typeof l.status == 'string') l.then(Ml, Ml);
          else {
            if (((t = F), t !== null && 100 < t.shellSuspendCounter)) throw Error(b(482));
            ((t = l),
              (t.status = 'pending'),
              t.then(
                function (e) {
                  if (l.status === 'pending') {
                    var u = l;
                    ((u.status = 'fulfilled'), (u.value = e));
                  }
                },
                function (e) {
                  if (l.status === 'pending') {
                    var u = l;
                    ((u.status = 'rejected'), (u.reason = e));
                  }
                },
              ));
          }
          switch (l.status) {
            case 'fulfilled':
              return l.value;
            case 'rejected':
              throw ((t = l.reason), ms(t), t);
          }
          throw ((Ta = l), Ee);
      }
    }
    function ba(t) {
      try {
        var l = t._init;
        return l(t._payload);
      } catch (a) {
        throw a !== null && typeof a == 'object' && typeof a.then == 'function' ? ((Ta = a), Ee) : a;
      }
    }
    var Ta = null;
    function ds() {
      if (Ta === null) throw Error(b(459));
      var t = Ta;
      return ((Ta = null), t);
    }
    function ms(t) {
      if (t === Ee || t === In) throw Error(b(483));
    }
    var ce = null,
      ou = 0;
    function Ju(t) {
      var l = ou;
      return ((ou += 1), ce === null && (ce = []), tm(ce, t, l));
    }
    function He(t, l) {
      ((l = l.props.ref), (t.ref = l !== void 0 ? l : null));
    }
    function wu(t, l) {
      throw l.$$typeof === Kr ? Error(b(525)) : ((t = Object.prototype.toString.call(l)), Error(b(31, t === '[object Object]' ? 'object with keys {' + Object.keys(l).join(', ') + '}' : t)));
    }
    function lm(t) {
      function l(s, o) {
        if (t) {
          var r = s.deletions;
          r === null ? ((s.deletions = [o]), (s.flags |= 16)) : r.push(o);
        }
      }
      function a(s, o) {
        if (!t) return null;
        for (; o !== null; ) (l(s, o), (o = o.sibling));
        return null;
      }
      function e(s) {
        for (var o = new Map(); s !== null; ) (s.key !== null ? o.set(s.key, s) : o.set(s.index, s), (s = s.sibling));
        return o;
      }
      function u(s, o) {
        return ((s = Ul(s, o)), (s.index = 0), (s.sibling = null), s);
      }
      function n(s, o, r) {
        return ((s.index = r), t ? ((r = s.alternate), r !== null ? ((r = r.index), r < o ? ((s.flags |= 67108866), o) : r) : ((s.flags |= 67108866), o)) : ((s.flags |= 1048576), o));
      }
      function i(s) {
        return (t && s.alternate === null && (s.flags |= 67108866), s);
      }
      function c(s, o, r, g) {
        return o === null || o.tag !== 6 ? ((o = Zi(r, s.mode, g)), (o.return = s), o) : ((o = u(o, r)), (o.return = s), o);
      }
      function f(s, o, r, g) {
        var z = r.type;
        return z === Ka
          ? h(s, o, r.props.children, g, r.key)
          : o !== null && (o.elementType === z || (typeof z == 'object' && z !== null && z.$$typeof === jl && ba(z) === o.type))
            ? ((o = u(o, r.props)), He(o, r), (o.return = s), o)
            : ((o = nn(r.type, r.key, r.props, null, s.mode, g)), He(o, r), (o.return = s), o);
      }
      function m(s, o, r, g) {
        return o === null || o.tag !== 4 || o.stateNode.containerInfo !== r.containerInfo || o.stateNode.implementation !== r.implementation ? ((o = Li(r, s.mode, g)), (o.return = s), o) : ((o = u(o, r.children || [])), (o.return = s), o);
      }
      function h(s, o, r, g, z) {
        return o === null || o.tag !== 7 ? ((o = Na(r, s.mode, g, z)), (o.return = s), o) : ((o = u(o, r)), (o.return = s), o);
      }
      function y(s, o, r) {
        if ((typeof o == 'string' && o !== '') || typeof o == 'number' || typeof o == 'bigint') return ((o = Zi('' + o, s.mode, r)), (o.return = s), o);
        if (typeof o == 'object' && o !== null) {
          switch (o.$$typeof) {
            case Yu:
              return ((r = nn(o.type, o.key, o.props, null, s.mode, r)), He(r, o), (r.return = s), r);
            case Xe:
              return ((o = Li(o, s.mode, r)), (o.return = s), o);
            case jl:
              return ((o = ba(o)), y(s, o, r));
          }
          if (Ge(o) || Ce(o)) return ((o = Na(o, s.mode, r, null)), (o.return = s), o);
          if (typeof o.then == 'function') return y(s, Ju(o), r);
          if (o.$$typeof === _l) return y(s, Ku(s, o), r);
          wu(s, o);
        }
        return null;
      }
      function d(s, o, r, g) {
        var z = o !== null ? o.key : null;
        if ((typeof r == 'string' && r !== '') || typeof r == 'number' || typeof r == 'bigint') return z !== null ? null : c(s, o, '' + r, g);
        if (typeof r == 'object' && r !== null) {
          switch (r.$$typeof) {
            case Yu:
              return r.key === z ? f(s, o, r, g) : null;
            case Xe:
              return r.key === z ? m(s, o, r, g) : null;
            case jl:
              return ((r = ba(r)), d(s, o, r, g));
          }
          if (Ge(r) || Ce(r)) return z !== null ? null : h(s, o, r, g, null);
          if (typeof r.then == 'function') return d(s, o, Ju(r), g);
          if (r.$$typeof === _l) return d(s, o, Ku(s, r), g);
          wu(s, r);
        }
        return null;
      }
      function v(s, o, r, g, z) {
        if ((typeof g == 'string' && g !== '') || typeof g == 'number' || typeof g == 'bigint') return ((s = s.get(r) || null), c(o, s, '' + g, z));
        if (typeof g == 'object' && g !== null) {
          switch (g.$$typeof) {
            case Yu:
              return ((s = s.get(g.key === null ? r : g.key) || null), f(o, s, g, z));
            case Xe:
              return ((s = s.get(g.key === null ? r : g.key) || null), m(o, s, g, z));
            case jl:
              return ((g = ba(g)), v(s, o, r, g, z));
          }
          if (Ge(g) || Ce(g)) return ((s = s.get(r) || null), h(o, s, g, z, null));
          if (typeof g.then == 'function') return v(s, o, r, Ju(g), z);
          if (g.$$typeof === _l) return v(s, o, r, Ku(o, g), z);
          wu(o, g);
        }
        return null;
      }
      function N(s, o, r, g) {
        for (var z = null, R = null, p = o, T = (o = 0), q = null; p !== null && T < r.length; T++) {
          p.index > T ? ((q = p), (p = null)) : (q = p.sibling);
          var Y = d(s, p, r[T], g);
          if (Y === null) {
            p === null && (p = q);
            break;
          }
          (t && p && Y.alternate === null && l(s, p), (o = n(Y, o, T)), R === null ? (z = Y) : (R.sibling = Y), (R = Y), (p = q));
        }
        if (T === r.length) return (a(s, p), Z && Al(s, T), z);
        if (p === null) {
          for (; T < r.length; T++) ((p = y(s, r[T], g)), p !== null && ((o = n(p, o, T)), R === null ? (z = p) : (R.sibling = p), (R = p)));
          return (Z && Al(s, T), z);
        }
        for (p = e(p); T < r.length; T++) ((q = v(p, s, T, r[T], g)), q !== null && (t && q.alternate !== null && p.delete(q.key === null ? T : q.key), (o = n(q, o, T)), R === null ? (z = q) : (R.sibling = q), (R = q)));
        return (
          t &&
            p.forEach(function (Dt) {
              return l(s, Dt);
            }),
          Z && Al(s, T),
          z
        );
      }
      function E(s, o, r, g) {
        if (r == null) throw Error(b(151));
        for (var z = null, R = null, p = o, T = (o = 0), q = null, Y = r.next(); p !== null && !Y.done; T++, Y = r.next()) {
          p.index > T ? ((q = p), (p = null)) : (q = p.sibling);
          var Dt = d(s, p, Y.value, g);
          if (Dt === null) {
            p === null && (p = q);
            break;
          }
          (t && p && Dt.alternate === null && l(s, p), (o = n(Dt, o, T)), R === null ? (z = Dt) : (R.sibling = Dt), (R = Dt), (p = q));
        }
        if (Y.done) return (a(s, p), Z && Al(s, T), z);
        if (p === null) {
          for (; !Y.done; T++, Y = r.next()) ((Y = y(s, Y.value, g)), Y !== null && ((o = n(Y, o, T)), R === null ? (z = Y) : (R.sibling = Y), (R = Y)));
          return (Z && Al(s, T), z);
        }
        for (p = e(p); !Y.done; T++, Y = r.next()) ((Y = v(p, s, T, Y.value, g)), Y !== null && (t && Y.alternate !== null && p.delete(Y.key === null ? T : Y.key), (o = n(Y, o, T)), R === null ? (z = Y) : (R.sibling = Y), (R = Y)));
        return (
          t &&
            p.forEach(function (xu) {
              return l(s, xu);
            }),
          Z && Al(s, T),
          z
        );
      }
      function G(s, o, r, g) {
        if ((typeof r == 'object' && r !== null && r.type === Ka && r.key === null && (r = r.props.children), typeof r == 'object' && r !== null)) {
          switch (r.$$typeof) {
            case Yu:
              t: {
                for (var z = r.key; o !== null; ) {
                  if (o.key === z) {
                    if (((z = r.type), z === Ka)) {
                      if (o.tag === 7) {
                        (a(s, o.sibling), (g = u(o, r.props.children)), (g.return = s), (s = g));
                        break t;
                      }
                    } else if (o.elementType === z || (typeof z == 'object' && z !== null && z.$$typeof === jl && ba(z) === o.type)) {
                      (a(s, o.sibling), (g = u(o, r.props)), He(g, r), (g.return = s), (s = g));
                      break t;
                    }
                    a(s, o);
                    break;
                  } else l(s, o);
                  o = o.sibling;
                }
                r.type === Ka ? ((g = Na(r.props.children, s.mode, g, r.key)), (g.return = s), (s = g)) : ((g = nn(r.type, r.key, r.props, null, s.mode, g)), He(g, r), (g.return = s), (s = g));
              }
              return i(s);
            case Xe:
              t: {
                for (z = r.key; o !== null; ) {
                  if (o.key === z)
                    if (o.tag === 4 && o.stateNode.containerInfo === r.containerInfo && o.stateNode.implementation === r.implementation) {
                      (a(s, o.sibling), (g = u(o, r.children || [])), (g.return = s), (s = g));
                      break t;
                    } else {
                      a(s, o);
                      break;
                    }
                  else l(s, o);
                  o = o.sibling;
                }
                ((g = Li(r, s.mode, g)), (g.return = s), (s = g));
              }
              return i(s);
            case jl:
              return ((r = ba(r)), G(s, o, r, g));
          }
          if (Ge(r)) return N(s, o, r, g);
          if (Ce(r)) {
            if (((z = Ce(r)), typeof z != 'function')) throw Error(b(150));
            return ((r = z.call(r)), E(s, o, r, g));
          }
          if (typeof r.then == 'function') return G(s, o, Ju(r), g);
          if (r.$$typeof === _l) return G(s, o, Ku(s, r), g);
          wu(s, r);
        }
        return (typeof r == 'string' && r !== '') || typeof r == 'number' || typeof r == 'bigint' ? ((r = '' + r), o !== null && o.tag === 6 ? (a(s, o.sibling), (g = u(o, r)), (g.return = s), (s = g)) : (a(s, o), (g = Zi(r, s.mode, g)), (g.return = s), (s = g)), i(s)) : a(s, o);
      }
      return function (s, o, r, g) {
        try {
          ou = 0;
          var z = G(s, o, r, g);
          return ((ce = null), z);
        } catch (p) {
          if (p === Ee || p === In) throw p;
          var R = Gt(29, p, null, s.mode);
          return ((R.lanes = g), (R.return = s), R);
        }
      };
    }
    var _a = lm(!0),
      am = lm(!1),
      Zl = !1;
    function Of(t) {
      t.updateQueue = { baseState: t.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, lanes: 0, hiddenCallbacks: null }, callbacks: null };
    }
    function Cc(t, l) {
      ((t = t.updateQueue), l.updateQueue === t && (l.updateQueue = { baseState: t.baseState, firstBaseUpdate: t.firstBaseUpdate, lastBaseUpdate: t.lastBaseUpdate, shared: t.shared, callbacks: null }));
    }
    function ta(t) {
      return { lane: t, tag: 0, payload: null, callback: null, next: null };
    }
    function la(t, l, a) {
      var e = t.updateQueue;
      if (e === null) return null;
      if (((e = e.shared), (L & 2) !== 0)) {
        var u = e.pending;
        return (u === null ? (l.next = l) : ((l.next = u.next), (u.next = l)), (e.pending = l), (l = Tn(t)), wd(t, null, a), l);
      }
      return (Fn(t, e, l, a), Tn(t));
    }
    function ke(t, l, a) {
      if (((l = l.updateQueue), l !== null && ((l = l.shared), (a & 4194048) !== 0))) {
        var e = l.lanes;
        ((e &= t.pendingLanes), (a |= e), (l.lanes = a), Sd(t, a));
      }
    }
    function Ki(t, l) {
      var a = t.updateQueue,
        e = t.alternate;
      if (e !== null && ((e = e.updateQueue), a === e)) {
        var u = null,
          n = null;
        if (((a = a.firstBaseUpdate), a !== null)) {
          do {
            var i = { lane: a.lane, tag: a.tag, payload: a.payload, callback: null, next: null };
            (n === null ? (u = n = i) : (n = n.next = i), (a = a.next));
          } while (a !== null);
          n === null ? (u = n = l) : (n = n.next = l);
        } else u = n = l;
        ((a = { baseState: e.baseState, firstBaseUpdate: u, lastBaseUpdate: n, shared: e.shared, callbacks: e.callbacks }), (t.updateQueue = a));
        return;
      }
      ((t = a.lastBaseUpdate), t === null ? (a.firstBaseUpdate = l) : (t.next = l), (a.lastBaseUpdate = l));
    }
    var qc = !1;
    function We() {
      if (qc) {
        var t = ie;
        if (t !== null) throw t;
      }
    }
    function $e(t, l, a, e) {
      qc = !1;
      var u = t.updateQueue;
      Zl = !1;
      var n = u.firstBaseUpdate,
        i = u.lastBaseUpdate,
        c = u.shared.pending;
      if (c !== null) {
        u.shared.pending = null;
        var f = c,
          m = f.next;
        ((f.next = null), i === null ? (n = m) : (i.next = m), (i = f));
        var h = t.alternate;
        h !== null && ((h = h.updateQueue), (c = h.lastBaseUpdate), c !== i && (c === null ? (h.firstBaseUpdate = m) : (c.next = m), (h.lastBaseUpdate = f)));
      }
      if (n !== null) {
        var y = u.baseState;
        ((i = 0), (h = m = f = null), (c = n));
        do {
          var d = c.lane & -536870913,
            v = d !== c.lane;
          if (v ? (j & d) === d : (e & d) === d) {
            (d !== 0 && d === re && (qc = !0), h !== null && (h = h.next = { lane: 0, tag: c.tag, payload: c.payload, callback: null, next: null }));
            t: {
              var N = t,
                E = c;
              d = l;
              var G = a;
              switch (E.tag) {
                case 1:
                  if (((N = E.payload), typeof N == 'function')) {
                    y = N.call(G, y, d);
                    break t;
                  }
                  y = N;
                  break t;
                case 3:
                  N.flags = (N.flags & -65537) | 128;
                case 0:
                  if (((N = E.payload), (d = typeof N == 'function' ? N.call(G, y, d) : N), d == null)) break t;
                  y = at({}, y, d);
                  break t;
                case 2:
                  Zl = !0;
              }
            }
            ((d = c.callback), d !== null && ((t.flags |= 64), v && (t.flags |= 8192), (v = u.callbacks), v === null ? (u.callbacks = [d]) : v.push(d)));
          } else ((v = { lane: d, tag: c.tag, payload: c.payload, callback: c.callback, next: null }), h === null ? ((m = h = v), (f = y)) : (h = h.next = v), (i |= d));
          if (((c = c.next), c === null)) {
            if (((c = u.shared.pending), c === null)) break;
            ((v = c), (c = v.next), (v.next = null), (u.lastBaseUpdate = v), (u.shared.pending = null));
          }
        } while (!0);
        (h === null && (f = y), (u.baseState = f), (u.firstBaseUpdate = m), (u.lastBaseUpdate = h), n === null && (u.shared.lanes = 0), (sa |= i), (t.lanes = i), (t.memoizedState = y));
      }
    }
    function em(t, l) {
      if (typeof t != 'function') throw Error(b(191, t));
      t.call(l);
    }
    function um(t, l) {
      var a = t.callbacks;
      if (a !== null) for (t.callbacks = null, t = 0; t < a.length; t++) em(a[t], l);
    }
    var ve = gl(null),
      _n = gl(0);
    function rs(t, l) {
      ((t = Yl), I(_n, t), I(ve, l), (Yl = t | l.baseLanes));
    }
    function Hc() {
      (I(_n, Yl), I(ve, ve.current));
    }
    function _f() {
      ((Yl = _n.current), pt(ve), pt(_n));
    }
    var wt = gl(null),
      el = null;
    function Vl(t) {
      var l = t.alternate;
      (I(ct, ct.current & 1), I(wt, t), el === null && (l === null || ve.current !== null || l.memoizedState !== null) && (el = t));
    }
    function Bc(t) {
      (I(ct, ct.current), I(wt, t), el === null && (el = t));
    }
    function nm(t) {
      t.tag === 22 ? (I(ct, ct.current), I(wt, t), el === null && (el = t)) : Kl(t);
    }
    function Kl() {
      (I(ct, ct.current), I(wt, wt.current));
    }
    function Xt(t) {
      (pt(wt), el === t && (el = null), pt(ct));
    }
    var ct = gl(0);
    function Mn(t) {
      for (var l = t; l !== null; ) {
        if (l.tag === 13) {
          var a = l.memoizedState;
          if (a !== null && ((a = a.dehydrated), a === null || tf(a) || lf(a))) return l;
        } else if (l.tag === 19 && (l.memoizedProps.revealOrder === 'forwards' || l.memoizedProps.revealOrder === 'backwards' || l.memoizedProps.revealOrder === 'unstable_legacy-backwards' || l.memoizedProps.revealOrder === 'together')) {
          if ((l.flags & 128) !== 0) return l;
        } else if (l.child !== null) {
          ((l.child.return = l), (l = l.child));
          continue;
        }
        if (l === t) break;
        for (; l.sibling === null; ) {
          if (l.return === null || l.return === t) return null;
          l = l.return;
        }
        ((l.sibling.return = l.return), (l = l.sibling));
      }
      return null;
    }
    var Hl = 0,
      B = null,
      W = null,
      st = null,
      Dn = !1,
      fe = !1,
      Ma = !1,
      Un = 0,
      su = 0,
      oe = null,
      ih = 0;
    function nt() {
      throw Error(b(321));
    }
    function Mf(t, l) {
      if (l === null) return !1;
      for (var a = 0; a < l.length && a < t.length; a++) if (!Jt(t[a], l[a])) return !1;
      return !0;
    }
    function Df(t, l, a, e, u, n) {
      return ((Hl = n), (B = l), (l.memoizedState = null), (l.updateQueue = null), (l.lanes = 0), (U.H = t === null || t.memoizedState === null ? Rm : Gf), (Ma = !1), (n = a(e, u)), (Ma = !1), fe && (n = cm(l, a, e, u)), im(t), n);
    }
    function im(t) {
      U.H = du;
      var l = W !== null && W.next !== null;
      if (((Hl = 0), (st = W = B = null), (Dn = !1), (su = 0), (oe = null), l)) throw Error(b(300));
      t === null || rt || ((t = t.dependencies), t !== null && An(t) && (rt = !0));
    }
    function cm(t, l, a, e) {
      B = t;
      var u = 0;
      do {
        if ((fe && (oe = null), (su = 0), (fe = !1), 25 <= u)) throw Error(b(301));
        if (((u += 1), (st = W = null), t.updateQueue != null)) {
          var n = t.updateQueue;
          ((n.lastEffect = null), (n.events = null), (n.stores = null), n.memoCache != null && (n.memoCache.index = 0));
        }
        ((U.H = Ym), (n = l(a, e)));
      } while (fe);
      return n;
    }
    function ch() {
      var t = U.H,
        l = t.useState()[0];
      return ((l = typeof l.then == 'function' ? Eu(l) : l), (t = t.useState()[0]), (W !== null ? W.memoizedState : null) !== t && (B.flags |= 1024), l);
    }
    function Uf() {
      var t = Un !== 0;
      return ((Un = 0), t);
    }
    function xf(t, l, a) {
      ((l.updateQueue = t.updateQueue), (l.flags &= -2053), (t.lanes &= ~a));
    }
    function Cf(t) {
      if (Dn) {
        for (t = t.memoizedState; t !== null; ) {
          var l = t.queue;
          (l !== null && (l.pending = null), (t = t.next));
        }
        Dn = !1;
      }
      ((Hl = 0), (st = W = B = null), (fe = !1), (su = Un = 0), (oe = null));
    }
    function Mt() {
      var t = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
      return (st === null ? (B.memoizedState = st = t) : (st = st.next = t), st);
    }
    function ft() {
      if (W === null) {
        var t = B.alternate;
        t = t !== null ? t.memoizedState : null;
      } else t = W.next;
      var l = st === null ? B.memoizedState : st.next;
      if (l !== null) ((st = l), (W = t));
      else {
        if (t === null) throw B.alternate === null ? Error(b(467)) : Error(b(310));
        ((W = t), (t = { memoizedState: W.memoizedState, baseState: W.baseState, baseQueue: W.baseQueue, queue: W.queue, next: null }), st === null ? (B.memoizedState = st = t) : (st = st.next = t));
      }
      return st;
    }
    function Pn() {
      return { lastEffect: null, events: null, stores: null, memoCache: null };
    }
    function Eu(t) {
      var l = su;
      return ((su += 1), oe === null && (oe = []), (t = tm(oe, t, l)), (l = B), (st === null ? l.memoizedState : st.next) === null && ((l = l.alternate), (U.H = l === null || l.memoizedState === null ? Rm : Gf)), t);
    }
    function ti(t) {
      if (t !== null && typeof t == 'object') {
        if (typeof t.then == 'function') return Eu(t);
        if (t.$$typeof === _l) return Tt(t);
      }
      throw Error(b(438, String(t)));
    }
    function qf(t) {
      var l = null,
        a = B.updateQueue;
      if ((a !== null && (l = a.memoCache), l == null)) {
        var e = B.alternate;
        e !== null &&
          ((e = e.updateQueue),
          e !== null &&
            ((e = e.memoCache),
            e != null &&
              (l = {
                data: e.data.map(function (u) {
                  return u.slice();
                }),
                index: 0,
              })));
      }
      if ((l == null && (l = { data: [], index: 0 }), a === null && ((a = Pn()), (B.updateQueue = a)), (a.memoCache = l), (a = l.data[l.index]), a === void 0)) for (a = l.data[l.index] = Array(t), e = 0; e < t; e++) a[e] = Jr;
      return (l.index++, a);
    }
    function Bl(t, l) {
      return typeof l == 'function' ? l(t) : l;
    }
    function fn(t) {
      var l = ft();
      return Hf(l, W, t);
    }
    function Hf(t, l, a) {
      var e = t.queue;
      if (e === null) throw Error(b(311));
      e.lastRenderedReducer = a;
      var u = t.baseQueue,
        n = e.pending;
      if (n !== null) {
        if (u !== null) {
          var i = u.next;
          ((u.next = n.next), (n.next = i));
        }
        ((l.baseQueue = u = n), (e.pending = null));
      }
      if (((n = t.baseState), u === null)) t.memoizedState = n;
      else {
        l = u.next;
        var c = (i = null),
          f = null,
          m = l,
          h = !1;
        do {
          var y = m.lane & -536870913;
          if (y !== m.lane ? (j & y) === y : (Hl & y) === y) {
            var d = m.revertLane;
            if (d === 0) (f !== null && (f = f.next = { lane: 0, revertLane: 0, gesture: null, action: m.action, hasEagerState: m.hasEagerState, eagerState: m.eagerState, next: null }), y === re && (h = !0));
            else if ((Hl & d) === d) {
              ((m = m.next), d === re && (h = !0));
              continue;
            } else ((y = { lane: 0, revertLane: m.revertLane, gesture: null, action: m.action, hasEagerState: m.hasEagerState, eagerState: m.eagerState, next: null }), f === null ? ((c = f = y), (i = n)) : (f = f.next = y), (B.lanes |= d), (sa |= d));
            ((y = m.action), Ma && a(n, y), (n = m.hasEagerState ? m.eagerState : a(n, y)));
          } else ((d = { lane: y, revertLane: m.revertLane, gesture: m.gesture, action: m.action, hasEagerState: m.hasEagerState, eagerState: m.eagerState, next: null }), f === null ? ((c = f = d), (i = n)) : (f = f.next = d), (B.lanes |= y), (sa |= y));
          m = m.next;
        } while (m !== null && m !== l);
        if ((f === null ? (i = n) : (f.next = c), !Jt(n, t.memoizedState) && ((rt = !0), h && ((a = ie), a !== null)))) throw a;
        ((t.memoizedState = n), (t.baseState = i), (t.baseQueue = f), (e.lastRenderedState = n));
      }
      return (u === null && (e.lanes = 0), [t.memoizedState, e.dispatch]);
    }
    function Ji(t) {
      var l = ft(),
        a = l.queue;
      if (a === null) throw Error(b(311));
      a.lastRenderedReducer = t;
      var e = a.dispatch,
        u = a.pending,
        n = l.memoizedState;
      if (u !== null) {
        a.pending = null;
        var i = (u = u.next);
        do ((n = t(n, i.action)), (i = i.next));
        while (i !== u);
        (Jt(n, l.memoizedState) || (rt = !0), (l.memoizedState = n), l.baseQueue === null && (l.baseState = n), (a.lastRenderedState = n));
      }
      return [n, e];
    }
    function fm(t, l, a) {
      var e = B,
        u = ft(),
        n = Z;
      if (n) {
        if (a === void 0) throw Error(b(407));
        a = a();
      } else a = l();
      var i = !Jt((W || u).memoizedState, a);
      if ((i && ((u.memoizedState = a), (rt = !0)), (u = u.queue), Bf(dm.bind(null, e, u, t), [t]), u.getSnapshot !== l || i || (st !== null && st.memoizedState.tag & 1))) {
        if (((e.flags |= 2048), he(9, { destroy: void 0 }, sm.bind(null, e, u, a, l), null), F === null)) throw Error(b(349));
        n || (Hl & 127) !== 0 || om(e, l, a);
      }
      return a;
    }
    function om(t, l, a) {
      ((t.flags |= 16384), (t = { getSnapshot: l, value: a }), (l = B.updateQueue), l === null ? ((l = Pn()), (B.updateQueue = l), (l.stores = [t])) : ((a = l.stores), a === null ? (l.stores = [t]) : a.push(t)));
    }
    function sm(t, l, a, e) {
      ((l.value = a), (l.getSnapshot = e), mm(l) && rm(t));
    }
    function dm(t, l, a) {
      return a(function () {
        mm(l) && rm(t);
      });
    }
    function mm(t) {
      var l = t.getSnapshot;
      t = t.value;
      try {
        var a = l();
        return !Jt(t, a);
      } catch {
        return !0;
      }
    }
    function rm(t) {
      var l = qa(t, 2);
      l !== null && Ht(l, t, 2);
    }
    function Rc(t) {
      var l = Mt();
      if (typeof t == 'function') {
        var a = t;
        if (((t = a()), Ma)) {
          wl(!0);
          try {
            a();
          } finally {
            wl(!1);
          }
        }
      }
      return ((l.memoizedState = l.baseState = t), (l.queue = { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: Bl, lastRenderedState: t }), l);
    }
    function vm(t, l, a, e) {
      return ((t.baseState = a), Hf(t, W, typeof e == 'function' ? e : Bl));
    }
    function fh(t, l, a, e, u) {
      if (ai(t)) throw Error(b(485));
      if (((t = l.action), t !== null)) {
        var n = {
          payload: u,
          action: t,
          next: null,
          isTransition: !0,
          status: 'pending',
          value: null,
          reason: null,
          listeners: [],
          then: function (i) {
            n.listeners.push(i);
          },
        };
        (U.T !== null ? a(!0) : (n.isTransition = !1), e(n), (a = l.pending), a === null ? ((n.next = l.pending = n), hm(l, n)) : ((n.next = a.next), (l.pending = a.next = n)));
      }
    }
    function hm(t, l) {
      var a = l.action,
        e = l.payload,
        u = t.state;
      if (l.isTransition) {
        var n = U.T,
          i = {};
        U.T = i;
        try {
          var c = a(u, e),
            f = U.S;
          (f !== null && f(i, c), vs(t, l, c));
        } catch (m) {
          Yc(t, l, m);
        } finally {
          (n !== null && i.types !== null && (n.types = i.types), (U.T = n));
        }
      } else
        try {
          ((n = a(u, e)), vs(t, l, n));
        } catch (m) {
          Yc(t, l, m);
        }
    }
    function vs(t, l, a) {
      a !== null && typeof a == 'object' && typeof a.then == 'function'
        ? a.then(
            function (e) {
              hs(t, l, e);
            },
            function (e) {
              return Yc(t, l, e);
            },
          )
        : hs(t, l, a);
    }
    function hs(t, l, a) {
      ((l.status = 'fulfilled'), (l.value = a), ym(l), (t.state = a), (l = t.pending), l !== null && ((a = l.next), a === l ? (t.pending = null) : ((a = a.next), (l.next = a), hm(t, a))));
    }
    function Yc(t, l, a) {
      var e = t.pending;
      if (((t.pending = null), e !== null)) {
        e = e.next;
        do ((l.status = 'rejected'), (l.reason = a), ym(l), (l = l.next));
        while (l !== e);
      }
      t.action = null;
    }
    function ym(t) {
      t = t.listeners;
      for (var l = 0; l < t.length; l++) (0, t[l])();
    }
    function gm(t, l) {
      return l;
    }
    function ys(t, l) {
      if (Z) {
        var a = F.formState;
        if (a !== null) {
          t: {
            var e = B;
            if (Z) {
              if (lt) {
                l: {
                  for (var u = lt, n = al; u.nodeType !== 8; ) {
                    if (!n) {
                      u = null;
                      break l;
                    }
                    if (((u = ul(u.nextSibling)), u === null)) {
                      u = null;
                      break l;
                    }
                  }
                  ((n = u.data), (u = n === 'F!' || n === 'F' ? u : null));
                }
                if (u) {
                  ((lt = ul(u.nextSibling)), (e = u.data === 'F!'));
                  break t;
                }
              }
              fa(e);
            }
            e = !1;
          }
          e && (l = a[0]);
        }
      }
      return (
        (a = Mt()),
        (a.memoizedState = a.baseState = l),
        (e = { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: gm, lastRenderedState: l }),
        (a.queue = e),
        (a = qm.bind(null, B, e)),
        (e.dispatch = a),
        (e = Rc(!1)),
        (n = Xf.bind(null, B, !1, e.queue)),
        (e = Mt()),
        (u = { state: l, dispatch: null, action: t, pending: null }),
        (e.queue = u),
        (a = fh.bind(null, B, u, n, a)),
        (u.dispatch = a),
        (e.memoizedState = t),
        [l, a, !1]
      );
    }
    function gs(t) {
      var l = ft();
      return bm(l, W, t);
    }
    function bm(t, l, a) {
      if (((l = Hf(t, l, gm)[0]), (t = fn(Bl)[0]), typeof l == 'object' && l !== null && typeof l.then == 'function'))
        try {
          var e = Eu(l);
        } catch (i) {
          throw i === Ee ? In : i;
        }
      else e = l;
      l = ft();
      var u = l.queue,
        n = u.dispatch;
      return (a !== l.memoizedState && ((B.flags |= 2048), he(9, { destroy: void 0 }, oh.bind(null, u, a), null)), [e, n, t]);
    }
    function oh(t, l) {
      t.action = l;
    }
    function bs(t) {
      var l = ft(),
        a = W;
      if (a !== null) return bm(l, a, t);
      (ft(), (l = l.memoizedState), (a = ft()));
      var e = a.queue.dispatch;
      return ((a.memoizedState = t), [l, e, !1]);
    }
    function he(t, l, a, e) {
      return ((t = { tag: t, create: a, deps: e, inst: l, next: null }), (l = B.updateQueue), l === null && ((l = Pn()), (B.updateQueue = l)), (a = l.lastEffect), a === null ? (l.lastEffect = t.next = t) : ((e = a.next), (a.next = t), (t.next = e), (l.lastEffect = t)), t);
    }
    function pm() {
      return ft().memoizedState;
    }
    function on(t, l, a, e) {
      var u = Mt();
      ((B.flags |= t), (u.memoizedState = he(1 | l, { destroy: void 0 }, a, e === void 0 ? null : e)));
    }
    function li(t, l, a, e) {
      var u = ft();
      e = e === void 0 ? null : e;
      var n = u.memoizedState.inst;
      W !== null && e !== null && Mf(e, W.memoizedState.deps) ? (u.memoizedState = he(l, n, a, e)) : ((B.flags |= t), (u.memoizedState = he(1 | l, n, a, e)));
    }
    function ps(t, l) {
      on(8390656, 8, t, l);
    }
    function Bf(t, l) {
      li(2048, 8, t, l);
    }
    function sh(t) {
      B.flags |= 4;
      var l = B.updateQueue;
      if (l === null) ((l = Pn()), (B.updateQueue = l), (l.events = [t]));
      else {
        var a = l.events;
        a === null ? (l.events = [t]) : a.push(t);
      }
    }
    function Sm(t) {
      var l = ft().memoizedState;
      return (
        sh({ ref: l, nextImpl: t }),
        function () {
          if ((L & 2) !== 0) throw Error(b(440));
          return l.impl.apply(void 0, arguments);
        }
      );
    }
    function Nm(t, l) {
      return li(4, 2, t, l);
    }
    function zm(t, l) {
      return li(4, 4, t, l);
    }
    function Tm(t, l) {
      if (typeof l == 'function') {
        t = t();
        var a = l(t);
        return function () {
          typeof a == 'function' ? a() : l(null);
        };
      }
      if (l != null)
        return (
          (t = t()),
          (l.current = t),
          function () {
            l.current = null;
          }
        );
    }
    function Em(t, l, a) {
      ((a = a != null ? a.concat([t]) : null), li(4, 4, Tm.bind(null, l, t), a));
    }
    function Rf() {}
    function Am(t, l) {
      var a = ft();
      l = l === void 0 ? null : l;
      var e = a.memoizedState;
      return l !== null && Mf(l, e[1]) ? e[0] : ((a.memoizedState = [t, l]), t);
    }
    function Om(t, l) {
      var a = ft();
      l = l === void 0 ? null : l;
      var e = a.memoizedState;
      if (l !== null && Mf(l, e[1])) return e[0];
      if (((e = t()), Ma)) {
        wl(!0);
        try {
          t();
        } finally {
          wl(!1);
        }
      }
      return ((a.memoizedState = [e, l]), e);
    }
    function Yf(t, l, a) {
      return a === void 0 || ((Hl & 1073741824) !== 0 && (j & 261930) === 0) ? (t.memoizedState = l) : ((t.memoizedState = a), (t = v0()), (B.lanes |= t), (sa |= t), a);
    }
    function _m(t, l, a, e) {
      return Jt(a, l) ? a : ve.current !== null ? ((t = Yf(t, a, e)), Jt(t, l) || (rt = !0), t) : (Hl & 42) === 0 || ((Hl & 1073741824) !== 0 && (j & 261930) === 0) ? ((rt = !0), (t.memoizedState = a)) : ((t = v0()), (B.lanes |= t), (sa |= t), l);
    }
    function Mm(t, l, a, e, u) {
      var n = V.p;
      V.p = n !== 0 && 8 > n ? n : 8;
      var i = U.T,
        c = {};
      ((U.T = c), Xf(t, !1, l, a));
      try {
        var f = u(),
          m = U.S;
        if ((m !== null && m(c, f), f !== null && typeof f == 'object' && typeof f.then == 'function')) {
          var h = nh(f, e);
          Fe(t, l, h, Kt(t));
        } else Fe(t, l, e, Kt(t));
      } catch (y) {
        Fe(t, l, { then: function () {}, status: 'rejected', reason: y }, Kt());
      } finally {
        ((V.p = n), i !== null && c.types !== null && (i.types = c.types), (U.T = i));
      }
    }
    function dh() {}
    function Qc(t, l, a, e) {
      if (t.tag !== 5) throw Error(b(476));
      var u = Dm(t).queue;
      Mm(
        t,
        u,
        l,
        Sa,
        a === null
          ? dh
          : function () {
              return (Um(t), a(e));
            },
      );
    }
    function Dm(t) {
      var l = t.memoizedState;
      if (l !== null) return l;
      l = { memoizedState: Sa, baseState: Sa, baseQueue: null, queue: { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: Bl, lastRenderedState: Sa }, next: null };
      var a = {};
      return ((l.next = { memoizedState: a, baseState: a, baseQueue: null, queue: { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: Bl, lastRenderedState: a }, next: null }), (t.memoizedState = l), (t = t.alternate), t !== null && (t.memoizedState = l), l);
    }
    function Um(t) {
      var l = Dm(t);
      (l.next === null && (l = t.alternate.memoizedState), Fe(t, l.next.queue, {}, Kt()));
    }
    function Qf() {
      return Tt(vu);
    }
    function xm() {
      return ft().memoizedState;
    }
    function Cm() {
      return ft().memoizedState;
    }
    function mh(t) {
      for (var l = t.return; l !== null; ) {
        switch (l.tag) {
          case 24:
          case 3:
            var a = Kt();
            t = ta(a);
            var e = la(l, t, a);
            (e !== null && (Ht(e, l, a), ke(e, l, a)), (l = { cache: Tf() }), (t.payload = l));
            return;
        }
        l = l.return;
      }
    }
    function rh(t, l, a) {
      var e = Kt();
      ((a = { lane: e, revertLane: 0, gesture: null, action: a, hasEagerState: !1, eagerState: null, next: null }), ai(t) ? Hm(l, a) : ((a = pf(t, l, a, e)), a !== null && (Ht(a, t, e), Bm(a, l, e))));
    }
    function qm(t, l, a) {
      var e = Kt();
      Fe(t, l, a, e);
    }
    function Fe(t, l, a, e) {
      var u = { lane: e, revertLane: 0, gesture: null, action: a, hasEagerState: !1, eagerState: null, next: null };
      if (ai(t)) Hm(l, u);
      else {
        var n = t.alternate;
        if (t.lanes === 0 && (n === null || n.lanes === 0) && ((n = l.lastRenderedReducer), n !== null))
          try {
            var i = l.lastRenderedState,
              c = n(i, a);
            if (((u.hasEagerState = !0), (u.eagerState = c), Jt(c, i))) return (Fn(t, l, u, 0), F === null && $n(), !1);
          } catch {}
        if (((a = pf(t, l, u, e)), a !== null)) return (Ht(a, t, e), Bm(a, l, e), !0);
      }
      return !1;
    }
    function Xf(t, l, a, e) {
      if (((e = { lane: 2, revertLane: kf(), gesture: null, action: e, hasEagerState: !1, eagerState: null, next: null }), ai(t))) {
        if (l) throw Error(b(479));
      } else ((l = pf(t, a, e, 2)), l !== null && Ht(l, t, 2));
    }
    function ai(t) {
      var l = t.alternate;
      return t === B || (l !== null && l === B);
    }
    function Hm(t, l) {
      fe = Dn = !0;
      var a = t.pending;
      (a === null ? (l.next = l) : ((l.next = a.next), (a.next = l)), (t.pending = l));
    }
    function Bm(t, l, a) {
      if ((a & 4194048) !== 0) {
        var e = l.lanes;
        ((e &= t.pendingLanes), (a |= e), (l.lanes = a), Sd(t, a));
      }
    }
    var du = {
      readContext: Tt,
      use: ti,
      useCallback: nt,
      useContext: nt,
      useEffect: nt,
      useImperativeHandle: nt,
      useLayoutEffect: nt,
      useInsertionEffect: nt,
      useMemo: nt,
      useReducer: nt,
      useRef: nt,
      useState: nt,
      useDebugValue: nt,
      useDeferredValue: nt,
      useTransition: nt,
      useSyncExternalStore: nt,
      useId: nt,
      useHostTransitionStatus: nt,
      useFormState: nt,
      useActionState: nt,
      useOptimistic: nt,
      useMemoCache: nt,
      useCacheRefresh: nt,
    };
    du.useEffectEvent = nt;
    var Rm = {
        readContext: Tt,
        use: ti,
        useCallback: function (t, l) {
          return ((Mt().memoizedState = [t, l === void 0 ? null : l]), t);
        },
        useContext: Tt,
        useEffect: ps,
        useImperativeHandle: function (t, l, a) {
          ((a = a != null ? a.concat([t]) : null), on(4194308, 4, Tm.bind(null, l, t), a));
        },
        useLayoutEffect: function (t, l) {
          return on(4194308, 4, t, l);
        },
        useInsertionEffect: function (t, l) {
          on(4, 2, t, l);
        },
        useMemo: function (t, l) {
          var a = Mt();
          l = l === void 0 ? null : l;
          var e = t();
          if (Ma) {
            wl(!0);
            try {
              t();
            } finally {
              wl(!1);
            }
          }
          return ((a.memoizedState = [e, l]), e);
        },
        useReducer: function (t, l, a) {
          var e = Mt();
          if (a !== void 0) {
            var u = a(l);
            if (Ma) {
              wl(!0);
              try {
                a(l);
              } finally {
                wl(!1);
              }
            }
          } else u = l;
          return ((e.memoizedState = e.baseState = u), (t = { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: t, lastRenderedState: u }), (e.queue = t), (t = t.dispatch = rh.bind(null, B, t)), [e.memoizedState, t]);
        },
        useRef: function (t) {
          var l = Mt();
          return ((t = { current: t }), (l.memoizedState = t));
        },
        useState: function (t) {
          t = Rc(t);
          var l = t.queue,
            a = qm.bind(null, B, l);
          return ((l.dispatch = a), [t.memoizedState, a]);
        },
        useDebugValue: Rf,
        useDeferredValue: function (t, l) {
          var a = Mt();
          return Yf(a, t, l);
        },
        useTransition: function () {
          var t = Rc(!1);
          return ((t = Mm.bind(null, B, t.queue, !0, !1)), (Mt().memoizedState = t), [!1, t]);
        },
        useSyncExternalStore: function (t, l, a) {
          var e = B,
            u = Mt();
          if (Z) {
            if (a === void 0) throw Error(b(407));
            a = a();
          } else {
            if (((a = l()), F === null)) throw Error(b(349));
            (j & 127) !== 0 || om(e, l, a);
          }
          u.memoizedState = a;
          var n = { value: a, getSnapshot: l };
          return ((u.queue = n), ps(dm.bind(null, e, n, t), [t]), (e.flags |= 2048), he(9, { destroy: void 0 }, sm.bind(null, e, n, a, l), null), a);
        },
        useId: function () {
          var t = Mt(),
            l = F.identifierPrefix;
          if (Z) {
            var a = vl,
              e = rl;
            ((a = (e & ~(1 << (32 - Vt(e) - 1))).toString(32) + a), (l = '_' + l + 'R_' + a), (a = Un++), 0 < a && (l += 'H' + a.toString(32)), (l += '_'));
          } else ((a = ih++), (l = '_' + l + 'r_' + a.toString(32) + '_'));
          return (t.memoizedState = l);
        },
        useHostTransitionStatus: Qf,
        useFormState: ys,
        useActionState: ys,
        useOptimistic: function (t) {
          var l = Mt();
          l.memoizedState = l.baseState = t;
          var a = { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: null, lastRenderedState: null };
          return ((l.queue = a), (l = Xf.bind(null, B, !0, a)), (a.dispatch = l), [t, l]);
        },
        useMemoCache: qf,
        useCacheRefresh: function () {
          return (Mt().memoizedState = mh.bind(null, B));
        },
        useEffectEvent: function (t) {
          var l = Mt(),
            a = { impl: t };
          return (
            (l.memoizedState = a),
            function () {
              if ((L & 2) !== 0) throw Error(b(440));
              return a.impl.apply(void 0, arguments);
            }
          );
        },
      },
      Gf = {
        readContext: Tt,
        use: ti,
        useCallback: Am,
        useContext: Tt,
        useEffect: Bf,
        useImperativeHandle: Em,
        useInsertionEffect: Nm,
        useLayoutEffect: zm,
        useMemo: Om,
        useReducer: fn,
        useRef: pm,
        useState: function () {
          return fn(Bl);
        },
        useDebugValue: Rf,
        useDeferredValue: function (t, l) {
          var a = ft();
          return _m(a, W.memoizedState, t, l);
        },
        useTransition: function () {
          var t = fn(Bl)[0],
            l = ft().memoizedState;
          return [typeof t == 'boolean' ? t : Eu(t), l];
        },
        useSyncExternalStore: fm,
        useId: xm,
        useHostTransitionStatus: Qf,
        useFormState: gs,
        useActionState: gs,
        useOptimistic: function (t, l) {
          var a = ft();
          return vm(a, W, t, l);
        },
        useMemoCache: qf,
        useCacheRefresh: Cm,
      };
    Gf.useEffectEvent = Sm;
    var Ym = {
      readContext: Tt,
      use: ti,
      useCallback: Am,
      useContext: Tt,
      useEffect: Bf,
      useImperativeHandle: Em,
      useInsertionEffect: Nm,
      useLayoutEffect: zm,
      useMemo: Om,
      useReducer: Ji,
      useRef: pm,
      useState: function () {
        return Ji(Bl);
      },
      useDebugValue: Rf,
      useDeferredValue: function (t, l) {
        var a = ft();
        return W === null ? Yf(a, t, l) : _m(a, W.memoizedState, t, l);
      },
      useTransition: function () {
        var t = Ji(Bl)[0],
          l = ft().memoizedState;
        return [typeof t == 'boolean' ? t : Eu(t), l];
      },
      useSyncExternalStore: fm,
      useId: xm,
      useHostTransitionStatus: Qf,
      useFormState: bs,
      useActionState: bs,
      useOptimistic: function (t, l) {
        var a = ft();
        return W !== null ? vm(a, W, t, l) : ((a.baseState = t), [t, a.queue.dispatch]);
      },
      useMemoCache: qf,
      useCacheRefresh: Cm,
    };
    Ym.useEffectEvent = Sm;
    function wi(t, l, a, e) {
      ((l = t.memoizedState), (a = a(e, l)), (a = a == null ? l : at({}, l, a)), (t.memoizedState = a), t.lanes === 0 && (t.updateQueue.baseState = a));
    }
    var Xc = {
      enqueueSetState: function (t, l, a) {
        t = t._reactInternals;
        var e = Kt(),
          u = ta(e);
        ((u.payload = l), a != null && (u.callback = a), (l = la(t, u, e)), l !== null && (Ht(l, t, e), ke(l, t, e)));
      },
      enqueueReplaceState: function (t, l, a) {
        t = t._reactInternals;
        var e = Kt(),
          u = ta(e);
        ((u.tag = 1), (u.payload = l), a != null && (u.callback = a), (l = la(t, u, e)), l !== null && (Ht(l, t, e), ke(l, t, e)));
      },
      enqueueForceUpdate: function (t, l) {
        t = t._reactInternals;
        var a = Kt(),
          e = ta(a);
        ((e.tag = 2), l != null && (e.callback = l), (l = la(t, e, a)), l !== null && (Ht(l, t, a), ke(l, t, a)));
      },
    };
    function Ss(t, l, a, e, u, n, i) {
      return ((t = t.stateNode), typeof t.shouldComponentUpdate == 'function' ? t.shouldComponentUpdate(e, n, i) : l.prototype && l.prototype.isPureReactComponent ? !iu(a, e) || !iu(u, n) : !0);
    }
    function Ns(t, l, a, e) {
      ((t = l.state), typeof l.componentWillReceiveProps == 'function' && l.componentWillReceiveProps(a, e), typeof l.UNSAFE_componentWillReceiveProps == 'function' && l.UNSAFE_componentWillReceiveProps(a, e), l.state !== t && Xc.enqueueReplaceState(l, l.state, null));
    }
    function Da(t, l) {
      var a = l;
      if ('ref' in l) {
        a = {};
        for (var e in l) e !== 'ref' && (a[e] = l[e]);
      }
      if ((t = t.defaultProps)) {
        a === l && (a = at({}, a));
        for (var u in t) a[u] === void 0 && (a[u] = t[u]);
      }
      return a;
    }
    function Qm(t) {
      zn(t);
    }
    function Xm(t) {
      console.error(t);
    }
    function Gm(t) {
      zn(t);
    }
    function xn(t, l) {
      try {
        var a = t.onUncaughtError;
        a(l.value, { componentStack: l.stack });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function zs(t, l, a) {
      try {
        var e = t.onCaughtError;
        e(a.value, { componentStack: a.stack, errorBoundary: l.tag === 1 ? l.stateNode : null });
      } catch (u) {
        setTimeout(function () {
          throw u;
        });
      }
    }
    function Gc(t, l, a) {
      return (
        (a = ta(a)),
        (a.tag = 3),
        (a.payload = { element: null }),
        (a.callback = function () {
          xn(t, l);
        }),
        a
      );
    }
    function jm(t) {
      return ((t = ta(t)), (t.tag = 3), t);
    }
    function Zm(t, l, a, e) {
      var u = a.type.getDerivedStateFromError;
      if (typeof u == 'function') {
        var n = e.value;
        ((t.payload = function () {
          return u(n);
        }),
          (t.callback = function () {
            zs(l, a, e);
          }));
      }
      var i = a.stateNode;
      i !== null &&
        typeof i.componentDidCatch == 'function' &&
        (t.callback = function () {
          (zs(l, a, e), typeof u != 'function' && (aa === null ? (aa = new Set([this])) : aa.add(this)));
          var c = e.stack;
          this.componentDidCatch(e.value, { componentStack: c !== null ? c : '' });
        });
    }
    function vh(t, l, a, e, u) {
      if (((a.flags |= 32768), e !== null && typeof e == 'object' && typeof e.then == 'function')) {
        if (((l = a.alternate), l !== null && Te(l, a, u, !0), (a = wt.current), a !== null)) {
          switch (a.tag) {
            case 31:
            case 13:
              return (el === null ? Rn() : a.alternate === null && it === 0 && (it = 3), (a.flags &= -257), (a.flags |= 65536), (a.lanes = u), e === On ? (a.flags |= 16384) : ((l = a.updateQueue), l === null ? (a.updateQueue = new Set([e])) : l.add(e), uc(t, e, u)), !1);
            case 22:
              return (
                (a.flags |= 65536),
                e === On ? (a.flags |= 16384) : ((l = a.updateQueue), l === null ? ((l = { transitions: null, markerInstances: null, retryQueue: new Set([e]) }), (a.updateQueue = l)) : ((a = l.retryQueue), a === null ? (l.retryQueue = new Set([e])) : a.add(e)), uc(t, e, u)),
                !1
              );
          }
          throw Error(b(435, a.tag));
        }
        return (uc(t, e, u), Rn(), !1);
      }
      if (Z)
        return (
          (l = wt.current),
          l !== null
            ? ((l.flags & 65536) === 0 && (l.flags |= 256), (l.flags |= 65536), (l.lanes = u), e !== _c && ((t = Error(b(422), { cause: e })), fu(ll(t, a))))
            : (e !== _c && ((l = Error(b(423), { cause: e })), fu(ll(l, a))), (t = t.current.alternate), (t.flags |= 65536), (u &= -u), (t.lanes |= u), (e = ll(e, a)), (u = Gc(t.stateNode, e, u)), Ki(t, u), it !== 4 && (it = 2)),
          !1
        );
      var n = Error(b(520), { cause: e });
      if (((n = ll(n, a)), tu === null ? (tu = [n]) : tu.push(n), it !== 4 && (it = 2), l === null)) return !0;
      ((e = ll(e, a)), (a = l));
      do {
        switch (a.tag) {
          case 3:
            return ((a.flags |= 65536), (t = u & -u), (a.lanes |= t), (t = Gc(a.stateNode, e, t)), Ki(a, t), !1);
          case 1:
            if (((l = a.type), (n = a.stateNode), (a.flags & 128) === 0 && (typeof l.getDerivedStateFromError == 'function' || (n !== null && typeof n.componentDidCatch == 'function' && (aa === null || !aa.has(n))))))
              return ((a.flags |= 65536), (u &= -u), (a.lanes |= u), (u = jm(u)), Zm(u, t, a, e), Ki(a, u), !1);
        }
        a = a.return;
      } while (a !== null);
      return !1;
    }
    var jf = Error(b(461)),
      rt = !1;
    function St(t, l, a, e) {
      l.child = t === null ? am(l, null, a, e) : _a(l, t.child, a, e);
    }
    function Ts(t, l, a, e, u) {
      a = a.render;
      var n = l.ref;
      if ('ref' in e) {
        var i = {};
        for (var c in e) c !== 'ref' && (i[c] = e[c]);
      } else i = e;
      return (Oa(l), (e = Df(t, l, a, i, n, u)), (c = Uf()), t !== null && !rt ? (xf(t, l, u), Rl(t, l, u)) : (Z && c && Nf(l), (l.flags |= 1), St(t, l, e, u), l.child));
    }
    function Es(t, l, a, e, u) {
      if (t === null) {
        var n = a.type;
        return typeof n == 'function' && !Sf(n) && n.defaultProps === void 0 && a.compare === null ? ((l.tag = 15), (l.type = n), Lm(t, l, n, e, u)) : ((t = nn(a.type, null, e, l, l.mode, u)), (t.ref = l.ref), (t.return = l), (l.child = t));
      }
      if (((n = t.child), !Zf(t, u))) {
        var i = n.memoizedProps;
        if (((a = a.compare), (a = a !== null ? a : iu), a(i, e) && t.ref === l.ref)) return Rl(t, l, u);
      }
      return ((l.flags |= 1), (t = Ul(n, e)), (t.ref = l.ref), (t.return = l), (l.child = t));
    }
    function Lm(t, l, a, e, u) {
      if (t !== null) {
        var n = t.memoizedProps;
        if (iu(n, e) && t.ref === l.ref)
          if (((rt = !1), (l.pendingProps = e = n), Zf(t, u))) (t.flags & 131072) !== 0 && (rt = !0);
          else return ((l.lanes = t.lanes), Rl(t, l, u));
      }
      return jc(t, l, a, e, u);
    }
    function Vm(t, l, a, e) {
      var u = e.children,
        n = t !== null ? t.memoizedState : null;
      if ((t === null && l.stateNode === null && (l.stateNode = { _visibility: 1, _pendingMarkers: null, _retryCache: null, _transitions: null }), e.mode === 'hidden')) {
        if ((l.flags & 128) !== 0) {
          if (((n = n !== null ? n.baseLanes | a : a), t !== null)) {
            for (e = l.child = t.child, u = 0; e !== null; ) ((u = u | e.lanes | e.childLanes), (e = e.sibling));
            e = u & ~n;
          } else ((e = 0), (l.child = null));
          return As(t, l, n, a, e);
        }
        if ((a & 536870912) !== 0) ((l.memoizedState = { baseLanes: 0, cachePool: null }), t !== null && cn(l, n !== null ? n.cachePool : null), n !== null ? rs(l, n) : Hc(), nm(l));
        else return ((e = l.lanes = 536870912), As(t, l, n !== null ? n.baseLanes | a : a, a, e));
      } else n !== null ? (cn(l, n.cachePool), rs(l, n), Kl(l), (l.memoizedState = null)) : (t !== null && cn(l, null), Hc(), Kl(l));
      return (St(t, l, u, a), l.child);
    }
    function Ze(t, l) {
      return ((t !== null && t.tag === 22) || l.stateNode !== null || (l.stateNode = { _visibility: 1, _pendingMarkers: null, _retryCache: null, _transitions: null }), l.sibling);
    }
    function As(t, l, a, e, u) {
      var n = Ef();
      return ((n = n === null ? null : { parent: mt._currentValue, pool: n }), (l.memoizedState = { baseLanes: a, cachePool: n }), t !== null && cn(l, null), Hc(), nm(l), t !== null && Te(t, l, e, !0), (l.childLanes = u), null);
    }
    function sn(t, l) {
      return ((l = Cn({ mode: l.mode, children: l.children }, t.mode)), (l.ref = t.ref), (t.child = l), (l.return = t), l);
    }
    function Os(t, l, a) {
      return (_a(l, t.child, null, a), (t = sn(l, l.pendingProps)), (t.flags |= 2), Xt(l), (l.memoizedState = null), t);
    }
    function hh(t, l, a) {
      var e = l.pendingProps,
        u = (l.flags & 128) !== 0;
      if (((l.flags &= -129), t === null)) {
        if (Z) {
          if (e.mode === 'hidden') return ((t = sn(l, e)), (l.lanes = 536870912), Ze(null, t));
          if (
            (Bc(l),
            (t = lt)
              ? ((t = R0(t, al)),
                (t = t !== null && t.data === '&' ? t : null),
                t !== null && ((l.memoizedState = { dehydrated: t, treeContext: ca !== null ? { id: rl, overflow: vl } : null, retryLane: 536870912, hydrationErrors: null }), (a = Wd(t)), (a.return = l), (l.child = a), (zt = l), (lt = null)))
              : (t = null),
            t === null)
          )
            throw fa(l);
          return ((l.lanes = 536870912), null);
        }
        return sn(l, e);
      }
      var n = t.memoizedState;
      if (n !== null) {
        var i = n.dehydrated;
        if ((Bc(l), u))
          if (l.flags & 256) ((l.flags &= -257), (l = Os(t, l, a)));
          else if (l.memoizedState !== null) ((l.child = t.child), (l.flags |= 128), (l = null));
          else throw Error(b(558));
        else if ((rt || Te(t, l, a, !1), (u = (a & t.childLanes) !== 0), rt || u)) {
          if (((e = F), e !== null && ((i = Nd(e, a)), i !== 0 && i !== n.retryLane))) throw ((n.retryLane = i), qa(t, i), Ht(e, t, i), jf);
          (Rn(), (l = Os(t, l, a)));
        } else ((t = n.treeContext), (lt = ul(i.nextSibling)), (zt = l), (Z = !0), (Pl = null), (al = !1), t !== null && Fd(l, t), (l = sn(l, e)), (l.flags |= 4096));
        return l;
      }
      return ((t = Ul(t.child, { mode: e.mode, children: e.children })), (t.ref = l.ref), (l.child = t), (t.return = l), t);
    }
    function dn(t, l) {
      var a = l.ref;
      if (a === null) t !== null && t.ref !== null && (l.flags |= 4194816);
      else {
        if (typeof a != 'function' && typeof a != 'object') throw Error(b(284));
        (t === null || t.ref !== a) && (l.flags |= 4194816);
      }
    }
    function jc(t, l, a, e, u) {
      return (Oa(l), (a = Df(t, l, a, e, void 0, u)), (e = Uf()), t !== null && !rt ? (xf(t, l, u), Rl(t, l, u)) : (Z && e && Nf(l), (l.flags |= 1), St(t, l, a, u), l.child));
    }
    function _s(t, l, a, e, u, n) {
      return (Oa(l), (l.updateQueue = null), (a = cm(l, e, a, u)), im(t), (e = Uf()), t !== null && !rt ? (xf(t, l, n), Rl(t, l, n)) : (Z && e && Nf(l), (l.flags |= 1), St(t, l, a, n), l.child));
    }
    function Ms(t, l, a, e, u) {
      if ((Oa(l), l.stateNode === null)) {
        var n = Pa,
          i = a.contextType;
        (typeof i == 'object' && i !== null && (n = Tt(i)),
          (n = new a(e, n)),
          (l.memoizedState = n.state !== null && n.state !== void 0 ? n.state : null),
          (n.updater = Xc),
          (l.stateNode = n),
          (n._reactInternals = l),
          (n = l.stateNode),
          (n.props = e),
          (n.state = l.memoizedState),
          (n.refs = {}),
          Of(l),
          (i = a.contextType),
          (n.context = typeof i == 'object' && i !== null ? Tt(i) : Pa),
          (n.state = l.memoizedState),
          (i = a.getDerivedStateFromProps),
          typeof i == 'function' && (wi(l, a, i, e), (n.state = l.memoizedState)),
          typeof a.getDerivedStateFromProps == 'function' ||
            typeof n.getSnapshotBeforeUpdate == 'function' ||
            (typeof n.UNSAFE_componentWillMount != 'function' && typeof n.componentWillMount != 'function') ||
            ((i = n.state), typeof n.componentWillMount == 'function' && n.componentWillMount(), typeof n.UNSAFE_componentWillMount == 'function' && n.UNSAFE_componentWillMount(), i !== n.state && Xc.enqueueReplaceState(n, n.state, null), $e(l, e, n, u), We(), (n.state = l.memoizedState)),
          typeof n.componentDidMount == 'function' && (l.flags |= 4194308),
          (e = !0));
      } else if (t === null) {
        n = l.stateNode;
        var c = l.memoizedProps,
          f = Da(a, c);
        n.props = f;
        var m = n.context,
          h = a.contextType;
        ((i = Pa), typeof h == 'object' && h !== null && (i = Tt(h)));
        var y = a.getDerivedStateFromProps;
        ((h = typeof y == 'function' || typeof n.getSnapshotBeforeUpdate == 'function'), (c = l.pendingProps !== c), h || (typeof n.UNSAFE_componentWillReceiveProps != 'function' && typeof n.componentWillReceiveProps != 'function') || ((c || m !== i) && Ns(l, n, e, i)), (Zl = !1));
        var d = l.memoizedState;
        ((n.state = d),
          $e(l, e, n, u),
          We(),
          (m = l.memoizedState),
          c || d !== m || Zl
            ? (typeof y == 'function' && (wi(l, a, y, e), (m = l.memoizedState)),
              (f = Zl || Ss(l, a, f, e, d, m, i))
                ? (h || (typeof n.UNSAFE_componentWillMount != 'function' && typeof n.componentWillMount != 'function') || (typeof n.componentWillMount == 'function' && n.componentWillMount(), typeof n.UNSAFE_componentWillMount == 'function' && n.UNSAFE_componentWillMount()),
                  typeof n.componentDidMount == 'function' && (l.flags |= 4194308))
                : (typeof n.componentDidMount == 'function' && (l.flags |= 4194308), (l.memoizedProps = e), (l.memoizedState = m)),
              (n.props = e),
              (n.state = m),
              (n.context = i),
              (e = f))
            : (typeof n.componentDidMount == 'function' && (l.flags |= 4194308), (e = !1)));
      } else {
        ((n = l.stateNode),
          Cc(t, l),
          (i = l.memoizedProps),
          (h = Da(a, i)),
          (n.props = h),
          (y = l.pendingProps),
          (d = n.context),
          (m = a.contextType),
          (f = Pa),
          typeof m == 'object' && m !== null && (f = Tt(m)),
          (c = a.getDerivedStateFromProps),
          (m = typeof c == 'function' || typeof n.getSnapshotBeforeUpdate == 'function') || (typeof n.UNSAFE_componentWillReceiveProps != 'function' && typeof n.componentWillReceiveProps != 'function') || ((i !== y || d !== f) && Ns(l, n, e, f)),
          (Zl = !1),
          (d = l.memoizedState),
          (n.state = d),
          $e(l, e, n, u),
          We());
        var v = l.memoizedState;
        i !== y || d !== v || Zl || (t !== null && t.dependencies !== null && An(t.dependencies))
          ? (typeof c == 'function' && (wi(l, a, c, e), (v = l.memoizedState)),
            (h = Zl || Ss(l, a, h, e, d, v, f) || (t !== null && t.dependencies !== null && An(t.dependencies)))
              ? (m || (typeof n.UNSAFE_componentWillUpdate != 'function' && typeof n.componentWillUpdate != 'function') || (typeof n.componentWillUpdate == 'function' && n.componentWillUpdate(e, v, f), typeof n.UNSAFE_componentWillUpdate == 'function' && n.UNSAFE_componentWillUpdate(e, v, f)),
                typeof n.componentDidUpdate == 'function' && (l.flags |= 4),
                typeof n.getSnapshotBeforeUpdate == 'function' && (l.flags |= 1024))
              : (typeof n.componentDidUpdate != 'function' || (i === t.memoizedProps && d === t.memoizedState) || (l.flags |= 4), typeof n.getSnapshotBeforeUpdate != 'function' || (i === t.memoizedProps && d === t.memoizedState) || (l.flags |= 1024), (l.memoizedProps = e), (l.memoizedState = v)),
            (n.props = e),
            (n.state = v),
            (n.context = f),
            (e = h))
          : (typeof n.componentDidUpdate != 'function' || (i === t.memoizedProps && d === t.memoizedState) || (l.flags |= 4), typeof n.getSnapshotBeforeUpdate != 'function' || (i === t.memoizedProps && d === t.memoizedState) || (l.flags |= 1024), (e = !1));
      }
      return (
        (n = e),
        dn(t, l),
        (e = (l.flags & 128) !== 0),
        n || e
          ? ((n = l.stateNode), (a = e && typeof a.getDerivedStateFromError != 'function' ? null : n.render()), (l.flags |= 1), t !== null && e ? ((l.child = _a(l, t.child, null, u)), (l.child = _a(l, null, a, u))) : St(t, l, a, u), (l.memoizedState = n.state), (t = l.child))
          : (t = Rl(t, l, u)),
        t
      );
    }
    function Ds(t, l, a, e) {
      return (Aa(), (l.flags |= 256), St(t, l, a, e), l.child);
    }
    var ki = { dehydrated: null, treeContext: null, retryLane: 0, hydrationErrors: null };
    function Wi(t) {
      return { baseLanes: t, cachePool: Pd() };
    }
    function $i(t, l, a) {
      return ((t = t !== null ? t.childLanes & ~a : 0), l && (t |= jt), t);
    }
    function Km(t, l, a) {
      var e = l.pendingProps,
        u = !1,
        n = (l.flags & 128) !== 0,
        i;
      if (((i = n) || (i = t !== null && t.memoizedState === null ? !1 : (ct.current & 2) !== 0), i && ((u = !0), (l.flags &= -129)), (i = (l.flags & 32) !== 0), (l.flags &= -33), t === null)) {
        if (Z) {
          if (
            (u ? Vl(l) : Kl(l),
            (t = lt)
              ? ((t = R0(t, al)),
                (t = t !== null && t.data !== '&' ? t : null),
                t !== null && ((l.memoizedState = { dehydrated: t, treeContext: ca !== null ? { id: rl, overflow: vl } : null, retryLane: 536870912, hydrationErrors: null }), (a = Wd(t)), (a.return = l), (l.child = a), (zt = l), (lt = null)))
              : (t = null),
            t === null)
          )
            throw fa(l);
          return (lf(t) ? (l.lanes = 32) : (l.lanes = 536870912), null);
        }
        var c = e.children;
        return (
          (e = e.fallback),
          u ? (Kl(l), (u = l.mode), (c = Cn({ mode: 'hidden', children: c }, u)), (e = Na(e, u, a, null)), (c.return = l), (e.return = l), (c.sibling = e), (l.child = c), (e = l.child), (e.memoizedState = Wi(a)), (e.childLanes = $i(t, i, a)), (l.memoizedState = ki), Ze(null, e)) : (Vl(l), Zc(l, c))
        );
      }
      var f = t.memoizedState;
      if (f !== null && ((c = f.dehydrated), c !== null)) {
        if (n)
          l.flags & 256
            ? (Vl(l), (l.flags &= -257), (l = Fi(t, l, a)))
            : l.memoizedState !== null
              ? (Kl(l), (l.child = t.child), (l.flags |= 128), (l = null))
              : (Kl(l),
                (c = e.fallback),
                (u = l.mode),
                (e = Cn({ mode: 'visible', children: e.children }, u)),
                (c = Na(c, u, a, null)),
                (c.flags |= 2),
                (e.return = l),
                (c.return = l),
                (e.sibling = c),
                (l.child = e),
                _a(l, t.child, null, a),
                (e = l.child),
                (e.memoizedState = Wi(a)),
                (e.childLanes = $i(t, i, a)),
                (l.memoizedState = ki),
                (l = Ze(null, e)));
        else if ((Vl(l), lf(c))) {
          if (((i = c.nextSibling && c.nextSibling.dataset), i)) var m = i.dgst;
          ((i = m), (e = Error(b(419))), (e.stack = ''), (e.digest = i), fu({ value: e, source: null, stack: null }), (l = Fi(t, l, a)));
        } else if ((rt || Te(t, l, a, !1), (i = (a & t.childLanes) !== 0), rt || i)) {
          if (((i = F), i !== null && ((e = Nd(i, a)), e !== 0 && e !== f.retryLane))) throw ((f.retryLane = e), qa(t, e), Ht(i, t, e), jf);
          (tf(c) || Rn(), (l = Fi(t, l, a)));
        } else tf(c) ? ((l.flags |= 192), (l.child = t.child), (l = null)) : ((t = f.treeContext), (lt = ul(c.nextSibling)), (zt = l), (Z = !0), (Pl = null), (al = !1), t !== null && Fd(l, t), (l = Zc(l, e.children)), (l.flags |= 4096));
        return l;
      }
      return u
        ? (Kl(l),
          (c = e.fallback),
          (u = l.mode),
          (f = t.child),
          (m = f.sibling),
          (e = Ul(f, { mode: 'hidden', children: e.children })),
          (e.subtreeFlags = f.subtreeFlags & 65011712),
          m !== null ? (c = Ul(m, c)) : ((c = Na(c, u, a, null)), (c.flags |= 2)),
          (c.return = l),
          (e.return = l),
          (e.sibling = c),
          (l.child = e),
          Ze(null, e),
          (e = l.child),
          (c = t.child.memoizedState),
          c === null ? (c = Wi(a)) : ((u = c.cachePool), u !== null ? ((f = mt._currentValue), (u = u.parent !== f ? { parent: f, pool: f } : u)) : (u = Pd()), (c = { baseLanes: c.baseLanes | a, cachePool: u })),
          (e.memoizedState = c),
          (e.childLanes = $i(t, i, a)),
          (l.memoizedState = ki),
          Ze(t.child, e))
        : (Vl(l), (a = t.child), (t = a.sibling), (a = Ul(a, { mode: 'visible', children: e.children })), (a.return = l), (a.sibling = null), t !== null && ((i = l.deletions), i === null ? ((l.deletions = [t]), (l.flags |= 16)) : i.push(t)), (l.child = a), (l.memoizedState = null), a);
    }
    function Zc(t, l) {
      return ((l = Cn({ mode: 'visible', children: l }, t.mode)), (l.return = t), (t.child = l));
    }
    function Cn(t, l) {
      return ((t = Gt(22, t, null, l)), (t.lanes = 0), t);
    }
    function Fi(t, l, a) {
      return (_a(l, t.child, null, a), (t = Zc(l, l.pendingProps.children)), (t.flags |= 2), (l.memoizedState = null), t);
    }
    function Us(t, l, a) {
      t.lanes |= l;
      var e = t.alternate;
      (e !== null && (e.lanes |= l), Dc(t.return, l, a));
    }
    function Ii(t, l, a, e, u, n) {
      var i = t.memoizedState;
      i === null ? (t.memoizedState = { isBackwards: l, rendering: null, renderingStartTime: 0, last: e, tail: a, tailMode: u, treeForkCount: n }) : ((i.isBackwards = l), (i.rendering = null), (i.renderingStartTime = 0), (i.last = e), (i.tail = a), (i.tailMode = u), (i.treeForkCount = n));
    }
    function Jm(t, l, a) {
      var e = l.pendingProps,
        u = e.revealOrder,
        n = e.tail;
      e = e.children;
      var i = ct.current,
        c = (i & 2) !== 0;
      if ((c ? ((i = (i & 1) | 2), (l.flags |= 128)) : (i &= 1), I(ct, i), St(t, l, e, a), (e = Z ? cu : 0), !c && t !== null && (t.flags & 128) !== 0))
        t: for (t = l.child; t !== null; ) {
          if (t.tag === 13) t.memoizedState !== null && Us(t, a, l);
          else if (t.tag === 19) Us(t, a, l);
          else if (t.child !== null) {
            ((t.child.return = t), (t = t.child));
            continue;
          }
          if (t === l) break t;
          for (; t.sibling === null; ) {
            if (t.return === null || t.return === l) break t;
            t = t.return;
          }
          ((t.sibling.return = t.return), (t = t.sibling));
        }
      switch (u) {
        case 'forwards':
          for (a = l.child, u = null; a !== null; ) ((t = a.alternate), t !== null && Mn(t) === null && (u = a), (a = a.sibling));
          ((a = u), a === null ? ((u = l.child), (l.child = null)) : ((u = a.sibling), (a.sibling = null)), Ii(l, !1, u, a, n, e));
          break;
        case 'backwards':
        case 'unstable_legacy-backwards':
          for (a = null, u = l.child, l.child = null; u !== null; ) {
            if (((t = u.alternate), t !== null && Mn(t) === null)) {
              l.child = u;
              break;
            }
            ((t = u.sibling), (u.sibling = a), (a = u), (u = t));
          }
          Ii(l, !0, a, null, n, e);
          break;
        case 'together':
          Ii(l, !1, null, null, void 0, e);
          break;
        default:
          l.memoizedState = null;
      }
      return l.child;
    }
    function Rl(t, l, a) {
      if ((t !== null && (l.dependencies = t.dependencies), (sa |= l.lanes), (a & l.childLanes) === 0))
        if (t !== null) {
          if ((Te(t, l, a, !1), (a & l.childLanes) === 0)) return null;
        } else return null;
      if (t !== null && l.child !== t.child) throw Error(b(153));
      if (l.child !== null) {
        for (t = l.child, a = Ul(t, t.pendingProps), l.child = a, a.return = l; t.sibling !== null; ) ((t = t.sibling), (a = a.sibling = Ul(t, t.pendingProps)), (a.return = l));
        a.sibling = null;
      }
      return l.child;
    }
    function Zf(t, l) {
      return (t.lanes & l) !== 0 ? !0 : ((t = t.dependencies), !!(t !== null && An(t)));
    }
    function yh(t, l, a) {
      switch (l.tag) {
        case 3:
          (bn(l, l.stateNode.containerInfo), Ll(l, mt, t.memoizedState.cache), Aa());
          break;
        case 27:
        case 5:
          yc(l);
          break;
        case 4:
          bn(l, l.stateNode.containerInfo);
          break;
        case 10:
          Ll(l, l.type, l.memoizedProps.value);
          break;
        case 31:
          if (l.memoizedState !== null) return ((l.flags |= 128), Bc(l), null);
          break;
        case 13:
          var e = l.memoizedState;
          if (e !== null) return e.dehydrated !== null ? (Vl(l), (l.flags |= 128), null) : (a & l.child.childLanes) !== 0 ? Km(t, l, a) : (Vl(l), (t = Rl(t, l, a)), t !== null ? t.sibling : null);
          Vl(l);
          break;
        case 19:
          var u = (t.flags & 128) !== 0;
          if (((e = (a & l.childLanes) !== 0), e || (Te(t, l, a, !1), (e = (a & l.childLanes) !== 0)), u)) {
            if (e) return Jm(t, l, a);
            l.flags |= 128;
          }
          if (((u = l.memoizedState), u !== null && ((u.rendering = null), (u.tail = null), (u.lastEffect = null)), I(ct, ct.current), e)) break;
          return null;
        case 22:
          return ((l.lanes = 0), Vm(t, l, a, l.pendingProps));
        case 24:
          Ll(l, mt, t.memoizedState.cache);
      }
      return Rl(t, l, a);
    }
    function wm(t, l, a) {
      if (t !== null)
        if (t.memoizedProps !== l.pendingProps) rt = !0;
        else {
          if (!Zf(t, a) && (l.flags & 128) === 0) return ((rt = !1), yh(t, l, a));
          rt = (t.flags & 131072) !== 0;
        }
      else ((rt = !1), Z && (l.flags & 1048576) !== 0 && $d(l, cu, l.index));
      switch (((l.lanes = 0), l.tag)) {
        case 16:
          t: {
            var e = l.pendingProps;
            if (((t = ba(l.elementType)), (l.type = t), typeof t == 'function')) Sf(t) ? ((e = Da(t, e)), (l.tag = 1), (l = Ms(null, l, t, e, a))) : ((l.tag = 0), (l = jc(null, l, t, e, a)));
            else {
              if (t != null) {
                var u = t.$$typeof;
                if (u === nf) {
                  ((l.tag = 11), (l = Ts(null, l, t, e, a)));
                  break t;
                } else if (u === cf) {
                  ((l.tag = 14), (l = Es(null, l, t, e, a)));
                  break t;
                }
              }
              throw ((l = vc(t) || t), Error(b(306, l, '')));
            }
          }
          return l;
        case 0:
          return jc(t, l, l.type, l.pendingProps, a);
        case 1:
          return ((e = l.type), (u = Da(e, l.pendingProps)), Ms(t, l, e, u, a));
        case 3:
          t: {
            if ((bn(l, l.stateNode.containerInfo), t === null)) throw Error(b(387));
            e = l.pendingProps;
            var n = l.memoizedState;
            ((u = n.element), Cc(t, l), $e(l, e, null, a));
            var i = l.memoizedState;
            if (((e = i.cache), Ll(l, mt, e), e !== n.cache && Uc(l, [mt], a, !0), We(), (e = i.element), n.isDehydrated))
              if (((n = { element: e, isDehydrated: !1, cache: i.cache }), (l.updateQueue.baseState = n), (l.memoizedState = n), l.flags & 256)) {
                l = Ds(t, l, e, a);
                break t;
              } else if (e !== u) {
                ((u = ll(Error(b(424)), l)), fu(u), (l = Ds(t, l, e, a)));
                break t;
              } else for (t = l.stateNode.containerInfo, t.nodeType === 9 ? (t = t.body) : (t = t.nodeName === 'HTML' ? t.ownerDocument.body : t), lt = ul(t.firstChild), zt = l, Z = !0, Pl = null, al = !0, a = am(l, null, e, a), l.child = a; a; ) ((a.flags = (a.flags & -3) | 4096), (a = a.sibling));
            else {
              if ((Aa(), e === u)) {
                l = Rl(t, l, a);
                break t;
              }
              St(t, l, e, a);
            }
            l = l.child;
          }
          return l;
        case 26:
          return (
            dn(t, l),
            t === null
              ? (a = Is(l.type, null, l.pendingProps, null))
                ? (l.memoizedState = a)
                : Z || ((a = l.type), (t = l.pendingProps), (e = Gn(Il.current).createElement(a)), (e[Nt] = l), (e[Bt] = t), Et(e, a, t), bt(e), (l.stateNode = e))
              : (l.memoizedState = Is(l.type, t.memoizedProps, l.pendingProps, t.memoizedState)),
            null
          );
        case 27:
          return (yc(l), t === null && Z && ((e = l.stateNode = Y0(l.type, l.pendingProps, Il.current)), (zt = l), (al = !0), (u = lt), ma(l.type) ? ((af = u), (lt = ul(e.firstChild))) : (lt = u)), St(t, l, l.pendingProps.children, a), dn(t, l), t === null && (l.flags |= 4194304), l.child);
        case 5:
          return (
            t === null && Z && ((u = e = lt) && ((e = Vh(e, l.type, l.pendingProps, al)), e !== null ? ((l.stateNode = e), (zt = l), (lt = ul(e.firstChild)), (al = !1), (u = !0)) : (u = !1)), u || fa(l)),
            yc(l),
            (u = l.type),
            (n = l.pendingProps),
            (i = t !== null ? t.memoizedProps : null),
            (e = n.children),
            Ic(u, n) ? (e = null) : i !== null && Ic(u, i) && (l.flags |= 32),
            l.memoizedState !== null && ((u = Df(t, l, ch, null, null, a)), (vu._currentValue = u)),
            dn(t, l),
            St(t, l, e, a),
            l.child
          );
        case 6:
          return (t === null && Z && ((t = a = lt) && ((a = Kh(a, l.pendingProps, al)), a !== null ? ((l.stateNode = a), (zt = l), (lt = null), (t = !0)) : (t = !1)), t || fa(l)), null);
        case 13:
          return Km(t, l, a);
        case 4:
          return (bn(l, l.stateNode.containerInfo), (e = l.pendingProps), t === null ? (l.child = _a(l, null, e, a)) : St(t, l, e, a), l.child);
        case 11:
          return Ts(t, l, l.type, l.pendingProps, a);
        case 7:
          return (St(t, l, l.pendingProps, a), l.child);
        case 8:
          return (St(t, l, l.pendingProps.children, a), l.child);
        case 12:
          return (St(t, l, l.pendingProps.children, a), l.child);
        case 10:
          return ((e = l.pendingProps), Ll(l, l.type, e.value), St(t, l, e.children, a), l.child);
        case 9:
          return ((u = l.type._context), (e = l.pendingProps.children), Oa(l), (u = Tt(u)), (e = e(u)), (l.flags |= 1), St(t, l, e, a), l.child);
        case 14:
          return Es(t, l, l.type, l.pendingProps, a);
        case 15:
          return Lm(t, l, l.type, l.pendingProps, a);
        case 19:
          return Jm(t, l, a);
        case 31:
          return hh(t, l, a);
        case 22:
          return Vm(t, l, a, l.pendingProps);
        case 24:
          return (
            Oa(l),
            (e = Tt(mt)),
            t === null
              ? ((u = Ef()), u === null && ((u = F), (n = Tf()), (u.pooledCache = n), n.refCount++, n !== null && (u.pooledCacheLanes |= a), (u = n)), (l.memoizedState = { parent: e, cache: u }), Of(l), Ll(l, mt, u))
              : ((t.lanes & a) !== 0 && (Cc(t, l), $e(l, null, null, a), We()),
                (u = t.memoizedState),
                (n = l.memoizedState),
                u.parent !== e ? ((u = { parent: e, cache: e }), (l.memoizedState = u), l.lanes === 0 && (l.memoizedState = l.updateQueue.baseState = u), Ll(l, mt, e)) : ((e = n.cache), Ll(l, mt, e), e !== u.cache && Uc(l, [mt], a, !0))),
            St(t, l, l.pendingProps.children, a),
            l.child
          );
        case 29:
          throw l.pendingProps;
      }
      throw Error(b(156, l.tag));
    }
    function Nl(t) {
      t.flags |= 4;
    }
    function Pi(t, l, a, e, u) {
      if (((l = (t.mode & 32) !== 0) && (l = !1), l)) {
        if (((t.flags |= 16777216), (u & 335544128) === u))
          if (t.stateNode.complete) t.flags |= 8192;
          else if (g0()) t.flags |= 8192;
          else throw ((Ta = On), Af);
      } else t.flags &= -16777217;
    }
    function xs(t, l) {
      if (l.type !== 'stylesheet' || (l.state.loading & 4) !== 0) t.flags &= -16777217;
      else if (((t.flags |= 16777216), !G0(l)))
        if (g0()) t.flags |= 8192;
        else throw ((Ta = On), Af);
    }
    function ku(t, l) {
      (l !== null && (t.flags |= 4), t.flags & 16384 && ((l = t.tag !== 22 ? bd() : 536870912), (t.lanes |= l), (ye |= l)));
    }
    function Be(t, l) {
      if (!Z)
        switch (t.tailMode) {
          case 'hidden':
            l = t.tail;
            for (var a = null; l !== null; ) (l.alternate !== null && (a = l), (l = l.sibling));
            a === null ? (t.tail = null) : (a.sibling = null);
            break;
          case 'collapsed':
            a = t.tail;
            for (var e = null; a !== null; ) (a.alternate !== null && (e = a), (a = a.sibling));
            e === null ? (l || t.tail === null ? (t.tail = null) : (t.tail.sibling = null)) : (e.sibling = null);
        }
    }
    function tt(t) {
      var l = t.alternate !== null && t.alternate.child === t.child,
        a = 0,
        e = 0;
      if (l) for (var u = t.child; u !== null; ) ((a |= u.lanes | u.childLanes), (e |= u.subtreeFlags & 65011712), (e |= u.flags & 65011712), (u.return = t), (u = u.sibling));
      else for (u = t.child; u !== null; ) ((a |= u.lanes | u.childLanes), (e |= u.subtreeFlags), (e |= u.flags), (u.return = t), (u = u.sibling));
      return ((t.subtreeFlags |= e), (t.childLanes = a), l);
    }
    function gh(t, l, a) {
      var e = l.pendingProps;
      switch ((zf(l), l.tag)) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
          return (tt(l), null);
        case 1:
          return (tt(l), null);
        case 3:
          return (
            (a = l.stateNode),
            (e = null),
            t !== null && (e = t.memoizedState.cache),
            l.memoizedState.cache !== e && (l.flags |= 2048),
            xl(mt),
            se(),
            a.pendingContext && ((a.context = a.pendingContext), (a.pendingContext = null)),
            (t === null || t.child === null) && (ja(l) ? Nl(l) : t === null || (t.memoizedState.isDehydrated && (l.flags & 256) === 0) || ((l.flags |= 1024), Vi())),
            tt(l),
            null
          );
        case 26:
          var u = l.type,
            n = l.memoizedState;
          return (t === null ? (Nl(l), n !== null ? (tt(l), xs(l, n)) : (tt(l), Pi(l, u, null, e, a))) : n ? (n !== t.memoizedState ? (Nl(l), tt(l), xs(l, n)) : (tt(l), (l.flags &= -16777217))) : ((t = t.memoizedProps), t !== e && Nl(l), tt(l), Pi(l, u, t, e, a)), null);
        case 27:
          if ((pn(l), (a = Il.current), (u = l.type), t !== null && l.stateNode != null)) t.memoizedProps !== e && Nl(l);
          else {
            if (!e) {
              if (l.stateNode === null) throw Error(b(166));
              return (tt(l), null);
            }
            ((t = yl.current), ja(l) ? is(l, t) : ((t = Y0(u, e, a)), (l.stateNode = t), Nl(l)));
          }
          return (tt(l), null);
        case 5:
          if ((pn(l), (u = l.type), t !== null && l.stateNode != null)) t.memoizedProps !== e && Nl(l);
          else {
            if (!e) {
              if (l.stateNode === null) throw Error(b(166));
              return (tt(l), null);
            }
            if (((n = yl.current), ja(l))) is(l, n);
            else {
              var i = Gn(Il.current);
              switch (n) {
                case 1:
                  n = i.createElementNS('http://www.w3.org/2000/svg', u);
                  break;
                case 2:
                  n = i.createElementNS('http://www.w3.org/1998/Math/MathML', u);
                  break;
                default:
                  switch (u) {
                    case 'svg':
                      n = i.createElementNS('http://www.w3.org/2000/svg', u);
                      break;
                    case 'math':
                      n = i.createElementNS('http://www.w3.org/1998/Math/MathML', u);
                      break;
                    case 'script':
                      ((n = i.createElement('div')), (n.innerHTML = '<script><\/script>'), (n = n.removeChild(n.firstChild)));
                      break;
                    case 'select':
                      ((n = typeof e.is == 'string' ? i.createElement('select', { is: e.is }) : i.createElement('select')), e.multiple ? (n.multiple = !0) : e.size && (n.size = e.size));
                      break;
                    default:
                      n = typeof e.is == 'string' ? i.createElement(u, { is: e.is }) : i.createElement(u);
                  }
              }
              ((n[Nt] = l), (n[Bt] = e));
              t: for (i = l.child; i !== null; ) {
                if (i.tag === 5 || i.tag === 6) n.appendChild(i.stateNode);
                else if (i.tag !== 4 && i.tag !== 27 && i.child !== null) {
                  ((i.child.return = i), (i = i.child));
                  continue;
                }
                if (i === l) break t;
                for (; i.sibling === null; ) {
                  if (i.return === null || i.return === l) break t;
                  i = i.return;
                }
                ((i.sibling.return = i.return), (i = i.sibling));
              }
              l.stateNode = n;
              t: switch ((Et(n, u, e), u)) {
                case 'button':
                case 'input':
                case 'select':
                case 'textarea':
                  e = !!e.autoFocus;
                  break t;
                case 'img':
                  e = !0;
                  break t;
                default:
                  e = !1;
              }
              e && Nl(l);
            }
          }
          return (tt(l), Pi(l, l.type, t === null ? null : t.memoizedProps, l.pendingProps, a), null);
        case 6:
          if (t && l.stateNode != null) t.memoizedProps !== e && Nl(l);
          else {
            if (typeof e != 'string' && l.stateNode === null) throw Error(b(166));
            if (((t = Il.current), ja(l))) {
              if (((t = l.stateNode), (a = l.memoizedProps), (e = null), (u = zt), u !== null))
                switch (u.tag) {
                  case 27:
                  case 5:
                    e = u.memoizedProps;
                }
              ((t[Nt] = l), (t = !!(t.nodeValue === a || (e !== null && e.suppressHydrationWarning === !0) || q0(t.nodeValue, a))), t || fa(l, !0));
            } else ((t = Gn(t).createTextNode(e)), (t[Nt] = l), (l.stateNode = t));
          }
          return (tt(l), null);
        case 31:
          if (((a = l.memoizedState), t === null || t.memoizedState !== null)) {
            if (((e = ja(l)), a !== null)) {
              if (t === null) {
                if (!e) throw Error(b(318));
                if (((t = l.memoizedState), (t = t !== null ? t.dehydrated : null), !t)) throw Error(b(557));
                t[Nt] = l;
              } else (Aa(), (l.flags & 128) === 0 && (l.memoizedState = null), (l.flags |= 4));
              (tt(l), (t = !1));
            } else ((a = Vi()), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = a), (t = !0));
            if (!t) return l.flags & 256 ? (Xt(l), l) : (Xt(l), null);
            if ((l.flags & 128) !== 0) throw Error(b(558));
          }
          return (tt(l), null);
        case 13:
          if (((e = l.memoizedState), t === null || (t.memoizedState !== null && t.memoizedState.dehydrated !== null))) {
            if (((u = ja(l)), e !== null && e.dehydrated !== null)) {
              if (t === null) {
                if (!u) throw Error(b(318));
                if (((u = l.memoizedState), (u = u !== null ? u.dehydrated : null), !u)) throw Error(b(317));
                u[Nt] = l;
              } else (Aa(), (l.flags & 128) === 0 && (l.memoizedState = null), (l.flags |= 4));
              (tt(l), (u = !1));
            } else ((u = Vi()), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = u), (u = !0));
            if (!u) return l.flags & 256 ? (Xt(l), l) : (Xt(l), null);
          }
          return (
            Xt(l),
            (l.flags & 128) !== 0
              ? ((l.lanes = a), l)
              : ((a = e !== null),
                (t = t !== null && t.memoizedState !== null),
                a &&
                  ((e = l.child),
                  (u = null),
                  e.alternate !== null && e.alternate.memoizedState !== null && e.alternate.memoizedState.cachePool !== null && (u = e.alternate.memoizedState.cachePool.pool),
                  (n = null),
                  e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool),
                  n !== u && (e.flags |= 2048)),
                a !== t && a && (l.child.flags |= 8192),
                ku(l, l.updateQueue),
                tt(l),
                null)
          );
        case 4:
          return (se(), t === null && Wf(l.stateNode.containerInfo), tt(l), null);
        case 10:
          return (xl(l.type), tt(l), null);
        case 19:
          if ((pt(ct), (e = l.memoizedState), e === null)) return (tt(l), null);
          if (((u = (l.flags & 128) !== 0), (n = e.rendering), n === null))
            if (u) Be(e, !1);
            else {
              if (it !== 0 || (t !== null && (t.flags & 128) !== 0))
                for (t = l.child; t !== null; ) {
                  if (((n = Mn(t)), n !== null)) {
                    for (l.flags |= 128, Be(e, !1), t = n.updateQueue, l.updateQueue = t, ku(l, t), l.subtreeFlags = 0, t = a, a = l.child; a !== null; ) (kd(a, t), (a = a.sibling));
                    return (I(ct, (ct.current & 1) | 2), Z && Al(l, e.treeForkCount), l.child);
                  }
                  t = t.sibling;
                }
              e.tail !== null && Zt() > Hn && ((l.flags |= 128), (u = !0), Be(e, !1), (l.lanes = 4194304));
            }
          else {
            if (!u)
              if (((t = Mn(n)), t !== null)) {
                if (((l.flags |= 128), (u = !0), (t = t.updateQueue), (l.updateQueue = t), ku(l, t), Be(e, !0), e.tail === null && e.tailMode === 'hidden' && !n.alternate && !Z)) return (tt(l), null);
              } else 2 * Zt() - e.renderingStartTime > Hn && a !== 536870912 && ((l.flags |= 128), (u = !0), Be(e, !1), (l.lanes = 4194304));
            e.isBackwards ? ((n.sibling = l.child), (l.child = n)) : ((t = e.last), t !== null ? (t.sibling = n) : (l.child = n), (e.last = n));
          }
          return e.tail !== null ? ((t = e.tail), (e.rendering = t), (e.tail = t.sibling), (e.renderingStartTime = Zt()), (t.sibling = null), (a = ct.current), I(ct, u ? (a & 1) | 2 : a & 1), Z && Al(l, e.treeForkCount), t) : (tt(l), null);
        case 22:
        case 23:
          return (
            Xt(l),
            _f(),
            (e = l.memoizedState !== null),
            t !== null ? (t.memoizedState !== null) !== e && (l.flags |= 8192) : e && (l.flags |= 8192),
            e ? (a & 536870912) !== 0 && (l.flags & 128) === 0 && (tt(l), l.subtreeFlags & 6 && (l.flags |= 8192)) : tt(l),
            (a = l.updateQueue),
            a !== null && ku(l, a.retryQueue),
            (a = null),
            t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool),
            (e = null),
            l.memoizedState !== null && l.memoizedState.cachePool !== null && (e = l.memoizedState.cachePool.pool),
            e !== a && (l.flags |= 2048),
            t !== null && pt(za),
            null
          );
        case 24:
          return ((a = null), t !== null && (a = t.memoizedState.cache), l.memoizedState.cache !== a && (l.flags |= 2048), xl(mt), tt(l), null);
        case 25:
          return null;
        case 30:
          return null;
      }
      throw Error(b(156, l.tag));
    }
    function bh(t, l) {
      switch ((zf(l), l.tag)) {
        case 1:
          return ((t = l.flags), t & 65536 ? ((l.flags = (t & -65537) | 128), l) : null);
        case 3:
          return (xl(mt), se(), (t = l.flags), (t & 65536) !== 0 && (t & 128) === 0 ? ((l.flags = (t & -65537) | 128), l) : null);
        case 26:
        case 27:
        case 5:
          return (pn(l), null);
        case 31:
          if (l.memoizedState !== null) {
            if ((Xt(l), l.alternate === null)) throw Error(b(340));
            Aa();
          }
          return ((t = l.flags), t & 65536 ? ((l.flags = (t & -65537) | 128), l) : null);
        case 13:
          if ((Xt(l), (t = l.memoizedState), t !== null && t.dehydrated !== null)) {
            if (l.alternate === null) throw Error(b(340));
            Aa();
          }
          return ((t = l.flags), t & 65536 ? ((l.flags = (t & -65537) | 128), l) : null);
        case 19:
          return (pt(ct), null);
        case 4:
          return (se(), null);
        case 10:
          return (xl(l.type), null);
        case 22:
        case 23:
          return (Xt(l), _f(), t !== null && pt(za), (t = l.flags), t & 65536 ? ((l.flags = (t & -65537) | 128), l) : null);
        case 24:
          return (xl(mt), null);
        case 25:
          return null;
        default:
          return null;
      }
    }
    function km(t, l) {
      switch ((zf(l), l.tag)) {
        case 3:
          (xl(mt), se());
          break;
        case 26:
        case 27:
        case 5:
          pn(l);
          break;
        case 4:
          se();
          break;
        case 31:
          l.memoizedState !== null && Xt(l);
          break;
        case 13:
          Xt(l);
          break;
        case 19:
          pt(ct);
          break;
        case 10:
          xl(l.type);
          break;
        case 22:
        case 23:
          (Xt(l), _f(), t !== null && pt(za));
          break;
        case 24:
          xl(mt);
      }
    }
    function Au(t, l) {
      try {
        var a = l.updateQueue,
          e = a !== null ? a.lastEffect : null;
        if (e !== null) {
          var u = e.next;
          a = u;
          do {
            if ((a.tag & t) === t) {
              e = void 0;
              var n = a.create,
                i = a.inst;
              ((e = n()), (i.destroy = e));
            }
            a = a.next;
          } while (a !== u);
        }
      } catch (c) {
        w(l, l.return, c);
      }
    }
    function oa(t, l, a) {
      try {
        var e = l.updateQueue,
          u = e !== null ? e.lastEffect : null;
        if (u !== null) {
          var n = u.next;
          e = n;
          do {
            if ((e.tag & t) === t) {
              var i = e.inst,
                c = i.destroy;
              if (c !== void 0) {
                ((i.destroy = void 0), (u = l));
                var f = a,
                  m = c;
                try {
                  m();
                } catch (h) {
                  w(u, f, h);
                }
              }
            }
            e = e.next;
          } while (e !== n);
        }
      } catch (h) {
        w(l, l.return, h);
      }
    }
    function Wm(t) {
      var l = t.updateQueue;
      if (l !== null) {
        var a = t.stateNode;
        try {
          um(l, a);
        } catch (e) {
          w(t, t.return, e);
        }
      }
    }
    function $m(t, l, a) {
      ((a.props = Da(t.type, t.memoizedProps)), (a.state = t.memoizedState));
      try {
        a.componentWillUnmount();
      } catch (e) {
        w(t, l, e);
      }
    }
    function Ie(t, l) {
      try {
        var a = t.ref;
        if (a !== null) {
          switch (t.tag) {
            case 26:
            case 27:
            case 5:
              var e = t.stateNode;
              break;
            case 30:
              e = t.stateNode;
              break;
            default:
              e = t.stateNode;
          }
          typeof a == 'function' ? (t.refCleanup = a(e)) : (a.current = e);
        }
      } catch (u) {
        w(t, l, u);
      }
    }
    function hl(t, l) {
      var a = t.ref,
        e = t.refCleanup;
      if (a !== null)
        if (typeof e == 'function')
          try {
            e();
          } catch (u) {
            w(t, l, u);
          } finally {
            ((t.refCleanup = null), (t = t.alternate), t != null && (t.refCleanup = null));
          }
        else if (typeof a == 'function')
          try {
            a(null);
          } catch (u) {
            w(t, l, u);
          }
        else a.current = null;
    }
    function Fm(t) {
      var l = t.type,
        a = t.memoizedProps,
        e = t.stateNode;
      try {
        t: switch (l) {
          case 'button':
          case 'input':
          case 'select':
          case 'textarea':
            a.autoFocus && e.focus();
            break t;
          case 'img':
            a.src ? (e.src = a.src) : a.srcSet && (e.srcset = a.srcSet);
        }
      } catch (u) {
        w(t, t.return, u);
      }
    }
    function tc(t, l, a) {
      try {
        var e = t.stateNode;
        (Qh(e, t.type, a, l), (e[Bt] = l));
      } catch (u) {
        w(t, t.return, u);
      }
    }
    function Im(t) {
      return t.tag === 5 || t.tag === 3 || t.tag === 26 || (t.tag === 27 && ma(t.type)) || t.tag === 4;
    }
    function lc(t) {
      t: for (;;) {
        for (; t.sibling === null; ) {
          if (t.return === null || Im(t.return)) return null;
          t = t.return;
        }
        for (t.sibling.return = t.return, t = t.sibling; t.tag !== 5 && t.tag !== 6 && t.tag !== 18; ) {
          if ((t.tag === 27 && ma(t.type)) || t.flags & 2 || t.child === null || t.tag === 4) continue t;
          ((t.child.return = t), (t = t.child));
        }
        if (!(t.flags & 2)) return t.stateNode;
      }
    }
    function Lc(t, l, a) {
      var e = t.tag;
      if (e === 5 || e === 6)
        ((t = t.stateNode),
          l ? (a.nodeType === 9 ? a.body : a.nodeName === 'HTML' ? a.ownerDocument.body : a).insertBefore(t, l) : ((l = a.nodeType === 9 ? a.body : a.nodeName === 'HTML' ? a.ownerDocument.body : a), l.appendChild(t), (a = a._reactRootContainer), a != null || l.onclick !== null || (l.onclick = Ml)));
      else if (e !== 4 && (e === 27 && ma(t.type) && ((a = t.stateNode), (l = null)), (t = t.child), t !== null)) for (Lc(t, l, a), t = t.sibling; t !== null; ) (Lc(t, l, a), (t = t.sibling));
    }
    function qn(t, l, a) {
      var e = t.tag;
      if (e === 5 || e === 6) ((t = t.stateNode), l ? a.insertBefore(t, l) : a.appendChild(t));
      else if (e !== 4 && (e === 27 && ma(t.type) && (a = t.stateNode), (t = t.child), t !== null)) for (qn(t, l, a), t = t.sibling; t !== null; ) (qn(t, l, a), (t = t.sibling));
    }
    function Pm(t) {
      var l = t.stateNode,
        a = t.memoizedProps;
      try {
        for (var e = t.type, u = l.attributes; u.length; ) l.removeAttributeNode(u[0]);
        (Et(l, e, a), (l[Nt] = t), (l[Bt] = a));
      } catch (n) {
        w(t, t.return, n);
      }
    }
    var Ol = !1,
      dt = !1,
      ac = !1,
      Cs = typeof WeakSet == 'function' ? WeakSet : Set,
      gt = null;
    function ph(t, l) {
      if (((t = t.containerInfo), ($c = Vn), (t = Gd(t)), gf(t))) {
        if ('selectionStart' in t) var a = { start: t.selectionStart, end: t.selectionEnd };
        else
          t: {
            a = ((a = t.ownerDocument) && a.defaultView) || window;
            var e = a.getSelection && a.getSelection();
            if (e && e.rangeCount !== 0) {
              a = e.anchorNode;
              var u = e.anchorOffset,
                n = e.focusNode;
              e = e.focusOffset;
              try {
                (a.nodeType, n.nodeType);
              } catch {
                a = null;
                break t;
              }
              var i = 0,
                c = -1,
                f = -1,
                m = 0,
                h = 0,
                y = t,
                d = null;
              l: for (;;) {
                for (var v; y !== a || (u !== 0 && y.nodeType !== 3) || (c = i + u), y !== n || (e !== 0 && y.nodeType !== 3) || (f = i + e), y.nodeType === 3 && (i += y.nodeValue.length), (v = y.firstChild) !== null; ) ((d = y), (y = v));
                for (;;) {
                  if (y === t) break l;
                  if ((d === a && ++m === u && (c = i), d === n && ++h === e && (f = i), (v = y.nextSibling) !== null)) break;
                  ((y = d), (d = y.parentNode));
                }
                y = v;
              }
              a = c === -1 || f === -1 ? null : { start: c, end: f };
            } else a = null;
          }
        a = a || { start: 0, end: 0 };
      } else a = null;
      for (Fc = { focusedElem: t, selectionRange: a }, Vn = !1, gt = l; gt !== null; )
        if (((l = gt), (t = l.child), (l.subtreeFlags & 1028) !== 0 && t !== null)) ((t.return = l), (gt = t));
        else
          for (; gt !== null; ) {
            switch (((l = gt), (n = l.alternate), (t = l.flags), l.tag)) {
              case 0:
                if ((t & 4) !== 0 && ((t = l.updateQueue), (t = t !== null ? t.events : null), t !== null)) for (a = 0; a < t.length; a++) ((u = t[a]), (u.ref.impl = u.nextImpl));
                break;
              case 11:
              case 15:
                break;
              case 1:
                if ((t & 1024) !== 0 && n !== null) {
                  ((t = void 0), (a = l), (u = n.memoizedProps), (n = n.memoizedState), (e = a.stateNode));
                  try {
                    var N = Da(a.type, u);
                    ((t = e.getSnapshotBeforeUpdate(N, n)), (e.__reactInternalSnapshotBeforeUpdate = t));
                  } catch (E) {
                    w(a, a.return, E);
                  }
                }
                break;
              case 3:
                if ((t & 1024) !== 0) {
                  if (((t = l.stateNode.containerInfo), (a = t.nodeType), a === 9)) Pc(t);
                  else if (a === 1)
                    switch (t.nodeName) {
                      case 'HEAD':
                      case 'HTML':
                      case 'BODY':
                        Pc(t);
                        break;
                      default:
                        t.textContent = '';
                    }
                }
                break;
              case 5:
              case 26:
              case 27:
              case 6:
              case 4:
              case 17:
                break;
              default:
                if ((t & 1024) !== 0) throw Error(b(163));
            }
            if (((t = l.sibling), t !== null)) {
              ((t.return = l.return), (gt = t));
              break;
            }
            gt = l.return;
          }
    }
    function t0(t, l, a) {
      var e = a.flags;
      switch (a.tag) {
        case 0:
        case 11:
        case 15:
          (Tl(t, a), e & 4 && Au(5, a));
          break;
        case 1:
          if ((Tl(t, a), e & 4))
            if (((t = a.stateNode), l === null))
              try {
                t.componentDidMount();
              } catch (i) {
                w(a, a.return, i);
              }
            else {
              var u = Da(a.type, l.memoizedProps);
              l = l.memoizedState;
              try {
                t.componentDidUpdate(u, l, t.__reactInternalSnapshotBeforeUpdate);
              } catch (i) {
                w(a, a.return, i);
              }
            }
          (e & 64 && Wm(a), e & 512 && Ie(a, a.return));
          break;
        case 3:
          if ((Tl(t, a), e & 64 && ((t = a.updateQueue), t !== null))) {
            if (((l = null), a.child !== null))
              switch (a.child.tag) {
                case 27:
                case 5:
                  l = a.child.stateNode;
                  break;
                case 1:
                  l = a.child.stateNode;
              }
            try {
              um(t, l);
            } catch (i) {
              w(a, a.return, i);
            }
          }
          break;
        case 27:
          l === null && e & 4 && Pm(a);
        case 26:
        case 5:
          (Tl(t, a), l === null && e & 4 && Fm(a), e & 512 && Ie(a, a.return));
          break;
        case 12:
          Tl(t, a);
          break;
        case 31:
          (Tl(t, a), e & 4 && e0(t, a));
          break;
        case 13:
          (Tl(t, a), e & 4 && u0(t, a), e & 64 && ((t = a.memoizedState), t !== null && ((t = t.dehydrated), t !== null && ((a = Mh.bind(null, a)), Jh(t, a)))));
          break;
        case 22:
          if (((e = a.memoizedState !== null || Ol), !e)) {
            ((l = (l !== null && l.memoizedState !== null) || dt), (u = Ol));
            var n = dt;
            ((Ol = e), (dt = l) && !n ? El(t, a, (a.subtreeFlags & 8772) !== 0) : Tl(t, a), (Ol = u), (dt = n));
          }
          break;
        case 30:
          break;
        default:
          Tl(t, a);
      }
    }
    function l0(t) {
      var l = t.alternate;
      (l !== null && ((t.alternate = null), l0(l)),
        (t.child = null),
        (t.deletions = null),
        (t.sibling = null),
        t.tag === 5 && ((l = t.stateNode), l !== null && df(l)),
        (t.stateNode = null),
        (t.return = null),
        (t.dependencies = null),
        (t.memoizedProps = null),
        (t.memoizedState = null),
        (t.pendingProps = null),
        (t.stateNode = null),
        (t.updateQueue = null));
    }
    var ut = null,
      Ct = !1;
    function zl(t, l, a) {
      for (a = a.child; a !== null; ) (a0(t, l, a), (a = a.sibling));
    }
    function a0(t, l, a) {
      if (Lt && typeof Lt.onCommitFiberUnmount == 'function')
        try {
          Lt.onCommitFiberUnmount(bu, a);
        } catch {}
      switch (a.tag) {
        case 26:
          (dt || hl(a, l), zl(t, l, a), a.memoizedState ? a.memoizedState.count-- : a.stateNode && ((a = a.stateNode), a.parentNode.removeChild(a)));
          break;
        case 27:
          dt || hl(a, l);
          var e = ut,
            u = Ct;
          (ma(a.type) && ((ut = a.stateNode), (Ct = !1)), zl(t, l, a), au(a.stateNode), (ut = e), (Ct = u));
          break;
        case 5:
          dt || hl(a, l);
        case 6:
          if (((e = ut), (u = Ct), (ut = null), zl(t, l, a), (ut = e), (Ct = u), ut !== null))
            if (Ct)
              try {
                (ut.nodeType === 9 ? ut.body : ut.nodeName === 'HTML' ? ut.ownerDocument.body : ut).removeChild(a.stateNode);
              } catch (n) {
                w(a, l, n);
              }
            else
              try {
                ut.removeChild(a.stateNode);
              } catch (n) {
                w(a, l, n);
              }
          break;
        case 18:
          ut !== null && (Ct ? ((t = ut), ws(t.nodeType === 9 ? t.body : t.nodeName === 'HTML' ? t.ownerDocument.body : t, a.stateNode), Se(t)) : ws(ut, a.stateNode));
          break;
        case 4:
          ((e = ut), (u = Ct), (ut = a.stateNode.containerInfo), (Ct = !0), zl(t, l, a), (ut = e), (Ct = u));
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          (oa(2, a, l), dt || oa(4, a, l), zl(t, l, a));
          break;
        case 1:
          (dt || (hl(a, l), (e = a.stateNode), typeof e.componentWillUnmount == 'function' && $m(a, l, e)), zl(t, l, a));
          break;
        case 21:
          zl(t, l, a);
          break;
        case 22:
          ((dt = (e = dt) || a.memoizedState !== null), zl(t, l, a), (dt = e));
          break;
        default:
          zl(t, l, a);
      }
    }
    function e0(t, l) {
      if (l.memoizedState === null && ((t = l.alternate), t !== null && ((t = t.memoizedState), t !== null))) {
        t = t.dehydrated;
        try {
          Se(t);
        } catch (a) {
          w(l, l.return, a);
        }
      }
    }
    function u0(t, l) {
      if (l.memoizedState === null && ((t = l.alternate), t !== null && ((t = t.memoizedState), t !== null && ((t = t.dehydrated), t !== null))))
        try {
          Se(t);
        } catch (a) {
          w(l, l.return, a);
        }
    }
    function Sh(t) {
      switch (t.tag) {
        case 31:
        case 13:
        case 19:
          var l = t.stateNode;
          return (l === null && (l = t.stateNode = new Cs()), l);
        case 22:
          return ((t = t.stateNode), (l = t._retryCache), l === null && (l = t._retryCache = new Cs()), l);
        default:
          throw Error(b(435, t.tag));
      }
    }
    function Wu(t, l) {
      var a = Sh(t);
      l.forEach(function (e) {
        if (!a.has(e)) {
          a.add(e);
          var u = Dh.bind(null, t, e);
          e.then(u, u);
        }
      });
    }
    function Ut(t, l) {
      var a = l.deletions;
      if (a !== null)
        for (var e = 0; e < a.length; e++) {
          var u = a[e],
            n = t,
            i = l,
            c = i;
          t: for (; c !== null; ) {
            switch (c.tag) {
              case 27:
                if (ma(c.type)) {
                  ((ut = c.stateNode), (Ct = !1));
                  break t;
                }
                break;
              case 5:
                ((ut = c.stateNode), (Ct = !1));
                break t;
              case 3:
              case 4:
                ((ut = c.stateNode.containerInfo), (Ct = !0));
                break t;
            }
            c = c.return;
          }
          if (ut === null) throw Error(b(160));
          (a0(n, i, u), (ut = null), (Ct = !1), (n = u.alternate), n !== null && (n.return = null), (u.return = null));
        }
      if (l.subtreeFlags & 13886) for (l = l.child; l !== null; ) (n0(l, t), (l = l.sibling));
    }
    var fl = null;
    function n0(t, l) {
      var a = t.alternate,
        e = t.flags;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          (Ut(l, t), xt(t), e & 4 && (oa(3, t, t.return), Au(3, t), oa(5, t, t.return)));
          break;
        case 1:
          (Ut(l, t), xt(t), e & 512 && (dt || a === null || hl(a, a.return)), e & 64 && Ol && ((t = t.updateQueue), t !== null && ((e = t.callbacks), e !== null && ((a = t.shared.hiddenCallbacks), (t.shared.hiddenCallbacks = a === null ? e : a.concat(e))))));
          break;
        case 26:
          var u = fl;
          if ((Ut(l, t), xt(t), e & 512 && (dt || a === null || hl(a, a.return)), e & 4)) {
            var n = a !== null ? a.memoizedState : null;
            if (((e = t.memoizedState), a === null))
              if (e === null)
                if (t.stateNode === null) {
                  t: {
                    ((e = t.type), (a = t.memoizedProps), (u = u.ownerDocument || u));
                    l: switch (e) {
                      case 'title':
                        ((n = u.getElementsByTagName('title')[0]),
                          (!n || n[Nu] || n[Nt] || n.namespaceURI === 'http://www.w3.org/2000/svg' || n.hasAttribute('itemprop')) && ((n = u.createElement(e)), u.head.insertBefore(n, u.querySelector('head > title'))),
                          Et(n, e, a),
                          (n[Nt] = t),
                          bt(n),
                          (e = n));
                        break t;
                      case 'link':
                        var i = td('link', 'href', u).get(e + (a.href || ''));
                        if (i) {
                          for (var c = 0; c < i.length; c++)
                            if (
                              ((n = i[c]),
                              n.getAttribute('href') === (a.href == null || a.href === '' ? null : a.href) &&
                                n.getAttribute('rel') === (a.rel == null ? null : a.rel) &&
                                n.getAttribute('title') === (a.title == null ? null : a.title) &&
                                n.getAttribute('crossorigin') === (a.crossOrigin == null ? null : a.crossOrigin))
                            ) {
                              i.splice(c, 1);
                              break l;
                            }
                        }
                        ((n = u.createElement(e)), Et(n, e, a), u.head.appendChild(n));
                        break;
                      case 'meta':
                        if ((i = td('meta', 'content', u).get(e + (a.content || '')))) {
                          for (c = 0; c < i.length; c++)
                            if (
                              ((n = i[c]),
                              n.getAttribute('content') === (a.content == null ? null : '' + a.content) &&
                                n.getAttribute('name') === (a.name == null ? null : a.name) &&
                                n.getAttribute('property') === (a.property == null ? null : a.property) &&
                                n.getAttribute('http-equiv') === (a.httpEquiv == null ? null : a.httpEquiv) &&
                                n.getAttribute('charset') === (a.charSet == null ? null : a.charSet))
                            ) {
                              i.splice(c, 1);
                              break l;
                            }
                        }
                        ((n = u.createElement(e)), Et(n, e, a), u.head.appendChild(n));
                        break;
                      default:
                        throw Error(b(468, e));
                    }
                    ((n[Nt] = t), bt(n), (e = n));
                  }
                  t.stateNode = e;
                } else ld(u, t.type, t.stateNode);
              else t.stateNode = Ps(u, e, t.memoizedProps);
            else n !== e ? (n === null ? a.stateNode !== null && ((a = a.stateNode), a.parentNode.removeChild(a)) : n.count--, e === null ? ld(u, t.type, t.stateNode) : Ps(u, e, t.memoizedProps)) : e === null && t.stateNode !== null && tc(t, t.memoizedProps, a.memoizedProps);
          }
          break;
        case 27:
          (Ut(l, t), xt(t), e & 512 && (dt || a === null || hl(a, a.return)), a !== null && e & 4 && tc(t, t.memoizedProps, a.memoizedProps));
          break;
        case 5:
          if ((Ut(l, t), xt(t), e & 512 && (dt || a === null || hl(a, a.return)), t.flags & 32)) {
            u = t.stateNode;
            try {
              me(u, '');
            } catch (N) {
              w(t, t.return, N);
            }
          }
          (e & 4 && t.stateNode != null && ((u = t.memoizedProps), tc(t, u, a !== null ? a.memoizedProps : u)), e & 1024 && (ac = !0));
          break;
        case 6:
          if ((Ut(l, t), xt(t), e & 4)) {
            if (t.stateNode === null) throw Error(b(162));
            ((e = t.memoizedProps), (a = t.stateNode));
            try {
              a.nodeValue = e;
            } catch (N) {
              w(t, t.return, N);
            }
          }
          break;
        case 3:
          if (((vn = null), (u = fl), (fl = jn(l.containerInfo)), Ut(l, t), (fl = u), xt(t), e & 4 && a !== null && a.memoizedState.isDehydrated))
            try {
              Se(l.containerInfo);
            } catch (N) {
              w(t, t.return, N);
            }
          ac && ((ac = !1), i0(t));
          break;
        case 4:
          ((e = fl), (fl = jn(t.stateNode.containerInfo)), Ut(l, t), xt(t), (fl = e));
          break;
        case 12:
          (Ut(l, t), xt(t));
          break;
        case 31:
          (Ut(l, t), xt(t), e & 4 && ((e = t.updateQueue), e !== null && ((t.updateQueue = null), Wu(t, e))));
          break;
        case 13:
          (Ut(l, t), xt(t), t.child.flags & 8192 && (t.memoizedState !== null) != (a !== null && a.memoizedState !== null) && (ei = Zt()), e & 4 && ((e = t.updateQueue), e !== null && ((t.updateQueue = null), Wu(t, e))));
          break;
        case 22:
          u = t.memoizedState !== null;
          var f = a !== null && a.memoizedState !== null,
            m = Ol,
            h = dt;
          if (((Ol = m || u), (dt = h || f), Ut(l, t), (dt = h), (Ol = m), xt(t), e & 8192))
            t: for (l = t.stateNode, l._visibility = u ? l._visibility & -2 : l._visibility | 1, u && (a === null || f || Ol || dt || pa(t)), a = null, l = t; ; ) {
              if (l.tag === 5 || l.tag === 26) {
                if (a === null) {
                  f = a = l;
                  try {
                    if (((n = f.stateNode), u)) ((i = n.style), typeof i.setProperty == 'function' ? i.setProperty('display', 'none', 'important') : (i.display = 'none'));
                    else {
                      c = f.stateNode;
                      var y = f.memoizedProps.style,
                        d = y != null && y.hasOwnProperty('display') ? y.display : null;
                      c.style.display = d == null || typeof d == 'boolean' ? '' : ('' + d).trim();
                    }
                  } catch (N) {
                    w(f, f.return, N);
                  }
                }
              } else if (l.tag === 6) {
                if (a === null) {
                  f = l;
                  try {
                    f.stateNode.nodeValue = u ? '' : f.memoizedProps;
                  } catch (N) {
                    w(f, f.return, N);
                  }
                }
              } else if (l.tag === 18) {
                if (a === null) {
                  f = l;
                  try {
                    var v = f.stateNode;
                    u ? ks(v, !0) : ks(f.stateNode, !1);
                  } catch (N) {
                    w(f, f.return, N);
                  }
                }
              } else if (((l.tag !== 22 && l.tag !== 23) || l.memoizedState === null || l === t) && l.child !== null) {
                ((l.child.return = l), (l = l.child));
                continue;
              }
              if (l === t) break t;
              for (; l.sibling === null; ) {
                if (l.return === null || l.return === t) break t;
                (a === l && (a = null), (l = l.return));
              }
              (a === l && (a = null), (l.sibling.return = l.return), (l = l.sibling));
            }
          e & 4 && ((e = t.updateQueue), e !== null && ((a = e.retryQueue), a !== null && ((e.retryQueue = null), Wu(t, a))));
          break;
        case 19:
          (Ut(l, t), xt(t), e & 4 && ((e = t.updateQueue), e !== null && ((t.updateQueue = null), Wu(t, e))));
          break;
        case 30:
          break;
        case 21:
          break;
        default:
          (Ut(l, t), xt(t));
      }
    }
    function xt(t) {
      var l = t.flags;
      if (l & 2) {
        try {
          for (var a, e = t.return; e !== null; ) {
            if (Im(e)) {
              a = e;
              break;
            }
            e = e.return;
          }
          if (a == null) throw Error(b(160));
          switch (a.tag) {
            case 27:
              var u = a.stateNode,
                n = lc(t);
              qn(t, n, u);
              break;
            case 5:
              var i = a.stateNode;
              a.flags & 32 && (me(i, ''), (a.flags &= -33));
              var c = lc(t);
              qn(t, c, i);
              break;
            case 3:
            case 4:
              var f = a.stateNode.containerInfo,
                m = lc(t);
              Lc(t, m, f);
              break;
            default:
              throw Error(b(161));
          }
        } catch (h) {
          w(t, t.return, h);
        }
        t.flags &= -3;
      }
      l & 4096 && (t.flags &= -4097);
    }
    function i0(t) {
      if (t.subtreeFlags & 1024)
        for (t = t.child; t !== null; ) {
          var l = t;
          (i0(l), l.tag === 5 && l.flags & 1024 && l.stateNode.reset(), (t = t.sibling));
        }
    }
    function Tl(t, l) {
      if (l.subtreeFlags & 8772) for (l = l.child; l !== null; ) (t0(t, l.alternate, l), (l = l.sibling));
    }
    function pa(t) {
      for (t = t.child; t !== null; ) {
        var l = t;
        switch (l.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            (oa(4, l, l.return), pa(l));
            break;
          case 1:
            hl(l, l.return);
            var a = l.stateNode;
            (typeof a.componentWillUnmount == 'function' && $m(l, l.return, a), pa(l));
            break;
          case 27:
            au(l.stateNode);
          case 26:
          case 5:
            (hl(l, l.return), pa(l));
            break;
          case 22:
            l.memoizedState === null && pa(l);
            break;
          case 30:
            pa(l);
            break;
          default:
            pa(l);
        }
        t = t.sibling;
      }
    }
    function El(t, l, a) {
      for (a = a && (l.subtreeFlags & 8772) !== 0, l = l.child; l !== null; ) {
        var e = l.alternate,
          u = t,
          n = l,
          i = n.flags;
        switch (n.tag) {
          case 0:
          case 11:
          case 15:
            (El(u, n, a), Au(4, n));
            break;
          case 1:
            if ((El(u, n, a), (e = n), (u = e.stateNode), typeof u.componentDidMount == 'function'))
              try {
                u.componentDidMount();
              } catch (m) {
                w(e, e.return, m);
              }
            if (((e = n), (u = e.updateQueue), u !== null)) {
              var c = e.stateNode;
              try {
                var f = u.shared.hiddenCallbacks;
                if (f !== null) for (u.shared.hiddenCallbacks = null, u = 0; u < f.length; u++) em(f[u], c);
              } catch (m) {
                w(e, e.return, m);
              }
            }
            (a && i & 64 && Wm(n), Ie(n, n.return));
            break;
          case 27:
            Pm(n);
          case 26:
          case 5:
            (El(u, n, a), a && e === null && i & 4 && Fm(n), Ie(n, n.return));
            break;
          case 12:
            El(u, n, a);
            break;
          case 31:
            (El(u, n, a), a && i & 4 && e0(u, n));
            break;
          case 13:
            (El(u, n, a), a && i & 4 && u0(u, n));
            break;
          case 22:
            (n.memoizedState === null && El(u, n, a), Ie(n, n.return));
            break;
          case 30:
            break;
          default:
            El(u, n, a);
        }
        l = l.sibling;
      }
    }
    function Lf(t, l) {
      var a = null;
      (t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool),
        (t = null),
        l.memoizedState !== null && l.memoizedState.cachePool !== null && (t = l.memoizedState.cachePool.pool),
        t !== a && (t != null && t.refCount++, a != null && Tu(a)));
    }
    function Vf(t, l) {
      ((t = null), l.alternate !== null && (t = l.alternate.memoizedState.cache), (l = l.memoizedState.cache), l !== t && (l.refCount++, t != null && Tu(t)));
    }
    function cl(t, l, a, e) {
      if (l.subtreeFlags & 10256) for (l = l.child; l !== null; ) (c0(t, l, a, e), (l = l.sibling));
    }
    function c0(t, l, a, e) {
      var u = l.flags;
      switch (l.tag) {
        case 0:
        case 11:
        case 15:
          (cl(t, l, a, e), u & 2048 && Au(9, l));
          break;
        case 1:
          cl(t, l, a, e);
          break;
        case 3:
          (cl(t, l, a, e), u & 2048 && ((t = null), l.alternate !== null && (t = l.alternate.memoizedState.cache), (l = l.memoizedState.cache), l !== t && (l.refCount++, t != null && Tu(t))));
          break;
        case 12:
          if (u & 2048) {
            (cl(t, l, a, e), (t = l.stateNode));
            try {
              var n = l.memoizedProps,
                i = n.id,
                c = n.onPostCommit;
              typeof c == 'function' && c(i, l.alternate === null ? 'mount' : 'update', t.passiveEffectDuration, -0);
            } catch (f) {
              w(l, l.return, f);
            }
          } else cl(t, l, a, e);
          break;
        case 31:
          cl(t, l, a, e);
          break;
        case 13:
          cl(t, l, a, e);
          break;
        case 23:
          break;
        case 22:
          ((n = l.stateNode), (i = l.alternate), l.memoizedState !== null ? (n._visibility & 2 ? cl(t, l, a, e) : Pe(t, l)) : n._visibility & 2 ? cl(t, l, a, e) : ((n._visibility |= 2), La(t, l, a, e, (l.subtreeFlags & 10256) !== 0 || !1)), u & 2048 && Lf(i, l));
          break;
        case 24:
          (cl(t, l, a, e), u & 2048 && Vf(l.alternate, l));
          break;
        default:
          cl(t, l, a, e);
      }
    }
    function La(t, l, a, e, u) {
      for (u = u && ((l.subtreeFlags & 10256) !== 0 || !1), l = l.child; l !== null; ) {
        var n = t,
          i = l,
          c = a,
          f = e,
          m = i.flags;
        switch (i.tag) {
          case 0:
          case 11:
          case 15:
            (La(n, i, c, f, u), Au(8, i));
            break;
          case 23:
            break;
          case 22:
            var h = i.stateNode;
            (i.memoizedState !== null ? (h._visibility & 2 ? La(n, i, c, f, u) : Pe(n, i)) : ((h._visibility |= 2), La(n, i, c, f, u)), u && m & 2048 && Lf(i.alternate, i));
            break;
          case 24:
            (La(n, i, c, f, u), u && m & 2048 && Vf(i.alternate, i));
            break;
          default:
            La(n, i, c, f, u);
        }
        l = l.sibling;
      }
    }
    function Pe(t, l) {
      if (l.subtreeFlags & 10256)
        for (l = l.child; l !== null; ) {
          var a = t,
            e = l,
            u = e.flags;
          switch (e.tag) {
            case 22:
              (Pe(a, e), u & 2048 && Lf(e.alternate, e));
              break;
            case 24:
              (Pe(a, e), u & 2048 && Vf(e.alternate, e));
              break;
            default:
              Pe(a, e);
          }
          l = l.sibling;
        }
    }
    var Le = 8192;
    function Za(t, l, a) {
      if (t.subtreeFlags & Le) for (t = t.child; t !== null; ) (f0(t, l, a), (t = t.sibling));
    }
    function f0(t, l, a) {
      switch (t.tag) {
        case 26:
          (Za(t, l, a), t.flags & Le && t.memoizedState !== null && uy(a, fl, t.memoizedState, t.memoizedProps));
          break;
        case 5:
          Za(t, l, a);
          break;
        case 3:
        case 4:
          var e = fl;
          ((fl = jn(t.stateNode.containerInfo)), Za(t, l, a), (fl = e));
          break;
        case 22:
          t.memoizedState === null && ((e = t.alternate), e !== null && e.memoizedState !== null ? ((e = Le), (Le = 16777216), Za(t, l, a), (Le = e)) : Za(t, l, a));
          break;
        default:
          Za(t, l, a);
      }
    }
    function o0(t) {
      var l = t.alternate;
      if (l !== null && ((t = l.child), t !== null)) {
        l.child = null;
        do ((l = t.sibling), (t.sibling = null), (t = l));
        while (t !== null);
      }
    }
    function Re(t) {
      var l = t.deletions;
      if ((t.flags & 16) !== 0) {
        if (l !== null)
          for (var a = 0; a < l.length; a++) {
            var e = l[a];
            ((gt = e), d0(e, t));
          }
        o0(t);
      }
      if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) (s0(t), (t = t.sibling));
    }
    function s0(t) {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          (Re(t), t.flags & 2048 && oa(9, t, t.return));
          break;
        case 3:
          Re(t);
          break;
        case 12:
          Re(t);
          break;
        case 22:
          var l = t.stateNode;
          t.memoizedState !== null && l._visibility & 2 && (t.return === null || t.return.tag !== 13) ? ((l._visibility &= -3), mn(t)) : Re(t);
          break;
        default:
          Re(t);
      }
    }
    function mn(t) {
      var l = t.deletions;
      if ((t.flags & 16) !== 0) {
        if (l !== null)
          for (var a = 0; a < l.length; a++) {
            var e = l[a];
            ((gt = e), d0(e, t));
          }
        o0(t);
      }
      for (t = t.child; t !== null; ) {
        switch (((l = t), l.tag)) {
          case 0:
          case 11:
          case 15:
            (oa(8, l, l.return), mn(l));
            break;
          case 22:
            ((a = l.stateNode), a._visibility & 2 && ((a._visibility &= -3), mn(l)));
            break;
          default:
            mn(l);
        }
        t = t.sibling;
      }
    }
    function d0(t, l) {
      for (; gt !== null; ) {
        var a = gt;
        switch (a.tag) {
          case 0:
          case 11:
          case 15:
            oa(8, a, l);
            break;
          case 23:
          case 22:
            if (a.memoizedState !== null && a.memoizedState.cachePool !== null) {
              var e = a.memoizedState.cachePool.pool;
              e != null && e.refCount++;
            }
            break;
          case 24:
            Tu(a.memoizedState.cache);
        }
        if (((e = a.child), e !== null)) ((e.return = a), (gt = e));
        else
          t: for (a = t; gt !== null; ) {
            e = gt;
            var u = e.sibling,
              n = e.return;
            if ((l0(e), e === a)) {
              gt = null;
              break t;
            }
            if (u !== null) {
              ((u.return = n), (gt = u));
              break t;
            }
            gt = n;
          }
      }
    }
    var Nh = {
        getCacheForType: function (t) {
          var l = Tt(mt),
            a = l.data.get(t);
          return (a === void 0 && ((a = t()), l.data.set(t, a)), a);
        },
        cacheSignal: function () {
          return Tt(mt).controller.signal;
        },
      },
      zh = typeof WeakMap == 'function' ? WeakMap : Map,
      L = 0,
      F = null,
      X = null,
      j = 0,
      J = 0,
      Qt = null,
      Wl = !1,
      Ae = !1,
      Kf = !1,
      Yl = 0,
      it = 0,
      sa = 0,
      Ea = 0,
      Jf = 0,
      jt = 0,
      ye = 0,
      tu = null,
      qt = null,
      Vc = !1,
      ei = 0,
      m0 = 0,
      Hn = 1 / 0,
      Bn = null,
      aa = null,
      vt = 0,
      ea = null,
      ge = null,
      Cl = 0,
      Kc = 0,
      Jc = null,
      r0 = null,
      lu = 0,
      wc = null;
    function Kt() {
      return (L & 2) !== 0 && j !== 0 ? j & -j : U.T !== null ? kf() : zd();
    }
    function v0() {
      if (jt === 0)
        if ((j & 536870912) === 0 || Z) {
          var t = Xu;
          ((Xu <<= 1), (Xu & 3932160) === 0 && (Xu = 262144), (jt = t));
        } else jt = 536870912;
      return ((t = wt.current), t !== null && (t.flags |= 32), jt);
    }
    function Ht(t, l, a) {
      (((t === F && (J === 2 || J === 9)) || t.cancelPendingCommit !== null) && (be(t, 0), $l(t, j, jt, !1)), Su(t, a), ((L & 2) === 0 || t !== F) && (t === F && ((L & 2) === 0 && (Ea |= a), it === 4 && $l(t, j, jt, !1)), bl(t)));
    }
    function h0(t, l, a) {
      if ((L & 6) !== 0) throw Error(b(327));
      var e = (!a && (l & 127) === 0 && (l & t.expiredLanes) === 0) || pu(t, l),
        u = e ? Ah(t, l) : ec(t, l, !0),
        n = e;
      do {
        if (u === 0) {
          Ae && !e && $l(t, l, 0, !1);
          break;
        } else {
          if (((a = t.current.alternate), n && !Th(a))) {
            ((u = ec(t, l, !1)), (n = !1));
            continue;
          }
          if (u === 2) {
            if (((n = l), t.errorRecoveryDisabledLanes & n)) var i = 0;
            else ((i = t.pendingLanes & -536870913), (i = i !== 0 ? i : i & 536870912 ? 536870912 : 0));
            if (i !== 0) {
              l = i;
              t: {
                var c = t;
                u = tu;
                var f = c.current.memoizedState.isDehydrated;
                if ((f && (be(c, i).flags |= 256), (i = ec(c, i, !1)), i !== 2)) {
                  if (Kf && !f) {
                    ((c.errorRecoveryDisabledLanes |= n), (Ea |= n), (u = 4));
                    break t;
                  }
                  ((n = qt), (qt = u), n !== null && (qt === null ? (qt = n) : qt.push.apply(qt, n)));
                }
                u = i;
              }
              if (((n = !1), u !== 2)) continue;
            }
          }
          if (u === 1) {
            (be(t, 0), $l(t, l, 0, !0));
            break;
          }
          t: {
            switch (((e = t), (n = u), n)) {
              case 0:
              case 1:
                throw Error(b(345));
              case 4:
                if ((l & 4194048) !== l) break;
              case 6:
                $l(e, l, jt, !Wl);
                break t;
              case 2:
                qt = null;
                break;
              case 3:
              case 5:
                break;
              default:
                throw Error(b(329));
            }
            if ((l & 62914560) === l && ((u = ei + 300 - Zt()), 10 < u)) {
              if (($l(e, l, jt, !Wl), Jn(e, 0, !0) !== 0)) break t;
              ((Cl = l), (e.timeoutHandle = B0(qs.bind(null, e, a, qt, Bn, Vc, l, jt, Ea, ye, Wl, n, 'Throttled', -0, 0), u)));
              break t;
            }
            qs(e, a, qt, Bn, Vc, l, jt, Ea, ye, Wl, n, null, -0, 0);
          }
        }
        break;
      } while (!0);
      bl(t);
    }
    function qs(t, l, a, e, u, n, i, c, f, m, h, y, d, v) {
      if (((t.timeoutHandle = -1), (y = l.subtreeFlags), y & 8192 || (y & 16785408) === 16785408)) {
        ((y = { stylesheets: null, count: 0, imgCount: 0, imgBytes: 0, suspenseyImages: [], waitingForImages: !0, waitingForViewTransition: !1, unsuspend: Ml }), f0(l, n, y));
        var N = (n & 62914560) === n ? ei - Zt() : (n & 4194048) === n ? m0 - Zt() : 0;
        if (((N = ny(y, N)), N !== null)) {
          ((Cl = n), (t.cancelPendingCommit = N(Bs.bind(null, t, l, n, a, e, u, i, c, f, h, y, null, d, v))), $l(t, n, i, !m));
          return;
        }
      }
      Bs(t, l, n, a, e, u, i, c, f);
    }
    function Th(t) {
      for (var l = t; ; ) {
        var a = l.tag;
        if ((a === 0 || a === 11 || a === 15) && l.flags & 16384 && ((a = l.updateQueue), a !== null && ((a = a.stores), a !== null)))
          for (var e = 0; e < a.length; e++) {
            var u = a[e],
              n = u.getSnapshot;
            u = u.value;
            try {
              if (!Jt(n(), u)) return !1;
            } catch {
              return !1;
            }
          }
        if (((a = l.child), l.subtreeFlags & 16384 && a !== null)) ((a.return = l), (l = a));
        else {
          if (l === t) break;
          for (; l.sibling === null; ) {
            if (l.return === null || l.return === t) return !0;
            l = l.return;
          }
          ((l.sibling.return = l.return), (l = l.sibling));
        }
      }
      return !0;
    }
    function $l(t, l, a, e) {
      ((l &= ~Jf), (l &= ~Ea), (t.suspendedLanes |= l), (t.pingedLanes &= ~l), e && (t.warmLanes |= l), (e = t.expirationTimes));
      for (var u = l; 0 < u; ) {
        var n = 31 - Vt(u),
          i = 1 << n;
        ((e[n] = -1), (u &= ~i));
      }
      a !== 0 && pd(t, a, l);
    }
    function ui() {
      return (L & 6) === 0 ? (Ou(0, !1), !1) : !0;
    }
    function wf() {
      if (X !== null) {
        if (J === 0) var t = X.return;
        else ((t = X), (Dl = Ha = null), Cf(t), (ce = null), (ou = 0), (t = X));
        for (; t !== null; ) (km(t.alternate, t), (t = t.return));
        X = null;
      }
    }
    function be(t, l) {
      var a = t.timeoutHandle;
      (a !== -1 && ((t.timeoutHandle = -1), jh(a)),
        (a = t.cancelPendingCommit),
        a !== null && ((t.cancelPendingCommit = null), a()),
        (Cl = 0),
        wf(),
        (F = t),
        (X = a = Ul(t.current, null)),
        (j = l),
        (J = 0),
        (Qt = null),
        (Wl = !1),
        (Ae = pu(t, l)),
        (Kf = !1),
        (ye = jt = Jf = Ea = sa = it = 0),
        (qt = tu = null),
        (Vc = !1),
        (l & 8) !== 0 && (l |= l & 32));
      var e = t.entangledLanes;
      if (e !== 0)
        for (t = t.entanglements, e &= l; 0 < e; ) {
          var u = 31 - Vt(e),
            n = 1 << u;
          ((l |= t[u]), (e &= ~n));
        }
      return ((Yl = l), $n(), a);
    }
    function y0(t, l) {
      ((B = null), (U.H = du), l === Ee || l === In ? ((l = ds()), (J = 3)) : l === Af ? ((l = ds()), (J = 4)) : (J = l === jf ? 8 : l !== null && typeof l == 'object' && typeof l.then == 'function' ? 6 : 1), (Qt = l), X === null && ((it = 1), xn(t, ll(l, t.current))));
    }
    function g0() {
      var t = wt.current;
      return t === null ? !0 : (j & 4194048) === j ? el === null : (j & 62914560) === j || (j & 536870912) !== 0 ? t === el : !1;
    }
    function b0() {
      var t = U.H;
      return ((U.H = du), t === null ? du : t);
    }
    function p0() {
      var t = U.A;
      return ((U.A = Nh), t);
    }
    function Rn() {
      ((it = 4), Wl || ((j & 4194048) !== j && wt.current !== null) || (Ae = !0), ((sa & 134217727) === 0 && (Ea & 134217727) === 0) || F === null || $l(F, j, jt, !1));
    }
    function ec(t, l, a) {
      var e = L;
      L |= 2;
      var u = b0(),
        n = p0();
      ((F !== t || j !== l) && ((Bn = null), be(t, l)), (l = !1));
      var i = it;
      t: do
        try {
          if (J !== 0 && X !== null) {
            var c = X,
              f = Qt;
            switch (J) {
              case 8:
                (wf(), (i = 6));
                break t;
              case 3:
              case 2:
              case 9:
              case 6:
                wt.current === null && (l = !0);
                var m = J;
                if (((J = 0), (Qt = null), ae(t, c, f, m), a && Ae)) {
                  i = 0;
                  break t;
                }
                break;
              default:
                ((m = J), (J = 0), (Qt = null), ae(t, c, f, m));
            }
          }
          (Eh(), (i = it));
          break;
        } catch (h) {
          y0(t, h);
        }
      while (!0);
      return (l && t.shellSuspendCounter++, (Dl = Ha = null), (L = e), (U.H = u), (U.A = n), X === null && ((F = null), (j = 0), $n()), i);
    }
    function Eh() {
      for (; X !== null; ) S0(X);
    }
    function Ah(t, l) {
      var a = L;
      L |= 2;
      var e = b0(),
        u = p0();
      F !== t || j !== l ? ((Bn = null), (Hn = Zt() + 500), be(t, l)) : (Ae = pu(t, l));
      t: do
        try {
          if (J !== 0 && X !== null) {
            l = X;
            var n = Qt;
            l: switch (J) {
              case 1:
                ((J = 0), (Qt = null), ae(t, l, n, 1));
                break;
              case 2:
              case 9:
                if (ss(n)) {
                  ((J = 0), (Qt = null), Hs(l));
                  break;
                }
                ((l = function () {
                  ((J !== 2 && J !== 9) || F !== t || (J = 7), bl(t));
                }),
                  n.then(l, l));
                break t;
              case 3:
                J = 7;
                break t;
              case 4:
                J = 5;
                break t;
              case 7:
                ss(n) ? ((J = 0), (Qt = null), Hs(l)) : ((J = 0), (Qt = null), ae(t, l, n, 7));
                break;
              case 5:
                var i = null;
                switch (X.tag) {
                  case 26:
                    i = X.memoizedState;
                  case 5:
                  case 27:
                    var c = X;
                    if (i ? G0(i) : c.stateNode.complete) {
                      ((J = 0), (Qt = null));
                      var f = c.sibling;
                      if (f !== null) X = f;
                      else {
                        var m = c.return;
                        m !== null ? ((X = m), ni(m)) : (X = null);
                      }
                      break l;
                    }
                }
                ((J = 0), (Qt = null), ae(t, l, n, 5));
                break;
              case 6:
                ((J = 0), (Qt = null), ae(t, l, n, 6));
                break;
              case 8:
                (wf(), (it = 6));
                break t;
              default:
                throw Error(b(462));
            }
          }
          Oh();
          break;
        } catch (h) {
          y0(t, h);
        }
      while (!0);
      return ((Dl = Ha = null), (U.H = e), (U.A = u), (L = a), X !== null ? 0 : ((F = null), (j = 0), $n(), it));
    }
    function Oh() {
      for (; X !== null && !Wr(); ) S0(X);
    }
    function S0(t) {
      var l = wm(t.alternate, t, Yl);
      ((t.memoizedProps = t.pendingProps), l === null ? ni(t) : (X = l));
    }
    function Hs(t) {
      var l = t,
        a = l.alternate;
      switch (l.tag) {
        case 15:
        case 0:
          l = _s(a, l, l.pendingProps, l.type, void 0, j);
          break;
        case 11:
          l = _s(a, l, l.pendingProps, l.type.render, l.ref, j);
          break;
        case 5:
          Cf(l);
        default:
          (km(a, l), (l = X = kd(l, Yl)), (l = wm(a, l, Yl)));
      }
      ((t.memoizedProps = t.pendingProps), l === null ? ni(t) : (X = l));
    }
    function ae(t, l, a, e) {
      ((Dl = Ha = null), Cf(l), (ce = null), (ou = 0));
      var u = l.return;
      try {
        if (vh(t, u, l, a, j)) {
          ((it = 1), xn(t, ll(a, t.current)), (X = null));
          return;
        }
      } catch (n) {
        if (u !== null) throw ((X = u), n);
        ((it = 1), xn(t, ll(a, t.current)), (X = null));
        return;
      }
      l.flags & 32768 ? (Z || e === 1 ? (t = !0) : Ae || (j & 536870912) !== 0 ? (t = !1) : ((Wl = t = !0), (e === 2 || e === 9 || e === 3 || e === 6) && ((e = wt.current), e !== null && e.tag === 13 && (e.flags |= 16384))), N0(l, t)) : ni(l);
    }
    function ni(t) {
      var l = t;
      do {
        if ((l.flags & 32768) !== 0) {
          N0(l, Wl);
          return;
        }
        t = l.return;
        var a = gh(l.alternate, l, Yl);
        if (a !== null) {
          X = a;
          return;
        }
        if (((l = l.sibling), l !== null)) {
          X = l;
          return;
        }
        X = l = t;
      } while (l !== null);
      it === 0 && (it = 5);
    }
    function N0(t, l) {
      do {
        var a = bh(t.alternate, t);
        if (a !== null) {
          ((a.flags &= 32767), (X = a));
          return;
        }
        if (((a = t.return), a !== null && ((a.flags |= 32768), (a.subtreeFlags = 0), (a.deletions = null)), !l && ((t = t.sibling), t !== null))) {
          X = t;
          return;
        }
        X = t = a;
      } while (t !== null);
      ((it = 6), (X = null));
    }
    function Bs(t, l, a, e, u, n, i, c, f) {
      t.cancelPendingCommit = null;
      do ii();
      while (vt !== 0);
      if ((L & 6) !== 0) throw Error(b(327));
      if (l !== null) {
        if (l === t.current) throw Error(b(177));
        if (
          ((n = l.lanes | l.childLanes),
          (n |= bf),
          nv(t, a, n, i, c, f),
          t === F && ((X = F = null), (j = 0)),
          (ge = l),
          (ea = t),
          (Cl = a),
          (Kc = n),
          (Jc = u),
          (r0 = e),
          (l.subtreeFlags & 10256) !== 0 || (l.flags & 10256) !== 0
            ? ((t.callbackNode = null),
              (t.callbackPriority = 0),
              Uh(Sn, function () {
                return (O0(), null);
              }))
            : ((t.callbackNode = null), (t.callbackPriority = 0)),
          (e = (l.flags & 13878) !== 0),
          (l.subtreeFlags & 13878) !== 0 || e)
        ) {
          ((e = U.T), (U.T = null), (u = V.p), (V.p = 2), (i = L), (L |= 4));
          try {
            ph(t, l, a);
          } finally {
            ((L = i), (V.p = u), (U.T = e));
          }
        }
        ((vt = 1), z0(), T0(), E0());
      }
    }
    function z0() {
      if (vt === 1) {
        vt = 0;
        var t = ea,
          l = ge,
          a = (l.flags & 13878) !== 0;
        if ((l.subtreeFlags & 13878) !== 0 || a) {
          ((a = U.T), (U.T = null));
          var e = V.p;
          V.p = 2;
          var u = L;
          L |= 4;
          try {
            n0(l, t);
            var n = Fc,
              i = Gd(t.containerInfo),
              c = n.focusedElem,
              f = n.selectionRange;
            if (i !== c && c && c.ownerDocument && Xd(c.ownerDocument.documentElement, c)) {
              if (f !== null && gf(c)) {
                var m = f.start,
                  h = f.end;
                if ((h === void 0 && (h = m), 'selectionStart' in c)) ((c.selectionStart = m), (c.selectionEnd = Math.min(h, c.value.length)));
                else {
                  var y = c.ownerDocument || document,
                    d = (y && y.defaultView) || window;
                  if (d.getSelection) {
                    var v = d.getSelection(),
                      N = c.textContent.length,
                      E = Math.min(f.start, N),
                      G = f.end === void 0 ? E : Math.min(f.end, N);
                    !v.extend && E > G && ((i = G), (G = E), (E = i));
                    var s = es(c, E),
                      o = es(c, G);
                    if (s && o && (v.rangeCount !== 1 || v.anchorNode !== s.node || v.anchorOffset !== s.offset || v.focusNode !== o.node || v.focusOffset !== o.offset)) {
                      var r = y.createRange();
                      (r.setStart(s.node, s.offset), v.removeAllRanges(), E > G ? (v.addRange(r), v.extend(o.node, o.offset)) : (r.setEnd(o.node, o.offset), v.addRange(r)));
                    }
                  }
                }
              }
              for (y = [], v = c; (v = v.parentNode); ) v.nodeType === 1 && y.push({ element: v, left: v.scrollLeft, top: v.scrollTop });
              for (typeof c.focus == 'function' && c.focus(), c = 0; c < y.length; c++) {
                var g = y[c];
                ((g.element.scrollLeft = g.left), (g.element.scrollTop = g.top));
              }
            }
            ((Vn = !!$c), (Fc = $c = null));
          } finally {
            ((L = u), (V.p = e), (U.T = a));
          }
        }
        ((t.current = l), (vt = 2));
      }
    }
    function T0() {
      if (vt === 2) {
        vt = 0;
        var t = ea,
          l = ge,
          a = (l.flags & 8772) !== 0;
        if ((l.subtreeFlags & 8772) !== 0 || a) {
          ((a = U.T), (U.T = null));
          var e = V.p;
          V.p = 2;
          var u = L;
          L |= 4;
          try {
            t0(t, l.alternate, l);
          } finally {
            ((L = u), (V.p = e), (U.T = a));
          }
        }
        vt = 3;
      }
    }
    function E0() {
      if (vt === 4 || vt === 3) {
        ((vt = 0), $r());
        var t = ea,
          l = ge,
          a = Cl,
          e = r0;
        (l.subtreeFlags & 10256) !== 0 || (l.flags & 10256) !== 0 ? (vt = 5) : ((vt = 0), (ge = ea = null), A0(t, t.pendingLanes));
        var u = t.pendingLanes;
        if ((u === 0 && (aa = null), sf(a), (l = l.stateNode), Lt && typeof Lt.onCommitFiberRoot == 'function'))
          try {
            Lt.onCommitFiberRoot(bu, l, void 0, (l.current.flags & 128) === 128);
          } catch {}
        if (e !== null) {
          ((l = U.T), (u = V.p), (V.p = 2), (U.T = null));
          try {
            for (var n = t.onRecoverableError, i = 0; i < e.length; i++) {
              var c = e[i];
              n(c.value, { componentStack: c.stack });
            }
          } finally {
            ((U.T = l), (V.p = u));
          }
        }
        ((Cl & 3) !== 0 && ii(), bl(t), (u = t.pendingLanes), (a & 261930) !== 0 && (u & 42) !== 0 ? (t === wc ? lu++ : ((lu = 0), (wc = t))) : (lu = 0), Ou(0, !1));
      }
    }
    function A0(t, l) {
      (t.pooledCacheLanes &= l) === 0 && ((l = t.pooledCache), l != null && ((t.pooledCache = null), Tu(l)));
    }
    function ii() {
      return (z0(), T0(), E0(), O0());
    }
    function O0() {
      if (vt !== 5) return !1;
      var t = ea,
        l = Kc;
      Kc = 0;
      var a = sf(Cl),
        e = U.T,
        u = V.p;
      try {
        ((V.p = 32 > a ? 32 : a), (U.T = null), (a = Jc), (Jc = null));
        var n = ea,
          i = Cl;
        if (((vt = 0), (ge = ea = null), (Cl = 0), (L & 6) !== 0)) throw Error(b(331));
        var c = L;
        if (((L |= 4), s0(n.current), c0(n, n.current, i, a), (L = c), Ou(0, !1), Lt && typeof Lt.onPostCommitFiberRoot == 'function'))
          try {
            Lt.onPostCommitFiberRoot(bu, n);
          } catch {}
        return !0;
      } finally {
        ((V.p = u), (U.T = e), A0(t, l));
      }
    }
    function Rs(t, l, a) {
      ((l = ll(a, l)), (l = Gc(t.stateNode, l, 2)), (t = la(t, l, 2)), t !== null && (Su(t, 2), bl(t)));
    }
    function w(t, l, a) {
      if (t.tag === 3) Rs(t, t, a);
      else
        for (; l !== null; ) {
          if (l.tag === 3) {
            Rs(l, t, a);
            break;
          } else if (l.tag === 1) {
            var e = l.stateNode;
            if (typeof l.type.getDerivedStateFromError == 'function' || (typeof e.componentDidCatch == 'function' && (aa === null || !aa.has(e)))) {
              ((t = ll(a, t)), (a = jm(2)), (e = la(l, a, 2)), e !== null && (Zm(a, e, l, t), Su(e, 2), bl(e)));
              break;
            }
          }
          l = l.return;
        }
    }
    function uc(t, l, a) {
      var e = t.pingCache;
      if (e === null) {
        e = t.pingCache = new zh();
        var u = new Set();
        e.set(l, u);
      } else ((u = e.get(l)), u === void 0 && ((u = new Set()), e.set(l, u)));
      u.has(a) || ((Kf = !0), u.add(a), (t = _h.bind(null, t, l, a)), l.then(t, t));
    }
    function _h(t, l, a) {
      var e = t.pingCache;
      (e !== null && e.delete(l), (t.pingedLanes |= t.suspendedLanes & a), (t.warmLanes &= ~a), F === t && (j & a) === a && (it === 4 || (it === 3 && (j & 62914560) === j && 300 > Zt() - ei) ? (L & 2) === 0 && be(t, 0) : (Jf |= a), ye === j && (ye = 0)), bl(t));
    }
    function _0(t, l) {
      (l === 0 && (l = bd()), (t = qa(t, l)), t !== null && (Su(t, l), bl(t)));
    }
    function Mh(t) {
      var l = t.memoizedState,
        a = 0;
      (l !== null && (a = l.retryLane), _0(t, a));
    }
    function Dh(t, l) {
      var a = 0;
      switch (t.tag) {
        case 31:
        case 13:
          var e = t.stateNode,
            u = t.memoizedState;
          u !== null && (a = u.retryLane);
          break;
        case 19:
          e = t.stateNode;
          break;
        case 22:
          e = t.stateNode._retryCache;
          break;
        default:
          throw Error(b(314));
      }
      (e !== null && e.delete(l), _0(t, a));
    }
    function Uh(t, l) {
      return ff(t, l);
    }
    var Yn = null,
      Va = null,
      kc = !1,
      Qn = !1,
      nc = !1,
      Fl = 0;
    function bl(t) {
      (t !== Va && t.next === null && (Va === null ? (Yn = Va = t) : (Va = Va.next = t)), (Qn = !0), kc || ((kc = !0), Ch()));
    }
    function Ou(t, l) {
      if (!nc && Qn) {
        nc = !0;
        do
          for (var a = !1, e = Yn; e !== null; ) {
            if (!l)
              if (t !== 0) {
                var u = e.pendingLanes;
                if (u === 0) var n = 0;
                else {
                  var i = e.suspendedLanes,
                    c = e.pingedLanes;
                  ((n = (1 << (31 - Vt(42 | t) + 1)) - 1), (n &= u & ~(i & ~c)), (n = n & 201326741 ? (n & 201326741) | 1 : n ? n | 2 : 0));
                }
                n !== 0 && ((a = !0), Ys(e, n));
              } else ((n = j), (n = Jn(e, e === F ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)), (n & 3) === 0 || pu(e, n) || ((a = !0), Ys(e, n)));
            e = e.next;
          }
        while (a);
        nc = !1;
      }
    }
    function xh() {
      M0();
    }
    function M0() {
      Qn = kc = !1;
      var t = 0;
      Fl !== 0 && Gh() && (t = Fl);
      for (var l = Zt(), a = null, e = Yn; e !== null; ) {
        var u = e.next,
          n = D0(e, l);
        (n === 0 ? ((e.next = null), a === null ? (Yn = u) : (a.next = u), u === null && (Va = a)) : ((a = e), (t !== 0 || (n & 3) !== 0) && (Qn = !0)), (e = u));
      }
      ((vt !== 0 && vt !== 5) || Ou(t, !1), Fl !== 0 && (Fl = 0));
    }
    function D0(t, l) {
      for (var a = t.suspendedLanes, e = t.pingedLanes, u = t.expirationTimes, n = t.pendingLanes & -62914561; 0 < n; ) {
        var i = 31 - Vt(n),
          c = 1 << i,
          f = u[i];
        (f === -1 ? ((c & a) === 0 || (c & e) !== 0) && (u[i] = uv(c, l)) : f <= l && (t.expiredLanes |= c), (n &= ~c));
      }
      if (((l = F), (a = j), (a = Jn(t, t === l ? a : 0, t.cancelPendingCommit !== null || t.timeoutHandle !== -1)), (e = t.callbackNode), a === 0 || (t === l && (J === 2 || J === 9)) || t.cancelPendingCommit !== null))
        return (e !== null && e !== null && Hi(e), (t.callbackNode = null), (t.callbackPriority = 0));
      if ((a & 3) === 0 || pu(t, a)) {
        if (((l = a & -a), l === t.callbackPriority)) return l;
        switch ((e !== null && Hi(e), sf(a))) {
          case 2:
          case 8:
            a = yd;
            break;
          case 32:
            a = Sn;
            break;
          case 268435456:
            a = gd;
            break;
          default:
            a = Sn;
        }
        return ((e = U0.bind(null, t)), (a = ff(a, e)), (t.callbackPriority = l), (t.callbackNode = a), l);
      }
      return (e !== null && e !== null && Hi(e), (t.callbackPriority = 2), (t.callbackNode = null), 2);
    }
    function U0(t, l) {
      if (vt !== 0 && vt !== 5) return ((t.callbackNode = null), (t.callbackPriority = 0), null);
      var a = t.callbackNode;
      if (ii() && t.callbackNode !== a) return null;
      var e = j;
      return ((e = Jn(t, t === F ? e : 0, t.cancelPendingCommit !== null || t.timeoutHandle !== -1)), e === 0 ? null : (h0(t, e, l), D0(t, Zt()), t.callbackNode != null && t.callbackNode === a ? U0.bind(null, t) : null));
    }
    function Ys(t, l) {
      if (ii()) return null;
      h0(t, l, !0);
    }
    function Ch() {
      Zh(function () {
        (L & 6) !== 0 ? ff(hd, xh) : M0();
      });
    }
    function kf() {
      if (Fl === 0) {
        var t = re;
        (t === 0 && ((t = Qu), (Qu <<= 1), (Qu & 261888) === 0 && (Qu = 256)), (Fl = t));
      }
      return Fl;
    }
    function Qs(t) {
      return t == null || typeof t == 'symbol' || typeof t == 'boolean' ? null : typeof t == 'function' ? t : an('' + t);
    }
    function Xs(t, l) {
      var a = l.ownerDocument.createElement('input');
      return ((a.name = l.name), (a.value = l.value), t.id && a.setAttribute('form', t.id), l.parentNode.insertBefore(a, l), (t = new FormData(t)), a.parentNode.removeChild(a), t);
    }
    function qh(t, l, a, e, u) {
      if (l === 'submit' && a && a.stateNode === u) {
        var n = Qs((u[Bt] || null).action),
          i = e.submitter;
        i && ((l = (l = i[Bt] || null) ? Qs(l.formAction) : i.getAttribute('formAction')), l !== null && ((n = l), (i = null)));
        var c = new wn('action', 'action', null, e, u);
        t.push({
          event: c,
          listeners: [
            {
              instance: null,
              listener: function () {
                if (e.defaultPrevented) {
                  if (Fl !== 0) {
                    var f = i ? Xs(u, i) : new FormData(u);
                    Qc(a, { pending: !0, data: f, method: u.method, action: n }, null, f);
                  }
                } else typeof n == 'function' && (c.preventDefault(), (f = i ? Xs(u, i) : new FormData(u)), Qc(a, { pending: !0, data: f, method: u.method, action: n }, n, f));
              },
              currentTarget: u,
            },
          ],
        });
      }
    }
    for ($u = 0; $u < Oc.length; $u++) ((Fu = Oc[$u]), (Gs = Fu.toLowerCase()), (js = Fu[0].toUpperCase() + Fu.slice(1)), ol(Gs, 'on' + js));
    var Fu, Gs, js, $u;
    ol(Zd, 'onAnimationEnd');
    ol(Ld, 'onAnimationIteration');
    ol(Vd, 'onAnimationStart');
    ol('dblclick', 'onDoubleClick');
    ol('focusin', 'onFocus');
    ol('focusout', 'onBlur');
    ol(Fv, 'onTransitionRun');
    ol(Iv, 'onTransitionStart');
    ol(Pv, 'onTransitionCancel');
    ol(Kd, 'onTransitionEnd');
    de('onMouseEnter', ['mouseout', 'mouseover']);
    de('onMouseLeave', ['mouseout', 'mouseover']);
    de('onPointerEnter', ['pointerout', 'pointerover']);
    de('onPointerLeave', ['pointerout', 'pointerover']);
    Ua('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '));
    Ua('onSelect', 'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(' '));
    Ua('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']);
    Ua('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '));
    Ua('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '));
    Ua('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '));
    var mu = 'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(' '),
      Hh = new Set('beforetoggle cancel close invalid load scroll scrollend toggle'.split(' ').concat(mu));
    function x0(t, l) {
      l = (l & 4) !== 0;
      for (var a = 0; a < t.length; a++) {
        var e = t[a],
          u = e.event;
        e = e.listeners;
        t: {
          var n = void 0;
          if (l)
            for (var i = e.length - 1; 0 <= i; i--) {
              var c = e[i],
                f = c.instance,
                m = c.currentTarget;
              if (((c = c.listener), f !== n && u.isPropagationStopped())) break t;
              ((n = c), (u.currentTarget = m));
              try {
                n(u);
              } catch (h) {
                zn(h);
              }
              ((u.currentTarget = null), (n = f));
            }
          else
            for (i = 0; i < e.length; i++) {
              if (((c = e[i]), (f = c.instance), (m = c.currentTarget), (c = c.listener), f !== n && u.isPropagationStopped())) break t;
              ((n = c), (u.currentTarget = m));
              try {
                n(u);
              } catch (h) {
                zn(h);
              }
              ((u.currentTarget = null), (n = f));
            }
        }
      }
    }
    function Q(t, l) {
      var a = l[bc];
      a === void 0 && (a = l[bc] = new Set());
      var e = t + '__bubble';
      a.has(e) || (C0(l, t, 2, !1), a.add(e));
    }
    function ic(t, l, a) {
      var e = 0;
      (l && (e |= 4), C0(a, t, e, l));
    }
    var Iu = '_reactListening' + Math.random().toString(36).slice(2);
    function Wf(t) {
      if (!t[Iu]) {
        ((t[Iu] = !0),
          Td.forEach(function (a) {
            a !== 'selectionchange' && (Hh.has(a) || ic(a, !1, t), ic(a, !0, t));
          }));
        var l = t.nodeType === 9 ? t : t.ownerDocument;
        l === null || l[Iu] || ((l[Iu] = !0), ic('selectionchange', !1, l));
      }
    }
    function C0(t, l, a, e) {
      switch (K0(l)) {
        case 2:
          var u = fy;
          break;
        case 8:
          u = oy;
          break;
        default:
          u = Pf;
      }
      ((a = u.bind(null, l, a, t)),
        (u = void 0),
        !Tc || (l !== 'touchstart' && l !== 'touchmove' && l !== 'wheel') || (u = !0),
        e ? (u !== void 0 ? t.addEventListener(l, a, { capture: !0, passive: u }) : t.addEventListener(l, a, !0)) : u !== void 0 ? t.addEventListener(l, a, { passive: u }) : t.addEventListener(l, a, !1));
    }
    function cc(t, l, a, e, u) {
      var n = e;
      if ((l & 1) === 0 && (l & 2) === 0 && e !== null)
        t: for (;;) {
          if (e === null) return;
          var i = e.tag;
          if (i === 3 || i === 4) {
            var c = e.stateNode.containerInfo;
            if (c === u) break;
            if (i === 4)
              for (i = e.return; i !== null; ) {
                var f = i.tag;
                if ((f === 3 || f === 4) && i.stateNode.containerInfo === u) return;
                i = i.return;
              }
            for (; c !== null; ) {
              if (((i = wa(c)), i === null)) return;
              if (((f = i.tag), f === 5 || f === 6 || f === 26 || f === 27)) {
                e = n = i;
                continue t;
              }
              c = c.parentNode;
            }
          }
          e = e.return;
        }
      xd(function () {
        var m = n,
          h = rf(a),
          y = [];
        t: {
          var d = Jd.get(t);
          if (d !== void 0) {
            var v = wn,
              N = t;
            switch (t) {
              case 'keypress':
                if (un(a) === 0) break t;
              case 'keydown':
              case 'keyup':
                v = Dv;
                break;
              case 'focusin':
                ((N = 'focus'), (v = Xi));
                break;
              case 'focusout':
                ((N = 'blur'), (v = Xi));
                break;
              case 'beforeblur':
              case 'afterblur':
                v = Xi;
                break;
              case 'click':
                if (a.button === 2) break t;
              case 'auxclick':
              case 'dblclick':
              case 'mousedown':
              case 'mousemove':
              case 'mouseup':
              case 'mouseout':
              case 'mouseover':
              case 'contextmenu':
                v = ko;
                break;
              case 'drag':
              case 'dragend':
              case 'dragenter':
              case 'dragexit':
              case 'dragleave':
              case 'dragover':
              case 'dragstart':
              case 'drop':
                v = gv;
                break;
              case 'touchcancel':
              case 'touchend':
              case 'touchmove':
              case 'touchstart':
                v = Cv;
                break;
              case Zd:
              case Ld:
              case Vd:
                v = Sv;
                break;
              case Kd:
                v = Hv;
                break;
              case 'scroll':
              case 'scrollend':
                v = hv;
                break;
              case 'wheel':
                v = Rv;
                break;
              case 'copy':
              case 'cut':
              case 'paste':
                v = zv;
                break;
              case 'gotpointercapture':
              case 'lostpointercapture':
              case 'pointercancel':
              case 'pointerdown':
              case 'pointermove':
              case 'pointerout':
              case 'pointerover':
              case 'pointerup':
                v = $o;
                break;
              case 'toggle':
              case 'beforetoggle':
                v = Qv;
            }
            var E = (l & 4) !== 0,
              G = !E && (t === 'scroll' || t === 'scrollend'),
              s = E ? (d !== null ? d + 'Capture' : null) : d;
            E = [];
            for (var o = m, r; o !== null; ) {
              var g = o;
              if (((r = g.stateNode), (g = g.tag), (g !== 5 && g !== 26 && g !== 27) || r === null || s === null || ((g = uu(o, s)), g != null && E.push(ru(o, g, r))), G)) break;
              o = o.return;
            }
            0 < E.length && ((d = new v(d, N, null, a, h)), y.push({ event: d, listeners: E }));
          }
        }
        if ((l & 7) === 0) {
          t: {
            if (((d = t === 'mouseover' || t === 'pointerover'), (v = t === 'mouseout' || t === 'pointerout'), d && a !== zc && (N = a.relatedTarget || a.fromElement) && (wa(N) || N[Ne]))) break t;
            if (
              (v || d) &&
              ((d = h.window === h ? h : (d = h.ownerDocument) ? d.defaultView || d.parentWindow : window),
              v ? ((N = a.relatedTarget || a.toElement), (v = m), (N = N ? wa(N) : null), N !== null && ((G = gu(N)), (E = N.tag), N !== G || (E !== 5 && E !== 27 && E !== 6)) && (N = null)) : ((v = null), (N = m)),
              v !== N)
            ) {
              if (
                ((E = ko),
                (g = 'onMouseLeave'),
                (s = 'onMouseEnter'),
                (o = 'mouse'),
                (t === 'pointerout' || t === 'pointerover') && ((E = $o), (g = 'onPointerLeave'), (s = 'onPointerEnter'), (o = 'pointer')),
                (G = v == null ? d : je(v)),
                (r = N == null ? d : je(N)),
                (d = new E(g, o + 'leave', v, a, h)),
                (d.target = G),
                (d.relatedTarget = r),
                (g = null),
                wa(h) === m && ((E = new E(s, o + 'enter', N, a, h)), (E.target = r), (E.relatedTarget = G), (g = E)),
                (G = g),
                v && N)
              )
                l: {
                  for (E = Bh, s = v, o = N, r = 0, g = s; g; g = E(g)) r++;
                  g = 0;
                  for (var z = o; z; z = E(z)) g++;
                  for (; 0 < r - g; ) ((s = E(s)), r--);
                  for (; 0 < g - r; ) ((o = E(o)), g--);
                  for (; r--; ) {
                    if (s === o || (o !== null && s === o.alternate)) {
                      E = s;
                      break l;
                    }
                    ((s = E(s)), (o = E(o)));
                  }
                  E = null;
                }
              else E = null;
              (v !== null && Zs(y, d, v, E, !1), N !== null && G !== null && Zs(y, G, N, E, !0));
            }
          }
          t: {
            if (((d = m ? je(m) : window), (v = d.nodeName && d.nodeName.toLowerCase()), v === 'select' || (v === 'input' && d.type === 'file'))) var R = ts;
            else if (Po(d))
              if (Yd) R = kv;
              else {
                R = Jv;
                var p = Kv;
              }
            else ((v = d.nodeName), !v || v.toLowerCase() !== 'input' || (d.type !== 'checkbox' && d.type !== 'radio') ? m && mf(m.elementType) && (R = ts) : (R = wv));
            if (R && (R = R(t, m))) {
              Rd(y, R, a, h);
              break t;
            }
            (p && p(t, d, m), t === 'focusout' && m && d.type === 'number' && m.memoizedProps.value != null && Nc(d, 'number', d.value));
          }
          switch (((p = m ? je(m) : window), t)) {
            case 'focusin':
              (Po(p) || p.contentEditable === 'true') && (($a = p), (Ec = m), (Je = null));
              break;
            case 'focusout':
              Je = Ec = $a = null;
              break;
            case 'mousedown':
              Ac = !0;
              break;
            case 'contextmenu':
            case 'mouseup':
            case 'dragend':
              ((Ac = !1), us(y, a, h));
              break;
            case 'selectionchange':
              if ($v) break;
            case 'keydown':
            case 'keyup':
              us(y, a, h);
          }
          var T;
          if (yf)
            t: {
              switch (t) {
                case 'compositionstart':
                  var q = 'onCompositionStart';
                  break t;
                case 'compositionend':
                  q = 'onCompositionEnd';
                  break t;
                case 'compositionupdate':
                  q = 'onCompositionUpdate';
                  break t;
              }
              q = void 0;
            }
          else Wa ? Hd(t, a) && (q = 'onCompositionEnd') : t === 'keydown' && a.keyCode === 229 && (q = 'onCompositionStart');
          (q &&
            (qd && a.locale !== 'ko' && (Wa || q !== 'onCompositionStart' ? q === 'onCompositionEnd' && Wa && (T = Cd()) : ((kl = h), (vf = 'value' in kl ? kl.value : kl.textContent), (Wa = !0))),
            (p = Xn(m, q)),
            0 < p.length && ((q = new Wo(q, t, null, a, h)), y.push({ event: q, listeners: p }), T ? (q.data = T) : ((T = Bd(a)), T !== null && (q.data = T)))),
            (T = Gv ? jv(t, a) : Zv(t, a)) && ((q = Xn(m, 'onBeforeInput')), 0 < q.length && ((p = new Wo('onBeforeInput', 'beforeinput', null, a, h)), y.push({ event: p, listeners: q }), (p.data = T))),
            qh(y, t, m, a, h));
        }
        x0(y, l);
      });
    }
    function ru(t, l, a) {
      return { instance: t, listener: l, currentTarget: a };
    }
    function Xn(t, l) {
      for (var a = l + 'Capture', e = []; t !== null; ) {
        var u = t,
          n = u.stateNode;
        if (((u = u.tag), (u !== 5 && u !== 26 && u !== 27) || n === null || ((u = uu(t, a)), u != null && e.unshift(ru(t, u, n)), (u = uu(t, l)), u != null && e.push(ru(t, u, n))), t.tag === 3)) return e;
        t = t.return;
      }
      return [];
    }
    function Bh(t) {
      if (t === null) return null;
      do t = t.return;
      while (t && t.tag !== 5 && t.tag !== 27);
      return t || null;
    }
    function Zs(t, l, a, e, u) {
      for (var n = l._reactName, i = []; a !== null && a !== e; ) {
        var c = a,
          f = c.alternate,
          m = c.stateNode;
        if (((c = c.tag), f !== null && f === e)) break;
        ((c !== 5 && c !== 26 && c !== 27) || m === null || ((f = m), u ? ((m = uu(a, n)), m != null && i.unshift(ru(a, m, f))) : u || ((m = uu(a, n)), m != null && i.push(ru(a, m, f)))), (a = a.return));
      }
      i.length !== 0 && t.push({ event: l, listeners: i });
    }
    var Rh = /\r\n?/g,
      Yh = /\u0000|\uFFFD/g;
    function Ls(t) {
      return (typeof t == 'string' ? t : '' + t)
        .replace(
          Rh,
          `
`,
        )
        .replace(Yh, '');
    }
    function q0(t, l) {
      return ((l = Ls(l)), Ls(t) === l);
    }
    function k(t, l, a, e, u, n) {
      switch (a) {
        case 'children':
          typeof e == 'string' ? l === 'body' || (l === 'textarea' && e === '') || me(t, e) : (typeof e == 'number' || typeof e == 'bigint') && l !== 'body' && me(t, '' + e);
          break;
        case 'className':
          ju(t, 'class', e);
          break;
        case 'tabIndex':
          ju(t, 'tabindex', e);
          break;
        case 'dir':
        case 'role':
        case 'viewBox':
        case 'width':
        case 'height':
          ju(t, a, e);
          break;
        case 'style':
          Ud(t, e, n);
          break;
        case 'data':
          if (l !== 'object') {
            ju(t, 'data', e);
            break;
          }
        case 'src':
        case 'href':
          if (e === '' && (l !== 'a' || a !== 'href')) {
            t.removeAttribute(a);
            break;
          }
          if (e == null || typeof e == 'function' || typeof e == 'symbol' || typeof e == 'boolean') {
            t.removeAttribute(a);
            break;
          }
          ((e = an('' + e)), t.setAttribute(a, e));
          break;
        case 'action':
        case 'formAction':
          if (typeof e == 'function') {
            t.setAttribute(
              a,
              "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')",
            );
            break;
          } else
            typeof n == 'function' &&
              (a === 'formAction'
                ? (l !== 'input' && k(t, l, 'name', u.name, u, null), k(t, l, 'formEncType', u.formEncType, u, null), k(t, l, 'formMethod', u.formMethod, u, null), k(t, l, 'formTarget', u.formTarget, u, null))
                : (k(t, l, 'encType', u.encType, u, null), k(t, l, 'method', u.method, u, null), k(t, l, 'target', u.target, u, null)));
          if (e == null || typeof e == 'symbol' || typeof e == 'boolean') {
            t.removeAttribute(a);
            break;
          }
          ((e = an('' + e)), t.setAttribute(a, e));
          break;
        case 'onClick':
          e != null && (t.onclick = Ml);
          break;
        case 'onScroll':
          e != null && Q('scroll', t);
          break;
        case 'onScrollEnd':
          e != null && Q('scrollend', t);
          break;
        case 'dangerouslySetInnerHTML':
          if (e != null) {
            if (typeof e != 'object' || !('__html' in e)) throw Error(b(61));
            if (((a = e.__html), a != null)) {
              if (u.children != null) throw Error(b(60));
              t.innerHTML = a;
            }
          }
          break;
        case 'multiple':
          t.multiple = e && typeof e != 'function' && typeof e != 'symbol';
          break;
        case 'muted':
          t.muted = e && typeof e != 'function' && typeof e != 'symbol';
          break;
        case 'suppressContentEditableWarning':
        case 'suppressHydrationWarning':
        case 'defaultValue':
        case 'defaultChecked':
        case 'innerHTML':
        case 'ref':
          break;
        case 'autoFocus':
          break;
        case 'xlinkHref':
          if (e == null || typeof e == 'function' || typeof e == 'boolean' || typeof e == 'symbol') {
            t.removeAttribute('xlink:href');
            break;
          }
          ((a = an('' + e)), t.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', a));
          break;
        case 'contentEditable':
        case 'spellCheck':
        case 'draggable':
        case 'value':
        case 'autoReverse':
        case 'externalResourcesRequired':
        case 'focusable':
        case 'preserveAlpha':
          e != null && typeof e != 'function' && typeof e != 'symbol' ? t.setAttribute(a, '' + e) : t.removeAttribute(a);
          break;
        case 'inert':
        case 'allowFullScreen':
        case 'async':
        case 'autoPlay':
        case 'controls':
        case 'default':
        case 'defer':
        case 'disabled':
        case 'disablePictureInPicture':
        case 'disableRemotePlayback':
        case 'formNoValidate':
        case 'hidden':
        case 'loop':
        case 'noModule':
        case 'noValidate':
        case 'open':
        case 'playsInline':
        case 'readOnly':
        case 'required':
        case 'reversed':
        case 'scoped':
        case 'seamless':
        case 'itemScope':
          e && typeof e != 'function' && typeof e != 'symbol' ? t.setAttribute(a, '') : t.removeAttribute(a);
          break;
        case 'capture':
        case 'download':
          e === !0 ? t.setAttribute(a, '') : e !== !1 && e != null && typeof e != 'function' && typeof e != 'symbol' ? t.setAttribute(a, e) : t.removeAttribute(a);
          break;
        case 'cols':
        case 'rows':
        case 'size':
        case 'span':
          e != null && typeof e != 'function' && typeof e != 'symbol' && !isNaN(e) && 1 <= e ? t.setAttribute(a, e) : t.removeAttribute(a);
          break;
        case 'rowSpan':
        case 'start':
          e == null || typeof e == 'function' || typeof e == 'symbol' || isNaN(e) ? t.removeAttribute(a) : t.setAttribute(a, e);
          break;
        case 'popover':
          (Q('beforetoggle', t), Q('toggle', t), ln(t, 'popover', e));
          break;
        case 'xlinkActuate':
          Sl(t, 'http://www.w3.org/1999/xlink', 'xlink:actuate', e);
          break;
        case 'xlinkArcrole':
          Sl(t, 'http://www.w3.org/1999/xlink', 'xlink:arcrole', e);
          break;
        case 'xlinkRole':
          Sl(t, 'http://www.w3.org/1999/xlink', 'xlink:role', e);
          break;
        case 'xlinkShow':
          Sl(t, 'http://www.w3.org/1999/xlink', 'xlink:show', e);
          break;
        case 'xlinkTitle':
          Sl(t, 'http://www.w3.org/1999/xlink', 'xlink:title', e);
          break;
        case 'xlinkType':
          Sl(t, 'http://www.w3.org/1999/xlink', 'xlink:type', e);
          break;
        case 'xmlBase':
          Sl(t, 'http://www.w3.org/XML/1998/namespace', 'xml:base', e);
          break;
        case 'xmlLang':
          Sl(t, 'http://www.w3.org/XML/1998/namespace', 'xml:lang', e);
          break;
        case 'xmlSpace':
          Sl(t, 'http://www.w3.org/XML/1998/namespace', 'xml:space', e);
          break;
        case 'is':
          ln(t, 'is', e);
          break;
        case 'innerText':
        case 'textContent':
          break;
        default:
          (!(2 < a.length) || (a[0] !== 'o' && a[0] !== 'O') || (a[1] !== 'n' && a[1] !== 'N')) && ((a = rv.get(a) || a), ln(t, a, e));
      }
    }
    function Wc(t, l, a, e, u, n) {
      switch (a) {
        case 'style':
          Ud(t, e, n);
          break;
        case 'dangerouslySetInnerHTML':
          if (e != null) {
            if (typeof e != 'object' || !('__html' in e)) throw Error(b(61));
            if (((a = e.__html), a != null)) {
              if (u.children != null) throw Error(b(60));
              t.innerHTML = a;
            }
          }
          break;
        case 'children':
          typeof e == 'string' ? me(t, e) : (typeof e == 'number' || typeof e == 'bigint') && me(t, '' + e);
          break;
        case 'onScroll':
          e != null && Q('scroll', t);
          break;
        case 'onScrollEnd':
          e != null && Q('scrollend', t);
          break;
        case 'onClick':
          e != null && (t.onclick = Ml);
          break;
        case 'suppressContentEditableWarning':
        case 'suppressHydrationWarning':
        case 'innerHTML':
        case 'ref':
          break;
        case 'innerText':
        case 'textContent':
          break;
        default:
          if (!Ed.hasOwnProperty(a))
            t: {
              if (a[0] === 'o' && a[1] === 'n' && ((u = a.endsWith('Capture')), (l = a.slice(2, u ? a.length - 7 : void 0)), (n = t[Bt] || null), (n = n != null ? n[a] : null), typeof n == 'function' && t.removeEventListener(l, n, u), typeof e == 'function')) {
                (typeof n != 'function' && n !== null && (a in t ? (t[a] = null) : t.hasAttribute(a) && t.removeAttribute(a)), t.addEventListener(l, e, u));
                break t;
              }
              a in t ? (t[a] = e) : e === !0 ? t.setAttribute(a, '') : ln(t, a, e);
            }
      }
    }
    function Et(t, l, a) {
      switch (l) {
        case 'div':
        case 'span':
        case 'svg':
        case 'path':
        case 'a':
        case 'g':
        case 'p':
        case 'li':
          break;
        case 'img':
          (Q('error', t), Q('load', t));
          var e = !1,
            u = !1,
            n;
          for (n in a)
            if (a.hasOwnProperty(n)) {
              var i = a[n];
              if (i != null)
                switch (n) {
                  case 'src':
                    e = !0;
                    break;
                  case 'srcSet':
                    u = !0;
                    break;
                  case 'children':
                  case 'dangerouslySetInnerHTML':
                    throw Error(b(137, l));
                  default:
                    k(t, l, n, i, a, null);
                }
            }
          (u && k(t, l, 'srcSet', a.srcSet, a, null), e && k(t, l, 'src', a.src, a, null));
          return;
        case 'input':
          Q('invalid', t);
          var c = (n = i = u = null),
            f = null,
            m = null;
          for (e in a)
            if (a.hasOwnProperty(e)) {
              var h = a[e];
              if (h != null)
                switch (e) {
                  case 'name':
                    u = h;
                    break;
                  case 'type':
                    i = h;
                    break;
                  case 'checked':
                    f = h;
                    break;
                  case 'defaultChecked':
                    m = h;
                    break;
                  case 'value':
                    n = h;
                    break;
                  case 'defaultValue':
                    c = h;
                    break;
                  case 'children':
                  case 'dangerouslySetInnerHTML':
                    if (h != null) throw Error(b(137, l));
                    break;
                  default:
                    k(t, l, e, h, a, null);
                }
            }
          _d(t, n, c, f, m, i, u, !1);
          return;
        case 'select':
          (Q('invalid', t), (e = i = n = null));
          for (u in a)
            if (a.hasOwnProperty(u) && ((c = a[u]), c != null))
              switch (u) {
                case 'value':
                  n = c;
                  break;
                case 'defaultValue':
                  i = c;
                  break;
                case 'multiple':
                  e = c;
                default:
                  k(t, l, u, c, a, null);
              }
          ((l = n), (a = i), (t.multiple = !!e), l != null ? ue(t, !!e, l, !1) : a != null && ue(t, !!e, a, !0));
          return;
        case 'textarea':
          (Q('invalid', t), (n = u = e = null));
          for (i in a)
            if (a.hasOwnProperty(i) && ((c = a[i]), c != null))
              switch (i) {
                case 'value':
                  e = c;
                  break;
                case 'defaultValue':
                  u = c;
                  break;
                case 'children':
                  n = c;
                  break;
                case 'dangerouslySetInnerHTML':
                  if (c != null) throw Error(b(91));
                  break;
                default:
                  k(t, l, i, c, a, null);
              }
          Dd(t, e, u, n);
          return;
        case 'option':
          for (f in a) a.hasOwnProperty(f) && ((e = a[f]), e != null) && (f === 'selected' ? (t.selected = e && typeof e != 'function' && typeof e != 'symbol') : k(t, l, f, e, a, null));
          return;
        case 'dialog':
          (Q('beforetoggle', t), Q('toggle', t), Q('cancel', t), Q('close', t));
          break;
        case 'iframe':
        case 'object':
          Q('load', t);
          break;
        case 'video':
        case 'audio':
          for (e = 0; e < mu.length; e++) Q(mu[e], t);
          break;
        case 'image':
          (Q('error', t), Q('load', t));
          break;
        case 'details':
          Q('toggle', t);
          break;
        case 'embed':
        case 'source':
        case 'link':
          (Q('error', t), Q('load', t));
        case 'area':
        case 'base':
        case 'br':
        case 'col':
        case 'hr':
        case 'keygen':
        case 'meta':
        case 'param':
        case 'track':
        case 'wbr':
        case 'menuitem':
          for (m in a)
            if (a.hasOwnProperty(m) && ((e = a[m]), e != null))
              switch (m) {
                case 'children':
                case 'dangerouslySetInnerHTML':
                  throw Error(b(137, l));
                default:
                  k(t, l, m, e, a, null);
              }
          return;
        default:
          if (mf(l)) {
            for (h in a) a.hasOwnProperty(h) && ((e = a[h]), e !== void 0 && Wc(t, l, h, e, a, void 0));
            return;
          }
      }
      for (c in a) a.hasOwnProperty(c) && ((e = a[c]), e != null && k(t, l, c, e, a, null));
    }
    function Qh(t, l, a, e) {
      switch (l) {
        case 'div':
        case 'span':
        case 'svg':
        case 'path':
        case 'a':
        case 'g':
        case 'p':
        case 'li':
          break;
        case 'input':
          var u = null,
            n = null,
            i = null,
            c = null,
            f = null,
            m = null,
            h = null;
          for (v in a) {
            var y = a[v];
            if (a.hasOwnProperty(v) && y != null)
              switch (v) {
                case 'checked':
                  break;
                case 'value':
                  break;
                case 'defaultValue':
                  f = y;
                default:
                  e.hasOwnProperty(v) || k(t, l, v, null, e, y);
              }
          }
          for (var d in e) {
            var v = e[d];
            if (((y = a[d]), e.hasOwnProperty(d) && (v != null || y != null)))
              switch (d) {
                case 'type':
                  n = v;
                  break;
                case 'name':
                  u = v;
                  break;
                case 'checked':
                  m = v;
                  break;
                case 'defaultChecked':
                  h = v;
                  break;
                case 'value':
                  i = v;
                  break;
                case 'defaultValue':
                  c = v;
                  break;
                case 'children':
                case 'dangerouslySetInnerHTML':
                  if (v != null) throw Error(b(137, l));
                  break;
                default:
                  v !== y && k(t, l, d, v, e, y);
              }
          }
          Sc(t, i, c, f, m, h, n, u);
          return;
        case 'select':
          v = i = c = d = null;
          for (n in a)
            if (((f = a[n]), a.hasOwnProperty(n) && f != null))
              switch (n) {
                case 'value':
                  break;
                case 'multiple':
                  v = f;
                default:
                  e.hasOwnProperty(n) || k(t, l, n, null, e, f);
              }
          for (u in e)
            if (((n = e[u]), (f = a[u]), e.hasOwnProperty(u) && (n != null || f != null)))
              switch (u) {
                case 'value':
                  d = n;
                  break;
                case 'defaultValue':
                  c = n;
                  break;
                case 'multiple':
                  i = n;
                default:
                  n !== f && k(t, l, u, n, e, f);
              }
          ((l = c), (a = i), (e = v), d != null ? ue(t, !!a, d, !1) : !!e != !!a && (l != null ? ue(t, !!a, l, !0) : ue(t, !!a, a ? [] : '', !1)));
          return;
        case 'textarea':
          v = d = null;
          for (c in a)
            if (((u = a[c]), a.hasOwnProperty(c) && u != null && !e.hasOwnProperty(c)))
              switch (c) {
                case 'value':
                  break;
                case 'children':
                  break;
                default:
                  k(t, l, c, null, e, u);
              }
          for (i in e)
            if (((u = e[i]), (n = a[i]), e.hasOwnProperty(i) && (u != null || n != null)))
              switch (i) {
                case 'value':
                  d = u;
                  break;
                case 'defaultValue':
                  v = u;
                  break;
                case 'children':
                  break;
                case 'dangerouslySetInnerHTML':
                  if (u != null) throw Error(b(91));
                  break;
                default:
                  u !== n && k(t, l, i, u, e, n);
              }
          Md(t, d, v);
          return;
        case 'option':
          for (var N in a) ((d = a[N]), a.hasOwnProperty(N) && d != null && !e.hasOwnProperty(N) && (N === 'selected' ? (t.selected = !1) : k(t, l, N, null, e, d)));
          for (f in e) ((d = e[f]), (v = a[f]), e.hasOwnProperty(f) && d !== v && (d != null || v != null) && (f === 'selected' ? (t.selected = d && typeof d != 'function' && typeof d != 'symbol') : k(t, l, f, d, e, v)));
          return;
        case 'img':
        case 'link':
        case 'area':
        case 'base':
        case 'br':
        case 'col':
        case 'embed':
        case 'hr':
        case 'keygen':
        case 'meta':
        case 'param':
        case 'source':
        case 'track':
        case 'wbr':
        case 'menuitem':
          for (var E in a) ((d = a[E]), a.hasOwnProperty(E) && d != null && !e.hasOwnProperty(E) && k(t, l, E, null, e, d));
          for (m in e)
            if (((d = e[m]), (v = a[m]), e.hasOwnProperty(m) && d !== v && (d != null || v != null)))
              switch (m) {
                case 'children':
                case 'dangerouslySetInnerHTML':
                  if (d != null) throw Error(b(137, l));
                  break;
                default:
                  k(t, l, m, d, e, v);
              }
          return;
        default:
          if (mf(l)) {
            for (var G in a) ((d = a[G]), a.hasOwnProperty(G) && d !== void 0 && !e.hasOwnProperty(G) && Wc(t, l, G, void 0, e, d));
            for (h in e) ((d = e[h]), (v = a[h]), !e.hasOwnProperty(h) || d === v || (d === void 0 && v === void 0) || Wc(t, l, h, d, e, v));
            return;
          }
      }
      for (var s in a) ((d = a[s]), a.hasOwnProperty(s) && d != null && !e.hasOwnProperty(s) && k(t, l, s, null, e, d));
      for (y in e) ((d = e[y]), (v = a[y]), !e.hasOwnProperty(y) || d === v || (d == null && v == null) || k(t, l, y, d, e, v));
    }
    function Vs(t) {
      switch (t) {
        case 'css':
        case 'script':
        case 'font':
        case 'img':
        case 'image':
        case 'input':
        case 'link':
          return !0;
        default:
          return !1;
      }
    }
    function Xh() {
      if (typeof performance.getEntriesByType == 'function') {
        for (var t = 0, l = 0, a = performance.getEntriesByType('resource'), e = 0; e < a.length; e++) {
          var u = a[e],
            n = u.transferSize,
            i = u.initiatorType,
            c = u.duration;
          if (n && c && Vs(i)) {
            for (i = 0, c = u.responseEnd, e += 1; e < a.length; e++) {
              var f = a[e],
                m = f.startTime;
              if (m > c) break;
              var h = f.transferSize,
                y = f.initiatorType;
              h && Vs(y) && ((f = f.responseEnd), (i += h * (f < c ? 1 : (c - m) / (f - m))));
            }
            if ((--e, (l += (8 * (n + i)) / (u.duration / 1e3)), t++, 10 < t)) break;
          }
        }
        if (0 < t) return l / t / 1e6;
      }
      return navigator.connection && ((t = navigator.connection.downlink), typeof t == 'number') ? t : 5;
    }
    var $c = null,
      Fc = null;
    function Gn(t) {
      return t.nodeType === 9 ? t : t.ownerDocument;
    }
    function Ks(t) {
      switch (t) {
        case 'http://www.w3.org/2000/svg':
          return 1;
        case 'http://www.w3.org/1998/Math/MathML':
          return 2;
        default:
          return 0;
      }
    }
    function H0(t, l) {
      if (t === 0)
        switch (l) {
          case 'svg':
            return 1;
          case 'math':
            return 2;
          default:
            return 0;
        }
      return t === 1 && l === 'foreignObject' ? 0 : t;
    }
    function Ic(t, l) {
      return t === 'textarea' || t === 'noscript' || typeof l.children == 'string' || typeof l.children == 'number' || typeof l.children == 'bigint' || (typeof l.dangerouslySetInnerHTML == 'object' && l.dangerouslySetInnerHTML !== null && l.dangerouslySetInnerHTML.__html != null);
    }
    var fc = null;
    function Gh() {
      var t = window.event;
      return t && t.type === 'popstate' ? (t === fc ? !1 : ((fc = t), !0)) : ((fc = null), !1);
    }
    var B0 = typeof setTimeout == 'function' ? setTimeout : void 0,
      jh = typeof clearTimeout == 'function' ? clearTimeout : void 0,
      Js = typeof Promise == 'function' ? Promise : void 0,
      Zh =
        typeof queueMicrotask == 'function'
          ? queueMicrotask
          : typeof Js < 'u'
            ? function (t) {
                return Js.resolve(null).then(t).catch(Lh);
              }
            : B0;
    function Lh(t) {
      setTimeout(function () {
        throw t;
      });
    }
    function ma(t) {
      return t === 'head';
    }
    function ws(t, l) {
      var a = l,
        e = 0;
      do {
        var u = a.nextSibling;
        if ((t.removeChild(a), u && u.nodeType === 8))
          if (((a = u.data), a === '/$' || a === '/&')) {
            if (e === 0) {
              (t.removeChild(u), Se(l));
              return;
            }
            e--;
          } else if (a === '$' || a === '$?' || a === '$~' || a === '$!' || a === '&') e++;
          else if (a === 'html') au(t.ownerDocument.documentElement);
          else if (a === 'head') {
            ((a = t.ownerDocument.head), au(a));
            for (var n = a.firstChild; n; ) {
              var i = n.nextSibling,
                c = n.nodeName;
              (n[Nu] || c === 'SCRIPT' || c === 'STYLE' || (c === 'LINK' && n.rel.toLowerCase() === 'stylesheet') || a.removeChild(n), (n = i));
            }
          } else a === 'body' && au(t.ownerDocument.body);
        a = u;
      } while (a);
      Se(l);
    }
    function ks(t, l) {
      var a = t;
      t = 0;
      do {
        var e = a.nextSibling;
        if (
          (a.nodeType === 1
            ? l
              ? ((a._stashedDisplay = a.style.display), (a.style.display = 'none'))
              : ((a.style.display = a._stashedDisplay || ''), a.getAttribute('style') === '' && a.removeAttribute('style'))
            : a.nodeType === 3 && (l ? ((a._stashedText = a.nodeValue), (a.nodeValue = '')) : (a.nodeValue = a._stashedText || '')),
          e && e.nodeType === 8)
        )
          if (((a = e.data), a === '/$')) {
            if (t === 0) break;
            t--;
          } else (a !== '$' && a !== '$?' && a !== '$~' && a !== '$!') || t++;
        a = e;
      } while (a);
    }
    function Pc(t) {
      var l = t.firstChild;
      for (l && l.nodeType === 10 && (l = l.nextSibling); l; ) {
        var a = l;
        switch (((l = l.nextSibling), a.nodeName)) {
          case 'HTML':
          case 'HEAD':
          case 'BODY':
            (Pc(a), df(a));
            continue;
          case 'SCRIPT':
          case 'STYLE':
            continue;
          case 'LINK':
            if (a.rel.toLowerCase() === 'stylesheet') continue;
        }
        t.removeChild(a);
      }
    }
    function Vh(t, l, a, e) {
      for (; t.nodeType === 1; ) {
        var u = a;
        if (t.nodeName.toLowerCase() !== l.toLowerCase()) {
          if (!e && (t.nodeName !== 'INPUT' || t.type !== 'hidden')) break;
        } else if (e) {
          if (!t[Nu])
            switch (l) {
              case 'meta':
                if (!t.hasAttribute('itemprop')) break;
                return t;
              case 'link':
                if (((n = t.getAttribute('rel')), n === 'stylesheet' && t.hasAttribute('data-precedence'))) break;
                if (n !== u.rel || t.getAttribute('href') !== (u.href == null || u.href === '' ? null : u.href) || t.getAttribute('crossorigin') !== (u.crossOrigin == null ? null : u.crossOrigin) || t.getAttribute('title') !== (u.title == null ? null : u.title)) break;
                return t;
              case 'style':
                if (t.hasAttribute('data-precedence')) break;
                return t;
              case 'script':
                if (((n = t.getAttribute('src')), (n !== (u.src == null ? null : u.src) || t.getAttribute('type') !== (u.type == null ? null : u.type) || t.getAttribute('crossorigin') !== (u.crossOrigin == null ? null : u.crossOrigin)) && n && t.hasAttribute('async') && !t.hasAttribute('itemprop')))
                  break;
                return t;
              default:
                return t;
            }
        } else if (l === 'input' && t.type === 'hidden') {
          var n = u.name == null ? null : '' + u.name;
          if (u.type === 'hidden' && t.getAttribute('name') === n) return t;
        } else return t;
        if (((t = ul(t.nextSibling)), t === null)) break;
      }
      return null;
    }
    function Kh(t, l, a) {
      if (l === '') return null;
      for (; t.nodeType !== 3; ) if (((t.nodeType !== 1 || t.nodeName !== 'INPUT' || t.type !== 'hidden') && !a) || ((t = ul(t.nextSibling)), t === null)) return null;
      return t;
    }
    function R0(t, l) {
      for (; t.nodeType !== 8; ) if (((t.nodeType !== 1 || t.nodeName !== 'INPUT' || t.type !== 'hidden') && !l) || ((t = ul(t.nextSibling)), t === null)) return null;
      return t;
    }
    function tf(t) {
      return t.data === '$?' || t.data === '$~';
    }
    function lf(t) {
      return t.data === '$!' || (t.data === '$?' && t.ownerDocument.readyState !== 'loading');
    }
    function Jh(t, l) {
      var a = t.ownerDocument;
      if (t.data === '$~') t._reactRetry = l;
      else if (t.data !== '$?' || a.readyState !== 'loading') l();
      else {
        var e = function () {
          (l(), a.removeEventListener('DOMContentLoaded', e));
        };
        (a.addEventListener('DOMContentLoaded', e), (t._reactRetry = e));
      }
    }
    function ul(t) {
      for (; t != null; t = t.nextSibling) {
        var l = t.nodeType;
        if (l === 1 || l === 3) break;
        if (l === 8) {
          if (((l = t.data), l === '$' || l === '$!' || l === '$?' || l === '$~' || l === '&' || l === 'F!' || l === 'F')) break;
          if (l === '/$' || l === '/&') return null;
        }
      }
      return t;
    }
    var af = null;
    function Ws(t) {
      t = t.nextSibling;
      for (var l = 0; t; ) {
        if (t.nodeType === 8) {
          var a = t.data;
          if (a === '/$' || a === '/&') {
            if (l === 0) return ul(t.nextSibling);
            l--;
          } else (a !== '$' && a !== '$!' && a !== '$?' && a !== '$~' && a !== '&') || l++;
        }
        t = t.nextSibling;
      }
      return null;
    }
    function $s(t) {
      t = t.previousSibling;
      for (var l = 0; t; ) {
        if (t.nodeType === 8) {
          var a = t.data;
          if (a === '$' || a === '$!' || a === '$?' || a === '$~' || a === '&') {
            if (l === 0) return t;
            l--;
          } else (a !== '/$' && a !== '/&') || l++;
        }
        t = t.previousSibling;
      }
      return null;
    }
    function Y0(t, l, a) {
      switch (((l = Gn(a)), t)) {
        case 'html':
          if (((t = l.documentElement), !t)) throw Error(b(452));
          return t;
        case 'head':
          if (((t = l.head), !t)) throw Error(b(453));
          return t;
        case 'body':
          if (((t = l.body), !t)) throw Error(b(454));
          return t;
        default:
          throw Error(b(451));
      }
    }
    function au(t) {
      for (var l = t.attributes; l.length; ) t.removeAttributeNode(l[0]);
      df(t);
    }
    var nl = new Map(),
      Fs = new Set();
    function jn(t) {
      return typeof t.getRootNode == 'function' ? t.getRootNode() : t.nodeType === 9 ? t : t.ownerDocument;
    }
    var Ql = V.d;
    V.d = { f: wh, r: kh, D: Wh, C: $h, L: Fh, m: Ih, X: ty, S: Ph, M: ly };
    function wh() {
      var t = Ql.f(),
        l = ui();
      return t || l;
    }
    function kh(t) {
      var l = ze(t);
      l !== null && l.tag === 5 && l.type === 'form' ? Um(l) : Ql.r(t);
    }
    var Oe = typeof document > 'u' ? null : document;
    function Q0(t, l, a) {
      var e = Oe;
      if (e && typeof l == 'string' && l) {
        var u = tl(l);
        ((u = 'link[rel="' + t + '"][href="' + u + '"]'), typeof a == 'string' && (u += '[crossorigin="' + a + '"]'), Fs.has(u) || (Fs.add(u), (t = { rel: t, crossOrigin: a, href: l }), e.querySelector(u) === null && ((l = e.createElement('link')), Et(l, 'link', t), bt(l), e.head.appendChild(l))));
      }
    }
    function Wh(t) {
      (Ql.D(t), Q0('dns-prefetch', t, null));
    }
    function $h(t, l) {
      (Ql.C(t, l), Q0('preconnect', t, l));
    }
    function Fh(t, l, a) {
      Ql.L(t, l, a);
      var e = Oe;
      if (e && t && l) {
        var u = 'link[rel="preload"][as="' + tl(l) + '"]';
        l === 'image' && a && a.imageSrcSet ? ((u += '[imagesrcset="' + tl(a.imageSrcSet) + '"]'), typeof a.imageSizes == 'string' && (u += '[imagesizes="' + tl(a.imageSizes) + '"]')) : (u += '[href="' + tl(t) + '"]');
        var n = u;
        switch (l) {
          case 'style':
            n = pe(t);
            break;
          case 'script':
            n = _e(t);
        }
        nl.has(n) ||
          ((t = at({ rel: 'preload', href: l === 'image' && a && a.imageSrcSet ? void 0 : t, as: l }, a)),
          nl.set(n, t),
          e.querySelector(u) !== null || (l === 'style' && e.querySelector(_u(n))) || (l === 'script' && e.querySelector(Mu(n))) || ((l = e.createElement('link')), Et(l, 'link', t), bt(l), e.head.appendChild(l)));
      }
    }
    function Ih(t, l) {
      Ql.m(t, l);
      var a = Oe;
      if (a && t) {
        var e = l && typeof l.as == 'string' ? l.as : 'script',
          u = 'link[rel="modulepreload"][as="' + tl(e) + '"][href="' + tl(t) + '"]',
          n = u;
        switch (e) {
          case 'audioworklet':
          case 'paintworklet':
          case 'serviceworker':
          case 'sharedworker':
          case 'worker':
          case 'script':
            n = _e(t);
        }
        if (!nl.has(n) && ((t = at({ rel: 'modulepreload', href: t }, l)), nl.set(n, t), a.querySelector(u) === null)) {
          switch (e) {
            case 'audioworklet':
            case 'paintworklet':
            case 'serviceworker':
            case 'sharedworker':
            case 'worker':
            case 'script':
              if (a.querySelector(Mu(n))) return;
          }
          ((e = a.createElement('link')), Et(e, 'link', t), bt(e), a.head.appendChild(e));
        }
      }
    }
    function Ph(t, l, a) {
      Ql.S(t, l, a);
      var e = Oe;
      if (e && t) {
        var u = ee(e).hoistableStyles,
          n = pe(t);
        l = l || 'default';
        var i = u.get(n);
        if (!i) {
          var c = { loading: 0, preload: null };
          if ((i = e.querySelector(_u(n)))) c.loading = 5;
          else {
            ((t = at({ rel: 'stylesheet', href: t, 'data-precedence': l }, a)), (a = nl.get(n)) && $f(t, a));
            var f = (i = e.createElement('link'));
            (bt(f),
              Et(f, 'link', t),
              (f._p = new Promise(function (m, h) {
                ((f.onload = m), (f.onerror = h));
              })),
              f.addEventListener('load', function () {
                c.loading |= 1;
              }),
              f.addEventListener('error', function () {
                c.loading |= 2;
              }),
              (c.loading |= 4),
              rn(i, l, e));
          }
          ((i = { type: 'stylesheet', instance: i, count: 1, state: c }), u.set(n, i));
        }
      }
    }
    function ty(t, l) {
      Ql.X(t, l);
      var a = Oe;
      if (a && t) {
        var e = ee(a).hoistableScripts,
          u = _e(t),
          n = e.get(u);
        n || ((n = a.querySelector(Mu(u))), n || ((t = at({ src: t, async: !0 }, l)), (l = nl.get(u)) && Ff(t, l), (n = a.createElement('script')), bt(n), Et(n, 'link', t), a.head.appendChild(n)), (n = { type: 'script', instance: n, count: 1, state: null }), e.set(u, n));
      }
    }
    function ly(t, l) {
      Ql.M(t, l);
      var a = Oe;
      if (a && t) {
        var e = ee(a).hoistableScripts,
          u = _e(t),
          n = e.get(u);
        n || ((n = a.querySelector(Mu(u))), n || ((t = at({ src: t, async: !0, type: 'module' }, l)), (l = nl.get(u)) && Ff(t, l), (n = a.createElement('script')), bt(n), Et(n, 'link', t), a.head.appendChild(n)), (n = { type: 'script', instance: n, count: 1, state: null }), e.set(u, n));
      }
    }
    function Is(t, l, a, e) {
      var u = (u = Il.current) ? jn(u) : null;
      if (!u) throw Error(b(446));
      switch (t) {
        case 'meta':
        case 'title':
          return null;
        case 'style':
          return typeof a.precedence == 'string' && typeof a.href == 'string' ? ((l = pe(a.href)), (a = ee(u).hoistableStyles), (e = a.get(l)), e || ((e = { type: 'style', instance: null, count: 0, state: null }), a.set(l, e)), e) : { type: 'void', instance: null, count: 0, state: null };
        case 'link':
          if (a.rel === 'stylesheet' && typeof a.href == 'string' && typeof a.precedence == 'string') {
            t = pe(a.href);
            var n = ee(u).hoistableStyles,
              i = n.get(t);
            if (
              (i ||
                ((u = u.ownerDocument || u),
                (i = { type: 'stylesheet', instance: null, count: 0, state: { loading: 0, preload: null } }),
                n.set(t, i),
                (n = u.querySelector(_u(t))) && !n._p && ((i.instance = n), (i.state.loading = 5)),
                nl.has(t) || ((a = { rel: 'preload', as: 'style', href: a.href, crossOrigin: a.crossOrigin, integrity: a.integrity, media: a.media, hrefLang: a.hrefLang, referrerPolicy: a.referrerPolicy }), nl.set(t, a), n || ay(u, t, a, i.state))),
              l && e === null)
            )
              throw Error(b(528, ''));
            return i;
          }
          if (l && e !== null) throw Error(b(529, ''));
          return null;
        case 'script':
          return (
            (l = a.async),
            (a = a.src),
            typeof a == 'string' && l && typeof l != 'function' && typeof l != 'symbol' ? ((l = _e(a)), (a = ee(u).hoistableScripts), (e = a.get(l)), e || ((e = { type: 'script', instance: null, count: 0, state: null }), a.set(l, e)), e) : { type: 'void', instance: null, count: 0, state: null }
          );
        default:
          throw Error(b(444, t));
      }
    }
    function pe(t) {
      return 'href="' + tl(t) + '"';
    }
    function _u(t) {
      return 'link[rel="stylesheet"][' + t + ']';
    }
    function X0(t) {
      return at({}, t, { 'data-precedence': t.precedence, precedence: null });
    }
    function ay(t, l, a, e) {
      t.querySelector('link[rel="preload"][as="style"][' + l + ']')
        ? (e.loading = 1)
        : ((l = t.createElement('link')),
          (e.preload = l),
          l.addEventListener('load', function () {
            return (e.loading |= 1);
          }),
          l.addEventListener('error', function () {
            return (e.loading |= 2);
          }),
          Et(l, 'link', a),
          bt(l),
          t.head.appendChild(l));
    }
    function _e(t) {
      return '[src="' + tl(t) + '"]';
    }
    function Mu(t) {
      return 'script[async]' + t;
    }
    function Ps(t, l, a) {
      if ((l.count++, l.instance === null))
        switch (l.type) {
          case 'style':
            var e = t.querySelector('style[data-href~="' + tl(a.href) + '"]');
            if (e) return ((l.instance = e), bt(e), e);
            var u = at({}, a, { 'data-href': a.href, 'data-precedence': a.precedence, href: null, precedence: null });
            return ((e = (t.ownerDocument || t).createElement('style')), bt(e), Et(e, 'style', u), rn(e, a.precedence, t), (l.instance = e));
          case 'stylesheet':
            u = pe(a.href);
            var n = t.querySelector(_u(u));
            if (n) return ((l.state.loading |= 4), (l.instance = n), bt(n), n);
            ((e = X0(a)), (u = nl.get(u)) && $f(e, u), (n = (t.ownerDocument || t).createElement('link')), bt(n));
            var i = n;
            return (
              (i._p = new Promise(function (c, f) {
                ((i.onload = c), (i.onerror = f));
              })),
              Et(n, 'link', e),
              (l.state.loading |= 4),
              rn(n, a.precedence, t),
              (l.instance = n)
            );
          case 'script':
            return ((n = _e(a.src)), (u = t.querySelector(Mu(n))) ? ((l.instance = u), bt(u), u) : ((e = a), (u = nl.get(n)) && ((e = at({}, a)), Ff(e, u)), (t = t.ownerDocument || t), (u = t.createElement('script')), bt(u), Et(u, 'link', e), t.head.appendChild(u), (l.instance = u)));
          case 'void':
            return null;
          default:
            throw Error(b(443, l.type));
        }
      else l.type === 'stylesheet' && (l.state.loading & 4) === 0 && ((e = l.instance), (l.state.loading |= 4), rn(e, a.precedence, t));
      return l.instance;
    }
    function rn(t, l, a) {
      for (var e = a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), u = e.length ? e[e.length - 1] : null, n = u, i = 0; i < e.length; i++) {
        var c = e[i];
        if (c.dataset.precedence === l) n = c;
        else if (n !== u) break;
      }
      n ? n.parentNode.insertBefore(t, n.nextSibling) : ((l = a.nodeType === 9 ? a.head : a), l.insertBefore(t, l.firstChild));
    }
    function $f(t, l) {
      (t.crossOrigin == null && (t.crossOrigin = l.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = l.referrerPolicy), t.title == null && (t.title = l.title));
    }
    function Ff(t, l) {
      (t.crossOrigin == null && (t.crossOrigin = l.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = l.referrerPolicy), t.integrity == null && (t.integrity = l.integrity));
    }
    var vn = null;
    function td(t, l, a) {
      if (vn === null) {
        var e = new Map(),
          u = (vn = new Map());
        u.set(a, e);
      } else ((u = vn), (e = u.get(a)), e || ((e = new Map()), u.set(a, e)));
      if (e.has(t)) return e;
      for (e.set(t, null), a = a.getElementsByTagName(t), u = 0; u < a.length; u++) {
        var n = a[u];
        if (!(n[Nu] || n[Nt] || (t === 'link' && n.getAttribute('rel') === 'stylesheet')) && n.namespaceURI !== 'http://www.w3.org/2000/svg') {
          var i = n.getAttribute(l) || '';
          i = t + i;
          var c = e.get(i);
          c ? c.push(n) : e.set(i, [n]);
        }
      }
      return e;
    }
    function ld(t, l, a) {
      ((t = t.ownerDocument || t), t.head.insertBefore(a, l === 'title' ? t.querySelector('head > title') : null));
    }
    function ey(t, l, a) {
      if (a === 1 || l.itemProp != null) return !1;
      switch (t) {
        case 'meta':
        case 'title':
          return !0;
        case 'style':
          if (typeof l.precedence != 'string' || typeof l.href != 'string' || l.href === '') break;
          return !0;
        case 'link':
          if (typeof l.rel != 'string' || typeof l.href != 'string' || l.href === '' || l.onLoad || l.onError) break;
          return l.rel === 'stylesheet' ? ((t = l.disabled), typeof l.precedence == 'string' && t == null) : !0;
        case 'script':
          if (l.async && typeof l.async != 'function' && typeof l.async != 'symbol' && !l.onLoad && !l.onError && l.src && typeof l.src == 'string') return !0;
      }
      return !1;
    }
    function G0(t) {
      return !(t.type === 'stylesheet' && (t.state.loading & 3) === 0);
    }
    function uy(t, l, a, e) {
      if (a.type === 'stylesheet' && (typeof e.media != 'string' || matchMedia(e.media).matches !== !1) && (a.state.loading & 4) === 0) {
        if (a.instance === null) {
          var u = pe(e.href),
            n = l.querySelector(_u(u));
          if (n) {
            ((l = n._p), l !== null && typeof l == 'object' && typeof l.then == 'function' && (t.count++, (t = Zn.bind(t)), l.then(t, t)), (a.state.loading |= 4), (a.instance = n), bt(n));
            return;
          }
          ((n = l.ownerDocument || l), (e = X0(e)), (u = nl.get(u)) && $f(e, u), (n = n.createElement('link')), bt(n));
          var i = n;
          ((i._p = new Promise(function (c, f) {
            ((i.onload = c), (i.onerror = f));
          })),
            Et(n, 'link', e),
            (a.instance = n));
        }
        (t.stylesheets === null && (t.stylesheets = new Map()), t.stylesheets.set(a, l), (l = a.state.preload) && (a.state.loading & 3) === 0 && (t.count++, (a = Zn.bind(t)), l.addEventListener('load', a), l.addEventListener('error', a)));
      }
    }
    var oc = 0;
    function ny(t, l) {
      return (
        t.stylesheets && t.count === 0 && hn(t, t.stylesheets),
        0 < t.count || 0 < t.imgCount
          ? function (a) {
              var e = setTimeout(function () {
                if ((t.stylesheets && hn(t, t.stylesheets), t.unsuspend)) {
                  var n = t.unsuspend;
                  ((t.unsuspend = null), n());
                }
              }, 6e4 + l);
              0 < t.imgBytes && oc === 0 && (oc = 62500 * Xh());
              var u = setTimeout(
                function () {
                  if (((t.waitingForImages = !1), t.count === 0 && (t.stylesheets && hn(t, t.stylesheets), t.unsuspend))) {
                    var n = t.unsuspend;
                    ((t.unsuspend = null), n());
                  }
                },
                (t.imgBytes > oc ? 50 : 800) + l,
              );
              return (
                (t.unsuspend = a),
                function () {
                  ((t.unsuspend = null), clearTimeout(e), clearTimeout(u));
                }
              );
            }
          : null
      );
    }
    function Zn() {
      if ((this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))) {
        if (this.stylesheets) hn(this, this.stylesheets);
        else if (this.unsuspend) {
          var t = this.unsuspend;
          ((this.unsuspend = null), t());
        }
      }
    }
    var Ln = null;
    function hn(t, l) {
      ((t.stylesheets = null), t.unsuspend !== null && (t.count++, (Ln = new Map()), l.forEach(iy, t), (Ln = null), Zn.call(t)));
    }
    function iy(t, l) {
      if (!(l.state.loading & 4)) {
        var a = Ln.get(t);
        if (a) var e = a.get(null);
        else {
          ((a = new Map()), Ln.set(t, a));
          for (var u = t.querySelectorAll('link[data-precedence],style[data-precedence]'), n = 0; n < u.length; n++) {
            var i = u[n];
            (i.nodeName === 'LINK' || i.getAttribute('media') !== 'not all') && (a.set(i.dataset.precedence, i), (e = i));
          }
          e && a.set(null, e);
        }
        ((u = l.instance),
          (i = u.getAttribute('data-precedence')),
          (n = a.get(i) || e),
          n === e && a.set(null, u),
          a.set(i, u),
          this.count++,
          (e = Zn.bind(this)),
          u.addEventListener('load', e),
          u.addEventListener('error', e),
          n ? n.parentNode.insertBefore(u, n.nextSibling) : ((t = t.nodeType === 9 ? t.head : t), t.insertBefore(u, t.firstChild)),
          (l.state.loading |= 4));
      }
    }
    var vu = { $$typeof: _l, Provider: null, Consumer: null, _currentValue: Sa, _currentValue2: Sa, _threadCount: 0 };
    function cy(t, l, a, e, u, n, i, c, f) {
      ((this.tag = 1),
        (this.containerInfo = t),
        (this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null),
        (this.callbackPriority = 0),
        (this.expirationTimes = Bi(-1)),
        (this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0),
        (this.entanglements = Bi(0)),
        (this.hiddenUpdates = Bi(null)),
        (this.identifierPrefix = e),
        (this.onUncaughtError = u),
        (this.onCaughtError = n),
        (this.onRecoverableError = i),
        (this.pooledCache = null),
        (this.pooledCacheLanes = 0),
        (this.formState = f),
        (this.incompleteTransitions = new Map()));
    }
    function j0(t, l, a, e, u, n, i, c, f, m, h, y) {
      return ((t = new cy(t, l, a, i, f, m, h, y, c)), (l = 1), n === !0 && (l |= 24), (n = Gt(3, null, null, l)), (t.current = n), (n.stateNode = t), (l = Tf()), l.refCount++, (t.pooledCache = l), l.refCount++, (n.memoizedState = { element: e, isDehydrated: a, cache: l }), Of(n), t);
    }
    function Z0(t) {
      return t ? ((t = Pa), t) : Pa;
    }
    function L0(t, l, a, e, u, n) {
      ((u = Z0(u)), e.context === null ? (e.context = u) : (e.pendingContext = u), (e = ta(l)), (e.payload = { element: a }), (n = n === void 0 ? null : n), n !== null && (e.callback = n), (a = la(t, e, l)), a !== null && (Ht(a, t, l), ke(a, t, l)));
    }
    function ad(t, l) {
      if (((t = t.memoizedState), t !== null && t.dehydrated !== null)) {
        var a = t.retryLane;
        t.retryLane = a !== 0 && a < l ? a : l;
      }
    }
    function If(t, l) {
      (ad(t, l), (t = t.alternate) && ad(t, l));
    }
    function V0(t) {
      if (t.tag === 13 || t.tag === 31) {
        var l = qa(t, 67108864);
        (l !== null && Ht(l, t, 67108864), If(t, 67108864));
      }
    }
    function ed(t) {
      if (t.tag === 13 || t.tag === 31) {
        var l = Kt();
        l = of(l);
        var a = qa(t, l);
        (a !== null && Ht(a, t, l), If(t, l));
      }
    }
    var Vn = !0;
    function fy(t, l, a, e) {
      var u = U.T;
      U.T = null;
      var n = V.p;
      try {
        ((V.p = 2), Pf(t, l, a, e));
      } finally {
        ((V.p = n), (U.T = u));
      }
    }
    function oy(t, l, a, e) {
      var u = U.T;
      U.T = null;
      var n = V.p;
      try {
        ((V.p = 8), Pf(t, l, a, e));
      } finally {
        ((V.p = n), (U.T = u));
      }
    }
    function Pf(t, l, a, e) {
      if (Vn) {
        var u = ef(e);
        if (u === null) (cc(t, l, e, Kn, a), ud(t, e));
        else if (dy(u, t, l, a, e)) e.stopPropagation();
        else if ((ud(t, e), l & 4 && -1 < sy.indexOf(t))) {
          for (; u !== null; ) {
            var n = ze(u);
            if (n !== null)
              switch (n.tag) {
                case 3:
                  if (((n = n.stateNode), n.current.memoizedState.isDehydrated)) {
                    var i = ga(n.pendingLanes);
                    if (i !== 0) {
                      var c = n;
                      for (c.pendingLanes |= 2, c.entangledLanes |= 2; i; ) {
                        var f = 1 << (31 - Vt(i));
                        ((c.entanglements[1] |= f), (i &= ~f));
                      }
                      (bl(n), (L & 6) === 0 && ((Hn = Zt() + 500), Ou(0, !1)));
                    }
                  }
                  break;
                case 31:
                case 13:
                  ((c = qa(n, 2)), c !== null && Ht(c, n, 2), ui(), If(n, 2));
              }
            if (((n = ef(e)), n === null && cc(t, l, e, Kn, a), n === u)) break;
            u = n;
          }
          u !== null && e.stopPropagation();
        } else cc(t, l, e, null, a);
      }
    }
    function ef(t) {
      return ((t = rf(t)), to(t));
    }
    var Kn = null;
    function to(t) {
      if (((Kn = null), (t = wa(t)), t !== null)) {
        var l = gu(t);
        if (l === null) t = null;
        else {
          var a = l.tag;
          if (a === 13) {
            if (((t = sd(l)), t !== null)) return t;
            t = null;
          } else if (a === 31) {
            if (((t = dd(l)), t !== null)) return t;
            t = null;
          } else if (a === 3) {
            if (l.stateNode.current.memoizedState.isDehydrated) return l.tag === 3 ? l.stateNode.containerInfo : null;
            t = null;
          } else l !== t && (t = null);
        }
      }
      return ((Kn = t), null);
    }
    function K0(t) {
      switch (t) {
        case 'beforetoggle':
        case 'cancel':
        case 'click':
        case 'close':
        case 'contextmenu':
        case 'copy':
        case 'cut':
        case 'auxclick':
        case 'dblclick':
        case 'dragend':
        case 'dragstart':
        case 'drop':
        case 'focusin':
        case 'focusout':
        case 'input':
        case 'invalid':
        case 'keydown':
        case 'keypress':
        case 'keyup':
        case 'mousedown':
        case 'mouseup':
        case 'paste':
        case 'pause':
        case 'play':
        case 'pointercancel':
        case 'pointerdown':
        case 'pointerup':
        case 'ratechange':
        case 'reset':
        case 'resize':
        case 'seeked':
        case 'submit':
        case 'toggle':
        case 'touchcancel':
        case 'touchend':
        case 'touchstart':
        case 'volumechange':
        case 'change':
        case 'selectionchange':
        case 'textInput':
        case 'compositionstart':
        case 'compositionend':
        case 'compositionupdate':
        case 'beforeblur':
        case 'afterblur':
        case 'beforeinput':
        case 'blur':
        case 'fullscreenchange':
        case 'focus':
        case 'hashchange':
        case 'popstate':
        case 'select':
        case 'selectstart':
          return 2;
        case 'drag':
        case 'dragenter':
        case 'dragexit':
        case 'dragleave':
        case 'dragover':
        case 'mousemove':
        case 'mouseout':
        case 'mouseover':
        case 'pointermove':
        case 'pointerout':
        case 'pointerover':
        case 'scroll':
        case 'touchmove':
        case 'wheel':
        case 'mouseenter':
        case 'mouseleave':
        case 'pointerenter':
        case 'pointerleave':
          return 8;
        case 'message':
          switch (Fr()) {
            case hd:
              return 2;
            case yd:
              return 8;
            case Sn:
            case Ir:
              return 32;
            case gd:
              return 268435456;
            default:
              return 32;
          }
        default:
          return 32;
      }
    }
    var uf = !1,
      ua = null,
      na = null,
      ia = null,
      hu = new Map(),
      yu = new Map(),
      Jl = [],
      sy = 'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset'.split(' ');
    function ud(t, l) {
      switch (t) {
        case 'focusin':
        case 'focusout':
          ua = null;
          break;
        case 'dragenter':
        case 'dragleave':
          na = null;
          break;
        case 'mouseover':
        case 'mouseout':
          ia = null;
          break;
        case 'pointerover':
        case 'pointerout':
          hu.delete(l.pointerId);
          break;
        case 'gotpointercapture':
        case 'lostpointercapture':
          yu.delete(l.pointerId);
      }
    }
    function Ye(t, l, a, e, u, n) {
      return t === null || t.nativeEvent !== n
        ? ((t = { blockedOn: l, domEventName: a, eventSystemFlags: e, nativeEvent: n, targetContainers: [u] }), l !== null && ((l = ze(l)), l !== null && V0(l)), t)
        : ((t.eventSystemFlags |= e), (l = t.targetContainers), u !== null && l.indexOf(u) === -1 && l.push(u), t);
    }
    function dy(t, l, a, e, u) {
      switch (l) {
        case 'focusin':
          return ((ua = Ye(ua, t, l, a, e, u)), !0);
        case 'dragenter':
          return ((na = Ye(na, t, l, a, e, u)), !0);
        case 'mouseover':
          return ((ia = Ye(ia, t, l, a, e, u)), !0);
        case 'pointerover':
          var n = u.pointerId;
          return (hu.set(n, Ye(hu.get(n) || null, t, l, a, e, u)), !0);
        case 'gotpointercapture':
          return ((n = u.pointerId), yu.set(n, Ye(yu.get(n) || null, t, l, a, e, u)), !0);
      }
      return !1;
    }
    function J0(t) {
      var l = wa(t.target);
      if (l !== null) {
        var a = gu(l);
        if (a !== null) {
          if (((l = a.tag), l === 13)) {
            if (((l = sd(a)), l !== null)) {
              ((t.blockedOn = l),
                jo(t.priority, function () {
                  ed(a);
                }));
              return;
            }
          } else if (l === 31) {
            if (((l = dd(a)), l !== null)) {
              ((t.blockedOn = l),
                jo(t.priority, function () {
                  ed(a);
                }));
              return;
            }
          } else if (l === 3 && a.stateNode.current.memoizedState.isDehydrated) {
            t.blockedOn = a.tag === 3 ? a.stateNode.containerInfo : null;
            return;
          }
        }
      }
      t.blockedOn = null;
    }
    function yn(t) {
      if (t.blockedOn !== null) return !1;
      for (var l = t.targetContainers; 0 < l.length; ) {
        var a = ef(t.nativeEvent);
        if (a === null) {
          a = t.nativeEvent;
          var e = new a.constructor(a.type, a);
          ((zc = e), a.target.dispatchEvent(e), (zc = null));
        } else return ((l = ze(a)), l !== null && V0(l), (t.blockedOn = a), !1);
        l.shift();
      }
      return !0;
    }
    function nd(t, l, a) {
      yn(t) && a.delete(l);
    }
    function my() {
      ((uf = !1), ua !== null && yn(ua) && (ua = null), na !== null && yn(na) && (na = null), ia !== null && yn(ia) && (ia = null), hu.forEach(nd), yu.forEach(nd));
    }
    function Pu(t, l) {
      t.blockedOn === l && ((t.blockedOn = null), uf || ((uf = !0), ht.unstable_scheduleCallback(ht.unstable_NormalPriority, my)));
    }
    var tn = null;
    function id(t) {
      tn !== t &&
        ((tn = t),
        ht.unstable_scheduleCallback(ht.unstable_NormalPriority, function () {
          tn === t && (tn = null);
          for (var l = 0; l < t.length; l += 3) {
            var a = t[l],
              e = t[l + 1],
              u = t[l + 2];
            if (typeof e != 'function') {
              if (to(e || a) === null) continue;
              break;
            }
            var n = ze(a);
            n !== null && (t.splice(l, 3), (l -= 3), Qc(n, { pending: !0, data: u, method: a.method, action: e }, e, u));
          }
        }));
    }
    function Se(t) {
      function l(f) {
        return Pu(f, t);
      }
      (ua !== null && Pu(ua, t), na !== null && Pu(na, t), ia !== null && Pu(ia, t), hu.forEach(l), yu.forEach(l));
      for (var a = 0; a < Jl.length; a++) {
        var e = Jl[a];
        e.blockedOn === t && (e.blockedOn = null);
      }
      for (; 0 < Jl.length && ((a = Jl[0]), a.blockedOn === null); ) (J0(a), a.blockedOn === null && Jl.shift());
      if (((a = (t.ownerDocument || t).$$reactFormReplay), a != null))
        for (e = 0; e < a.length; e += 3) {
          var u = a[e],
            n = a[e + 1],
            i = u[Bt] || null;
          if (typeof n == 'function') i || id(a);
          else if (i) {
            var c = null;
            if (n && n.hasAttribute('formAction')) {
              if (((u = n), (i = n[Bt] || null))) c = i.formAction;
              else if (to(u) !== null) continue;
            } else c = i.action;
            (typeof c == 'function' ? (a[e + 1] = c) : (a.splice(e, 3), (e -= 3)), id(a));
          }
        }
    }
    function w0() {
      function t(n) {
        n.canIntercept &&
          n.info === 'react-transition' &&
          n.intercept({
            handler: function () {
              return new Promise(function (i) {
                return (u = i);
              });
            },
            focusReset: 'manual',
            scroll: 'manual',
          });
      }
      function l() {
        (u !== null && (u(), (u = null)), e || setTimeout(a, 20));
      }
      function a() {
        if (!e && !navigation.transition) {
          var n = navigation.currentEntry;
          n && n.url != null && navigation.navigate(n.url, { state: n.getState(), info: 'react-transition', history: 'replace' });
        }
      }
      if (typeof navigation == 'object') {
        var e = !1,
          u = null;
        return (
          navigation.addEventListener('navigate', t),
          navigation.addEventListener('navigatesuccess', l),
          navigation.addEventListener('navigateerror', l),
          setTimeout(a, 100),
          function () {
            ((e = !0), navigation.removeEventListener('navigate', t), navigation.removeEventListener('navigatesuccess', l), navigation.removeEventListener('navigateerror', l), u !== null && (u(), (u = null)));
          }
        );
      }
    }
    function lo(t) {
      this._internalRoot = t;
    }
    ci.prototype.render = lo.prototype.render = function (t) {
      var l = this._internalRoot;
      if (l === null) throw Error(b(409));
      var a = l.current,
        e = Kt();
      L0(a, e, t, l, null, null);
    };
    ci.prototype.unmount = lo.prototype.unmount = function () {
      var t = this._internalRoot;
      if (t !== null) {
        this._internalRoot = null;
        var l = t.containerInfo;
        (L0(t.current, 2, null, t, null, null), ui(), (l[Ne] = null));
      }
    };
    function ci(t) {
      this._internalRoot = t;
    }
    ci.prototype.unstable_scheduleHydration = function (t) {
      if (t) {
        var l = zd();
        t = { blockedOn: null, target: t, priority: l };
        for (var a = 0; a < Jl.length && l !== 0 && l < Jl[a].priority; a++);
        (Jl.splice(a, 0, t), a === 0 && J0(t));
      }
    };
    var cd = fd.version;
    if (cd !== '19.2.4') throw Error(b(527, cd, '19.2.4'));
    V.findDOMNode = function (t) {
      var l = t._reactInternals;
      if (l === void 0) throw typeof t.render == 'function' ? Error(b(188)) : ((t = Object.keys(t).join(',')), Error(b(268, t)));
      return ((t = Vr(l)), (t = t !== null ? md(t) : null), (t = t === null ? null : t.stateNode), t);
    };
    var ry = { bundleType: 0, version: '19.2.4', rendererPackageName: 'react-dom', currentDispatcherRef: U, reconcilerVersion: '19.2.4' };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u' && ((Qe = __REACT_DEVTOOLS_GLOBAL_HOOK__), !Qe.isDisabled && Qe.supportsFiber))
      try {
        ((bu = Qe.inject(ry)), (Lt = Qe));
      } catch {}
    var Qe;
    fi.createRoot = function (t, l) {
      if (!od(t)) throw Error(b(299));
      var a = !1,
        e = '',
        u = Qm,
        n = Xm,
        i = Gm;
      return (
        l != null && (l.unstable_strictMode === !0 && (a = !0), l.identifierPrefix !== void 0 && (e = l.identifierPrefix), l.onUncaughtError !== void 0 && (u = l.onUncaughtError), l.onCaughtError !== void 0 && (n = l.onCaughtError), l.onRecoverableError !== void 0 && (i = l.onRecoverableError)),
        (l = j0(t, 1, !1, null, null, a, e, null, u, n, i, w0)),
        (t[Ne] = l.current),
        Wf(t),
        new lo(l)
      );
    };
    fi.hydrateRoot = function (t, l, a) {
      if (!od(t)) throw Error(b(299));
      var e = !1,
        u = '',
        n = Qm,
        i = Xm,
        c = Gm,
        f = null;
      return (
        a != null &&
          (a.unstable_strictMode === !0 && (e = !0),
          a.identifierPrefix !== void 0 && (u = a.identifierPrefix),
          a.onUncaughtError !== void 0 && (n = a.onUncaughtError),
          a.onCaughtError !== void 0 && (i = a.onCaughtError),
          a.onRecoverableError !== void 0 && (c = a.onRecoverableError),
          a.formState !== void 0 && (f = a.formState)),
        (l = j0(t, 1, !0, l, a ?? null, e, u, f, n, i, c, w0)),
        (l.context = Z0(null)),
        (a = l.current),
        (e = Kt()),
        (e = of(e)),
        (u = ta(e)),
        (u.callback = null),
        la(a, u, e),
        (a = e),
        (l.current.lanes = a),
        Su(l, a),
        bl(l),
        (t[Ne] = l.current),
        Wf(t),
        new ci(l)
      );
    };
    fi.version = '19.2.4';
  });
  var F0 = dl((Qy, $0) => {
    'use strict';
    function W0() {
      if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'))
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(W0);
        } catch (t) {
          console.error(t);
        }
    }
    (W0(), ($0.exports = k0()));
  });
  var P0 = dl((oi) => {
    'use strict';
    var vy = Symbol.for('react.transitional.element'),
      hy = Symbol.for('react.fragment');
    function I0(t, l, a) {
      var e = null;
      if ((a !== void 0 && (e = '' + a), l.key !== void 0 && (e = '' + l.key), 'key' in l)) {
        a = {};
        for (var u in l) u !== 'key' && (a[u] = l[u]);
      } else a = l;
      return ((l = a.ref), { $$typeof: vy, type: t, key: e, ref: l !== void 0 ? l : null, props: a });
    }
    oi.Fragment = hy;
    oi.jsx = I0;
    oi.jsxs = I0;
  });
  var yt = dl((Gy, tr) => {
    'use strict';
    tr.exports = P0();
  });
  var sr = $(F0());
  var si = $(il()),
    O = $(yt()),
    Du = window.location.pathname.replace('/shop', '').replace(/^\//, '') || 'home';
  function yy({ children: t }) {
    let [l, a] = (0, si.useState)(!1);
    return (
      (0, si.useEffect)(() => {
        let e = document.querySelector('meta[name="ga-id"]')?.getAttribute('content');
        if (e && !window.gtag) {
          let n = function () {
              window.dataLayer.push(arguments);
            },
            u = document.createElement('script');
          ((u.async = !0), (u.src = `https://www.googletagmanager.com/gtag/js?id=${e}`), document.head.appendChild(u), (window.dataLayer = window.dataLayer || []), (window.gtag = n), n('js', new Date()), n('config', e));
        }
      }, []),
      (0, O.jsxs)(O.Fragment, {
        children: [
          (0, O.jsx)('nav', {
            className: `otd-nav${l ? ' open' : ''}`,
            children: (0, O.jsx)('div', {
              className: 'container',
              children: (0, O.jsxs)('div', {
                className: 'otd-nav-inner',
                children: [
                  (0, O.jsxs)('a', { className: 'otd-brand', href: '/shop', children: [(0, O.jsx)('img', { className: 'otd-logo', src: '/commerce/otd-logo.png', alt: 'Outta Town Donuts' }), (0, O.jsx)('span', { className: 'otd-brand-text', children: 'Outta Town Donuts' })] }),
                  (0, O.jsxs)('button', {
                    className: 'otd-nav-toggle',
                    type: 'button',
                    onClick: () => a((e) => !e),
                    'aria-label': 'Toggle navigation',
                    children: [(0, O.jsx)('span', { className: 'otd-nav-toggle-bar' }), (0, O.jsx)('span', { className: 'otd-nav-toggle-bar' }), (0, O.jsx)('span', { className: 'otd-nav-toggle-bar' })],
                  }),
                  (0, O.jsxs)('div', {
                    className: 'otd-nav-links',
                    children: [
                      (0, O.jsx)('a', { className: `otd-nav-link${Du === 'home' ? ' active' : ''}`, href: '/shop', children: 'Home' }),
                      (0, O.jsx)('a', { className: `otd-nav-link${Du === 'pickup' ? ' active' : ''}`, href: '/shop/pickup', children: 'Pickup Orders' }),
                      (0, O.jsx)('a', { className: `otd-nav-link${Du === 'bundles' ? ' active' : ''}`, href: '/shop/bundles', children: 'Bundles' }),
                      (0, O.jsx)('a', { className: 'otd-nav-link', href: '/special-orders', children: 'Special Orders' }),
                      (0, O.jsx)('a', { className: `otd-nav-link${Du === 'about' ? ' active' : ''}`, href: '/shop/about', children: 'About Us' }),
                      (0, O.jsx)('a', { className: `otd-nav-link${Du === 'contact' ? ' active' : ''}`, href: '/shop/contact', children: 'Contact' }),
                    ],
                  }),
                ],
              }),
            }),
          }),
          (0, O.jsx)('main', { className: 'otd-main flex-shrink-0 flex-grow-1', children: t }),
          (0, O.jsx)('footer', {
            className: 'otd-footer',
            children: (0, O.jsxs)('div', {
              className: 'container',
              children: [
                (0, O.jsxs)('div', {
                  className: 'otd-footer-inner',
                  children: [
                    (0, O.jsxs)('div', { className: 'otd-footer-brand', children: [(0, O.jsx)('img', { className: 'otd-footer-logo', src: '/commerce/otd-logo.png', alt: 'Outta Town Donuts' }), (0, O.jsx)('p', { className: 'otd-footer-tagline', children: 'Made by hand. Sold by hand.' })] }),
                    (0, O.jsxs)('div', {
                      className: 'otd-footer-links',
                      children: [
                        (0, O.jsxs)('div', {
                          className: 'otd-footer-col',
                          children: [
                            (0, O.jsx)('h4', { children: 'Shop' }),
                            (0, O.jsxs)('ul', {
                              children: [
                                (0, O.jsx)('li', { children: (0, O.jsx)('a', { href: '/shop', children: 'Home' }) }),
                                (0, O.jsx)('li', { children: (0, O.jsx)('a', { href: '/shop/pickup', children: 'Pickup Orders' }) }),
                                (0, O.jsx)('li', { children: (0, O.jsx)('a', { href: '/shop/bundles', children: 'Bundles' }) }),
                              ],
                            }),
                          ],
                        }),
                        (0, O.jsxs)('div', {
                          className: 'otd-footer-col',
                          children: [
                            (0, O.jsx)('h4', { children: 'Company' }),
                            (0, O.jsxs)('ul', { children: [(0, O.jsx)('li', { children: (0, O.jsx)('a', { href: '/shop/about', children: 'About Us' }) }), (0, O.jsx)('li', { children: (0, O.jsx)('a', { href: '/shop/contact', children: 'Contact' }) })] }),
                          ],
                        }),
                        (0, O.jsxs)('div', {
                          className: 'otd-footer-col',
                          children: [
                            (0, O.jsx)('h4', { children: 'Legal' }),
                            (0, O.jsxs)('ul', { children: [(0, O.jsx)('li', { children: (0, O.jsx)('a', { href: '/privacy-policy.html', children: 'Privacy Policy' }) }), (0, O.jsx)('li', { children: (0, O.jsx)('a', { href: '/terms-of-use.html', children: 'Terms of Use' }) })] }),
                          ],
                        }),
                        (0, O.jsxs)('div', { className: 'otd-footer-col', children: [(0, O.jsx)('h4', { children: 'Location' }), (0, O.jsxs)('ul', { children: [(0, O.jsx)('li', { children: 'Woodbury, Tennessee' }), (0, O.jsx)('li', { children: 'Available at the local flea market' })] })] }),
                      ],
                    }),
                  ],
                }),
                (0, O.jsxs)('div', {
                  className: 'otd-footer-bottom',
                  children: [(0, O.jsxs)('span', { children: ['\xA9 ', new Date().getFullYear(), ' Outta Town Donuts \u2014 A New Weird America project.'] }), (0, O.jsx)('a', { className: 'otd-admin-link', href: '/apply', children: 'Administration' })],
                }),
              ],
            }),
          }),
        ],
      })
    );
  }
  var lr = yy;
  var Uu = $(il()),
    x = $(yt());
  function gy(t) {
    if (t == null || isNaN(t)) return '$0.00';
    let l = t.toFixed(3);
    return `$${l.endsWith('0') ? t.toFixed(2) : l}`;
  }
  function by() {
    let [t, l] = (0, Uu.useState)([]),
      [a, e] = (0, Uu.useState)(!0);
    (0, Uu.useEffect)(() => {
      ((document.title = 'Outta Town Donuts'),
        fetch('/shop/api/storefront')
          .then((n) => n.json())
          .then((n) => {
            (l(n.products || []), e(!1));
          })
          .catch(() => e(!1)));
    }, []);
    let u = t.filter((n) => n.available > 0);
    return (0, x.jsxs)(x.Fragment, {
      children: [
        (0, x.jsxs)('div', {
          className: 'otd-hero',
          children: [
            (0, x.jsx)('img', { className: 'otd-hero-logo', src: '/commerce/otd-logo.png', alt: 'Outta Town Donuts' }),
            (0, x.jsx)('h1', { children: 'Outta Town Donuts' }),
            (0, x.jsx)('p', { className: 'otd-tagline', children: 'Made by hand. Sold by hand.' }),
            (0, x.jsx)('p', { className: 'otd-subtitle', children: 'Hand-shaped donuts, made fresh every morning in Woodbury, Tennessee. No cutters. No factories. Just real food, done right.' }),
            (0, x.jsx)('a', { className: 'otd-btn otd-btn-primary otd-btn-large', href: '/shop/pickup', children: 'Order for Pickup' }),
          ],
        }),
        (0, x.jsx)('div', {
          className: 'otd-section',
          children: (0, x.jsxs)('div', {
            className: 'container',
            children: [
              (0, x.jsxs)('div', { className: 'otd-section-header', children: [(0, x.jsx)('h2', { children: 'Available Today' }), (0, x.jsx)('hr', { className: 'otd-divider' })] }),
              a
                ? (0, x.jsx)('div', { className: 'otd-text-center otd-py-5', children: (0, x.jsx)('div', { className: 'otd-spinner' }) })
                : u.length
                  ? (0, x.jsxs)(x.Fragment, {
                      children: [
                        (0, x.jsx)('div', {
                          className: 'otd-products',
                          children: u.map((n) =>
                            (0, x.jsxs)(
                              'div',
                              {
                                className: 'otd-product-card',
                                children: [
                                  (0, x.jsx)('div', { className: 'otd-product-name', children: n.name }),
                                  (0, x.jsxs)('div', {
                                    className: 'd-flex justify-content-between align-items-center',
                                    children: [
                                      (0, x.jsx)('span', { className: 'otd-product-price', children: gy(n.price) }),
                                      (0, x.jsx)('div', {
                                        className: 'otd-product-stock',
                                        children: n.available > 0 ? (0, x.jsxs)('span', { className: 'otd-badge otd-badge-available', children: [n.available, ' left'] }) : (0, x.jsx)('span', { className: 'otd-badge otd-badge-soldout', children: 'Sold out' }),
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              n._id,
                            ),
                          ),
                        }),
                        (0, x.jsx)('div', { className: 'otd-text-center otd-mt-4', children: (0, x.jsx)('a', { className: 'otd-btn otd-btn-primary', href: '/shop/pickup', children: 'Place an Order' }) }),
                      ],
                    })
                  : (0, x.jsxs)('div', {
                      className: 'otd-text-center otd-py-5',
                      children: [(0, x.jsx)('h3', { className: 'otd-text-muted', children: 'Nothing available right now.' }), (0, x.jsx)('p', { className: 'otd-text-muted', children: 'Check back tomorrow morning \u2014 we make everything fresh.' })],
                    }),
            ],
          }),
        }),
        (0, x.jsx)('div', {
          className: 'otd-section otd-section-alt',
          children: (0, x.jsxs)('div', {
            className: 'container',
            children: [
              (0, x.jsxs)('div', { className: 'otd-section-header', children: [(0, x.jsx)('h2', { children: 'How It Works' }), (0, x.jsx)('hr', { className: 'otd-divider' })] }),
              (0, x.jsxs)('div', {
                className: 'otd-values',
                children: [
                  (0, x.jsxs)('div', { className: 'otd-value-item', children: [(0, x.jsx)('h3', { children: 'Pick Your Donuts' }), (0, x.jsx)('p', { children: 'Browse what\u2019s available today. Inventory is real \u2014 when it\u2019s gone, it\u2019s gone.' })] }),
                  (0, x.jsxs)('div', { className: 'otd-value-item', children: [(0, x.jsx)('h3', { children: 'Place Your Order' }), (0, x.jsx)('p', { children: 'Select your quantities and pay securely online. No account required.' })] }),
                  (0, x.jsxs)('div', { className: 'otd-value-item', children: [(0, x.jsx)('h3', { children: 'Pick Up in Woodbury' }), (0, x.jsx)('p', { children: 'Orders are available at our flea market booth. Made fresh, handed to you directly.' })] }),
                ],
              }),
            ],
          }),
        }),
      ],
    });
  }
  var ao = by;
  var sl = $(il()),
    _ = $(yt());
  function ar(t) {
    if (t == null || isNaN(t)) return '$0.00';
    let l = t.toFixed(3);
    return `$${l.endsWith('0') ? t.toFixed(2) : l}`;
  }
  function py() {
    let [t, l] = (0, sl.useState)([]),
      [a, e] = (0, sl.useState)(!0),
      [u, n] = (0, sl.useState)(!0),
      [i, c] = (0, sl.useState)({}),
      [f, m] = (0, sl.useState)(''),
      [h, y] = (0, sl.useState)(''),
      [d, v] = (0, sl.useState)(''),
      [N, E] = (0, sl.useState)(!1),
      s = new URLSearchParams(window.location.search).get('cancelled') === 'true',
      o = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    (0, sl.useEffect)(() => {
      ((document.title = 'Pickup Orders \u2014 Outta Town Donuts'),
        fetch('/shop/api/pickup')
          .then((p) => p.json())
          .then((p) => {
            (l(p.products || []), e(p.preordersEnabled !== !1), n(!1));
          })
          .catch(() => n(!1)));
    }, []);
    function r(p, T, q) {
      c((Y) => {
        let Dt = Math.max(0, Math.min(T, (Y[p] || 0) + q));
        return { ...Y, [p]: Dt };
      });
    }
    let g = t.reduce((p, T) => p + (T.price || 0) * (i[T._id] || 0), 0),
      z = g > 0;
    async function R() {
      let p = t.filter((T) => (i[T._id] || 0) > 0).map((T) => ({ refId: T._id, quantity: i[T._id] }));
      if (p.length !== 0) {
        if (!f.trim()) {
          v('Please enter your name for pickup.');
          return;
        }
        (v(''), E(!0));
        try {
          let T = await fetch('/shop/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': o }, body: JSON.stringify({ items: p, pickupName: f.trim(), customerEmail: h.trim() || void 0 }) }),
            q = await T.json();
          if (!T.ok) throw new Error(q.error || 'Failed to create order');
          if (q.checkoutUrl) window.location.href = q.checkoutUrl;
          else throw new Error('No checkout URL returned');
        } catch (T) {
          (v(T.message), E(!1));
        }
      }
    }
    return u
      ? (0, _.jsx)('div', { className: 'otd-section', children: (0, _.jsx)('div', { className: 'container otd-text-center otd-py-5', children: (0, _.jsx)('div', { className: 'otd-spinner' }) }) })
      : (0, _.jsx)('div', {
          className: 'otd-section',
          children: (0, _.jsxs)('div', {
            className: 'container',
            children: [
              (0, _.jsxs)('div', {
                className: 'otd-section-header',
                children: [(0, _.jsx)('h1', { children: 'Pickup Orders' }), (0, _.jsx)('p', { className: 'otd-text-muted', children: 'Pick what you want. Quantities are real \u2014 when it\u2019s gone, it\u2019s gone.' }), (0, _.jsx)('hr', { className: 'otd-divider' })],
              }),
              a
                ? (0, _.jsxs)(_.Fragment, {
                    children: [
                      s && (0, _.jsx)('div', { className: 'otd-alert otd-alert-warning', children: 'Your payment was cancelled. Your order was not placed. You can try again below.' }),
                      t.length
                        ? (0, _.jsxs)('div', {
                            id: 'order-form',
                            children: [
                              (0, _.jsxs)('table', {
                                className: 'otd-table',
                                children: [
                                  (0, _.jsx)('thead', {
                                    children: (0, _.jsxs)('tr', {
                                      children: [
                                        (0, _.jsx)('th', { children: 'Product' }),
                                        (0, _.jsx)('th', { className: 'text-end', children: 'Price' }),
                                        (0, _.jsx)('th', { className: 'text-center', children: 'Available' }),
                                        (0, _.jsx)('th', { className: 'text-center', style: { width: 140 }, children: 'Qty' }),
                                      ],
                                    }),
                                  }),
                                  (0, _.jsx)('tbody', {
                                    children: t.map((p) =>
                                      (0, _.jsxs)(
                                        'tr',
                                        {
                                          children: [
                                            (0, _.jsx)('td', { children: p.name }),
                                            (0, _.jsx)('td', { className: 'text-end', children: ar(p.price) }),
                                            (0, _.jsx)('td', { className: 'text-center', children: p.available > 0 ? (0, _.jsx)('span', { children: p.available }) : (0, _.jsx)('span', { className: 'otd-text-muted', children: '\u2014' }) }),
                                            (0, _.jsx)('td', {
                                              className: 'text-center',
                                              children:
                                                p.available > 0
                                                  ? (0, _.jsxs)('div', {
                                                      className: 'qty-stepper',
                                                      children: [
                                                        (0, _.jsx)('button', { className: 'qty-btn qty-dec', type: 'button', 'aria-label': `Decrease quantity for ${p.name}`, onClick: () => r(p._id, p.available, -1), children: '\u2212' }),
                                                        (0, _.jsx)('input', { className: 'otd-input-qty qty-input', type: 'number', min: '0', max: p.available, value: i[p._id] || 0, readOnly: !0, 'aria-label': `Quantity for ${p.name}` }),
                                                        (0, _.jsx)('button', { className: 'qty-btn qty-inc', type: 'button', 'aria-label': `Increase quantity for ${p.name}`, onClick: () => r(p._id, p.available, 1), children: '+' }),
                                                      ],
                                                    })
                                                  : (0, _.jsx)('span', { className: 'otd-text-muted', children: 'Sold out' }),
                                            }),
                                          ],
                                        },
                                        p._id,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
                              (0, _.jsxs)('div', {
                                className: 'otd-mt-3',
                                style: { borderTop: '1px solid var(--otd-border)', paddingTop: '1rem' },
                                children: [
                                  (0, _.jsxs)('div', {
                                    className: 'otd-mb-3',
                                    children: [
                                      (0, _.jsx)('label', { className: 'otd-label', htmlFor: 'pickup-name', children: 'Your name for pickup' }),
                                      (0, _.jsx)('input', { id: 'pickup-name', className: 'otd-input', type: 'text', name: 'pickupName', maxLength: 100, placeholder: 'e.g. Jane Smith', autoComplete: 'name', value: f, onChange: (p) => m(p.target.value) }),
                                    ],
                                  }),
                                  (0, _.jsxs)('div', {
                                    className: 'otd-mb-3',
                                    children: [
                                      (0, _.jsxs)('label', { className: 'otd-label', htmlFor: 'customer-email', children: ['Email for receipt', ' ', (0, _.jsx)('span', { className: 'otd-text-muted', style: { fontWeight: 'normal' }, children: '(optional)' })] }),
                                      (0, _.jsx)('input', { id: 'customer-email', className: 'otd-input', type: 'email', name: 'customerEmail', maxLength: 254, placeholder: 'e.g. jane@example.com', autoComplete: 'email', value: h, onChange: (p) => y(p.target.value) }),
                                    ],
                                  }),
                                  (0, _.jsxs)('div', {
                                    className: 'd-flex justify-content-between align-items-center',
                                    children: [
                                      (0, _.jsxs)('div', { children: [(0, _.jsx)('span', { style: { fontWeight: 'bold' }, children: 'Subtotal:\xA0' }), (0, _.jsx)('span', { id: 'order-subtotal', children: ar(g) })] }),
                                      (0, _.jsx)('button', { id: 'checkout-btn', className: 'otd-btn otd-btn-primary', type: 'button', disabled: !z || N, onClick: R, children: 'Checkout' }),
                                    ],
                                  }),
                                ],
                              }),
                              d && (0, _.jsx)('div', { className: 'otd-alert otd-alert-error otd-mt-2', children: d }),
                              N && (0, _.jsxs)('div', { className: 'otd-text-center otd-mt-3', children: [(0, _.jsx)('div', { className: 'otd-spinner' }), (0, _.jsx)('p', { className: 'otd-mt-1 otd-text-muted', children: 'Redirecting to payment...' })] }),
                            ],
                          })
                        : (0, _.jsxs)('div', { className: 'otd-text-center otd-py-5', children: [(0, _.jsx)('h3', { className: 'otd-text-muted', children: 'Nothing available right now.' }), (0, _.jsx)('p', { className: 'otd-text-muted', children: 'Check back tomorrow morning.' })] }),
                    ],
                  })
                : (0, _.jsx)('div', { className: 'otd-alert otd-alert-warning', children: 'Sorry \u2014 preorders are currently turned off. Please visit the flea market to make your order with cash.' }),
              (0, _.jsx)('div', { className: 'otd-mt-4', children: (0, _.jsx)('a', { className: 'otd-text-muted', href: '/shop', children: '\u2190 Back to storefront' }) }),
            ],
          }),
        });
  }
  var er = py;
  var Yt = $(il()),
    S = $(yt());
  function di(t) {
    if (t == null || isNaN(t)) return '$0.00';
    let l = t.toFixed(3);
    return `$${l.endsWith('0') ? t.toFixed(2) : l}`;
  }
  function Sy() {
    let [t, l] = (0, Yt.useState)({ boxConfigs: [], products: [], preordersEnabled: !0 }),
      [a, e] = (0, Yt.useState)(!0),
      [u, n] = (0, Yt.useState)(null),
      [i, c] = (0, Yt.useState)(!1),
      [f, m] = (0, Yt.useState)({}),
      [h, y] = (0, Yt.useState)(''),
      [d, v] = (0, Yt.useState)(''),
      [N, E] = (0, Yt.useState)(''),
      [G, s] = (0, Yt.useState)(!1),
      o = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    ((0, Yt.useEffect)(() => {
      ((document.title = 'Bundles \u2014 Outta Town Donuts'),
        fetch('/shop/api/bundles')
          .then((D) => D.json())
          .then((D) => {
            (l(D), e(!1));
          })
          .catch(() => e(!1)));
    }, []),
      (0, Yt.useEffect)(
        () => (
          (document.body.style.overflow = i ? 'hidden' : ''),
          () => {
            document.body.style.overflow = '';
          }
        ),
        [i],
      ),
      (0, Yt.useEffect)(() => {
        function D(ot) {
          ot.key === 'Escape' && i && g();
        }
        return (document.addEventListener('keydown', D), () => document.removeEventListener('keydown', D));
      }, [i]));
    function r(D) {
      (n(D), m({}), y(''), E(''), c(!0));
    }
    function g() {
      (c(!1), n(null));
    }
    function z(D, ot, va) {
      m((vr) => {
        let uo = Math.max(0, Math.min(ot, parseInt(va, 10) || 0)),
          hi = { ...vr, [D]: uo };
        if (u) {
          let no = Object.values(hi).reduce((hr, yr) => hr + yr, 0);
          no > u.size && (hi[D] = Math.max(0, uo - (no - u.size)));
        }
        return hi;
      });
    }
    function R(D, ot, va) {
      z(D, ot, (f[D] || 0) + va);
    }
    let p = t.products.filter((D) => D.productType === 'simple'),
      T = Object.values(f).reduce((D, ot) => D + ot, 0),
      q = u ? u.size - T : 0,
      Y = u ? Math.min(100, Math.round((T / u.size) * 100)) : 0,
      Dt = p.reduce((D, ot) => D + (ot.price || 0) * (f[ot._id] || 0), 0),
      xu = u ? Math.round(Dt * (u.discountPct / 100) * 100) / 100 : 0,
      dr = Math.max(0, Math.round((Dt - xu) * 100) / 100),
      eo = u && T === u.size;
    function mr() {
      return u ? (T === u.size ? 'Checkout' : T > u.size ? `Too many items \u2014 remove ${T - u.size}` : `Choose your items (${q} left)`) : 'Choose your items first';
    }
    async function rr() {
      if (!u || !eo) return;
      if (!h.trim()) {
        E('Please enter your name for pickup.');
        return;
      }
      let D = p.filter((ot) => (f[ot._id] || 0) > 0).map((ot) => ({ refId: ot._id, quantity: f[ot._id] }));
      (E(''), s(!0));
      try {
        let ot = await fetch('/shop/api/bundle-order', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': o }, body: JSON.stringify({ boxConfigId: u.id, selections: D, pickupName: h.trim(), customerEmail: d.trim() || void 0 }) }),
          va = await ot.json();
        if (!ot.ok) throw new Error(va.error || 'Failed to create order');
        if (va.checkoutUrl) window.location.href = va.checkoutUrl;
        else throw new Error('No checkout URL returned');
      } catch (ot) {
        (E(ot.message), s(!1));
      }
    }
    return a
      ? (0, S.jsx)('div', { className: 'otd-section', children: (0, S.jsx)('div', { className: 'container otd-text-center otd-py-5', children: (0, S.jsx)('div', { className: 'otd-spinner' }) }) })
      : (0, S.jsx)('div', {
          className: 'otd-section',
          children: (0, S.jsxs)('div', {
            className: 'container',
            children: [
              (0, S.jsxs)('div', {
                className: 'otd-section-header',
                children: [(0, S.jsx)('h1', { children: 'Bundles' }), (0, S.jsx)('p', { className: 'otd-text-muted', children: 'Pick your flavors, fill your box, and we\u2019ll have it ready for you.' }), (0, S.jsx)('hr', { className: 'otd-divider' })],
              }),
              t.preordersEnabled
                ? t.boxConfigs.length
                  ? (0, S.jsxs)(S.Fragment, {
                      children: [
                        (0, S.jsxs)('div', {
                          id: 'box-step-1',
                          children: [
                            (0, S.jsx)('h2', { className: 'otd-mb-3', children: 'Choose a box' }),
                            (0, S.jsx)('div', {
                              className: 'otd-products',
                              children: t.boxConfigs.map((D) =>
                                (0, S.jsxs)(
                                  'div',
                                  {
                                    className: 'otd-product-card otd-box-option',
                                    onClick: () => r({ id: D._id, size: D.size, discountPct: D.discountPct || 0, name: D.name }),
                                    children: [
                                      (0, S.jsx)('div', { className: 'otd-product-name', children: D.name }),
                                      (0, S.jsxs)('div', { className: 'otd-text-muted', style: { fontSize: '0.85rem', marginTop: 4 }, children: [D.size, ' items'] }),
                                      D.discountPct > 0 && (0, S.jsxs)('div', { className: 'otd-badge otd-badge-available', style: { marginTop: 6 }, children: [D.discountPct, '% off'] }),
                                    ],
                                  },
                                  D._id,
                                ),
                              ),
                            }),
                          ],
                        }),
                        (0, S.jsxs)('div', {
                          id: 'box-flyout',
                          'aria-modal': 'true',
                          role: 'dialog',
                          'aria-label': 'Build your box',
                          style: { position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', opacity: i ? 1 : 0, pointerEvents: i ? 'auto' : 'none', transition: 'opacity 0.2s ease' },
                          children: [
                            (0, S.jsx)('div', { id: 'box-flyout-backdrop', style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }, onClick: g }),
                            (0, S.jsxs)('div', {
                              className: 'box-flyout-panel',
                              style: {
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                bottom: 0,
                                width: 'min(600px, 100vw)',
                                background: 'var(--otd-surface, #111)',
                                borderLeft: '1px solid var(--otd-border, #2a2a2a)',
                                boxShadow: '-6px 0 32px rgba(0,0,0,0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                transform: i ? 'translateX(0)' : 'translateX(100%)',
                                transition: 'transform 0.25s ease',
                              },
                              children: [
                                (0, S.jsx)('div', {
                                  className: 'box-flyout-header',
                                  style: { padding: '18px 24px', borderBottom: '1px solid var(--otd-border, #2a2a2a)', flexShrink: 0 },
                                  children: (0, S.jsxs)('div', {
                                    className: 'd-flex align-items-start justify-content-between',
                                    children: [
                                      (0, S.jsxs)('div', {
                                        style: { flex: 1, minWidth: 0, paddingRight: 12 },
                                        children: [
                                          (0, S.jsx)('h2', { id: 'flyout-box-name', style: { margin: 0, fontSize: '1.15rem' }, children: u ? `${u.name} \u2014 ${u.size} items` : '' }),
                                          (0, S.jsx)('div', {
                                            className: 'box-progress-bar-wrap',
                                            style: { background: 'var(--otd-border, #333)', borderRadius: 8, height: 6, marginTop: 6, overflow: 'hidden' },
                                            children: (0, S.jsx)('div', { id: 'flyout-progress-bar', style: { height: '100%', width: `${Y}%`, background: 'var(--otd-orange, #e97320)', borderRadius: 8, transition: 'width 0.25s' } }),
                                          }),
                                          (0, S.jsx)('span', {
                                            id: 'flyout-count-label',
                                            style: { fontSize: '0.82rem', color: 'var(--otd-text-muted, #888)', marginTop: 4, display: 'block' },
                                            children: u && q > 0 ? `${q} more item${q !== 1 ? 's' : ''} to fill your box` : u && T === u.size ? 'Your box is full \u2014 ready to checkout!' : u ? `Too many \u2014 remove ${T - u.size}` : '',
                                          }),
                                        ],
                                      }),
                                      (0, S.jsx)('button', { id: 'flyout-close-btn', className: 'flyout-close-btn', type: 'button', 'aria-label': 'Close', onClick: g, children: '\xD7' }),
                                    ],
                                  }),
                                }),
                                (0, S.jsx)('div', {
                                  className: 'box-flyout-body',
                                  style: { flex: 1, overflowY: 'auto', padding: '0 24px 16px' },
                                  children: p.length
                                    ? (0, S.jsxs)('table', {
                                        className: 'otd-table',
                                        style: { marginTop: 16 },
                                        children: [
                                          (0, S.jsx)('thead', {
                                            children: (0, S.jsxs)('tr', {
                                              children: [
                                                (0, S.jsx)('th', { children: 'Product' }),
                                                (0, S.jsx)('th', { className: 'text-end', children: 'Price' }),
                                                (0, S.jsx)('th', { className: 'text-center', children: 'In Stock' }),
                                                (0, S.jsx)('th', { className: 'text-center', style: { width: 130 }, children: 'Qty' }),
                                              ],
                                            }),
                                          }),
                                          (0, S.jsx)('tbody', {
                                            children: p.map((D) =>
                                              (0, S.jsxs)(
                                                'tr',
                                                {
                                                  children: [
                                                    (0, S.jsx)('td', { children: D.name }),
                                                    (0, S.jsx)('td', { className: 'text-end', children: di(D.price) }),
                                                    (0, S.jsx)('td', { className: 'text-center', children: D.available > 0 ? (0, S.jsx)('span', { children: D.available }) : (0, S.jsx)('span', { className: 'otd-text-muted', children: '\u2014' }) }),
                                                    (0, S.jsx)('td', {
                                                      className: 'text-center',
                                                      children:
                                                        D.available > 0
                                                          ? (0, S.jsxs)('div', {
                                                              className: 'qty-stepper',
                                                              children: [
                                                                (0, S.jsx)('button', { className: 'qty-btn qty-dec', type: 'button', 'aria-label': `Decrease quantity for ${D.name}`, onClick: () => R(D._id, D.available, -1), disabled: !f[D._id], children: '\u2212' }),
                                                                (0, S.jsx)('input', { className: 'otd-input-qty box-qty-input', type: 'number', min: '0', max: D.available, value: f[D._id] || 0, readOnly: !0, 'aria-label': `Quantity for ${D.name}` }),
                                                                (0, S.jsx)('button', { className: 'qty-btn qty-inc', type: 'button', 'aria-label': `Increase quantity for ${D.name}`, onClick: () => R(D._id, D.available, 1), disabled: T >= (u ? u.size : 0), children: '+' }),
                                                              ],
                                                            })
                                                          : (0, S.jsx)('span', { className: 'otd-text-muted', children: 'Sold out' }),
                                                    }),
                                                  ],
                                                },
                                                D._id,
                                              ),
                                            ),
                                          }),
                                        ],
                                      })
                                    : (0, S.jsxs)('div', { className: 'otd-text-center otd-py-5', children: [(0, S.jsx)('h3', { className: 'otd-text-muted', children: 'Nothing available right now.' }), (0, S.jsx)('p', { className: 'otd-text-muted', children: 'Check back tomorrow morning.' })] }),
                                }),
                                (0, S.jsxs)('div', {
                                  className: 'box-flyout-footer',
                                  style: { padding: '16px 24px', borderTop: '1px solid var(--otd-border, #2a2a2a)', flexShrink: 0 },
                                  children: [
                                    (0, S.jsxs)('div', { className: 'flyout-summary-row', children: [(0, S.jsx)('span', { children: 'Price before discount:' }), (0, S.jsx)('span', { id: 'box-gross', children: di(Dt) })] }),
                                    (0, S.jsxs)('div', {
                                      className: 'flyout-summary-row',
                                      style: { color: 'var(--otd-orange, #e97320)' },
                                      children: [(0, S.jsx)('span', { id: 'box-discount-label', children: u ? `${u.name} discount (${u.discountPct}%):` : 'Discount:' }), (0, S.jsxs)('span', { id: 'box-discount-amount', children: ['-', di(xu)] })],
                                    }),
                                    (0, S.jsxs)('div', { className: 'flyout-summary-row flyout-summary-total', children: [(0, S.jsx)('span', { children: 'Total:' }), (0, S.jsx)('span', { id: 'box-total', children: di(dr) })] }),
                                    (0, S.jsxs)('div', {
                                      className: 'otd-mt-3',
                                      children: [
                                        (0, S.jsx)('label', { className: 'otd-label', htmlFor: 'box-pickup-name', children: 'Your name for pickup' }),
                                        (0, S.jsx)('input', { id: 'box-pickup-name', className: 'otd-input', type: 'text', name: 'pickupName', maxLength: 100, placeholder: 'e.g. Jane Smith', autoComplete: 'name', value: h, onChange: (D) => y(D.target.value) }),
                                      ],
                                    }),
                                    (0, S.jsxs)('div', {
                                      className: 'otd-mt-3',
                                      children: [
                                        (0, S.jsxs)('label', { className: 'otd-label', htmlFor: 'box-customer-email', children: ['Email for receipt', ' ', (0, S.jsx)('span', { className: 'otd-text-muted', style: { fontWeight: 'normal' }, children: '(optional)' })] }),
                                        (0, S.jsx)('input', { id: 'box-customer-email', className: 'otd-input', type: 'email', name: 'customerEmail', maxLength: 254, placeholder: 'e.g. jane@example.com', autoComplete: 'email', value: d, onChange: (D) => v(D.target.value) }),
                                      ],
                                    }),
                                    (0, S.jsx)('button', { id: 'box-checkout-btn', className: 'otd-btn otd-btn-primary otd-mt-3', type: 'button', style: { width: '100%' }, disabled: !eo || G, onClick: rr, children: G ? 'Processing...' : mr() }),
                                    N && (0, S.jsx)('div', { id: 'box-order-error', className: 'otd-alert otd-alert-error otd-mt-2', children: N }),
                                    G && (0, S.jsxs)('div', { id: 'box-order-loading', className: 'otd-text-center otd-mt-3', children: [(0, S.jsx)('div', { className: 'otd-spinner' }), (0, S.jsx)('p', { className: 'otd-mt-1 otd-text-muted', children: 'Redirecting to payment...' })] }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    })
                  : (0, S.jsxs)('div', { className: 'otd-text-center otd-py-5', children: [(0, S.jsx)('h3', { className: 'otd-text-muted', children: 'No bundles available right now.' }), (0, S.jsx)('p', { className: 'otd-text-muted', children: 'Check back soon.' })] })
                : (0, S.jsx)('div', { className: 'otd-alert otd-alert-warning', children: 'Sorry \u2014 online ordering is currently turned off. Please visit the flea market to place your order.' }),
              (0, S.jsx)('div', { className: 'otd-mt-4', children: (0, S.jsx)('a', { className: 'otd-text-muted', href: '/shop', children: '\u2190 Back to storefront' }) }),
            ],
          }),
        });
  }
  var ur = Sy;
  var nr = $(il()),
    M = $(yt());
  function Ny() {
    return (
      (0, nr.useEffect)(() => {
        document.title = 'About Us \u2014 Outta Town Donuts';
      }, []),
      (0, M.jsxs)(M.Fragment, {
        children: [
          (0, M.jsxs)('div', {
            className: 'otd-about-intro',
            children: [
              (0, M.jsx)('h1', { children: 'About Us' }),
              (0, M.jsx)('hr', { className: 'otd-divider' }),
              (0, M.jsx)('p', { children: 'Outta Town Donuts is a small, independent donut operation based in Woodbury, Tennessee. Every donut is hand-shaped, individually weighed, and made fresh each morning using high-quality, locally sourced ingredients whenever possible.' }),
            ],
          }),
          (0, M.jsx)('div', {
            className: 'otd-section otd-section-alt',
            children: (0, M.jsxs)('div', {
              className: 'container',
              children: [
                (0, M.jsxs)('div', { className: 'otd-section-header', children: [(0, M.jsx)('h2', { children: 'Our Story' }), (0, M.jsx)('hr', { className: 'otd-divider' })] }),
                (0, M.jsx)('div', {
                  className: 'row',
                  children: (0, M.jsxs)('div', {
                    className: 'col-lg-8 mx-auto',
                    children: [
                      (0, M.jsx)('p', {
                        style: { color: 'var(--otd-cream-dark)', lineHeight: 1.8, fontSize: '1.05rem' },
                        children: 'We started making donuts the way most good things start \u2014 by just doing it. No business plan written in a co-working space. No branding agency. Just a kitchen, some flour, and the belief that you can still make something real without asking permission.',
                      }),
                      (0, M.jsx)('p', {
                        style: { color: 'var(--otd-cream-dark)', lineHeight: 1.8, fontSize: '1.05rem' },
                        children:
                          'Every morning, we weigh, shape, and finish each donut by hand. No molds, no stamping machines, no mass production. The result is something slightly imperfect and entirely intentional. Each one weighing between 70 and 80 grams \u2014 enough structure to do it right, enough freedom to keep it real.',
                      }),
                      (0, M.jsx)('p', {
                        style: { color: 'var(--otd-cream-dark)', lineHeight: 1.8, fontSize: '1.05rem' },
                        children: 'We sell directly through our local flea market booth in Woodbury, packaging each order by hand. What you\u2019re buying hasn\u2019t traveled far, and it hasn\u2019t been abstracted into a system you can\u2019t see.',
                      }),
                    ],
                  }),
                }),
              ],
            }),
          }),
          (0, M.jsx)('div', {
            className: 'otd-section',
            children: (0, M.jsx)('div', {
              className: 'container',
              children: (0, M.jsx)('div', { className: 'col-lg-8 mx-auto', children: (0, M.jsx)('div', { className: 'otd-quote', children: 'We make donuts by hand every morning. No molds. No shortcuts. Just enough structure to do it right, and enough freedom to keep it real.' }) }),
            }),
          }),
          (0, M.jsx)('div', {
            className: 'otd-section otd-section-alt',
            children: (0, M.jsxs)('div', {
              className: 'container',
              children: [
                (0, M.jsxs)('div', { className: 'otd-section-header', children: [(0, M.jsx)('h2', { children: 'What We Stand For' }), (0, M.jsx)('hr', { className: 'otd-divider' })] }),
                (0, M.jsxs)('div', {
                  className: 'otd-values',
                  children: [
                    (0, M.jsxs)('div', {
                      className: 'otd-value-item',
                      children: [(0, M.jsx)('h3', { children: 'Handcrafted' }), (0, M.jsx)('p', { children: 'Individually shaped, not stamped. Every donut shows the hand that made it. Visible human variation isn\u2019t a flaw \u2014 it\u2019s the whole point.' })],
                    }),
                    (0, M.jsxs)('div', {
                      className: 'otd-value-item',
                      children: [(0, M.jsx)('h3', { children: 'Local' }), (0, M.jsx)('p', { children: 'Ingredients sourced locally when possible. Made in a cottage kitchen. Sold face-to-face at the booth. No abstraction layer between us and you.' })],
                    }),
                    (0, M.jsxs)('div', { className: 'otd-value-item', children: [(0, M.jsx)('h3', { children: 'Honest' }), (0, M.jsx)('p', { children: 'We show our real process, in our real workspace. Nothing staged, nothing polished beyond what it actually is.' })] }),
                    (0, M.jsxs)('div', {
                      className: 'otd-value-item',
                      children: [
                        (0, M.jsx)('h3', { children: 'Independent' }),
                        (0, M.jsx)('p', { children: 'This isn\u2019t a franchise. It\u2019s not optimized for scale. It\u2019s a quiet proof that alternatives work \u2014 that you can still make things locally, by people who are actually there.' }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
          (0, M.jsx)('div', {
            className: 'otd-section',
            children: (0, M.jsx)('div', {
              className: 'container',
              children: (0, M.jsxs)('div', {
                className: 'col-lg-8 mx-auto otd-text-center',
                children: [
                  (0, M.jsx)('h2', { children: 'Part of Something Bigger' }),
                  (0, M.jsx)('hr', { className: 'otd-divider' }),
                  (0, M.jsx)('p', {
                    style: { color: 'var(--otd-cream-dark)', lineHeight: 1.8, fontSize: '1.05rem', maxWidth: 600, margin: '0 auto' },
                    children:
                      'Outta Town Donuts is part of New Weird America, a broader effort to build practical, sustainable systems at the community level. This isn\u2019t just about donuts \u2014 it\u2019s about showing what\u2019s possible when things are made locally, by people who choose to participate instead of outsource.',
                  }),
                  (0, M.jsx)('p', { className: 'otd-mt-2', style: { color: 'var(--otd-text-muted)', fontStyle: 'italic' }, children: 'It\u2019s not a protest. It\u2019s just proof.' }),
                ],
              }),
            }),
          }),
          (0, M.jsx)('div', {
            className: 'otd-section otd-section-alt',
            children: (0, M.jsxs)('div', {
              className: 'container otd-text-center',
              children: [
                (0, M.jsx)('h2', { children: 'Ready to Try?' }),
                (0, M.jsx)('hr', { className: 'otd-divider' }),
                (0, M.jsx)('p', { className: 'otd-text-muted', style: { maxWidth: 400, margin: '0 auto 1.5rem' }, children: 'Available until sold out. Made fresh every morning.' }),
                (0, M.jsx)('a', { className: 'otd-btn otd-btn-primary otd-btn-large', href: '/shop/pickup', children: 'Order for Pickup' }),
              ],
            }),
          }),
        ],
      })
    );
  }
  var ir = Ny;
  var kt = $(il()),
    K = $(yt());
  function zy() {
    let [t, l] = (0, kt.useState)(''),
      [a, e] = (0, kt.useState)(''),
      [u, n] = (0, kt.useState)(''),
      [i, c] = (0, kt.useState)(!1),
      [f, m] = (0, kt.useState)(!1),
      [h, y] = (0, kt.useState)([]),
      d = (0, kt.useRef)(null),
      v = (0, kt.useRef)(null),
      N = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      E = document.querySelector('meta[name="recaptcha-sitekey"]')?.getAttribute('content') || '',
      G = document.querySelector('meta[name="is-known-user"]')?.getAttribute('content') === 'true';
    ((0, kt.useEffect)(() => {
      document.title = 'Contact \u2014 Outta Town Donuts';
    }, []),
      (0, kt.useEffect)(() => {
        if (!E || !d.current) return;
        let o = () => {
            if (d.current && v.current === null)
              try {
                v.current = grecaptcha.enterprise.render(d.current, { sitekey: E, theme: 'dark' });
              } catch {}
          },
          r = () => {
            typeof grecaptcha < 'u' && grecaptcha.enterprise && grecaptcha.enterprise.ready(o);
          };
        if (typeof grecaptcha < 'u' && grecaptcha.enterprise) r();
        else {
          let g = 'https://www.google.com/recaptcha/enterprise.js?render=explicit';
          if (document.querySelector(`script[src="${g}"]`)) document.querySelector(`script[src="${g}"]`).addEventListener('load', r, { once: !0 });
          else {
            let z = document.createElement('script');
            ((z.src = g), (z.async = !0), (z.onload = r), document.head.appendChild(z));
          }
        }
      }, [E]));
    async function s(o) {
      if ((o.preventDefault(), E && v.current !== null && !grecaptcha.enterprise.getResponse(v.current))) {
        y([{ msg: 'Please check the reCAPTCHA box before submitting.' }]);
        return;
      }
      (y([]), c(!0));
      let r = { message: u };
      G || ((r.name = t), (r.email = a));
      try {
        let g = await fetch('/shop/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': N }, body: JSON.stringify(r) }),
          z = await g.json();
        g.ok ? (m(!0), l(''), e(''), n(''), v.current !== null && grecaptcha.enterprise.reset(v.current)) : (y(z.errors || [{ msg: 'An error occurred. Please try again.' }]), v.current !== null && grecaptcha.enterprise.reset(v.current));
      } catch {
        y([{ msg: 'An error occurred. Please try again.' }]);
      } finally {
        c(!1);
      }
    }
    return (0, K.jsx)('div', {
      className: 'otd-section',
      children: (0, K.jsx)('div', {
        className: 'container',
        children: (0, K.jsxs)('div', {
          className: 'otd-contact',
          children: [
            (0, K.jsx)('h1', { children: 'Contact Us' }),
            (0, K.jsx)('p', { children: 'Got a question, special request, or just want to say hey? We\u2019d love to hear from you.' }),
            (0, K.jsx)('hr', { className: 'otd-divider' }),
            f && (0, K.jsx)('div', { className: 'otd-alert otd-alert-success', children: 'Your message has been sent. Thank you!' }),
            h.length > 0 && (0, K.jsx)('div', { className: 'otd-alert otd-alert-error', children: h.map((o, r) => (0, K.jsx)('div', { children: o.msg }, r)) }),
            (0, K.jsxs)('form', {
              id: 'contactForm',
              onSubmit: s,
              children: [
                !G &&
                  (0, K.jsxs)(K.Fragment, {
                    children: [
                      (0, K.jsxs)('div', {
                        className: 'otd-form-group',
                        children: [
                          (0, K.jsx)('label', { className: 'otd-label', htmlFor: 'name', children: 'Name' }),
                          (0, K.jsx)('input', { id: 'name', className: 'otd-input', type: 'text', name: 'name', autoComplete: 'name', required: !0, placeholder: 'Your name', value: t, onChange: (o) => l(o.target.value) }),
                        ],
                      }),
                      (0, K.jsxs)('div', {
                        className: 'otd-form-group',
                        children: [
                          (0, K.jsx)('label', { className: 'otd-label', htmlFor: 'email', children: 'Email' }),
                          (0, K.jsx)('input', { id: 'email', className: 'otd-input', type: 'email', name: 'email', autoComplete: 'email', required: !0, placeholder: 'your@email.com', value: a, onChange: (o) => e(o.target.value) }),
                        ],
                      }),
                    ],
                  }),
                (0, K.jsxs)('div', {
                  className: 'otd-form-group',
                  children: [
                    (0, K.jsx)('label', { className: 'otd-label', htmlFor: 'message', children: 'Message' }),
                    (0, K.jsx)('textarea', { id: 'message', className: 'otd-textarea', name: 'message', rows: 6, required: !0, placeholder: 'What\u2019s on your mind?', value: u, onChange: (o) => n(o.target.value) }),
                  ],
                }),
                E && (0, K.jsx)('div', { className: 'otd-form-group', children: (0, K.jsx)('div', { ref: d }) }),
                (0, K.jsx)('div', { className: 'otd-form-group', children: (0, K.jsx)('button', { className: 'otd-btn otd-btn-primary', type: 'submit', disabled: i, children: i ? 'Sending...' : 'Send Message' }) }),
              ],
            }),
            (0, K.jsxs)('div', {
              className: 'otd-mt-4',
              style: { borderTop: '1px solid var(--otd-border)', paddingTop: '1.5rem' },
              children: [
                (0, K.jsx)('h3', { style: { fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.03em' }, children: 'Find Us' }),
                (0, K.jsx)('p', { className: 'otd-text-muted', children: 'We sell our donuts at the flea market in Woodbury, Tennessee. Swing by and grab some fresh.' }),
              ],
            }),
          ],
        }),
      }),
    });
  }
  var cr = zy;
  var ra = $(il()),
    A = $(yt());
  function mi(t) {
    if (t == null || isNaN(t)) return '$0.00';
    let l = t.toFixed(3);
    return `$${l.endsWith('0') ? t.toFixed(2) : l}`;
  }
  function Ty() {
    let [t, l] = (0, ra.useState)(null),
      [a, e] = (0, ra.useState)(!0),
      [u, n] = (0, ra.useState)(''),
      i = (0, ra.useRef)(null),
      c = new URLSearchParams(window.location.search),
      f = c.get('orderId'),
      m = c.get('session_id');
    if (
      ((0, ra.useEffect)(() => {
        if (((document.title = 'Order Confirmation \u2014 Outta Town Donuts'), !f)) {
          window.location.href = '/shop';
          return;
        }
        let y = `/shop/api/order-status?orderId=${encodeURIComponent(f)}${m ? `&session_id=${encodeURIComponent(m)}` : ''}`;
        return (
          fetch(y)
            .then((d) => {
              if (!d.ok) throw new Error('Order not found');
              return d.json();
            })
            .then((d) => {
              (l(d.order), e(!1), d.order && d.order.status === 'pending' && (i.current = setTimeout(() => window.location.reload(), 5e3)));
            })
            .catch((d) => {
              (n(d.message), e(!1));
            }),
          () => {
            i.current && clearTimeout(i.current);
          }
        );
      }, []),
      a)
    )
      return (0, A.jsx)('div', { className: 'otd-section', children: (0, A.jsx)('div', { className: 'container otd-text-center otd-py-5', children: (0, A.jsx)('div', { className: 'otd-spinner' }) }) });
    if (u || !t)
      return (0, A.jsx)('div', {
        className: 'otd-section',
        children: (0, A.jsx)('div', {
          className: 'container',
          children: (0, A.jsxs)('div', {
            className: 'otd-confirmation',
            children: [
              (0, A.jsx)('h1', { children: 'Order Not Found' }),
              (0, A.jsx)('p', { className: 'otd-text-muted', children: 'We couldn\u2019t find this order.' }),
              (0, A.jsx)('div', { className: 'otd-mt-4', children: (0, A.jsx)('a', { className: 'otd-btn otd-btn-outline', href: '/shop', children: 'Back to Storefront' }) }),
            ],
          }),
        }),
      });
    function h() {
      return t.status === 'completed' && t.paymentStatus === 'paid'
        ? (0, A.jsxs)(A.Fragment, {
            children: [
              (0, A.jsx)('h1', { className: 'otd-text-success', children: '\u2713 Order Confirmed' }),
              t.pickupName ? (0, A.jsxs)('p', { className: 'otd-text-muted', children: ['Thank you, ', t.pickupName, '. Your order has been placed.'] }) : (0, A.jsx)('p', { className: 'otd-text-muted', children: 'Thank you. Your order has been placed.' }),
              t.confirmationNumber &&
                (0, A.jsxs)('div', {
                  style: { background: 'var(--otd-surface, #f8f8f8)', border: '1px solid var(--otd-border)', borderRadius: '0.5rem', padding: '1rem 1.5rem', margin: '1rem 0', textAlign: 'center' },
                  children: [
                    (0, A.jsx)('div', { className: 'otd-text-muted', style: { fontSize: '0.85rem', marginBottom: '0.25rem' }, children: 'Confirmation Number' }),
                    (0, A.jsx)('div', { style: { fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '0.05em' }, children: t.confirmationNumber }),
                    (0, A.jsxs)('div', { className: 'otd-text-muted', style: { fontSize: '0.8rem', marginTop: '0.5rem' }, children: ['Save this number to check your order status at ', (0, A.jsx)('a', { href: '/shop/order-lookup', children: '/shop/order-lookup' })] }),
                  ],
                }),
            ],
          })
        : t.status === 'pending'
          ? (0, A.jsxs)(A.Fragment, { children: [(0, A.jsx)('h1', { className: 'otd-text-warning', children: '\u231B Processing Payment' }), (0, A.jsx)('p', { className: 'otd-text-muted', children: 'Your payment is being verified. This page will update shortly.' })] })
          : t.status === 'cancelled'
            ? (0, A.jsxs)(A.Fragment, { children: [(0, A.jsx)('h1', { className: 'otd-text-danger', children: 'Order Cancelled' }), (0, A.jsx)('p', { className: 'otd-text-muted', children: 'This order was cancelled.' })] })
            : (0, A.jsxs)('h1', { children: ['Order Status: ', t.status] });
    }
    return (0, A.jsx)('div', {
      className: 'otd-section',
      children: (0, A.jsx)('div', {
        className: 'container',
        children: (0, A.jsxs)('div', {
          className: 'otd-confirmation',
          children: [
            h(),
            (0, A.jsxs)('div', {
              className: 'otd-confirmation-card',
              children: [
                (0, A.jsx)('h3', { className: 'otd-mb-2', children: 'Order Details' }),
                t.pickupName && (0, A.jsxs)('p', { className: 'otd-mb-2', children: [(0, A.jsx)('strong', { children: 'Pickup name:\xA0' }), (0, A.jsx)('span', { children: t.pickupName })] }),
                (0, A.jsxs)('table', {
                  className: 'otd-table',
                  children: [
                    (0, A.jsx)('thead', { children: (0, A.jsxs)('tr', { children: [(0, A.jsx)('th', { children: 'Item' }), (0, A.jsx)('th', { className: 'text-center', children: 'Qty' }), (0, A.jsx)('th', { className: 'text-end', children: 'Price' })] }) }),
                    (0, A.jsx)('tbody', {
                      children: (t.items || []).map((y, d) =>
                        (0, A.jsxs)('tr', { children: [(0, A.jsx)('td', { children: y.nameSnapshot }), (0, A.jsx)('td', { className: 'text-center', children: y.quantity }), (0, A.jsx)('td', { className: 'text-end', children: mi(y.priceSnapshot * y.quantity) })] }, d),
                      ),
                    }),
                    (0, A.jsxs)('tfoot', {
                      children: [
                        t.subtotal != null && (0, A.jsxs)('tr', { children: [(0, A.jsx)('td', { className: 'text-end', colSpan: 2, children: 'Subtotal' }), (0, A.jsx)('td', { className: 'text-end', children: mi(t.subtotal) })] }),
                        t.tax != null && t.tax > 0 && (0, A.jsxs)('tr', { children: [(0, A.jsx)('td', { className: 'text-end', colSpan: 2, children: 'Tax' }), (0, A.jsx)('td', { className: 'text-end', children: mi(t.tax) })] }),
                        t.total != null && (0, A.jsxs)('tr', { children: [(0, A.jsx)('td', { className: 'text-end', colSpan: 2, children: 'Total' }), (0, A.jsx)('td', { className: 'text-end', children: mi(t.total) })] }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, A.jsxs)('div', {
              className: 'otd-mt-4',
              children: [(0, A.jsx)('a', { className: 'otd-btn otd-btn-outline', href: '/shop', children: 'Back to Storefront' }), (0, A.jsx)('a', { className: 'otd-btn otd-btn-outline otd-ml-2', href: '/shop/order-lookup', style: { marginLeft: '0.75rem' }, children: 'Check Order Status' })],
            }),
          ],
        }),
      }),
    });
  }
  var fr = Ty;
  var Ba = $(il()),
    C = $(yt());
  function ri(t) {
    if (t == null || isNaN(t)) return '$0.00';
    let l = t.toFixed(3);
    return `$${l.endsWith('0') ? t.toFixed(2) : l}`;
  }
  function Ey(t) {
    switch (t) {
      case 'completed':
        return 'Confirmed \u2014 Ready for Pickup';
      case 'pending':
        return 'Processing';
      case 'filled':
        return 'Filled';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return t || 'Unknown';
    }
  }
  function Ay(t) {
    return t === 'completed' || t === 'filled' || t === 'delivered' ? 'otd-text-success' : t === 'cancelled' ? 'otd-text-danger' : 'otd-text-warning';
  }
  function Oy() {
    let [t, l] = (0, Ba.useState)(''),
      [a, e] = (0, Ba.useState)(null),
      [u, n] = (0, Ba.useState)(!1),
      [i, c] = (0, Ba.useState)('');
    async function f(h) {
      let y = h.toUpperCase().trim();
      if (y) {
        (c(''), e(null), n(!0));
        try {
          let d = await fetch(`/shop/api/order-lookup?confirmationNumber=${encodeURIComponent(y)}`);
          if (d.status === 404) {
            c('No order found with that confirmation number.');
            return;
          }
          if (!d.ok) throw new Error('Lookup failed. Please try again.');
          let v = await d.json();
          e(v.order);
        } catch (d) {
          c(d.message);
        } finally {
          n(!1);
        }
      }
    }
    (0, Ba.useEffect)(() => {
      document.title = 'Order Status \u2014 Outta Town Donuts';
      let y = new URLSearchParams(window.location.search).get('confirmationNumber');
      if (y) {
        let d = y.toUpperCase().trim();
        (l(d), f(d));
      }
    }, []);
    async function m(h) {
      (h.preventDefault(), f(t));
    }
    return (0, C.jsx)('div', {
      className: 'otd-section',
      children: (0, C.jsx)('div', {
        className: 'container',
        children: (0, C.jsxs)('div', {
          className: 'otd-confirmation',
          children: [
            (0, C.jsx)('h1', { children: 'Check Order Status' }),
            (0, C.jsx)('p', { className: 'otd-text-muted', children: 'Enter the confirmation number from your receipt or confirmation page.' }),
            (0, C.jsxs)('form', {
              onSubmit: m,
              className: 'otd-mt-3',
              children: [
                (0, C.jsxs)('div', {
                  className: 'otd-mb-3',
                  children: [
                    (0, C.jsx)('label', { className: 'otd-label', htmlFor: 'conf-number', children: 'Confirmation Number' }),
                    (0, C.jsx)('input', { id: 'conf-number', className: 'otd-input', type: 'text', placeholder: 'OTD-XXXXXX', value: t, maxLength: 12, autoComplete: 'off', spellCheck: !1, onChange: (h) => l(h.target.value.toUpperCase()) }),
                  ],
                }),
                (0, C.jsx)('button', { className: 'otd-btn otd-btn-primary', type: 'submit', disabled: u, children: u ? 'Looking up\u2026' : 'Look Up Order' }),
              ],
            }),
            i && (0, C.jsx)('div', { className: 'otd-alert otd-alert-error otd-mt-3', children: i }),
            a &&
              (0, C.jsxs)('div', {
                className: 'otd-confirmation-card otd-mt-4',
                children: [
                  (0, C.jsxs)('div', {
                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' },
                    children: [
                      (0, C.jsxs)('div', {
                        children: [(0, C.jsx)('div', { className: 'otd-text-muted', style: { fontSize: '0.85rem' }, children: 'Confirmation Number' }), (0, C.jsx)('div', { style: { fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '0.04em' }, children: a.confirmationNumber })],
                      }),
                      (0, C.jsxs)('div', {
                        style: { textAlign: 'right' },
                        children: [(0, C.jsx)('div', { className: 'otd-text-muted', style: { fontSize: '0.85rem' }, children: 'Status' }), (0, C.jsx)('div', { className: `${Ay(a.status)}`, style: { fontWeight: 'bold', fontSize: '1rem' }, children: Ey(a.status) })],
                      }),
                    ],
                  }),
                  a.pickupName && (0, C.jsxs)('p', { className: 'otd-mb-2', children: [(0, C.jsx)('strong', { children: 'Pickup name:\xA0' }), a.pickupName] }),
                  (0, C.jsxs)('table', {
                    className: 'otd-table',
                    children: [
                      (0, C.jsx)('thead', { children: (0, C.jsxs)('tr', { children: [(0, C.jsx)('th', { children: 'Item' }), (0, C.jsx)('th', { className: 'text-center', children: 'Qty' }), (0, C.jsx)('th', { className: 'text-end', children: 'Price' })] }) }),
                      (0, C.jsx)('tbody', {
                        children: (a.items || []).map((h, y) =>
                          (0, C.jsxs)('tr', { children: [(0, C.jsx)('td', { children: h.nameSnapshot }), (0, C.jsx)('td', { className: 'text-center', children: h.quantity }), (0, C.jsx)('td', { className: 'text-end', children: ri((h.priceSnapshot || 0) * h.quantity) })] }, y),
                        ),
                      }),
                      (0, C.jsxs)('tfoot', {
                        children: [
                          a.subtotal != null && (0, C.jsxs)('tr', { children: [(0, C.jsx)('td', { className: 'text-end', colSpan: 2, children: 'Subtotal' }), (0, C.jsx)('td', { className: 'text-end', children: ri(a.subtotal) })] }),
                          a.tax != null && a.tax > 0 && (0, C.jsxs)('tr', { children: [(0, C.jsx)('td', { className: 'text-end', colSpan: 2, children: 'Tax' }), (0, C.jsx)('td', { className: 'text-end', children: ri(a.tax) })] }),
                          a.total != null && (0, C.jsxs)('tr', { children: [(0, C.jsx)('td', { className: 'text-end', colSpan: 2, children: (0, C.jsx)('strong', { children: 'Total' }) }), (0, C.jsx)('td', { className: 'text-end', children: (0, C.jsx)('strong', { children: ri(a.total) }) })] }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            (0, C.jsx)('div', { className: 'otd-mt-4', children: (0, C.jsx)('a', { className: 'otd-text-muted', href: '/shop', children: '\u2190 Back to Storefront' }) }),
          ],
        }),
      }),
    });
  }
  var or = Oy;
  var vi = $(yt());
  function _y(t) {
    let l = t.replace(/\/$/, '');
    return l === '/shop' || l === '' ? ao : l === '/shop/pickup' ? er : l === '/shop/bundles' ? ur : l === '/shop/about' ? ir : l === '/shop/contact' ? cr : l === '/shop/confirmation' ? fr : l === '/shop/order-lookup' ? or : ao;
  }
  function My() {
    let t = _y(window.location.pathname);
    return (0, vi.jsx)(lr, { children: (0, vi.jsx)(t, {}) });
  }
  var Dy = (0, sr.createRoot)(document.getElementById('commerce-root'));
  Dy.render((0, vi.jsx)(My, {}));
})();
/*! Bundled license information:

scheduler/cjs/scheduler.production.js:
  (**
   * @license React
   * scheduler.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.js:
  (**
   * @license React
   * react-dom.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom-client.production.js:
  (**
   * @license React
   * react-dom-client.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.js:
  (**
   * @license React
   * react-jsx-runtime.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=commerce.js.map
