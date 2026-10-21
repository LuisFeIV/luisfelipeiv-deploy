import type { listPublicSiteContent } from "@/lib/db/site-content";
import { buildRibbonTrack } from "@/lib/ribbon";

type PublicMediaContent = Awaited<ReturnType<typeof listPublicSiteContent>>;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

const playIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#141210"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
const placeholderIcon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FAFAF7" stroke-width="1"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
const externalLinkIcon = `<svg class="playlist-card-link" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
const playlistToneClasses: Record<string, string> = { bolero: "playlist-card-boleros", stories: "playlist-card-hundred", dedication: "playlist-card-dedicar" };

function renderArchiveCards(content: PublicMediaContent) {
  return content.archive.map((item) => {
    const title = escapeHtml(item.title);
    const subtitle = escapeHtml(item.subtitle);
    const media = item.image_url
      ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.image_alt || item.title)}" loading="lazy"/>`
      : `<div class="gcard-ph">${placeholderIcon}</div>`;
    const body = `
      <div class="gcard-thumb">
        ${media}
        <div class="gcard-play" aria-hidden="true">${playIcon}</div>
      </div>
      <div class="gcard-info">
        <div class="gcard-song">"${title}"</div>
        <div class="gcard-meta">
          <span class="gcard-artist">${subtitle}</span>
          <span class="gcard-views">${escapeHtml(item.metric)}</span>
        </div>
      </div>
    `;
    return item.destination_url
      ? `<a href="${escapeHtml(item.destination_url)}" target="_blank" rel="noopener noreferrer" class="gcard" role="listitem" aria-label="${title} — ${subtitle}">${body}</a>`
      : `<article class="gcard" data-link-status="pending" role="listitem" aria-label="${title} — enlace pendiente">${body}</article>`;
  }).join("\n\n    ");
}

function readOriginalPlaylistCovers(markup: string) {
  const covers = new Map<string, string>();
  for (const match of markup.matchAll(/<a class="playlist-card[^"]*"\s+href="([^"]+)"[\s\S]*?(<div class="playlist-cover"[\s\S]*?<\/div>)\s*<div class="playlist-info">/g)) {
    covers.set(match[1], match[2]);
  }
  return covers;
}

function renderPlaylistCards(content: PublicMediaContent, originalCovers: Map<string, string>) {
  return content.playlists.map((playlist) => {
    const title = escapeHtml(playlist.title);
    const cover = originalCovers.get(playlist.spotify_url)
      ?? `<div class="playlist-cover" aria-hidden="true">
          <span class="playlist-cover-kicker">Luis Felipe IV</span>
          <span class="playlist-cover-title">${title}</span>
        </div>`;
    return `<div class="playlist-item" role="listitem">
      <a class="playlist-card ${playlistToneClasses[playlist.tone] ?? playlistToneClasses.dedication}"
         href="${escapeHtml(playlist.spotify_url)}" target="_blank" rel="noopener noreferrer"
         aria-label="Abrir ${title} en Spotify">
        ${cover}
        <div class="playlist-info">
          ${externalLinkIcon}
          <p class="playlist-label">${escapeHtml(playlist.label)}</p>
          <h3>${title}</h3>
          <p class="playlist-desc">${escapeHtml(playlist.description)}</p>
        </div>
      </a>
      </div>`;
  }).join("\n\n      ");
}

function renderStoryNotes(content: PublicMediaContent) {
  return content.stories.map((story) => `<div class="nota">
        <div class="nota-cancion">"${escapeHtml(story.song)}"</div>
        <div class="nota-artista">${escapeHtml(story.artist)}</div>
        <div class="nota-texto">${escapeHtml(story.story)}</div>
        <div class="nota-feel">${escapeHtml(story.feeling)}</div>
      </div>`).join("\n\n      ");
}

function renderNumbers(content: PublicMediaContent) {
  return content.numbers.map((number) => `<div class="stat-item">
        <dt>${escapeHtml(number.platform)}</dt>
        <dd class="stat-value">${escapeHtml(number.value)}<span>${escapeHtml(number.suffix)}</span></dd>
        <dd class="stat-desc">${escapeHtml(number.description)}</dd>
      </div>`).join("\n      ");
}

function renderRecommendationTabs(content: PublicMediaContent) {
  const tabs = content.recommendations.map((item, index) => {
    const key = escapeHtml(item.mood_key);
    return `<button class="song-recommendation-tab" id="recommendation-tab-${key}" type="button" role="tab" aria-selected="${index === 0}" aria-controls="recommendation-panel-${key}"${index === 0 ? "" : ' tabindex="-1"'} data-song-recommendation-tab>${escapeHtml(item.mood_label)}</button>`;
  });
  const panels = content.recommendations.map((item, index) => {
    const key = escapeHtml(item.mood_key);
    const playlistTitle = content.playlists.find((playlist) => playlist.spotify_url === item.playlist_url)?.title;
    const linkText = playlistTitle ? `De la playlist ${escapeHtml(playlistTitle)}` : "Escúchala en Spotify";
    return `<div class="song-recommendation-panel" id="recommendation-panel-${key}" role="tabpanel" aria-labelledby="recommendation-tab-${key}" data-song-recommendation-panel${index === 0 ? "" : " hidden"}>
                  <div class="song-recommendation-copy">
                    <p class="song-recommendation-intent">${escapeHtml(item.mood_description)}</p>
                    <h3>${escapeHtml(item.song)} <span>— ${escapeHtml(item.artist)}</span></h3>
                    <p>${escapeHtml(item.description)}</p>
                    <a href="${escapeHtml(item.playlist_url)}" target="_blank" rel="noopener noreferrer">${linkText}</a>
                  </div>
                  <button class="song-recommendation-select" type="button" data-song-recommendation-select data-track-id="${escapeHtml(item.spotify_track_id)}" data-track-name="${escapeHtml(item.song)}" data-track-artist="${escapeHtml(item.artist)}" data-track-url="${escapeHtml(item.spotify_url)}">Elegir esta canción</button>
                </div>`;
  });

  return `<div class="song-recommendation-tabs" role="tablist" aria-label="Elige una intención">${tabs.join("")}</div>
                ${panels.join("\n                ")}`;
}

export function renderSiteMedia(markup: string, content: PublicMediaContent) {
  let result = markup;
  const ribbon = buildRibbonTrack(content.ribbon.map((item) => item.label));
  if (ribbon) {
    result = result.replace(
      /<div class="tape-track">[\s\S]*?<\/div>/,
      () => `<div class="tape-track" style="animation-duration:${ribbon.durationSeconds}s">${ribbon.items.map((label) => `<span>${escapeHtml(label)}</span><span class="sep">·</span>`).join("")}</div>`,
    );
  }

  result = result.replace(
    /(<div class="gallery-track reveal" id="galleryTrack"[^>]*>)[\s\S]*?(<\/div><!-- \/gallery-track -->)/,
    (_match, opening: string, closing: string) => `${opening}

    ${renderArchiveCards(content)}

  ${closing}`,
  );
  result = result.replace(
    /(<div class="gallery-dots" id="galleryDots">)[\s\S]*?(<\/div>\s*<span>Desliza)/,
    (_match, opening: string, closing: string) => `${opening}${content.archive.map((_item, index) => `<div class="d${index === 0 ? " active" : ""}"></div>`).join("")}${closing}`,
  );

  const originalCovers = readOriginalPlaylistCovers(markup);
  result = result.replace(
    /(<div class="playlist-grid reveal" role="list"[^>]*>)[\s\S]*?(\n {4}<\/div>\n {2}<\/div>\n<\/section>)/,
    (_match, opening: string, closing: string) => `${opening}
      ${renderPlaylistCards(content, originalCovers)}${closing}`,
  );

  result = result.replace(
    /(<div class="notas-grid reveal"[^>]*>)[\s\S]*?(<div class="nota add-nota")/,
    (_match, opening: string, closing: string) => `${opening}

      ${renderStoryNotes(content)}

      ${closing}`,
  );

  result = result.replace(
    /(<dl class="stats-grid reveal"[^>]*>)[\s\S]*?(<\/dl>)/,
    (_match, opening: string, closing: string) => `${opening}
      ${renderNumbers(content)}
    ${closing}`,
  );

  if (content.recommendations.length > 0) {
    result = result.replace(
      /<div class="song-recommendation-tabs"[\s\S]*?(?=<p class="song-recommendation-status")/,
      () => `${renderRecommendationTabs(content)}\n                `,
    );
  }

  result = result.replace(
    /(<div class="carousel-slides" id="aboutSlides">)[\s\S]*?(<\/div>\s*<!-- Flechas -->)/,
    (_match, opening: string, closing: string) => `${opening}${content.images.map((image) => `<div class="carousel-slide"><img src="${escapeHtml(image.image_url)}" alt="${escapeHtml(image.alt_text)}" loading="lazy" style="object-position:${escapeHtml(image.object_position)}"/></div>`).join("")}${closing}`,
  );
  result = result.replace(
    /(<div class="carousel-dots" role="tablist" aria-label="Fotos de Luis Felipe">)[\s\S]*?(<\/div>\s*<div class="about-tag">)/,
    (_match, opening: string, closing: string) => `${opening}${content.images.map((_image, index) => `<div class="cd${index === 0 ? " active" : ""}" onclick="carouselGo(${index})" role="tab" aria-label="Foto ${index + 1}"></div>`).join("")}${closing}`,
  );

  let playlistIndex = 0;
  result = result.replace(/<div class="playlist-cover"([^>]*)>/g, (match, attributes: string) => {
    const playlist = content.playlists[playlistIndex];
    playlistIndex += 1;
    if (!playlist?.image_url) return match;
    const style = `background-image:linear-gradient(180deg,rgba(20,18,16,.14),rgba(20,18,16,.68)),url('${playlist.image_url.replace(/['()\\]/g, "") }');background-position:center;background-size:cover`;
    return `<div class="playlist-cover"${attributes} style="${escapeHtml(style)}">`;
  });
  return result;
}
