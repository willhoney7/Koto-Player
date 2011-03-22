function PrefsAssistant() {
	scene_helpers.addCommonSceneMethods(this, "prefs");
}

PrefsAssistant.prototype.aboutToActivate = function(callback){
	callback.defer();
}

PrefsAssistant.prototype.setup = function() {
	this.setupCommon();
	this.controller.getSceneScroller().mojo.revealTop(0);
	
	this.controller.setupWidget("auto-resume-nowPlaying", {}, this.autoResumeNowPlaying = {value: m.prefs.saveAndResume});
	this.controller.listen("auto-resume-nowPlaying", Mojo.Event.propertyChange, this.handleAutoResumeNowPlaying = function(event){
		m.prefs.saveAndResume = event.value;
		m.storePrefs();
	}.bind(this));
	
	this.controller.setupWidget("default-repeat-mode", 
		{
			label: $L('Default Repeat Mode'),
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			multiline: true,
			choices: [
				{label: "No Repeat", value: 0},
				{label: "Repeat Once", value: 1},
				{label: "Repeat", value: 2}
			]
		},
		{value: m.prefs.defaultRepeat}
	);
	this.controller.listen("default-repeat-mode", Mojo.Event.propertyChange, this.handleRepeatModeChange = function(event){
		m.prefs.defaultRepeat = event.value;
		m.storePrefs();
	}.bind(this));
	
	this.controller.setupWidget("number-of-album-art-scroller", 
		{
			label: $L('Max Number of Songs in Album Art Preview'),
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			multiline: true,
			choices: [
				{label: "30", value: 15},
				{label: "50", value: 25},
				{label: "80", value: 40},
				{label: "100", value: 50},
				{label: "150", value: 75},
			]
		},
		{value: m.prefs.albumArtScrollerNum}
	);
	this.controller.listen("number-of-album-art-scroller", Mojo.Event.propertyChange, this.handleAlbumArtScrollerNum = function(event){
		m.prefs.albumArtScrollerNum = event.value;
		m.storePrefs();
	}.bind(this));
	
	this.controller.setupWidget("marquee-toggle", {}, this.marqueeText = {value: m.prefs.marqueeText});
	this.controller.listen("marquee-toggle", Mojo.Event.propertyChange, this.handleMarqueeText = function(event){
		m.prefs.marqueeText = event.value;
		m.storePrefs();
	}.bind(this));
	
	this.controller.setupWidget("truncate-toggle", {}, this.truncateText = {value: m.prefs.truncateText});
	this.controller.listen("truncate-toggle", Mojo.Event.propertyChange, this.handleTruncateText = function(event){
		m.prefs.truncateText = event.value;
		m.storePrefs();
	}.bind(this));
	
	this.controller.setupWidget("close-dashboard-toggle", {}, this.closeDashboard = {value: m.prefs.closeDashboard});
	this.controller.listen("close-dashboard-toggle", Mojo.Event.propertyChange, this.handleMarqueeText = function(event){
		m.prefs.closeDashboard = event.value;
		m.storePrefs();
	}.bind(this));
	
	this.controller.setupWidget("use-dashboard-toggle", {}, this.useDashboard = {value: m.prefs.useDashboard});
	this.controller.listen("use-dashboard-toggle", Mojo.Event.propertyChange, this.handleMarqueeText = function(event){
		m.prefs.useDashboard = event.value;
		m.storePrefs();
	}.bind(this));
	
	this.controller.setupWidget("playlist-tap-selector", 
		{
			label: $L('Tapping a Playlist'),
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			multiline: true,
			choices: [
				{label: "Views Songs", value: "view"},
				{label: "Plays Songs", value: "play"}
			]
		},
		{value: m.prefs.playlistTap}
	);
	this.controller.listen("playlist-tap-selector", Mojo.Event.propertyChange, this.handlePlaylistTapSelector = function(event){
		m.prefs.playlistTap = event.value;
		m.storePrefs();
	}.bind(this));
	
	this.controller.setupWidget("favorite-tap-selector", 
		{
			label: $L('Tapping a Favorite'),
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			multiline: true,
			choices: [
				{label: "Views Songs", value: "view"},
				{label: "Plays Songs", value: "play"}
			]
		},
		{value: m.prefs.favoriteTap}
	);
	this.controller.listen("favorite-tap-selector", Mojo.Event.propertyChange, this.handleFavoriteTapSelector = function(event){
		m.prefs.favoriteTap = event.value;
		m.storePrefs();
	}.bind(this));
	
	this.controller.setupWidget("metrixToggleWidget", {}, this.metrixToggle = {value: m.prefs.metrixToggle});
		this.controller.listen("metrixToggleWidget", Mojo.Event.propertyChange, this.handleMetrixToggle = function(event){
			m.prefs.metrixToggle = event.value;
			m.storePrefs();
		}.bind(this));
	
	/*
	 *	Last.fm
	 */
	this.controller.setupWidget("lastfm-toggle", {}, {value: m.prefs.lastfm.scrobble});
	this.controller.listen("lastfm-toggle", Mojo.Event.propertyChange, this.handleLastFMToggle = function(event){
		m.prefs.lastfm.scrobble = event.value;
		m.storePrefs();
	}.bind(this));
	this.controller.setupWidget("lastfm-username", {hintText: "Username", autoFocus: false, textCase: Mojo.Widget.steModeLowerCase}, {value: ""});
	this.controller.setupWidget("lastfm-password", {hintText: "Password", autoFocus: false}, {value: ""});
	if(m.prefs.lastfm.sessionKey !== ""){
		this.controller.get("not-logged-in").hide();
		this.controller.get("username").innerHTML = m.prefs.lastfm.username;
		this.controller.get("logged-in").show();
	}
	this.controller.listen("log-in", Mojo.Event.tap, this.handleLogIn = function(event){
		lastfm.getAuth(this.controller.get("lastfm-username").mojo.getValue(), this.controller.get("lastfm-password").mojo.getValue(),
			function(){
				this.controller.get("not-logged-in").hide();
				this.controller.get("username").innerHTML = m.prefs.lastfm.username;
				this.controller.get("logged-in").show();
			}.bind(this)
		);
	}.bind(this));	
	this.controller.listen("log-out", Mojo.Event.tap, this.handleLogOut = function(event){
		m.prefs.lastfm = {username: "", sessionKey: "", scrobble: true};
		m.storePrefs();
		this.controller.get("logged-in").hide();
		this.controller.get("username").innerHTML = "";
		this.controller.get("lastfm-username").mojo.setValue("");
		this.controller.get("lastfm-password").mojo.setValue("");
		this.controller.get("not-logged-in").show();
	}.bind(this));
	
	/*
	 *	Twitter
	 */
	this.controller.setupWidget("twitter-username", {hintText: "Username", autoFocus: false, textCase: Mojo.Widget.steModeLowerCase}, {value: ""});
	this.controller.setupWidget("twitter-password", {hintText: "Password", autoFocus: false}, {value: ""});
	if(m.prefs.twitter.authorized === true){
		this.controller.get("twitter-not-logged-in").hide();
		this.controller.get("twitter-logged-in-username").innerHTML = m.prefs.twitter.username;
		this.controller.get("twitter-logged-in").show();
	}
	this.controller.listen("twitter-log-in", Mojo.Event.tap, this.handleTwitterLogIn = function(event){
		Twitter.authorize(this.controller.get("twitter-username").mojo.getValue(), this.controller.get("twitter-password").mojo.getValue(),
		  function(response){
			if(response !== false) {
				m.prefs.twitter.authorized = true;
				m.prefs.twitter.username = response.username;
				m.prefs.twitter.token = response.token;
				m.prefs.twitter.secret = response.secret;
				//save credentials
				
				this.controller.get("twitter-not-logged-in").hide();
				this.controller.get("twitter-logged-in-username").innerHTML = m.prefs.twitter.username;
				this.controller.get("twitter-logged-in").show();
				
				this.controller.showAlertDialog({
					onChoose: function(value) {
						if(value){
							Twitter.followMe();
						}
					}.bind(this),
					title: $L("Follow Us!"),
					message: $L("Would you like to follow Koto_Player for app updates?"),
					choices:[
						{label:$L('Yes!'), value: true, type:'primary'},  
						{label:$L("No thanks."), value: false, type:'dismiss'}    
					]
				}); 
			} else {
				m.prefs.twitter = {            
					username: '',
					authorized: false,
					token: '',
					secret: ''
				};
				m.bannerError('Invalid login credentials')
			}
		  }.bind(this)
		);
	}.bind(this));	
	this.controller.listen("twitter-log-out", Mojo.Event.tap, this.handleTwitterLogOut = function(event){
		Twitter.logout()
		m.prefs.twitter = {username: "", authorized: false, username: "", token: "", secret: ""};
		m.storePrefs();
		this.controller.get("twitter-logged-in").hide();
		this.controller.get("twitter-logged-in-username").innerHTML = "";
		this.controller.get("twitter-username").mojo.setValue("");
		this.controller.get("twitter-password").mojo.setValue("");
		this.controller.get("twitter-not-logged-in").show();
	}.bind(this));
	
	
	/*
	 *	Dropbox 
	 */
	/*this.controller.setupWidget("dropbox-username", {hintText: "Email/Username", autoFocus: false}, {value: ""});
	this.controller.setupWidget("dropbox-password", {hintText: "Password", autoFocus: false}, {value: ""});
	if(m.prefs.dropbox.token !== ""){
		this.controller.get("dropbox-not-logged-in").hide();
		this.controller.get("dropbox-logged-in-username").innerHTML = m.prefs.dropbox.displayName;
		this.controller.get("dropbox-logged-in").show();
	}
	this.controller.listen("dropbox-log-in", Mojo.Event.tap, this.handleDropboxLogIn = function(event){
		dropbox.authorize(this.controller.get("dropbox-username").mojo.getValue(), this.controller.get("dropbox-password").mojo.getValue(),
		  function(response){
			if(response && !response.error) {
				m.prefs.dropbox.displayName = response.displayName;
				m.prefs.dropbox.token = response.token;
				m.prefs.dropbox.secret = response.secret;
				//save credentials
				
				this.controller.get("dropbox-not-logged-in").hide();
				this.controller.get("dropbox-logged-in-username").innerHTML = m.prefs.dropbox.displayName;
				this.controller.get("dropbox-logged-in").show();
				
			} else {
				m.prefs.dropbox = {            
					displayName: '',
					token: '',
					secret: ''
				};
				bannerError('Invalid login credentials or there was a problem communicating with Dropbox.')
			}
		  }.bind(this)
		);
	}.bind(this));	
	this.controller.listen("dropbox-log-out", Mojo.Event.tap, this.handleDropboxLogOut = function(event){
		m.prefs.dropbox = {            
			displayName: '',
			token: '',
			secret: ''
		};		
		m.storePrefs();
		this.controller.get("dropbox-logged-in").hide();
		this.controller.get("dropbox-logged-in-username").innerHTML = "";
		this.controller.get("dropbox-username").mojo.setValue("");
		this.controller.get("dropbox-password").mojo.setValue("");
		this.controller.get("dropbox-not-logged-in").show();
	}.bind(this));*/
	
	/*Prefs:
		Playing Songs goes to player, or stays
		Ignore A, An, and The on ordering.
		DBsearch listtap shuffles, or plays in order
		Resume on launch
	*/
};

PrefsAssistant.prototype.activate = function(event) {
	this.controller.getSceneScroller().mojo.revealTop(0);
};

PrefsAssistant.prototype.deactivate = function(event) {
	m.storePrefs();
};

PrefsAssistant.prototype.cleanup = function(event) {
	this.controller.stopListening("auto-resume-nowPlaying", Mojo.Event.propertyChange, this.handleAutoResumeNowPlaying);
	this.controller.stopListening("default-repeat-mode", Mojo.Event.propertyChange, this.handleRepeatModeChange);
	this.controller.stopListening("marquee-toggle", Mojo.Event.propertyChange, this.handleMarqueeText);

	this.controller.stopListening("lastfm-toggle", Mojo.Event.propertyChange, this.handleLastFMToggle);
	this.controller.stopListening("log-in", Mojo.Event.tap, this.handleLogIn);	
	this.controller.stopListening("log-out", Mojo.Event.tap, this.handleLogOut);

	this.controller.stopListening("twitter-log-in", Mojo.Event.tap, this.handleTwitterLogIn);	
	this.controller.stopListening("twitter-log-out", Mojo.Event.tap, this.handleTwitterLogOut);
};