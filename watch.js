
const KITSU_BASE = 'https://kitsu.io/api/edge';
const ANIPUB_BASE = 'https://pixelplay-anipub.massamrazam.workers.dev';

const params = new URLSearchParams(window.location.search);
let animeSlug = params.get('anime') || localStorage.getItem('currentAnimeSlug');
const selectedAnimeTitle = params.get('title') || '';

let currentAnimeTitle = '';
let currentAnimeEpisodesCount = 'Unknown';
let currentEpisodeIndex = -1;
let availableEpisodes = [];

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

/* -------------------------------
   API REQUEST HELPER
-------------------------------- */

async function requestJSON(url, provider = 'API') {
    console.log(`[${provider}] Request:`, url);

    let response;

    try {
        response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });
    } catch (error) {
        console.error(`[${provider}] Network error:`, error);

        throw new Error(
            `${provider} network error: ${error.message || error.name}`
        );
    }

    console.log(`[${provider}] HTTP status:`, response.status);

    const text = await response.text();

    if (!response.ok) {
        throw new Error(
            `${provider} HTTP ${response.status}: ${text.slice(0, 200)}`
        );
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error(`[${provider}] Invalid JSON:`, text);
        throw new Error(`${provider} returned invalid JSON.`);
    }
}

/* -------------------------------
   EPISODE CONTROLS
-------------------------------- */

function updateEpisodeControls() {
    const previous = $('previous-episode');
    const next = $('next-episode');
    const label = $('current-episode-label');

    if (previous) {
        previous.disabled = currentEpisodeIndex <= 0;
    }

    if (next) {
        next.disabled =
            currentEpisodeIndex < 0 ||
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
        button.setAttribute(
            'aria-label',
            `Play episode ${episode.number}`
        );

        button.addEventListener('click', () => {
            playEpisodeByIndex(index);
        });

        grid.appendChild(button);
    });
}

/* -------------------------------
   ANIPUB SEARCH
-------------------------------- */

async function findAniPubEntry(titleCandidates) {
    const tried = new Set();

    // First: AniPub Find
    for (const title of titleCandidates) {
        const clean = String(title || '').trim();
        const key = normalizeTitle(clean);

        if (!key || tried.has(key)) continue;
        tried.add(key);

        const url =
            `${ANIPUB_BASE}/api/find/${encodeURIComponent(clean)}`;

        try {
            const result = await requestJSON(url, 'AniPub Find');

            console.log('[AniPub] Find response:', result);

            if (result?.exist && result.id != null) {
                return {
                    exist: true,
                    id: result.id,
                    matchedName: clean
                };
            }
        } catch (error) {
            console.warn('[AniPub] Find failed:', error.message);
        }
    }

    // Second: AniPub Search
    for (const title of titleCandidates) {
        const clean = String(title || '').trim();

        if (!clean) continue;

        const url =
            `${ANIPUB_BASE}/api/search/${encodeURIComponent(clean)}`;

        try {
            const data = await requestJSON(url, 'AniPub Search');

            console.log('[AniPub] Search response:', data);

            if (!Array.isArray(data)) {
                console.warn('[AniPub] Search did not return an array.');
                continue;
            }

            const target = normalizeTitle(clean);

            const targetWords = new Set(
                target.split(' ').filter(word => word.length > 1)
            );

            let best = null;
            let bestScore = 0;

            for (const item of data) {
                const name = normalizeTitle(item?.Name);

                const finder = normalizeTitle(
                    String(item?.finder || '').replace(/-/g, ' ')
                );

                const candidates = [name, finder].filter(Boolean);

                if (item?.Id == null) continue;

                if (candidates.includes(target)) {
                    best = item;
                    bestScore = 1;
                    break;
                }

                for (const candidate of candidates) {
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
            }

            if (best && bestScore >= 0.6) {
                return {
                    exist: true,
                    id: best.Id,
                    matchedName: best.Name
                };
            }

        } catch (error) {
            console.error('[AniPub] Search failed:', error.message);
        }
    }

    throw new Error('Anime not found.');
}

/* -------------------------------
   ANIPUB LINK CLEANER
-------------------------------- */

function cleanAniPubLink(value) {
    if (typeof value !== 'string') return '';

    const source = value
        .trim()
        .replace(/^src\s*=\s*/i, '')
        .replace(/^["']|["']$/g, '');

    try {
        const parsed = new URL(source);

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }

        return parsed.href;

    } catch (error) {
        console.warn('[AniPub] Invalid episode URL:', value);
        return '';
    }
}

/* -------------------------------
   GET EPISODES
-------------------------------- */

async function getAniPubEpisodes(titleCandidates) {
    setPlayerStatus('Finding Available Episodes...');

    console.log('[AniPub] Title candidates:', titleCandidates);

    const entry = await findAniPubEntry(titleCandidates);

    if (!entry) {
        throw new Error('Anime not found.');
    }

    console.log('[AniPub] Selected anime:', entry);

    const detailsUrl =
        `${ANIPUB_BASE}/v1/api/details/${encodeURIComponent(entry.id)}`;

    const details = await requestJSON(detailsUrl, 'Episode Details');

    console.log('[Episodes] Details:', details);

    const local = details?.local;

    if (!local) {
        throw new Error('Episode details are unavailable.');
    }

    const episodes = [];

    // Episode 1
    const firstLink = cleanAniPubLink(local.link);

    if (firstLink) {
        episodes.push({
            number: 1,
            src: firstLink,
            provider: 'anipub'
        });
    }

    // Remaining episodes
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

    // Remove duplicates
    const uniqueEpisodes = [
        ...new Map(
            episodes.map(episode => [episode.number, episode])
        ).values()
    ];

    uniqueEpisodes.sort((a, b) => a.number - b.number);

    console.log('[Episodes] Final list:', uniqueEpisodes);
    console.log('[Episodes] Total:', uniqueEpisodes.length);

    return uniqueEpisodes;
}

/* -------------------------------
   PLAY EPISODE
-------------------------------- */

async function playEpisodeByIndex(index) {
    if (index < 0 || index >= availableEpisodes.length) return;

    const episode = availableEpisodes[index];
    const player = $('anime-video-player');

    if (!player) {
        console.error('[Player] Iframe not found.');
        setPlayerStatus('Video player was not found.', 'error');
        return;
    }

    currentEpisodeIndex = index;

    player.title =
        `${currentAnimeTitle} — Episode ${episode.number}`;

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

    player.src = episode.src;

    setPlayerStatus(
        `Now loading ${currentAnimeTitle} - Episode ${episode.number}. If playback does not start, the source may be unavailable.`,
        'success'
    );

    console.log('[Player] Playing episode:', episode);
}

/* -------------------------------
   LOAD ANIME DATA
-------------------------------- */

async function loadAnimeData() {
    const titleElement = $('anime-title');
    const synopsisElement = $('anime-synopsis');
    const episodesGrid = $('episodes-grid');

    if (!animeSlug) {
        if (titleElement) {
            titleElement.textContent = 'Anime not found!';
        }

        setPlayerStatus('No anime was selected.', 'error');
        return;
    }

    if (titleElement) {
        titleElement.textContent =
            selectedAnimeTitle || 'Loading anime...';
    }

    if (episodesGrid) {
        episodesGrid.innerHTML = '';
    }

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
            const query =
                selectedAnimeTitle || animeSlug.replace(/-/g, ' ');

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
            result.data.find(item =>
                item.attributes?.slug === animeSlug
            ) ||
            (selectedAnimeTitle
                ? result.data.find(item => {
                    const a = item.attributes || {};
                    const t = a.titles || {};

                    const wanted =
                        selectedAnimeTitle.toLowerCase().trim();

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
            .map(item =>
                item.attributes?.title || item.attributes?.slug
            )
            .filter(Boolean);

        const animeData = {
            id: record.id,
            slug: animeSlug,
            title: currentAnimeTitle,
            poster,
            rating,
            type
        };

        if (titleElement) {
            titleElement.textContent = currentAnimeTitle;
        }

        if (synopsisElement) {
            synopsisElement.textContent =
                anime.synopsis || 'No description available.';
        }

        if ($('detail-poster')) {
            $('detail-poster').src = poster;
        }

        if ($('detail-title')) {
            $('detail-title').textContent = currentAnimeTitle;
        }

        if ($('anime-rating')) {
            $('anime-rating').textContent = `★ ${rating}`;
        }

        if ($('detail-rating')) {
            $('detail-rating').textContent = `★ ${rating}`;
        }

        if ($('detail-type')) {
            $('detail-type').textContent = type;
        }

        if ($('detail-country')) {
            $('detail-country').textContent = 'Japan';
        }

        if ($('detail-country-val')) {
            $('detail-country-val').textContent = 'Japan';
        }

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
                genres.length
                    ? genres.join(', ')
                    : 'Action, Adventure';
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

        // Integration with watch-ui.js
        window.pixelPlayAnimeData = {
            animeData,
            genres,
            slug: animeSlug
        };

        window.dispatchEvent(
            new CustomEvent('pixelplay:anime-loaded', {
                detail: window.pixelPlayAnimeData
            })
        );

        // AniPub title candidates
        const titleCandidates = [
            selectedAnimeTitle,
            currentAnimeTitle,
            titles.en,
            titles.en_jp,
            titles.ja_jp,
            animeSlug.replace(/-/g, ' ')
        ].filter(Boolean);

        console.log('[Episodes] Title candidates:', titleCandidates);

        availableEpisodes =
            await getAniPubEpisodes(titleCandidates);

        if (!availableEpisodes.length) {
            throw new Error('No episodes found.');
        }

        buildEpisodeButtons();

        setPlayerStatus(
            `${availableEpisodes.length} Episodes Found`,
            'success'
        );

        await playEpisodeByIndex(0);

    } catch (error) {
        console.error('[Watch] Anime loading error:', error);

        if (titleElement) {
            titleElement.textContent =
                currentAnimeTitle || 'Anime details unavailable';
        }

        if (episodesGrid) {
            episodesGrid.innerHTML = '';
        }

        availableEpisodes = [];
        currentEpisodeIndex = -1;

        updateEpisodeControls();

        setPlayerStatus(
            `Error: ${error.message}`,
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
