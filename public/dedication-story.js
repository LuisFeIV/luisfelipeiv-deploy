/* Shared 1080×1920 dedication image renderer for the creator form and the recipient page. */
(function () {
  function readPalette(preview) {
    const accent = preview?.querySelector('.story-card-accent');
    const meta = preview?.querySelector('.story-card-meta');

    if (!preview || !accent || !meta) return null;

    const previewStyle = window.getComputedStyle(preview);
    return {
      accent: window.getComputedStyle(accent).backgroundColor,
      background: previewStyle.backgroundColor,
      foreground: previewStyle.color,
      muted: window.getComputedStyle(meta).color,
    };
  }

  function getPaletteForStyle(style) {
    const preview = document.createElement('div');
    preview.className = 'story-card-preview';
    preview.dataset.storyStyle = style;
    preview.setAttribute('aria-hidden', 'true');
    preview.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;';
    preview.innerHTML = '<div class="story-card-accent"></div><p class="story-card-meta">.</p>';
    document.body.appendChild(preview);
    const palette = readPalette(preview);
    preview.remove();
    return palette;
  }

  function wrapStoryText(context, text, maxWidth, maxLines) {
    const words = text.trim().split(/\s+/);
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth || !currentLine) {
        currentLine = candidate;
        return;
      }

      lines.push(currentLine);
      currentLine = word;
    });

    if (currentLine) lines.push(currentLine);
    if (lines.length <= maxLines) return lines;

    const visibleLines = lines.slice(0, maxLines);
    let lastLine = visibleLines[maxLines - 1];
    while (context.measureText(`${lastLine}…`).width > maxWidth && lastLine.length > 1) {
      lastLine = lastLine.slice(0, -1);
    }
    visibleLines[maxLines - 1] = `${lastLine.trimEnd()}…`;
    return visibleLines;
  }

  function drawStoryLines(context, lines, x, startY, lineHeight) {
    lines.forEach((line, index) => context.fillText(line, x, startY + (index * lineHeight)));
    return startY + (lines.length * lineHeight);
  }

  function drawStoryDecoration(context, palette, style) {
    context.fillStyle = palette.accent;
    context.fillRect(0, 0, 1080, 24);

    context.save();
    if (style === 'editorial') {
      context.globalAlpha = .9;
      context.lineWidth = 4;
      context.strokeStyle = palette.accent;
      context.beginPath();
      context.arc(1050, 420, 190, 0, Math.PI * 2);
      context.stroke();
    } else {
      context.globalAlpha = style === 'tinta' ? .45 : .95;
      context.lineWidth = style === 'tinta' ? 86 : 112;
      context.strokeStyle = palette.accent;
      context.beginPath();
      context.arc(1060, 405, 245, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }

  async function renderDedicationStory(data, style, providedPalette) {
    if (!data) throw new Error('No hay datos para crear la imagen.');

    await document.fonts.ready;
    const palette = providedPalette || getPaletteForStyle(style);
    if (!palette) throw new Error('No se pudo preparar el estilo de la imagen.');

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Tu navegador no pudo crear la imagen.');

    context.fillStyle = palette.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawStoryDecoration(context, palette, style);

    context.fillStyle = palette.muted;
    context.font = '500 25px "JetBrains Mono", monospace';
    context.letterSpacing = '3px';
    context.fillText('LUIS FELIPE IV  ·  DEDICATORIAS', 100, 140);

    context.fillStyle = palette.muted;
    context.font = '500 27px "JetBrains Mono", monospace';
    context.letterSpacing = '5px';
    context.fillText('UNA CANCIÓN PARA', 100, 430);

    context.fillStyle = palette.foreground;
    context.font = 'italic 800 94px Fraunces, Georgia, serif';
    context.letterSpacing = '-3px';
    const recipientLines = wrapStoryText(context, data.recipientName, 790, 2);
    const recipientBottom = drawStoryLines(context, recipientLines, 100, 545, 94);

    context.fillStyle = palette.accent;
    context.fillRect(100, recipientBottom + 38, 132, 8);

    context.fillStyle = palette.foreground;
    context.font = '800 72px Fraunces, Georgia, serif';
    context.letterSpacing = '-2px';
    const songLines = wrapStoryText(context, data.song, 820, 2);
    const songBottom = drawStoryLines(context, songLines, 100, recipientBottom + 170, 76);

    context.fillStyle = palette.muted;
    context.font = '500 27px "JetBrains Mono", monospace';
    context.letterSpacing = '3px';
    const artistLines = wrapStoryText(context, data.artist.toUpperCase(), 820, 2);
    const artistBottom = drawStoryLines(context, artistLines, 100, songBottom + 12, 38);

    context.fillStyle = palette.accent;
    context.font = '800 72px Fraunces, Georgia, serif';
    context.letterSpacing = '0px';
    context.fillText('“', 96, artistBottom + 105);

    context.fillStyle = palette.foreground;
    context.globalAlpha = .86;
    context.font = 'italic 400 38px Inter, system-ui, sans-serif';
    const messageLines = wrapStoryText(context, data.message, 820, 6);
    drawStoryLines(context, messageLines, 140, artistBottom + 100, 56);
    context.globalAlpha = 1;

    context.fillStyle = palette.muted;
    context.font = '500 22px "JetBrains Mono", monospace';
    context.letterSpacing = '2px';
    const sender = data.senderName
      ? `DE ${data.senderName.toUpperCase()}`
      : 'DE ALGUIEN ESPECIAL';
    context.fillText(sender, 100, 1800, 500);
    context.textAlign = 'right';
    context.fillText('LUISFELIPEIV.COM', 980, 1800);
    context.textAlign = 'left';

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo exportar la imagen.'));
      }, 'image/png');
    });
  }

  window.LuisFelipeDedicationStory = { readPalette, render: renderDedicationStory };
})();
