
const KITSU_BASE = 'https://kitsu.io/api/edge';
const ANIPUB_BASE = 'https://anipub.org';
const ANIWEB_BASE = 'https://api.aniweeb.net';

const params = new URLSearchParams(window.location.search);
let animeSlug = params.get('anime') || localStorage.getItem('currentAnimeSlug');
const selectedAnimeTitle = params.get('title') || '';

let currentAnimeTitle = '';
let currentAnimeEpisodesCount = 'Unknown';
let currentEpisodeIndex = -1;
let availableEpisodes = [];
let aniweebEpisodesByNumber = new Map();
let currentAniListId = null;
let currentTrack = 'dub';
let currentServers = [];
let currentServer = null;

const $ = id => document.getElementById(id);

/* -------------------------------
   GENERAL HELPERS
-------------------------------- */

function setPlayerStatus(message, type = '') {
    const status = $('player-status');
    if (!status) return;

    status.textContent = message;
    status.className = `player-status${type ? ` ${type}` : ''}`;
}

function normalizeTitle(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}

function titleOf(record) {
    const a = record?.attributes || {};
    const t = a.titles || {};

    return a.canonicalTitle ||
        t.en ||
        t.en_jp ||
        t.ja_jp ||
        animeSlug?.replace(/-/g, ' ') ||
        'Anime';
}

function hasDub(episode) {
    return episode?.dub === true ||
        (typeof episode?.dub === 'string' && episode.dub.trim() !== '') ||
        episode?.dub === 1;
}

function hasSub(episode) {
    return episode?.sub !== false &&
        episode?.sub !== null &&
        episode?.sub !== 0;
}

/* -------------------------------
   EPISODE CONTROLS
-------------------------------- */

function updateEpisodeControls() {
    const previous = $('previous-episode');
    const next = $('next-episode');
    const label = $('current-episode-label');

    if (previous) previous.disabled = currentEpisodeIndex <= 0;

    if (next) {
        next.disabled = currentEpisodeIndex < 0 ||
            currentEpisodeIndex >= availableEpisodes.length - 1;
    }

    if (label) {
        label.textContent = currentEpisodeIndex >= 0
            ? `Episode ${availableEpisodes[currentEpisodeIndex].number} of ${availableEpisodes.length}`
            : 'Episode —';
    }
}

function updateEpisodeButtons() {
    document.querySelectorAll('.episode-btn').forEach((button, index) => {
        const active = index === currentEpisodeIndex;

        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });

    document.querySelector('.episode-btn.active')?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
    });
}

function buildEpisodeButtons() {
    const grid = $('episodes-grid');
    if (!grid) return;

    grid.innerHTML = '';

    availableEpisodes.forEach((episode, index) => {
        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'episode-btn';
        button.textContent = `EP ${episode.number}`;
        button.setAttribute('aria-label', `Play episode ${episode.number}`);

        button.addEventListener('click', () => {
            playEpisodeByIndex(index);
        });

        grid.appendChild(button);
    });
}

/* -------------------------------
   STREAMING CONTROLS
-------------------------------- */

function createStreamingControls() {
    const player = $('anime-video-player');
    if (!player || $('streaming-controls')) return;

    const controls = document.createElement('div');
    controls.id = 'streaming-controls';

    controls.style.cssText = `
        display:none;
        flex-wrap:wrap;
        gap:10px;
        align-items:center;
        margin:12px 0;
    `;

    const trackSelect = document.createElement('select');
    trackSelect.id = 'stream-track-select';
    trackSelect.innerHTML = `
        <option value="dub">English Dub</option>
        <option value="sub">Japanese Sub</option>
    `;

    const serverSelect = document.createElement('select');
    serverSelect.id = 'stream-server-select';

    [trackSelect, serverSelect].forEach(select => {
        select.style.cssText = `
            padding:9px 12px;
            border-radius:6px;
            background:#151515;
            color:white;
            border:1px solid #4dc4d4;
            max-width:170px;
        `;
    });

    controls.append(trackSelect, serverSelect);
    player.insertAdjacentElement('afterend', controls);

    trackSelect.addEventListener('change', async () => {
        currentTrack = trackSelect.value;

        if (currentEpisodeIndex >= 0) {
            const episode = availableEpisodes[currentEpisodeIndex];

            if (episode.provider === 'anipub') {
                const fallback = aniweebEpisodesByNumber.get(
                    Number(episode.number)
                );

                if (fallback && (
                    currentTrack === 'sub' ? hasSub(fallback) : hasDub(fallback)
                )) {
                    await playAniweebEpisode(fallback);
                    return;
                }

                setPlayerStatus(
                    'The selected audio option is not available for this episode.',
                    'error'
                );
                return;
            }

            await playAniweebEpisode(episode);
        }
    });

    serverSelect.addEventListener('change', () => {
        const selected = currentServers.find(
            server => String(server.server) === serverSelect.value
        );

        if (selected && currentEpisodeIndex >= 0) {
            currentServer = selected;

            loadAniweebEmbed(
                availableEpisodes[currentEpisodeIndex],
                selected
            );
        }
    });
}

function updateStreamingControls(episode) {
    createStreamingControls();

    const controls = $('streaming-controls');
    const trackSelect = $('stream-track-select');
    const serverSelect = $('stream-server-select');

    if (controls) controls.style.display = 'flex';

    if (trackSelect) {
        const dubOption = trackSelect.querySelector('option[value="dub"]');
        const subOption = trackSelect.querySelector('option[value="sub"]');

        dubOption.disabled = !hasDub(episode);
        subOption.disabled = !hasSub(episode);

        if (currentTrack === 'dub' && !hasDub(episode)) {
            currentTrack = hasSub(episode) ? 'sub' : 'dub';
        }

        if (currentTrack === 'sub' && !hasSub(episode) && hasDub(episode)) {
            currentTrack = 'dub';
        }

        trackSelect.value = currentTrack;
    }

    if (serverSelect) {
        serverSelect.innerHTML = '';

        currentServers.forEach(server => {
            const option = document.createElement('option');
            option.value = String(server.server);
            option.textContent = server.name || `Server ${server.server}`;
            serverSelect.appendChild(option);
        });

        if (currentServer) {
            serverSelect.value = String(currentServer.server);
        }
    }
}

function hideStreamingControls() {
    const controls = $('streaming-controls');
    if (controls) controls.style.display = 'none';
}

/* -------------------------------
   KITSU TO ANILIST MAPPING
-------------------------------- */

async function getAniListId(kitsuId) {
    const response = await fetch(
        `${KITSU_BASE}/anime/${encodeURIComponent(kitsuId)}/mappings`
    );

    if (!response.ok) {
        throw new Error('Could not retrieve anime ID mappings.');
    }

    const result = await response.json();

    const mapping = (result.data || []).find(item =>
        item.attributes?.externalSite === 'anilist/anime'
    );

    if (!mapping) return null;

    const id = Number(mapping.attributes.externalId);

    return Number.isFinite(id) ? id : null;
}

/* -------------------------------
   PRIMARY EPISODE SOURCE
-------------------------------- */

async function findAniPubEntry(titleCandidates) {
    const tried = new Set();

    for (const title of titleCandidates) {
        const clean = String(title || '').trim();
        const key = normalizeTitle(clean);

        if (!key || tried.has(key)) continue;
        tried.add(key);

        try {
            const response = await fetch(
                `${ANIPUB_BASE}/api/find/${encodeURIComponent(clean)}`
            );

            if (!response.ok) continue;

            const result = await response.json();

            if (result?.exist && result.id != null) {
                return result;
            }
        } catch (error) {
            console.warn('Primary episode lookup failed:', error);
        }
    }

    for (const title of titleCandidates) {
        const clean = String(title || '').trim();
        if (!clean) continue;

        try {
            const response = await fetch(
                `${ANIPUB_BASE}/api/search/${encodeURIComponent(clean)}`
            );

            if (!response.ok) continue;

            const data = await response.json();
            const entries = Array.isArray(data) ? data : [];

            const target = normalizeTitle(clean);
            const targetWords = new Set(
                target.split(' ').filter(word => word.length > 1)
            );

            let best = null;
            let bestScore = 0;

            for (const item of entries) {
                const name = normalizeTitle(item.Name);
                const finder = normalizeTitle(
                    String(item.finder || '').replace(/-/g, ' ')
                );

                const candidate = name || finder;

                if (!candidate || item.Id == null) continue;

                if (candidate === target || finder === target) {
                    best = item;
                    bestScore = 1;
                    break;
                }

                const words = new Set(
                    candidate.split(' ').filter(word => word.length > 1)
                );

                let overlap = 0;

                for (const word of targetWords) {
                    if (words.has(word)) overlap++;
                }

                const score = targetWords.size
                    ? overlap / targetWords.size
                    : 0;

                if (score > bestScore) {
                    bestScore = score;
                    best = item;
                }
            }

            if (best && bestScore >= 0.6) {
                return {
                    exist: true,
                    id: best.Id,
                    matchedName: best.Name
                };
            }
        } catch (error) {
            console.warn('Primary search failed:', error);
        }
    }

    return null;
}

function cleanAniPubLink(value) {
    if (typeof value !== 'string') return '';

    const source = value.replace(/^src=/i, '').trim();

    try {
        const parsed = new URL(source);

        return ['http:', 'https:'].includes(parsed.protocol)
            ? parsed.href
            : '';
    } catch {
        return '';
    }
}

async function getAniPubEpisodes(titleCandidates) {
    setPlayerStatus('Finding available episodes...');

    const entry = await findAniPubEntry(titleCandidates);

    if (!entry) {
        return [];
    }

    const response = await fetch(
        `${ANIPUB_BASE}/v1/api/details/${encodeURIComponent(entry.id)}`
    );

    if (!response.ok) {
        throw new Error('Episode request failed.');
    }

    const details = await response.json();
    const local = details?.local;

    if (!local) return [];

    const episodes = [];

    const firstLink = cleanAniPubLink(local.link);

    if (firstLink) {
        episodes.push({
            number: 1,
            src: firstLink,
            provider: 'anipub'
        });
    }

    if (Array.isArray(local.ep)) {
        local.ep.forEach((item, index) => {
            const link = cleanAniPubLink(item?.link);

            if (!link) return;

            const number = Number(
                item?.number ||
                item?.episode ||
                index + 2
            );

            if (!Number.isFinite(number) || number < 1) return;

            episodes.push({
                number,
                src: link,
                provider: 'anipub'
            });
        });
    }

    return episodes;
}

/* -------------------------------
   SECONDARY EPISODE SOURCE
-------------------------------- */

async function getAniweebEpisodes(anilistId) {
    const response = await fetch(
        `${ANIWEB_BASE}/episodes/${encodeURIComponent(anilistId)}`
    );

    if (!response.ok) {
        throw new Error('Episode list is unavailable.');
    }

    const data = await response.json();

    if (!Array.isArray(data.episodes)) {
        throw new Error('Episode list is unavailable.');
    }

    return data.episodes
        .filter(item => Number(item?.number) > 0)
        .map(item => ({
            number: Number(item.number),
            title: item.title || '',
            sub: item.sub,
            dub: item.dub,
            filler: item.filler,
            provider: 'aniweeb'
        }))
        .sort((a, b) => a.number - b.number);
}

async function getAniweebServers(episodeNumber) {
    if (!currentAniListId) return [];

    const url = new URL(
        `${ANIWEB_BASE}/servers/ani/${currentAniListId}/${episodeNumber}`
    );

    url.searchParams.set('track', currentTrack);

    const response = await fetch(url);

    if (!response.ok) return [];

    const data = await response.json();

    return Array.isArray(data.servers) ? data.servers : [];
}

function getAniweebEmbed(episodeNumber, server) {
    if (server?.embed) {
        return new URL(server.embed, ANIWEB_BASE).href;
    }

    const url = new URL(
        `${ANIWEB_BASE}/embed/ani/${currentAniListId}/${episodeNumber}`
    );

    url.searchParams.set('track', currentTrack);

    if (server?.server != null) {
        url.searchParams.set('server', server.server);
    }

    return url.href;
}

function loadAniweebEmbed(episode, server = null) {
    const player = $('anime-video-player');
    if (!player || !episode || !currentAniListId) return;

    player.src = getAniweebEmbed(episode.number, server);
    player.title = `${currentAnimeTitle} — Episode ${episode.number}`;

    setPlayerStatus(
        `Now loading ${currentAnimeTitle} - Episode ${episode.number}. If playback does not start, the source may be unavailable.`,
        'success'
    );
}

async function playAniweebEpisode(episode) {
    if (!episode || !currentAniListId) {
        throw new Error('This episode is not available.');
    }

    if (currentTrack === 'dub' && !hasDub(episode)) {
        currentTrack = hasSub(episode) ? 'sub' : 'dub';
    }

    if (currentTrack === 'sub' && !hasSub(episode) && hasDub(episode)) {
        currentTrack = 'dub';
    }

    currentServers = [];
    currentServer = null;

    setPlayerStatus('Finding available players...');

    currentServers = await getAniweebServers(episode.number);

    updateStreamingControls(episode);

    if (currentServers.length) {
        currentServer = currentServers[0];

        const serverSelect = $('stream-server-select');
        if (serverSelect) {
            serverSelect.value = String(currentServer.server);
        }

        loadAniweebEmbed(episode, currentServer);
    } else {
        loadAniweebEmbed(episode);
    }
}

/* -------------------------------
   EPISODE PLAYBACK
-------------------------------- */

async function playEpisodeByIndex(index) {
    if (index < 0 || index >= availableEpisodes.length) return;

    const episode = availableEpisodes[index];
    const player = $('anime-video-player');

    if (!player) return;

    currentEpisodeIndex = index;

    player.title = `${currentAnimeTitle} — Episode ${episode.number}`;

    updateEpisodeButtons();
    updateEpisodeControls();

    const epName = $('detail-ep-name');

    if (epName) {
        epName.textContent =
            `${currentAnimeTitle} Episode ${episode.number}`;
    }

    const totalEp = $('detail-episodes');

    if (totalEp) {
        totalEp.textContent =
            currentAnimeEpisodesCount !== 'Unknown'
                ? currentAnimeEpisodesCount
                : availableEpisodes.length;
    }

    setPlayerStatus(
        `Now loading ${currentAnimeTitle} - Episode ${episode.number}. If playback does not start, the source may be unavailable.`,
        'success'
    );

    if (episode.provider === 'anipub') {
        hideStreamingControls();

        player.src = episode.src;

        return;
    }

    try {
        await playAniweebEpisode(episode);
    } catch (error) {
        console.error('Episode playback error:', error);

        setPlayerStatus(
            'Unable to load this episode. Please try another episode.',
            'error'
        );
    }
}

/* -------------------------------
   LOAD ANIME METADATA + SOURCES
-------------------------------- */

async function loadAnimeData() {
    const titleElement = $('anime-title');
    const synopsisElement = $('anime-synopsis');
    const episodesGrid = $('episodes-grid');

    if (!animeSlug) {
        if (titleElement) titleElement.textContent = 'Anime not found!';
        setPlayerStatus('No anime was selected.', 'error');
        return;
    }

    if (titleElement) {
        titleElement.textContent = selectedAnimeTitle || 'Loading anime...';
    }

    if (episodesGrid) episodesGrid.innerHTML = '';

    setPlayerStatus('Loading anime information...');

    try {
        let response = await fetch(
            `${KITSU_BASE}/anime?filter[slug]=${encodeURIComponent(animeSlug)}&include=categories`
        );

        if (!response.ok) {
            throw new Error('Anime information request failed.');
        }

        let result = await response.json();

        if (!result.data?.length) {
            const query = selectedAnimeTitle || animeSlug.replace(/-/g, ' ');

            response = await fetch(
                `${KITSU_BASE}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=5&include=categories`
            );

            if (!response.ok) {
                throw new Error('Anime search failed.');
            }

            result = await response.json();
        }

        if (!result.data?.length) {
            throw new Error('Anime information was not found.');
        }

        const record =
            result.data.find(item => item.attributes?.slug === animeSlug) ||
            (selectedAnimeTitle
                ? result.data.find(item => {
                    const a = item.attributes || {};
                    const t = a.titles || {};
                    const wanted = selectedAnimeTitle.toLowerCase().trim();

                    return [
                        a.canonicalTitle,
                        t.en,
                        t.en_jp,
                        t.ja_jp
                    ].some(value =>
                        String(value || '').toLowerCase().trim() === wanted
                    );
                })
                : result.data[0]);

        if (!record) {
            throw new Error('Could not match the selected anime.');
        }

        const anime = record.attributes || {};
        const titles = anime.titles || {};

        currentAnimeTitle = selectedAnimeTitle || titleOf(record);
        currentAnimeEpisodesCount = anime.episodeCount || 'Unknown';
        animeSlug = anime.slug || animeSlug;

        const poster =
            anime.posterImage?.large ||
            anime.posterImage?.original ||
            anime.posterImage?.medium ||
            '';

        const rating = anime.averageRating
            ? (Number(anime.averageRating) / 10).toFixed(1)
            : (params.get('rating') || '8.8');

        const type = anime.showType
            ? anime.showType.toUpperCase()
            : 'TV';

        const genres = (result.included || [])
            .filter(item => item.type === 'categories')
            .map(item => item.attributes?.title || item.attributes?.slug)
            .filter(Boolean);

        const animeData = {
            id: record.id,
            slug: animeSlug,
            title: currentAnimeTitle,
            poster,
            rating,
            type
        };

        if (titleElement) titleElement.textContent = currentAnimeTitle;

        if (synopsisElement) {
            synopsisElement.textContent =
                anime.synopsis || 'No description available.';
        }

        if ($('detail-poster')) $('detail-poster').src = poster;
        if ($('detail-title')) $('detail-title').textContent = currentAnimeTitle;

        if ($('anime-rating')) $('anime-rating').textContent = `★ ${rating}`;
        if ($('detail-rating')) $('detail-rating').textContent = `★ ${rating}`;

        if ($('detail-type')) $('detail-type').textContent = type;
        if ($('detail-country')) $('detail-country').textContent = 'Japan';
        if ($('detail-country-val')) $('detail-country-val').textContent = 'Japan';

        if ($('detail-status')) {
            $('detail-status').textContent =
                anime.status?.toLowerCase() === 'finished'
                    ? 'complete'
                    : 'continuing';
        }

        if ($('detail-source')) {
            $('detail-source').textContent = anime.source || 'manga';
        }

        if ($('detail-genres')) {
            $('detail-genres').textContent =
                genres.length ? genres.join(', ') : 'Action, Adventure';
        }

        if ($('detail-episodes')) {
            $('detail-episodes').textContent =
                currentAnimeEpisodesCount !== 'Unknown'
                    ? currentAnimeEpisodesCount
                    : '??';
        }

        if ($('detail-ep-name')) {
            $('detail-ep-name').textContent =
                `${currentAnimeTitle} Episode 1`;
        }

        if ($('detail-type-icon')) {
            $('detail-type-icon').textContent = type;
        }

        // Send metadata to watch-ui.js
        window.pixelPlayAnimeData = {
            animeData,
            genres,
            slug: animeSlug
        };

        window.dispatchEvent(new CustomEvent('pixelplay:anime-loaded', {
            detail: window.pixelPlayAnimeData
        }));

        /* 1. PRIMARY SOURCE */

        let aniPubEpisodes = [];

        try {
            const titleCandidates = [
                selectedAnimeTitle,
                currentAnimeTitle,
                titles.en,
                titles.en_jp,
                titles.ja_jp,
                animeSlug.replace(/-/g, ' ')
            ].filter(Boolean);

            aniPubEpisodes = await getAniPubEpisodes(titleCandidates);
        } catch (error) {
            console.warn('Primary episode lookup failed:', error);
        }

        const aniPubMap = new Map();

        aniPubEpisodes.forEach(episode => {
            aniPubMap.set(Number(episode.number), episode);
        });

        /* 2. SECONDARY SOURCE: FILL MISSING EPISODES */

        setPlayerStatus('Finding available episodes...');

        aniweebEpisodesByNumber = new Map();
        currentAniListId = null;

        try {
            currentAniListId = await getAniListId(record.id);

            if (currentAniListId) {
                const aniweebEpisodes = await getAniweebEpisodes(
                    currentAniListId
                );

                aniweebEpisodes.forEach(episode => {
                    aniweebEpisodesByNumber.set(
                        Number(episode.number),
                        episode
                    );
                });
            }
        } catch (error) {
            console.warn('Secondary episode lookup failed:', error);
        }

        /* 3. BUILD COMBINED EPISODE LIST */

        const allNumbers = new Set([
            ...aniPubMap.keys(),
            ...aniweebEpisodesByNumber.keys()
        ]);

        availableEpisodes = [...allNumbers]
            .sort((a, b) => a - b)
            .map(number => {
                if (aniPubMap.has(number)) {
                    return aniPubMap.get(number);
                }

                return aniweebEpisodesByNumber.get(number);
            })
            .filter(Boolean);

        if (!availableEpisodes.length) {
            throw new Error('No episodes are currently available.');
        }

        buildEpisodeButtons();

        setPlayerStatus(
            'Episodes loaded successfully!',
            'success'
        );

        await playEpisodeByIndex(0);

    } catch (error) {
        console.error('Anime loading error:', error);

        if (titleElement) {
            titleElement.textContent = 'Anime details unavailable';
        }

        if (episodesGrid) episodesGrid.innerHTML = '';

        availableEpisodes = [];
        currentEpisodeIndex = -1;

        updateEpisodeControls();

        setPlayerStatus(
            'Unable to load this anime. Please try again later.',
            'error'
        );
    }
}

/* -------------------------------
   PREVIOUS / NEXT
-------------------------------- */

$('previous-episode')?.addEventListener('click', () => {
    playEpisodeByIndex(currentEpisodeIndex - 1);
});

$('next-episode')?.addEventListener('click', () => {
    playEpisodeByIndex(currentEpisodeIndex + 1);
});

/* -------------------------------
   START
-------------------------------- */

loadAnimeData();
