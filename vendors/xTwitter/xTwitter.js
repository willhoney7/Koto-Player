/*
 * The MIT License

 * Copyright (c) 2011 Joshua Spohr

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*/

function xTwitter(appKeys, userKeys) {
	/*
	Name: xTwitter for webOS
	Author: Joshua Spohr (dawm) / Biocandy Labs
	Email: josh.spohr@biocandy.com
	Twitter: @dawm / @biocandy
	GitHub: https://github.com/dawm/xTwitter
	Version: 1.0.5
	*/

	// OAuth / xAuth
	this.auth_url = "https://api.twitter.com/oauth/access_token";
	// Tweet
	this.update_url = "https://api.twitter.com/1/statuses/update.json";
	// Follow
	this.follow_url = "http://api.twitter.com/1/friendships/create.json";
	// Unfollow
	this.unfollow_url = "http://api.twitter.com/1/friendships/destroy.json";

	if (appKeys.consumerKey === undefined || appKeys.consumerKey === "") { Mojo.Log.error('###xTwitter - ERROR NO CONSUMER KEY! (appkeys)'); return false; }
	if (appKeys.consumerSecret === undefined || appKeys.consumerSecret === "") { Mojo.Log.error('###xTwitter - ERROR NO CONSUMER SECRET! (appkeys)'); return false; }

	this.isLoaded = true;

	this.options = {
		consumerKey: appKeys.consumerKey,
		consumerSecret: appKeys.consumerSecret,

		token: (userKeys && userKeys.token !== undefined) ? userKeys.token : null,
		tokenSecret: (userKeys && userKeys.secret !== undefined) ? userKeys.secret : null
	};

	this.username = (userKeys && userKeys.username !== undefined) ? userKeys.username : null;
	this.isAuthorized = (userKeys && userKeys.authorized !== undefined) ? userKeys.authorized : false;
	Mojo.Log.info('###xTwitter - Loaded!');
}
xTwitter.prototype.authorize = function(username, password, callback) {
	if (username === undefined) {
		Mojo.Log.error('###xTwitter - cannot authorize without a username.');
		if (callback !== undefined) {
			callback(false);
		}
	}
	if (password === undefined) {
		Mojo.Log.error('###xTwitter - cannot authorize without a password.');
		if (callback !== undefined) {
			callback(false);
		}
	}

	this.logout();
	this.username = username;

	// Fill in xAuth parameters
	var parameters = {
		'x_auth_username': username,
		'x_auth_password': password,
		'x_auth_mode': 'client_auth'
	};

	var authParameters = OAuth.formEncode(parameters);

	// Sign the request
	OAuth.completeRequest({
		method: 'post',
		action: this.auth_url,
		parameters: parameters
	}, this.options);

	var req = new Ajax.Request(this.auth_url,{
		method: 'post',
		evalJSON: 'force',
		postBody: authParameters,
		encoding: 'UTF-8',
		contentType: 'application/x-www-form-urlencoded',
		requestHeaders:['Authorization', OAuth.getAuthorizationHeader('',parameters)],
		onSuccess: function(response) {
			var results = OAuth.decodeForm(response.responseText);
			Mojo.Log.info('###xTwitter OAuth/xAuth Successful');

			this.username = OAuth.getParameter(results, 'screen_name');
			this.options.token =  OAuth.getParameter(results, 'oauth_token');
			this.options.tokenSecret = OAuth.getParameter(results, 'oauth_token_secret');
			this.isAuthorized = true;

			// Return the user keys (username, token, secret, authorized)
			if (callback !== undefined) {
				callback({
					username: this.username,
					token: this.options.token,
					secret: this.options.tokenSecret,
					authorized: true
				});
			}
			return true;
		}.bind(this),
		onFailure: function(response) {
			var results = OAuth.decodeForm(response.responseText);
			Mojo.Log.error('###xTwitter OAuth/xAuth Failed : '+results);

			if (callback !== undefined) {
				callback(false);
			}
			return false;
		}.bind(this)
	});
};
xTwitter.prototype.logout = function(name) {
	this.username = null;

	this.options.token = null;
	this.options.tokenSecret = null;
	this.isAuthorized = false;
};
xTwitter.prototype.tweet = function(parameters, callback) {

	// Thanks Will Honey (Tibfib) for the suggestion of checking the variable for its type
	// If parameters is a string we build our parameters object using the string as the status
	// If parameters is an object we do nothing and let Twitter complain
	if (parameters !== undefined && (typeof(parameters) === 'object' || typeof(parameters) === 'string')) {

		if (typeof(parameters) === 'string') {
			parameters = { status: parameters };
		}

		// A full list of parameters can be found here -> http://dev.twitter.com/doc/post/statuses/update
		var tweetParameters = OAuth.formEncode(parameters);

		// Sign the request
		OAuth.completeRequest({
			method: 'post',
			action: this.update_url,
			parameters: parameters
		}, this.options);

		var req = new Ajax.Request(this.update_url,{
			method: 'post',
			evalJSON: 'force',
			postBody: tweetParameters,
			encoding: 'UTF-8',
			contentType: 'application/x-www-form-urlencoded',
			requestHeaders:['Authorization', OAuth.getAuthorizationHeader('',parameters)],
			onSuccess: function(response) {
				var results = response.responseText.evalJSON(true);
				Mojo.Log.info('###xTwitter Tweet Successful : Tweet ID = '+results.id_str);

				if (callback !== undefined) {
					callback(true);
				}
				return true;
			}.bind(this),
			onFailure: function(response) {
				var results = response.responseText.evalJSON(true);
				Mojo.Log.error('###xTwitter Tweet Failed : Error: '+results.error);

				if (callback !== undefined) {
					callback(false);
				}
				return false;
			}.bind(this)
		});
	}
	else { return false; }
};
xTwitter.prototype.follow = function(parameters, callback) {

	if (parameters !== undefined && (typeof(parameters) === 'object' || typeof(parameters) === 'string')) {

		if (typeof(parameters) === 'string') {
			parameters = { screen_name: parameters };
		}

		// A full list of parameters can be found here -> http://dev.twitter.com/doc/post/friendships/create
		var followParameters = OAuth.formEncode(parameters);

		// Sign the request
		OAuth.completeRequest({
			method: 'post',
			action: this.follow_url,
			parameters: parameters
		}, this.options);

		var req = new Ajax.Request(this.follow_url,{
			method: 'post',
			evalJSON: 'force',
			postBody: followParameters,
			encoding: 'UTF-8',
			contentType: 'application/x-www-form-urlencoded',
			requestHeaders:['Authorization', OAuth.getAuthorizationHeader('',parameters)],
			onSuccess: function(response) {
				var results = response.responseText.evalJSON(true);
				Mojo.Log.info('###xTwitter Follow Successful');

				if (callback !== undefined) {
					callback(results);
				}
				return true;
			}.bind(this),
			onFailure: function(response) {
				var results = response.responseText.evalJSON(true);
				Mojo.Log.error('###xTwitter Follow Failed : Error: '+results.error);

				if (callback !== undefined) {
					callback(results);
				}
				return false;
			}.bind(this)
		});
	}
	else { return false; }
};
xTwitter.prototype.unfollow = function(parameters, callback) {

	if (parameters !== undefined && (typeof(parameters) === 'object' || typeof(parameters) === 'string')) {

		if (typeof(parameters) === 'string') {
			parameters = { screen_name: parameters };
		}
		
		// A full list of parameters can be found here -> http://dev.twitter.com/doc/post/friendships/destroy
		var unfollowParameters = OAuth.formEncode(parameters);

		// Sign the request
		OAuth.completeRequest({
			method: 'post',
			action: this.unfollow_url,
			parameters: parameters
		}, this.options);

		var req = new Ajax.Request(this.unfollow_url,{
			method: 'post',
			evalJSON: 'force',
			postBody: unfollowParameters,
			encoding: 'UTF-8',
			contentType: 'application/x-www-form-urlencoded',
			requestHeaders:['Authorization', OAuth.getAuthorizationHeader('',parameters)],
			onSuccess: function(response) {
				var results = response.responseText.evalJSON(true);
				Mojo.Log.info('###xTwitter Unfollow Successful');

				if (callback !== undefined) {
					callback(results);
				}
				return true;
			}.bind(this),
			onFailure: function(response) {
				var results = response.responseText.evalJSON(true);
				Mojo.Log.error('###xTwitter Unfollow Failed : Error = '+results.error);

				if (callback !== undefined) {
					callback(results);
				}
				return false;
			}.bind(this)
		});
	}
	else { return false; }
};
//My own function, not dawm's
xTwitter.prototype.generateTweet = function(){
	currentSong = koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index];
	var tweet = "#NowPlaying " + currentSong.title;
	if (currentSong.artist !== ""){
		tweet += " by " + currentSong.artist;
	}
	if (tweet.length > 112){
		tweet = tweet.truncate(112, ' [...]');
	}
	var suffix = " via @Koto_Player for webOS!";
	this.tweet(tweet + suffix, function(returnValue){
		if (returnValue){
			koto.utilities.bannerAlert("Song Tweeted!");
		} else {
			koto.utilities.bannerError("Failed to Tweet");		
		}
	});
}

