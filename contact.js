let searchOpen = false;
let sidebarOpen = false;

window.toggleSearch = function() {
    const searchBar = document.getElementById('search-bar-container');
    const overlay = document.getElementById('screen-overlay');
    const sidebar = document.getElementById('sidebar');

    if (sidebarOpen) {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        const switchLine = document.getElementById('switch-line');
        if (switchLine) {
            switchLine.setAttribute('x1', '7');
            switchLine.setAttribute('x2', '7');
        }
        sidebarOpen = false;
    }

    if (!searchOpen) {
        if (searchBar) searchBar.style.display = 'flex';
        if (overlay) overlay.style.display = 'block';
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
        searchOpen = true;
    } else {
        window.closeEverything();
    }
}

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('screen-overlay');
    const searchBar = document.getElementById('search-bar-container');
    const suggestions = document.getElementById('search-suggestions');
    const switchLine = document.getElementById('switch-line');

    if (searchOpen) {
        if (searchBar) searchBar.style.display = 'none';
        if (suggestions) suggestions.style.display = 'none';
        searchOpen = false;
    }

    if (!sidebarOpen) {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.style.display = 'block';
        document.body.classList.add('sidebar-open');
        if (switchLine) {
            switchLine.setAttribute('x1', '17');
            switchLine.setAttribute('x2', '17');
        }
        sidebarOpen = true;
    } else {
        window.closeEverything();
    }
}

window.closeEverything = function() {
    const searchBar = document.getElementById('search-bar-container');
    const suggestions = document.getElementById('search-suggestions');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('screen-overlay');

    if (searchBar) searchBar.style.display = 'none';
    if (suggestions) suggestions.style.display = 'none';
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.style.display = 'none';
    
    document.body.classList.remove('sidebar-open');
    
    const switchLine = document.getElementById('switch-line');
    if (switchLine) {
        switchLine.setAttribute('x1', '7');
        switchLine.setAttribute('x2', '7');
    }

    searchOpen = false;
    sidebarOpen = false;
}

window.clearSearchInput = function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    const suggestionsBox = document.getElementById('search-suggestions');
    if (suggestionsBox) {
        suggestionsBox.style.display = 'none';
        suggestionsBox.innerHTML = '';
    }
    if (searchInput) searchInput.focus();
}

window.handleProfileClick = function() {
    window.location.href = 'profile.html';
}

window.handleLogoutClick = function() {
    window.location.href = 'login.html';
}

// Fully working search bar suggestions
const searchInputElem = document.getElementById('search-input');
if (searchInputElem) {
    searchInputElem.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        const suggestionsBox = document.getElementById('search-suggestions');

        if (!query) {
            suggestionsBox.style.display = 'none';
            suggestionsBox.innerHTML = '';
            return;
        }

        try {
            const res = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&nsfw=true&page[limit]=8`);
            const data = await res.json();

            if (data.data && data.data.length > 0) {
                suggestionsBox.innerHTML = '';
                suggestionsBox.style.display = 'block';

                data.data.forEach(anime => {
                    const attr = anime.attributes;
                    const rawTitle = attr.canonicalTitle || attr.titles.en_jp || attr.titles.en || 'Unknown Anime';
                    const poster = attr.posterImage ? attr.posterImage.small : 'https://via.placeholder.com/50x70?text=No+Img';
                    const rating = attr.averageRating ? (attr.averageRating / 10).toFixed(1) : '8.0';
                    const slug = anime.slug;

                    const itemHTML = `
                        <div class="suggestion-item" onclick="window.location.href='watch.html?anime=${slug}'">
                            <img src="${poster}" alt="${rawTitle}" class="suggestion-poster">
                            <div class="suggestion-info">
                                <div class="suggestion-title">${rawTitle}</div>
                                <div class="suggestion-rating">★ ${rating}</div>
                            </div>
                        </div>
                    `;
                    suggestionsBox.innerHTML += itemHTML;
                });
            } else {
                suggestionsBox.style.display = 'block';
                suggestionsBox.innerHTML = '<div style="padding: 12px; color: #aaa; text-align: center; font-size: 13px;">No anime found</div>';
            }
        } catch (err) {
            console.error('Search suggestion error:', err);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    var messageTextarea = document.getElementById('user_message');
    var charCount = document.getElementById('char-count');

    if (messageTextarea && charCount) {
        messageTextarea.addEventListener('input', function(e) {
            var currentLength = e.target.value.length;
            var formattedLength = currentLength < 10 ? '0' + currentLength : currentLength;
            charCount.textContent = formattedLength + '/300';
        });
    }

    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var name = document.getElementById('user_name').value.trim();
            var email = document.getElementById('user_email').value.trim();
            var message = document.getElementById('user_message').value.trim();

            if (!name || !email || !message) {
                alert('Please fill in all fields.');
                return false;
            }

            var templateParams = {
                from_name: name,
                from_email: email,
                message: message
            };

            var SERVICE_ID = "service_30fwetn";
            var TEMPLATE_ID = "template_mls9txb";

            var submitBtn = document.getElementById('submit-btn');
            submitBtn.textContent = "Sending...";
            submitBtn.disabled = true;

            emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
                .then(function(response) {
                    document.getElementById('success-popup-overlay').style.display = 'flex';
                    contactForm.reset();
                    if (charCount) charCount.textContent = '00/300';
                    submitBtn.textContent = "Send Message 🚀";
                    submitBtn.disabled = false;
                }, function(error) {
                    alert('Failed to send message: ' + JSON.stringify(error));
                    submitBtn.textContent = "Send Message 🚀";
                    submitBtn.disabled = false;
                });

            return false;
        });
    }

    var goBackBtn = document.getElementById('goBackBtn');
    if (goBackBtn) {
        goBackBtn.addEventListener('click', function() {
            window.location.href = 'home.html';
        });
    }
});

setInterval(function() {
    var userId = sessionStorage.getItem('pixelPlay_current_user_id') || 'guest';
    var currentSeconds = parseInt(sessionStorage.getItem('pixelPlayTime_' + userId)) || 0;
    currentSeconds++;
    sessionStorage.setItem('pixelPlayTime_' + userId, currentSeconds);
}, 1000);
