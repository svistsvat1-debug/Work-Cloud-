/**
 * Drawing helpers shared by the world objects and the UI,
 * so everything draws sprites, shadows, bars and text the same way.
 */
const DrawUtils = {
  /** Soft oval shadow on the ground. */
  shadow(ctx, x, y, width, alpha = 0.35) {
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, width, width * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  /**
   * Draws a character sprite centered on (x, y) at the given on-screen size.
   * facing = -1 mirrors it. scaleX / scaleY squash or stretch it around the feet.
   */
  character(ctx, image, x, y, size, facing = 1, scaleX = 1, scaleY = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y + size / 2); // pivot at the feet
    ctx.scale(facing * scaleX, scaleY);
    ctx.drawImage(image, -size / 2, -size, size, size);
    ctx.restore();
  },

  /** Draws a sprite centered on (x, y), rotated by `rotation` radians. */
  rotated(ctx, image, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
  },

  /** A horizontal bar (health, XP...). fraction is 0..1, (x, y) is the top-left corner. */
  bar(ctx, x, y, width, height, fraction, fillColor, backColor = 'rgba(10, 8, 12, 0.75)') {
    ctx.fillStyle = backColor;
    ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width * MathUtils.clamp(fraction, 0, 1), height);
  },

  /** Green when healthy, yellow when hurt, red when almost dead. */
  healthColor(fraction) {
    if (fraction > 0.6) return '#5ad66f';
    if (fraction > 0.3) return '#f2c94c';
    return '#ef5050';
  },

  /** Text with a dark drop shadow, so it stays readable on any background. */
  text(ctx, text, x, y, { size = 24, weight = 'normal', color = '#ffffff', align = 'left' } = {}) {
    ctx.font = `${weight} ${size}px ${GameConfig.ui.font}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(text, x + 2, y + 3);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  },

  /** Builds a rounded rectangle path. Call ctx.fill() / ctx.stroke() afterwards. */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  },

  /** Splits text into lines that fit maxWidth (uses the current ctx.font). */
  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  },

  /**
   * A rectangular button. `rect` is {x, y, width, height}.
   * style: 'primary' (green), 'secondary' (blue-grey), 'danger' (red) or 'disabled'.
   */
  button(ctx, rect, label, hovered, style = 'primary', size = 36) {
    const colors = DrawUtils.BUTTON_STYLES[style];
    DrawUtils.roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 14);
    ctx.fillStyle = hovered && style !== 'disabled' ? colors.hover : colors.fill;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = colors.border;
    ctx.stroke();
    DrawUtils.text(ctx, label, rect.x + rect.width / 2, rect.y + rect.height / 2 - size * 0.6, {
      size,
      weight: 'bold',
      align: 'center',
      color: colors.text,
    });
  },
};

DrawUtils.BUTTON_STYLES = {
  primary: { fill: '#2e8c55', hover: '#3fae6a', border: '#bff5cf', text: '#ffffff' },
  secondary: { fill: '#34405a', hover: '#465676', border: '#a9b8d6', text: '#ffffff' },
  danger: { fill: '#8c2e3a', hover: '#ad3d4c', border: '#f5bfc6', text: '#ffffff' },
  disabled: { fill: '#2a2d35', hover: '#2a2d35', border: '#4a4f5c', text: '#7d8494' },
};
