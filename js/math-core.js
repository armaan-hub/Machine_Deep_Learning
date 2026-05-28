const MathCore = (() => {
  const EPS = 1e-9;
  const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
  const sanitize = (v) => Number.isFinite(v) ? v : 0;

  function identity(n) {
    return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (r === c ? 1 : 0)));
  }
  function clone(m) { return m.map(row => row.slice()); }
  function transpose(m) { return m[0].map((_, c) => m.map(r => r[c])); }
  function multiply(A, B) {
    const rows = A.length;
    const cols = B[0].length;
    const inner = B.length;
    const out = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0;
        for (let k = 0; k < inner; k++) sum += A[r][k] * B[k][c];
        out[r][c] = sanitize(sum);
      }
    }
    return out;
  }
  function multiplyVec(M, v) {
    const out = new Array(M.length).fill(0);
    for (let r = 0; r < M.length; r++) {
      let sum = 0;
      for (let c = 0; c < v.length; c++) sum += M[r][c] * v[c];
      out[r] = sanitize(sum);
    }
    return out;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function matLerp(A, B, t) {
    return A.map((row, r) => row.map((v, c) => sanitize(lerp(v, B[r][c], t))));
  }
  function det2([[a, b], [c, d]]) { return sanitize(a * d - b * c); }
  function det3(m) {
    const [a, b, c] = m[0];
    const [d, e, f] = m[1];
    const [g, h, i] = m[2];
    return sanitize(a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g));
  }
  function normalize(v) {
    const mag = Math.hypot(v[0], v[1]);
    if (mag < EPS) return [1, 0];
    return [sanitize(v[0] / mag), sanitize(v[1] / mag)];
  }
  function solveEigenvector2(M, lambda) {
    const a = M[0][0] - lambda;
    const b = M[0][1];
    const c = M[1][0];
    const d = M[1][1] - lambda;
    const n1 = Math.hypot(a, b);
    const n2 = Math.hypot(c, d);
    if (n1 < EPS && n2 < EPS) return [1, 0];
    const row = n1 >= n2 ? [a, b] : [c, d];
    let v = [-row[1], row[0]];
    if (Math.hypot(v[0], v[1]) < EPS) v = [1, 0];
    return normalize(v);
  }

  function eigen2(M) {
    const a = sanitize(M[0][0]);
    const b = sanitize(M[0][1]);
    const c = sanitize(M[1][0]);
    const d = sanitize(M[1][1]);
    const tr = sanitize(a + d);
    const det = sanitize(a * d - b * c);
    const disc = sanitize(tr * tr - 4 * det);
    const singular = Math.abs(det) < 1e-9;

    if (disc < -1e-9) {
      const alpha = sanitize(tr / 2);
      const beta = sanitize(Math.sqrt(Math.max(0, -disc)) / 2);
      return {
        values: [alpha, alpha],
        complex: true,
        repeated: false,
        singular,
        vectors: null,
        display: [`${alpha.toFixed(2)}±${beta.toFixed(2)}i`],
        rotationAngle: sanitize(Math.atan2(c, a) * (180 / Math.PI))
      };
    }

    const sdisc = Math.sqrt(Math.max(0, disc));
    const l1 = sanitize((tr + sdisc) / 2);
    const l2 = sanitize((tr - sdisc) / 2);
    const repeated = Math.abs(l1 - l2) < 1e-6;

    let v1 = solveEigenvector2(M, l1);
    let v2 = repeated ? null : solveEigenvector2(M, l2);

    if (!repeated && v2 && Math.abs(v1[0] * v2[1] - v1[1] * v2[0]) < 1e-5) {
      v2 = normalize([-v1[1], v1[0]]);
    }

    return {
      values: [l1, l2],
      complex: false,
      repeated,
      singular,
      vectors: [v1, v2],
      display: [l1.toFixed(2), l2.toFixed(2)],
      rotationAngle: null
    };
  }

  function interpolateMatrix(targetM, t, dim = 2) {
    const n = dim || targetM.length;
    const I = identity(n);
    if (n !== 2) return matLerp(I, targetM, t);

    const A = targetM;
    const d = det2(A);
    if (Math.abs(d) < 1e-9) return matLerp(I, A, t);

    const theta = Math.atan2(A[1][0] - A[0][1], A[0][0] + A[1][1]);
    const ct = Math.cos(theta);
    const st = Math.sin(theta);
    const R = [[ct, -st], [st, ct]];
    const Rt = transpose(R);
    const S = multiply(Rt, A);

    const th = theta * t;
    const cth = Math.cos(th);
    const sth = Math.sin(th);
    const R_t = [[cth, -sth], [sth, cth]];
    const S_t = [
      [lerp(1, S[0][0], t), lerp(0, S[0][1], t)],
      [lerp(0, S[1][0], t), lerp(1, S[1][1], t)]
    ];
    return multiply(R_t, S_t).map(row => row.map(sanitize));
  }

  // svd2: 2×2 Singular Value Decomposition
  // Returns { U: [[],[]], S: [σ1, σ2], V: [[],[]], rank: int, cond: number }
  // Satisfies: M ≈ U * diag(S) * V^T, with ||M - U*diag(S)*V^T||_F < 1e-10
  function svd2(M) {
    const B = multiply(transpose(M), M);
    const eig = eigen2(B);
    const s1 = Math.sqrt(Math.max(0, eig.values[0]));
    const s2 = Math.sqrt(Math.max(0, eig.values[1]));
    let V, U;
    if (eig.complex || !eig.vectors) {
      V = [[1,0],[0,1]];
    } else {
      V = [[eig.vectors[0][0], eig.vectors[1][0]],
           [eig.vectors[0][1], eig.vectors[1][1]]];
    }
    const u1_raw = [M[0][0]*V[0][0] + M[0][1]*V[1][0],
                    M[1][0]*V[0][0] + M[1][1]*V[1][0]];
    const u2_raw = [M[0][0]*V[0][1] + M[0][1]*V[1][1],
                    M[1][0]*V[0][1] + M[1][1]*V[1][1]];
    const mag1 = Math.sqrt(u1_raw[0]*u1_raw[0] + u1_raw[1]*u1_raw[1]);
    const mag2 = Math.sqrt(u2_raw[0]*u2_raw[0] + u2_raw[1]*u2_raw[1]);
    const u1 = mag1 > 1e-10 ? [u1_raw[0]/mag1, u1_raw[1]/mag1] : [1, 0];
    const u2 = mag2 > 1e-10 ? [u2_raw[0]/mag2, u2_raw[1]/mag2]
         : [-u1[1], u1[0]];
    U = [[u1[0], u2[0]], [u1[1], u2[1]]];
    if (det2(U) < 0) { U[0][1] = -U[0][1]; U[1][1] = -U[1][1]; }
    if (det2(V) < 0) { V[0][1] = -V[0][1]; V[1][1] = -V[1][1]; }
    const rank = (s1 > 1e-9 ? 1 : 0) + (s2 > 1e-9 ? 1 : 0);
    const cond = s2 > 1e-9 ? s1/s2 : Infinity;
    return { U, S: [s1, s2], V, rank, cond };
  }

  // pca2: PCA on 2D point cloud
  // points: [[x,y], ...], returns { mean, cov, vectors, values, scores }
  function pca2(points) {
    if (!points || points.length < 2) return null;
    const n = points.length;
    const mx = points.reduce((s,p) => s+p[0], 0)/n;
    const my = points.reduce((s,p) => s+p[1], 0)/n;
    const centered = points.map(p => [p[0]-mx, p[1]-my]);
    const cov = [[0,0],[0,0]];
    centered.forEach(p => {
      cov[0][0] += p[0]*p[0]; cov[0][1] += p[0]*p[1];
      cov[1][0] += p[1]*p[0]; cov[1][1] += p[1]*p[1];
    });
    cov[0][0]/=n; cov[0][1]/=n; cov[1][0]/=n; cov[1][1]/=n;
    const eig = eigen2(cov);
    const scores = centered.map(p => ({
      pc1: p[0]*(eig.vectors?eig.vectors[0][0]:1) + p[1]*(eig.vectors?eig.vectors[1][0]:0),
      pc2: p[0]*(eig.vectors?eig.vectors[0][1]:0) + p[1]*(eig.vectors?eig.vectors[1][1]:1)
    }));
    return { mean: [mx,my], cov, vectors: eig.vectors, values: eig.values, scores };
  }

  return {
    identity, clone, transpose, multiply, multiplyVec, lerp, matLerp,
    approx, det2, det3, eigen2, interpolateMatrix, svd2, pca2
  };
})();

if (typeof window !== 'undefined') window.MathCore = MathCore;

// Self-test — run with: node -e "global.window={}; global.window.__MATHCORE_TEST=1;" before require
if (typeof window !== 'undefined' && window.__MATHCORE_TEST) {
  (function() {
    function assertClose(a, b, msg) {
      if (Math.abs(a-b) > 1e-8) throw new Error(msg + ': expected '+b+' got '+a);
    }
    function frobenius(A, B) {
      let s=0;
      for(let i=0;i<A.length;i++) for(let j=0;j<A[0].length;j++) s+=(A[i][j]-B[i][j])**2;
      return Math.sqrt(s);
    }
    const e1 = MathCore.eigen2([[3,1],[0,2]]);
    assertClose(e1.values[0], 3, 'eigen2 λ1');
    assertClose(e1.values[1], 2, 'eigen2 λ2');
    function reconstruct(svd) {
      const {U,S,V} = svd;
      return [[U[0][0]*S[0]*V[0][0]+U[0][1]*S[1]*V[0][1], U[0][0]*S[0]*V[1][0]+U[0][1]*S[1]*V[1][1]],
              [U[1][0]*S[0]*V[0][0]+U[1][1]*S[1]*V[0][1], U[1][0]*S[0]*V[1][0]+U[1][1]*S[1]*V[1][1]]];
    }
    const m1 = [[3,0],[0,2]];
    assertClose(frobenius(reconstruct(MathCore.svd2(m1)), m1), 0, 'svd2 diagonal reconstruction');
    const m2 = [[1,1],[0,1]];
    assertClose(frobenius(reconstruct(MathCore.svd2(m2)), m2), 0, 'svd2 shear reconstruction');
    assertClose(MathCore.det2([[2,1],[1,2]]), 3, 'det2');
    console.log('[MathCore self-test] All assertions passed');
  })();
}
