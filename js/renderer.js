const CanvasRenderer = (() => {
  const DEFAULT_COLORS = {
    bg: '#0d0f1a', gridMinor: '#1e2340', gridMajor: '#2d3561', iHat: '#e84393', jHat: '#43e8a8',
    eigen1: '#f7c948', eigen2: '#7c4dff', detFill: 'rgba(167,139,250,0.15)', text: '#e0e4f8', ghost: 'rgba(255,255,255,0.08)'
  };
  const FONT_UI = '600 13px Inter, system-ui, -apple-system, sans-serif';

  class CanvasRenderer {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.colors = Object.assign({}, DEFAULT_COLORS, options.colors || {});
      this.resize();
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      this.cssW = rect.width;
      this.cssH = rect.height;
      this.origin = [this.cssW / 2, this.cssH / 2];
      this.scale = Math.min(this.cssW, this.cssH) / 22;
    }

    toScreen(x, y) {
      if (Array.isArray(x)) [x, y] = x;
      return [this.origin[0] + x * this.scale, this.origin[1] - y * this.scale];
    }

    toWorld(sx, sy) {
      return [(sx - this.origin[0]) / this.scale, (this.origin[1] - sy) / this.scale];
    }

    clear() {
      this.ctx.clearRect(0, 0, this.cssW, this.cssH);
      this.ctx.fillStyle = this.colors.bg;
      this.ctx.fillRect(0, 0, this.cssW, this.cssH);
    }

    drawGrid(matrix = [[1, 0], [0, 1]], { ghost = false, range = 10, majorEvery = 5 } = {}) {
      const ctx = this.ctx;
      ctx.save();
      if (ghost) ctx.globalAlpha = 0.2;
      for (let i = -range; i <= range; i++) {
        const isMajor = i % majorEvery === 0;
        ctx.strokeStyle = isMajor ? this.colors.gridMajor : this.colors.gridMinor;
        ctx.lineWidth = isMajor ? 0.8 : 0.5;
        const p1 = this.toScreen(MathCore.multiplyVec(matrix, [-range, i]));
        const p2 = this.toScreen(MathCore.multiplyVec(matrix, [range, i]));
        ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
        const q1 = this.toScreen(MathCore.multiplyVec(matrix, [i, -range]));
        const q2 = this.toScreen(MathCore.multiplyVec(matrix, [i, range]));
        ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke();
      }
      ctx.restore();
    }

    drawArrow(from, to, color, label, lineWidth = 2) {
      const ctx = this.ctx;
      const [x1, y1] = this.toScreen(from);
      const [x2, y2] = this.toScreen(to);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 12;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - 0.42), y2 - headLen * Math.sin(angle - 0.42));
      ctx.lineTo(x2 - headLen * Math.cos(angle + 0.42), y2 - headLen * Math.sin(angle + 0.42));
      ctx.closePath(); ctx.fill();
      if (label) {
        ctx.font = FONT_UI;
        ctx.fillText(label, x2 + 8 * Math.cos(angle - 0.45), y2 + 8 * Math.sin(angle - 0.45));
      }
      ctx.restore();
    }

    drawDot(p, color = '#a78bfa', radius = 5) {
      const [sx, sy] = this.toScreen(p);
      this.ctx.beginPath();
      this.ctx.fillStyle = color;
      this.ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    drawPolygon(points, fill = 'rgba(167,139,250,0.2)', stroke = '#a78bfa') {
      if (!points.length) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.beginPath();
      const [sx0, sy0] = this.toScreen(points[0]);
      ctx.moveTo(sx0, sy0);
      for (let i = 1; i < points.length; i++) {
        const [sx, sy] = this.toScreen(points[i]);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    drawEllipse(cx, cy, rx, ry, angle, color, lineWidth=2) {
      const {ctx, scale} = this;
      const [sx, sy] = this.toScreen(cx, cy);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.abs(rx*scale), Math.abs(ry*scale), 0, 0, Math.PI*2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      ctx.restore();
    }

    drawDataCloud(points, color='#a78bfa', radius=4) {
      const {ctx} = this;
      ctx.fillStyle = color;
      points.forEach(p => {
        const [sx, sy] = this.toScreen(p[0], p[1]);
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI*2);
        ctx.fill();
      });
    }
  }

  return CanvasRenderer;
})();
window.CanvasRenderer = CanvasRenderer;
