var sprintf = require('sprintf').sprintf;
var GitHubApi = require('github4');

var github = null;

var GITHUB_USER = process.env.TRESLEK_GITHUB_USER;
var GITHUB_TOKEN = process.env.TRESLEK_GITHUB_TOKEN;

var Github = function() {
  this.commands = ['issue', 'issue-search'];
  this.auto = ['load'];
};

Github.prototype._parseMsg = function(msg) {
  var msgParts = msg.split(' '),
      userRepo = msgParts[0].split('/'),
      realMsg = msg.slice(msgParts[0].length, msg.length);

  return {
    user: userRepo[0],
    repo: userRepo[1],
    msg: realMsg
  };
};

// Borrowed from https://github.com/jjbuchan/treslek-gh-issue-search/blob/master/index.js
Github.prototype['issue-search'] = function(bot, to, from, msg, callback) {
  var parsedMsg = this._parseMsg(msg);

  if (!parsedMsg.user || !parsedMsg.repo) {
    bot.say(to, 'You must provide a user and repo to create an issue on.');
    callback();
    return;
  }

  github.search.issues({
    q: sprintf('repo:%s/%s+%s', parsedMsg.user, parsedMsg.repo, parsedMsg.msg)
  }, function(err, results) {
    if (err) {
      bot.say(to, 'Unable to perform search.');
      callback();
      return;
    }

    var totalCount = 0,
        issueTitles = [],
        outMsg = '';

    totalCount = results.total_count;

    if (totalCount) {
      results.items.forEach(function(item) {
        issueTitles.push({
          title:item.title,
          url: item.html_url
        });
      });

      outMsg = sprintf('%d issues found:', totalCount);
      issueTitles.forEach(function(item) {
        outMsg += sprintf('\n - %s: %s', item.title, item.url);
      });
    } else {
      outMsg = 'No issues were found for search: ' + msg;
    }

    if (totalCount > 5) {
      bot.say(from, outMsg);
    } else {
      bot.say(to, outMsg);
    }
    callback();
  });
};

Github.prototype.issue = function(bot, to, from, msg, callback) {
  function parseIssue(issue) {
    var maxLength = 80,
        maxTitle = issue.slice(0, maxLength),
        trimmedTitleLength = Math.min(maxTitle.length, maxTitle.lastIndexOf(' ')),
        title = maxTitle.slice(0, trimmedTitleLength),
        body = issue.slice(trimmedTitleLength, issue.length);

    return {
      title: title,
      body: body
    };
  }

  var parsedMsg = this._parseMsg(msg);

  if (!parsedMsg.user || !parsedMsg.repo) {
    bot.say(to, 'You must provide a user and repo to create an issue on.');
    callback();
    return;
  }

  var titleBody = {};
  var tbMsg = parsedMsg.msg;
  if (tbMsg.length < 80) {
    titleBody.title = tbMsg;
    titleBody.body = '';
  } else {
    titleBody = parseIssue(tbMsg);
  }
  github.issues.create({
    user: userRepo[0],
    repo: userRepo[1],
    title: titleBody.title,
    body: titleBody.body
  }, function (err, res) {
    if (err) {
      bot.say(to, 'Unable to create issue.');
      callback();
      return;
    }

    bot.say(to, 'Successfully created issue at ' + res.html_url);
    callback();
    return;
  });
};

Github.prototype.load = function(bot) {
  if (!github) {
    github = new GitHubApi({
      version: "3.0.0",
      debug: true,
      protocol: "https",
      host: "api.github.com",
      pathPrefix: "",
      timeout: 5000,
      headers: {
        "user-agent": "treslek-github"
      }
    });
    github.authenticate({
      type: "basic",
      username: GITHUB_USER,
      password: GITHUB_TOKEN
    });
  }
};

exports.Plugin = Github;
