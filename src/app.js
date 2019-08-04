// Global url variable
var url;
var STEEMOVIE = "steemovie";
var STEEM_URL = "https://steemit.com/";
var searchTag = "";

//IPFS Initialise
var ipfs = window.IpfsApi({host: 'ipfs.infura.io', protocol: 'https'});
var topimage = [];

//SteemConnect Initialize
//callbackURL: 'https://www.steemovie.site',
var api = new steemconnect.Client({
  app: 'steemovie.app',
  callbackURL: 'https://www.steemovie.site',
  scope: ['vote', 'comment']
});

//Get IPFS hash for uploaded image
function readFile(input) {
  var content = document.getElementById("publish");
  var idxDot = content.value.lastIndexOf(".") + 1;
  var extFile = content.value.substr(idxDot, content.value.length).toLowerCase();
  if (extFile == "jpeg" || extFile == "png" || extFile == "jpg" || extFile == "gif") {

    var reader = new FileReader();
    reader.readAsArrayBuffer(content.files[0]);
    reader.onloadend = function (event) {
      var buf = buffer.Buffer(reader.result)
      ipfs.add(buf, (err, result) => {
        var imageHash = result[0].hash;
        topimage.push("https://ipfs.io/ipfs/" + imageHash);
        url = "https://ipfs.io/ipfs/" + imageHash;

        $("#image").html(`
                    <label>
                    <input type="file" id="publish" onchange="readFile(this)" style="display:none">
                    <img src="` + url + `">
                    </label>
                `);

      });
    }
  } else {
    alert("Only jpeg/gif/png files are allowed!");
    $('.segment').dimmer('hide');
  }
}

//Get IPFS hash for uploaded image
function insert() {

  var textarea = document.querySelector('#content');

  var sentence = textarea.value;
  var len = sentence.length;
  var pos = textarea.selectionStart;

  var before = sentence.substr(0, pos);
  var after = sentence.substr(pos, len);

  var content = document.getElementById("insertImage");

  var idxDot = content.value.lastIndexOf(".") + 1;

  var extFile = content.value.substr(idxDot, content.value.length).toLowerCase();
  if (extFile == "jpeg" || extFile == "png" || extFile == "jpg" || extFile == "gif") {

    var reader = new FileReader();
    reader.readAsArrayBuffer(content.files[0]);
    reader.onloadend = function (event) {
      var buf = buffer.Buffer(reader.result)
      ipfs.add(buf, (err, result) => {
        var imageHash = result[0].hash;
        topimage.push("https://ipfs.io/ipfs/" + imageHash);
        url = "https://ipfs.io/ipfs/" + imageHash;

        var link = "![image](" + url + ")"
        sentence = before + link + after;
        textarea.value = sentence;

        _preview()

      });
    }
  } else {
    alert("Only jpeg/gif/png files are allowed!");
    $('.segment').dimmer('hide');
  }
}


//Post method
function _comment(parent_author, parent_permlink, author, permlink, title, body, jsonMetadata) {
  api.comment(parent_author, parent_permlink, author, permlink, title, body, jsonMetadata, function (err, res) {
    if (!err) {
      location.reload();
    } else {
      alert("Error, please try again later")
    }
  });
}

//Get Post content
async function _content(permlink, author) {

  app.permlink = permlink;
  app.author = author;

  var content;

  var votes;
  var num;

  var author_image;

  var detail_pending;
  var detail_total;
  var detail_curator;
  var detail_payout;
  var detail_displayPayout;

  await steem.api.getActiveVotes(author, permlink, function (err, result) {
    votes = result;
    num = votes.length;
  });

  steem.api.getContent(author, permlink, function (err, result) {

    author_image = "https://steemitimages.com/u/" + result.author + "/avatar";

    detail_pending = result.pending_payout_value.slice(0,-4);
    detail_total = result.total_payout_value.slice(0,-4);
    detail_curator = result.curator_payout_value.slice(0, -4);

    detail_payout = parseFloat(detail_pending) + parseFloat(detail_total) + parseFloat(detail_curator);
    detail_displayPayout = detail_payout.toFixed(3);

    content = "<h3>" + DOMPurify.sanitize(marked(result.title)) + "</h3>" +
      "<p>@" + result.author + " | " + result.created.slice(0,10) + "</p>" +
      "<br>" + DOMPurify.sanitize(marked(result.body)) + "<br>"
    ;

    var replies = `
        <form>
          <div class="form-group">
            <span class="badge badge-pill badge-primary"> ` + JSON.parse(result.json_metadata).tags[0] + `</span>
            <span class="badge badge-pill badge-primary"> ` + JSON.parse(result.json_metadata).tags[1] + `</span>
            <span class="badge badge-pill badge-primary"> ` + JSON.parse(result.json_metadata).tags[2] + `</span>
            <span class="badge badge-pill badge-primary"> ` + JSON.parse(result.json_metadata).tags[3] + `</span>
            <span class="badge badge-pill badge-primary"> ` + JSON.parse(result.json_metadata).tags[4] + `</span>
          </div><br>
          <div class="form-group">
              @` + result.author + " | " + result.created.slice(0,10) +`
          </div>
          <div class="form-group">
            <button type="button" class="btn btn-danger" onclick="vote()">
              Vote <span class="badge badge-light">` + num + `</span>
            </button>
            <button type="button" class="btn btn-primary">
              Payout <span class="badge badge-light">$` + detail_displayPayout + `</span>
            </button>
          </div>

          <div class="form-group">
            <select class="form-control" id="power">
              <option value="100">Voting @ 100%</option>
              <option value="10">Voting @ 10%</option>
              <option value="20">Voting @ 20%</option>
              <option value="30">Voting @ 30%</option>
              <option value="40">Voting @ 40%</option>
              <option value="50">Voting @ 50%</option>
              <option value="60">Voting @ 60%</option>
              <option value="70">Voting @ 70%</option>
              <option value="80">Voting @ 80%</option>
              <option value="90">Voting @ 90%</option>
            </select>
          </div>

          <br><br>

          <div class="form-group">
              <label>Comment: </label>
              <textarea class="form-control" rows="5" placeholder="Comment" id="reply"></textarea>
          </div>

          <div class="form-group">
            <button type="button" class="btn btn-success" onclick="freply()">Comment</button>
          </div>

        </form>

        <br>
        <br>
        <br>`;

    steem.api.getContentReplies(author, permlink, function (err, result) {
      var reply_author_image;

      for (var i = 0; i < result.length; i++) {
        reply_author_image = "https://steemitimages.com/u/" + result[i].author + "/avatar";

        replies = replies + `<div class="alert alert-success" role="alert"><h5 class="alert-heading">@` + result[i].author + "</h5>" +
        "<p>" + DOMPurify.sanitize(marked(result[i].body)) + "</p></div><br>";

      }
      app.content = content + replies;
    });
  })
}

//Get Preveiw in Post page
function _preview() {
  $("#preview").html(DOMPurify.sanitize(marked($("#content").val())));
}

function vote() {

  const voter = app.username;

  var power = $("#power").val();
  Number(power);
  var weight = power * 100;

  var permlink = app.permlink
  var author = app.author;

  api.vote(voter, author, permlink, weight, function (err, res) {

    if (!err) {
      alert($("#power").val() + "%Voteに成功しました。")
    } else {
      alert("Error, please try again later")
    }

  });

}

// Get Preveiw in Post page
function freply() {

  var body = $("#reply").val();

  const title = '';
  const author = app.username;
  const permlink = Math.random()
    .toString(36)
    .substring(2);

  const jsonMetadata = '';

  api.comment(app.author, app.permlink, author, permlink, title, body, jsonMetadata, function (err, res) {
    if (!err) {
      alert("コメント送信を完了しました。")
    } else {
      alert("Error, please try again later")
    }
  });
}

/**
 * Get New recipe feed.
 */
function _getNewFeeds() {

  let query = {
    tag: 'steemovie',
    limit: 21,
  };

  steem.api.getDiscussionsByCreated(query, function (err, result) {
    app.feeds = result;

    // Rendering process of image image
    renderingImagePaths(result)
  });

}

/**
 * Get trend recipe feed.
 */
function _getTrendFeeds() {

  let query = {
    tag: 'steemovie',
    limit: 21,
  };

  steem.api.getDiscussionsByTrending(query, function (err, result) {
    app.trend_feeds = result;

    // Rendering process of image image
    trend_renderingImagePaths(result)
  });

}

function _getExplorer(searchTag) {

  let query = {
    tag: searchTag,
    limit: 22,
  };

  // TODO DB call : Implement the process here, such as calling the DB
  steem.api.getDiscussionsByCreated(query, function (err, result) {
    app.explorers = result;

    // Rendering process of image image
    explorer_renderingImagePaths(result)
  });
}

/**
 *  Rendering process of image image
 */
function renderingImagePaths(result) {

  let ipfs_image_paths = [];
  let result_image_paths = [];
  let author;
  let parsedStr;

  let displayPayout = [];
  let pending;
  let total;
  let curator;
  let payout;

  for (var i = 0; i < result.length; i++) {
    parsedStr = JSON.parse(result[i].json_metadata).image ? JSON.parse(result[i].json_metadata).image[0] : '';
    author = result[i].author;

    pending = result[i].pending_payout_value.slice(0,-4);
    total = result[i].total_payout_value.slice(0,-4);
    curator = result[i].curator_payout_value.slice(0,-4);

    payout = parseFloat(pending) + parseFloat(total) + parseFloat(curator);

    if (parsedStr.match(/ipfs.io/)) {
      ipfs_image_paths.push("https://steemitimages.com/640x0/" + parsedStr);
    } else {
      ipfs_image_paths.push(parsedStr);
    }

    result_image_paths.push("https://steemitimages.com/u/" + author + "/avatar");
    displayPayout.push(payout.toFixed(3));
  }

  //Article Image
  app.ipfs_image_paths = ipfs_image_paths;
  //Author Image
  app.result_image_paths = result_image_paths;
  app.displayPayout = displayPayout;
}

function trend_renderingImagePaths(result) {

  let trend_ipfs_image_paths = [];
  let trend_result_image_paths = [];
  let trend_author;
  let trend_parsedStr;

  let trend_displayPayout = [];
  let trend_pending;
  let trend_total;
  let trend_curator;
  let trend_payout;

  for (var i = 0; i < result.length; i++) {
    trend_parsedStr = JSON.parse(result[i].json_metadata).image ? JSON.parse(result[i].json_metadata).image[0] : '';
    trend_author = result[i].author;

    trend_pending = result[i].pending_payout_value.slice(0,-4);
    trend_total = result[i].total_payout_value.slice(0,-4);
    trend_curator = result[i].curator_payout_value.slice(0,-4);

    trend_payout = parseFloat(trend_pending) + parseFloat(trend_total) + parseFloat(trend_curator);

    if (trend_parsedStr.match(/ipfs.io/)) {
      trend_ipfs_image_paths.push("https://steemitimages.com/640x0/" + trend_parsedStr);
    } else {
      trend_ipfs_image_paths.push(trend_parsedStr);
    }

    trend_result_image_paths.push("https://steemitimages.com/u/" + trend_author + "/avatar");
    trend_displayPayout.push(trend_payout.toFixed(3));
  }

  //Article Image
  app.trend_ipfs_image_paths = trend_ipfs_image_paths;
  //Author Image
  app.trend_result_image_paths = trend_result_image_paths;
  app.trend_displayPayout = trend_displayPayout;
}

function explorer_renderingImagePaths(result) {

  let explorer_ipfs_image_paths = [];
  let explorer_parsedStr;

  let explorer_displayPayout = [];
  let explorer_pending;
  let explorer_total;
  let explorer_curator;
  let explorer_payout;

  for (var i = 0; i < result.length; i++) {
    explorer_parsedStr = JSON.parse(result[i].json_metadata).image ? JSON.parse(result[i].json_metadata).image[0] : '';

    explorer_pending = result[i].pending_payout_value.slice(0,-4);
    explorer_total = result[i].total_payout_value.slice(0,-4);
    explorer_curator = result[i].curator_payout_value.slice(0,-4);

    explorer_payout = parseFloat(explorer_pending) + parseFloat(explorer_total) + parseFloat(explorer_curator);


    if (explorer_parsedStr.match(/ipfs.io/)) {
      explorer_ipfs_image_paths.push("https://steemitimages.com/640x0/" + explorer_parsedStr);
    } else {
      explorer_ipfs_image_paths.push(explorer_parsedStr);
    }

    explorer_displayPayout.push(explorer_payout.toFixed(3));

  }

  app.explorer_ipfs_image_paths = explorer_ipfs_image_paths;
  app.explorer_displayPayout = explorer_displayPayout;
}

function mypage_renderingImagePaths(result) {

  let mypage_ipfs_image_paths = [];
  let mypage_parsedStr;

  let mypage_displayPayout = [];
  let mypage_pending;
  let mypage_total;
  let mypage_curator;
  let mypage_payout;

  for (var i = 0; i < result.length; i++) {
    mypage_parsedStr = JSON.parse(result[i].json_metadata).image ? JSON.parse(result[i].json_metadata).image[0] : '';

    mypage_pending = result[i].pending_payout_value.slice(0,-4);
    mypage_total = result[i].total_payout_value.slice(0,-4);
    mypage_curator = result[i].curator_payout_value.slice(0,-4);

    mypage_payout = parseFloat(mypage_pending) + parseFloat(mypage_total) + parseFloat(mypage_curator);


    if (mypage_parsedStr.match(/ipfs.io/)) {
      mypage_ipfs_image_paths.push("https://steemitimages.com/640x0/" + mypage_parsedStr);
    } else {
      mypage_ipfs_image_paths.push(mypage_parsedStr);
    }

    mypage_displayPayout.push(mypage_payout.toFixed(3));

  }

  app.mypage_ipfs_image_paths = mypage_ipfs_image_paths;
  app.mypage_displayPayout = mypage_displayPayout;
}

/**
 *  If the image is linkbroken, replace it with the default image.
 */
function imgError(image) {
  image.onerror = "";
  image.src = "https://cdn.steemitimages.com/DQmd3JqPHAdnW2w2VNbtnP6kD6A6Eg99SuBmBZCTi5KigYa/movie-918655_1920.jpg";
  return true;
}

var app = new Vue({
  el: '#app',
  data: {
    link: "",
    login: false,
    permlink: "",
    author: "",
    username: "",
    content: "",
    feeds: [],
    trend_feeds: [],
    trend_ipfs_image_paths: [],
    trend_result_image_paths: [],
    trend_displayPayout: [],
    explorers: [],
    explorer_ipfs_image_paths: [],
    explorer_result_image_paths: [],
    explorer_displayPayout: [],
    mypages: [],
    currentPage: 'feed',
    steem_user_path: "",
    steem_user_image_path: "",
    ipfs_image_paths: [],
    mypage_ipfs_image_paths: [],
    result_image_paths: [],
    displayPayout: [],
    mypage_displayPayout: [],
    searchString: '',
  },
  methods: {
    transPage: function (page, permlink, author) {
                    if (page == "logout") {
                        window.location.href = window.location.href.split("?")[0];
                        app.username = null;
                        localStorage.removeItem('sc_token');
                        localStorage.removeItem('username');
                    } else {
                        this.content = ""
                        this.currentPage = page;
                        if (permlink != undefined) {
                            _content(permlink, author)
                        }
                    }
                },

    netflix: function () {
      searchTag = "steemovie-netflix";
      _getExplorer(searchTag);
    },

    prime: function () {
      searchTag = "steemovie-primevideo";
      _getExplorer(searchTag);
    },

    hulu: function () {
      searchTag = "steemovie-hulu";
      _getExplorer(searchTag);
    },

    theater: function () {
      searchTag = "steemovie-theater";
      _getExplorer(searchTag);
    },

    youtube: function () {
      searchTag = "steemovie-youtube";
      _getExplorer(searchTag);
    },

    other: function () {
      searchTag = "steemovie-other";
      _getExplorer(searchTag);
    },

    comment: function comment() {

      const author = this.username;
      const permlink = Math.random()
        .toString(36)
        .substring(2);

      let titlecheck = $("#title").val();
      let title = '';

      if(titlecheck) {
        title = titlecheck;
      } else {
        title = 'Steemovie';
      }

      const tags = $("#tags").val();
      const where = $("#where").val();
      const displaywhere = $("#where").val().slice(10).toUpperCase();
      const rating = $("#rating").val();
      const top = "![topimage](" + topimage[0] + ")";
      const body = "**[Movie Title]**" + "\n\n" + $("#mtitle").val() + "\n\n" + "**[Where]**" + "\n\n" + displaywhere + "\n\n" + "**[Rating]**" + "\n\n" + rating + "\n\n" + "**[Review]**" + "\n\n" + $("#content").val() + "\n\n" + "[![steemovie.png](https://cdn.steemitimages.com/DQmbXyfDKK5Art8rXJc1E9y7bDAoQZ3mmozeuC7ppcSLiTV/steemovie.png)](https://www.steemovie.site)";

      const taglist = tags.split(' ');
      taglist.unshift(where)
      taglist.unshift(STEEMOVIE)

      const jsonMetadata = {tags: taglist, image: [topimage[0]]};
      const parent_author = '';
      const parent_permlink = taglist[0];

      //Actual post
      _comment(parent_author, parent_permlink, author, permlink, title, body, jsonMetadata);

    },

    preview: function preview() {
      _preview();
    }
  },

  mounted() {

  },

})

//Login
app.link = api.getLoginURL();

app.username = new URLSearchParams(document.location.search).get('username') || localStorage.getItem('username');
var access_token = new URLSearchParams(document.location.search).get('access_token') || localStorage.getItem('sc_token');

// User Info
app.steem_user_path = STEEM_URL + '@' + app.username;
app.steem_user_image_path = `https://steemitimages.com/u/` + app.username + `/avatar`;

if (access_token) {
  app.login = true;

  api.setAccessToken(access_token);

  api.me(function (err, result) {

    localStorage.setItem('sc_token', access_token);
    localStorage.setItem('username', app.username);

    if (new URLSearchParams(document.location.search).get('access_token')) {

     window.location.href = window.location.href.split("?")[0];

   }

  });

  var query = {
      tag: app.username,
      limit: 22,
  };


  steem.api.getDiscussionsByBlog(query, function (err, result) {

      var mypages = [];

      for (var i = 0; i < result.length; i++) {
          var json = JSON.parse(result[i].json_metadata);

          mypages.push(result[i]);

          mypage_renderingImagePaths(result)
          app.mypages = mypages;

      }
  });
  }

  _getNewFeeds();
  _getTrendFeeds();
  _getExplorer('steemovie-netflix');
