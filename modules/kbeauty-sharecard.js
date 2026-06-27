/* modules/kbeauty-sharecard.js — vertical "my skin" share card.
   Pure canvas, no external assets. Uses Web Share (with files) when available,
   else downloads a PNG. Ported pattern from the kpop share-card engine.
   API: window.KbeautyShareCard.generate({ skinType, skinEmoji, concerns, steps }) */
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
    g.addColorStop(0, '#1a0b18'); g.addColorStop(1, '#24122b');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const blob = (X, Y, r, col) => { const rg = x.createRadialGradient(X, Y, 0, X, Y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H); };
    blob(180, 240, 480, 'rgba(232,74,138,.42)');
    blob(900, 1120, 540, 'rgba(199,125,255,.36)');

    x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2;
    roundRect(x, 60, 60, W - 120, H - 120, 40); x.stroke();

    x.textAlign = 'center';

    // Emoji
    x.font = '150px serif';
    x.fillText(o.skinEmoji || '💄', cx, 330);

    // Label
    x.fillStyle = '#ff8fb8';
    x.font = '800 36px Inter, system-ui, sans-serif';
    x.fillText('MY K-BEAUTY PROFILE', cx, 410);

    // Skin type
    x.fillStyle = '#ffffff';
    x.font = '900 96px Inter, system-ui, sans-serif';
    let yy = centerWrap(x, (o.skinType ? o.skinType + ' skin' : 'K-Beauty fan'), cx, 540, W - 200, 100, 2);

    // Concerns
    const concerns = (o.concerns || []).slice(0, 3);
    if (concerns.length) {
      x.fillStyle = 'rgba(255,255,255,.65)';
      x.font = '600 38px Inter, system-ui, sans-serif';
      yy = centerWrap(x, '🎯 ' + concerns.join(' · '), cx, yy + 30, W - 200, 50, 3);
    }

    // Routine steps badge
    x.fillStyle = '#ffffff';
    x.font = '900 220px Inter, system-ui, sans-serif';
    x.fillText(String(o.steps || 7), cx, 1075);
    x.fillStyle = 'rgba(255,255,255,.65)';
    x.font = '700 44px Inter, system-ui, sans-serif';
    x.fillText('STEP ROUTINE', cx, 1145);

    // Footer brand
    x.fillStyle = '#ff8fb8';
    x.font = '800 34px Inter, system-ui, sans-serif';
    x.fillText('💄 KoreaPlus', cx, 1240);
    x.fillStyle = 'rgba(255,255,255,.45)';
    x.font = '500 26px Inter, system-ui, sans-serif';
    x.fillText('koreaplus-lifes.com/guide/kbeauty', cx, 1282);

    const png = await new Promise(res => c.toBlob(res, 'image/png'));
    if (!png) return;
    const file = new File([png], 'my-kbeauty-profile.png', { type: 'image/png' });
    const shareText = o.skinType
      ? `My skin type is ${o.skinType} — building my K-beauty routine on KoreaPlus 💄`
      : `Building my K-beauty routine on KoreaPlus 💄`;
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My K-Beauty Profile', text: shareText });
        return;
      }
    } catch { /* fall through to download */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(png);
    a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // Glass Skin Score card — big number + 4 sub-bars + tier.
  // o: { score, tier:{name,ko,emoji}, subs:[{label,emoji,val}] }  (val 0-25)
  async function generateGlassScore(o) {
    const W = 1080, H = 1350, cx = W / 2;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1a0b18'); g.addColorStop(1, '#24122b');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const blob = (X, Y, r, col) => { const rg = x.createRadialGradient(X, Y, 0, X, Y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H); };
    blob(180, 240, 480, 'rgba(232,74,138,.42)'); blob(900, 1120, 540, 'rgba(199,125,255,.36)');
    x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2; roundRect(x, 60, 60, W - 120, H - 120, 40); x.stroke();
    x.textAlign = 'center';
    x.fillStyle = '#ff8fb8'; x.font = '800 38px Inter, system-ui, sans-serif';
    x.fillText('MY GLASS SKIN SCORE', cx, 200);
    // big score
    x.fillStyle = '#ffffff'; x.font = '900 300px Inter, system-ui, sans-serif';
    x.fillText(String(o.score == null ? 0 : o.score), cx, 480);
    x.fillStyle = 'rgba(255,255,255,.5)'; x.font = '700 48px Inter, system-ui, sans-serif';
    x.fillText('/ 100', cx, 545);
    // tier
    x.fillStyle = '#ffd36e'; x.font = '900 60px Inter, system-ui, sans-serif';
    x.fillText(`${o.tier && o.tier.emoji || '🔮'} ${(o.tier && o.tier.name) || ''}`, cx, 650);
    if (o.tier && o.tier.ko) { x.fillStyle = 'rgba(255,255,255,.5)'; x.font = '600 36px Inter, system-ui, sans-serif'; x.fillText(o.tier.ko, cx, 700); }
    // sub-bars
    const subs = (o.subs || []).slice(0, 4); const bx = 150, bw = W - 300; let by = 800;
    x.textAlign = 'left';
    subs.forEach(s => {
      x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '700 34px Inter, system-ui, sans-serif';
      x.fillText(`${s.emoji || ''} ${s.label}`, bx, by - 14);
      x.textAlign = 'right'; x.fillStyle = '#ff8fb8'; x.fillText(`${s.val}/25`, bx + bw, by - 14); x.textAlign = 'left';
      x.fillStyle = 'rgba(255,255,255,.12)'; roundRect(x, bx, by, bw, 22, 11); x.fill();
      const fg = x.createLinearGradient(bx, 0, bx + bw, 0); fg.addColorStop(0, '#e84a8a'); fg.addColorStop(1, '#c77dff');
      x.fillStyle = fg; roundRect(x, bx, by, Math.max(22, bw * (s.val / 25)), 22, 11); x.fill();
      by += 96;
    });
    // footer
    x.textAlign = 'center';
    x.fillStyle = '#ff8fb8'; x.font = '800 34px Inter, system-ui, sans-serif'; x.fillText('💄 KoreaPlus — beat my score', cx, 1248);
    x.fillStyle = 'rgba(255,255,255,.45)'; x.font = '500 26px Inter, system-ui, sans-serif'; x.fillText('koreaplus-lifes.com/kbeauty', cx, 1290);
    const png = await new Promise(res => c.toBlob(res, 'image/png')); if (!png) return;
    const file = new File([png], 'my-glass-skin-score.png', { type: 'image/png' });
    const shareText = `My Glass Skin Score is ${o.score}/100 (${(o.tier && o.tier.name) || ''}) — what's yours? 🔮 Take the K-beauty test on KoreaPlus`;
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'My Glass Skin Score', text: shareText }); return; } } catch { /* fall through */ }
    const a = document.createElement('a'); a.href = URL.createObjectURL(png); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  window.KbeautyShareCard = { generate, generateGlassScore };
})();
