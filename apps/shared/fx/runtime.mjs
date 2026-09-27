/* eslint-disable */
var be = 9e15,
  ye = 1e9,
  Ze = '0123456789abcdef',
  Te =
    '2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058',
  Re =
    '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789',
  Qe = {
    precision: 20,
    rounding: 4,
    modulo: 1,
    toExpNeg: -7,
    toExpPos: 21,
    minE: -be,
    maxE: be,
    crypto: !1,
  },
  mr,
  fe,
  E = !0,
  je = '[DecimalError] ',
  he = je + 'Invalid argument: ',
  pr = je + 'Precision limit exceeded',
  fr = je + 'crypto unavailable',
  cr = '[object Decimal]',
  G = Math.floor,
  K = Math.pow,
  Tr = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i,
  Rr = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i,
  Er = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i,
  dr = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,
  ne = 1e7,
  T = 7,
  jr = 9007199254740991,
  Dr = Te.length - 1,
  Be = Re.length - 1,
  P = { toStringTag: cr };
P.absoluteValue = P.abs = function () {
  var e = new this.constructor(this);
  return (e.s < 0 && (e.s = 1), $(e));
};
P.ceil = function () {
  return $(new this.constructor(this), this.e + 1, 2);
};
P.clampedTo = P.clamp = function (e, r) {
  var i,
    n = this,
    o = n.constructor;
  if (((e = new o(e)), (r = new o(r)), !e.s || !r.s)) return new o(NaN);
  if (e.gt(r)) throw Error(he + r);
  return ((i = n.cmp(e)), i < 0 ? e : n.cmp(r) > 0 ? r : new o(n));
};
P.comparedTo = P.cmp = function (e) {
  var r,
    i,
    n,
    o,
    u = this,
    s = u.d,
    t = (e = new u.constructor(e)).d,
    p = u.s,
    a = e.s;
  if (!s || !t) return !p || !a ? NaN : p !== a ? p : s === t ? 0 : !s ^ (p < 0) ? 1 : -1;
  if (!s[0] || !t[0]) return s[0] ? p : t[0] ? -a : 0;
  if (p !== a) return p;
  if (u.e !== e.e) return (u.e > e.e) ^ (p < 0) ? 1 : -1;
  for (n = s.length, o = t.length, r = 0, i = n < o ? n : o; r < i; ++r)
    if (s[r] !== t[r]) return (s[r] > t[r]) ^ (p < 0) ? 1 : -1;
  return n === o ? 0 : (n > o) ^ (p < 0) ? 1 : -1;
};
P.cosine = P.cos = function () {
  var e,
    r,
    i = this,
    n = i.constructor;
  return i.d
    ? i.d[0]
      ? ((e = n.precision),
        (r = n.rounding),
        (n.precision = e + Math.max(i.e, i.sd()) + T),
        (n.rounding = 1),
        (i = Ur(n, wr(n, i))),
        (n.precision = e),
        (n.rounding = r),
        $(fe == 2 || fe == 3 ? i.neg() : i, e, r, !0))
      : new n(1)
    : new n(NaN);
};
P.cubeRoot = P.cbrt = function () {
  var e,
    r,
    i,
    n,
    o,
    u,
    s,
    t,
    p,
    a,
    d = this,
    c = d.constructor;
  if (!d.isFinite() || d.isZero()) return new c(d);
  for (
    E = !1,
      u = d.s * K(d.s * d, 1 / 3),
      !u || Math.abs(u) == 1 / 0
        ? ((i = X(d.d)),
          (e = d.e),
          (u = (e - i.length + 1) % 3) && (i += u == 1 || u == -2 ? '0' : '00'),
          (u = K(i, 1 / 3)),
          (e = G((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2))),
          u == 1 / 0
            ? (i = '5e' + e)
            : ((i = u.toExponential()), (i = i.slice(0, i.indexOf('e') + 1) + e)),
          (n = new c(i)),
          (n.s = d.s))
        : (n = new c(u.toString())),
      s = (e = c.precision) + 3;
    ;
  )
    if (
      ((t = n),
      (p = t.times(t).times(t)),
      (a = p.plus(d)),
      (n = V(a.plus(d).times(t), a.plus(p), s + 2, 1)),
      X(t.d).slice(0, s) === (i = X(n.d)).slice(0, s))
    )
      if (((i = i.slice(s - 3, s + 1)), i == '9999' || (!o && i == '4999'))) {
        if (!o && ($(t, e + 1, 0), t.times(t).times(t).eq(d))) {
          n = t;
          break;
        }
        ((s += 4), (o = 1));
      } else {
        (!+i || (!+i.slice(1) && i.charAt(0) == '5')) &&
          ($(n, e + 1, 1), (r = !n.times(n).times(n).eq(d)));
        break;
      }
  return ((E = !0), $(n, e, c.rounding, r));
};
P.decimalPlaces = P.dp = function () {
  var e,
    r = this.d,
    i = NaN;
  if (r) {
    if (((e = r.length - 1), (i = (e - G(this.e / T)) * T), (e = r[e]), e))
      for (; e % 10 == 0; e /= 10) i--;
    i < 0 && (i = 0);
  }
  return i;
};
P.dividedBy = P.div = function (e) {
  return V(this, new this.constructor(e));
};
P.dividedToIntegerBy = P.divToInt = function (e) {
  var r = this,
    i = r.constructor;
  return $(V(r, new i(e), 0, 1, 1), i.precision, i.rounding);
};
P.equals = P.eq = function (e) {
  return this.cmp(e) === 0;
};
P.floor = function () {
  return $(new this.constructor(this), this.e + 1, 3);
};
P.greaterThan = P.gt = function (e) {
  return this.cmp(e) > 0;
};
P.greaterThanOrEqualTo = P.gte = function (e) {
  var r = this.cmp(e);
  return r == 1 || r === 0;
};
P.hyperbolicCosine = P.cosh = function () {
  var e,
    r,
    i,
    n,
    o,
    u = this,
    s = u.constructor,
    t = new s(1);
  if (!u.isFinite()) return new s(u.s ? 1 / 0 : NaN);
  if (u.isZero()) return t;
  ((i = s.precision),
    (n = s.rounding),
    (s.precision = i + Math.max(u.e, u.sd()) + 4),
    (s.rounding = 1),
    (o = u.d.length),
    o < 32
      ? ((e = Math.ceil(o / 3)), (r = (1 / Ue(4, e)).toString()))
      : ((e = 16), (r = '2.3283064365386962890625e-10')),
    (u = Pe(s, 1, u.times(r), new s(1), !0)));
  for (var p, a = e, d = new s(8); a--; )
    ((p = u.times(u)), (u = t.minus(p.times(d.minus(p.times(d))))));
  return $(u, (s.precision = i), (s.rounding = n), !0);
};
P.hyperbolicSine = P.sinh = function () {
  var e,
    r,
    i,
    n,
    o = this,
    u = o.constructor;
  if (!o.isFinite() || o.isZero()) return new u(o);
  if (
    ((r = u.precision),
    (i = u.rounding),
    (u.precision = r + Math.max(o.e, o.sd()) + 4),
    (u.rounding = 1),
    (n = o.d.length),
    n < 3)
  )
    o = Pe(u, 2, o, o, !0);
  else {
    ((e = 1.4 * Math.sqrt(n)),
      (e = e > 16 ? 16 : e | 0),
      (o = o.times(1 / Ue(5, e))),
      (o = Pe(u, 2, o, o, !0)));
    for (var s, t = new u(5), p = new u(16), a = new u(20); e--; )
      ((s = o.times(o)), (o = o.times(t.plus(s.times(p.times(s).plus(a))))));
  }
  return ((u.precision = r), (u.rounding = i), $(o, r, i, !0));
};
P.hyperbolicTangent = P.tanh = function () {
  var e,
    r,
    i = this,
    n = i.constructor;
  return i.isFinite()
    ? i.isZero()
      ? new n(i)
      : ((e = n.precision),
        (r = n.rounding),
        (n.precision = e + 7),
        (n.rounding = 1),
        V(i.sinh(), i.cosh(), (n.precision = e), (n.rounding = r)))
    : new n(i.s);
};
P.inverseCosine = P.acos = function () {
  var e = this,
    r = e.constructor,
    i = e.abs().cmp(1),
    n = r.precision,
    o = r.rounding;
  return i !== -1
    ? i === 0
      ? e.isNeg()
        ? ue(r, n, o)
        : new r(0)
      : new r(NaN)
    : e.isZero()
      ? ue(r, n + 4, o).times(0.5)
      : ((r.precision = n + 6),
        (r.rounding = 1),
        (e = new r(1).minus(e).div(e.plus(1)).sqrt().atan()),
        (r.precision = n),
        (r.rounding = o),
        e.times(2));
};
P.inverseHyperbolicCosine = P.acosh = function () {
  var e,
    r,
    i = this,
    n = i.constructor;
  return i.lte(1)
    ? new n(i.eq(1) ? 0 : NaN)
    : i.isFinite()
      ? ((e = n.precision),
        (r = n.rounding),
        (n.precision = e + Math.max(Math.abs(i.e), i.sd()) + 4),
        (n.rounding = 1),
        (E = !1),
        (i = i.times(i).minus(1).sqrt().plus(i)),
        (E = !0),
        (n.precision = e),
        (n.rounding = r),
        i.ln())
      : new n(i);
};
P.inverseHyperbolicSine = P.asinh = function () {
  var e,
    r,
    i = this,
    n = i.constructor;
  return !i.isFinite() || i.isZero()
    ? new n(i)
    : ((e = n.precision),
      (r = n.rounding),
      (n.precision = e + 2 * Math.max(Math.abs(i.e), i.sd()) + 6),
      (n.rounding = 1),
      (E = !1),
      (i = i.times(i).plus(1).sqrt().plus(i)),
      (E = !0),
      (n.precision = e),
      (n.rounding = r),
      i.ln());
};
P.inverseHyperbolicTangent = P.atanh = function () {
  var e,
    r,
    i,
    n,
    o = this,
    u = o.constructor;
  return o.isFinite()
    ? o.e >= 0
      ? new u(o.abs().eq(1) ? o.s / 0 : o.isZero() ? o : NaN)
      : ((e = u.precision),
        (r = u.rounding),
        (n = o.sd()),
        Math.max(n, e) < 2 * -o.e - 1
          ? $(new u(o), e, r, !0)
          : ((u.precision = i = n - o.e),
            (o = V(o.plus(1), new u(1).minus(o), i + e, 1)),
            (u.precision = e + 4),
            (u.rounding = 1),
            (o = o.ln()),
            (u.precision = e),
            (u.rounding = r),
            o.times(0.5)))
    : new u(NaN);
};
P.inverseSine = P.asin = function () {
  var e,
    r,
    i,
    n,
    o = this,
    u = o.constructor;
  return o.isZero()
    ? new u(o)
    : ((r = o.abs().cmp(1)),
      (i = u.precision),
      (n = u.rounding),
      r !== -1
        ? r === 0
          ? ((e = ue(u, i + 4, n).times(0.5)), (e.s = o.s), e)
          : new u(NaN)
        : ((u.precision = i + 6),
          (u.rounding = 1),
          (o = o.div(new u(1).minus(o.times(o)).sqrt().plus(1)).atan()),
          (u.precision = i),
          (u.rounding = n),
          o.times(2)));
};
P.inverseTangent = P.atan = function () {
  var e,
    r,
    i,
    n,
    o,
    u,
    s,
    t,
    p,
    a = this,
    d = a.constructor,
    c = d.precision,
    h = d.rounding;
  if (a.isFinite()) {
    if (a.isZero()) return new d(a);
    if (a.abs().eq(1) && c + 4 <= Be) return ((s = ue(d, c + 4, h).times(0.25)), (s.s = a.s), s);
  } else {
    if (!a.s) return new d(NaN);
    if (c + 4 <= Be) return ((s = ue(d, c + 4, h).times(0.5)), (s.s = a.s), s);
  }
  for (d.precision = t = c + 10, d.rounding = 1, i = Math.min(28, (t / T + 2) | 0), e = i; e; --e)
    a = a.div(a.times(a).plus(1).sqrt().plus(1));
  for (E = !1, r = Math.ceil(t / T), n = 1, p = a.times(a), s = new d(a), o = a; e !== -1; )
    if (
      ((o = o.times(p)),
      (u = s.minus(o.div((n += 2)))),
      (o = o.times(p)),
      (s = u.plus(o.div((n += 2)))),
      s.d[r] !== void 0)
    )
      for (e = r; s.d[e] === u.d[e] && e--; );
  return (
    i && (s = s.times(2 << (i - 1))),
    (E = !0),
    $(s, (d.precision = c), (d.rounding = h), !0)
  );
};
P.isFinite = function () {
  return !!this.d;
};
P.isInteger = P.isInt = function () {
  return !!this.d && G(this.e / T) > this.d.length - 2;
};
P.isNaN = function () {
  return !this.s;
};
P.isNegative = P.isNeg = function () {
  return this.s < 0;
};
P.isPositive = P.isPos = function () {
  return this.s > 0;
};
P.isZero = function () {
  return !!this.d && this.d[0] === 0;
};
P.lessThan = P.lt = function (e) {
  return this.cmp(e) < 0;
};
P.lessThanOrEqualTo = P.lte = function (e) {
  return this.cmp(e) < 1;
};
P.logarithm = P.log = function (e) {
  var r,
    i,
    n,
    o,
    u,
    s,
    t,
    p,
    a = this,
    d = a.constructor,
    c = d.precision,
    h = d.rounding,
    l = 5;
  if (e == null) ((e = new d(10)), (r = !0));
  else {
    if (((e = new d(e)), (i = e.d), e.s < 0 || !i || !i[0] || e.eq(1))) return new d(NaN);
    r = e.eq(10);
  }
  if (((i = a.d), a.s < 0 || !i || !i[0] || a.eq(1)))
    return new d(i && !i[0] ? -1 / 0 : a.s != 1 ? NaN : i ? 0 : 1 / 0);
  if (r)
    if (i.length > 1) u = !0;
    else {
      for (o = i[0]; o % 10 === 0; ) o /= 10;
      u = o !== 1;
    }
  if (
    ((E = !1),
    (t = c + l),
    (s = de(a, t)),
    (n = r ? Ee(d, t + 10) : de(e, t)),
    (p = V(s, n, t, 1)),
    Ce(p.d, (o = c), h))
  )
    do
      if (
        ((t += 10), (s = de(a, t)), (n = r ? Ee(d, t + 10) : de(e, t)), (p = V(s, n, t, 1)), !u)
      ) {
        +X(p.d).slice(o + 1, o + 15) + 1 == 1e14 && (p = $(p, c + 1, 0));
        break;
      }
    while (Ce(p.d, (o += 10), h));
  return ((E = !0), $(p, c, h));
};
P.minus = P.sub = function (e) {
  var r,
    i,
    n,
    o,
    u,
    s,
    t,
    p,
    a,
    d,
    c,
    h,
    l = this,
    y = l.constructor;
  if (((e = new y(e)), !l.d || !e.d))
    return (
      !l.s || !e.s
        ? (e = new y(NaN))
        : l.d
          ? (e.s = -e.s)
          : (e = new y(e.d || l.s !== e.s ? l : NaN)),
      e
    );
  if (l.s != e.s) return ((e.s = -e.s), l.plus(e));
  if (((a = l.d), (h = e.d), (t = y.precision), (p = y.rounding), !a[0] || !h[0])) {
    if (h[0]) e.s = -e.s;
    else if (a[0]) e = new y(l);
    else return new y(p === 3 ? -0 : 0);
    return E ? $(e, t, p) : e;
  }
  if (((i = G(e.e / T)), (d = G(l.e / T)), (a = a.slice()), (u = d - i), u)) {
    for (
      c = u < 0,
        c ? ((r = a), (u = -u), (s = h.length)) : ((r = h), (i = d), (s = a.length)),
        n = Math.max(Math.ceil(t / T), s) + 2,
        u > n && ((u = n), (r.length = 1)),
        r.reverse(),
        n = u;
      n--;
    )
      r.push(0);
    r.reverse();
  } else {
    for (n = a.length, s = h.length, c = n < s, c && (s = n), n = 0; n < s; n++)
      if (a[n] != h[n]) {
        c = a[n] < h[n];
        break;
      }
    u = 0;
  }
  for (c && ((r = a), (a = h), (h = r), (e.s = -e.s)), s = a.length, n = h.length - s; n > 0; --n)
    a[s++] = 0;
  for (n = h.length; n > u; ) {
    if (a[--n] < h[n]) {
      for (o = n; o && a[--o] === 0; ) a[o] = ne - 1;
      (--a[o], (a[n] += ne));
    }
    a[n] -= h[n];
  }
  for (; a[--s] === 0; ) a.pop();
  for (; a[0] === 0; a.shift()) --i;
  return a[0] ? ((e.d = a), (e.e = De(a, i)), E ? $(e, t, p) : e) : new y(p === 3 ? -0 : 0);
};
P.modulo = P.mod = function (e) {
  var r,
    i = this,
    n = i.constructor;
  return (
    (e = new n(e)),
    !i.d || !e.s || (e.d && !e.d[0])
      ? new n(NaN)
      : !e.d || (i.d && !i.d[0])
        ? $(new n(i), n.precision, n.rounding)
        : ((E = !1),
          n.modulo == 9
            ? ((r = V(i, e.abs(), 0, 3, 1)), (r.s *= e.s))
            : (r = V(i, e, 0, n.modulo, 1)),
          (r = r.times(e)),
          (E = !0),
          i.minus(r))
  );
};
P.naturalExponential = P.exp = function () {
  return He(this);
};
P.naturalLogarithm = P.ln = function () {
  return de(this);
};
P.negated = P.neg = function () {
  var e = new this.constructor(this);
  return ((e.s = -e.s), $(e));
};
P.plus = P.add = function (e) {
  var r,
    i,
    n,
    o,
    u,
    s,
    t,
    p,
    a,
    d,
    c = this,
    h = c.constructor;
  if (((e = new h(e)), !c.d || !e.d))
    return (!c.s || !e.s ? (e = new h(NaN)) : c.d || (e = new h(e.d || c.s === e.s ? c : NaN)), e);
  if (c.s != e.s) return ((e.s = -e.s), c.minus(e));
  if (((a = c.d), (d = e.d), (t = h.precision), (p = h.rounding), !a[0] || !d[0]))
    return (d[0] || (e = new h(c)), E ? $(e, t, p) : e);
  if (((u = G(c.e / T)), (n = G(e.e / T)), (a = a.slice()), (o = u - n), o)) {
    for (
      o < 0 ? ((i = a), (o = -o), (s = d.length)) : ((i = d), (n = u), (s = a.length)),
        u = Math.ceil(t / T),
        s = u > s ? u + 1 : s + 1,
        o > s && ((o = s), (i.length = 1)),
        i.reverse();
      o--;
    )
      i.push(0);
    i.reverse();
  }
  for (s = a.length, o = d.length, s - o < 0 && ((o = s), (i = d), (d = a), (a = i)), r = 0; o; )
    ((r = ((a[--o] = a[o] + d[o] + r) / ne) | 0), (a[o] %= ne));
  for (r && (a.unshift(r), ++n), s = a.length; a[--s] == 0; ) a.pop();
  return ((e.d = a), (e.e = De(a, n)), E ? $(e, t, p) : e);
};
P.precision = P.sd = function (e) {
  var r,
    i = this;
  if (e !== void 0 && e !== !!e && e !== 1 && e !== 0) throw Error(he + e);
  return (i.d ? ((r = hr(i.d)), e && i.e + 1 > r && (r = i.e + 1)) : (r = NaN), r);
};
P.round = function () {
  var e = this,
    r = e.constructor;
  return $(new r(e), e.e + 1, r.rounding);
};
P.sine = P.sin = function () {
  var e,
    r,
    i = this,
    n = i.constructor;
  return i.isFinite()
    ? i.isZero()
      ? new n(i)
      : ((e = n.precision),
        (r = n.rounding),
        (n.precision = e + Math.max(i.e, i.sd()) + T),
        (n.rounding = 1),
        (i = Mr(n, wr(n, i))),
        (n.precision = e),
        (n.rounding = r),
        $(fe > 2 ? i.neg() : i, e, r, !0))
    : new n(NaN);
};
P.squareRoot = P.sqrt = function () {
  var e,
    r,
    i,
    n,
    o,
    u,
    s = this,
    t = s.d,
    p = s.e,
    a = s.s,
    d = s.constructor;
  if (a !== 1 || !t || !t[0]) return new d(!a || (a < 0 && (!t || t[0])) ? NaN : t ? s : 1 / 0);
  for (
    E = !1,
      a = Math.sqrt(+s),
      a == 0 || a == 1 / 0
        ? ((r = X(t)),
          (r.length + p) % 2 == 0 && (r += '0'),
          (a = Math.sqrt(r)),
          (p = G((p + 1) / 2) - (p < 0 || p % 2)),
          a == 1 / 0
            ? (r = '5e' + p)
            : ((r = a.toExponential()), (r = r.slice(0, r.indexOf('e') + 1) + p)),
          (n = new d(r)))
        : (n = new d(a.toString())),
      i = (p = d.precision) + 3;
    ;
  )
    if (
      ((u = n),
      (n = u.plus(V(s, u, i + 2, 1)).times(0.5)),
      X(u.d).slice(0, i) === (r = X(n.d)).slice(0, i))
    )
      if (((r = r.slice(i - 3, i + 1)), r == '9999' || (!o && r == '4999'))) {
        if (!o && ($(u, p + 1, 0), u.times(u).eq(s))) {
          n = u;
          break;
        }
        ((i += 4), (o = 1));
      } else {
        (!+r || (!+r.slice(1) && r.charAt(0) == '5')) && ($(n, p + 1, 1), (e = !n.times(n).eq(s)));
        break;
      }
  return ((E = !0), $(n, p, d.rounding, e));
};
P.tangent = P.tan = function () {
  var e,
    r,
    i = this,
    n = i.constructor;
  return i.isFinite()
    ? i.isZero()
      ? new n(i)
      : ((e = n.precision),
        (r = n.rounding),
        (n.precision = e + 10),
        (n.rounding = 1),
        (i = i.sin()),
        (i.s = 1),
        (i = V(i, new n(1).minus(i.times(i)).sqrt(), e + 10, 0)),
        (n.precision = e),
        (n.rounding = r),
        $(fe == 2 || fe == 4 ? i.neg() : i, e, r, !0))
    : new n(NaN);
};
P.times = P.mul = function (e) {
  var r,
    i,
    n,
    o,
    u,
    s,
    t,
    p,
    a,
    d = this,
    c = d.constructor,
    h = d.d,
    l = (e = new c(e)).d;
  if (((e.s *= d.s), !h || !h[0] || !l || !l[0]))
    return new c(
      !e.s || (h && !h[0] && !l) || (l && !l[0] && !h) ? NaN : !h || !l ? e.s / 0 : e.s * 0,
    );
  for (
    i = G(d.e / T) + G(e.e / T),
      p = h.length,
      a = l.length,
      p < a && ((u = h), (h = l), (l = u), (s = p), (p = a), (a = s)),
      u = [],
      s = p + a,
      n = s;
    n--;
  )
    u.push(0);
  for (n = a; --n >= 0; ) {
    for (r = 0, o = p + n; o > n; )
      ((t = u[o] + l[n] * h[o - n - 1] + r), (u[o--] = (t % ne) | 0), (r = (t / ne) | 0));
    u[o] = ((u[o] + r) % ne) | 0;
  }
  for (; !u[--s]; ) u.pop();
  return (r ? ++i : u.shift(), (e.d = u), (e.e = De(u, i)), E ? $(e, c.precision, c.rounding) : e);
};
P.toBinary = function (e, r) {
  return Ke(this, 2, e, r);
};
P.toDecimalPlaces = P.toDP = function (e, r) {
  var i = this,
    n = i.constructor;
  return (
    (i = new n(i)),
    e === void 0
      ? i
      : (ee(e, 0, ye), r === void 0 ? (r = n.rounding) : ee(r, 0, 8), $(i, e + i.e + 1, r))
  );
};
P.toExponential = function (e, r) {
  var i,
    n = this,
    o = n.constructor;
  return (
    e === void 0
      ? (i = le(n, !0))
      : (ee(e, 0, ye),
        r === void 0 ? (r = o.rounding) : ee(r, 0, 8),
        (n = $(new o(n), e + 1, r)),
        (i = le(n, !0, e + 1))),
    n.isNeg() && !n.isZero() ? '-' + i : i
  );
};
P.toFixed = function (e, r) {
  var i,
    n,
    o = this,
    u = o.constructor;
  return (
    e === void 0
      ? (i = le(o))
      : (ee(e, 0, ye),
        r === void 0 ? (r = u.rounding) : ee(r, 0, 8),
        (n = $(new u(o), e + o.e + 1, r)),
        (i = le(n, !1, e + n.e + 1))),
    o.isNeg() && !o.isZero() ? '-' + i : i
  );
};
P.toFraction = function (e) {
  var r,
    i,
    n,
    o,
    u,
    s,
    t,
    p,
    a,
    d,
    c,
    h,
    l = this,
    y = l.d,
    b = l.constructor;
  if (!y) return new b(l);
  if (
    ((a = i = new b(1)),
    (n = p = new b(0)),
    (r = new b(n)),
    (u = r.e = hr(y) - l.e - 1),
    (s = u % T),
    (r.d[0] = K(10, s < 0 ? T + s : s)),
    e == null)
  )
    e = u > 0 ? r : a;
  else {
    if (((t = new b(e)), !t.isInt() || t.lt(a))) throw Error(he + t);
    e = t.gt(r) ? (u > 0 ? r : a) : t;
  }
  for (
    E = !1, t = new b(X(y)), d = b.precision, b.precision = u = y.length * T * 2;
    (c = V(t, r, 0, 1, 1)), (o = i.plus(c.times(n))), o.cmp(e) != 1;
  )
    ((i = n),
      (n = o),
      (o = a),
      (a = p.plus(c.times(o))),
      (p = o),
      (o = r),
      (r = t.minus(c.times(o))),
      (t = o));
  return (
    (o = V(e.minus(i), n, 0, 1, 1)),
    (p = p.plus(o.times(a))),
    (i = i.plus(o.times(n))),
    (p.s = a.s = l.s),
    (h =
      V(a, n, u, 1)
        .minus(l)
        .abs()
        .cmp(V(p, i, u, 1).minus(l).abs()) < 1
        ? [a, n]
        : [p, i]),
    (b.precision = d),
    (E = !0),
    h
  );
};
P.toHexadecimal = P.toHex = function (e, r) {
  return Ke(this, 16, e, r);
};
P.toNearest = function (e, r) {
  var i = this,
    n = i.constructor;
  if (((i = new n(i)), e == null)) {
    if (!i.d) return i;
    ((e = new n(1)), (r = n.rounding));
  } else {
    if (((e = new n(e)), r === void 0 ? (r = n.rounding) : ee(r, 0, 8), !i.d)) return e.s ? i : e;
    if (!e.d) return (e.s && (e.s = i.s), e);
  }
  return (
    e.d[0] ? ((E = !1), (i = V(i, e, 0, r, 1).times(e)), (E = !0), $(i)) : ((e.s = i.s), (i = e)),
    i
  );
};
P.toNumber = function () {
  return +this;
};
P.toOctal = function (e, r) {
  return Ke(this, 8, e, r);
};
P.toPower = P.pow = function (e) {
  var r,
    i,
    n,
    o,
    u,
    s,
    t = this,
    p = t.constructor,
    a = +(e = new p(e));
  if (!t.d || !e.d || !t.d[0] || !e.d[0]) return new p(K(+t, a));
  if (((t = new p(t)), t.eq(1))) return t;
  if (((n = p.precision), (u = p.rounding), e.eq(1))) return $(t, n, u);
  if (((r = G(e.e / T)), r >= e.d.length - 1 && (i = a < 0 ? -a : a) <= jr))
    return ((o = yr(p, t, i, n)), e.s < 0 ? new p(1).div(o) : $(o, n, u));
  if (((s = t.s), s < 0)) {
    if (r < e.d.length - 1) return new p(NaN);
    if (((e.d[r] & 1) == 0 && (s = 1), t.e == 0 && t.d[0] == 1 && t.d.length == 1))
      return ((t.s = s), t);
  }
  return (
    (i = K(+t, a)),
    (r =
      i == 0 || !isFinite(i)
        ? G(a * (Math.log('0.' + X(t.d)) / Math.LN10 + t.e + 1))
        : new p(i + '').e),
    r > p.maxE + 1 || r < p.minE - 1
      ? new p(r > 0 ? s / 0 : 0)
      : ((E = !1),
        (p.rounding = t.s = 1),
        (i = Math.min(12, (r + '').length)),
        (o = He(e.times(de(t, n + i)), n)),
        o.d &&
          ((o = $(o, n + 5, 1)),
          Ce(o.d, n, u) &&
            ((r = n + 10),
            (o = $(He(e.times(de(t, r + i)), r), r + 5, 1)),
            +X(o.d).slice(n + 1, n + 15) + 1 == 1e14 && (o = $(o, n + 1, 0)))),
        (o.s = s),
        (E = !0),
        (p.rounding = u),
        $(o, n, u))
  );
};
P.toPrecision = function (e, r) {
  var i,
    n = this,
    o = n.constructor;
  return (
    e === void 0
      ? (i = le(n, n.e <= o.toExpNeg || n.e >= o.toExpPos))
      : (ee(e, 1, ye),
        r === void 0 ? (r = o.rounding) : ee(r, 0, 8),
        (n = $(new o(n), e, r)),
        (i = le(n, e <= n.e || n.e <= o.toExpNeg, e))),
    n.isNeg() && !n.isZero() ? '-' + i : i
  );
};
P.toSignificantDigits = P.toSD = function (e, r) {
  var i = this,
    n = i.constructor;
  return (
    e === void 0
      ? ((e = n.precision), (r = n.rounding))
      : (ee(e, 1, ye), r === void 0 ? (r = n.rounding) : ee(r, 0, 8)),
    $(new n(i), e, r)
  );
};
P.toString = function () {
  var e = this,
    r = e.constructor,
    i = le(e, e.e <= r.toExpNeg || e.e >= r.toExpPos);
  return e.isNeg() && !e.isZero() ? '-' + i : i;
};
P.truncated = P.trunc = function () {
  return $(new this.constructor(this), this.e + 1, 1);
};
P.valueOf = P.toJSON = function () {
  var e = this,
    r = e.constructor,
    i = le(e, e.e <= r.toExpNeg || e.e >= r.toExpPos);
  return e.isNeg() ? '-' + i : i;
};
function X(e) {
  var r,
    i,
    n,
    o = e.length - 1,
    u = '',
    s = e[0];
  if (o > 0) {
    for (u += s, r = 1; r < o; r++)
      ((n = e[r] + ''), (i = T - n.length), i && (u += ce(i)), (u += n));
    ((s = e[r]), (n = s + ''), (i = T - n.length), i && (u += ce(i)));
  } else if (s === 0) return '0';
  for (; s % 10 === 0; ) s /= 10;
  return u + s;
}
function ee(e, r, i) {
  if (e !== ~~e || e < r || e > i) throw Error(he + e);
}
function Ce(e, r, i, n) {
  var o, u, s, t;
  for (u = e[0]; u >= 10; u /= 10) --r;
  return (
    --r < 0 ? ((r += T), (o = 0)) : ((o = Math.ceil((r + 1) / T)), (r %= T)),
    (u = K(10, T - r)),
    (t = (e[o] % u) | 0),
    n == null
      ? r < 3
        ? (r == 0 ? (t = (t / 100) | 0) : r == 1 && (t = (t / 10) | 0),
          (s = (i < 4 && t == 99999) || (i > 3 && t == 49999) || t == 5e4 || t == 0))
        : (s =
            (((i < 4 && t + 1 == u) || (i > 3 && t + 1 == u / 2)) &&
              ((e[o + 1] / u / 100) | 0) == K(10, r - 2) - 1) ||
            ((t == u / 2 || t == 0) && ((e[o + 1] / u / 100) | 0) == 0))
      : r < 4
        ? (r == 0
            ? (t = (t / 1e3) | 0)
            : r == 1
              ? (t = (t / 100) | 0)
              : r == 2 && (t = (t / 10) | 0),
          (s = ((n || i < 4) && t == 9999) || (!n && i > 3 && t == 4999)))
        : (s =
            (((n || i < 4) && t + 1 == u) || (!n && i > 3 && t + 1 == u / 2)) &&
            ((e[o + 1] / u / 1e3) | 0) == K(10, r - 3) - 1),
    s
  );
}
function qe(e, r, i) {
  for (var n, o = [0], u, s = 0, t = e.length; s < t; ) {
    for (u = o.length; u--; ) o[u] *= r;
    for (o[0] += Ze.indexOf(e.charAt(s++)), n = 0; n < o.length; n++)
      o[n] > i - 1 &&
        (o[n + 1] === void 0 && (o[n + 1] = 0), (o[n + 1] += (o[n] / i) | 0), (o[n] %= i));
  }
  return o.reverse();
}
function Ur(e, r) {
  var i, n, o;
  if (r.isZero()) return r;
  ((n = r.d.length),
    n < 32
      ? ((i = Math.ceil(n / 3)), (o = (1 / Ue(4, i)).toString()))
      : ((i = 16), (o = '2.3283064365386962890625e-10')),
    (e.precision += i),
    (r = Pe(e, 1, r.times(o), new e(1))));
  for (var u = i; u--; ) {
    var s = r.times(r);
    r = s.times(s).minus(s).times(8).plus(1);
  }
  return ((e.precision -= i), r);
}
var V = (function () {
  function e(n, o, u) {
    var s,
      t = 0,
      p = n.length;
    for (n = n.slice(); p--; ) ((s = n[p] * o + t), (n[p] = (s % u) | 0), (t = (s / u) | 0));
    return (t && n.unshift(t), n);
  }
  function r(n, o, u, s) {
    var t, p;
    if (u != s) p = u > s ? 1 : -1;
    else
      for (t = p = 0; t < u; t++)
        if (n[t] != o[t]) {
          p = n[t] > o[t] ? 1 : -1;
          break;
        }
    return p;
  }
  function i(n, o, u, s) {
    for (var t = 0; u--; ) ((n[u] -= t), (t = n[u] < o[u] ? 1 : 0), (n[u] = t * s + n[u] - o[u]));
    for (; !n[0] && n.length > 1; ) n.shift();
  }
  return function (n, o, u, s, t, p) {
    var a,
      d,
      c,
      h,
      l,
      y,
      b,
      g,
      _,
      m,
      f,
      A,
      L,
      w,
      v,
      C,
      k,
      te,
      O,
      R,
      q = n.constructor,
      S = n.s == o.s ? 1 : -1,
      j = n.d,
      U = o.d;
    if (!j || !j[0] || !U || !U[0])
      return new q(
        !n.s || !o.s || (j ? U && j[0] == U[0] : !U) ? NaN : (j && j[0] == 0) || !U ? S * 0 : S / 0,
      );
    for (
      p ? ((l = 1), (d = n.e - o.e)) : ((p = ne), (l = T), (d = G(n.e / l) - G(o.e / l))),
        O = U.length,
        k = j.length,
        _ = new q(S),
        m = _.d = [],
        c = 0;
      U[c] == (j[c] || 0);
      c++
    );
    if (
      (U[c] > (j[c] || 0) && d--,
      u == null
        ? ((w = u = q.precision), (s = q.rounding))
        : t
          ? (w = u + (n.e - o.e) + 1)
          : (w = u),
      w < 0)
    )
      (m.push(1), (y = !0));
    else {
      if (((w = (w / l + 2) | 0), (c = 0), O == 1)) {
        for (h = 0, U = U[0], w++; (c < k || h) && w--; c++)
          ((v = h * p + (j[c] || 0)), (m[c] = (v / U) | 0), (h = (v % U) | 0));
        y = h || c < k;
      } else {
        for (
          h = (p / (U[0] + 1)) | 0,
            h > 1 && ((U = e(U, h, p)), (j = e(j, h, p)), (O = U.length), (k = j.length)),
            C = O,
            f = j.slice(0, O),
            A = f.length;
          A < O;
        )
          f[A++] = 0;
        ((R = U.slice()), R.unshift(0), (te = U[0]), U[1] >= p / 2 && ++te);
        do
          ((h = 0),
            (a = r(U, f, O, A)),
            a < 0
              ? ((L = f[0]),
                O != A && (L = L * p + (f[1] || 0)),
                (h = (L / te) | 0),
                h > 1
                  ? (h >= p && (h = p - 1),
                    (b = e(U, h, p)),
                    (g = b.length),
                    (A = f.length),
                    (a = r(b, f, g, A)),
                    a == 1 && (h--, i(b, O < g ? R : U, g, p)))
                  : (h == 0 && (a = h = 1), (b = U.slice())),
                (g = b.length),
                g < A && b.unshift(0),
                i(f, b, A, p),
                a == -1 &&
                  ((A = f.length), (a = r(U, f, O, A)), a < 1 && (h++, i(f, O < A ? R : U, A, p))),
                (A = f.length))
              : a === 0 && (h++, (f = [0])),
            (m[c++] = h),
            a && f[0] ? (f[A++] = j[C] || 0) : ((f = [j[C]]), (A = 1)));
        while ((C++ < k || f[0] !== void 0) && w--);
        y = f[0] !== void 0;
      }
      m[0] || m.shift();
    }
    if (l == 1) ((_.e = d), (mr = y));
    else {
      for (c = 1, h = m[0]; h >= 10; h /= 10) c++;
      ((_.e = c + d * l - 1), $(_, t ? u + _.e + 1 : u, s, y));
    }
    return _;
  };
})();
function $(e, r, i, n) {
  var o,
    u,
    s,
    t,
    p,
    a,
    d,
    c,
    h,
    l = e.constructor;
  e: if (r != null) {
    if (((c = e.d), !c)) return e;
    for (o = 1, t = c[0]; t >= 10; t /= 10) o++;
    if (((u = r - o), u < 0))
      ((u += T), (s = r), (d = c[(h = 0)]), (p = ((d / K(10, o - s - 1)) % 10) | 0));
    else if (((h = Math.ceil((u + 1) / T)), (t = c.length), h >= t))
      if (n) {
        for (; t++ <= h; ) c.push(0);
        ((d = p = 0), (o = 1), (u %= T), (s = u - T + 1));
      } else break e;
    else {
      for (d = t = c[h], o = 1; t >= 10; t /= 10) o++;
      ((u %= T), (s = u - T + o), (p = s < 0 ? 0 : ((d / K(10, o - s - 1)) % 10) | 0));
    }
    if (
      ((n = n || r < 0 || c[h + 1] !== void 0 || (s < 0 ? d : d % K(10, o - s - 1))),
      (a =
        i < 4
          ? (p || n) && (i == 0 || i == (e.s < 0 ? 3 : 2))
          : p > 5 ||
            (p == 5 &&
              (i == 4 ||
                n ||
                (i == 6 && ((u > 0 ? (s > 0 ? d / K(10, o - s) : 0) : c[h - 1]) % 10) & 1) ||
                i == (e.s < 0 ? 8 : 7)))),
      r < 1 || !c[0])
    )
      return (
        (c.length = 0),
        a ? ((r -= e.e + 1), (c[0] = K(10, (T - (r % T)) % T)), (e.e = -r || 0)) : (c[0] = e.e = 0),
        e
      );
    if (
      (u == 0
        ? ((c.length = h), (t = 1), h--)
        : ((c.length = h + 1),
          (t = K(10, T - u)),
          (c[h] = s > 0 ? (((d / K(10, o - s)) % K(10, s)) | 0) * t : 0)),
      a)
    )
      for (;;)
        if (h == 0) {
          for (u = 1, s = c[0]; s >= 10; s /= 10) u++;
          for (s = c[0] += t, t = 1; s >= 10; s /= 10) t++;
          u != t && (e.e++, c[0] == ne && (c[0] = 1));
          break;
        } else {
          if (((c[h] += t), c[h] != ne)) break;
          ((c[h--] = 0), (t = 1));
        }
    for (u = c.length; c[--u] === 0; ) c.pop();
  }
  return (
    E && (e.e > l.maxE ? ((e.d = null), (e.e = NaN)) : e.e < l.minE && ((e.e = 0), (e.d = [0]))),
    e
  );
}
function le(e, r, i) {
  if (!e.isFinite()) return gr(e);
  var n,
    o = e.e,
    u = X(e.d),
    s = u.length;
  return (
    r
      ? (i && (n = i - s) > 0
          ? (u = u.charAt(0) + '.' + u.slice(1) + ce(n))
          : s > 1 && (u = u.charAt(0) + '.' + u.slice(1)),
        (u = u + (e.e < 0 ? 'e' : 'e+') + e.e))
      : o < 0
        ? ((u = '0.' + ce(-o - 1) + u), i && (n = i - s) > 0 && (u += ce(n)))
        : o >= s
          ? ((u += ce(o + 1 - s)), i && (n = i - o - 1) > 0 && (u = u + '.' + ce(n)))
          : ((n = o + 1) < s && (u = u.slice(0, n) + '.' + u.slice(n)),
            i && (n = i - s) > 0 && (o + 1 === s && (u += '.'), (u += ce(n)))),
    u
  );
}
function De(e, r) {
  var i = e[0];
  for (r *= T; i >= 10; i /= 10) r++;
  return r;
}
function Ee(e, r, i) {
  if (r > Dr) throw ((E = !0), i && (e.precision = i), Error(pr));
  return $(new e(Te), r, 1, !0);
}
function ue(e, r, i) {
  if (r > Be) throw Error(pr);
  return $(new e(Re), r, i, !0);
}
function hr(e) {
  var r = e.length - 1,
    i = r * T + 1;
  if (((r = e[r]), r)) {
    for (; r % 10 == 0; r /= 10) i--;
    for (r = e[0]; r >= 10; r /= 10) i++;
  }
  return i;
}
function ce(e) {
  for (var r = ''; e--; ) r += '0';
  return r;
}
function yr(e, r, i, n) {
  var o,
    u = new e(1),
    s = Math.ceil(n / T + 4);
  for (E = !1; ; ) {
    if ((i % 2 && ((u = u.times(r)), ur(u.d, s) && (o = !0)), (i = G(i / 2)), i === 0)) {
      ((i = u.d.length - 1), o && u.d[i] === 0 && ++u.d[i]);
      break;
    }
    ((r = r.times(r)), ur(r.d, s));
  }
  return ((E = !0), u);
}
function or(e) {
  return e.d[e.d.length - 1] & 1;
}
function vr(e, r, i) {
  for (var n, o, u = new e(r[0]), s = 0; ++s < r.length; ) {
    if (((o = new e(r[s])), !o.s)) {
      u = o;
      break;
    }
    ((n = u.cmp(o)), (n === i || (n === 0 && u.s === i)) && (u = o));
  }
  return u;
}
function He(e, r) {
  var i,
    n,
    o,
    u,
    s,
    t,
    p,
    a = 0,
    d = 0,
    c = 0,
    h = e.constructor,
    l = h.rounding,
    y = h.precision;
  if (!e.d || !e.d[0] || e.e > 17)
    return new h(e.d ? (e.d[0] ? (e.s < 0 ? 0 : 1 / 0) : 1) : e.s ? (e.s < 0 ? 0 : e) : NaN);
  for (r == null ? ((E = !1), (p = y)) : (p = r), t = new h(0.03125); e.e > -2; )
    ((e = e.times(t)), (c += 5));
  for (
    n = ((Math.log(K(2, c)) / Math.LN10) * 2 + 5) | 0,
      p += n,
      i = u = s = new h(1),
      h.precision = p;
    ;
  ) {
    if (
      ((u = $(u.times(e), p, 1)),
      (i = i.times(++d)),
      (t = s.plus(V(u, i, p, 1))),
      X(t.d).slice(0, p) === X(s.d).slice(0, p))
    ) {
      for (o = c; o--; ) s = $(s.times(s), p, 1);
      if (r == null)
        if (a < 3 && Ce(s.d, p - n, l, a))
          ((h.precision = p += 10), (i = u = t = new h(1)), (d = 0), a++);
        else return $(s, (h.precision = y), l, (E = !0));
      else return ((h.precision = y), s);
    }
    s = t;
  }
}
function de(e, r) {
  var i,
    n,
    o,
    u,
    s,
    t,
    p,
    a,
    d,
    c,
    h,
    l = 1,
    y = 10,
    b = e,
    g = b.d,
    _ = b.constructor,
    m = _.rounding,
    f = _.precision;
  if (b.s < 0 || !g || !g[0] || (!b.e && g[0] == 1 && g.length == 1))
    return new _(g && !g[0] ? -1 / 0 : b.s != 1 ? NaN : g ? 0 : b);
  if (
    (r == null ? ((E = !1), (d = f)) : (d = r),
    (_.precision = d += y),
    (i = X(g)),
    (n = i.charAt(0)),
    Math.abs((u = b.e)) < 15e14)
  ) {
    for (; (n < 7 && n != 1) || (n == 1 && i.charAt(1) > 3); )
      ((b = b.times(e)), (i = X(b.d)), (n = i.charAt(0)), l++);
    ((u = b.e), n > 1 ? ((b = new _('0.' + i)), u++) : (b = new _(n + '.' + i.slice(1))));
  } else
    return (
      (a = Ee(_, d + 2, f).times(u + '')),
      (b = de(new _(n + '.' + i.slice(1)), d - y).plus(a)),
      (_.precision = f),
      r == null ? $(b, f, m, (E = !0)) : b
    );
  for (c = b, p = s = b = V(b.minus(1), b.plus(1), d, 1), h = $(b.times(b), d, 1), o = 3; ; ) {
    if (
      ((s = $(s.times(h), d, 1)),
      (a = p.plus(V(s, new _(o), d, 1))),
      X(a.d).slice(0, d) === X(p.d).slice(0, d))
    )
      if (
        ((p = p.times(2)),
        u !== 0 && (p = p.plus(Ee(_, d + 2, f).times(u + ''))),
        (p = V(p, new _(l), d, 1)),
        r == null)
      )
        if (Ce(p.d, d - y, m, t))
          ((_.precision = d += y),
            (a = s = b = V(c.minus(1), c.plus(1), d, 1)),
            (h = $(b.times(b), d, 1)),
            (o = t = 1));
        else return $(p, (_.precision = f), m, (E = !0));
      else return ((_.precision = f), p);
    ((p = a), (o += 2));
  }
}
function gr(e) {
  return String((e.s * e.s) / 0);
}
function $e(e, r) {
  var i, n, o;
  for (
    (i = r.indexOf('.')) > -1 && (r = r.replace('.', '')),
      (n = r.search(/e/i)) > 0
        ? (i < 0 && (i = n), (i += +r.slice(n + 1)), (r = r.substring(0, n)))
        : i < 0 && (i = r.length),
      n = 0;
    r.charCodeAt(n) === 48;
    n++
  );
  for (o = r.length; r.charCodeAt(o - 1) === 48; --o);
  if (((r = r.slice(n, o)), r)) {
    if (
      ((o -= n), (e.e = i = i - n - 1), (e.d = []), (n = (i + 1) % T), i < 0 && (n += T), n < o)
    ) {
      for (n && e.d.push(+r.slice(0, n)), o -= T; n < o; ) e.d.push(+r.slice(n, (n += T)));
      ((r = r.slice(n)), (n = T - r.length));
    } else n -= o;
    for (; n--; ) r += '0';
    (e.d.push(+r),
      E &&
        (e.e > e.constructor.maxE
          ? ((e.d = null), (e.e = NaN))
          : e.e < e.constructor.minE && ((e.e = 0), (e.d = [0]))));
  } else ((e.e = 0), (e.d = [0]));
  return e;
}
function Vr(e, r) {
  var i, n, o, u, s, t, p, a, d;
  if (r.indexOf('_') > -1) {
    if (((r = r.replace(/(\d)_(?=\d)/g, '$1')), dr.test(r))) return $e(e, r);
  } else if (r === 'Infinity' || r === 'NaN')
    return (+r || (e.s = NaN), (e.e = NaN), (e.d = null), e);
  if (Rr.test(r)) ((i = 16), (r = r.toLowerCase()));
  else if (Tr.test(r)) i = 2;
  else if (Er.test(r)) i = 8;
  else throw Error(he + r);
  for (
    u = r.search(/p/i),
      u > 0 ? ((p = +r.slice(u + 1)), (r = r.substring(2, u))) : (r = r.slice(2)),
      u = r.indexOf('.'),
      s = u >= 0,
      n = e.constructor,
      s && ((r = r.replace('.', '')), (t = r.length), (u = t - u), (o = yr(n, new n(i), u, u * 2))),
      a = qe(r, i, ne),
      d = a.length - 1,
      u = d;
    a[u] === 0;
    --u
  )
    a.pop();
  return u < 0
    ? new n(e.s * 0)
    : ((e.e = De(a, d)),
      (e.d = a),
      (E = !1),
      s && (e = V(e, o, t * 4)),
      p && (e = e.times(Math.abs(p) < 54 ? K(2, p) : Oe.pow(2, p))),
      (E = !0),
      e);
}
function Mr(e, r) {
  var i,
    n = r.d.length;
  if (n < 3) return r.isZero() ? r : Pe(e, 2, r, r);
  ((i = 1.4 * Math.sqrt(n)),
    (i = i > 16 ? 16 : i | 0),
    (r = r.times(1 / Ue(5, i))),
    (r = Pe(e, 2, r, r)));
  for (var o, u = new e(5), s = new e(16), t = new e(20); i--; )
    ((o = r.times(r)), (r = r.times(u.plus(o.times(s.times(o).minus(t))))));
  return r;
}
function Pe(e, r, i, n, o) {
  var u,
    s,
    t,
    p,
    a = 1,
    d = e.precision,
    c = Math.ceil(d / T);
  for (E = !1, p = i.times(i), t = new e(n); ; ) {
    if (
      ((s = V(t.times(p), new e(r++ * r++), d, 1)),
      (t = o ? n.plus(s) : n.minus(s)),
      (n = V(s.times(p), new e(r++ * r++), d, 1)),
      (s = t.plus(n)),
      s.d[c] !== void 0)
    ) {
      for (u = c; s.d[u] === t.d[u] && u--; );
      if (u == -1) break;
    }
    ((u = t), (t = n), (n = s), (s = u), a++);
  }
  return ((E = !0), (s.d.length = c + 1), s);
}
function Ue(e, r) {
  for (var i = e; --r; ) i *= e;
  return i;
}
function wr(e, r) {
  var i,
    n = r.s < 0,
    o = ue(e, e.precision, 1),
    u = o.times(0.5);
  if (((r = r.abs()), r.lte(u))) return ((fe = n ? 4 : 1), r);
  if (((i = r.divToInt(o)), i.isZero())) fe = n ? 3 : 2;
  else {
    if (((r = r.minus(i.times(o))), r.lte(u))) return ((fe = or(i) ? (n ? 2 : 3) : n ? 4 : 1), r);
    fe = or(i) ? (n ? 1 : 4) : n ? 3 : 2;
  }
  return r.minus(o).abs();
}
function Ke(e, r, i, n) {
  var o,
    u,
    s,
    t,
    p,
    a,
    d,
    c,
    h,
    l = e.constructor,
    y = i !== void 0;
  if (
    (y
      ? (ee(i, 1, ye), n === void 0 ? (n = l.rounding) : ee(n, 0, 8))
      : ((i = l.precision), (n = l.rounding)),
    !e.isFinite())
  )
    d = gr(e);
  else {
    for (
      d = le(e),
        s = d.indexOf('.'),
        y ? ((o = 2), r == 16 ? (i = i * 4 - 3) : r == 8 && (i = i * 3 - 2)) : (o = r),
        s >= 0 &&
          ((d = d.replace('.', '')),
          (h = new l(1)),
          (h.e = d.length - s),
          (h.d = qe(le(h), 10, o)),
          (h.e = h.d.length)),
        c = qe(d, 10, o),
        u = p = c.length;
      c[--p] == 0;
    )
      c.pop();
    if (!c[0]) d = y ? '0p+0' : '0';
    else {
      if (
        (s < 0
          ? u--
          : ((e = new l(e)),
            (e.d = c),
            (e.e = u),
            (e = V(e, h, i, n, 0, o)),
            (c = e.d),
            (u = e.e),
            (a = mr)),
        (s = c[i]),
        (t = o / 2),
        (a = a || c[i + 1] !== void 0),
        (a =
          n < 4
            ? (s !== void 0 || a) && (n === 0 || n === (e.s < 0 ? 3 : 2))
            : s > t ||
              (s === t && (n === 4 || a || (n === 6 && c[i - 1] & 1) || n === (e.s < 0 ? 8 : 7)))),
        (c.length = i),
        a)
      )
        for (; ++c[--i] > o - 1; ) ((c[i] = 0), i || (++u, c.unshift(1)));
      for (p = c.length; !c[p - 1]; --p);
      for (s = 0, d = ''; s < p; s++) d += Ze.charAt(c[s]);
      if (y) {
        if (p > 1)
          if (r == 16 || r == 8) {
            for (s = r == 16 ? 4 : 3, --p; p % s; p++) d += '0';
            for (c = qe(d, o, r), p = c.length; !c[p - 1]; --p);
            for (s = 1, d = '1.'; s < p; s++) d += Ze.charAt(c[s]);
          } else d = d.charAt(0) + '.' + d.slice(1);
        d = d + (u < 0 ? 'p' : 'p+') + u;
      } else if (u < 0) {
        for (; ++u; ) d = '0' + d;
        d = '0.' + d;
      } else if (++u > p) for (u -= p; u--; ) d += '0';
      else u < p && (d = d.slice(0, u) + '.' + d.slice(u));
    }
    d = (r == 16 ? '0x' : r == 2 ? '0b' : r == 8 ? '0o' : '') + d;
  }
  return e.s < 0 ? '-' + d : d;
}
function ur(e, r) {
  if (e.length > r) return ((e.length = r), !0);
}
function Fr(e) {
  return new this(e).abs();
}
function zr(e) {
  return new this(e).acos();
}
function Zr(e) {
  return new this(e).acosh();
}
function Qr(e, r) {
  return new this(e).plus(r);
}
function Br(e) {
  return new this(e).asin();
}
function Hr(e) {
  return new this(e).asinh();
}
function Kr(e) {
  return new this(e).atan();
}
function Wr(e) {
  return new this(e).atanh();
}
function Xr(e, r) {
  ((e = new this(e)), (r = new this(r)));
  var i,
    n = this.precision,
    o = this.rounding,
    u = n + 4;
  return (
    !e.s || !r.s
      ? (i = new this(NaN))
      : !e.d && !r.d
        ? ((i = ue(this, u, 1).times(r.s > 0 ? 0.25 : 0.75)), (i.s = e.s))
        : !r.d || e.isZero()
          ? ((i = r.s < 0 ? ue(this, n, o) : new this(0)), (i.s = e.s))
          : !e.d || r.isZero()
            ? ((i = ue(this, u, 1).times(0.5)), (i.s = e.s))
            : r.s < 0
              ? ((this.precision = u),
                (this.rounding = 1),
                (i = this.atan(V(e, r, u, 1))),
                (r = ue(this, u, 1)),
                (this.precision = n),
                (this.rounding = o),
                (i = e.s < 0 ? i.minus(r) : i.plus(r)))
              : (i = this.atan(V(e, r, u, 1))),
    i
  );
}
function Yr(e) {
  return new this(e).cbrt();
}
function Jr(e) {
  return $((e = new this(e)), e.e + 1, 2);
}
function Gr(e, r, i) {
  return new this(e).clamp(r, i);
}
function et(e) {
  if (!e || typeof e != 'object') throw Error(je + 'Object expected');
  var r,
    i,
    n,
    o = e.defaults === !0,
    u = [
      'precision',
      1,
      ye,
      'rounding',
      0,
      8,
      'toExpNeg',
      -be,
      0,
      'toExpPos',
      0,
      be,
      'maxE',
      0,
      be,
      'minE',
      -be,
      0,
      'modulo',
      0,
      9,
    ];
  for (r = 0; r < u.length; r += 3)
    if (((i = u[r]), o && (this[i] = Qe[i]), (n = e[i]) !== void 0))
      if (G(n) === n && n >= u[r + 1] && n <= u[r + 2]) this[i] = n;
      else throw Error(he + i + ': ' + n);
  if (((i = 'crypto'), o && (this[i] = Qe[i]), (n = e[i]) !== void 0))
    if (n === !0 || n === !1 || n === 0 || n === 1)
      if (n)
        if (typeof crypto < 'u' && crypto && (crypto.getRandomValues || crypto.randomBytes))
          this[i] = !0;
        else throw Error(fr);
      else this[i] = !1;
    else throw Error(he + i + ': ' + n);
  return this;
}
function rt(e) {
  return new this(e).cos();
}
function tt(e) {
  return new this(e).cosh();
}
function kr(e) {
  var r, i, n;
  function o(u) {
    var s,
      t,
      p,
      a = this;
    if (!(a instanceof o)) return new o(u);
    if (((a.constructor = o), lr(u))) {
      ((a.s = u.s),
        E
          ? !u.d || u.e > o.maxE
            ? ((a.e = NaN), (a.d = null))
            : u.e < o.minE
              ? ((a.e = 0), (a.d = [0]))
              : ((a.e = u.e), (a.d = u.d.slice()))
          : ((a.e = u.e), (a.d = u.d ? u.d.slice() : u.d)));
      return;
    }
    if (((p = typeof u), p === 'number')) {
      if (u === 0) {
        ((a.s = 1 / u < 0 ? -1 : 1), (a.e = 0), (a.d = [0]));
        return;
      }
      if ((u < 0 ? ((u = -u), (a.s = -1)) : (a.s = 1), u === ~~u && u < 1e7)) {
        for (s = 0, t = u; t >= 10; t /= 10) s++;
        E
          ? s > o.maxE
            ? ((a.e = NaN), (a.d = null))
            : s < o.minE
              ? ((a.e = 0), (a.d = [0]))
              : ((a.e = s), (a.d = [u]))
          : ((a.e = s), (a.d = [u]));
        return;
      }
      if (u * 0 !== 0) {
        (u || (a.s = NaN), (a.e = NaN), (a.d = null));
        return;
      }
      return $e(a, u.toString());
    }
    if (p === 'string')
      return (
        (t = u.charCodeAt(0)) === 45
          ? ((u = u.slice(1)), (a.s = -1))
          : (t === 43 && (u = u.slice(1)), (a.s = 1)),
        dr.test(u) ? $e(a, u) : Vr(a, u)
      );
    if (p === 'bigint') return (u < 0 ? ((u = -u), (a.s = -1)) : (a.s = 1), $e(a, u.toString()));
    throw Error(he + u);
  }
  if (
    ((o.prototype = P),
    (o.ROUND_UP = 0),
    (o.ROUND_DOWN = 1),
    (o.ROUND_CEIL = 2),
    (o.ROUND_FLOOR = 3),
    (o.ROUND_HALF_UP = 4),
    (o.ROUND_HALF_DOWN = 5),
    (o.ROUND_HALF_EVEN = 6),
    (o.ROUND_HALF_CEIL = 7),
    (o.ROUND_HALF_FLOOR = 8),
    (o.EUCLID = 9),
    (o.config = o.set = et),
    (o.clone = kr),
    (o.isDecimal = lr),
    (o.abs = Fr),
    (o.acos = zr),
    (o.acosh = Zr),
    (o.add = Qr),
    (o.asin = Br),
    (o.asinh = Hr),
    (o.atan = Kr),
    (o.atanh = Wr),
    (o.atan2 = Xr),
    (o.cbrt = Yr),
    (o.ceil = Jr),
    (o.clamp = Gr),
    (o.cos = rt),
    (o.cosh = tt),
    (o.div = st),
    (o.exp = at),
    (o.floor = it),
    (o.hypot = nt),
    (o.ln = ot),
    (o.log = ut),
    (o.log10 = mt),
    (o.log2 = lt),
    (o.max = pt),
    (o.min = ft),
    (o.mod = ct),
    (o.mul = dt),
    (o.pow = ht),
    (o.random = yt),
    (o.round = vt),
    (o.sign = gt),
    (o.sin = wt),
    (o.sinh = kt),
    (o.sqrt = bt),
    (o.sub = Pt),
    (o.sum = At),
    (o.tan = _t),
    (o.tanh = It),
    (o.trunc = Ct),
    e === void 0 && (e = {}),
    e && e.defaults !== !0)
  )
    for (
      n = ['precision', 'rounding', 'toExpNeg', 'toExpPos', 'maxE', 'minE', 'modulo', 'crypto'],
        r = 0;
      r < n.length;
    )
      e.hasOwnProperty((i = n[r++])) || (e[i] = this[i]);
  return (o.config(e), o);
}
function st(e, r) {
  return new this(e).div(r);
}
function at(e) {
  return new this(e).exp();
}
function it(e) {
  return $((e = new this(e)), e.e + 1, 3);
}
function nt() {
  var e,
    r,
    i = new this(0);
  for (E = !1, e = 0; e < arguments.length; )
    if (((r = new this(arguments[e++])), r.d)) i.d && (i = i.plus(r.times(r)));
    else {
      if (r.s) return ((E = !0), new this(1 / 0));
      i = r;
    }
  return ((E = !0), i.sqrt());
}
function lr(e) {
  return e instanceof Oe || (e && e.toStringTag === cr) || !1;
}
function ot(e) {
  return new this(e).ln();
}
function ut(e, r) {
  return new this(e).log(r);
}
function lt(e) {
  return new this(e).log(2);
}
function mt(e) {
  return new this(e).log(10);
}
function pt() {
  return vr(this, arguments, -1);
}
function ft() {
  return vr(this, arguments, 1);
}
function ct(e, r) {
  return new this(e).mod(r);
}
function dt(e, r) {
  return new this(e).mul(r);
}
function ht(e, r) {
  return new this(e).pow(r);
}
function yt(e) {
  var r,
    i,
    n,
    o,
    u = 0,
    s = new this(1),
    t = [];
  if ((e === void 0 ? (e = this.precision) : ee(e, 1, ye), (n = Math.ceil(e / T)), this.crypto))
    if (crypto.getRandomValues)
      for (r = crypto.getRandomValues(new Uint32Array(n)); u < n; )
        ((o = r[u]),
          o >= 429e7 ? (r[u] = crypto.getRandomValues(new Uint32Array(1))[0]) : (t[u++] = o % 1e7));
    else if (crypto.randomBytes) {
      for (r = crypto.randomBytes((n *= 4)); u < n; )
        ((o = r[u] + (r[u + 1] << 8) + (r[u + 2] << 16) + ((r[u + 3] & 127) << 24)),
          o >= 214e7 ? crypto.randomBytes(4).copy(r, u) : (t.push(o % 1e7), (u += 4)));
      u = n / 4;
    } else throw Error(fr);
  else for (; u < n; ) t[u++] = (Math.random() * 1e7) | 0;
  for (
    n = t[--u], e %= T, n && e && ((o = K(10, T - e)), (t[u] = ((n / o) | 0) * o));
    t[u] === 0;
    u--
  )
    t.pop();
  if (u < 0) ((i = 0), (t = [0]));
  else {
    for (i = -1; t[0] === 0; i -= T) t.shift();
    for (n = 1, o = t[0]; o >= 10; o /= 10) n++;
    n < T && (i -= T - n);
  }
  return ((s.e = i), (s.d = t), s);
}
function vt(e) {
  return $((e = new this(e)), e.e + 1, this.rounding);
}
function gt(e) {
  return ((e = new this(e)), e.d ? (e.d[0] ? e.s : 0 * e.s) : e.s || NaN);
}
function wt(e) {
  return new this(e).sin();
}
function kt(e) {
  return new this(e).sinh();
}
function bt(e) {
  return new this(e).sqrt();
}
function Pt(e, r) {
  return new this(e).sub(r);
}
function At() {
  var e = 0,
    r = arguments,
    i = new this(r[e]);
  for (E = !1; i.s && ++e < r.length; ) i = i.plus(r[e]);
  return ((E = !0), $(i, this.precision, this.rounding));
}
function _t(e) {
  return new this(e).tan();
}
function It(e) {
  return new this(e).tanh();
}
function Ct(e) {
  return $((e = new this(e)), e.e + 1, 1);
}
P[Symbol.for('nodejs.util.inspect.custom')] = P.toString;
P[Symbol.toStringTag] = 'Decimal';
var Oe = (P.constructor = kr(Qe));
Te = new Oe(Te);
Re = new Oe(Re);
var Ae = Oe;
var Ot = Object.create,
  Pr = Object.defineProperty,
  xt = Object.getOwnPropertyDescriptor,
  Ar = Object.getOwnPropertyNames,
  Nt = Object.getPrototypeOf,
  Lt = Object.prototype.hasOwnProperty,
  _r = (e, r) =>
    function () {
      return (r || (0, e[Ar(e)[0]])((r = { exports: {} }).exports, r), r.exports);
    },
  St = (e, r, i, n) => {
    if ((r && typeof r == 'object') || typeof r == 'function')
      for (let o of Ar(r))
        !Lt.call(e, o) &&
          o !== i &&
          Pr(e, o, { get: () => r[o], enumerable: !(n = xt(r, o)) || n.enumerable });
    return e;
  },
  qt = (e, r, i) => (
    (i = e != null ? Ot(Nt(e)) : {}),
    St(r || !e || !e.__esModule ? Pr(i, 'default', { value: e, enumerable: !0 }) : i, e)
  ),
  $t = _r({
    'node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.20.0/node_modules/ajv-formats/dist/formats.js'(e) {
      'use strict';
      (Object.defineProperty(e, '__esModule', { value: !0 }),
        (e.formatNames = e.fastFormats = e.fullFormats = void 0));
      function r(O, R) {
        return { validate: O, compare: R };
      }
      ((e.fullFormats = {
        date: r(u, s),
        time: r(p(!0), a),
        'date-time': r(h(!0), l),
        'iso-time': r(p(), d),
        'iso-date-time': r(h(), y),
        duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
        uri: _,
        'uri-reference':
          /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
        'uri-template':
          /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
        url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
        email:
          /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
        hostname:
          /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
        ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
        ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
        regex: te,
        uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
        'json-pointer': /^(?:\/(?:[^~/]|~0|~1)*)*$/,
        'json-pointer-uri-fragment': /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
        'relative-json-pointer': /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
        byte: f,
        int32: { type: 'number', validate: w },
        int64: { type: 'number', validate: v },
        float: { type: 'number', validate: C },
        double: { type: 'number', validate: C },
        password: !0,
        binary: !0,
      }),
        (e.fastFormats = {
          ...e.fullFormats,
          date: r(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, s),
          time: r(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, a),
          'date-time': r(
            /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
            l,
          ),
          'iso-time': r(
            /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
            d,
          ),
          'iso-date-time': r(
            /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
            y,
          ),
          uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
          'uri-reference':
            /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
          email:
            /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
        }),
        (e.formatNames = Object.keys(e.fullFormats)));
      function i(O) {
        return O % 4 === 0 && (O % 100 !== 0 || O % 400 === 0);
      }
      var n = /^(\d\d\d\d)-(\d\d)-(\d\d)$/,
        o = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      function u(O) {
        let R = n.exec(O);
        if (!R) return !1;
        let q = +R[1],
          S = +R[2],
          j = +R[3];
        return S >= 1 && S <= 12 && j >= 1 && j <= (S === 2 && i(q) ? 29 : o[S]);
      }
      function s(O, R) {
        if (O && R) return O > R ? 1 : O < R ? -1 : 0;
      }
      var t = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
      function p(O) {
        return function (q) {
          let S = t.exec(q);
          if (!S) return !1;
          let j = +S[1],
            U = +S[2],
            Ie = +S[3],
            $r = S[4],
            sr = S[5] === '-' ? -1 : 1,
            ar = +(S[6] || 0),
            ir = +(S[7] || 0);
          if (ar > 23 || ir > 59 || (O && !$r)) return !1;
          if (j <= 23 && U <= 59 && Ie < 60) return !0;
          let ze = U - ir * sr,
            nr = j - ar * sr - (ze < 0 ? 1 : 0);
          return (nr === 23 || nr === -1) && (ze === 59 || ze === -1) && Ie < 61;
        };
      }
      function a(O, R) {
        if (!(O && R)) return;
        let q = new Date('2020-01-01T' + O).valueOf(),
          S = new Date('2020-01-01T' + R).valueOf();
        if (q && S) return q - S;
      }
      function d(O, R) {
        if (!(O && R)) return;
        let q = t.exec(O),
          S = t.exec(R);
        if (q && S)
          return ((O = q[1] + q[2] + q[3]), (R = S[1] + S[2] + S[3]), O > R ? 1 : O < R ? -1 : 0);
      }
      var c = /t|\s/i;
      function h(O) {
        let R = p(O);
        return function (S) {
          let j = S.split(c);
          return j.length === 2 && u(j[0]) && R(j[1]);
        };
      }
      function l(O, R) {
        if (!(O && R)) return;
        let q = new Date(O).valueOf(),
          S = new Date(R).valueOf();
        if (q && S) return q - S;
      }
      function y(O, R) {
        if (!(O && R)) return;
        let [q, S] = O.split(c),
          [j, U] = R.split(c),
          Ie = s(q, j);
        if (Ie !== void 0) return Ie || a(S, U);
      }
      var b = /\/|:/,
        g =
          /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
      function _(O) {
        return b.test(O) && g.test(O);
      }
      var m = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
      function f(O) {
        return ((m.lastIndex = 0), m.test(O));
      }
      var A = -(2 ** 31),
        L = 2 ** 31 - 1;
      function w(O) {
        return Number.isInteger(O) && O <= L && O >= A;
      }
      function v(O) {
        return Number.isInteger(O);
      }
      function C() {
        return !0;
      }
      var k = /[^\\]\\Z/;
      function te(O) {
        if (k.test(O)) return !1;
        try {
          return (new RegExp(O), !0);
        } catch {
          return !1;
        }
      }
    },
  }),
  Tt = _r({
    'node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/ucs2length.js'(e) {
      'use strict';
      Object.defineProperty(e, '__esModule', { value: !0 });
      function r(i) {
        let n = i.length,
          o = 0,
          u = 0,
          s;
        for (; u < n; )
          (o++,
            (s = i.charCodeAt(u++)),
            s >= 55296 &&
              s <= 56319 &&
              u < n &&
              ((s = i.charCodeAt(u)), (s & 64512) === 56320 && u++));
        return o;
      }
      ((e.default = r), (r.code = 'require("ajv/dist/runtime/ucs2length").default'));
    },
  }),
  Xe = qt($t()),
  Ye = N,
  pe = {
    type: 'object',
    properties: {
      providerId: { type: 'string', maxLength: 512 },
      subjectCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
      priceCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
      unitAmount: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
      buy: {
        anyOf: [
          { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
          { type: 'null' },
        ],
      },
      sell: {
        anyOf: [
          { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
          { type: 'null' },
        ],
      },
      sourcePublishedAt: {
        anyOf: [{ type: 'string', format: 'date-time', maxLength: 512 }, { type: 'null' }],
      },
      fetchedAt: { type: 'string', format: 'date-time', maxLength: 512 },
      lastSuccessfulCheckAt: { type: 'string', format: 'date-time', maxLength: 512 },
      serviceCountry: { type: 'string', pattern: '^[A-Z]{2}$', maxLength: 512 },
      deliveryMethod: { enum: ['cash', 'account'] },
      channel: { enum: ['branch', 'online', 'atm', 'unknown'] },
      branchId: { type: 'string', maxLength: 512 },
      denominations: {
        type: 'array',
        items: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        maxItems: 100,
      },
      amountRange: {
        type: 'object',
        properties: {
          currency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
          min: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
          max: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        },
        required: ['currency', 'min', 'max'],
        additionalProperties: !1,
      },
      qualifications: { type: 'array', items: { type: 'string', maxLength: 512 }, maxItems: 100 },
      feeStatus: { enum: ['unknown', 'no_additional_fee', 'unsupported'] },
      sourceUrl: { type: 'string', maxLength: 512 },
      originalBuyField: { type: 'string', maxLength: 512 },
      originalSellField: { type: 'string', maxLength: 512 },
      mappingVersion: { type: 'string', maxLength: 512 },
      originalUnitAmount: {
        type: 'string',
        pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
        maxLength: 512,
      },
      dataKind: { enum: ['published_board', 'fixed_fallback', 'reference', 'derived_cross'] },
      feeEvidenceUrl: { type: 'string', minLength: 1, maxLength: 512, pattern: '^https://' },
    },
    required: [
      'providerId',
      'subjectCurrency',
      'priceCurrency',
      'unitAmount',
      'buy',
      'sell',
      'sourcePublishedAt',
      'fetchedAt',
      'lastSuccessfulCheckAt',
      'serviceCountry',
      'deliveryMethod',
      'channel',
    ],
    additionalProperties: !1,
  },
  Ne = Object.prototype.hasOwnProperty,
  I = Tt().default,
  ie = new RegExp('^[A-Z]{3}$', 'u'),
  Z = new RegExp('^(0|[1-9][0-9]*)(\\.[0-9]+)?$', 'u'),
  Je = new RegExp('^[A-Z]{2}$', 'u'),
  Ir = new RegExp('^https://', 'u'),
  oe = Xe.fullFormats['date-time'];
function N(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = N.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let g;
      if (
        (e.providerId === void 0 && (g = 'providerId')) ||
        (e.subjectCurrency === void 0 && (g = 'subjectCurrency')) ||
        (e.priceCurrency === void 0 && (g = 'priceCurrency')) ||
        (e.unitAmount === void 0 && (g = 'unitAmount')) ||
        (e.buy === void 0 && (g = 'buy')) ||
        (e.sell === void 0 && (g = 'sell')) ||
        (e.sourcePublishedAt === void 0 && (g = 'sourcePublishedAt')) ||
        (e.fetchedAt === void 0 && (g = 'fetchedAt')) ||
        (e.lastSuccessfulCheckAt === void 0 && (g = 'lastSuccessfulCheckAt')) ||
        (e.serviceCountry === void 0 && (g = 'serviceCountry')) ||
        (e.deliveryMethod === void 0 && (g = 'deliveryMethod')) ||
        (e.channel === void 0 && (g = 'channel'))
      )
        return (
          (N.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: g },
              message: "must have required property '" + g + "'",
            },
          ]),
          !1
        );
      {
        let _ = t;
        for (let m in e)
          if (!Ne.call(pe.properties, m)) {
            return (
              (N.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: m },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (_ === t) {
          if (e.providerId !== void 0) {
            let m = e.providerId,
              f = t;
            if (t === f)
              if (typeof m == 'string') {
                if (I(m) > 512)
                  return (
                    (N.errors = [
                      {
                        instancePath: r + '/providerId',
                        schemaPath: '#/properties/providerId/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ]),
                    !1
                  );
              } else
                return (
                  (N.errors = [
                    {
                      instancePath: r + '/providerId',
                      schemaPath: '#/properties/providerId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ]),
                  !1
                );
            var a = f === t;
          } else var a = !0;
          if (a) {
            if (e.subjectCurrency !== void 0) {
              let m = e.subjectCurrency,
                f = t;
              if (t === f)
                if (typeof m == 'string') {
                  if (I(m) > 512)
                    return (
                      (N.errors = [
                        {
                          instancePath: r + '/subjectCurrency',
                          schemaPath: '#/properties/subjectCurrency/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ]),
                      !1
                    );
                  if (!ie.test(m))
                    return (
                      (N.errors = [
                        {
                          instancePath: r + '/subjectCurrency',
                          schemaPath: '#/properties/subjectCurrency/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^[A-Z]{3}$' },
                          message: 'must match pattern "^[A-Z]{3}$"',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (N.errors = [
                      {
                        instancePath: r + '/subjectCurrency',
                        schemaPath: '#/properties/subjectCurrency/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = f === t;
            } else var a = !0;
            if (a) {
              if (e.priceCurrency !== void 0) {
                let m = e.priceCurrency,
                  f = t;
                if (t === f)
                  if (typeof m == 'string') {
                    if (I(m) > 512)
                      return (
                        (N.errors = [
                          {
                            instancePath: r + '/priceCurrency',
                            schemaPath: '#/properties/priceCurrency/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          },
                        ]),
                        !1
                      );
                    if (!ie.test(m))
                      return (
                        (N.errors = [
                          {
                            instancePath: r + '/priceCurrency',
                            schemaPath: '#/properties/priceCurrency/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^[A-Z]{3}$' },
                            message: 'must match pattern "^[A-Z]{3}$"',
                          },
                        ]),
                        !1
                      );
                  } else
                    return (
                      (N.errors = [
                        {
                          instancePath: r + '/priceCurrency',
                          schemaPath: '#/properties/priceCurrency/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ]),
                      !1
                    );
                var a = f === t;
              } else var a = !0;
              if (a) {
                if (e.unitAmount !== void 0) {
                  let m = e.unitAmount,
                    f = t;
                  if (t === f)
                    if (typeof m == 'string') {
                      if (I(m) > 512)
                        return (
                          (N.errors = [
                            {
                              instancePath: r + '/unitAmount',
                              schemaPath: '#/properties/unitAmount/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            },
                          ]),
                          !1
                        );
                      if (!Z.test(m))
                        return (
                          (N.errors = [
                            {
                              instancePath: r + '/unitAmount',
                              schemaPath: '#/properties/unitAmount/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                              message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                            },
                          ]),
                          !1
                        );
                    } else
                      return (
                        (N.errors = [
                          {
                            instancePath: r + '/unitAmount',
                            schemaPath: '#/properties/unitAmount/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ]),
                        !1
                      );
                  var a = f === t;
                } else var a = !0;
                if (a) {
                  if (e.buy !== void 0) {
                    let m = e.buy,
                      f = t,
                      A = t,
                      L = !1,
                      w = t;
                    if (t === w)
                      if (typeof m == 'string') {
                        if (I(m) > 512) {
                          let k = {
                            instancePath: r + '/buy',
                            schemaPath: '#/properties/buy/anyOf/0/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          };
                          (s === null ? (s = [k]) : s.push(k), t++);
                        } else if (!Z.test(m)) {
                          let k = {
                            instancePath: r + '/buy',
                            schemaPath: '#/properties/buy/anyOf/0/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                            message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                          };
                          (s === null ? (s = [k]) : s.push(k), t++);
                        }
                      } else {
                        let k = {
                          instancePath: r + '/buy',
                          schemaPath: '#/properties/buy/anyOf/0/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        };
                        (s === null ? (s = [k]) : s.push(k), t++);
                      }
                    var d = w === t;
                    L = L || d;
                    let v = t;
                    if (m !== null) {
                      let k = {
                        instancePath: r + '/buy',
                        schemaPath: '#/properties/buy/anyOf/1/type',
                        keyword: 'type',
                        params: { type: 'null' },
                        message: 'must be null',
                      };
                      (s === null ? (s = [k]) : s.push(k), t++);
                    }
                    var d = v === t;
                    if (((L = L || d), L))
                      ((t = A), s !== null && (A ? (s.length = A) : (s = null)));
                    else {
                      let k = {
                        instancePath: r + '/buy',
                        schemaPath: '#/properties/buy/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      return (s === null ? (s = [k]) : s.push(k), t++, (N.errors = s), !1);
                    }
                    var a = f === t;
                  } else var a = !0;
                  if (a) {
                    if (e.sell !== void 0) {
                      let m = e.sell,
                        f = t,
                        A = t,
                        L = !1,
                        w = t;
                      if (t === w)
                        if (typeof m == 'string') {
                          if (I(m) > 512) {
                            let k = {
                              instancePath: r + '/sell',
                              schemaPath: '#/properties/sell/anyOf/0/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            };
                            (s === null ? (s = [k]) : s.push(k), t++);
                          } else if (!Z.test(m)) {
                            let k = {
                              instancePath: r + '/sell',
                              schemaPath: '#/properties/sell/anyOf/0/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                              message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                            };
                            (s === null ? (s = [k]) : s.push(k), t++);
                          }
                        } else {
                          let k = {
                            instancePath: r + '/sell',
                            schemaPath: '#/properties/sell/anyOf/0/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          };
                          (s === null ? (s = [k]) : s.push(k), t++);
                        }
                      var c = w === t;
                      L = L || c;
                      let v = t;
                      if (m !== null) {
                        let k = {
                          instancePath: r + '/sell',
                          schemaPath: '#/properties/sell/anyOf/1/type',
                          keyword: 'type',
                          params: { type: 'null' },
                          message: 'must be null',
                        };
                        (s === null ? (s = [k]) : s.push(k), t++);
                      }
                      var c = v === t;
                      if (((L = L || c), L))
                        ((t = A), s !== null && (A ? (s.length = A) : (s = null)));
                      else {
                        let k = {
                          instancePath: r + '/sell',
                          schemaPath: '#/properties/sell/anyOf',
                          keyword: 'anyOf',
                          params: {},
                          message: 'must match a schema in anyOf',
                        };
                        return (s === null ? (s = [k]) : s.push(k), t++, (N.errors = s), !1);
                      }
                      var a = f === t;
                    } else var a = !0;
                    if (a) {
                      if (e.sourcePublishedAt !== void 0) {
                        let m = e.sourcePublishedAt,
                          f = t,
                          A = t,
                          L = !1,
                          w = t;
                        if (t === w && t === w)
                          if (typeof m == 'string') {
                            if (I(m) > 512) {
                              let k = {
                                instancePath: r + '/sourcePublishedAt',
                                schemaPath: '#/properties/sourcePublishedAt/anyOf/0/maxLength',
                                keyword: 'maxLength',
                                params: { limit: 512 },
                                message: 'must NOT have more than 512 characters',
                              };
                              (s === null ? (s = [k]) : s.push(k), t++);
                            } else if (!oe.validate(m)) {
                              let k = {
                                instancePath: r + '/sourcePublishedAt',
                                schemaPath: '#/properties/sourcePublishedAt/anyOf/0/format',
                                keyword: 'format',
                                params: { format: 'date-time' },
                                message: 'must match format "date-time"',
                              };
                              (s === null ? (s = [k]) : s.push(k), t++);
                            }
                          } else {
                            let k = {
                              instancePath: r + '/sourcePublishedAt',
                              schemaPath: '#/properties/sourcePublishedAt/anyOf/0/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            };
                            (s === null ? (s = [k]) : s.push(k), t++);
                          }
                        var h = w === t;
                        L = L || h;
                        let v = t;
                        if (m !== null) {
                          let k = {
                            instancePath: r + '/sourcePublishedAt',
                            schemaPath: '#/properties/sourcePublishedAt/anyOf/1/type',
                            keyword: 'type',
                            params: { type: 'null' },
                            message: 'must be null',
                          };
                          (s === null ? (s = [k]) : s.push(k), t++);
                        }
                        var h = v === t;
                        if (((L = L || h), L))
                          ((t = A), s !== null && (A ? (s.length = A) : (s = null)));
                        else {
                          let k = {
                            instancePath: r + '/sourcePublishedAt',
                            schemaPath: '#/properties/sourcePublishedAt/anyOf',
                            keyword: 'anyOf',
                            params: {},
                            message: 'must match a schema in anyOf',
                          };
                          return (s === null ? (s = [k]) : s.push(k), t++, (N.errors = s), !1);
                        }
                        var a = f === t;
                      } else var a = !0;
                      if (a) {
                        if (e.fetchedAt !== void 0) {
                          let m = e.fetchedAt,
                            f = t;
                          if (t === f && t === f)
                            if (typeof m == 'string') {
                              if (I(m) > 512)
                                return (
                                  (N.errors = [
                                    {
                                      instancePath: r + '/fetchedAt',
                                      schemaPath: '#/properties/fetchedAt/maxLength',
                                      keyword: 'maxLength',
                                      params: { limit: 512 },
                                      message: 'must NOT have more than 512 characters',
                                    },
                                  ]),
                                  !1
                                );
                              if (!oe.validate(m))
                                return (
                                  (N.errors = [
                                    {
                                      instancePath: r + '/fetchedAt',
                                      schemaPath: '#/properties/fetchedAt/format',
                                      keyword: 'format',
                                      params: { format: 'date-time' },
                                      message: 'must match format "date-time"',
                                    },
                                  ]),
                                  !1
                                );
                            } else
                              return (
                                (N.errors = [
                                  {
                                    instancePath: r + '/fetchedAt',
                                    schemaPath: '#/properties/fetchedAt/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  },
                                ]),
                                !1
                              );
                          var a = f === t;
                        } else var a = !0;
                        if (a) {
                          if (e.lastSuccessfulCheckAt !== void 0) {
                            let m = e.lastSuccessfulCheckAt,
                              f = t;
                            if (t === f && t === f)
                              if (typeof m == 'string') {
                                if (I(m) > 512)
                                  return (
                                    (N.errors = [
                                      {
                                        instancePath: r + '/lastSuccessfulCheckAt',
                                        schemaPath: '#/properties/lastSuccessfulCheckAt/maxLength',
                                        keyword: 'maxLength',
                                        params: { limit: 512 },
                                        message: 'must NOT have more than 512 characters',
                                      },
                                    ]),
                                    !1
                                  );
                                if (!oe.validate(m))
                                  return (
                                    (N.errors = [
                                      {
                                        instancePath: r + '/lastSuccessfulCheckAt',
                                        schemaPath: '#/properties/lastSuccessfulCheckAt/format',
                                        keyword: 'format',
                                        params: { format: 'date-time' },
                                        message: 'must match format "date-time"',
                                      },
                                    ]),
                                    !1
                                  );
                              } else
                                return (
                                  (N.errors = [
                                    {
                                      instancePath: r + '/lastSuccessfulCheckAt',
                                      schemaPath: '#/properties/lastSuccessfulCheckAt/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ]),
                                  !1
                                );
                            var a = f === t;
                          } else var a = !0;
                          if (a) {
                            if (e.serviceCountry !== void 0) {
                              let m = e.serviceCountry,
                                f = t;
                              if (t === f)
                                if (typeof m == 'string') {
                                  if (I(m) > 512)
                                    return (
                                      (N.errors = [
                                        {
                                          instancePath: r + '/serviceCountry',
                                          schemaPath: '#/properties/serviceCountry/maxLength',
                                          keyword: 'maxLength',
                                          params: { limit: 512 },
                                          message: 'must NOT have more than 512 characters',
                                        },
                                      ]),
                                      !1
                                    );
                                  if (!Je.test(m))
                                    return (
                                      (N.errors = [
                                        {
                                          instancePath: r + '/serviceCountry',
                                          schemaPath: '#/properties/serviceCountry/pattern',
                                          keyword: 'pattern',
                                          params: { pattern: '^[A-Z]{2}$' },
                                          message: 'must match pattern "^[A-Z]{2}$"',
                                        },
                                      ]),
                                      !1
                                    );
                                } else
                                  return (
                                    (N.errors = [
                                      {
                                        instancePath: r + '/serviceCountry',
                                        schemaPath: '#/properties/serviceCountry/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      },
                                    ]),
                                    !1
                                  );
                              var a = f === t;
                            } else var a = !0;
                            if (a) {
                              if (e.deliveryMethod !== void 0) {
                                let m = e.deliveryMethod,
                                  f = t;
                                if (!(m === 'cash' || m === 'account'))
                                  return (
                                    (N.errors = [
                                      {
                                        instancePath: r + '/deliveryMethod',
                                        schemaPath: '#/properties/deliveryMethod/enum',
                                        keyword: 'enum',
                                        params: {
                                          allowedValues: pe.properties.deliveryMethod.enum,
                                        },
                                        message: 'must be equal to one of the allowed values',
                                      },
                                    ]),
                                    !1
                                  );
                                var a = f === t;
                              } else var a = !0;
                              if (a) {
                                if (e.channel !== void 0) {
                                  let m = e.channel,
                                    f = t;
                                  if (
                                    !(
                                      m === 'branch' ||
                                      m === 'online' ||
                                      m === 'atm' ||
                                      m === 'unknown'
                                    )
                                  )
                                    return (
                                      (N.errors = [
                                        {
                                          instancePath: r + '/channel',
                                          schemaPath: '#/properties/channel/enum',
                                          keyword: 'enum',
                                          params: { allowedValues: pe.properties.channel.enum },
                                          message: 'must be equal to one of the allowed values',
                                        },
                                      ]),
                                      !1
                                    );
                                  var a = f === t;
                                } else var a = !0;
                                if (a) {
                                  if (e.branchId !== void 0) {
                                    let m = e.branchId,
                                      f = t;
                                    if (t === f)
                                      if (typeof m == 'string') {
                                        if (I(m) > 512)
                                          return (
                                            (N.errors = [
                                              {
                                                instancePath: r + '/branchId',
                                                schemaPath: '#/properties/branchId/maxLength',
                                                keyword: 'maxLength',
                                                params: { limit: 512 },
                                                message: 'must NOT have more than 512 characters',
                                              },
                                            ]),
                                            !1
                                          );
                                      } else
                                        return (
                                          (N.errors = [
                                            {
                                              instancePath: r + '/branchId',
                                              schemaPath: '#/properties/branchId/type',
                                              keyword: 'type',
                                              params: { type: 'string' },
                                              message: 'must be string',
                                            },
                                          ]),
                                          !1
                                        );
                                    var a = f === t;
                                  } else var a = !0;
                                  if (a) {
                                    if (e.denominations !== void 0) {
                                      let m = e.denominations,
                                        f = t;
                                      if (t === f)
                                        if (Array.isArray(m)) {
                                          if (m.length > 100)
                                            return (
                                              (N.errors = [
                                                {
                                                  instancePath: r + '/denominations',
                                                  schemaPath: '#/properties/denominations/maxItems',
                                                  keyword: 'maxItems',
                                                  params: { limit: 100 },
                                                  message: 'must NOT have more than 100 items',
                                                },
                                              ]),
                                              !1
                                            );
                                          {
                                            var l = !0;
                                            let L = m.length;
                                            for (let w = 0; w < L; w++) {
                                              let v = m[w],
                                                C = t;
                                              if (t === C)
                                                if (typeof v == 'string') {
                                                  if (I(v) > 512)
                                                    return (
                                                      (N.errors = [
                                                        {
                                                          instancePath: r + '/denominations/' + w,
                                                          schemaPath:
                                                            '#/properties/denominations/items/maxLength',
                                                          keyword: 'maxLength',
                                                          params: { limit: 512 },
                                                          message:
                                                            'must NOT have more than 512 characters',
                                                        },
                                                      ]),
                                                      !1
                                                    );
                                                  if (!Z.test(v))
                                                    return (
                                                      (N.errors = [
                                                        {
                                                          instancePath: r + '/denominations/' + w,
                                                          schemaPath:
                                                            '#/properties/denominations/items/pattern',
                                                          keyword: 'pattern',
                                                          params: {
                                                            pattern:
                                                              '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                          },
                                                          message:
                                                            'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                        },
                                                      ]),
                                                      !1
                                                    );
                                                } else
                                                  return (
                                                    (N.errors = [
                                                      {
                                                        instancePath: r + '/denominations/' + w,
                                                        schemaPath:
                                                          '#/properties/denominations/items/type',
                                                        keyword: 'type',
                                                        params: { type: 'string' },
                                                        message: 'must be string',
                                                      },
                                                    ]),
                                                    !1
                                                  );
                                              var l = C === t;
                                              if (!l) break;
                                            }
                                          }
                                        } else
                                          return (
                                            (N.errors = [
                                              {
                                                instancePath: r + '/denominations',
                                                schemaPath: '#/properties/denominations/type',
                                                keyword: 'type',
                                                params: { type: 'array' },
                                                message: 'must be array',
                                              },
                                            ]),
                                            !1
                                          );
                                      var a = f === t;
                                    } else var a = !0;
                                    if (a) {
                                      if (e.amountRange !== void 0) {
                                        let m = e.amountRange,
                                          f = t;
                                        if (t === f)
                                          if (m && typeof m == 'object' && !Array.isArray(m)) {
                                            let L;
                                            if (
                                              (m.currency === void 0 && (L = 'currency')) ||
                                              (m.min === void 0 && (L = 'min')) ||
                                              (m.max === void 0 && (L = 'max'))
                                            )
                                              return (
                                                (N.errors = [
                                                  {
                                                    instancePath: r + '/amountRange',
                                                    schemaPath: '#/properties/amountRange/required',
                                                    keyword: 'required',
                                                    params: { missingProperty: L },
                                                    message:
                                                      "must have required property '" + L + "'",
                                                  },
                                                ]),
                                                !1
                                              );
                                            {
                                              let w = t;
                                              for (let v in m)
                                                if (
                                                  !(v === 'currency' || v === 'min' || v === 'max')
                                                ) {
                                                  return (
                                                    (N.errors = [
                                                      {
                                                        instancePath: r + '/amountRange',
                                                        schemaPath:
                                                          '#/properties/amountRange/additionalProperties',
                                                        keyword: 'additionalProperties',
                                                        params: { additionalProperty: v },
                                                        message:
                                                          'must NOT have additional properties',
                                                      },
                                                    ]),
                                                    !1
                                                  );
                                                  break;
                                                }
                                              if (w === t) {
                                                if (m.currency !== void 0) {
                                                  let v = m.currency,
                                                    C = t;
                                                  if (t === C)
                                                    if (typeof v == 'string') {
                                                      if (I(v) > 512)
                                                        return (
                                                          (N.errors = [
                                                            {
                                                              instancePath:
                                                                r + '/amountRange/currency',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/currency/maxLength',
                                                              keyword: 'maxLength',
                                                              params: { limit: 512 },
                                                              message:
                                                                'must NOT have more than 512 characters',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                      if (!ie.test(v))
                                                        return (
                                                          (N.errors = [
                                                            {
                                                              instancePath:
                                                                r + '/amountRange/currency',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/currency/pattern',
                                                              keyword: 'pattern',
                                                              params: { pattern: '^[A-Z]{3}$' },
                                                              message:
                                                                'must match pattern "^[A-Z]{3}$"',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                    } else
                                                      return (
                                                        (N.errors = [
                                                          {
                                                            instancePath:
                                                              r + '/amountRange/currency',
                                                            schemaPath:
                                                              '#/properties/amountRange/properties/currency/type',
                                                            keyword: 'type',
                                                            params: { type: 'string' },
                                                            message: 'must be string',
                                                          },
                                                        ]),
                                                        !1
                                                      );
                                                  var y = C === t;
                                                } else var y = !0;
                                                if (y) {
                                                  if (m.min !== void 0) {
                                                    let v = m.min,
                                                      C = t;
                                                    if (t === C)
                                                      if (typeof v == 'string') {
                                                        if (I(v) > 512)
                                                          return (
                                                            (N.errors = [
                                                              {
                                                                instancePath:
                                                                  r + '/amountRange/min',
                                                                schemaPath:
                                                                  '#/properties/amountRange/properties/min/maxLength',
                                                                keyword: 'maxLength',
                                                                params: { limit: 512 },
                                                                message:
                                                                  'must NOT have more than 512 characters',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                        if (!Z.test(v))
                                                          return (
                                                            (N.errors = [
                                                              {
                                                                instancePath:
                                                                  r + '/amountRange/min',
                                                                schemaPath:
                                                                  '#/properties/amountRange/properties/min/pattern',
                                                                keyword: 'pattern',
                                                                params: {
                                                                  pattern:
                                                                    '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                },
                                                                message:
                                                                  'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                      } else
                                                        return (
                                                          (N.errors = [
                                                            {
                                                              instancePath: r + '/amountRange/min',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/min/type',
                                                              keyword: 'type',
                                                              params: { type: 'string' },
                                                              message: 'must be string',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                    var y = C === t;
                                                  } else var y = !0;
                                                  if (y)
                                                    if (m.max !== void 0) {
                                                      let v = m.max,
                                                        C = t;
                                                      if (t === C)
                                                        if (typeof v == 'string') {
                                                          if (I(v) > 512)
                                                            return (
                                                              (N.errors = [
                                                                {
                                                                  instancePath:
                                                                    r + '/amountRange/max',
                                                                  schemaPath:
                                                                    '#/properties/amountRange/properties/max/maxLength',
                                                                  keyword: 'maxLength',
                                                                  params: { limit: 512 },
                                                                  message:
                                                                    'must NOT have more than 512 characters',
                                                                },
                                                              ]),
                                                              !1
                                                            );
                                                          if (!Z.test(v))
                                                            return (
                                                              (N.errors = [
                                                                {
                                                                  instancePath:
                                                                    r + '/amountRange/max',
                                                                  schemaPath:
                                                                    '#/properties/amountRange/properties/max/pattern',
                                                                  keyword: 'pattern',
                                                                  params: {
                                                                    pattern:
                                                                      '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                  },
                                                                  message:
                                                                    'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                                },
                                                              ]),
                                                              !1
                                                            );
                                                        } else
                                                          return (
                                                            (N.errors = [
                                                              {
                                                                instancePath:
                                                                  r + '/amountRange/max',
                                                                schemaPath:
                                                                  '#/properties/amountRange/properties/max/type',
                                                                keyword: 'type',
                                                                params: { type: 'string' },
                                                                message: 'must be string',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                      var y = C === t;
                                                    } else var y = !0;
                                                }
                                              }
                                            }
                                          } else
                                            return (
                                              (N.errors = [
                                                {
                                                  instancePath: r + '/amountRange',
                                                  schemaPath: '#/properties/amountRange/type',
                                                  keyword: 'type',
                                                  params: { type: 'object' },
                                                  message: 'must be object',
                                                },
                                              ]),
                                              !1
                                            );
                                        var a = f === t;
                                      } else var a = !0;
                                      if (a) {
                                        if (e.qualifications !== void 0) {
                                          let m = e.qualifications,
                                            f = t;
                                          if (t === f)
                                            if (Array.isArray(m)) {
                                              if (m.length > 100)
                                                return (
                                                  (N.errors = [
                                                    {
                                                      instancePath: r + '/qualifications',
                                                      schemaPath:
                                                        '#/properties/qualifications/maxItems',
                                                      keyword: 'maxItems',
                                                      params: { limit: 100 },
                                                      message: 'must NOT have more than 100 items',
                                                    },
                                                  ]),
                                                  !1
                                                );
                                              {
                                                var b = !0;
                                                let L = m.length;
                                                for (let w = 0; w < L; w++) {
                                                  let v = m[w],
                                                    C = t;
                                                  if (t === C)
                                                    if (typeof v == 'string') {
                                                      if (I(v) > 512)
                                                        return (
                                                          (N.errors = [
                                                            {
                                                              instancePath:
                                                                r + '/qualifications/' + w,
                                                              schemaPath:
                                                                '#/properties/qualifications/items/maxLength',
                                                              keyword: 'maxLength',
                                                              params: { limit: 512 },
                                                              message:
                                                                'must NOT have more than 512 characters',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                    } else
                                                      return (
                                                        (N.errors = [
                                                          {
                                                            instancePath:
                                                              r + '/qualifications/' + w,
                                                            schemaPath:
                                                              '#/properties/qualifications/items/type',
                                                            keyword: 'type',
                                                            params: { type: 'string' },
                                                            message: 'must be string',
                                                          },
                                                        ]),
                                                        !1
                                                      );
                                                  var b = C === t;
                                                  if (!b) break;
                                                }
                                              }
                                            } else
                                              return (
                                                (N.errors = [
                                                  {
                                                    instancePath: r + '/qualifications',
                                                    schemaPath: '#/properties/qualifications/type',
                                                    keyword: 'type',
                                                    params: { type: 'array' },
                                                    message: 'must be array',
                                                  },
                                                ]),
                                                !1
                                              );
                                          var a = f === t;
                                        } else var a = !0;
                                        if (a) {
                                          if (e.feeStatus !== void 0) {
                                            let m = e.feeStatus,
                                              f = t;
                                            if (
                                              !(
                                                m === 'unknown' ||
                                                m === 'no_additional_fee' ||
                                                m === 'unsupported'
                                              )
                                            )
                                              return (
                                                (N.errors = [
                                                  {
                                                    instancePath: r + '/feeStatus',
                                                    schemaPath: '#/properties/feeStatus/enum',
                                                    keyword: 'enum',
                                                    params: {
                                                      allowedValues: pe.properties.feeStatus.enum,
                                                    },
                                                    message:
                                                      'must be equal to one of the allowed values',
                                                  },
                                                ]),
                                                !1
                                              );
                                            var a = f === t;
                                          } else var a = !0;
                                          if (a) {
                                            if (e.sourceUrl !== void 0) {
                                              let m = e.sourceUrl,
                                                f = t;
                                              if (t === f)
                                                if (typeof m == 'string') {
                                                  if (I(m) > 512)
                                                    return (
                                                      (N.errors = [
                                                        {
                                                          instancePath: r + '/sourceUrl',
                                                          schemaPath:
                                                            '#/properties/sourceUrl/maxLength',
                                                          keyword: 'maxLength',
                                                          params: { limit: 512 },
                                                          message:
                                                            'must NOT have more than 512 characters',
                                                        },
                                                      ]),
                                                      !1
                                                    );
                                                } else
                                                  return (
                                                    (N.errors = [
                                                      {
                                                        instancePath: r + '/sourceUrl',
                                                        schemaPath: '#/properties/sourceUrl/type',
                                                        keyword: 'type',
                                                        params: { type: 'string' },
                                                        message: 'must be string',
                                                      },
                                                    ]),
                                                    !1
                                                  );
                                              var a = f === t;
                                            } else var a = !0;
                                            if (a) {
                                              if (e.originalBuyField !== void 0) {
                                                let m = e.originalBuyField,
                                                  f = t;
                                                if (t === f)
                                                  if (typeof m == 'string') {
                                                    if (I(m) > 512)
                                                      return (
                                                        (N.errors = [
                                                          {
                                                            instancePath: r + '/originalBuyField',
                                                            schemaPath:
                                                              '#/properties/originalBuyField/maxLength',
                                                            keyword: 'maxLength',
                                                            params: { limit: 512 },
                                                            message:
                                                              'must NOT have more than 512 characters',
                                                          },
                                                        ]),
                                                        !1
                                                      );
                                                  } else
                                                    return (
                                                      (N.errors = [
                                                        {
                                                          instancePath: r + '/originalBuyField',
                                                          schemaPath:
                                                            '#/properties/originalBuyField/type',
                                                          keyword: 'type',
                                                          params: { type: 'string' },
                                                          message: 'must be string',
                                                        },
                                                      ]),
                                                      !1
                                                    );
                                                var a = f === t;
                                              } else var a = !0;
                                              if (a) {
                                                if (e.originalSellField !== void 0) {
                                                  let m = e.originalSellField,
                                                    f = t;
                                                  if (t === f)
                                                    if (typeof m == 'string') {
                                                      if (I(m) > 512)
                                                        return (
                                                          (N.errors = [
                                                            {
                                                              instancePath:
                                                                r + '/originalSellField',
                                                              schemaPath:
                                                                '#/properties/originalSellField/maxLength',
                                                              keyword: 'maxLength',
                                                              params: { limit: 512 },
                                                              message:
                                                                'must NOT have more than 512 characters',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                    } else
                                                      return (
                                                        (N.errors = [
                                                          {
                                                            instancePath: r + '/originalSellField',
                                                            schemaPath:
                                                              '#/properties/originalSellField/type',
                                                            keyword: 'type',
                                                            params: { type: 'string' },
                                                            message: 'must be string',
                                                          },
                                                        ]),
                                                        !1
                                                      );
                                                  var a = f === t;
                                                } else var a = !0;
                                                if (a) {
                                                  if (e.mappingVersion !== void 0) {
                                                    let m = e.mappingVersion,
                                                      f = t;
                                                    if (t === f)
                                                      if (typeof m == 'string') {
                                                        if (I(m) > 512)
                                                          return (
                                                            (N.errors = [
                                                              {
                                                                instancePath: r + '/mappingVersion',
                                                                schemaPath:
                                                                  '#/properties/mappingVersion/maxLength',
                                                                keyword: 'maxLength',
                                                                params: { limit: 512 },
                                                                message:
                                                                  'must NOT have more than 512 characters',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                      } else
                                                        return (
                                                          (N.errors = [
                                                            {
                                                              instancePath: r + '/mappingVersion',
                                                              schemaPath:
                                                                '#/properties/mappingVersion/type',
                                                              keyword: 'type',
                                                              params: { type: 'string' },
                                                              message: 'must be string',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                    var a = f === t;
                                                  } else var a = !0;
                                                  if (a) {
                                                    if (e.originalUnitAmount !== void 0) {
                                                      let m = e.originalUnitAmount,
                                                        f = t;
                                                      if (t === f)
                                                        if (typeof m == 'string') {
                                                          if (I(m) > 512)
                                                            return (
                                                              (N.errors = [
                                                                {
                                                                  instancePath:
                                                                    r + '/originalUnitAmount',
                                                                  schemaPath:
                                                                    '#/properties/originalUnitAmount/maxLength',
                                                                  keyword: 'maxLength',
                                                                  params: { limit: 512 },
                                                                  message:
                                                                    'must NOT have more than 512 characters',
                                                                },
                                                              ]),
                                                              !1
                                                            );
                                                          if (!Z.test(m))
                                                            return (
                                                              (N.errors = [
                                                                {
                                                                  instancePath:
                                                                    r + '/originalUnitAmount',
                                                                  schemaPath:
                                                                    '#/properties/originalUnitAmount/pattern',
                                                                  keyword: 'pattern',
                                                                  params: {
                                                                    pattern:
                                                                      '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                  },
                                                                  message:
                                                                    'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                                },
                                                              ]),
                                                              !1
                                                            );
                                                        } else
                                                          return (
                                                            (N.errors = [
                                                              {
                                                                instancePath:
                                                                  r + '/originalUnitAmount',
                                                                schemaPath:
                                                                  '#/properties/originalUnitAmount/type',
                                                                keyword: 'type',
                                                                params: { type: 'string' },
                                                                message: 'must be string',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                      var a = f === t;
                                                    } else var a = !0;
                                                    if (a) {
                                                      if (e.dataKind !== void 0) {
                                                        let m = e.dataKind,
                                                          f = t;
                                                        if (
                                                          !(
                                                            m === 'published_board' ||
                                                            m === 'fixed_fallback' ||
                                                            m === 'reference' ||
                                                            m === 'derived_cross'
                                                          )
                                                        )
                                                          return (
                                                            (N.errors = [
                                                              {
                                                                instancePath: r + '/dataKind',
                                                                schemaPath:
                                                                  '#/properties/dataKind/enum',
                                                                keyword: 'enum',
                                                                params: {
                                                                  allowedValues:
                                                                    pe.properties.dataKind.enum,
                                                                },
                                                                message:
                                                                  'must be equal to one of the allowed values',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                        var a = f === t;
                                                      } else var a = !0;
                                                      if (a)
                                                        if (e.feeEvidenceUrl !== void 0) {
                                                          let m = e.feeEvidenceUrl,
                                                            f = t;
                                                          if (t === f)
                                                            if (typeof m == 'string') {
                                                              if (I(m) > 512)
                                                                return (
                                                                  (N.errors = [
                                                                    {
                                                                      instancePath:
                                                                        r + '/feeEvidenceUrl',
                                                                      schemaPath:
                                                                        '#/properties/feeEvidenceUrl/maxLength',
                                                                      keyword: 'maxLength',
                                                                      params: { limit: 512 },
                                                                      message:
                                                                        'must NOT have more than 512 characters',
                                                                    },
                                                                  ]),
                                                                  !1
                                                                );
                                                              if (I(m) < 1)
                                                                return (
                                                                  (N.errors = [
                                                                    {
                                                                      instancePath:
                                                                        r + '/feeEvidenceUrl',
                                                                      schemaPath:
                                                                        '#/properties/feeEvidenceUrl/minLength',
                                                                      keyword: 'minLength',
                                                                      params: { limit: 1 },
                                                                      message:
                                                                        'must NOT have fewer than 1 characters',
                                                                    },
                                                                  ]),
                                                                  !1
                                                                );
                                                              if (!Ir.test(m))
                                                                return (
                                                                  (N.errors = [
                                                                    {
                                                                      instancePath:
                                                                        r + '/feeEvidenceUrl',
                                                                      schemaPath:
                                                                        '#/properties/feeEvidenceUrl/pattern',
                                                                      keyword: 'pattern',
                                                                      params: {
                                                                        pattern: '^https://',
                                                                      },
                                                                      message:
                                                                        'must match pattern "^https://"',
                                                                    },
                                                                  ]),
                                                                  !1
                                                                );
                                                            } else
                                                              return (
                                                                (N.errors = [
                                                                  {
                                                                    instancePath:
                                                                      r + '/feeEvidenceUrl',
                                                                    schemaPath:
                                                                      '#/properties/feeEvidenceUrl/type',
                                                                    keyword: 'type',
                                                                    params: { type: 'string' },
                                                                    message: 'must be string',
                                                                  },
                                                                ]),
                                                                !1
                                                              );
                                                          var a = f === t;
                                                        } else var a = !0;
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else
      return (
        (N.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((N.errors = s), t === 0);
}
N.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Cr = z,
  ve = {
    type: 'object',
    properties: {
      quoteId: { type: 'string', maxLength: 2e4 },
      quoteSeriesId: { type: 'string', maxLength: 2e4 },
      providerId: { type: 'string', maxLength: 512 },
      fromCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
      toCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
      providerSide: { enum: ['buy', 'sell'] },
      status: { enum: ['available', 'unavailable'] },
      rate: {
        anyOf: [
          { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
          { type: 'null' },
        ],
      },
      unavailableReason: { enum: ['not_quoted', null] },
      sourceQuote: { $ref: '#/$defs/SourceQuote' },
      methodVersion: { const: '1' },
    },
    required: [
      'quoteId',
      'quoteSeriesId',
      'providerId',
      'fromCurrency',
      'toCurrency',
      'providerSide',
      'status',
      'rate',
      'unavailableReason',
      'sourceQuote',
      'methodVersion',
    ],
    additionalProperties: !1,
  };
function x(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = x.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let g;
      if (
        (e.providerId === void 0 && (g = 'providerId')) ||
        (e.subjectCurrency === void 0 && (g = 'subjectCurrency')) ||
        (e.priceCurrency === void 0 && (g = 'priceCurrency')) ||
        (e.unitAmount === void 0 && (g = 'unitAmount')) ||
        (e.buy === void 0 && (g = 'buy')) ||
        (e.sell === void 0 && (g = 'sell')) ||
        (e.sourcePublishedAt === void 0 && (g = 'sourcePublishedAt')) ||
        (e.fetchedAt === void 0 && (g = 'fetchedAt')) ||
        (e.lastSuccessfulCheckAt === void 0 && (g = 'lastSuccessfulCheckAt')) ||
        (e.serviceCountry === void 0 && (g = 'serviceCountry')) ||
        (e.deliveryMethod === void 0 && (g = 'deliveryMethod')) ||
        (e.channel === void 0 && (g = 'channel'))
      )
        return (
          (x.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: g },
              message: "must have required property '" + g + "'",
            },
          ]),
          !1
        );
      {
        let _ = t;
        for (let m in e)
          if (!Ne.call(pe.properties, m)) {
            return (
              (x.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: m },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (_ === t) {
          if (e.providerId !== void 0) {
            let m = e.providerId,
              f = t;
            if (t === f)
              if (typeof m == 'string') {
                if (I(m) > 512)
                  return (
                    (x.errors = [
                      {
                        instancePath: r + '/providerId',
                        schemaPath: '#/properties/providerId/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ]),
                    !1
                  );
              } else
                return (
                  (x.errors = [
                    {
                      instancePath: r + '/providerId',
                      schemaPath: '#/properties/providerId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ]),
                  !1
                );
            var a = f === t;
          } else var a = !0;
          if (a) {
            if (e.subjectCurrency !== void 0) {
              let m = e.subjectCurrency,
                f = t;
              if (t === f)
                if (typeof m == 'string') {
                  if (I(m) > 512)
                    return (
                      (x.errors = [
                        {
                          instancePath: r + '/subjectCurrency',
                          schemaPath: '#/properties/subjectCurrency/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ]),
                      !1
                    );
                  if (!ie.test(m))
                    return (
                      (x.errors = [
                        {
                          instancePath: r + '/subjectCurrency',
                          schemaPath: '#/properties/subjectCurrency/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^[A-Z]{3}$' },
                          message: 'must match pattern "^[A-Z]{3}$"',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (x.errors = [
                      {
                        instancePath: r + '/subjectCurrency',
                        schemaPath: '#/properties/subjectCurrency/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = f === t;
            } else var a = !0;
            if (a) {
              if (e.priceCurrency !== void 0) {
                let m = e.priceCurrency,
                  f = t;
                if (t === f)
                  if (typeof m == 'string') {
                    if (I(m) > 512)
                      return (
                        (x.errors = [
                          {
                            instancePath: r + '/priceCurrency',
                            schemaPath: '#/properties/priceCurrency/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          },
                        ]),
                        !1
                      );
                    if (!ie.test(m))
                      return (
                        (x.errors = [
                          {
                            instancePath: r + '/priceCurrency',
                            schemaPath: '#/properties/priceCurrency/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^[A-Z]{3}$' },
                            message: 'must match pattern "^[A-Z]{3}$"',
                          },
                        ]),
                        !1
                      );
                  } else
                    return (
                      (x.errors = [
                        {
                          instancePath: r + '/priceCurrency',
                          schemaPath: '#/properties/priceCurrency/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ]),
                      !1
                    );
                var a = f === t;
              } else var a = !0;
              if (a) {
                if (e.unitAmount !== void 0) {
                  let m = e.unitAmount,
                    f = t;
                  if (t === f)
                    if (typeof m == 'string') {
                      if (I(m) > 512)
                        return (
                          (x.errors = [
                            {
                              instancePath: r + '/unitAmount',
                              schemaPath: '#/properties/unitAmount/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            },
                          ]),
                          !1
                        );
                      if (!Z.test(m))
                        return (
                          (x.errors = [
                            {
                              instancePath: r + '/unitAmount',
                              schemaPath: '#/properties/unitAmount/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                              message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                            },
                          ]),
                          !1
                        );
                    } else
                      return (
                        (x.errors = [
                          {
                            instancePath: r + '/unitAmount',
                            schemaPath: '#/properties/unitAmount/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ]),
                        !1
                      );
                  var a = f === t;
                } else var a = !0;
                if (a) {
                  if (e.buy !== void 0) {
                    let m = e.buy,
                      f = t,
                      A = t,
                      L = !1,
                      w = t;
                    if (t === w)
                      if (typeof m == 'string') {
                        if (I(m) > 512) {
                          let k = {
                            instancePath: r + '/buy',
                            schemaPath: '#/properties/buy/anyOf/0/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          };
                          (s === null ? (s = [k]) : s.push(k), t++);
                        } else if (!Z.test(m)) {
                          let k = {
                            instancePath: r + '/buy',
                            schemaPath: '#/properties/buy/anyOf/0/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                            message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                          };
                          (s === null ? (s = [k]) : s.push(k), t++);
                        }
                      } else {
                        let k = {
                          instancePath: r + '/buy',
                          schemaPath: '#/properties/buy/anyOf/0/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        };
                        (s === null ? (s = [k]) : s.push(k), t++);
                      }
                    var d = w === t;
                    L = L || d;
                    let v = t;
                    if (m !== null) {
                      let k = {
                        instancePath: r + '/buy',
                        schemaPath: '#/properties/buy/anyOf/1/type',
                        keyword: 'type',
                        params: { type: 'null' },
                        message: 'must be null',
                      };
                      (s === null ? (s = [k]) : s.push(k), t++);
                    }
                    var d = v === t;
                    if (((L = L || d), L))
                      ((t = A), s !== null && (A ? (s.length = A) : (s = null)));
                    else {
                      let k = {
                        instancePath: r + '/buy',
                        schemaPath: '#/properties/buy/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      return (s === null ? (s = [k]) : s.push(k), t++, (x.errors = s), !1);
                    }
                    var a = f === t;
                  } else var a = !0;
                  if (a) {
                    if (e.sell !== void 0) {
                      let m = e.sell,
                        f = t,
                        A = t,
                        L = !1,
                        w = t;
                      if (t === w)
                        if (typeof m == 'string') {
                          if (I(m) > 512) {
                            let k = {
                              instancePath: r + '/sell',
                              schemaPath: '#/properties/sell/anyOf/0/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            };
                            (s === null ? (s = [k]) : s.push(k), t++);
                          } else if (!Z.test(m)) {
                            let k = {
                              instancePath: r + '/sell',
                              schemaPath: '#/properties/sell/anyOf/0/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                              message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                            };
                            (s === null ? (s = [k]) : s.push(k), t++);
                          }
                        } else {
                          let k = {
                            instancePath: r + '/sell',
                            schemaPath: '#/properties/sell/anyOf/0/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          };
                          (s === null ? (s = [k]) : s.push(k), t++);
                        }
                      var c = w === t;
                      L = L || c;
                      let v = t;
                      if (m !== null) {
                        let k = {
                          instancePath: r + '/sell',
                          schemaPath: '#/properties/sell/anyOf/1/type',
                          keyword: 'type',
                          params: { type: 'null' },
                          message: 'must be null',
                        };
                        (s === null ? (s = [k]) : s.push(k), t++);
                      }
                      var c = v === t;
                      if (((L = L || c), L))
                        ((t = A), s !== null && (A ? (s.length = A) : (s = null)));
                      else {
                        let k = {
                          instancePath: r + '/sell',
                          schemaPath: '#/properties/sell/anyOf',
                          keyword: 'anyOf',
                          params: {},
                          message: 'must match a schema in anyOf',
                        };
                        return (s === null ? (s = [k]) : s.push(k), t++, (x.errors = s), !1);
                      }
                      var a = f === t;
                    } else var a = !0;
                    if (a) {
                      if (e.sourcePublishedAt !== void 0) {
                        let m = e.sourcePublishedAt,
                          f = t,
                          A = t,
                          L = !1,
                          w = t;
                        if (t === w && t === w)
                          if (typeof m == 'string') {
                            if (I(m) > 512) {
                              let k = {
                                instancePath: r + '/sourcePublishedAt',
                                schemaPath: '#/properties/sourcePublishedAt/anyOf/0/maxLength',
                                keyword: 'maxLength',
                                params: { limit: 512 },
                                message: 'must NOT have more than 512 characters',
                              };
                              (s === null ? (s = [k]) : s.push(k), t++);
                            } else if (!oe.validate(m)) {
                              let k = {
                                instancePath: r + '/sourcePublishedAt',
                                schemaPath: '#/properties/sourcePublishedAt/anyOf/0/format',
                                keyword: 'format',
                                params: { format: 'date-time' },
                                message: 'must match format "date-time"',
                              };
                              (s === null ? (s = [k]) : s.push(k), t++);
                            }
                          } else {
                            let k = {
                              instancePath: r + '/sourcePublishedAt',
                              schemaPath: '#/properties/sourcePublishedAt/anyOf/0/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            };
                            (s === null ? (s = [k]) : s.push(k), t++);
                          }
                        var h = w === t;
                        L = L || h;
                        let v = t;
                        if (m !== null) {
                          let k = {
                            instancePath: r + '/sourcePublishedAt',
                            schemaPath: '#/properties/sourcePublishedAt/anyOf/1/type',
                            keyword: 'type',
                            params: { type: 'null' },
                            message: 'must be null',
                          };
                          (s === null ? (s = [k]) : s.push(k), t++);
                        }
                        var h = v === t;
                        if (((L = L || h), L))
                          ((t = A), s !== null && (A ? (s.length = A) : (s = null)));
                        else {
                          let k = {
                            instancePath: r + '/sourcePublishedAt',
                            schemaPath: '#/properties/sourcePublishedAt/anyOf',
                            keyword: 'anyOf',
                            params: {},
                            message: 'must match a schema in anyOf',
                          };
                          return (s === null ? (s = [k]) : s.push(k), t++, (x.errors = s), !1);
                        }
                        var a = f === t;
                      } else var a = !0;
                      if (a) {
                        if (e.fetchedAt !== void 0) {
                          let m = e.fetchedAt,
                            f = t;
                          if (t === f && t === f)
                            if (typeof m == 'string') {
                              if (I(m) > 512)
                                return (
                                  (x.errors = [
                                    {
                                      instancePath: r + '/fetchedAt',
                                      schemaPath: '#/properties/fetchedAt/maxLength',
                                      keyword: 'maxLength',
                                      params: { limit: 512 },
                                      message: 'must NOT have more than 512 characters',
                                    },
                                  ]),
                                  !1
                                );
                              if (!oe.validate(m))
                                return (
                                  (x.errors = [
                                    {
                                      instancePath: r + '/fetchedAt',
                                      schemaPath: '#/properties/fetchedAt/format',
                                      keyword: 'format',
                                      params: { format: 'date-time' },
                                      message: 'must match format "date-time"',
                                    },
                                  ]),
                                  !1
                                );
                            } else
                              return (
                                (x.errors = [
                                  {
                                    instancePath: r + '/fetchedAt',
                                    schemaPath: '#/properties/fetchedAt/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  },
                                ]),
                                !1
                              );
                          var a = f === t;
                        } else var a = !0;
                        if (a) {
                          if (e.lastSuccessfulCheckAt !== void 0) {
                            let m = e.lastSuccessfulCheckAt,
                              f = t;
                            if (t === f && t === f)
                              if (typeof m == 'string') {
                                if (I(m) > 512)
                                  return (
                                    (x.errors = [
                                      {
                                        instancePath: r + '/lastSuccessfulCheckAt',
                                        schemaPath: '#/properties/lastSuccessfulCheckAt/maxLength',
                                        keyword: 'maxLength',
                                        params: { limit: 512 },
                                        message: 'must NOT have more than 512 characters',
                                      },
                                    ]),
                                    !1
                                  );
                                if (!oe.validate(m))
                                  return (
                                    (x.errors = [
                                      {
                                        instancePath: r + '/lastSuccessfulCheckAt',
                                        schemaPath: '#/properties/lastSuccessfulCheckAt/format',
                                        keyword: 'format',
                                        params: { format: 'date-time' },
                                        message: 'must match format "date-time"',
                                      },
                                    ]),
                                    !1
                                  );
                              } else
                                return (
                                  (x.errors = [
                                    {
                                      instancePath: r + '/lastSuccessfulCheckAt',
                                      schemaPath: '#/properties/lastSuccessfulCheckAt/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ]),
                                  !1
                                );
                            var a = f === t;
                          } else var a = !0;
                          if (a) {
                            if (e.serviceCountry !== void 0) {
                              let m = e.serviceCountry,
                                f = t;
                              if (t === f)
                                if (typeof m == 'string') {
                                  if (I(m) > 512)
                                    return (
                                      (x.errors = [
                                        {
                                          instancePath: r + '/serviceCountry',
                                          schemaPath: '#/properties/serviceCountry/maxLength',
                                          keyword: 'maxLength',
                                          params: { limit: 512 },
                                          message: 'must NOT have more than 512 characters',
                                        },
                                      ]),
                                      !1
                                    );
                                  if (!Je.test(m))
                                    return (
                                      (x.errors = [
                                        {
                                          instancePath: r + '/serviceCountry',
                                          schemaPath: '#/properties/serviceCountry/pattern',
                                          keyword: 'pattern',
                                          params: { pattern: '^[A-Z]{2}$' },
                                          message: 'must match pattern "^[A-Z]{2}$"',
                                        },
                                      ]),
                                      !1
                                    );
                                } else
                                  return (
                                    (x.errors = [
                                      {
                                        instancePath: r + '/serviceCountry',
                                        schemaPath: '#/properties/serviceCountry/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      },
                                    ]),
                                    !1
                                  );
                              var a = f === t;
                            } else var a = !0;
                            if (a) {
                              if (e.deliveryMethod !== void 0) {
                                let m = e.deliveryMethod,
                                  f = t;
                                if (!(m === 'cash' || m === 'account'))
                                  return (
                                    (x.errors = [
                                      {
                                        instancePath: r + '/deliveryMethod',
                                        schemaPath: '#/properties/deliveryMethod/enum',
                                        keyword: 'enum',
                                        params: {
                                          allowedValues: pe.properties.deliveryMethod.enum,
                                        },
                                        message: 'must be equal to one of the allowed values',
                                      },
                                    ]),
                                    !1
                                  );
                                var a = f === t;
                              } else var a = !0;
                              if (a) {
                                if (e.channel !== void 0) {
                                  let m = e.channel,
                                    f = t;
                                  if (
                                    !(
                                      m === 'branch' ||
                                      m === 'online' ||
                                      m === 'atm' ||
                                      m === 'unknown'
                                    )
                                  )
                                    return (
                                      (x.errors = [
                                        {
                                          instancePath: r + '/channel',
                                          schemaPath: '#/properties/channel/enum',
                                          keyword: 'enum',
                                          params: { allowedValues: pe.properties.channel.enum },
                                          message: 'must be equal to one of the allowed values',
                                        },
                                      ]),
                                      !1
                                    );
                                  var a = f === t;
                                } else var a = !0;
                                if (a) {
                                  if (e.branchId !== void 0) {
                                    let m = e.branchId,
                                      f = t;
                                    if (t === f)
                                      if (typeof m == 'string') {
                                        if (I(m) > 512)
                                          return (
                                            (x.errors = [
                                              {
                                                instancePath: r + '/branchId',
                                                schemaPath: '#/properties/branchId/maxLength',
                                                keyword: 'maxLength',
                                                params: { limit: 512 },
                                                message: 'must NOT have more than 512 characters',
                                              },
                                            ]),
                                            !1
                                          );
                                      } else
                                        return (
                                          (x.errors = [
                                            {
                                              instancePath: r + '/branchId',
                                              schemaPath: '#/properties/branchId/type',
                                              keyword: 'type',
                                              params: { type: 'string' },
                                              message: 'must be string',
                                            },
                                          ]),
                                          !1
                                        );
                                    var a = f === t;
                                  } else var a = !0;
                                  if (a) {
                                    if (e.denominations !== void 0) {
                                      let m = e.denominations,
                                        f = t;
                                      if (t === f)
                                        if (Array.isArray(m)) {
                                          if (m.length > 100)
                                            return (
                                              (x.errors = [
                                                {
                                                  instancePath: r + '/denominations',
                                                  schemaPath: '#/properties/denominations/maxItems',
                                                  keyword: 'maxItems',
                                                  params: { limit: 100 },
                                                  message: 'must NOT have more than 100 items',
                                                },
                                              ]),
                                              !1
                                            );
                                          {
                                            var l = !0;
                                            let L = m.length;
                                            for (let w = 0; w < L; w++) {
                                              let v = m[w],
                                                C = t;
                                              if (t === C)
                                                if (typeof v == 'string') {
                                                  if (I(v) > 512)
                                                    return (
                                                      (x.errors = [
                                                        {
                                                          instancePath: r + '/denominations/' + w,
                                                          schemaPath:
                                                            '#/properties/denominations/items/maxLength',
                                                          keyword: 'maxLength',
                                                          params: { limit: 512 },
                                                          message:
                                                            'must NOT have more than 512 characters',
                                                        },
                                                      ]),
                                                      !1
                                                    );
                                                  if (!Z.test(v))
                                                    return (
                                                      (x.errors = [
                                                        {
                                                          instancePath: r + '/denominations/' + w,
                                                          schemaPath:
                                                            '#/properties/denominations/items/pattern',
                                                          keyword: 'pattern',
                                                          params: {
                                                            pattern:
                                                              '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                          },
                                                          message:
                                                            'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                        },
                                                      ]),
                                                      !1
                                                    );
                                                } else
                                                  return (
                                                    (x.errors = [
                                                      {
                                                        instancePath: r + '/denominations/' + w,
                                                        schemaPath:
                                                          '#/properties/denominations/items/type',
                                                        keyword: 'type',
                                                        params: { type: 'string' },
                                                        message: 'must be string',
                                                      },
                                                    ]),
                                                    !1
                                                  );
                                              var l = C === t;
                                              if (!l) break;
                                            }
                                          }
                                        } else
                                          return (
                                            (x.errors = [
                                              {
                                                instancePath: r + '/denominations',
                                                schemaPath: '#/properties/denominations/type',
                                                keyword: 'type',
                                                params: { type: 'array' },
                                                message: 'must be array',
                                              },
                                            ]),
                                            !1
                                          );
                                      var a = f === t;
                                    } else var a = !0;
                                    if (a) {
                                      if (e.amountRange !== void 0) {
                                        let m = e.amountRange,
                                          f = t;
                                        if (t === f)
                                          if (m && typeof m == 'object' && !Array.isArray(m)) {
                                            let L;
                                            if (
                                              (m.currency === void 0 && (L = 'currency')) ||
                                              (m.min === void 0 && (L = 'min')) ||
                                              (m.max === void 0 && (L = 'max'))
                                            )
                                              return (
                                                (x.errors = [
                                                  {
                                                    instancePath: r + '/amountRange',
                                                    schemaPath: '#/properties/amountRange/required',
                                                    keyword: 'required',
                                                    params: { missingProperty: L },
                                                    message:
                                                      "must have required property '" + L + "'",
                                                  },
                                                ]),
                                                !1
                                              );
                                            {
                                              let w = t;
                                              for (let v in m)
                                                if (
                                                  !(v === 'currency' || v === 'min' || v === 'max')
                                                ) {
                                                  return (
                                                    (x.errors = [
                                                      {
                                                        instancePath: r + '/amountRange',
                                                        schemaPath:
                                                          '#/properties/amountRange/additionalProperties',
                                                        keyword: 'additionalProperties',
                                                        params: { additionalProperty: v },
                                                        message:
                                                          'must NOT have additional properties',
                                                      },
                                                    ]),
                                                    !1
                                                  );
                                                  break;
                                                }
                                              if (w === t) {
                                                if (m.currency !== void 0) {
                                                  let v = m.currency,
                                                    C = t;
                                                  if (t === C)
                                                    if (typeof v == 'string') {
                                                      if (I(v) > 512)
                                                        return (
                                                          (x.errors = [
                                                            {
                                                              instancePath:
                                                                r + '/amountRange/currency',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/currency/maxLength',
                                                              keyword: 'maxLength',
                                                              params: { limit: 512 },
                                                              message:
                                                                'must NOT have more than 512 characters',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                      if (!ie.test(v))
                                                        return (
                                                          (x.errors = [
                                                            {
                                                              instancePath:
                                                                r + '/amountRange/currency',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/currency/pattern',
                                                              keyword: 'pattern',
                                                              params: { pattern: '^[A-Z]{3}$' },
                                                              message:
                                                                'must match pattern "^[A-Z]{3}$"',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                    } else
                                                      return (
                                                        (x.errors = [
                                                          {
                                                            instancePath:
                                                              r + '/amountRange/currency',
                                                            schemaPath:
                                                              '#/properties/amountRange/properties/currency/type',
                                                            keyword: 'type',
                                                            params: { type: 'string' },
                                                            message: 'must be string',
                                                          },
                                                        ]),
                                                        !1
                                                      );
                                                  var y = C === t;
                                                } else var y = !0;
                                                if (y) {
                                                  if (m.min !== void 0) {
                                                    let v = m.min,
                                                      C = t;
                                                    if (t === C)
                                                      if (typeof v == 'string') {
                                                        if (I(v) > 512)
                                                          return (
                                                            (x.errors = [
                                                              {
                                                                instancePath:
                                                                  r + '/amountRange/min',
                                                                schemaPath:
                                                                  '#/properties/amountRange/properties/min/maxLength',
                                                                keyword: 'maxLength',
                                                                params: { limit: 512 },
                                                                message:
                                                                  'must NOT have more than 512 characters',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                        if (!Z.test(v))
                                                          return (
                                                            (x.errors = [
                                                              {
                                                                instancePath:
                                                                  r + '/amountRange/min',
                                                                schemaPath:
                                                                  '#/properties/amountRange/properties/min/pattern',
                                                                keyword: 'pattern',
                                                                params: {
                                                                  pattern:
                                                                    '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                },
                                                                message:
                                                                  'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                      } else
                                                        return (
                                                          (x.errors = [
                                                            {
                                                              instancePath: r + '/amountRange/min',
                                                              schemaPath:
                                                                '#/properties/amountRange/properties/min/type',
                                                              keyword: 'type',
                                                              params: { type: 'string' },
                                                              message: 'must be string',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                    var y = C === t;
                                                  } else var y = !0;
                                                  if (y)
                                                    if (m.max !== void 0) {
                                                      let v = m.max,
                                                        C = t;
                                                      if (t === C)
                                                        if (typeof v == 'string') {
                                                          if (I(v) > 512)
                                                            return (
                                                              (x.errors = [
                                                                {
                                                                  instancePath:
                                                                    r + '/amountRange/max',
                                                                  schemaPath:
                                                                    '#/properties/amountRange/properties/max/maxLength',
                                                                  keyword: 'maxLength',
                                                                  params: { limit: 512 },
                                                                  message:
                                                                    'must NOT have more than 512 characters',
                                                                },
                                                              ]),
                                                              !1
                                                            );
                                                          if (!Z.test(v))
                                                            return (
                                                              (x.errors = [
                                                                {
                                                                  instancePath:
                                                                    r + '/amountRange/max',
                                                                  schemaPath:
                                                                    '#/properties/amountRange/properties/max/pattern',
                                                                  keyword: 'pattern',
                                                                  params: {
                                                                    pattern:
                                                                      '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                  },
                                                                  message:
                                                                    'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                                },
                                                              ]),
                                                              !1
                                                            );
                                                        } else
                                                          return (
                                                            (x.errors = [
                                                              {
                                                                instancePath:
                                                                  r + '/amountRange/max',
                                                                schemaPath:
                                                                  '#/properties/amountRange/properties/max/type',
                                                                keyword: 'type',
                                                                params: { type: 'string' },
                                                                message: 'must be string',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                      var y = C === t;
                                                    } else var y = !0;
                                                }
                                              }
                                            }
                                          } else
                                            return (
                                              (x.errors = [
                                                {
                                                  instancePath: r + '/amountRange',
                                                  schemaPath: '#/properties/amountRange/type',
                                                  keyword: 'type',
                                                  params: { type: 'object' },
                                                  message: 'must be object',
                                                },
                                              ]),
                                              !1
                                            );
                                        var a = f === t;
                                      } else var a = !0;
                                      if (a) {
                                        if (e.qualifications !== void 0) {
                                          let m = e.qualifications,
                                            f = t;
                                          if (t === f)
                                            if (Array.isArray(m)) {
                                              if (m.length > 100)
                                                return (
                                                  (x.errors = [
                                                    {
                                                      instancePath: r + '/qualifications',
                                                      schemaPath:
                                                        '#/properties/qualifications/maxItems',
                                                      keyword: 'maxItems',
                                                      params: { limit: 100 },
                                                      message: 'must NOT have more than 100 items',
                                                    },
                                                  ]),
                                                  !1
                                                );
                                              {
                                                var b = !0;
                                                let L = m.length;
                                                for (let w = 0; w < L; w++) {
                                                  let v = m[w],
                                                    C = t;
                                                  if (t === C)
                                                    if (typeof v == 'string') {
                                                      if (I(v) > 512)
                                                        return (
                                                          (x.errors = [
                                                            {
                                                              instancePath:
                                                                r + '/qualifications/' + w,
                                                              schemaPath:
                                                                '#/properties/qualifications/items/maxLength',
                                                              keyword: 'maxLength',
                                                              params: { limit: 512 },
                                                              message:
                                                                'must NOT have more than 512 characters',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                    } else
                                                      return (
                                                        (x.errors = [
                                                          {
                                                            instancePath:
                                                              r + '/qualifications/' + w,
                                                            schemaPath:
                                                              '#/properties/qualifications/items/type',
                                                            keyword: 'type',
                                                            params: { type: 'string' },
                                                            message: 'must be string',
                                                          },
                                                        ]),
                                                        !1
                                                      );
                                                  var b = C === t;
                                                  if (!b) break;
                                                }
                                              }
                                            } else
                                              return (
                                                (x.errors = [
                                                  {
                                                    instancePath: r + '/qualifications',
                                                    schemaPath: '#/properties/qualifications/type',
                                                    keyword: 'type',
                                                    params: { type: 'array' },
                                                    message: 'must be array',
                                                  },
                                                ]),
                                                !1
                                              );
                                          var a = f === t;
                                        } else var a = !0;
                                        if (a) {
                                          if (e.feeStatus !== void 0) {
                                            let m = e.feeStatus,
                                              f = t;
                                            if (
                                              !(
                                                m === 'unknown' ||
                                                m === 'no_additional_fee' ||
                                                m === 'unsupported'
                                              )
                                            )
                                              return (
                                                (x.errors = [
                                                  {
                                                    instancePath: r + '/feeStatus',
                                                    schemaPath: '#/properties/feeStatus/enum',
                                                    keyword: 'enum',
                                                    params: {
                                                      allowedValues: pe.properties.feeStatus.enum,
                                                    },
                                                    message:
                                                      'must be equal to one of the allowed values',
                                                  },
                                                ]),
                                                !1
                                              );
                                            var a = f === t;
                                          } else var a = !0;
                                          if (a) {
                                            if (e.sourceUrl !== void 0) {
                                              let m = e.sourceUrl,
                                                f = t;
                                              if (t === f)
                                                if (typeof m == 'string') {
                                                  if (I(m) > 512)
                                                    return (
                                                      (x.errors = [
                                                        {
                                                          instancePath: r + '/sourceUrl',
                                                          schemaPath:
                                                            '#/properties/sourceUrl/maxLength',
                                                          keyword: 'maxLength',
                                                          params: { limit: 512 },
                                                          message:
                                                            'must NOT have more than 512 characters',
                                                        },
                                                      ]),
                                                      !1
                                                    );
                                                } else
                                                  return (
                                                    (x.errors = [
                                                      {
                                                        instancePath: r + '/sourceUrl',
                                                        schemaPath: '#/properties/sourceUrl/type',
                                                        keyword: 'type',
                                                        params: { type: 'string' },
                                                        message: 'must be string',
                                                      },
                                                    ]),
                                                    !1
                                                  );
                                              var a = f === t;
                                            } else var a = !0;
                                            if (a) {
                                              if (e.originalBuyField !== void 0) {
                                                let m = e.originalBuyField,
                                                  f = t;
                                                if (t === f)
                                                  if (typeof m == 'string') {
                                                    if (I(m) > 512)
                                                      return (
                                                        (x.errors = [
                                                          {
                                                            instancePath: r + '/originalBuyField',
                                                            schemaPath:
                                                              '#/properties/originalBuyField/maxLength',
                                                            keyword: 'maxLength',
                                                            params: { limit: 512 },
                                                            message:
                                                              'must NOT have more than 512 characters',
                                                          },
                                                        ]),
                                                        !1
                                                      );
                                                  } else
                                                    return (
                                                      (x.errors = [
                                                        {
                                                          instancePath: r + '/originalBuyField',
                                                          schemaPath:
                                                            '#/properties/originalBuyField/type',
                                                          keyword: 'type',
                                                          params: { type: 'string' },
                                                          message: 'must be string',
                                                        },
                                                      ]),
                                                      !1
                                                    );
                                                var a = f === t;
                                              } else var a = !0;
                                              if (a) {
                                                if (e.originalSellField !== void 0) {
                                                  let m = e.originalSellField,
                                                    f = t;
                                                  if (t === f)
                                                    if (typeof m == 'string') {
                                                      if (I(m) > 512)
                                                        return (
                                                          (x.errors = [
                                                            {
                                                              instancePath:
                                                                r + '/originalSellField',
                                                              schemaPath:
                                                                '#/properties/originalSellField/maxLength',
                                                              keyword: 'maxLength',
                                                              params: { limit: 512 },
                                                              message:
                                                                'must NOT have more than 512 characters',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                    } else
                                                      return (
                                                        (x.errors = [
                                                          {
                                                            instancePath: r + '/originalSellField',
                                                            schemaPath:
                                                              '#/properties/originalSellField/type',
                                                            keyword: 'type',
                                                            params: { type: 'string' },
                                                            message: 'must be string',
                                                          },
                                                        ]),
                                                        !1
                                                      );
                                                  var a = f === t;
                                                } else var a = !0;
                                                if (a) {
                                                  if (e.mappingVersion !== void 0) {
                                                    let m = e.mappingVersion,
                                                      f = t;
                                                    if (t === f)
                                                      if (typeof m == 'string') {
                                                        if (I(m) > 512)
                                                          return (
                                                            (x.errors = [
                                                              {
                                                                instancePath: r + '/mappingVersion',
                                                                schemaPath:
                                                                  '#/properties/mappingVersion/maxLength',
                                                                keyword: 'maxLength',
                                                                params: { limit: 512 },
                                                                message:
                                                                  'must NOT have more than 512 characters',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                      } else
                                                        return (
                                                          (x.errors = [
                                                            {
                                                              instancePath: r + '/mappingVersion',
                                                              schemaPath:
                                                                '#/properties/mappingVersion/type',
                                                              keyword: 'type',
                                                              params: { type: 'string' },
                                                              message: 'must be string',
                                                            },
                                                          ]),
                                                          !1
                                                        );
                                                    var a = f === t;
                                                  } else var a = !0;
                                                  if (a) {
                                                    if (e.originalUnitAmount !== void 0) {
                                                      let m = e.originalUnitAmount,
                                                        f = t;
                                                      if (t === f)
                                                        if (typeof m == 'string') {
                                                          if (I(m) > 512)
                                                            return (
                                                              (x.errors = [
                                                                {
                                                                  instancePath:
                                                                    r + '/originalUnitAmount',
                                                                  schemaPath:
                                                                    '#/properties/originalUnitAmount/maxLength',
                                                                  keyword: 'maxLength',
                                                                  params: { limit: 512 },
                                                                  message:
                                                                    'must NOT have more than 512 characters',
                                                                },
                                                              ]),
                                                              !1
                                                            );
                                                          if (!Z.test(m))
                                                            return (
                                                              (x.errors = [
                                                                {
                                                                  instancePath:
                                                                    r + '/originalUnitAmount',
                                                                  schemaPath:
                                                                    '#/properties/originalUnitAmount/pattern',
                                                                  keyword: 'pattern',
                                                                  params: {
                                                                    pattern:
                                                                      '^(0|[1-9][0-9]*)(\\.[0-9]+)?$',
                                                                  },
                                                                  message:
                                                                    'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                                                },
                                                              ]),
                                                              !1
                                                            );
                                                        } else
                                                          return (
                                                            (x.errors = [
                                                              {
                                                                instancePath:
                                                                  r + '/originalUnitAmount',
                                                                schemaPath:
                                                                  '#/properties/originalUnitAmount/type',
                                                                keyword: 'type',
                                                                params: { type: 'string' },
                                                                message: 'must be string',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                      var a = f === t;
                                                    } else var a = !0;
                                                    if (a) {
                                                      if (e.dataKind !== void 0) {
                                                        let m = e.dataKind,
                                                          f = t;
                                                        if (
                                                          !(
                                                            m === 'published_board' ||
                                                            m === 'fixed_fallback' ||
                                                            m === 'reference' ||
                                                            m === 'derived_cross'
                                                          )
                                                        )
                                                          return (
                                                            (x.errors = [
                                                              {
                                                                instancePath: r + '/dataKind',
                                                                schemaPath:
                                                                  '#/properties/dataKind/enum',
                                                                keyword: 'enum',
                                                                params: {
                                                                  allowedValues:
                                                                    pe.properties.dataKind.enum,
                                                                },
                                                                message:
                                                                  'must be equal to one of the allowed values',
                                                              },
                                                            ]),
                                                            !1
                                                          );
                                                        var a = f === t;
                                                      } else var a = !0;
                                                      if (a)
                                                        if (e.feeEvidenceUrl !== void 0) {
                                                          let m = e.feeEvidenceUrl,
                                                            f = t;
                                                          if (t === f)
                                                            if (typeof m == 'string') {
                                                              if (I(m) > 512)
                                                                return (
                                                                  (x.errors = [
                                                                    {
                                                                      instancePath:
                                                                        r + '/feeEvidenceUrl',
                                                                      schemaPath:
                                                                        '#/properties/feeEvidenceUrl/maxLength',
                                                                      keyword: 'maxLength',
                                                                      params: { limit: 512 },
                                                                      message:
                                                                        'must NOT have more than 512 characters',
                                                                    },
                                                                  ]),
                                                                  !1
                                                                );
                                                              if (I(m) < 1)
                                                                return (
                                                                  (x.errors = [
                                                                    {
                                                                      instancePath:
                                                                        r + '/feeEvidenceUrl',
                                                                      schemaPath:
                                                                        '#/properties/feeEvidenceUrl/minLength',
                                                                      keyword: 'minLength',
                                                                      params: { limit: 1 },
                                                                      message:
                                                                        'must NOT have fewer than 1 characters',
                                                                    },
                                                                  ]),
                                                                  !1
                                                                );
                                                              if (!Ir.test(m))
                                                                return (
                                                                  (x.errors = [
                                                                    {
                                                                      instancePath:
                                                                        r + '/feeEvidenceUrl',
                                                                      schemaPath:
                                                                        '#/properties/feeEvidenceUrl/pattern',
                                                                      keyword: 'pattern',
                                                                      params: {
                                                                        pattern: '^https://',
                                                                      },
                                                                      message:
                                                                        'must match pattern "^https://"',
                                                                    },
                                                                  ]),
                                                                  !1
                                                                );
                                                            } else
                                                              return (
                                                                (x.errors = [
                                                                  {
                                                                    instancePath:
                                                                      r + '/feeEvidenceUrl',
                                                                    schemaPath:
                                                                      '#/properties/feeEvidenceUrl/type',
                                                                    keyword: 'type',
                                                                    params: { type: 'string' },
                                                                    message: 'must be string',
                                                                  },
                                                                ]),
                                                                !1
                                                              );
                                                          var a = f === t;
                                                        } else var a = !0;
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else
      return (
        (x.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((x.errors = s), t === 0);
}
x.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function z(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = z.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let c;
      if (
        (e.quoteId === void 0 && (c = 'quoteId')) ||
        (e.quoteSeriesId === void 0 && (c = 'quoteSeriesId')) ||
        (e.providerId === void 0 && (c = 'providerId')) ||
        (e.fromCurrency === void 0 && (c = 'fromCurrency')) ||
        (e.toCurrency === void 0 && (c = 'toCurrency')) ||
        (e.providerSide === void 0 && (c = 'providerSide')) ||
        (e.status === void 0 && (c = 'status')) ||
        (e.rate === void 0 && (c = 'rate')) ||
        (e.unavailableReason === void 0 && (c = 'unavailableReason')) ||
        (e.sourceQuote === void 0 && (c = 'sourceQuote')) ||
        (e.methodVersion === void 0 && (c = 'methodVersion'))
      )
        return (
          (z.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: c },
              message: "must have required property '" + c + "'",
            },
          ]),
          !1
        );
      {
        let h = t;
        for (let l in e)
          if (!Ne.call(ve.properties, l)) {
            return (
              (z.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: l },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (h === t) {
          if (e.quoteId !== void 0) {
            let l = e.quoteId,
              y = t;
            if (t === y)
              if (typeof l == 'string') {
                if (I(l) > 2e4)
                  return (
                    (z.errors = [
                      {
                        instancePath: r + '/quoteId',
                        schemaPath: '#/properties/quoteId/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 2e4 },
                        message: 'must NOT have more than 20000 characters',
                      },
                    ]),
                    !1
                  );
              } else
                return (
                  (z.errors = [
                    {
                      instancePath: r + '/quoteId',
                      schemaPath: '#/properties/quoteId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ]),
                  !1
                );
            var a = y === t;
          } else var a = !0;
          if (a) {
            if (e.quoteSeriesId !== void 0) {
              let l = e.quoteSeriesId,
                y = t;
              if (t === y)
                if (typeof l == 'string') {
                  if (I(l) > 2e4)
                    return (
                      (z.errors = [
                        {
                          instancePath: r + '/quoteSeriesId',
                          schemaPath: '#/properties/quoteSeriesId/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 2e4 },
                          message: 'must NOT have more than 20000 characters',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (z.errors = [
                      {
                        instancePath: r + '/quoteSeriesId',
                        schemaPath: '#/properties/quoteSeriesId/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = y === t;
            } else var a = !0;
            if (a) {
              if (e.providerId !== void 0) {
                let l = e.providerId,
                  y = t;
                if (t === y)
                  if (typeof l == 'string') {
                    if (I(l) > 512)
                      return (
                        (z.errors = [
                          {
                            instancePath: r + '/providerId',
                            schemaPath: '#/properties/providerId/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          },
                        ]),
                        !1
                      );
                  } else
                    return (
                      (z.errors = [
                        {
                          instancePath: r + '/providerId',
                          schemaPath: '#/properties/providerId/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ]),
                      !1
                    );
                var a = y === t;
              } else var a = !0;
              if (a) {
                if (e.fromCurrency !== void 0) {
                  let l = e.fromCurrency,
                    y = t;
                  if (t === y)
                    if (typeof l == 'string') {
                      if (I(l) > 512)
                        return (
                          (z.errors = [
                            {
                              instancePath: r + '/fromCurrency',
                              schemaPath: '#/properties/fromCurrency/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            },
                          ]),
                          !1
                        );
                      if (!ie.test(l))
                        return (
                          (z.errors = [
                            {
                              instancePath: r + '/fromCurrency',
                              schemaPath: '#/properties/fromCurrency/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^[A-Z]{3}$' },
                              message: 'must match pattern "^[A-Z]{3}$"',
                            },
                          ]),
                          !1
                        );
                    } else
                      return (
                        (z.errors = [
                          {
                            instancePath: r + '/fromCurrency',
                            schemaPath: '#/properties/fromCurrency/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ]),
                        !1
                      );
                  var a = y === t;
                } else var a = !0;
                if (a) {
                  if (e.toCurrency !== void 0) {
                    let l = e.toCurrency,
                      y = t;
                    if (t === y)
                      if (typeof l == 'string') {
                        if (I(l) > 512)
                          return (
                            (z.errors = [
                              {
                                instancePath: r + '/toCurrency',
                                schemaPath: '#/properties/toCurrency/maxLength',
                                keyword: 'maxLength',
                                params: { limit: 512 },
                                message: 'must NOT have more than 512 characters',
                              },
                            ]),
                            !1
                          );
                        if (!ie.test(l))
                          return (
                            (z.errors = [
                              {
                                instancePath: r + '/toCurrency',
                                schemaPath: '#/properties/toCurrency/pattern',
                                keyword: 'pattern',
                                params: { pattern: '^[A-Z]{3}$' },
                                message: 'must match pattern "^[A-Z]{3}$"',
                              },
                            ]),
                            !1
                          );
                      } else
                        return (
                          (z.errors = [
                            {
                              instancePath: r + '/toCurrency',
                              schemaPath: '#/properties/toCurrency/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            },
                          ]),
                          !1
                        );
                    var a = y === t;
                  } else var a = !0;
                  if (a) {
                    if (e.providerSide !== void 0) {
                      let l = e.providerSide,
                        y = t;
                      if (!(l === 'buy' || l === 'sell'))
                        return (
                          (z.errors = [
                            {
                              instancePath: r + '/providerSide',
                              schemaPath: '#/properties/providerSide/enum',
                              keyword: 'enum',
                              params: { allowedValues: ve.properties.providerSide.enum },
                              message: 'must be equal to one of the allowed values',
                            },
                          ]),
                          !1
                        );
                      var a = y === t;
                    } else var a = !0;
                    if (a) {
                      if (e.status !== void 0) {
                        let l = e.status,
                          y = t;
                        if (!(l === 'available' || l === 'unavailable'))
                          return (
                            (z.errors = [
                              {
                                instancePath: r + '/status',
                                schemaPath: '#/properties/status/enum',
                                keyword: 'enum',
                                params: { allowedValues: ve.properties.status.enum },
                                message: 'must be equal to one of the allowed values',
                              },
                            ]),
                            !1
                          );
                        var a = y === t;
                      } else var a = !0;
                      if (a) {
                        if (e.rate !== void 0) {
                          let l = e.rate,
                            y = t,
                            b = t,
                            g = !1,
                            _ = t;
                          if (t === _)
                            if (typeof l == 'string') {
                              if (I(l) > 512) {
                                let A = {
                                  instancePath: r + '/rate',
                                  schemaPath: '#/properties/rate/anyOf/0/maxLength',
                                  keyword: 'maxLength',
                                  params: { limit: 512 },
                                  message: 'must NOT have more than 512 characters',
                                };
                                (s === null ? (s = [A]) : s.push(A), t++);
                              } else if (!Z.test(l)) {
                                let A = {
                                  instancePath: r + '/rate',
                                  schemaPath: '#/properties/rate/anyOf/0/pattern',
                                  keyword: 'pattern',
                                  params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                                  message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                };
                                (s === null ? (s = [A]) : s.push(A), t++);
                              }
                            } else {
                              let A = {
                                instancePath: r + '/rate',
                                schemaPath: '#/properties/rate/anyOf/0/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              (s === null ? (s = [A]) : s.push(A), t++);
                            }
                          var d = _ === t;
                          g = g || d;
                          let m = t;
                          if (l !== null) {
                            let A = {
                              instancePath: r + '/rate',
                              schemaPath: '#/properties/rate/anyOf/1/type',
                              keyword: 'type',
                              params: { type: 'null' },
                              message: 'must be null',
                            };
                            (s === null ? (s = [A]) : s.push(A), t++);
                          }
                          var d = m === t;
                          if (((g = g || d), g))
                            ((t = b), s !== null && (b ? (s.length = b) : (s = null)));
                          else {
                            let A = {
                              instancePath: r + '/rate',
                              schemaPath: '#/properties/rate/anyOf',
                              keyword: 'anyOf',
                              params: {},
                              message: 'must match a schema in anyOf',
                            };
                            return (s === null ? (s = [A]) : s.push(A), t++, (z.errors = s), !1);
                          }
                          var a = y === t;
                        } else var a = !0;
                        if (a) {
                          if (e.unavailableReason !== void 0) {
                            let l = e.unavailableReason,
                              y = t;
                            if (!(l === 'not_quoted' || l === null))
                              return (
                                (z.errors = [
                                  {
                                    instancePath: r + '/unavailableReason',
                                    schemaPath: '#/properties/unavailableReason/enum',
                                    keyword: 'enum',
                                    params: { allowedValues: ve.properties.unavailableReason.enum },
                                    message: 'must be equal to one of the allowed values',
                                  },
                                ]),
                                !1
                              );
                            var a = y === t;
                          } else var a = !0;
                          if (a) {
                            if (e.sourceQuote !== void 0) {
                              let l = t;
                              x(e.sourceQuote, {
                                instancePath: r + '/sourceQuote',
                                parentData: e,
                                parentDataProperty: 'sourceQuote',
                                rootData: o,
                                dynamicAnchors: u,
                              }) ||
                                ((s = s === null ? x.errors : s.concat(x.errors)), (t = s.length));
                              var a = l === t;
                            } else var a = !0;
                            if (a)
                              if (e.methodVersion !== void 0) {
                                let l = t;
                                if (e.methodVersion !== '1')
                                  return (
                                    (z.errors = [
                                      {
                                        instancePath: r + '/methodVersion',
                                        schemaPath: '#/properties/methodVersion/const',
                                        keyword: 'const',
                                        params: { allowedValue: '1' },
                                        message: 'must be equal to constant',
                                      },
                                    ]),
                                    !1
                                  );
                                var a = l === t;
                              } else var a = !0;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else
      return (
        (z.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((z.errors = s), t === 0);
}
z.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Le = Y,
  Rt = {
    type: 'object',
    properties: {
      fromCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
      toCurrency: { type: 'string', pattern: '^[A-Z]{3}$', maxLength: 512 },
      amount: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
      mode: { enum: ['EXACT_IN', 'EXACT_OUT'] },
    },
    required: ['fromCurrency', 'toCurrency', 'amount', 'mode'],
    additionalProperties: !1,
  };
function Y(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = Y.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let d;
      if (
        (e.fromCurrency === void 0 && (d = 'fromCurrency')) ||
        (e.toCurrency === void 0 && (d = 'toCurrency')) ||
        (e.amount === void 0 && (d = 'amount')) ||
        (e.mode === void 0 && (d = 'mode'))
      )
        return (
          (Y.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: d },
              message: "must have required property '" + d + "'",
            },
          ]),
          !1
        );
      {
        let c = t;
        for (let h in e)
          if (!(h === 'fromCurrency' || h === 'toCurrency' || h === 'amount' || h === 'mode')) {
            return (
              (Y.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: h },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (c === t) {
          if (e.fromCurrency !== void 0) {
            let h = e.fromCurrency,
              l = t;
            if (t === l)
              if (typeof h == 'string') {
                if (I(h) > 512)
                  return (
                    (Y.errors = [
                      {
                        instancePath: r + '/fromCurrency',
                        schemaPath: '#/properties/fromCurrency/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ]),
                    !1
                  );
                if (!ie.test(h))
                  return (
                    (Y.errors = [
                      {
                        instancePath: r + '/fromCurrency',
                        schemaPath: '#/properties/fromCurrency/pattern',
                        keyword: 'pattern',
                        params: { pattern: '^[A-Z]{3}$' },
                        message: 'must match pattern "^[A-Z]{3}$"',
                      },
                    ]),
                    !1
                  );
              } else
                return (
                  (Y.errors = [
                    {
                      instancePath: r + '/fromCurrency',
                      schemaPath: '#/properties/fromCurrency/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ]),
                  !1
                );
            var a = l === t;
          } else var a = !0;
          if (a) {
            if (e.toCurrency !== void 0) {
              let h = e.toCurrency,
                l = t;
              if (t === l)
                if (typeof h == 'string') {
                  if (I(h) > 512)
                    return (
                      (Y.errors = [
                        {
                          instancePath: r + '/toCurrency',
                          schemaPath: '#/properties/toCurrency/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ]),
                      !1
                    );
                  if (!ie.test(h))
                    return (
                      (Y.errors = [
                        {
                          instancePath: r + '/toCurrency',
                          schemaPath: '#/properties/toCurrency/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^[A-Z]{3}$' },
                          message: 'must match pattern "^[A-Z]{3}$"',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (Y.errors = [
                      {
                        instancePath: r + '/toCurrency',
                        schemaPath: '#/properties/toCurrency/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = l === t;
            } else var a = !0;
            if (a) {
              if (e.amount !== void 0) {
                let h = e.amount,
                  l = t;
                if (t === l)
                  if (typeof h == 'string') {
                    if (I(h) > 512)
                      return (
                        (Y.errors = [
                          {
                            instancePath: r + '/amount',
                            schemaPath: '#/properties/amount/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          },
                        ]),
                        !1
                      );
                    if (!Z.test(h))
                      return (
                        (Y.errors = [
                          {
                            instancePath: r + '/amount',
                            schemaPath: '#/properties/amount/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                            message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                          },
                        ]),
                        !1
                      );
                  } else
                    return (
                      (Y.errors = [
                        {
                          instancePath: r + '/amount',
                          schemaPath: '#/properties/amount/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ]),
                      !1
                    );
                var a = l === t;
              } else var a = !0;
              if (a)
                if (e.mode !== void 0) {
                  let h = e.mode,
                    l = t;
                  if (!(h === 'EXACT_IN' || h === 'EXACT_OUT'))
                    return (
                      (Y.errors = [
                        {
                          instancePath: r + '/mode',
                          schemaPath: '#/properties/mode/enum',
                          keyword: 'enum',
                          params: { allowedValues: Rt.properties.mode.enum },
                          message: 'must be equal to one of the allowed values',
                        },
                      ]),
                      !1
                    );
                  var a = l === t;
                } else var a = !0;
            }
          }
        }
      }
    } else
      return (
        (Y.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((Y.errors = s), t === 0);
}
Y.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ve = {
  type: 'object',
  properties: {
    status: { enum: ['available', 'unavailable'] },
    fromAmount: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    toAmount: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    quoteId: { type: ['string', 'null'] },
    rate: {
      anyOf: [
        { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
        { type: 'null' },
      ],
    },
    reason: { type: ['string', 'null'] },
    feeStatus: { enum: ['unknown', 'no_additional_fee', 'unsupported'] },
  },
  required: ['status', 'fromAmount', 'toAmount', 'quoteId', 'rate', 'reason', 'feeStatus'],
  additionalProperties: !1,
};
function se(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = se.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let l;
      if (
        (e.status === void 0 && (l = 'status')) ||
        (e.fromAmount === void 0 && (l = 'fromAmount')) ||
        (e.toAmount === void 0 && (l = 'toAmount')) ||
        (e.quoteId === void 0 && (l = 'quoteId')) ||
        (e.rate === void 0 && (l = 'rate')) ||
        (e.reason === void 0 && (l = 'reason')) ||
        (e.feeStatus === void 0 && (l = 'feeStatus'))
      )
        return (
          (se.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: l },
              message: "must have required property '" + l + "'",
            },
          ]),
          !1
        );
      {
        let y = t;
        for (let b in e)
          if (
            !(
              b === 'status' ||
              b === 'fromAmount' ||
              b === 'toAmount' ||
              b === 'quoteId' ||
              b === 'rate' ||
              b === 'reason' ||
              b === 'feeStatus'
            )
          ) {
            return (
              (se.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: b },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (y === t) {
          if (e.status !== void 0) {
            let b = e.status,
              g = t;
            if (!(b === 'available' || b === 'unavailable'))
              return (
                (se.errors = [
                  {
                    instancePath: r + '/status',
                    schemaPath: '#/properties/status/enum',
                    keyword: 'enum',
                    params: { allowedValues: Ve.properties.status.enum },
                    message: 'must be equal to one of the allowed values',
                  },
                ]),
                !1
              );
            var a = g === t;
          } else var a = !0;
          if (a) {
            if (e.fromAmount !== void 0) {
              let b = e.fromAmount,
                g = t,
                _ = t,
                m = !1,
                f = t;
              if (t === f)
                if (typeof b == 'string') {
                  if (I(b) > 512) {
                    let w = {
                      instancePath: r + '/fromAmount',
                      schemaPath: '#/properties/fromAmount/anyOf/0/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 512 },
                      message: 'must NOT have more than 512 characters',
                    };
                    (s === null ? (s = [w]) : s.push(w), t++);
                  } else if (!Z.test(b)) {
                    let w = {
                      instancePath: r + '/fromAmount',
                      schemaPath: '#/properties/fromAmount/anyOf/0/pattern',
                      keyword: 'pattern',
                      params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                      message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                    };
                    (s === null ? (s = [w]) : s.push(w), t++);
                  }
                } else {
                  let w = {
                    instancePath: r + '/fromAmount',
                    schemaPath: '#/properties/fromAmount/anyOf/0/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  };
                  (s === null ? (s = [w]) : s.push(w), t++);
                }
              var d = f === t;
              m = m || d;
              let A = t;
              if (b !== null) {
                let w = {
                  instancePath: r + '/fromAmount',
                  schemaPath: '#/properties/fromAmount/anyOf/1/type',
                  keyword: 'type',
                  params: { type: 'null' },
                  message: 'must be null',
                };
                (s === null ? (s = [w]) : s.push(w), t++);
              }
              var d = A === t;
              if (((m = m || d), m)) ((t = _), s !== null && (_ ? (s.length = _) : (s = null)));
              else {
                let w = {
                  instancePath: r + '/fromAmount',
                  schemaPath: '#/properties/fromAmount/anyOf',
                  keyword: 'anyOf',
                  params: {},
                  message: 'must match a schema in anyOf',
                };
                return (s === null ? (s = [w]) : s.push(w), t++, (se.errors = s), !1);
              }
              var a = g === t;
            } else var a = !0;
            if (a) {
              if (e.toAmount !== void 0) {
                let b = e.toAmount,
                  g = t,
                  _ = t,
                  m = !1,
                  f = t;
                if (t === f)
                  if (typeof b == 'string') {
                    if (I(b) > 512) {
                      let w = {
                        instancePath: r + '/toAmount',
                        schemaPath: '#/properties/toAmount/anyOf/0/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      };
                      (s === null ? (s = [w]) : s.push(w), t++);
                    } else if (!Z.test(b)) {
                      let w = {
                        instancePath: r + '/toAmount',
                        schemaPath: '#/properties/toAmount/anyOf/0/pattern',
                        keyword: 'pattern',
                        params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                        message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                      };
                      (s === null ? (s = [w]) : s.push(w), t++);
                    }
                  } else {
                    let w = {
                      instancePath: r + '/toAmount',
                      schemaPath: '#/properties/toAmount/anyOf/0/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    };
                    (s === null ? (s = [w]) : s.push(w), t++);
                  }
                var c = f === t;
                m = m || c;
                let A = t;
                if (b !== null) {
                  let w = {
                    instancePath: r + '/toAmount',
                    schemaPath: '#/properties/toAmount/anyOf/1/type',
                    keyword: 'type',
                    params: { type: 'null' },
                    message: 'must be null',
                  };
                  (s === null ? (s = [w]) : s.push(w), t++);
                }
                var c = A === t;
                if (((m = m || c), m)) ((t = _), s !== null && (_ ? (s.length = _) : (s = null)));
                else {
                  let w = {
                    instancePath: r + '/toAmount',
                    schemaPath: '#/properties/toAmount/anyOf',
                    keyword: 'anyOf',
                    params: {},
                    message: 'must match a schema in anyOf',
                  };
                  return (s === null ? (s = [w]) : s.push(w), t++, (se.errors = s), !1);
                }
                var a = g === t;
              } else var a = !0;
              if (a) {
                if (e.quoteId !== void 0) {
                  let b = e.quoteId,
                    g = t;
                  if (typeof b != 'string' && b !== null)
                    return (
                      (se.errors = [
                        {
                          instancePath: r + '/quoteId',
                          schemaPath: '#/properties/quoteId/type',
                          keyword: 'type',
                          params: { type: Ve.properties.quoteId.type },
                          message: 'must be string,null',
                        },
                      ]),
                      !1
                    );
                  var a = g === t;
                } else var a = !0;
                if (a) {
                  if (e.rate !== void 0) {
                    let b = e.rate,
                      g = t,
                      _ = t,
                      m = !1,
                      f = t;
                    if (t === f)
                      if (typeof b == 'string') {
                        if (I(b) > 512) {
                          let w = {
                            instancePath: r + '/rate',
                            schemaPath: '#/properties/rate/anyOf/0/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          };
                          (s === null ? (s = [w]) : s.push(w), t++);
                        } else if (!Z.test(b)) {
                          let w = {
                            instancePath: r + '/rate',
                            schemaPath: '#/properties/rate/anyOf/0/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                            message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                          };
                          (s === null ? (s = [w]) : s.push(w), t++);
                        }
                      } else {
                        let w = {
                          instancePath: r + '/rate',
                          schemaPath: '#/properties/rate/anyOf/0/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        };
                        (s === null ? (s = [w]) : s.push(w), t++);
                      }
                    var h = f === t;
                    m = m || h;
                    let A = t;
                    if (b !== null) {
                      let w = {
                        instancePath: r + '/rate',
                        schemaPath: '#/properties/rate/anyOf/1/type',
                        keyword: 'type',
                        params: { type: 'null' },
                        message: 'must be null',
                      };
                      (s === null ? (s = [w]) : s.push(w), t++);
                    }
                    var h = A === t;
                    if (((m = m || h), m))
                      ((t = _), s !== null && (_ ? (s.length = _) : (s = null)));
                    else {
                      let w = {
                        instancePath: r + '/rate',
                        schemaPath: '#/properties/rate/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      return (s === null ? (s = [w]) : s.push(w), t++, (se.errors = s), !1);
                    }
                    var a = g === t;
                  } else var a = !0;
                  if (a) {
                    if (e.reason !== void 0) {
                      let b = e.reason,
                        g = t;
                      if (typeof b != 'string' && b !== null)
                        return (
                          (se.errors = [
                            {
                              instancePath: r + '/reason',
                              schemaPath: '#/properties/reason/type',
                              keyword: 'type',
                              params: { type: Ve.properties.reason.type },
                              message: 'must be string,null',
                            },
                          ]),
                          !1
                        );
                      var a = g === t;
                    } else var a = !0;
                    if (a)
                      if (e.feeStatus !== void 0) {
                        let b = e.feeStatus,
                          g = t;
                        if (!(b === 'unknown' || b === 'no_additional_fee' || b === 'unsupported'))
                          return (
                            (se.errors = [
                              {
                                instancePath: r + '/feeStatus',
                                schemaPath: '#/properties/feeStatus/enum',
                                keyword: 'enum',
                                params: { allowedValues: Ve.properties.feeStatus.enum },
                                message: 'must be equal to one of the allowed values',
                              },
                            ]),
                            !1
                          );
                        var a = g === t;
                      } else var a = !0;
                  }
                }
              }
            }
          }
        }
      }
    } else
      return (
        (se.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((se.errors = s), t === 0);
}
se.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ge = Q,
  br = {
    type: 'object',
    properties: {
      now: { type: 'string', format: 'date-time', maxLength: 512 },
      country: { type: 'string', maxLength: 512 },
      deliveryMethod: { enum: ['cash', 'account'] },
      channel: { enum: ['branch', 'online', 'atm', 'unknown'] },
      branchId: { type: 'string', maxLength: 512 },
      denomination: { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
      qualifications: { type: 'array', items: { type: 'string', maxLength: 512 } },
    },
    required: ['now', 'country', 'deliveryMethod', 'channel'],
    additionalProperties: !1,
  };
function Q(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = Q.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let c;
      if (
        (e.now === void 0 && (c = 'now')) ||
        (e.country === void 0 && (c = 'country')) ||
        (e.deliveryMethod === void 0 && (c = 'deliveryMethod')) ||
        (e.channel === void 0 && (c = 'channel'))
      )
        return (
          (Q.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: c },
              message: "must have required property '" + c + "'",
            },
          ]),
          !1
        );
      {
        let h = t;
        for (let l in e)
          if (
            !(
              l === 'now' ||
              l === 'country' ||
              l === 'deliveryMethod' ||
              l === 'channel' ||
              l === 'branchId' ||
              l === 'denomination' ||
              l === 'qualifications'
            )
          ) {
            return (
              (Q.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: l },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (h === t) {
          if (e.now !== void 0) {
            let l = e.now,
              y = t;
            if (t === y && t === y)
              if (typeof l == 'string') {
                if (I(l) > 512)
                  return (
                    (Q.errors = [
                      {
                        instancePath: r + '/now',
                        schemaPath: '#/properties/now/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ]),
                    !1
                  );
                if (!oe.validate(l))
                  return (
                    (Q.errors = [
                      {
                        instancePath: r + '/now',
                        schemaPath: '#/properties/now/format',
                        keyword: 'format',
                        params: { format: 'date-time' },
                        message: 'must match format "date-time"',
                      },
                    ]),
                    !1
                  );
              } else
                return (
                  (Q.errors = [
                    {
                      instancePath: r + '/now',
                      schemaPath: '#/properties/now/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ]),
                  !1
                );
            var a = y === t;
          } else var a = !0;
          if (a) {
            if (e.country !== void 0) {
              let l = e.country,
                y = t;
              if (t === y)
                if (typeof l == 'string') {
                  if (I(l) > 512)
                    return (
                      (Q.errors = [
                        {
                          instancePath: r + '/country',
                          schemaPath: '#/properties/country/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (Q.errors = [
                      {
                        instancePath: r + '/country',
                        schemaPath: '#/properties/country/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = y === t;
            } else var a = !0;
            if (a) {
              if (e.deliveryMethod !== void 0) {
                let l = e.deliveryMethod,
                  y = t;
                if (!(l === 'cash' || l === 'account'))
                  return (
                    (Q.errors = [
                      {
                        instancePath: r + '/deliveryMethod',
                        schemaPath: '#/properties/deliveryMethod/enum',
                        keyword: 'enum',
                        params: { allowedValues: br.properties.deliveryMethod.enum },
                        message: 'must be equal to one of the allowed values',
                      },
                    ]),
                    !1
                  );
                var a = y === t;
              } else var a = !0;
              if (a) {
                if (e.channel !== void 0) {
                  let l = e.channel,
                    y = t;
                  if (!(l === 'branch' || l === 'online' || l === 'atm' || l === 'unknown'))
                    return (
                      (Q.errors = [
                        {
                          instancePath: r + '/channel',
                          schemaPath: '#/properties/channel/enum',
                          keyword: 'enum',
                          params: { allowedValues: br.properties.channel.enum },
                          message: 'must be equal to one of the allowed values',
                        },
                      ]),
                      !1
                    );
                  var a = y === t;
                } else var a = !0;
                if (a) {
                  if (e.branchId !== void 0) {
                    let l = e.branchId,
                      y = t;
                    if (t === y)
                      if (typeof l == 'string') {
                        if (I(l) > 512)
                          return (
                            (Q.errors = [
                              {
                                instancePath: r + '/branchId',
                                schemaPath: '#/properties/branchId/maxLength',
                                keyword: 'maxLength',
                                params: { limit: 512 },
                                message: 'must NOT have more than 512 characters',
                              },
                            ]),
                            !1
                          );
                      } else
                        return (
                          (Q.errors = [
                            {
                              instancePath: r + '/branchId',
                              schemaPath: '#/properties/branchId/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            },
                          ]),
                          !1
                        );
                    var a = y === t;
                  } else var a = !0;
                  if (a) {
                    if (e.denomination !== void 0) {
                      let l = e.denomination,
                        y = t;
                      if (t === y)
                        if (typeof l == 'string') {
                          if (I(l) > 512)
                            return (
                              (Q.errors = [
                                {
                                  instancePath: r + '/denomination',
                                  schemaPath: '#/properties/denomination/maxLength',
                                  keyword: 'maxLength',
                                  params: { limit: 512 },
                                  message: 'must NOT have more than 512 characters',
                                },
                              ]),
                              !1
                            );
                          if (!Z.test(l))
                            return (
                              (Q.errors = [
                                {
                                  instancePath: r + '/denomination',
                                  schemaPath: '#/properties/denomination/pattern',
                                  keyword: 'pattern',
                                  params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                                  message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                },
                              ]),
                              !1
                            );
                        } else
                          return (
                            (Q.errors = [
                              {
                                instancePath: r + '/denomination',
                                schemaPath: '#/properties/denomination/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              },
                            ]),
                            !1
                          );
                      var a = y === t;
                    } else var a = !0;
                    if (a)
                      if (e.qualifications !== void 0) {
                        let l = e.qualifications,
                          y = t;
                        if (t === y)
                          if (Array.isArray(l)) {
                            var d = !0;
                            let g = l.length;
                            for (let _ = 0; _ < g; _++) {
                              let m = l[_],
                                f = t;
                              if (t === f)
                                if (typeof m == 'string') {
                                  if (I(m) > 512)
                                    return (
                                      (Q.errors = [
                                        {
                                          instancePath: r + '/qualifications/' + _,
                                          schemaPath: '#/properties/qualifications/items/maxLength',
                                          keyword: 'maxLength',
                                          params: { limit: 512 },
                                          message: 'must NOT have more than 512 characters',
                                        },
                                      ]),
                                      !1
                                    );
                                } else
                                  return (
                                    (Q.errors = [
                                      {
                                        instancePath: r + '/qualifications/' + _,
                                        schemaPath: '#/properties/qualifications/items/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      },
                                    ]),
                                    !1
                                  );
                              var d = f === t;
                              if (!d) break;
                            }
                          } else
                            return (
                              (Q.errors = [
                                {
                                  instancePath: r + '/qualifications',
                                  schemaPath: '#/properties/qualifications/type',
                                  keyword: 'type',
                                  params: { type: 'array' },
                                  message: 'must be array',
                                },
                              ]),
                              !1
                            );
                        var a = y === t;
                      } else var a = !0;
                  }
                }
              }
            }
          }
        }
      }
    } else
      return (
        (Q.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((Q.errors = s), t === 0);
}
Q.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Et = J;
function J(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = J.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let c;
      if (
        (e.kind === void 0 && (c = 'kind')) ||
        (e.providerId === void 0 && (c = 'providerId')) ||
        (e.fromCurrency === void 0 && (c = 'fromCurrency')) ||
        (e.toCurrency === void 0 && (c = 'toCurrency')) ||
        (e.rate === void 0 && (c = 'rate')) ||
        (e.legs === void 0 && (c = 'legs')) ||
        (e.recommendable === void 0 && (c = 'recommendable'))
      )
        return (
          (J.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: c },
              message: "must have required property '" + c + "'",
            },
          ]),
          !1
        );
      {
        let h = t;
        for (let l in e)
          if (
            !(
              l === 'kind' ||
              l === 'providerId' ||
              l === 'fromCurrency' ||
              l === 'toCurrency' ||
              l === 'rate' ||
              l === 'legs' ||
              l === 'recommendable'
            )
          ) {
            return (
              (J.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: l },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (h === t) {
          if (e.kind !== void 0) {
            let l = t;
            if (e.kind !== 'derived_cross')
              return (
                (J.errors = [
                  {
                    instancePath: r + '/kind',
                    schemaPath: '#/properties/kind/const',
                    keyword: 'const',
                    params: { allowedValue: 'derived_cross' },
                    message: 'must be equal to constant',
                  },
                ]),
                !1
              );
            var a = l === t;
          } else var a = !0;
          if (a) {
            if (e.providerId !== void 0) {
              let l = t;
              if (typeof e.providerId != 'string')
                return (
                  (J.errors = [
                    {
                      instancePath: r + '/providerId',
                      schemaPath: '#/properties/providerId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ]),
                  !1
                );
              var a = l === t;
            } else var a = !0;
            if (a) {
              if (e.fromCurrency !== void 0) {
                let l = t;
                if (typeof e.fromCurrency != 'string')
                  return (
                    (J.errors = [
                      {
                        instancePath: r + '/fromCurrency',
                        schemaPath: '#/properties/fromCurrency/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
                var a = l === t;
              } else var a = !0;
              if (a) {
                if (e.toCurrency !== void 0) {
                  let l = t;
                  if (typeof e.toCurrency != 'string')
                    return (
                      (J.errors = [
                        {
                          instancePath: r + '/toCurrency',
                          schemaPath: '#/properties/toCurrency/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ]),
                      !1
                    );
                  var a = l === t;
                } else var a = !0;
                if (a) {
                  if (e.rate !== void 0) {
                    let l = t;
                    if (typeof e.rate != 'string')
                      return (
                        (J.errors = [
                          {
                            instancePath: r + '/rate',
                            schemaPath: '#/properties/rate/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ]),
                        !1
                      );
                    var a = l === t;
                  } else var a = !0;
                  if (a) {
                    if (e.legs !== void 0) {
                      let l = e.legs,
                        y = t;
                      if (t === y)
                        if (Array.isArray(l)) {
                          if (l.length > 2)
                            return (
                              (J.errors = [
                                {
                                  instancePath: r + '/legs',
                                  schemaPath: '#/properties/legs/maxItems',
                                  keyword: 'maxItems',
                                  params: { limit: 2 },
                                  message: 'must NOT have more than 2 items',
                                },
                              ]),
                              !1
                            );
                          if (l.length < 2)
                            return (
                              (J.errors = [
                                {
                                  instancePath: r + '/legs',
                                  schemaPath: '#/properties/legs/minItems',
                                  keyword: 'minItems',
                                  params: { limit: 2 },
                                  message: 'must NOT have fewer than 2 items',
                                },
                              ]),
                              !1
                            );
                          {
                            var d = !0;
                            let g = l.length;
                            for (let _ = 0; _ < g; _++) {
                              let m = t;
                              if (typeof l[_] != 'string')
                                return (
                                  (J.errors = [
                                    {
                                      instancePath: r + '/legs/' + _,
                                      schemaPath: '#/properties/legs/items/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ]),
                                  !1
                                );
                              var d = m === t;
                              if (!d) break;
                            }
                          }
                        } else
                          return (
                            (J.errors = [
                              {
                                instancePath: r + '/legs',
                                schemaPath: '#/properties/legs/type',
                                keyword: 'type',
                                params: { type: 'array' },
                                message: 'must be array',
                              },
                            ]),
                            !1
                          );
                      var a = y === t;
                    } else var a = !0;
                    if (a)
                      if (e.recommendable !== void 0) {
                        let l = t;
                        if (e.recommendable !== !1)
                          return (
                            (J.errors = [
                              {
                                instancePath: r + '/recommendable',
                                schemaPath: '#/properties/recommendable/const',
                                keyword: 'const',
                                params: { allowedValue: !1 },
                                message: 'must be equal to constant',
                              },
                            ]),
                            !1
                          );
                        var a = l === t;
                      } else var a = !0;
                  }
                }
              }
            }
          }
        }
      }
    } else
      return (
        (J.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((J.errors = s), t === 0);
}
J.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var jt = ae,
  Or = new RegExp('^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))[A-Za-z0-9_/-]+\\.json$', 'u'),
  er = new RegExp('^[a-f0-9]{64}$', 'u');
function ae(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = ae.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let d;
      if ((e.path === void 0 && (d = 'path')) || (e.sha256 === void 0 && (d = 'sha256')))
        return (
          (ae.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: d },
              message: "must have required property '" + d + "'",
            },
          ]),
          !1
        );
      {
        let c = t;
        for (let h in e)
          if (!(h === 'path' || h === 'sha256')) {
            return (
              (ae.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: h },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (c === t) {
          if (e.path !== void 0) {
            let h = e.path,
              l = t;
            if (t === l)
              if (typeof h == 'string') {
                if (I(h) > 512)
                  return (
                    (ae.errors = [
                      {
                        instancePath: r + '/path',
                        schemaPath: '#/properties/path/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ]),
                    !1
                  );
                if (!Or.test(h))
                  return (
                    (ae.errors = [
                      {
                        instancePath: r + '/path',
                        schemaPath: '#/properties/path/pattern',
                        keyword: 'pattern',
                        params: {
                          pattern: '^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))[A-Za-z0-9_/-]+\\.json$',
                        },
                        message:
                          'must match pattern "^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))[A-Za-z0-9_/-]+\\.json$"',
                      },
                    ]),
                    !1
                  );
              } else
                return (
                  (ae.errors = [
                    {
                      instancePath: r + '/path',
                      schemaPath: '#/properties/path/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ]),
                  !1
                );
            var a = l === t;
          } else var a = !0;
          if (a)
            if (e.sha256 !== void 0) {
              let h = e.sha256,
                l = t;
              if (t === l)
                if (typeof h == 'string') {
                  if (!er.test(h))
                    return (
                      (ae.errors = [
                        {
                          instancePath: r + '/sha256',
                          schemaPath: '#/properties/sha256/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^[a-f0-9]{64}$' },
                          message: 'must match pattern "^[a-f0-9]{64}$"',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (ae.errors = [
                      {
                        instancePath: r + '/sha256',
                        schemaPath: '#/properties/sha256/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = l === t;
            } else var a = !0;
        }
      }
    } else
      return (
        (ae.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((ae.errors = s), t === 0);
}
ae.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Dt = F,
  We = {
    type: 'object',
    properties: {
      providerId: { type: 'string', minLength: 1, maxLength: 512 },
      kind: { enum: ['bank', 'exchange_shop'] },
      name: { type: 'string', minLength: 1, maxLength: 512 },
      sourceUrl: { type: 'string', format: 'uri' },
      serviceCountries: {
        type: 'array',
        items: { type: 'string', pattern: '^[A-Z]{2}$' },
        minItems: 1,
      },
      termsUrl: { type: ['string', 'null'] },
      redistributionStatus: { enum: ['verified', 'unknown', 'restricted'] },
      attribution: { type: 'string', minLength: 1, maxLength: 512 },
    },
    required: [
      'providerId',
      'kind',
      'name',
      'sourceUrl',
      'serviceCountries',
      'termsUrl',
      'redistributionStatus',
      'attribution',
    ],
    additionalProperties: !1,
  },
  Ut = Xe.fullFormats.uri;
function F(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = F.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let c;
      if (
        (e.providerId === void 0 && (c = 'providerId')) ||
        (e.kind === void 0 && (c = 'kind')) ||
        (e.name === void 0 && (c = 'name')) ||
        (e.sourceUrl === void 0 && (c = 'sourceUrl')) ||
        (e.serviceCountries === void 0 && (c = 'serviceCountries')) ||
        (e.termsUrl === void 0 && (c = 'termsUrl')) ||
        (e.redistributionStatus === void 0 && (c = 'redistributionStatus')) ||
        (e.attribution === void 0 && (c = 'attribution'))
      )
        return (
          (F.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: c },
              message: "must have required property '" + c + "'",
            },
          ]),
          !1
        );
      {
        let h = t;
        for (let l in e)
          if (
            !(
              l === 'providerId' ||
              l === 'kind' ||
              l === 'name' ||
              l === 'sourceUrl' ||
              l === 'serviceCountries' ||
              l === 'termsUrl' ||
              l === 'redistributionStatus' ||
              l === 'attribution'
            )
          ) {
            return (
              (F.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: l },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (h === t) {
          if (e.providerId !== void 0) {
            let l = e.providerId,
              y = t;
            if (t === y)
              if (typeof l == 'string') {
                if (I(l) > 512)
                  return (
                    (F.errors = [
                      {
                        instancePath: r + '/providerId',
                        schemaPath: '#/properties/providerId/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ]),
                    !1
                  );
                if (I(l) < 1)
                  return (
                    (F.errors = [
                      {
                        instancePath: r + '/providerId',
                        schemaPath: '#/properties/providerId/minLength',
                        keyword: 'minLength',
                        params: { limit: 1 },
                        message: 'must NOT have fewer than 1 characters',
                      },
                    ]),
                    !1
                  );
              } else
                return (
                  (F.errors = [
                    {
                      instancePath: r + '/providerId',
                      schemaPath: '#/properties/providerId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ]),
                  !1
                );
            var a = y === t;
          } else var a = !0;
          if (a) {
            if (e.kind !== void 0) {
              let l = e.kind,
                y = t;
              if (!(l === 'bank' || l === 'exchange_shop'))
                return (
                  (F.errors = [
                    {
                      instancePath: r + '/kind',
                      schemaPath: '#/properties/kind/enum',
                      keyword: 'enum',
                      params: { allowedValues: We.properties.kind.enum },
                      message: 'must be equal to one of the allowed values',
                    },
                  ]),
                  !1
                );
              var a = y === t;
            } else var a = !0;
            if (a) {
              if (e.name !== void 0) {
                let l = e.name,
                  y = t;
                if (t === y)
                  if (typeof l == 'string') {
                    if (I(l) > 512)
                      return (
                        (F.errors = [
                          {
                            instancePath: r + '/name',
                            schemaPath: '#/properties/name/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          },
                        ]),
                        !1
                      );
                    if (I(l) < 1)
                      return (
                        (F.errors = [
                          {
                            instancePath: r + '/name',
                            schemaPath: '#/properties/name/minLength',
                            keyword: 'minLength',
                            params: { limit: 1 },
                            message: 'must NOT have fewer than 1 characters',
                          },
                        ]),
                        !1
                      );
                  } else
                    return (
                      (F.errors = [
                        {
                          instancePath: r + '/name',
                          schemaPath: '#/properties/name/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ]),
                      !1
                    );
                var a = y === t;
              } else var a = !0;
              if (a) {
                if (e.sourceUrl !== void 0) {
                  let l = e.sourceUrl,
                    y = t;
                  if (t === y && t === y)
                    if (typeof l == 'string') {
                      if (!Ut(l))
                        return (
                          (F.errors = [
                            {
                              instancePath: r + '/sourceUrl',
                              schemaPath: '#/properties/sourceUrl/format',
                              keyword: 'format',
                              params: { format: 'uri' },
                              message: 'must match format "uri"',
                            },
                          ]),
                          !1
                        );
                    } else
                      return (
                        (F.errors = [
                          {
                            instancePath: r + '/sourceUrl',
                            schemaPath: '#/properties/sourceUrl/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ]),
                        !1
                      );
                  var a = y === t;
                } else var a = !0;
                if (a) {
                  if (e.serviceCountries !== void 0) {
                    let l = e.serviceCountries,
                      y = t;
                    if (t === y)
                      if (Array.isArray(l)) {
                        if (l.length < 1)
                          return (
                            (F.errors = [
                              {
                                instancePath: r + '/serviceCountries',
                                schemaPath: '#/properties/serviceCountries/minItems',
                                keyword: 'minItems',
                                params: { limit: 1 },
                                message: 'must NOT have fewer than 1 items',
                              },
                            ]),
                            !1
                          );
                        {
                          var d = !0;
                          let g = l.length;
                          for (let _ = 0; _ < g; _++) {
                            let m = l[_],
                              f = t;
                            if (t === f)
                              if (typeof m == 'string') {
                                if (!Je.test(m))
                                  return (
                                    (F.errors = [
                                      {
                                        instancePath: r + '/serviceCountries/' + _,
                                        schemaPath: '#/properties/serviceCountries/items/pattern',
                                        keyword: 'pattern',
                                        params: { pattern: '^[A-Z]{2}$' },
                                        message: 'must match pattern "^[A-Z]{2}$"',
                                      },
                                    ]),
                                    !1
                                  );
                              } else
                                return (
                                  (F.errors = [
                                    {
                                      instancePath: r + '/serviceCountries/' + _,
                                      schemaPath: '#/properties/serviceCountries/items/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ]),
                                  !1
                                );
                            var d = f === t;
                            if (!d) break;
                          }
                        }
                      } else
                        return (
                          (F.errors = [
                            {
                              instancePath: r + '/serviceCountries',
                              schemaPath: '#/properties/serviceCountries/type',
                              keyword: 'type',
                              params: { type: 'array' },
                              message: 'must be array',
                            },
                          ]),
                          !1
                        );
                    var a = y === t;
                  } else var a = !0;
                  if (a) {
                    if (e.termsUrl !== void 0) {
                      let l = e.termsUrl,
                        y = t;
                      if (typeof l != 'string' && l !== null)
                        return (
                          (F.errors = [
                            {
                              instancePath: r + '/termsUrl',
                              schemaPath: '#/properties/termsUrl/type',
                              keyword: 'type',
                              params: { type: We.properties.termsUrl.type },
                              message: 'must be string,null',
                            },
                          ]),
                          !1
                        );
                      var a = y === t;
                    } else var a = !0;
                    if (a) {
                      if (e.redistributionStatus !== void 0) {
                        let l = e.redistributionStatus,
                          y = t;
                        if (!(l === 'verified' || l === 'unknown' || l === 'restricted'))
                          return (
                            (F.errors = [
                              {
                                instancePath: r + '/redistributionStatus',
                                schemaPath: '#/properties/redistributionStatus/enum',
                                keyword: 'enum',
                                params: { allowedValues: We.properties.redistributionStatus.enum },
                                message: 'must be equal to one of the allowed values',
                              },
                            ]),
                            !1
                          );
                        var a = y === t;
                      } else var a = !0;
                      if (a)
                        if (e.attribution !== void 0) {
                          let l = e.attribution,
                            y = t;
                          if (t === y)
                            if (typeof l == 'string') {
                              if (I(l) > 512)
                                return (
                                  (F.errors = [
                                    {
                                      instancePath: r + '/attribution',
                                      schemaPath: '#/properties/attribution/maxLength',
                                      keyword: 'maxLength',
                                      params: { limit: 512 },
                                      message: 'must NOT have more than 512 characters',
                                    },
                                  ]),
                                  !1
                                );
                              if (I(l) < 1)
                                return (
                                  (F.errors = [
                                    {
                                      instancePath: r + '/attribution',
                                      schemaPath: '#/properties/attribution/minLength',
                                      keyword: 'minLength',
                                      params: { limit: 1 },
                                      message: 'must NOT have fewer than 1 characters',
                                    },
                                  ]),
                                  !1
                                );
                            } else
                              return (
                                (F.errors = [
                                  {
                                    instancePath: r + '/attribution',
                                    schemaPath: '#/properties/attribution/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  },
                                ]),
                                !1
                              );
                          var a = y === t;
                        } else var a = !0;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else
      return (
        (F.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((F.errors = s), t === 0);
}
F.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var xr = re;
function M(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = M.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let c;
      if (
        (e.quoteId === void 0 && (c = 'quoteId')) ||
        (e.quoteSeriesId === void 0 && (c = 'quoteSeriesId')) ||
        (e.providerId === void 0 && (c = 'providerId')) ||
        (e.fromCurrency === void 0 && (c = 'fromCurrency')) ||
        (e.toCurrency === void 0 && (c = 'toCurrency')) ||
        (e.providerSide === void 0 && (c = 'providerSide')) ||
        (e.status === void 0 && (c = 'status')) ||
        (e.rate === void 0 && (c = 'rate')) ||
        (e.unavailableReason === void 0 && (c = 'unavailableReason')) ||
        (e.sourceQuote === void 0 && (c = 'sourceQuote')) ||
        (e.methodVersion === void 0 && (c = 'methodVersion'))
      )
        return (
          (M.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: c },
              message: "must have required property '" + c + "'",
            },
          ]),
          !1
        );
      {
        let h = t;
        for (let l in e)
          if (!Ne.call(ve.properties, l)) {
            return (
              (M.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: l },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (h === t) {
          if (e.quoteId !== void 0) {
            let l = e.quoteId,
              y = t;
            if (t === y)
              if (typeof l == 'string') {
                if (I(l) > 2e4)
                  return (
                    (M.errors = [
                      {
                        instancePath: r + '/quoteId',
                        schemaPath: '#/properties/quoteId/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 2e4 },
                        message: 'must NOT have more than 20000 characters',
                      },
                    ]),
                    !1
                  );
              } else
                return (
                  (M.errors = [
                    {
                      instancePath: r + '/quoteId',
                      schemaPath: '#/properties/quoteId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ]),
                  !1
                );
            var a = y === t;
          } else var a = !0;
          if (a) {
            if (e.quoteSeriesId !== void 0) {
              let l = e.quoteSeriesId,
                y = t;
              if (t === y)
                if (typeof l == 'string') {
                  if (I(l) > 2e4)
                    return (
                      (M.errors = [
                        {
                          instancePath: r + '/quoteSeriesId',
                          schemaPath: '#/properties/quoteSeriesId/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 2e4 },
                          message: 'must NOT have more than 20000 characters',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (M.errors = [
                      {
                        instancePath: r + '/quoteSeriesId',
                        schemaPath: '#/properties/quoteSeriesId/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = y === t;
            } else var a = !0;
            if (a) {
              if (e.providerId !== void 0) {
                let l = e.providerId,
                  y = t;
                if (t === y)
                  if (typeof l == 'string') {
                    if (I(l) > 512)
                      return (
                        (M.errors = [
                          {
                            instancePath: r + '/providerId',
                            schemaPath: '#/properties/providerId/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          },
                        ]),
                        !1
                      );
                  } else
                    return (
                      (M.errors = [
                        {
                          instancePath: r + '/providerId',
                          schemaPath: '#/properties/providerId/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ]),
                      !1
                    );
                var a = y === t;
              } else var a = !0;
              if (a) {
                if (e.fromCurrency !== void 0) {
                  let l = e.fromCurrency,
                    y = t;
                  if (t === y)
                    if (typeof l == 'string') {
                      if (I(l) > 512)
                        return (
                          (M.errors = [
                            {
                              instancePath: r + '/fromCurrency',
                              schemaPath: '#/properties/fromCurrency/maxLength',
                              keyword: 'maxLength',
                              params: { limit: 512 },
                              message: 'must NOT have more than 512 characters',
                            },
                          ]),
                          !1
                        );
                      if (!ie.test(l))
                        return (
                          (M.errors = [
                            {
                              instancePath: r + '/fromCurrency',
                              schemaPath: '#/properties/fromCurrency/pattern',
                              keyword: 'pattern',
                              params: { pattern: '^[A-Z]{3}$' },
                              message: 'must match pattern "^[A-Z]{3}$"',
                            },
                          ]),
                          !1
                        );
                    } else
                      return (
                        (M.errors = [
                          {
                            instancePath: r + '/fromCurrency',
                            schemaPath: '#/properties/fromCurrency/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ]),
                        !1
                      );
                  var a = y === t;
                } else var a = !0;
                if (a) {
                  if (e.toCurrency !== void 0) {
                    let l = e.toCurrency,
                      y = t;
                    if (t === y)
                      if (typeof l == 'string') {
                        if (I(l) > 512)
                          return (
                            (M.errors = [
                              {
                                instancePath: r + '/toCurrency',
                                schemaPath: '#/properties/toCurrency/maxLength',
                                keyword: 'maxLength',
                                params: { limit: 512 },
                                message: 'must NOT have more than 512 characters',
                              },
                            ]),
                            !1
                          );
                        if (!ie.test(l))
                          return (
                            (M.errors = [
                              {
                                instancePath: r + '/toCurrency',
                                schemaPath: '#/properties/toCurrency/pattern',
                                keyword: 'pattern',
                                params: { pattern: '^[A-Z]{3}$' },
                                message: 'must match pattern "^[A-Z]{3}$"',
                              },
                            ]),
                            !1
                          );
                      } else
                        return (
                          (M.errors = [
                            {
                              instancePath: r + '/toCurrency',
                              schemaPath: '#/properties/toCurrency/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            },
                          ]),
                          !1
                        );
                    var a = y === t;
                  } else var a = !0;
                  if (a) {
                    if (e.providerSide !== void 0) {
                      let l = e.providerSide,
                        y = t;
                      if (!(l === 'buy' || l === 'sell'))
                        return (
                          (M.errors = [
                            {
                              instancePath: r + '/providerSide',
                              schemaPath: '#/properties/providerSide/enum',
                              keyword: 'enum',
                              params: { allowedValues: ve.properties.providerSide.enum },
                              message: 'must be equal to one of the allowed values',
                            },
                          ]),
                          !1
                        );
                      var a = y === t;
                    } else var a = !0;
                    if (a) {
                      if (e.status !== void 0) {
                        let l = e.status,
                          y = t;
                        if (!(l === 'available' || l === 'unavailable'))
                          return (
                            (M.errors = [
                              {
                                instancePath: r + '/status',
                                schemaPath: '#/properties/status/enum',
                                keyword: 'enum',
                                params: { allowedValues: ve.properties.status.enum },
                                message: 'must be equal to one of the allowed values',
                              },
                            ]),
                            !1
                          );
                        var a = y === t;
                      } else var a = !0;
                      if (a) {
                        if (e.rate !== void 0) {
                          let l = e.rate,
                            y = t,
                            b = t,
                            g = !1,
                            _ = t;
                          if (t === _)
                            if (typeof l == 'string') {
                              if (I(l) > 512) {
                                let A = {
                                  instancePath: r + '/rate',
                                  schemaPath: '#/properties/rate/anyOf/0/maxLength',
                                  keyword: 'maxLength',
                                  params: { limit: 512 },
                                  message: 'must NOT have more than 512 characters',
                                };
                                (s === null ? (s = [A]) : s.push(A), t++);
                              } else if (!Z.test(l)) {
                                let A = {
                                  instancePath: r + '/rate',
                                  schemaPath: '#/properties/rate/anyOf/0/pattern',
                                  keyword: 'pattern',
                                  params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                                  message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                                };
                                (s === null ? (s = [A]) : s.push(A), t++);
                              }
                            } else {
                              let A = {
                                instancePath: r + '/rate',
                                schemaPath: '#/properties/rate/anyOf/0/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              (s === null ? (s = [A]) : s.push(A), t++);
                            }
                          var d = _ === t;
                          g = g || d;
                          let m = t;
                          if (l !== null) {
                            let A = {
                              instancePath: r + '/rate',
                              schemaPath: '#/properties/rate/anyOf/1/type',
                              keyword: 'type',
                              params: { type: 'null' },
                              message: 'must be null',
                            };
                            (s === null ? (s = [A]) : s.push(A), t++);
                          }
                          var d = m === t;
                          if (((g = g || d), g))
                            ((t = b), s !== null && (b ? (s.length = b) : (s = null)));
                          else {
                            let A = {
                              instancePath: r + '/rate',
                              schemaPath: '#/properties/rate/anyOf',
                              keyword: 'anyOf',
                              params: {},
                              message: 'must match a schema in anyOf',
                            };
                            return (s === null ? (s = [A]) : s.push(A), t++, (M.errors = s), !1);
                          }
                          var a = y === t;
                        } else var a = !0;
                        if (a) {
                          if (e.unavailableReason !== void 0) {
                            let l = e.unavailableReason,
                              y = t;
                            if (!(l === 'not_quoted' || l === null))
                              return (
                                (M.errors = [
                                  {
                                    instancePath: r + '/unavailableReason',
                                    schemaPath: '#/properties/unavailableReason/enum',
                                    keyword: 'enum',
                                    params: { allowedValues: ve.properties.unavailableReason.enum },
                                    message: 'must be equal to one of the allowed values',
                                  },
                                ]),
                                !1
                              );
                            var a = y === t;
                          } else var a = !0;
                          if (a) {
                            if (e.sourceQuote !== void 0) {
                              let l = t;
                              x(e.sourceQuote, {
                                instancePath: r + '/sourceQuote',
                                parentData: e,
                                parentDataProperty: 'sourceQuote',
                                rootData: o,
                                dynamicAnchors: u,
                              }) ||
                                ((s = s === null ? x.errors : s.concat(x.errors)), (t = s.length));
                              var a = l === t;
                            } else var a = !0;
                            if (a)
                              if (e.methodVersion !== void 0) {
                                let l = t;
                                if (e.methodVersion !== '1')
                                  return (
                                    (M.errors = [
                                      {
                                        instancePath: r + '/methodVersion',
                                        schemaPath: '#/properties/methodVersion/const',
                                        keyword: 'const',
                                        params: { allowedValue: '1' },
                                        message: 'must be equal to constant',
                                      },
                                    ]),
                                    !1
                                  );
                                var a = l === t;
                              } else var a = !0;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else
      return (
        (M.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((M.errors = s), t === 0);
}
M.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function re(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = re.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let c;
      if (
        (e.schemaVersion === void 0 && (c = 'schemaVersion')) ||
        (e.providerId === void 0 && (c = 'providerId')) ||
        (e.quotes === void 0 && (c = 'quotes'))
      )
        return (
          (re.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: c },
              message: "must have required property '" + c + "'",
            },
          ]),
          !1
        );
      {
        let h = t;
        for (let l in e)
          if (!(l === 'schemaVersion' || l === 'providerId' || l === 'quotes')) {
            return (
              (re.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: l },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (h === t) {
          if (e.schemaVersion !== void 0) {
            let l = t;
            if (e.schemaVersion !== '3.0')
              return (
                (re.errors = [
                  {
                    instancePath: r + '/schemaVersion',
                    schemaPath: '#/properties/schemaVersion/const',
                    keyword: 'const',
                    params: { allowedValue: '3.0' },
                    message: 'must be equal to constant',
                  },
                ]),
                !1
              );
            var a = l === t;
          } else var a = !0;
          if (a) {
            if (e.providerId !== void 0) {
              let l = e.providerId,
                y = t;
              if (t === y)
                if (typeof l == 'string') {
                  if (I(l) > 512)
                    return (
                      (re.errors = [
                        {
                          instancePath: r + '/providerId',
                          schemaPath: '#/properties/providerId/maxLength',
                          keyword: 'maxLength',
                          params: { limit: 512 },
                          message: 'must NOT have more than 512 characters',
                        },
                      ]),
                      !1
                    );
                  if (I(l) < 1)
                    return (
                      (re.errors = [
                        {
                          instancePath: r + '/providerId',
                          schemaPath: '#/properties/providerId/minLength',
                          keyword: 'minLength',
                          params: { limit: 1 },
                          message: 'must NOT have fewer than 1 characters',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (re.errors = [
                      {
                        instancePath: r + '/providerId',
                        schemaPath: '#/properties/providerId/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = y === t;
            } else var a = !0;
            if (a)
              if (e.quotes !== void 0) {
                let l = e.quotes,
                  y = t;
                if (t === y)
                  if (Array.isArray(l)) {
                    if (l.length > 1e4)
                      return (
                        (re.errors = [
                          {
                            instancePath: r + '/quotes',
                            schemaPath: '#/properties/quotes/maxItems',
                            keyword: 'maxItems',
                            params: { limit: 1e4 },
                            message: 'must NOT have more than 10000 items',
                          },
                        ]),
                        !1
                      );
                    if (l.length < 1)
                      return (
                        (re.errors = [
                          {
                            instancePath: r + '/quotes',
                            schemaPath: '#/properties/quotes/minItems',
                            keyword: 'minItems',
                            params: { limit: 1 },
                            message: 'must NOT have fewer than 1 items',
                          },
                        ]),
                        !1
                      );
                    {
                      var d = !0;
                      let g = l.length;
                      for (let _ = 0; _ < g; _++) {
                        let m = t;
                        M(l[_], {
                          instancePath: r + '/quotes/' + _,
                          parentData: l,
                          parentDataProperty: _,
                          rootData: o,
                          dynamicAnchors: u,
                        }) || ((s = s === null ? M.errors : s.concat(M.errors)), (t = s.length));
                        var d = m === t;
                        if (!d) break;
                      }
                    }
                  } else
                    return (
                      (re.errors = [
                        {
                          instancePath: r + '/quotes',
                          schemaPath: '#/properties/quotes/type',
                          keyword: 'type',
                          params: { type: 'array' },
                          message: 'must be array',
                        },
                      ]),
                      !1
                    );
                var a = y === t;
              } else var a = !0;
          }
        }
      }
    } else
      return (
        (re.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((re.errors = s), t === 0);
}
re.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Vt = D,
  Mt = {
    type: 'object',
    properties: {
      schemaVersion: { const: '3.0' },
      generatedAt: { type: 'string', format: 'date-time' },
      providers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            providerId: { type: 'string', minLength: 1, maxLength: 512 },
            snapshot: { $ref: '#/$defs/ObjectReference' },
            checkStatus: { enum: ['ok', 'failed', 'carried_forward'] },
            lastSuccessfulCheckAt: { type: 'string', format: 'date-time' },
          },
          required: ['providerId', 'snapshot', 'checkStatus', 'lastSuccessfulCheckAt'],
          additionalProperties: !1,
        },
        maxItems: 1e3,
      },
      history: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            providerId: { type: 'string', minLength: 1, maxLength: 512 },
            date: { type: 'string', format: 'date' },
            snapshot: { $ref: '#/$defs/ObjectReference' },
          },
          required: ['providerId', 'date', 'snapshot'],
          additionalProperties: !1,
        },
        maxItems: 1e5,
      },
      deprecation: {
        type: 'object',
        properties: {
          activatedAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
          sunsetAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
          replacement: { type: 'string', minLength: 1, maxLength: 512 },
        },
        required: ['activatedAt', 'sunsetAt', 'replacement'],
        additionalProperties: !1,
      },
    },
    required: ['schemaVersion', 'generatedAt', 'providers', 'history', 'deprecation'],
    additionalProperties: !1,
  },
  Ft = Xe.fullFormats.date;
function H(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = H.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let d;
      if ((e.path === void 0 && (d = 'path')) || (e.sha256 === void 0 && (d = 'sha256')))
        return (
          (H.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: d },
              message: "must have required property '" + d + "'",
            },
          ]),
          !1
        );
      {
        let c = t;
        for (let h in e)
          if (!(h === 'path' || h === 'sha256')) {
            return (
              (H.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: h },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (c === t) {
          if (e.path !== void 0) {
            let h = e.path,
              l = t;
            if (t === l)
              if (typeof h == 'string') {
                if (I(h) > 512)
                  return (
                    (H.errors = [
                      {
                        instancePath: r + '/path',
                        schemaPath: '#/properties/path/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      },
                    ]),
                    !1
                  );
                if (!Or.test(h))
                  return (
                    (H.errors = [
                      {
                        instancePath: r + '/path',
                        schemaPath: '#/properties/path/pattern',
                        keyword: 'pattern',
                        params: {
                          pattern: '^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))[A-Za-z0-9_/-]+\\.json$',
                        },
                        message:
                          'must match pattern "^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))[A-Za-z0-9_/-]+\\.json$"',
                      },
                    ]),
                    !1
                  );
              } else
                return (
                  (H.errors = [
                    {
                      instancePath: r + '/path',
                      schemaPath: '#/properties/path/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ]),
                  !1
                );
            var a = l === t;
          } else var a = !0;
          if (a)
            if (e.sha256 !== void 0) {
              let h = e.sha256,
                l = t;
              if (t === l)
                if (typeof h == 'string') {
                  if (!er.test(h))
                    return (
                      (H.errors = [
                        {
                          instancePath: r + '/sha256',
                          schemaPath: '#/properties/sha256/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^[a-f0-9]{64}$' },
                          message: 'must match pattern "^[a-f0-9]{64}$"',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (H.errors = [
                      {
                        instancePath: r + '/sha256',
                        schemaPath: '#/properties/sha256/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = l === t;
            } else var a = !0;
        }
      }
    } else
      return (
        (H.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((H.errors = s), t === 0);
}
H.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function D(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = D.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let _;
      if (
        (e.schemaVersion === void 0 && (_ = 'schemaVersion')) ||
        (e.generatedAt === void 0 && (_ = 'generatedAt')) ||
        (e.providers === void 0 && (_ = 'providers')) ||
        (e.history === void 0 && (_ = 'history')) ||
        (e.deprecation === void 0 && (_ = 'deprecation'))
      )
        return (
          (D.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: _ },
              message: "must have required property '" + _ + "'",
            },
          ]),
          !1
        );
      {
        let m = t;
        for (let f in e)
          if (
            !(
              f === 'schemaVersion' ||
              f === 'generatedAt' ||
              f === 'providers' ||
              f === 'history' ||
              f === 'deprecation'
            )
          ) {
            return (
              (D.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: f },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (m === t) {
          if (e.schemaVersion !== void 0) {
            let f = t;
            if (e.schemaVersion !== '3.0')
              return (
                (D.errors = [
                  {
                    instancePath: r + '/schemaVersion',
                    schemaPath: '#/properties/schemaVersion/const',
                    keyword: 'const',
                    params: { allowedValue: '3.0' },
                    message: 'must be equal to constant',
                  },
                ]),
                !1
              );
            var a = f === t;
          } else var a = !0;
          if (a) {
            if (e.generatedAt !== void 0) {
              let f = e.generatedAt,
                A = t;
              if (t === A && t === A)
                if (typeof f == 'string') {
                  if (!oe.validate(f))
                    return (
                      (D.errors = [
                        {
                          instancePath: r + '/generatedAt',
                          schemaPath: '#/properties/generatedAt/format',
                          keyword: 'format',
                          params: { format: 'date-time' },
                          message: 'must match format "date-time"',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (D.errors = [
                      {
                        instancePath: r + '/generatedAt',
                        schemaPath: '#/properties/generatedAt/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = A === t;
            } else var a = !0;
            if (a) {
              if (e.providers !== void 0) {
                let f = e.providers,
                  A = t;
                if (t === A)
                  if (Array.isArray(f)) {
                    if (f.length > 1e3)
                      return (
                        (D.errors = [
                          {
                            instancePath: r + '/providers',
                            schemaPath: '#/properties/providers/maxItems',
                            keyword: 'maxItems',
                            params: { limit: 1e3 },
                            message: 'must NOT have more than 1000 items',
                          },
                        ]),
                        !1
                      );
                    {
                      var d = !0;
                      let w = f.length;
                      for (let v = 0; v < w; v++) {
                        let C = f[v],
                          k = t;
                        if (t === k)
                          if (C && typeof C == 'object' && !Array.isArray(C)) {
                            let O;
                            if (
                              (C.providerId === void 0 && (O = 'providerId')) ||
                              (C.snapshot === void 0 && (O = 'snapshot')) ||
                              (C.checkStatus === void 0 && (O = 'checkStatus')) ||
                              (C.lastSuccessfulCheckAt === void 0 && (O = 'lastSuccessfulCheckAt'))
                            )
                              return (
                                (D.errors = [
                                  {
                                    instancePath: r + '/providers/' + v,
                                    schemaPath: '#/properties/providers/items/required',
                                    keyword: 'required',
                                    params: { missingProperty: O },
                                    message: "must have required property '" + O + "'",
                                  },
                                ]),
                                !1
                              );
                            {
                              let R = t;
                              for (let q in C)
                                if (
                                  !(
                                    q === 'providerId' ||
                                    q === 'snapshot' ||
                                    q === 'checkStatus' ||
                                    q === 'lastSuccessfulCheckAt'
                                  )
                                ) {
                                  return (
                                    (D.errors = [
                                      {
                                        instancePath: r + '/providers/' + v,
                                        schemaPath:
                                          '#/properties/providers/items/additionalProperties',
                                        keyword: 'additionalProperties',
                                        params: { additionalProperty: q },
                                        message: 'must NOT have additional properties',
                                      },
                                    ]),
                                    !1
                                  );
                                  break;
                                }
                              if (R === t) {
                                if (C.providerId !== void 0) {
                                  let q = C.providerId,
                                    S = t;
                                  if (t === S)
                                    if (typeof q == 'string') {
                                      if (I(q) > 512)
                                        return (
                                          (D.errors = [
                                            {
                                              instancePath: r + '/providers/' + v + '/providerId',
                                              schemaPath:
                                                '#/properties/providers/items/properties/providerId/maxLength',
                                              keyword: 'maxLength',
                                              params: { limit: 512 },
                                              message: 'must NOT have more than 512 characters',
                                            },
                                          ]),
                                          !1
                                        );
                                      if (I(q) < 1)
                                        return (
                                          (D.errors = [
                                            {
                                              instancePath: r + '/providers/' + v + '/providerId',
                                              schemaPath:
                                                '#/properties/providers/items/properties/providerId/minLength',
                                              keyword: 'minLength',
                                              params: { limit: 1 },
                                              message: 'must NOT have fewer than 1 characters',
                                            },
                                          ]),
                                          !1
                                        );
                                    } else
                                      return (
                                        (D.errors = [
                                          {
                                            instancePath: r + '/providers/' + v + '/providerId',
                                            schemaPath:
                                              '#/properties/providers/items/properties/providerId/type',
                                            keyword: 'type',
                                            params: { type: 'string' },
                                            message: 'must be string',
                                          },
                                        ]),
                                        !1
                                      );
                                  var c = S === t;
                                } else var c = !0;
                                if (c) {
                                  if (C.snapshot !== void 0) {
                                    let q = t;
                                    H(C.snapshot, {
                                      instancePath: r + '/providers/' + v + '/snapshot',
                                      parentData: C,
                                      parentDataProperty: 'snapshot',
                                      rootData: o,
                                      dynamicAnchors: u,
                                    }) ||
                                      ((s = s === null ? H.errors : s.concat(H.errors)),
                                      (t = s.length));
                                    var c = q === t;
                                  } else var c = !0;
                                  if (c) {
                                    if (C.checkStatus !== void 0) {
                                      let q = C.checkStatus,
                                        S = t;
                                      if (
                                        !(q === 'ok' || q === 'failed' || q === 'carried_forward')
                                      )
                                        return (
                                          (D.errors = [
                                            {
                                              instancePath: r + '/providers/' + v + '/checkStatus',
                                              schemaPath:
                                                '#/properties/providers/items/properties/checkStatus/enum',
                                              keyword: 'enum',
                                              params: {
                                                allowedValues:
                                                  Mt.properties.providers.items.properties
                                                    .checkStatus.enum,
                                              },
                                              message: 'must be equal to one of the allowed values',
                                            },
                                          ]),
                                          !1
                                        );
                                      var c = S === t;
                                    } else var c = !0;
                                    if (c)
                                      if (C.lastSuccessfulCheckAt !== void 0) {
                                        let q = C.lastSuccessfulCheckAt,
                                          S = t;
                                        if (t === S && t === S)
                                          if (typeof q == 'string') {
                                            if (!oe.validate(q))
                                              return (
                                                (D.errors = [
                                                  {
                                                    instancePath:
                                                      r +
                                                      '/providers/' +
                                                      v +
                                                      '/lastSuccessfulCheckAt',
                                                    schemaPath:
                                                      '#/properties/providers/items/properties/lastSuccessfulCheckAt/format',
                                                    keyword: 'format',
                                                    params: { format: 'date-time' },
                                                    message: 'must match format "date-time"',
                                                  },
                                                ]),
                                                !1
                                              );
                                          } else
                                            return (
                                              (D.errors = [
                                                {
                                                  instancePath:
                                                    r +
                                                    '/providers/' +
                                                    v +
                                                    '/lastSuccessfulCheckAt',
                                                  schemaPath:
                                                    '#/properties/providers/items/properties/lastSuccessfulCheckAt/type',
                                                  keyword: 'type',
                                                  params: { type: 'string' },
                                                  message: 'must be string',
                                                },
                                              ]),
                                              !1
                                            );
                                        var c = S === t;
                                      } else var c = !0;
                                  }
                                }
                              }
                            }
                          } else
                            return (
                              (D.errors = [
                                {
                                  instancePath: r + '/providers/' + v,
                                  schemaPath: '#/properties/providers/items/type',
                                  keyword: 'type',
                                  params: { type: 'object' },
                                  message: 'must be object',
                                },
                              ]),
                              !1
                            );
                        var d = k === t;
                        if (!d) break;
                      }
                    }
                  } else
                    return (
                      (D.errors = [
                        {
                          instancePath: r + '/providers',
                          schemaPath: '#/properties/providers/type',
                          keyword: 'type',
                          params: { type: 'array' },
                          message: 'must be array',
                        },
                      ]),
                      !1
                    );
                var a = A === t;
              } else var a = !0;
              if (a) {
                if (e.history !== void 0) {
                  let f = e.history,
                    A = t;
                  if (t === A)
                    if (Array.isArray(f)) {
                      if (f.length > 1e5)
                        return (
                          (D.errors = [
                            {
                              instancePath: r + '/history',
                              schemaPath: '#/properties/history/maxItems',
                              keyword: 'maxItems',
                              params: { limit: 1e5 },
                              message: 'must NOT have more than 100000 items',
                            },
                          ]),
                          !1
                        );
                      {
                        var h = !0;
                        let w = f.length;
                        for (let v = 0; v < w; v++) {
                          let C = f[v],
                            k = t;
                          if (t === k)
                            if (C && typeof C == 'object' && !Array.isArray(C)) {
                              let O;
                              if (
                                (C.providerId === void 0 && (O = 'providerId')) ||
                                (C.date === void 0 && (O = 'date')) ||
                                (C.snapshot === void 0 && (O = 'snapshot'))
                              )
                                return (
                                  (D.errors = [
                                    {
                                      instancePath: r + '/history/' + v,
                                      schemaPath: '#/properties/history/items/required',
                                      keyword: 'required',
                                      params: { missingProperty: O },
                                      message: "must have required property '" + O + "'",
                                    },
                                  ]),
                                  !1
                                );
                              {
                                let R = t;
                                for (let q in C)
                                  if (!(q === 'providerId' || q === 'date' || q === 'snapshot')) {
                                    return (
                                      (D.errors = [
                                        {
                                          instancePath: r + '/history/' + v,
                                          schemaPath:
                                            '#/properties/history/items/additionalProperties',
                                          keyword: 'additionalProperties',
                                          params: { additionalProperty: q },
                                          message: 'must NOT have additional properties',
                                        },
                                      ]),
                                      !1
                                    );
                                    break;
                                  }
                                if (R === t) {
                                  if (C.providerId !== void 0) {
                                    let q = C.providerId,
                                      S = t;
                                    if (t === S)
                                      if (typeof q == 'string') {
                                        if (I(q) > 512)
                                          return (
                                            (D.errors = [
                                              {
                                                instancePath: r + '/history/' + v + '/providerId',
                                                schemaPath:
                                                  '#/properties/history/items/properties/providerId/maxLength',
                                                keyword: 'maxLength',
                                                params: { limit: 512 },
                                                message: 'must NOT have more than 512 characters',
                                              },
                                            ]),
                                            !1
                                          );
                                        if (I(q) < 1)
                                          return (
                                            (D.errors = [
                                              {
                                                instancePath: r + '/history/' + v + '/providerId',
                                                schemaPath:
                                                  '#/properties/history/items/properties/providerId/minLength',
                                                keyword: 'minLength',
                                                params: { limit: 1 },
                                                message: 'must NOT have fewer than 1 characters',
                                              },
                                            ]),
                                            !1
                                          );
                                      } else
                                        return (
                                          (D.errors = [
                                            {
                                              instancePath: r + '/history/' + v + '/providerId',
                                              schemaPath:
                                                '#/properties/history/items/properties/providerId/type',
                                              keyword: 'type',
                                              params: { type: 'string' },
                                              message: 'must be string',
                                            },
                                          ]),
                                          !1
                                        );
                                    var l = S === t;
                                  } else var l = !0;
                                  if (l) {
                                    if (C.date !== void 0) {
                                      let q = C.date,
                                        S = t;
                                      if (t === S && t === S)
                                        if (typeof q == 'string') {
                                          if (!Ft.validate(q))
                                            return (
                                              (D.errors = [
                                                {
                                                  instancePath: r + '/history/' + v + '/date',
                                                  schemaPath:
                                                    '#/properties/history/items/properties/date/format',
                                                  keyword: 'format',
                                                  params: { format: 'date' },
                                                  message: 'must match format "date"',
                                                },
                                              ]),
                                              !1
                                            );
                                        } else
                                          return (
                                            (D.errors = [
                                              {
                                                instancePath: r + '/history/' + v + '/date',
                                                schemaPath:
                                                  '#/properties/history/items/properties/date/type',
                                                keyword: 'type',
                                                params: { type: 'string' },
                                                message: 'must be string',
                                              },
                                            ]),
                                            !1
                                          );
                                      var l = S === t;
                                    } else var l = !0;
                                    if (l)
                                      if (C.snapshot !== void 0) {
                                        let q = t;
                                        H(C.snapshot, {
                                          instancePath: r + '/history/' + v + '/snapshot',
                                          parentData: C,
                                          parentDataProperty: 'snapshot',
                                          rootData: o,
                                          dynamicAnchors: u,
                                        }) ||
                                          ((s = s === null ? H.errors : s.concat(H.errors)),
                                          (t = s.length));
                                        var l = q === t;
                                      } else var l = !0;
                                  }
                                }
                              }
                            } else
                              return (
                                (D.errors = [
                                  {
                                    instancePath: r + '/history/' + v,
                                    schemaPath: '#/properties/history/items/type',
                                    keyword: 'type',
                                    params: { type: 'object' },
                                    message: 'must be object',
                                  },
                                ]),
                                !1
                              );
                          var h = k === t;
                          if (!h) break;
                        }
                      }
                    } else
                      return (
                        (D.errors = [
                          {
                            instancePath: r + '/history',
                            schemaPath: '#/properties/history/type',
                            keyword: 'type',
                            params: { type: 'array' },
                            message: 'must be array',
                          },
                        ]),
                        !1
                      );
                  var a = A === t;
                } else var a = !0;
                if (a)
                  if (e.deprecation !== void 0) {
                    let f = e.deprecation,
                      A = t;
                    if (t === A)
                      if (f && typeof f == 'object' && !Array.isArray(f)) {
                        let w;
                        if (
                          (f.activatedAt === void 0 && (w = 'activatedAt')) ||
                          (f.sunsetAt === void 0 && (w = 'sunsetAt')) ||
                          (f.replacement === void 0 && (w = 'replacement'))
                        )
                          return (
                            (D.errors = [
                              {
                                instancePath: r + '/deprecation',
                                schemaPath: '#/properties/deprecation/required',
                                keyword: 'required',
                                params: { missingProperty: w },
                                message: "must have required property '" + w + "'",
                              },
                            ]),
                            !1
                          );
                        {
                          let v = t;
                          for (let C in f)
                            if (!(C === 'activatedAt' || C === 'sunsetAt' || C === 'replacement')) {
                              return (
                                (D.errors = [
                                  {
                                    instancePath: r + '/deprecation',
                                    schemaPath: '#/properties/deprecation/additionalProperties',
                                    keyword: 'additionalProperties',
                                    params: { additionalProperty: C },
                                    message: 'must NOT have additional properties',
                                  },
                                ]),
                                !1
                              );
                              break;
                            }
                          if (v === t) {
                            if (f.activatedAt !== void 0) {
                              let C = f.activatedAt,
                                k = t,
                                te = t,
                                O = !1,
                                R = t;
                              if (t === R && t === R)
                                if (typeof C == 'string') {
                                  if (!oe.validate(C)) {
                                    let S = {
                                      instancePath: r + '/deprecation/activatedAt',
                                      schemaPath:
                                        '#/properties/deprecation/properties/activatedAt/anyOf/0/format',
                                      keyword: 'format',
                                      params: { format: 'date-time' },
                                      message: 'must match format "date-time"',
                                    };
                                    (s === null ? (s = [S]) : s.push(S), t++);
                                  }
                                } else {
                                  let S = {
                                    instancePath: r + '/deprecation/activatedAt',
                                    schemaPath:
                                      '#/properties/deprecation/properties/activatedAt/anyOf/0/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  };
                                  (s === null ? (s = [S]) : s.push(S), t++);
                                }
                              var y = R === t;
                              O = O || y;
                              let q = t;
                              if (C !== null) {
                                let S = {
                                  instancePath: r + '/deprecation/activatedAt',
                                  schemaPath:
                                    '#/properties/deprecation/properties/activatedAt/anyOf/1/type',
                                  keyword: 'type',
                                  params: { type: 'null' },
                                  message: 'must be null',
                                };
                                (s === null ? (s = [S]) : s.push(S), t++);
                              }
                              var y = q === t;
                              if (((O = O || y), O))
                                ((t = te), s !== null && (te ? (s.length = te) : (s = null)));
                              else {
                                let S = {
                                  instancePath: r + '/deprecation/activatedAt',
                                  schemaPath:
                                    '#/properties/deprecation/properties/activatedAt/anyOf',
                                  keyword: 'anyOf',
                                  params: {},
                                  message: 'must match a schema in anyOf',
                                };
                                return (
                                  s === null ? (s = [S]) : s.push(S),
                                  t++,
                                  (D.errors = s),
                                  !1
                                );
                              }
                              var b = k === t;
                            } else var b = !0;
                            if (b) {
                              if (f.sunsetAt !== void 0) {
                                let C = f.sunsetAt,
                                  k = t,
                                  te = t,
                                  O = !1,
                                  R = t;
                                if (t === R && t === R)
                                  if (typeof C == 'string') {
                                    if (!oe.validate(C)) {
                                      let j = {
                                        instancePath: r + '/deprecation/sunsetAt',
                                        schemaPath:
                                          '#/properties/deprecation/properties/sunsetAt/anyOf/0/format',
                                        keyword: 'format',
                                        params: { format: 'date-time' },
                                        message: 'must match format "date-time"',
                                      };
                                      (s === null ? (s = [j]) : s.push(j), t++);
                                    }
                                  } else {
                                    let j = {
                                      instancePath: r + '/deprecation/sunsetAt',
                                      schemaPath:
                                        '#/properties/deprecation/properties/sunsetAt/anyOf/0/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    };
                                    (s === null ? (s = [j]) : s.push(j), t++);
                                  }
                                var g = R === t;
                                O = O || g;
                                let q = t;
                                if (C !== null) {
                                  let j = {
                                    instancePath: r + '/deprecation/sunsetAt',
                                    schemaPath:
                                      '#/properties/deprecation/properties/sunsetAt/anyOf/1/type',
                                    keyword: 'type',
                                    params: { type: 'null' },
                                    message: 'must be null',
                                  };
                                  (s === null ? (s = [j]) : s.push(j), t++);
                                }
                                var g = q === t;
                                if (((O = O || g), O))
                                  ((t = te), s !== null && (te ? (s.length = te) : (s = null)));
                                else {
                                  let j = {
                                    instancePath: r + '/deprecation/sunsetAt',
                                    schemaPath:
                                      '#/properties/deprecation/properties/sunsetAt/anyOf',
                                    keyword: 'anyOf',
                                    params: {},
                                    message: 'must match a schema in anyOf',
                                  };
                                  return (
                                    s === null ? (s = [j]) : s.push(j),
                                    t++,
                                    (D.errors = s),
                                    !1
                                  );
                                }
                                var b = k === t;
                              } else var b = !0;
                              if (b)
                                if (f.replacement !== void 0) {
                                  let C = f.replacement,
                                    k = t;
                                  if (t === k)
                                    if (typeof C == 'string') {
                                      if (I(C) > 512)
                                        return (
                                          (D.errors = [
                                            {
                                              instancePath: r + '/deprecation/replacement',
                                              schemaPath:
                                                '#/properties/deprecation/properties/replacement/maxLength',
                                              keyword: 'maxLength',
                                              params: { limit: 512 },
                                              message: 'must NOT have more than 512 characters',
                                            },
                                          ]),
                                          !1
                                        );
                                      if (I(C) < 1)
                                        return (
                                          (D.errors = [
                                            {
                                              instancePath: r + '/deprecation/replacement',
                                              schemaPath:
                                                '#/properties/deprecation/properties/replacement/minLength',
                                              keyword: 'minLength',
                                              params: { limit: 1 },
                                              message: 'must NOT have fewer than 1 characters',
                                            },
                                          ]),
                                          !1
                                        );
                                    } else
                                      return (
                                        (D.errors = [
                                          {
                                            instancePath: r + '/deprecation/replacement',
                                            schemaPath:
                                              '#/properties/deprecation/properties/replacement/type',
                                            keyword: 'type',
                                            params: { type: 'string' },
                                            message: 'must be string',
                                          },
                                        ]),
                                        !1
                                      );
                                  var b = k === t;
                                } else var b = !0;
                            }
                          }
                        }
                      } else
                        return (
                          (D.errors = [
                            {
                              instancePath: r + '/deprecation',
                              schemaPath: '#/properties/deprecation/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                            },
                          ]),
                          !1
                        );
                    var a = A === t;
                  } else var a = !0;
              }
            }
          }
        }
      }
    } else
      return (
        (D.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((D.errors = s), t === 0);
}
D.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var zt = me;
function me(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = me.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let d;
      if (
        (e.schemaVersion === void 0 && (d = 'schemaVersion')) ||
        (e.releaseId === void 0 && (d = 'releaseId')) ||
        (e.manifest === void 0 && (d = 'manifest'))
      )
        return (
          (me.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: d },
              message: "must have required property '" + d + "'",
            },
          ]),
          !1
        );
      {
        let c = t;
        for (let h in e)
          if (!(h === 'schemaVersion' || h === 'releaseId' || h === 'manifest')) {
            return (
              (me.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: h },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (c === t) {
          if (e.schemaVersion !== void 0) {
            let h = t;
            if (e.schemaVersion !== '3.0')
              return (
                (me.errors = [
                  {
                    instancePath: r + '/schemaVersion',
                    schemaPath: '#/properties/schemaVersion/const',
                    keyword: 'const',
                    params: { allowedValue: '3.0' },
                    message: 'must be equal to constant',
                  },
                ]),
                !1
              );
            var a = h === t;
          } else var a = !0;
          if (a) {
            if (e.releaseId !== void 0) {
              let h = e.releaseId,
                l = t;
              if (t === l)
                if (typeof h == 'string') {
                  if (!er.test(h))
                    return (
                      (me.errors = [
                        {
                          instancePath: r + '/releaseId',
                          schemaPath: '#/properties/releaseId/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^[a-f0-9]{64}$' },
                          message: 'must match pattern "^[a-f0-9]{64}$"',
                        },
                      ]),
                      !1
                    );
                } else
                  return (
                    (me.errors = [
                      {
                        instancePath: r + '/releaseId',
                        schemaPath: '#/properties/releaseId/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ]),
                    !1
                  );
              var a = l === t;
            } else var a = !0;
            if (a)
              if (e.manifest !== void 0) {
                let h = t;
                H(e.manifest, {
                  instancePath: r + '/manifest',
                  parentData: e,
                  parentDataProperty: 'manifest',
                  rootData: o,
                  dynamicAnchors: u,
                }) || ((s = s === null ? H.errors : s.concat(H.errors)), (t = s.length));
                var a = h === t;
              } else var a = !0;
          }
        }
      }
    } else
      return (
        (me.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((me.errors = s), t === 0);
}
me.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Zt = W,
  xe = {
    type: 'object',
    properties: {
      status: { enum: ['available', 'unavailable'] },
      fromAmount: {
        anyOf: [
          { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
          { type: 'null' },
        ],
      },
      toAmount: {
        anyOf: [
          { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
          { type: 'null' },
        ],
      },
      quoteId: { type: ['string', 'null'] },
      rate: {
        anyOf: [
          { type: 'string', pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$', maxLength: 512 },
          { type: 'null' },
        ],
      },
      reason: { type: ['string', 'null'] },
      feeStatus: { enum: ['unknown', 'no_additional_fee', 'unsupported'] },
      kind: { const: 'derived_cross' },
      legs: { type: 'array', items: { type: 'string' }, maxItems: 2 },
      recommendable: { const: !1 },
    },
    required: [
      'status',
      'fromAmount',
      'toAmount',
      'quoteId',
      'rate',
      'reason',
      'feeStatus',
      'kind',
      'legs',
      'recommendable',
    ],
    additionalProperties: !1,
  };
function W(
  e,
  {
    instancePath: r = '',
    parentData: i,
    parentDataProperty: n,
    rootData: o = e,
    dynamicAnchors: u = {},
  } = {},
) {
  let s = null,
    t = 0,
    p = W.evaluated;
  if ((p.dynamicProps && (p.props = void 0), p.dynamicItems && (p.items = void 0), t === 0))
    if (e && typeof e == 'object' && !Array.isArray(e)) {
      let y;
      if (
        (e.status === void 0 && (y = 'status')) ||
        (e.fromAmount === void 0 && (y = 'fromAmount')) ||
        (e.toAmount === void 0 && (y = 'toAmount')) ||
        (e.quoteId === void 0 && (y = 'quoteId')) ||
        (e.rate === void 0 && (y = 'rate')) ||
        (e.reason === void 0 && (y = 'reason')) ||
        (e.feeStatus === void 0 && (y = 'feeStatus')) ||
        (e.kind === void 0 && (y = 'kind')) ||
        (e.legs === void 0 && (y = 'legs')) ||
        (e.recommendable === void 0 && (y = 'recommendable'))
      )
        return (
          (W.errors = [
            {
              instancePath: r,
              schemaPath: '#/required',
              keyword: 'required',
              params: { missingProperty: y },
              message: "must have required property '" + y + "'",
            },
          ]),
          !1
        );
      {
        let b = t;
        for (let g in e)
          if (!Ne.call(xe.properties, g)) {
            return (
              (W.errors = [
                {
                  instancePath: r,
                  schemaPath: '#/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: g },
                  message: 'must NOT have additional properties',
                },
              ]),
              !1
            );
            break;
          }
        if (b === t) {
          if (e.status !== void 0) {
            let g = e.status,
              _ = t;
            if (!(g === 'available' || g === 'unavailable'))
              return (
                (W.errors = [
                  {
                    instancePath: r + '/status',
                    schemaPath: '#/properties/status/enum',
                    keyword: 'enum',
                    params: { allowedValues: xe.properties.status.enum },
                    message: 'must be equal to one of the allowed values',
                  },
                ]),
                !1
              );
            var a = _ === t;
          } else var a = !0;
          if (a) {
            if (e.fromAmount !== void 0) {
              let g = e.fromAmount,
                _ = t,
                m = t,
                f = !1,
                A = t;
              if (t === A)
                if (typeof g == 'string') {
                  if (I(g) > 512) {
                    let v = {
                      instancePath: r + '/fromAmount',
                      schemaPath: '#/properties/fromAmount/anyOf/0/maxLength',
                      keyword: 'maxLength',
                      params: { limit: 512 },
                      message: 'must NOT have more than 512 characters',
                    };
                    (s === null ? (s = [v]) : s.push(v), t++);
                  } else if (!Z.test(g)) {
                    let v = {
                      instancePath: r + '/fromAmount',
                      schemaPath: '#/properties/fromAmount/anyOf/0/pattern',
                      keyword: 'pattern',
                      params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                      message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                    };
                    (s === null ? (s = [v]) : s.push(v), t++);
                  }
                } else {
                  let v = {
                    instancePath: r + '/fromAmount',
                    schemaPath: '#/properties/fromAmount/anyOf/0/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  };
                  (s === null ? (s = [v]) : s.push(v), t++);
                }
              var d = A === t;
              f = f || d;
              let L = t;
              if (g !== null) {
                let v = {
                  instancePath: r + '/fromAmount',
                  schemaPath: '#/properties/fromAmount/anyOf/1/type',
                  keyword: 'type',
                  params: { type: 'null' },
                  message: 'must be null',
                };
                (s === null ? (s = [v]) : s.push(v), t++);
              }
              var d = L === t;
              if (((f = f || d), f)) ((t = m), s !== null && (m ? (s.length = m) : (s = null)));
              else {
                let v = {
                  instancePath: r + '/fromAmount',
                  schemaPath: '#/properties/fromAmount/anyOf',
                  keyword: 'anyOf',
                  params: {},
                  message: 'must match a schema in anyOf',
                };
                return (s === null ? (s = [v]) : s.push(v), t++, (W.errors = s), !1);
              }
              var a = _ === t;
            } else var a = !0;
            if (a) {
              if (e.toAmount !== void 0) {
                let g = e.toAmount,
                  _ = t,
                  m = t,
                  f = !1,
                  A = t;
                if (t === A)
                  if (typeof g == 'string') {
                    if (I(g) > 512) {
                      let v = {
                        instancePath: r + '/toAmount',
                        schemaPath: '#/properties/toAmount/anyOf/0/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 512 },
                        message: 'must NOT have more than 512 characters',
                      };
                      (s === null ? (s = [v]) : s.push(v), t++);
                    } else if (!Z.test(g)) {
                      let v = {
                        instancePath: r + '/toAmount',
                        schemaPath: '#/properties/toAmount/anyOf/0/pattern',
                        keyword: 'pattern',
                        params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                        message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                      };
                      (s === null ? (s = [v]) : s.push(v), t++);
                    }
                  } else {
                    let v = {
                      instancePath: r + '/toAmount',
                      schemaPath: '#/properties/toAmount/anyOf/0/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    };
                    (s === null ? (s = [v]) : s.push(v), t++);
                  }
                var c = A === t;
                f = f || c;
                let L = t;
                if (g !== null) {
                  let v = {
                    instancePath: r + '/toAmount',
                    schemaPath: '#/properties/toAmount/anyOf/1/type',
                    keyword: 'type',
                    params: { type: 'null' },
                    message: 'must be null',
                  };
                  (s === null ? (s = [v]) : s.push(v), t++);
                }
                var c = L === t;
                if (((f = f || c), f)) ((t = m), s !== null && (m ? (s.length = m) : (s = null)));
                else {
                  let v = {
                    instancePath: r + '/toAmount',
                    schemaPath: '#/properties/toAmount/anyOf',
                    keyword: 'anyOf',
                    params: {},
                    message: 'must match a schema in anyOf',
                  };
                  return (s === null ? (s = [v]) : s.push(v), t++, (W.errors = s), !1);
                }
                var a = _ === t;
              } else var a = !0;
              if (a) {
                if (e.quoteId !== void 0) {
                  let g = e.quoteId,
                    _ = t;
                  if (typeof g != 'string' && g !== null)
                    return (
                      (W.errors = [
                        {
                          instancePath: r + '/quoteId',
                          schemaPath: '#/properties/quoteId/type',
                          keyword: 'type',
                          params: { type: xe.properties.quoteId.type },
                          message: 'must be string,null',
                        },
                      ]),
                      !1
                    );
                  var a = _ === t;
                } else var a = !0;
                if (a) {
                  if (e.rate !== void 0) {
                    let g = e.rate,
                      _ = t,
                      m = t,
                      f = !1,
                      A = t;
                    if (t === A)
                      if (typeof g == 'string') {
                        if (I(g) > 512) {
                          let v = {
                            instancePath: r + '/rate',
                            schemaPath: '#/properties/rate/anyOf/0/maxLength',
                            keyword: 'maxLength',
                            params: { limit: 512 },
                            message: 'must NOT have more than 512 characters',
                          };
                          (s === null ? (s = [v]) : s.push(v), t++);
                        } else if (!Z.test(g)) {
                          let v = {
                            instancePath: r + '/rate',
                            schemaPath: '#/properties/rate/anyOf/0/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^(0|[1-9][0-9]*)(\\.[0-9]+)?$' },
                            message: 'must match pattern "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"',
                          };
                          (s === null ? (s = [v]) : s.push(v), t++);
                        }
                      } else {
                        let v = {
                          instancePath: r + '/rate',
                          schemaPath: '#/properties/rate/anyOf/0/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        };
                        (s === null ? (s = [v]) : s.push(v), t++);
                      }
                    var h = A === t;
                    f = f || h;
                    let L = t;
                    if (g !== null) {
                      let v = {
                        instancePath: r + '/rate',
                        schemaPath: '#/properties/rate/anyOf/1/type',
                        keyword: 'type',
                        params: { type: 'null' },
                        message: 'must be null',
                      };
                      (s === null ? (s = [v]) : s.push(v), t++);
                    }
                    var h = L === t;
                    if (((f = f || h), f))
                      ((t = m), s !== null && (m ? (s.length = m) : (s = null)));
                    else {
                      let v = {
                        instancePath: r + '/rate',
                        schemaPath: '#/properties/rate/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      return (s === null ? (s = [v]) : s.push(v), t++, (W.errors = s), !1);
                    }
                    var a = _ === t;
                  } else var a = !0;
                  if (a) {
                    if (e.reason !== void 0) {
                      let g = e.reason,
                        _ = t;
                      if (typeof g != 'string' && g !== null)
                        return (
                          (W.errors = [
                            {
                              instancePath: r + '/reason',
                              schemaPath: '#/properties/reason/type',
                              keyword: 'type',
                              params: { type: xe.properties.reason.type },
                              message: 'must be string,null',
                            },
                          ]),
                          !1
                        );
                      var a = _ === t;
                    } else var a = !0;
                    if (a) {
                      if (e.feeStatus !== void 0) {
                        let g = e.feeStatus,
                          _ = t;
                        if (!(g === 'unknown' || g === 'no_additional_fee' || g === 'unsupported'))
                          return (
                            (W.errors = [
                              {
                                instancePath: r + '/feeStatus',
                                schemaPath: '#/properties/feeStatus/enum',
                                keyword: 'enum',
                                params: { allowedValues: xe.properties.feeStatus.enum },
                                message: 'must be equal to one of the allowed values',
                              },
                            ]),
                            !1
                          );
                        var a = _ === t;
                      } else var a = !0;
                      if (a) {
                        if (e.kind !== void 0) {
                          let g = t;
                          if (e.kind !== 'derived_cross')
                            return (
                              (W.errors = [
                                {
                                  instancePath: r + '/kind',
                                  schemaPath: '#/properties/kind/const',
                                  keyword: 'const',
                                  params: { allowedValue: 'derived_cross' },
                                  message: 'must be equal to constant',
                                },
                              ]),
                              !1
                            );
                          var a = g === t;
                        } else var a = !0;
                        if (a) {
                          if (e.legs !== void 0) {
                            let g = e.legs,
                              _ = t;
                            if (t === _)
                              if (Array.isArray(g)) {
                                if (g.length > 2)
                                  return (
                                    (W.errors = [
                                      {
                                        instancePath: r + '/legs',
                                        schemaPath: '#/properties/legs/maxItems',
                                        keyword: 'maxItems',
                                        params: { limit: 2 },
                                        message: 'must NOT have more than 2 items',
                                      },
                                    ]),
                                    !1
                                  );
                                {
                                  var l = !0;
                                  let f = g.length;
                                  for (let A = 0; A < f; A++) {
                                    let L = t;
                                    if (typeof g[A] != 'string')
                                      return (
                                        (W.errors = [
                                          {
                                            instancePath: r + '/legs/' + A,
                                            schemaPath: '#/properties/legs/items/type',
                                            keyword: 'type',
                                            params: { type: 'string' },
                                            message: 'must be string',
                                          },
                                        ]),
                                        !1
                                      );
                                    var l = L === t;
                                    if (!l) break;
                                  }
                                }
                              } else
                                return (
                                  (W.errors = [
                                    {
                                      instancePath: r + '/legs',
                                      schemaPath: '#/properties/legs/type',
                                      keyword: 'type',
                                      params: { type: 'array' },
                                      message: 'must be array',
                                    },
                                  ]),
                                  !1
                                );
                            var a = _ === t;
                          } else var a = !0;
                          if (a)
                            if (e.recommendable !== void 0) {
                              let g = t;
                              if (e.recommendable !== !1)
                                return (
                                  (W.errors = [
                                    {
                                      instancePath: r + '/recommendable',
                                      schemaPath: '#/properties/recommendable/const',
                                      keyword: 'const',
                                      params: { allowedValue: !1 },
                                      message: 'must be equal to constant',
                                    },
                                  ]),
                                  !1
                                );
                              var a = g === t;
                            } else var a = !0;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else
      return (
        (W.errors = [
          {
            instancePath: r,
            schemaPath: '#/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          },
        ]),
        !1
      );
  return ((W.errors = s), t === 0);
}
W.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var B = Ae.clone({ precision: 80, rounding: Ae.ROUND_HALF_EVEN }),
  Qt = Object.freeze({
    TWD: 2,
    USD: 2,
    EUR: 2,
    GBP: 2,
    AUD: 2,
    CAD: 2,
    CHF: 2,
    CNY: 2,
    HKD: 2,
    SGD: 2,
    NZD: 2,
    THB: 2,
    MYR: 2,
    PHP: 2,
    IDR: 2,
    INR: 2,
    ZAR: 2,
    SEK: 2,
    NOK: 2,
    DKK: 2,
    JPY: 0,
    KRW: 0,
    VND: 0,
    KWD: 3,
    BHD: 3,
    OMR: 3,
    TND: 3,
  });
function Nr(e) {
  let r = Qt[e];
  if (r === void 0) throw new Error(`Unsupported currency minor unit: ${e}`);
  return r;
}
function Fe(e) {
  return e.length <= 25 && /^(0|[1-9]\d*)(\.\d{1,8})?$/.test(e) && new B(e).lte('9007199254740991');
}
function ge(e) {
  return e !== null && new B(e).gt(0);
}
function rr(e) {
  return e.toSignificantDigits(34, Ae.ROUND_HALF_EVEN).toFixed();
}
function Me(e) {
  return Array.isArray(e)
    ? `[${e.map(Me).sort().join(',')}]`
    : e !== null && typeof e == 'object'
      ? `{${Object.entries(e)
          .sort(([r], [i]) => r.localeCompare(i))
          .map(([r, i]) => `${JSON.stringify(r)}:${Me(i)}`)
          .join(',')}}`
      : JSON.stringify(e);
}
function tr(e) {
  if (
    !Ye(e) ||
    (e.feeStatus === 'no_additional_fee' && !e.feeEvidenceUrl) ||
    (e.amountRange && new B(e.amountRange.min).gt(e.amountRange.max)) ||
    e.denominations?.some((r) => !ge(r)) ||
    !ge(e.unitAmount) ||
    e.subjectCurrency === e.priceCurrency ||
    (e.buy !== null && !ge(e.buy)) ||
    (e.sell !== null && !ge(e.sell))
  )
    throw new Error('Invalid source quote');
  return ['buy', 'sell'].map((r) => {
    let i = r === 'buy' ? e.subjectCurrency : e.priceCurrency,
      n = r === 'buy' ? e.priceCurrency : e.subjectCurrency,
      o = {
        providerId: e.providerId,
        fromCurrency: i,
        toCurrency: n,
        side: r,
        serviceCountry: e.serviceCountry,
        deliveryMethod: e.deliveryMethod,
        channel: e.channel,
        branchId: e.branchId ?? null,
        denominations: e.denominations?.map((c) => new B(c).toFixed()) ?? null,
        qualifications: e.qualifications ?? null,
        amountRange: e.amountRange
          ? {
              ...e.amountRange,
              min: new B(e.amountRange.min).toFixed(),
              max: new B(e.amountRange.max).toFixed(),
            }
          : null,
      },
      u = `fx3:${encodeURIComponent(Me(o))}`,
      { lastSuccessfulCheckAt: s, fetchedAt: t, ...p } = e,
      a = `${u}:${encodeURIComponent(Me(p))}`,
      d = e[r];
    return {
      quoteId: a,
      quoteSeriesId: u,
      providerId: e.providerId,
      fromCurrency: i,
      toCurrency: n,
      providerSide: r,
      status: d === null ? 'unavailable' : 'available',
      rate:
        d === null
          ? null
          : rr(r === 'buy' ? new B(d).div(e.unitAmount) : new B(e.unitAmount).div(d)),
      unavailableReason: d === null ? 'not_quoted' : null,
      sourceQuote: structuredClone(e),
      methodVersion: '1',
    };
  });
}
function Gt(e) {
  return !Ye(e) || !ge(e.unitAmount) || !ge(e.buy) || !ge(e.sell)
    ? null
    : rr(new B(e.buy).plus(e.sell).div(2).div(e.unitAmount));
}
function _e(e, r = null) {
  return {
    status: 'unavailable',
    fromAmount: null,
    toAmount: null,
    quoteId: r,
    rate: null,
    reason: e,
    feeStatus: 'unknown',
  };
}
function Lr(e, r) {
  return !Le(r) || !Fe(r.amount)
    ? _e('invalid_amount')
    : r.fromCurrency === r.toCurrency
      ? {
          status: 'available',
          fromAmount: r.amount,
          toAmount: r.amount,
          quoteId: null,
          rate: '1',
          reason: null,
          feeStatus: 'no_additional_fee',
        }
      : !e || !ke(e) || e.status !== 'available' || e.rate === null || !ge(e.rate)
        ? _e('not_quoted', e?.quoteId ?? null)
        : e.fromCurrency !== r.fromCurrency || e.toCurrency !== r.toCurrency
          ? _e('direction_mismatch', e.quoteId)
          : Sr(e.rate, r, e.quoteId, e.sourceQuote.feeStatus ?? 'unknown');
}
function Sr(e, r, i, n) {
  let o, u;
  try {
    ((o = Nr(r.fromCurrency)), (u = Nr(r.toCurrency)));
  } catch {
    return _e('unsupported_currency', i);
  }
  let s = new B(e),
    t = new B(r.amount),
    p = r.mode === 'EXACT_IN' ? t : t.div(s).toDecimalPlaces(o, Ae.ROUND_CEIL),
    a = r.mode === 'EXACT_OUT' ? t : p.mul(s).toDecimalPlaces(u, Ae.ROUND_HALF_EVEN);
  return p.gt('9007199254740991')
    ? _e('amount_out_of_range', i)
    : {
        status: 'available',
        fromAmount: p.toFixed(),
        toAmount: a.toFixed(),
        quoteId: i,
        rate: e,
        reason: null,
        feeStatus: n,
      };
}
function Bt(e, r) {
  let i = e.sourceQuote;
  if (i.sourcePublishedAt === null) return 'unknown';
  let n = Date.parse(r),
    o = Date.parse(i.sourcePublishedAt),
    u = Date.parse(i.lastSuccessfulCheckAt);
  if (![n, o, u].every(Number.isFinite) || o > n || u > n) return 'unknown';
  let s = i.providerId === 'bot' ? 36 : 24;
  return n - o <= s * 36e5 && n - u <= 30 * 6e4 ? 'fresh' : 'stale';
}
function Ht(e, r, i) {
  if (!Ge(i) || !Le(r) || !Fe(r.amount) || !ke(e)) return !1;
  let n = e.sourceQuote;
  if (
    e.fromCurrency !== r.fromCurrency ||
    e.toCurrency !== r.toCurrency ||
    n.serviceCountry !== i.country ||
    n.deliveryMethod !== i.deliveryMethod ||
    n.channel !== i.channel ||
    (n.branchId && n.branchId !== i.branchId) ||
    (n.denominations &&
      (!i.denomination || !n.denominations.some((u) => new B(u).eq(i.denomination ?? '0')))) ||
    n.qualifications?.some((u) => !i.qualifications?.includes(u))
  )
    return !1;
  let o = Lr(e, r);
  if (o.status !== 'available') return !1;
  if (n.amountRange) {
    let u =
      n.amountRange.currency === r.fromCurrency
        ? o.fromAmount
        : n.amountRange.currency === r.toCurrency
          ? o.toAmount
          : null;
    if (u === null || new B(u).lt(n.amountRange.min) || new B(u).gt(n.amountRange.max)) return !1;
  }
  return !0;
}
function es(e, r, i, n) {
  return !Ge(i) || !Le(r) || !Fe(r.amount) || new B(r.amount).isZero()
    ? []
    : e
        .filter(
          (o) =>
            (!n || n.get(o.providerId) === 'ok') &&
            Ht(o, r, i) &&
            Bt(o, i.now) === 'fresh' &&
            o.sourceQuote.feeStatus !== 'unsupported' &&
            (!o.sourceQuote.dataKind || o.sourceQuote.dataKind === 'published_board'),
        )
        .map((o) => ({ quote: o, estimate: Lr(o, r) }))
        .sort((o, u) =>
          r.mode === 'EXACT_IN'
            ? new B(u.estimate.toAmount ?? '0').cmp(o.estimate.toAmount ?? '0') ||
              o.quote.quoteId.localeCompare(u.quote.quoteId)
            : new B(o.estimate.fromAmount ?? '0').cmp(u.estimate.fromAmount ?? '0') ||
              o.quote.quoteId.localeCompare(u.quote.quoteId),
        );
}
function we(e) {
  if (e === null || typeof e != 'object' || Array.isArray(e))
    throw new Error('Invalid provider payload');
  return e;
}
function Se(e) {
  if (e == null) return null;
  let r = typeof e == 'number' && Number.isFinite(e) ? String(e) : e;
  if (typeof r != 'string' || !/^(0|[1-9]\d*)(\.\d+)?$/.test(r) || !new B(r).gt(0))
    throw new Error('Invalid provider decimal');
  return r;
}
function qr(e) {
  let r = e.fetchedAt ?? e.timestamp;
  if (typeof r != 'string' || !Number.isFinite(Date.parse(r)))
    throw new Error('Missing provider fetch time');
  let i = e.sourcePublishedAt ?? null,
    n = e.lastSuccessfulCheckAt ?? r;
  if (i !== null && (typeof i != 'string' || !Number.isFinite(Date.parse(i))))
    throw new Error('Invalid source time');
  if (typeof n != 'string' || !Number.isFinite(Date.parse(n)))
    throw new Error('Invalid check time');
  return { sourcePublishedAt: i, fetchedAt: r, lastSuccessfulCheckAt: n };
}
function rs(e) {
  let r = we(e),
    i = we(r.sourceQuotes ?? r.details),
    n = r.dataKind === 'fixed_fallback' ? { dataKind: 'fixed_fallback' } : {};
  return Object.entries(i).flatMap(([o, u]) => {
    let s = we(u);
    return ['cash', 'spot'].flatMap((t) => {
      if (s[t] === void 0) return [];
      let p = we(s[t]);
      return tr({
        providerId: 'bot',
        subjectCurrency: o,
        priceCurrency: 'TWD',
        unitAmount: '1',
        buy: Se(p.buy),
        sell: Se(p.sell),
        ...qr(r),
        serviceCountry: 'TW',
        deliveryMethod: t === 'cash' ? 'cash' : 'account',
        channel: t === 'cash' ? 'branch' : 'online',
        feeStatus: 'unknown',
        originalBuyField: `${t}.buy`,
        originalSellField: `${t}.sell`,
        mappingVersion: 'bot-1',
        sourceUrl: 'https://rate.bot.com.tw/xrt?Lang=zh-TW',
        ...n,
      });
    });
  });
}
function ts(e) {
  let r = we(e),
    i = r.sourceQuotes !== void 0,
    n = we(r.sourceQuotes ?? r.rates);
  return Object.entries(n).flatMap(([o, u]) => {
    if (o === 'KRW') return [];
    let s = we(u),
      t = i ? Se(s.unitAmount) : ['JPY', 'IDR', 'VND'].includes(o) ? '100' : '1';
    if (t === null) throw new Error('Missing quote unit');
    return tr({
      providerId: 'moneybox',
      subjectCurrency: o,
      priceCurrency: 'KRW',
      unitAmount: t,
      buy: Se(s[i ? 'buy' : 'sell']),
      sell: Se(s[i ? 'sell' : 'buy']),
      ...qr(r),
      serviceCountry: 'KR',
      deliveryMethod: 'cash',
      channel: 'branch',
      branchId: 'myeongdong',
      feeStatus: 'unknown',
      originalBuyField: i ? 'buyRate' : 'sell',
      originalSellField: i ? 'sellRate' : 'buy',
      mappingVersion: i ? 'moneybox-2' : 'moneybox-legacy-1',
      sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange/',
    });
  });
}
function ke(e) {
  if (!Cr(e)) return !1;
  try {
    let r = tr(e.sourceQuote).find((i) => i.providerSide === e.providerSide);
    return (
      r !== void 0 &&
      [
        'quoteId',
        'quoteSeriesId',
        'providerId',
        'fromCurrency',
        'toCurrency',
        'status',
        'rate',
        'unavailableReason',
        'methodVersion',
      ].every((i) => r[i] === e[i])
    );
  } catch {
    return !1;
  }
}
var ss = ke;
function Kt(e, r) {
  if (
    !ke(e) ||
    !ke(r) ||
    !e.rate ||
    !r.rate ||
    e.toCurrency !== r.fromCurrency ||
    e.fromCurrency === r.toCurrency ||
    e.providerId !== r.providerId
  )
    return null;
  let i = e.sourceQuote,
    n = r.sourceQuote;
  return i.deliveryMethod !== n.deliveryMethod ||
    i.channel !== n.channel ||
    i.serviceCountry !== n.serviceCountry ||
    i.branchId !== n.branchId
    ? null
    : {
        kind: 'derived_cross',
        providerId: e.providerId,
        fromCurrency: e.fromCurrency,
        toCurrency: r.toCurrency,
        rate: rr(new B(e.rate).mul(r.rate)),
        legs: [e.quoteId, r.quoteId],
        recommendable: !1,
      };
}
function as(e, r) {
  let i = {};
  for (let n of e) {
    if (!ke(n) || n.providerId !== r) throw new Error('Invalid legacy source');
    let o = n.sourceQuote;
    if (r === 'moneybox') {
      let u = ['JPY', 'IDR', 'VND'].includes(o.subjectCurrency) ? '100' : '1';
      i[o.subjectCurrency] = {
        sell: o.buy === null ? null : new B(o.buy).div(o.unitAmount).mul(u).toFixed(),
        buy: o.sell === null ? null : new B(o.sell).div(o.unitAmount).mul(u).toFixed(),
      };
    } else {
      let u = i[o.subjectCurrency] ?? (i[o.subjectCurrency] = {}),
        s = o.deliveryMethod === 'cash' ? 'cash' : 'spot';
      ((u[`${s}Buy`] = o.buy), (u[`${s}Sell`] = o.sell));
    }
  }
  return i;
}
function is(e, r, i) {
  let n = Kt(e, r);
  return {
    ...(!n ||
    !Le(i) ||
    !Fe(i.amount) ||
    n.fromCurrency !== i.fromCurrency ||
    n.toCurrency !== i.toCurrency
      ? _e('invalid_derived_route')
      : Sr(n.rate, i, null, 'unknown')),
    kind: 'derived_cross',
    legs: n?.legs ?? [],
    recommendable: !1,
  };
}
function ns(e) {
  return (
    xr(e) &&
    e.quotes.length > 0 &&
    e.quotes.every((r) => r.providerId === e.providerId && ke(r)) &&
    new Set(e.quotes.map((r) => r.quoteId)).size === e.quotes.length
  );
}
export {
  Qt as MINOR_UNITS,
  Gt as boardMidpoint,
  Kt as deriveCrossQuote,
  Lr as estimate,
  is as estimateDerived,
  as as exportLegacyRates,
  Bt as freshness,
  Ht as isQuoteApplicable,
  Fe as isValidAmount,
  Nr as minorUnit,
  rs as normalizeBankSnapshot,
  ts as normalizeMoneyboxSnapshot,
  tr as normalizeQuote,
  es as rankQuotes,
  zt as validateCurrentRelease,
  Et as validateDerivedCrossQuote,
  Zt as validateDerivedEstimateResult,
  Le as validateEstimateRequest,
  ss as validateNormalizedQuote,
  jt as validateObjectReference,
  Dt as validateProvider,
  ns as validateProviderSnapshot,
  ke as validateQuoteSnapshot,
  Vt as validateReleaseManifest,
  Ge as validateSelectionContext,
  Ye as validateSourceQuote,
};
/*! Bundled license information:

decimal.js/decimal.mjs:
  (*!
   *  decimal.js v10.6.0
   *  An arbitrary-precision Decimal type for JavaScript.
   *  https://github.com/MikeMcl/decimal.js
   *  Copyright (c) 2025 Michael Mclaughlin <M8ch88l@gmail.com>
   *  MIT Licence
   *)
*/
