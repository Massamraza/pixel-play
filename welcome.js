
const searchInput = document.getElementById("search-input");
const suggestionsBox = document.getElementById("search-suggestions");
const searchButton = document.getElementById("search-button");

let searchTimer = null;
let currentSearchController = null;
let latestSearch = 0;
let currentResults = [];

function openAnime(anime) {
    if (!anime) return;

    const slug =
        anime.slug ||
        anime.attributes?.slug ||
        anime.id;

    if (!slug) return;

    const title =
        anime.attributes.canonicalTitle ||
        anime.attributes.titles?.en_jp ||
        anime.attributes.titles?.en ||
        "Unknown Anime";

    const url = new URL("watch.html", window.location.href);

    url.searchParams.set("anime", slug);
    url.searchParams.set("title", title);

    window.location.href = url.href;
}

function showMessage(message) {
    suggestionsBox.innerHTML = "";

    const item = document.createElement("div");

    item.style.cssText = `
        padding: 18px;
        text-align: center;
        color: #aaaaaa;
        font-size: 14px;
    `;

    item.textContent = message;

    suggestionsBox.appendChild(item);
    suggestionsBox.style.display = "block";
}

function showSuggestions(animeList) {

    suggestionsBox.innerHTML = "";
    currentResults = animeList || [];

    if (!animeList || animeList.length === 0) {
        showMessage("No anime found");
        return;
    }

    animeList.forEach(anime => {

        const attr = anime.attributes;

        const title =
            attr.canonicalTitle ||
            attr.titles?.en_jp ||
            attr.titles?.en ||
            "Unknown Anime";

        const poster =
            attr.posterImage?.small ||
            attr.posterImage?.medium ||
            "";

        const rating = attr.averageRating
            ? (Number(attr.averageRating) / 10).toFixed(1)
            : "N/A";

        const item = document.createElement("button");

        item.type = "button";
        item.className = "suggestion-item";

        const image = document.createElement("img");

        image.className = "suggestion-poster";
        image.alt = title;
        image.loading = "lazy";

        if (poster) {
            image.src = poster;
        }

        const info = document.createElement("div");
        info.className = "suggestion-info";

        const name = document.createElement("div");
        name.className = "suggestion-title";
        name.textContent = title;

        const score = document.createElement("div");
        score.className = "suggestion-rating";
        score.textContent = rating === "N/A"
            ? "Rating unavailable"
            : `★ ${rating}`;

        info.appendChild(name);
        info.appendChild(score);

        item.appendChild(image);
        item.appendChild(info);

        item.addEventListener("click", () => {
            openAnime(anime);
        });

        suggestionsBox.appendChild(item);

    });

    suggestionsBox.style.display = "block";
}

async function searchAnime(query) {

    if (currentSearchController) {
        currentSearchController.abort();
    }

    const searchId = ++latestSearch;

    currentSearchController = new AbortController();

    showMessage("Searching anime...");

    try {

        const url =
            "https://kitsu.io/api/edge/anime?" +
            "filter[text]=" + encodeURIComponent(query) +
            "&page[limit]=8&sort=-userCount";

        const response = await fetch(url, {
            signal: currentSearchController.signal
        });

        if (!response.ok) {
            throw new Error("Search request failed");
        }

        const result = await response.json();

        if (searchId !== latestSearch) return;

        showSuggestions(result.data);

    } catch (error) {

        if (error.name === "AbortError") return;

        console.error("Anime search error:", error);

        showMessage("Unable to search. Please try again.");

    }
}

/* LIVE SEARCH */

searchInput.addEventListener("input", function() {

    const query = this.value.trim();

    clearTimeout(searchTimer);

    if (!query) {

        latestSearch++;

        if (currentSearchController) {
            currentSearchController.abort();
        }

        suggestionsBox.style.display = "none";
        suggestionsBox.innerHTML = "";

        currentResults = [];

        return;
    }

    searchTimer = setTimeout(() => {
        searchAnime(query);
    }, 350);

});

/* SEARCH BUTTON */

searchButton.addEventListener("click", function() {

    const query = searchInput.value.trim();

    if (!query) {
        searchInput.focus();
        return;
    }

    clearTimeout(searchTimer);
    searchAnime(query);

});

/* ENTER KEY */

searchInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        if (currentResults.length > 0) {
            openAnime(currentResults[0]);
        } else {
            clearTimeout(searchTimer);

            const query = searchInput.value.trim();

            if (query) searchAnime(query);
        }
    }

    if (event.key === "Escape") {
        suggestionsBox.style.display = "none";
    }

});

/* CLOSE SUGGESTIONS ON OUTSIDE CLICK */

document.addEventListener("click", function(event) {

    if (
        !event.target.closest(".search-wrapper")
    ) {
        suggestionsBox.style.display = "none";
    }

});

/* SHOW SUGGESTIONS AGAIN ON FOCUS */

searchInput.addEventListener("focus", function() {

    if (this.value.trim() && suggestionsBox.children.length > 0) {
        suggestionsBox.style.display = "block";
    }

});
