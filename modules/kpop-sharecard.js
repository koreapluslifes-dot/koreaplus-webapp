/* modules/kpop-sharecard.js — vertical comeback/anniversary share card.
   Pure canvas, no external assets. Uses Web Share (with files) when available,
   else downloads a PNG. Ported pattern from lucky-webapp's share-card engine.
   API: window.KpopShareCard.generate({ artist, emoji, type, title, daysLeft, dateLabel }) */
(function () {
  function roundRect(x, X, Y, W, H, r) {
    x.beginPath();
    x.moveTo(X + r, Y);
    x.arcTo(X + W, Y, X + W, Y + H, r);
    x.arcTo(X + W, Y + H, X, Y + H, r);
    x.arcTo(X, Y + H, X, Y, r);
    x.arcTo(X, Y, X + W, Y, r);
    x.closePath();
  }

  function centerWrap(x, text, cx, y, maxW, lh, max) {
    const words = String(text || '').split(' ');
    const lines = []; let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (x.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    const shown = lines.slice(0, max || lines.length);
    shown.forEach((ln, i) => x.fillText(ln, cx, y + i * lh));
    return y + shown.length * lh;
  }

  async function generate(o) {
    const W = 1080, H = 1350, cx = W / 2;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');

    // Background
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0b0b16'); g.addColorStop(1, '#1c0d22');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // Accent glows
    const blob = (X, Y, r, col) => { const rg = x.createRadialGradient(X, Y, 0, X, Y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H); };
    blob(180, 240, 460, 'rgba(200,16,46,.42)');
    blob(900, 1120, 520, 'rgba(59,142,234,.36)');

    // Card frame
    x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2;
    roundRect(x, 60, 60, W - 120, H - 120, 40); x.stroke();

    x.textAlign = 'center';

    // Emoji
    x.font = '150px serif';
    x.fillText(o.emoji || '🎤', cx, 320);

    // Type
    x.fillStyle = '#ff5277';
    x.font = '800 38px Inter, system-ui, sans-serif';
    x.fillText(String(o.type || 'COMEBACK').toUpperCase(), cx, 400);

    // Artist
    x.fillStyle = '#ffffff';
    x.font = '900 88px Inter, system-ui, sans-serif';
    let yy = centerWrap(x, o.artist || '', cx, 510, W - 220, 96, 2);

    // Title
    if (o.title) {
      x.fillStyle = 'rgba(255,255,255,.7)';
      x.font = '500 38px Inter, system-ui, sans-serif';
      yy = centerWrap(x, o.title, cx, yy + 18, W - 240, 48, 2);
    }

    // Big number
    const n = (o.daysLeft === 0 || o.daysLeft) ? o.daysLeft : '';
    x.fillStyle = '#ffffff';
    if (o.daysLeft === 0) {
      x.font = '900 130px Inter, system-ui, sans-serif';
      x.fillText('TODAY', cx, 1010);
    } else {
      x.font = '900 240px Inter, system-ui, sans-serif';
      x.fillText(String(n), cx, 1030);
      x.fillStyle = 'rgba(255,255,255,.65)';
      x.font = '700 46px Inter, system-ui, sans-serif';
      x.fillText(o.daysLeft === 1 ? 'DAY TO GO' : 'DAYS TO GO', cx, 1110);
    }

    // Date label
    if (o.dateLabel) {
      x.fillStyle = 'rgba(255,255,255,.55)';
      x.font = '600 34px Inter, system-ui, sans-serif';
      x.fillText(o.dateLabel, cx, 1180);
    }

    // Footer brand
    x.fillStyle = '#ff5277';
    x.font = '800 34px Inter, system-ui, sans-serif';
    x.fillText('🎤 KoreaPlus', cx, 1255);
    x.fillStyle = 'rgba(255,255,255,.45)';
    x.font = '500 26px Inter, system-ui, sans-serif';
    x.fillText('koreaplus-lifes.com/guide/kpop', cx, 1295);

    const png = await new Promise(res => c.toBlob(res, 'image/png'));
    if (!png) return;
    const file = new File([png], `${(o.artist || 'kpop').replace(/\s+/g, '-')}-countdown.png`, { type: 'image/png' });
    const shareText = o.daysLeft === 0
      ? `${o.artist} — out today! 🎤`
      : `${o.daysLeft} days until ${o.artist} ${o.title || ''}! 🎤 #Kpop`;
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'K-Pop Countdown', text: shareText });
        return;
      }
    } catch { /* user cancelled or unsupported — fall through to download */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(png);
    a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  window.KpopShareCard = { generate };
})();
