//Global variables
var GlobalSettings = {
    feedCount: 5,
    clientName: 'urbanoutfitters',
    youtubeUser: 'uotv',
    initialLoad: true,
    isLoading: false,
    handler: null,

    // wookmark layout options.
    options: {
        autoResize: true, // This will auto-update the layout when the browser window is resized.
        container: null, // Optional, used for some extra CSS styling
        offset: 15, // Optional, the distance between grid items
        itemWidth: 185 // Optional, the width of a grid item
    },

    urlPattern: /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi
};

//Facebook api settings
var FBSettings = {
    fbSDKLoaded: false,
    fbAccessToken: '',
    fbClientFeedsUrl: 'urbanoutfitters/posts',
    fbApiBaseUrl: 'https://graph.facebook.com/',
    fbFileds: 'id,message,picture,link,type',
    fbNextFeedUrl: ''
};

//Twitter api settings
var TwitterSettings = {
    twitterApiBaseurl: 'https://api.twitter.com/1/statuses/user_timeline.json',
    trimUser: 1,
    includeEntities: 0,
    maxTweetId: 0
};

//Youtube api settings
var YoutubeSettings = {
    startIndex: 1,
    user: 'uotv',
    youtubeApiBaseUrl: 'http://gdata.youtube.com/feeds/users/' + GlobalSettings.youtubeUser + '/uploads?alt=json-in-script&'
};

//Hide/show components when login/logout
function toggleLogin(isLogin) {
    $('#linkLogin').toggle(!isLogin);
    $('#divLogout').toggle(isLogin);
    if (isLogin)
        $('#divAccount').fadeIn('normal');
    else
        $('#divAccount').hide();
}

//Highlight active links
function highLightLinks() {
    var hash = window.location.hash.substr(1);
    $('#ulMainNav li, #secNav li').removeClass('active');
    $('#ulMainNav li a, #secNav li a').each(function () {
        var href = $(this).attr('href');
        if (hash == href.substr(0, href.length - 5)) {
            $(this).parent().addClass('active');
        }
    });
}

// When scrolled all the way to the bottom, add more tiles.
function onScroll(event) {
    // Check if we're within 100 pixels of the bottom edge of the broser window.
    var closeToBottom = ($(window).scrollTop() + $(window).height() > $(document).height() - 100);
    if (GlobalSettings.isLoading === false && FBSettings.fbNextFeedUrl && closeToBottom) {
        // Get more activities, and add them to the bottom of the grid.
        loadNext();
    }
};

//initial feeds load
function loadPosts() {
    GlobalSettings.isLoading = true;
    toggleSpinner(true);
    $.when(loadFacebook(), loadTwitter(), loadYoutube()).done(processData);
}

//load more feeds
function loadNext() {
    GlobalSettings.initialLoad = false;
    GlobalSettings.isLoading = true;
    toggleLoadMore(true);
    $.when(loadFacebook(FBSettings.fbNextFeedUrl), loadTwitter(TwitterSettings.maxTweetId), loadYoutube(YoutubeSettings.startIndex)).done(processData);
}

//process feeds data from social networks to show them on page dynamically
function processData(fbResult, twitterResult, youtubeResult) {

    //process facebook data
    if (fbResult[1] == 'success') {
        var fbData = fbResult[0];

        if (fbData.paging.next) {
            FBSettings.fbNextFeedUrl = fbData.paging.next;
        }
        showFacebook(fbData);
    }
    //process twitter data
    if (twitterResult[1] == 'success') {
        var twitterData = twitterResult[0]; 0

        TwitterSettings.maxTweetId = twitterData[twitterData.length - 1].id - 1;
        showTwiiter(twitterData);
    }

    //process youtube data
    if (youtubeResult[1] == 'success') {
        //increase the start-index for next fetch
        YoutubeSettings.startIndex += GlobalSettings.feedCount;
        showYoutube(youtubeResult);
    }
    applyWookmark();
}

function applyWookmark() {
    // Clear our previous layout handler.
    if (GlobalSettings.handler)
        GlobalSettings.handler.wookmarkClear();

    // Create and set a new layout handler.
    GlobalSettings.options.container = $('#divFeeds');
    GlobalSettings.handler = $('#ulFeeds li');
    GlobalSettings.handler.wookmark(GlobalSettings.options);

    if (GlobalSettings.initialLoad)
        toggleSpinner(false);
    else
        toggleLoadMore(false);
    GlobalSettings.isLoading = false;
}

//load facebook feeds
function loadFacebook(nextUrl) {
    return $.ajax({
        url: nextUrl ? nextUrl : (FBSettings.fbApiBaseUrl + FBSettings.fbClientFeedsUrl),
        data: { access_token: FBSettings.fbAccessToken, limit: GlobalSettings.feedCount },
        dataType: "jsonp"
    });
}
//show facebook feeds on page
function showFacebook(response) {
    for (var i = 0, l = response.data.length; i < l; i++) {
        var post = response.data[i];
        if (post.type == 'photo') {
            var newItem = $(document.createElement('li'));
            var fbImg = document.createElement('img');
            fbImg.src = 'Content/img/activity_fb.png';
            fbImg.height = '25';
            fbImg.width = '25';
            fbImg.className = 'pullLeft';

            newItem.append(fbImg);

            var fbLikes = $(document.createElement('small'));
            var likesText = '';
            if (post.likes)
                likesText = post.likes.count + ' Likes';
            if (post.shares)
                likesText += ' ' + post.shares.count + ' Shares';
            fbLikes.text(likesText);
            fbLikes.addClass('pullRight');

            newItem.append(fbLikes);

            if (post.picture) {
                var newImg = document.createElement('img');
                newImg.src = post.picture.replace('_s', '_n');
                newImg.className = 'itemImg';
                newItem.append(newImg);
            }
            if (post.message) {
                var newText = document.createElement('p');
                var text = post.message;
                newText.innerHTML = extractLink(text);
                newItem.append(newText);
            }
            if (post.link) {
                var newLink = document.createElement('a');
                newLink.setAttribute('href', post.link);
                newLink.setAttribute('target', '_blank');
                var childNodes = newItem.contents();
                $(newLink).append(childNodes);
                newItem.append(newLink);
            }
            $('#ulFeeds').append(newItem);
        }
    }
}

//load twitter feeds
function loadTwitter(maxId) {
    return $.ajax({
        url: TwitterSettings.twitterApiBaseurl,
        data: { screen_name: GlobalSettings.clientName, count: GlobalSettings.feedCount, include_entities: TwitterSettings.includeEntities, trim_user: TwitterSettings.trimUser, max_id: maxId },
        dataType: 'jsonp'
    });
}

//show twitter feeds on page
function showTwiiter(response) {
    for (var i = 0, l = response.length; i < l; i++) {
        var post = response[i];
        var newItem = $(document.createElement('li'));
        var twitterImg = document.createElement('img');
        twitterImg.src = 'Content/img/activity_twr.png';
        twitterImg.height = '25';
        twitterImg.width = '25';
        twitterImg.className = 'pullLeft';

        var retweetCount = $(document.createElement('small'));
        if (post.retweet_count)
            retweetCount.text(post.retweet_count + ' Retweet');
        retweetCount.addClass('pullRight');

        newItem.append(twitterImg, retweetCount);

        if (post.text) {
            var newText = document.createElement('p');
            newText.innerHTML = extractLink(post.text);
            newItem.append(newText);
        }
        $('#ulFeeds').append(newItem);
    }
}

//load youtube feeds
function loadYoutube(startIndex) {
    if (!startIndex)
        startIndex = 1;
    var requestUrl = YoutubeSettings.youtubeApiBaseUrl + 'start-index=' + startIndex + '&max-results=' + GlobalSettings.feedCount;
    return $.ajax({
        url: requestUrl,
        dataType: 'jsonp'
    });
}

//show youtube feeds on page
function showYoutube(response) {
    var entries = response[0].feed.entry || [];
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];

        var newItem = $(document.createElement('li'));
        var youTubeImg = document.createElement('img');
        youTubeImg.src = 'Content/img/activity_youtube.png';
        youTubeImg.height = '25';
        youTubeImg.width = '50';
        youTubeImg.className = 'pullLeft';

        var viewCount = $(document.createElement('small'));
        viewCount.text(entry.yt$statistics.viewCount + ' views');
        viewCount.addClass('pullRight');

        newItem.append(youTubeImg, viewCount);

        var thumbnailUrl = entry.media$group.media$thumbnail[0].url;
        var playerUrl = entry.media$group.media$content[0].url;
        var title = entry.title;
        var description = entry.media$group.media$description.$t;

        var newImg = document.createElement('img');
        newImg.src = thumbnailUrl;
        newImg.className = 'itemImg';
        newItem.append(newImg);

        var newText = $(document.createElement('p'));
        newText.text(title.$t);
        newItem.append(newText);

        newItem.on('click', { url: playerUrl, desc: description }, loadVideo);

        $('#ulFeeds').append(newItem);
    }
}

//load youtube video into flash panel
function loadVideo(event) {
    var url = event.data.url;
    var desc = event.data.desc;
    swfobject.embedSWF(
                url + '&rel=1&border=0&fs=1&autoplay=1', 'player', '640', '420', '9.0.0', false,
                false, { allowfullscreen: 'true' });
    var descHtml = extractLink(desc);
    $('#videoDesc').html(descHtml);
    toggleVideo(true);
}

//show/hide youtube video panel
function toggleVideo(show) {
    if (show)
        $('#divPlayer, .modalBackground').fadeIn(300);
    else
        $('#divPlayer, .modalBackground').fadeOut(300);
}

//extract link from text description
function extractLink(text) {
    var urlMatches = text.match(GlobalSettings.urlPattern);
    if (urlMatches) {
        for (var i = 0; i < urlMatches.length; i++) {
            var urlText = urlMatches[i];
            var linkText = "<a href='" + $.trim(urlText) + "' target='_blank'>" + urlText + "</a>";
            text = text.replace(urlText, linkText);
        }
    }
    //if no url is found, return the orginial text
    return text;
}

//show/hide spinner when first load
function toggleSpinner(show) {
    $('#divLoading, .modalBackground').toggle(show);
}

//show/hide loading more span
function toggleLoadMore(show) {
    $('#divLoadMore').toggle(show);
}

//redirect to contest page by default
function redirectContestPage() {
    if (window.location.hash.indexOf("Contests") >= 0)
        return;
    $('#divRightCol').load('Contests.html #partialView');
    window.location.hash = "Contests";
    highLightLinks();
}

//initial page when load
function initialPage(href) {
    highLightLinks();

    //activiy page
    if (href.indexOf('Activity') >= 0) {
        // Capture scroll event.
        $(document).bind('scroll', onScroll);

        //Load activity feeds when page is ready
        loadPosts();
        $('.modalBackground').click(function () {
            toggleVideo(false);
        });
    }

    //profile page
    if (href.indexOf('Profile') >= 0) {
        var accountImgUrl = $('#imgAccount').attr('src')+'?type=large';
        var accountName = $('#lblName').text();
        $('#imgProfile').attr('src', accountImgUrl);
        $('#h3AccountName').text(accountName);
    }
}

function loadContent(href) {
    var toLoad = href + ' #partialView';

    $('#divRightCol').load(toLoad, null, function (responseText, textStatus, XMLHttpRequest) {
        if (textStatus == 'success') {
            window.location.hash = href.substr(0, href.length - 5);
            initialPage(href);
        }
    });
}
//Initial UI actions when document ready
$(document).ready(function () {
    $('#linkLogout').click(function () {
        fb_logout();
    });

    $('#linkLogin').click(function () {
        fb_login();
    });

    //hide spinner initially
    toggleSpinner(false);

    //show facebook login button if not login
    if (FBSettings.fbAccessToken == '')
        toggleLogin(false);

    //dynamically load right column page from html files
    var hash = window.location.hash.substr(1);
    //if site is loaded initially, then load contests page by default
    if (hash == '') {
        redirectContestPage();
    } else {
        //Pages which are not "Contest.html" require facebook login first
        if (hash.indexOf('Contests') < 0 && FBSettings.fbAccessToken == '') {
            redirectContestPage();
        } else {
            var href = hash + '.html';
            loadContent(href);
        }
    }

    $('#ulMainNav li a, #secNav li a').click(function () {
        var href = $(this).attr('href');
        var currentHash = window.location.hash.substr(1);
        //if current page is the same as link, then return
        if (currentHash == href.substr(0, href.length - 5)) {
            return false;
        }

        $('#partialView').fadeOut('fast', loadContent(href));
        return false;
    });
});

//Bind contest item info into UI panel
$(document).on('click', '.contestItem a', function () {
    var imgUrl = $(this).prevAll('img').attr('src');
    var $contestItem = $(this).prevAll('dl');
    var title = $contestItem.children('dt').text();
    var content = $contestItem.children('dd.contestDetail').text();
    var reward = $contestItem.children('dd.contestReward').text();
    var expire = 'Expire ' + $contestItem.children('dd:eq(1)').text();

    $('#imgContest').attr('src', imgUrl);
    $('#divContestContent h4').text(title);
    $('#divContestContent p').text(content);
    $('#divContestReward h4:eq(1)').text(reward);
    $('#divContestReward p').text(expire);
});
