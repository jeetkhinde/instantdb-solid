var Q = Object.defineProperty;
var X = (n, e, t) => e in n ? Q(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var g = (n, e, t) => X(n, typeof e != "symbol" ? e + "" : e, t);
import { coerceQuery as Y, weakHash as q, txInit as W, init as Z } from "@instantdb/core";
import { i as qe, id as We, lookup as Ze, tx as Je } from "@instantdb/core";
import { onCleanup as P, createEffect as E, createSignal as C, splitProps as J, createMemo as L, sharedConfig as m, untrack as F, createRenderEffect as S, Show as v } from "solid-js";
function ee() {
  let n = null;
  const e = (i, o) => {
    clearTimeout(n), n = setTimeout(o, i);
  }, t = () => {
    clearTimeout(n);
  };
  return P(() => t()), { set: e, clear: t };
}
const te = 1e3;
function ne(n, e, t) {
  E(() => {
    const i = n._core._reactor.subscribeTopic(
      n.id,
      e,
      (o, s) => {
        t(o, s);
      }
    );
    P(i);
  });
}
function ie(n, e) {
  return E(() => n._core._reactor.joinRoom(n.id)), (t) => {
    n._core._reactor.publishTopic({
      roomType: n.type,
      roomId: n.id,
      topic: e,
      data: t
    });
  };
}
function z(n, e = {}) {
  const [t, i] = C(
    n._core._reactor.getPresence(n.type, n.id, e) ?? {
      peers: {},
      isLoading: !0
    }
  );
  E(() => {
    const s = n._core._reactor.subscribePresence(
      n.type,
      n.id,
      e,
      (r) => {
        i(r);
      }
    );
    P(s);
  });
  const o = (s) => {
    n._core._reactor.publishPresence(n.type, n.id, s);
  };
  return {
    ...t(),
    publishPresence: o
  };
}
function se(n, e, t = []) {
  E(() => n._core._reactor.joinRoom(n.id)), E(() => {
    n._core._reactor.publishPresence(n.type, n.id, e);
  }, t);
}
function ce(n, e, t = {}) {
  const i = ee();
  z(n, {
    keys: [e]
  });
  const o = () => {
    const a = n._core._reactor.getPresence(
      n.type,
      n.id
    );
    return t != null && t.writeOnly ? [] : Object.values((a == null ? void 0 : a.peers) ?? {}).filter(
      (f) => f[e] === !0
    );
  }, s = (a) => {
    n._core._reactor.publishPresence(n.type, n.id, {
      [e]: a
    }), a && ((t == null ? void 0 : t.timeout) === null || (t == null ? void 0 : t.timeout) === 0 || i.set((t == null ? void 0 : t.timeout) ?? te, () => {
      n._core._reactor.publishPresence(n.type, n.id, {
        [e]: null
      });
    }));
  }, l = {
    onKeyDown: (a) => {
      const y = !((t == null ? void 0 : t.stopOnEnter) && a.key === "Enter");
      s(y);
    },
    onBlur: () => {
      s(!1);
    }
  };
  return {
    active: o(),
    setActive: s,
    inputProps: l
  };
}
const A = {
  createTopicEffect: ne,
  createPublishTopic: ie,
  createPresence: z,
  createSyncPresence: se,
  createTypingIndicator: ce
};
class oe {
  constructor(e, t, i) {
    g(this, "_core");
    g(this, "type");
    g(this, "id");
    this._core = e, this.type = t, this.id = i;
  }
  createTopicEffect(e, t) {
    A.createTopicEffect(this, e, t);
  }
  createPublishTopic(e) {
    return A.createPublishTopic(this, e);
  }
  createPresence(e = {}) {
    return A.createPresence(this, e);
  }
  createSyncPresence(e, t = []) {
    return A.createSyncPresence(this, e, t);
  }
  createTypingIndicator(e, t = {}) {
    return A.createTypingIndicator(this, e, t);
  }
}
function re(n) {
  return {
    isLoading: !n,
    data: void 0,
    pageInfo: void 0,
    error: void 0,
    ...n || {}
  };
}
function le(n, e, t) {
  e && t && "ruleParams" in t && (e = { $$ruleParams: t.ruleParams, ...e });
  const i = e ? Y(e) : null;
  q(i);
  const [o, s] = C(
    re(n._reactor.getPreviousResult(i))
  );
  return E(() => {
    if (!i) return;
    const r = n.subscribeQuery(i, (c) => {
      s({
        isLoading: !c,
        data: void 0,
        pageInfo: void 0,
        error: void 0,
        ...c
      });
    });
    P(() => r());
  }), { state: o(), query: i };
}
class R {
  constructor(e, t) {
    g(this, "tx", W());
    g(this, "auth");
    g(this, "storage");
    g(this, "_core");
    g(this, "getLocalId", (e) => this._core.getLocalId(e));
    g(this, "useLocalId", (e) => {
      const [t, i] = C(null);
      return E(() => {
        let o = !0;
        (async () => {
          const r = await this.getLocalId(e);
          o && i(r);
        })(), P(() => o = !1);
      }), t();
    });
    g(this, "rooms", {});
    // Initialize as an empty object or provide the correct implementation
    g(this, "transact", (e) => this._core.transact(e));
    g(this, "useQuery", (e, t) => le(this._core, e, t).state);
    g(this, "useAuth", () => {
      const e = this._core._reactor._currentUserCached, [t, i] = C(e);
      return E(() => {
        const o = this._core.subscribeAuth((s) => {
          i({ isLoading: !1, ...s });
        });
        P(() => o());
      }), t();
    });
    g(this, "useConnectionStatus", () => {
      const e = this._core._reactor.status, [t, i] = C(e);
      return E(() => {
        const o = this._core.subscribeConnectionStatus((s) => {
          s !== e && i(s);
        });
        P(() => o());
      }), t();
    });
    g(this, "queryOnce", (e, t) => this._core.queryOnce(e, t));
    this._core = Z(
      e,
      this.constructor.Storage,
      this.constructor.NetworkListener,
      t
    ), this.auth = this._core.auth, this.storage = this._core.storage;
  }
  room(e = "_defaultRoomType", t = "_defaultRoomId") {
    return new oe(this._core, e, t);
  }
  getAuth() {
    return this._core.getAuth();
  }
}
g(R, "Storage"), g(R, "NetworkListener");
class ae extends R {
}
const fe = "v1.0.0";
function Ve(n) {
  return new ae(n, {
    "@jeetkhinde/instantdb-solid": fe
  });
}
const ue = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected"
], de = /* @__PURE__ */ new Set([
  "className",
  "value",
  "readOnly",
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  ...ue
]), he = /* @__PURE__ */ new Set([
  "innerHTML",
  "textContent",
  "innerText",
  "children"
]), ge = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  className: "class",
  htmlFor: "for"
}), ye = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  class: "className",
  formnovalidate: {
    $: "formNoValidate",
    BUTTON: 1,
    INPUT: 1
  },
  ismap: {
    $: "isMap",
    IMG: 1
  },
  nomodule: {
    $: "noModule",
    SCRIPT: 1
  },
  playsinline: {
    $: "playsInline",
    VIDEO: 1
  },
  readonly: {
    $: "readOnly",
    INPUT: 1,
    TEXTAREA: 1
  }
});
function me(n, e) {
  const t = ye[n];
  return typeof t == "object" ? t[e] ? t.$ : void 0 : t;
}
const be = /* @__PURE__ */ new Set([
  "beforeinput",
  "click",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "touchend",
  "touchmove",
  "touchstart"
]), we = /* @__PURE__ */ new Set([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animate",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "color-profile",
  "cursor",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "font",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignObject",
  "g",
  "glyph",
  "glyphRef",
  "hkern",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "missing-glyph",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "svg",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tref",
  "tspan",
  "use",
  "view",
  "vkern"
]), Ee = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};
function Pe(n, e, t) {
  let i = t.length, o = e.length, s = i, r = 0, c = 0, l = e[o - 1].nextSibling, a = null;
  for (; r < o || c < s; ) {
    if (e[r] === t[c]) {
      r++, c++;
      continue;
    }
    for (; e[o - 1] === t[s - 1]; )
      o--, s--;
    if (o === r) {
      const f = s < i ? c ? t[c - 1].nextSibling : t[s - c] : l;
      for (; c < s; ) n.insertBefore(t[c++], f);
    } else if (s === c)
      for (; r < o; )
        (!a || !a.has(e[r])) && e[r].remove(), r++;
    else if (e[r] === t[s - 1] && t[c] === e[o - 1]) {
      const f = e[--o].nextSibling;
      n.insertBefore(t[c++], e[r++].nextSibling), n.insertBefore(t[--s], f), e[o] = t[s];
    } else {
      if (!a) {
        a = /* @__PURE__ */ new Map();
        let y = c;
        for (; y < s; ) a.set(t[y], y++);
      }
      const f = a.get(e[r]);
      if (f != null)
        if (c < f && f < s) {
          let y = r, d = 1, b;
          for (; ++y < o && y < s && !((b = a.get(e[y])) == null || b !== f + d); )
            d++;
          if (d > f - c) {
            const _ = e[r];
            for (; c < f; ) n.insertBefore(t[c++], _);
          } else n.replaceChild(t[c++], e[r++]);
        } else r++;
      else e[r++].remove();
    }
  }
}
const M = "_$DX_DELEGATE";
function Te(n, e = window.document) {
  const t = e[M] || (e[M] = /* @__PURE__ */ new Set());
  for (let i = 0, o = n.length; i < o; i++) {
    const s = n[i];
    t.has(s) || (t.add(s), e.addEventListener(s, Ne));
  }
}
function k(n, e, t) {
  T(n) || (t == null ? n.removeAttribute(e) : n.setAttribute(e, t));
}
function _e(n, e, t, i) {
  T(n) || (i == null ? n.removeAttributeNS(e, t) : n.setAttributeNS(e, t, i));
}
function Ae(n, e, t) {
  T(n) || (t ? n.setAttribute(e, "") : n.removeAttribute(e));
}
function Ce(n, e) {
  T(n) || (e == null ? n.removeAttribute("class") : n.className = e);
}
function Se(n, e, t, i) {
  if (i)
    Array.isArray(t) ? (n[`$$${e}`] = t[0], n[`$$${e}Data`] = t[1]) : n[`$$${e}`] = t;
  else if (Array.isArray(t)) {
    const o = t[0];
    n.addEventListener(e, t[0] = (s) => o.call(n, t[1], s));
  } else n.addEventListener(e, t, typeof t != "function" && t);
}
function xe(n, e, t = {}) {
  const i = Object.keys(e || {}), o = Object.keys(t);
  let s, r;
  for (s = 0, r = o.length; s < r; s++) {
    const c = o[s];
    !c || c === "undefined" || e[c] || (B(n, c, !1), delete t[c]);
  }
  for (s = 0, r = i.length; s < r; s++) {
    const c = i[s], l = !!e[c];
    !c || c === "undefined" || t[c] === l || !l || (B(n, c, !0), t[c] = l);
  }
  return t;
}
function $e(n, e, t) {
  if (!e) return t ? k(n, "style") : e;
  const i = n.style;
  if (typeof e == "string") return i.cssText = e;
  typeof t == "string" && (i.cssText = t = void 0), t || (t = {}), e || (e = {});
  let o, s;
  for (s in t)
    e[s] == null && i.removeProperty(s), delete t[s];
  for (s in e)
    o = e[s], o !== t[s] && (i.setProperty(s, o), t[s] = o);
  return t;
}
function pe(n, e = {}, t, i) {
  const o = {};
  return S(
    () => o.children = I(n, e.children, o.children)
  ), S(() => typeof e.ref == "function" && Le(e.ref, n)), S(() => Re(n, e, t, !0, o, !0)), o;
}
function Le(n, e, t) {
  return F(() => n(e, t));
}
function Re(n, e, t, i, o = {}, s = !1) {
  e || (e = {});
  for (const r in o)
    if (!(r in e)) {
      if (r === "children") continue;
      o[r] = j(n, r, null, o[r], t, s, e);
    }
  for (const r in e) {
    if (r === "children")
      continue;
    const c = e[r];
    o[r] = j(n, r, c, o[r], t, s, e);
  }
}
function ke(n) {
  let e, t;
  return !T() || !(e = m.registry.get(t = Oe())) ? n() : (m.completed && m.completed.add(e), m.registry.delete(t), e);
}
function T(n) {
  return !!m.context && !m.done && (!n || n.isConnected);
}
function Ie(n) {
  return n.toLowerCase().replace(/-([a-z])/g, (e, t) => t.toUpperCase());
}
function B(n, e, t) {
  const i = e.trim().split(/\s+/);
  for (let o = 0, s = i.length; o < s; o++)
    n.classList.toggle(i[o], t);
}
function j(n, e, t, i, o, s, r) {
  let c, l, a, f, y;
  if (e === "style") return $e(n, t, i);
  if (e === "classList") return xe(n, t, i);
  if (t === i) return i;
  if (e === "ref")
    s || t(n);
  else if (e.slice(0, 3) === "on:") {
    const d = e.slice(3);
    i && n.removeEventListener(d, i, typeof i != "function" && i), t && n.addEventListener(d, t, typeof t != "function" && t);
  } else if (e.slice(0, 10) === "oncapture:") {
    const d = e.slice(10);
    i && n.removeEventListener(d, i, !0), t && n.addEventListener(d, t, !0);
  } else if (e.slice(0, 2) === "on") {
    const d = e.slice(2).toLowerCase(), b = be.has(d);
    if (!b && i) {
      const _ = Array.isArray(i) ? i[0] : i;
      n.removeEventListener(d, _);
    }
    (b || t) && (Se(n, d, t, b), b && Te([d]));
  } else if (e.slice(0, 5) === "attr:")
    k(n, e.slice(5), t);
  else if (e.slice(0, 5) === "bool:")
    Ae(n, e.slice(5), t);
  else if ((y = e.slice(0, 5) === "prop:") || (a = he.has(e)) || !o && ((f = me(e, n.tagName)) || (l = de.has(e))) || (c = n.nodeName.includes("-") || "is" in r)) {
    if (y)
      e = e.slice(5), l = !0;
    else if (T(n)) return t;
    e === "class" || e === "className" ? Ce(n, t) : c && !l && !a ? n[Ie(e)] = t : n[f || e] = t;
  } else {
    const d = o && e.indexOf(":") > -1 && Ee[e.split(":")[0]];
    d ? _e(n, d, e, t) : k(n, ge[e] || e, t);
  }
  return t;
}
function Ne(n) {
  if (m.registry && m.events && m.events.find(([l, a]) => a === n))
    return;
  let e = n.target;
  const t = `$$${n.type}`, i = n.target, o = n.currentTarget, s = (l) => Object.defineProperty(n, "target", {
    configurable: !0,
    value: l
  }), r = () => {
    const l = e[t];
    if (l && !e.disabled) {
      const a = e[`${t}Data`];
      if (a !== void 0 ? l.call(e, a, n) : l.call(e, n), n.cancelBubble) return;
    }
    return e.host && typeof e.host != "string" && !e.host._$host && e.contains(n.target) && s(e.host), !0;
  }, c = () => {
    for (; r() && (e = e._$host || e.parentNode || e.host); ) ;
  };
  if (Object.defineProperty(n, "currentTarget", {
    configurable: !0,
    get() {
      return e || document;
    }
  }), m.registry && !m.done && (m.done = _$HY.done = !0), n.composedPath) {
    const l = n.composedPath();
    s(l[0]);
    for (let a = 0; a < l.length - 2 && (e = l[a], !!r()); a++) {
      if (e._$host) {
        e = e._$host, c();
        break;
      }
      if (e.parentNode === o)
        break;
    }
  } else c();
  s(i);
}
function I(n, e, t, i, o) {
  const s = T(n);
  if (s) {
    !t && (t = [...n.childNodes]);
    let c = [];
    for (let l = 0; l < t.length; l++) {
      const a = t[l];
      a.nodeType === 8 && a.data.slice(0, 2) === "!$" ? a.remove() : c.push(a);
    }
    t = c;
  }
  for (; typeof t == "function"; ) t = t();
  if (e === t) return t;
  const r = typeof e;
  if (n = n, r === "string" || r === "number") {
    if (s || r === "number" && (e = e.toString(), e === t))
      return t;
    t !== "" && typeof t == "string" ? t = n.firstChild.data = e : t = n.textContent = e;
  } else if (e == null || r === "boolean") {
    if (s) return t;
    t = $(n, t, i);
  } else {
    if (r === "function")
      return S(() => {
        let c = e();
        for (; typeof c == "function"; ) c = c();
        t = I(n, c, t, i);
      }), () => t;
    if (Array.isArray(e)) {
      const c = [], l = t && Array.isArray(t);
      if (N(c, e, t, o))
        return S(() => t = I(n, c, t, i, !0)), () => t;
      if (s)
        return c.length ? t = [...n.childNodes] : t;
      c.length === 0 ? t = $(n, t, i) : l ? t.length === 0 ? D(n, c, i) : Pe(n, t, c) : (t && $(n), D(n, c)), t = c;
    } else if (e.nodeType) {
      if (s && e.parentNode) return t = e;
      Array.isArray(t) ? $(n, t, null, e) : t == null || t === "" || !n.firstChild ? n.appendChild(e) : n.replaceChild(e, n.firstChild), t = e;
    }
  }
  return t;
}
function N(n, e, t, i) {
  let o = !1;
  for (let s = 0, r = e.length; s < r; s++) {
    let c = e[s], l = t && t[n.length], a;
    if (!(c == null || c === !0 || c === !1)) if ((a = typeof c) == "object" && c.nodeType)
      n.push(c);
    else if (Array.isArray(c))
      o = N(n, c, l) || o;
    else if (a === "function")
      if (i) {
        for (; typeof c == "function"; ) c = c();
        o = N(
          n,
          Array.isArray(c) ? c : [c],
          Array.isArray(l) ? l : [l]
        ) || o;
      } else
        n.push(c), o = !0;
    else {
      const f = String(c);
      l && l.nodeType === 3 && l.data === f ? n.push(l) : n.push(document.createTextNode(f));
    }
  }
  return o;
}
function D(n, e, t = null) {
  for (let i = 0, o = e.length; i < o; i++) n.insertBefore(e[i], t);
}
function $(n, e, t, i) {
  if (t === void 0) return n.textContent = "";
  const o = i || document.createTextNode("");
  if (e.length) {
    let s = !1;
    for (let r = e.length - 1; r >= 0; r--) {
      const c = e[r];
      if (o !== c) {
        const l = c.parentNode === n;
        !s && !r ? l ? n.replaceChild(o, c) : n.insertBefore(o, t) : l && c.remove();
      } else s = !0;
    }
  } else n.insertBefore(o, t);
  return [o];
}
function Oe() {
  return m.getNextContextId();
}
const Me = "http://www.w3.org/2000/svg";
function Be(n, e = !1) {
  return e ? document.createElementNS(Me, n) : document.createElement(n);
}
function je(n, e) {
  const t = L(n);
  return L(() => {
    const i = t();
    switch (typeof i) {
      case "function":
        return F(() => i(e));
      case "string":
        const o = we.has(i), s = m.context ? ke() : Be(i, o);
        return pe(s, e, o), s;
    }
  });
}
function De(n) {
  const [, e] = J(n, ["component"]);
  return je(() => n.component, e);
}
function Qe({
  as: n = "div",
  spaceId: e,
  room: t,
  className: i,
  style: o,
  userCursorColor: s,
  children: r,
  renderCursor: c,
  propagate: l,
  zIndex: a
}) {
  const f = e || `cursors-space-default--${String(t.type)}-${t.id}`, y = t.createPresence({ keys: [f] }), d = t._core._reactor.getPresence(t.type, t.id);
  function b(u, w) {
    const h = w.clientX, x = w.clientY, p = (h - u.left) / u.width * 100, V = (x - u.top) / u.height * 100;
    y.publishPresence({
      [f]: {
        x: h,
        y: x,
        xPercent: p,
        yPercent: V,
        color: s
      }
    });
  }
  const _ = (u) => {
    if (l || u.stopPropagation(), u.currentTarget instanceof Element) {
      const w = u.currentTarget.getBoundingClientRect();
      b(w, u);
    }
  };
  function O() {
    y.publishPresence({
      [f]: void 0
    });
  }
  const H = (u) => {
    O();
  }, K = (u) => {
    if (u.touches.length !== 1)
      return;
    const w = u.touches[0];
    if (w.target instanceof Element) {
      l || u.stopPropagation();
      const h = w.target.getBoundingClientRect();
      b(h, w);
    }
  }, U = (u) => {
    O();
  };
  return L(
    () => {
      var u;
      return Object.entries(((u = y.state()) == null ? void 0 : u.peers) ?? {});
    }
    // Access reactive state
  ), /* @__PURE__ */ React.createElement(
    De,
    {
      component: n,
      onMouseMove: _,
      onMouseOut: H,
      onTouchMove: K,
      onTouchEnd: U,
      className: i,
      style: {
        position: "relative",
        ...o || {}
      }
    },
    r,
    /* @__PURE__ */ React.createElement(
      "div",
      {
        key: f,
        style: {
          ...G,
          ...Fe,
          "z-index": a !== void 0 ? a : ze
        }
      },
      Object.entries(y.peers).map(([u, w]) => {
        const h = w[f];
        return h ? /* @__PURE__ */ React.createElement(
          "div",
          {
            key: u,
            style: {
              ...G,
              transform: `translate(${(h == null ? void 0 : h.xPercent) ?? 0}%, ${(h == null ? void 0 : h.yPercent) ?? 0}%)`,
              "transform-origin": "0 0",
              transition: "transform 100ms"
            }
          },
          /* @__PURE__ */ React.createElement(
            v,
            {
              when: c,
              fallback: /* @__PURE__ */ React.createElement(Ge, { color: h == null ? void 0 : h.color }),
              children: (x) => {
                const p = d.peers[u];
                return x({
                  color: (h == null ? void 0 : h.color) ?? "",
                  presence: p ?? {}
                });
              }
            }
          )
        ) : null;
      })
    )
  );
}
function Ge(n) {
  const t = () => n.color || "black";
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      style: { height: "35px", width: "35px" },
      viewBox: "0 0 35 35",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg"
    },
    /* @__PURE__ */ React.createElement("g", { fill: "rgba(0,0,0,.2)", transform: "translate(-12 -8.4)" }, /* @__PURE__ */ React.createElement("path", { d: "m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" }), /* @__PURE__ */ React.createElement("path", { d: "m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" })),
    /* @__PURE__ */ React.createElement("g", { fill: "white", transform: "translate(-12 -8.4)" }, /* @__PURE__ */ React.createElement("path", { d: "m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" }), /* @__PURE__ */ React.createElement("path", { d: "m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" })),
    /* @__PURE__ */ React.createElement("g", { fill: t(), transform: "translate(-12 -8.4)" }, /* @__PURE__ */ React.createElement("path", { d: "m19.751 24.4155-1.844.774-3.1-7.374 1.841-.775z" }), /* @__PURE__ */ React.createElement("path", { d: "m13 10.814v11.188l2.969-2.866.428-.139h4.768z" }))
  );
}
const G = {
  position: "absolute",
  top: "0",
  // Use strings for pixel values often
  left: "0",
  bottom: "0",
  right: "0"
}, Fe = {
  overflow: "hidden",
  "pointer-events": "none",
  // Kebab-case is standard for CSS properties
  "user-select": "none"
  // Kebab-case
}, ze = 99999;
export {
  Qe as Cursors,
  R as InstantSolidAbstractDatabase,
  ae as InstantSolidWebDatabase,
  qe as i,
  We as id,
  Ve as init,
  Ze as lookup,
  Je as tx
};
