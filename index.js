var sprintf = require('sprintf').sprintf;
var GitHubApi = require('github4');

var github = null;

var GITHUB_USER = process.env.TRESLEK_GITHUB_USER;
var GITHUB_TOKEN = process.env.TRESLEK_GITHUB_TOKEN;

var Github = function() {
  this.commands = ['issue'];
  this.auto = ['load'];
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

  var msgParts = msg.split(' ');
  var userRepo = msgParts[0].split('/');

  if (userRepo.length !== 2) {
    bot.say(to, 'You must provide a user and repo to create an issue on.');
    callback();
    return;
  }

  var titleBody = {};
  var tbMsg = msg.slice(msgParts[0].length, msg.length);
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
