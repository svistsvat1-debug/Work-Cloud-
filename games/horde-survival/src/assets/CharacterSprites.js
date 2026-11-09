/**
 * Animated character sprites, drawn with code.
 *
 * Every frame is a 182x182 canvas (GameConfig.spriteSourceSize). A character's
 * sprite is an ARRAY of frames; the game picks the frame from the animation time.
 * Everyone faces right (the game mirrors them) and stands on a ground line near
 * the bottom of the canvas. Collision circles stay much smaller than these drawings.
 *
 * Art direction: the hero is bright steel, bronze and teal; the Hush creatures
 * are cold violet-grey, mouthless and lit by violet glows.
 */
const CharacterSprites = {
  OUTLINE: '#15121c',

  createAll() {
    return {
      player: this.frames(4, (ctx, frame) => this.drawBellwarden(ctx, frame)),
      slime: this.frames(2, (ctx, frame) => this.drawHushling(ctx, frame)),
      bat: this.frames(3, (ctx, frame) => this.drawMutewing(ctx, frame)),
      crawler: this.frames(2, (ctx, frame) => this.drawCrawler(ctx, frame)),
      brute: this.frames(2, (ctx, frame) => this.drawBrute(ctx, frame)),
      elite: this.frames(2, (ctx, frame) => this.drawHushKnight(ctx, frame)),
      boss: this.frames(2, (ctx, frame) => this.drawUnrung(ctx, frame)),
    };
  },

  /** Makes `count` canvases and lets draw(ctx, frameIndex) paint each one. */
  frames(count, draw) {
    return Array.from({ length: count }, (_, index) => {
      const canvas = ProceduralSprites.createCanvas();
      const ctx = canvas.getContext('2d');
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 6;
      ctx.strokeStyle = this.OUTLINE;
      draw(ctx, index);
      return canvas;
    });
  },

  // ---------------------------------------------------------------- The hero

  /** The Bellwarden: steel armor with bronze trim, teal cape with a bronze bell. 4-frame walk. */
  drawBellwarden(ctx, frame) {
    const step = [8, 0, -8, 0][frame]; // front leg forward (+) or back (-)
    const lift = frame % 2 === 1 ? -3 : 0; // the body rises a little on the passing frames
    const sway = [0, 4, 0, -4][frame]; // cape swing

    // Cape behind the body
    const cape = ctx.createLinearGradient(0, 88, 0, 168);
    cape.addColorStop(0, '#2d8084');
    cape.addColorStop(1, '#164447');
    ctx.fillStyle = cape;
    ctx.beginPath();
    ctx.moveTo(72, 90 + lift);
    ctx.quadraticCurveTo(44, 116, 32 + sway, 158);
    ctx.lineTo(58 + sway * 0.5, 166);
    ctx.quadraticCurveTo(82, 152, 104, 144 + lift);
    ctx.lineTo(108, 96 + lift);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    this.bell(ctx, 52 + sway * 0.4, 124, 12);

    // Back leg (in shadow)
    this.leg(ctx, 80 - step, 134 + lift, '#6d7888', '#3b3346');

    // Torso: steel plate, chainmail skirt, bronze belt, bell emblem
    ctx.fillStyle = '#5d6573';
    ProceduralSprites.roundRect(ctx, 66, 128 + lift, 54, 16, 6);
    ctx.fill();
    ctx.stroke();
    const steel = ctx.createLinearGradient(0, 86, 0, 140);
    steel.addColorStop(0, '#d3dae4');
    steel.addColorStop(1, '#8792a3');
    ctx.fillStyle = steel;
    ProceduralSprites.roundRect(ctx, 64, 86 + lift, 58, 48, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ProceduralSprites.roundRect(ctx, 72, 92 + lift, 14, 26, 7);
    ctx.fill();
    ctx.fillStyle = '#c98f3e';
    ctx.fillRect(66, 124 + lift, 54, 7);
    this.bell(ctx, 100, 104 + lift, 9);

    // Front leg
    this.leg(ctx, 96 + step, 134 + lift, '#a3aebd', '#4a3f56');

    // Sword in the front hand, pointing down and forward
    ctx.fillStyle = '#e1e6ee';
    ctx.beginPath();
    ctx.moveTo(122, 126 + lift);
    ctx.lineTo(160, 166);
    ctx.lineTo(154, 170);
    ctx.lineTo(116, 132 + lift);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#c98f3e';
    ctx.fillRect(111, 122 + lift, 16, 6); // crossguard

    // Front arm: shoulder plate, arm, gauntlet
    ctx.lineWidth = 6;
    ctx.fillStyle = '#b9c2cf';
    ProceduralSprites.roundRect(ctx, 106, 98 + lift, 16, 28, 7);
    ctx.fill();
    ctx.stroke();
    ProceduralSprites.circle(ctx, 112, 96 + lift, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8792a3';
    ProceduralSprites.circle(ctx, 118, 128 + lift, 8);
    ctx.fill();
    ctx.stroke();

    // Helmet with a bronze crest and a visor looking right
    const helm = ctx.createLinearGradient(64, 30, 124, 90);
    helm.addColorStop(0, '#e4e9f0');
    helm.addColorStop(1, '#8c97a8');
    ctx.fillStyle = helm;
    ProceduralSprites.circle(ctx, 94, 58 + lift, 30);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#c98f3e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(94, 58 + lift, 24, Math.PI * 1.1, Math.PI * 1.75);
    ctx.stroke();
    ctx.strokeStyle = this.OUTLINE;
    ctx.fillStyle = '#141720';
    ProceduralSprites.roundRect(ctx, 96, 54 + lift, 30, 10, 4);
    ctx.fill();
    ctx.fillStyle = '#8ff7ff';
    ctx.fillRect(108, 57 + lift, 5, 4);
    ctx.fillRect(118, 57 + lift, 5, 4);
  },

  /** One armored leg with a boot pointing right. */
  leg(ctx, x, top, color, bootColor) {
    ctx.fillStyle = color;
    ProceduralSprites.roundRect(ctx, x, top, 18, 30, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = bootColor;
    ProceduralSprites.roundRect(ctx, x - 2, top + 26, 26, 12, 5);
    ctx.fill();
    ctx.stroke();
  },

  /** A small bronze bell (the order's symbol). */
  bell(ctx, x, y, size) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3a210c';
    ctx.fillStyle = '#d9a24f';
    ctx.beginPath();
    ctx.moveTo(x - size, y + size * 0.8);
    ctx.quadraticCurveTo(x - size * 0.8, y - size, x, y - size);
    ctx.quadraticCurveTo(x + size * 0.8, y - size, x + size, y + size * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7a4a1f';
    ProceduralSprites.circle(ctx, x, y + size * 0.95, size * 0.3);
    ctx.fill();
    ctx.restore();
  },

  // ---------------------------------------------------------------- The Hush

  /** Hushling (slime): a mouthless blob of violet-grey ooze with hollow, glowing eyes. */
  drawHushling(ctx, frame) {
    const bulge = frame === 0 ? 0 : 5;
    const body = ctx.createLinearGradient(0, 46, 0, 168);
    body.addColorStop(0, '#cdbfe2');
    body.addColorStop(1, '#6a5a88');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(28 - bulge, 150);
    ctx.bezierCurveTo(24 - bulge, 96, 56, 48 + bulge, 91, 48 + bulge);
    ctx.bezierCurveTo(126, 48 + bulge, 158 + bulge, 96, 154 + bulge, 150);
    ctx.quadraticCurveTo(154, 168, 132, 166);
    ctx.lineTo(50, 166);
    ctx.quadraticCurveTo(28, 168, 28 - bulge, 150);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#241c33';
    ctx.stroke();

    // Darker mist swirling inside, and a soft shine
    ctx.fillStyle = 'rgba(60, 44, 90, 0.35)';
    for (const [x, y, r] of [[62, 128, 16], [118, 138, 12], [86, 150, 10]]) {
      ProceduralSprites.circle(ctx, x, y, r);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(62, 80 + bulge, 15, 9, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Hollow eye sockets with a faint glow (and no mouth at all)
    for (const x of [100, 128]) {
      ctx.fillStyle = '#120d1c';
      ctx.beginPath();
      ctx.ellipse(x, 104, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8ddff';
      ProceduralSprites.circle(ctx, x + 2, 104, 3.5);
      ctx.fill();
    }

    // Wisps of silence rising from the top
    ctx.strokeStyle = 'rgba(225, 218, 240, 0.55)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(84, 44 + bulge);
    ctx.quadraticCurveTo(74 + bulge * 2, 30, 86, 16);
    ctx.moveTo(104, 46 + bulge);
    ctx.quadraticCurveTo(114 - bulge * 2, 32, 102, 22);
    ctx.stroke();
  },

  /** Mutewing (bat): tattered black wings with violet membranes, glowing cyan eyes. 3 flap frames. */
  drawMutewing(ctx, frame) {
    const tipY = [32, 70, 112][frame]; // wings up, middle, down
    const lowY = [62, 88, 116][frame];
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#4a2f73';
      ctx.strokeStyle = '#120d18';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(91 + side * 14, 86);
      ctx.quadraticCurveTo(91 + side * 52, tipY - 18, 91 + side * 86, tipY);
      ctx.quadraticCurveTo(91 + side * 74, lowY + 6, 91 + side * 70, lowY + 22);
      ctx.quadraticCurveTo(91 + side * 58, lowY + 12, 91 + side * 48, lowY + 28);
      ctx.quadraticCurveTo(91 + side * 36, lowY + 16, 91 + side * 18, 108);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Wing "finger" bones
      ctx.strokeStyle = '#1b1426';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(91 + side * 16, 90);
      ctx.lineTo(91 + side * 70, lowY + 20);
      ctx.moveTo(91 + side * 16, 92);
      ctx.lineTo(91 + side * 48, lowY + 26);
      ctx.stroke();
    }

    ctx.strokeStyle = '#120d18';
    ctx.lineWidth = 5;
    ctx.fillStyle = '#2a2333';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(91 + side * 6, 76);
      ctx.lineTo(91 + side * 22, 50);
      ctx.lineTo(91 + side * 26, 82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    const fur = ctx.createRadialGradient(86, 92, 4, 91, 98, 30);
    fur.addColorStop(0, '#463b55');
    fur.addColorStop(1, '#1d1826');
    ctx.fillStyle = fur;
    ProceduralSprites.circle(ctx, 91, 98, 27);
    ctx.fill();
    ctx.stroke();

    // Glowing eyes, no mouth
    ctx.fillStyle = 'rgba(159, 244, 255, 0.35)';
    ProceduralSprites.circle(ctx, 91, 94, 20);
    ctx.fill();
    ctx.fillStyle = '#b5f7ff';
    for (const x of [82, 102]) {
      ctx.beginPath();
      ctx.ellipse(x, 94, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /** Gloam Crawler: a six-legged beetle with a cracked porcelain shell glowing violet inside. 2 frames. */
  drawCrawler(ctx, frame) {
    // Legs alternate between the two frames
    ctx.strokeStyle = '#121016';
    ctx.lineWidth = 7;
    for (let i = 0; i < 3; i++) {
      const x = 58 + i * 28;
      const shift = (i + frame) % 2 === 0 ? 8 : -8;
      ctx.beginPath();
      ctx.moveTo(x, 118);
      ctx.lineTo(x - 14 + shift, 142);
      ctx.lineTo(x - 4 + shift, 166);
      ctx.stroke();
    }

    // Shell
    const shell = ctx.createLinearGradient(0, 72, 0, 144);
    shell.addColorStop(0, '#f7f4ee');
    shell.addColorStop(1, '#b4ada1');
    ctx.fillStyle = shell;
    ctx.strokeStyle = '#1b1820';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(84, 108, 56, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#8f897d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(84, 74);
    ctx.quadraticCurveTo(90, 108, 82, 142);
    ctx.stroke();

    // Cracks with violet light inside
    const cracks = [
      [[52, 92], [62, 104], [56, 118]],
      [[104, 88], [96, 102], [108, 112], [102, 126]],
    ];
    for (const [width, color] of [[8, 'rgba(176, 116, 255, 0.55)'], [2.5, '#2a1f3a']]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      for (const crack of cracks) {
        ctx.beginPath();
        crack.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
      }
    }

    // Head: dark, with tiny violet eyes and antennae (no mouth)
    ctx.strokeStyle = '#1b1820';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(144, 100);
    ctx.quadraticCurveTo(156, 76, 172, 72);
    ctx.moveTo(136, 100);
    ctx.quadraticCurveTo(140, 74, 154, 62);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.fillStyle = '#2a2433';
    ProceduralSprites.circle(ctx, 140, 114, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d2a8ff';
    ProceduralSprites.circle(ctx, 147, 108, 4);
    ctx.fill();
    ProceduralSprites.circle(ctx, 152, 117, 3.5);
    ctx.fill();
  },

  /** Muzzled Brute: a stone-skinned ogre whose mouth is locked behind an iron muzzle. 2 frames. */
  drawBrute(ctx, frame) {
    const swing = frame === 0 ? 0 : 7;
    const outline = '#16191b';
    ctx.strokeStyle = outline;

    // Back fist
    ctx.fillStyle = '#545a5e';
    ProceduralSprites.circle(ctx, 34, 126 + swing, 20);
    ctx.fill();
    ctx.stroke();

    // Small curved horns
    ctx.fillStyle = '#d8cdb5';
    for (const [x, tipX] of [[96, 84], [128, 142]]) {
      ctx.beginPath();
      ctx.moveTo(x - 8, 64);
      ctx.quadraticCurveTo(x, 44, tipX, 34);
      ctx.quadraticCurveTo(x + 4, 52, x + 8, 66);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Hunched stone body
    const skin = ctx.createLinearGradient(0, 54, 0, 170);
    skin.addColorStop(0, '#a3a9ac');
    skin.addColorStop(1, '#4d5357');
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(90, 114, 62, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(30, 34, 36, 0.3)';
    for (const [x, y, r] of [[54, 112, 9], [70, 140, 7], [104, 150, 8], [62, 86, 6]]) {
      ProceduralSprites.circle(ctx, x, y, r);
      ctx.fill();
    }

    // Ragged loincloth
    ctx.fillStyle = '#4a3526';
    ctx.beginPath();
    ctx.moveTo(62, 148);
    ctx.lineTo(120, 148);
    ctx.lineTo(116, 170);
    ctx.lineTo(104, 164);
    ctx.lineTo(92, 172);
    ctx.lineTo(80, 164);
    ctx.lineTo(66, 170);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Face: heavy brow and violet eyes
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(98, 78);
    ctx.lineTo(146, 80);
    ctx.stroke();
    ctx.fillStyle = '#d29bff';
    ctx.fillRect(108, 84, 12, 6);
    ctx.fillRect(130, 84, 12, 6);

    // The iron muzzle with rivets and straps
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#2a1d14';
    ctx.beginPath();
    ctx.moveTo(104, 104);
    ctx.lineTo(72, 96);
    ctx.stroke();
    const iron = ctx.createLinearGradient(0, 96, 0, 126);
    iron.addColorStop(0, '#8a6c52');
    iron.addColorStop(1, '#4e3a2a');
    ctx.fillStyle = iron;
    ProceduralSprites.roundRect(ctx, 104, 96, 44, 28, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d6bf94';
    for (const [x, y] of [[111, 103], [141, 103], [111, 117], [141, 117]]) {
      ProceduralSprites.circle(ctx, x, y, 2.5);
      ctx.fill();
    }
    ctx.strokeStyle = '#2a1d14';
    ctx.lineWidth = 3;
    for (const x of [120, 128, 136]) {
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x, 120);
      ctx.stroke();
    }

    // Front fist
    ctx.strokeStyle = outline;
    ctx.lineWidth = 6;
    ctx.fillStyle = '#6a7074';
    ProceduralSprites.circle(ctx, 154, 128 - swing, 22);
    ctx.fill();
    ctx.stroke();
  },

  /** Hush Knight (elite): black armor, crimson cloth, a white mouthless mask, a jagged greatsword. */
  drawHushKnight(ctx, frame) {
    const sway = frame === 0 ? 0 : 5;

    // Violet aura
    const aura = ctx.createRadialGradient(91, 100, 20, 91, 100, 90);
    aura.addColorStop(0, 'rgba(160, 90, 255, 0.45)');
    aura.addColorStop(1, 'rgba(160, 90, 255, 0)');
    ctx.fillStyle = aura;
    ProceduralSprites.circle(ctx, 91, 100, 90);
    ctx.fill();

    // Tattered crimson cape
    const cape = ctx.createLinearGradient(0, 70, 0, 170);
    cape.addColorStop(0, '#8a1f2b');
    cape.addColorStop(1, '#4a0f18');
    ctx.fillStyle = cape;
    ctx.beginPath();
    ctx.moveTo(70, 74);
    ctx.quadraticCurveTo(40, 110, 30 + sway, 164);
    ctx.lineTo(42 + sway, 154);
    ctx.lineTo(52 + sway, 168);
    ctx.lineTo(62 + sway, 156);
    ctx.lineTo(74, 168);
    ctx.lineTo(96, 120);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Legs
    ctx.fillStyle = '#2c2d36';
    ProceduralSprites.roundRect(ctx, 74, 128, 18, 40, 6);
    ctx.fill();
    ctx.stroke();
    ProceduralSprites.roundRect(ctx, 96, 128, 18, 40, 6);
    ctx.fill();
    ctx.stroke();

    // Dark plate armor with a crimson tabard
    const plate = ctx.createLinearGradient(0, 72, 0, 136);
    plate.addColorStop(0, '#4d4f5e');
    plate.addColorStop(1, '#25262e');
    ctx.fillStyle = plate;
    ProceduralSprites.roundRect(ctx, 64, 72, 62, 64, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8a1f2b';
    ctx.fillRect(86, 92, 18, 46);
    ctx.fillStyle = '#25262e';
    for (const x of [62, 116]) {
      // Spiked shoulder plates
      ctx.beginPath();
      ctx.moveTo(x - 6, 86);
      ctx.lineTo(x + 6, 58);
      ctx.lineTo(x + 18, 86);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Jagged greatsword held up in front, with a violet edge
    ctx.fillStyle = '#3d3f4a';
    ctx.beginPath();
    ctx.moveTo(122, 124);
    ctx.lineTo(160, 26);
    ctx.lineTo(170, 34);
    ctx.lineTo(160, 52);
    ctx.lineTo(166, 60);
    ctx.lineTo(152, 84);
    ctx.lineTo(158, 92);
    ctx.lineTo(132, 130);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190, 140, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(126, 120);
    ctx.lineTo(162, 32);
    ctx.stroke();
    ctx.strokeStyle = this.OUTLINE;
    ctx.lineWidth = 6;
    ctx.fillStyle = '#8a1f2b';
    ProceduralSprites.circle(ctx, 126, 124, 9); // gauntlet
    ctx.fill();
    ctx.stroke();

    // Hood and the white mouthless mask with violet eye slits
    ctx.fillStyle = '#1e1f26';
    ProceduralSprites.circle(ctx, 96, 54, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ece7dd';
    ctx.beginPath();
    ctx.ellipse(102, 58, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#b77cff';
    ctx.fillRect(98, 52, 9, 4);
    ctx.fillRect(110, 52, 9, 4);
    ctx.strokeStyle = 'rgba(40, 30, 50, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110, 40);
    ctx.lineTo(106, 50);
    ctx.lineTo(110, 58);
    ctx.stroke();
  },

  /** The Unrung (boss): a colossal cracked bronze bell with one huge eye in its mouth. 2 frames. */
  drawUnrung(ctx, frame) {
    const wave = frame === 0 ? 0 : 7;

    // Purple aura
    const aura = ctx.createRadialGradient(91, 96, 20, 91, 96, 91);
    aura.addColorStop(0, 'rgba(199, 125, 255, 0.5)');
    aura.addColorStop(1, 'rgba(199, 125, 255, 0)');
    ctx.fillStyle = aura;
    ProceduralSprites.circle(ctx, 91, 96, 91);
    ctx.fill();

    // Tendrils hanging below the bell
    for (const [width, color] of [[11, '#2a1540'], [5, '#5d3a85']]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      for (let i = 0; i < 5; i++) {
        const x = 52 + i * 20;
        const bend = (i % 2 === 0 ? 1 : -1) * (8 + wave);
        ctx.beginPath();
        ctx.moveTo(x, 128);
        ctx.quadraticCurveTo(x + bend, 150, x - bend * 0.5, 176);
        ctx.stroke();
      }
    }

    // Broken chain on the crown
    ctx.strokeStyle = '#7a7f88';
    ctx.lineWidth = 4;
    for (const [x, y] of [[91, 12], [99, 4]]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 5, 8, 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // The bell body
    ctx.strokeStyle = '#1e1208';
    ctx.lineWidth = 6;
    const bronze = ctx.createLinearGradient(30, 0, 152, 0);
    bronze.addColorStop(0, '#7a4a1f');
    bronze.addColorStop(0.35, '#e0aa58');
    bronze.addColorStop(1, '#6e421c');
    ctx.fillStyle = bronze;
    ctx.beginPath();
    ctx.moveTo(26, 132);
    ctx.quadraticCurveTo(40, 116, 46, 82);
    ctx.quadraticCurveTo(54, 24, 91, 22);
    ctx.quadraticCurveTo(128, 24, 136, 82);
    ctx.quadraticCurveTo(142, 116, 156, 132);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60, 34, 12, 0.7)';
    ctx.lineWidth = 4;
    for (const y of [52, 70]) {
      ctx.beginPath();
      ctx.moveTo(52, y + 6);
      ctx.quadraticCurveTo(91, y - 4, 130, y + 6);
      ctx.stroke();
    }

    // Cracks glowing violet
    for (const [width, color] of [[8, 'rgba(190, 120, 255, 0.6)'], [2.5, '#1d0f2b']]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(70, 30);
      ctx.lineTo(64, 56);
      ctx.lineTo(74, 72);
      ctx.lineTo(66, 98);
      ctx.moveTo(118, 40);
      ctx.lineTo(124, 64);
      ctx.lineTo(116, 80);
      ctx.stroke();
    }

    // The dark open mouth with one huge eye staring out
    ctx.fillStyle = '#120818';
    ctx.strokeStyle = '#1e1208';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(91, 126, 64, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const eye = ctx.createRadialGradient(91, 106, 3, 91, 106, 26);
    eye.addColorStop(0, '#fff2ff');
    eye.addColorStop(0.45, '#ff6fe1');
    eye.addColorStop(1, '#7a1690');
    ctx.fillStyle = eye;
    ProceduralSprites.circle(ctx, 91, 106, 24);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#12051a';
    ctx.beginPath();
    ctx.ellipse(94, 106, frame === 0 ? 5 : 3, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  },
};
