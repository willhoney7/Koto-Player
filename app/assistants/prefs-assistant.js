function PrefsAssistant() {
	scene_helpers.addCommonSceneMethods(this, "prefs");
}

PrefsAssistant.prototype.aboutToActivate = function(callback){
	callback.defer();
}

PrefsAssistant.prototype.setup = function() {
	this.setupCommon();
	this.controller.getSceneScroller().mojo.revealTop(0);
	
	this.controller.setupWidget("theme", 
		{
			label: $L('Theme'),
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			multiline: true,
			choices: [
				{label: $L("Blue"), value: "blue"},
				{label: $L("Black"), value: "black"},
				{label: $L("Green"), value: "green"},
				{label: $L("Red"), value: "red"},
				{label: $L("Purple"), value: "purple"},
				//{label: $L("Turquoise"), value: "turquoise"},
			]
		},
		{value: koto.preferences.obj.theme}
	);
	
	this.controller.listen("theme", Mojo.Event.propertyChange, this.handleThemeChange = function(event){
		this.controller.stageController.unloadStylesheet("stylesheets/" + koto.preferences.obj.theme + ".css");
		koto.preferences.obj.theme = event.value;
		koto.preferences.store();
		this.controller.stageController.loadStylesheet("stylesheets/" + koto.preferences.obj.theme + ".css");
	}.bind(this));
	
	this.controller.setupWidget("auto-resume-nowPlaying", {}, this.autoResumeNowPlaying = {value: koto.preferences.obj.saveAndResume});
	this.controller.listen("auto-resume-nowPlaying", Mojo.Event.propertyChange, this.handleAutoResumeNowPlaying = function(event){
		koto.preferences.obj.saveAndResume = event.value;
		koto.preferences.store();
	}.bind(this));
	
	this.controller.setupWidget("default-repeat-mode", 
		{
			label: $L('Default Repeat Mode'),
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			multiline: true,
			choices: [
				{label: $L("No Repeat"), value: 0},
				{label: $L("Repeat Once"), value: 1},
				{label: $L("Repeat"), value: 2}
			]
		},
		{value: koto.preferences.obj.defaultRepeat}
	);
	this.controller.listen("default-repeat-mode", Mojo.Event.propertyChange, this.handleRepeatModeChange = function(event){
		koto.preferences.obj.defaultRepeat = event.value;
		koto.preferences.store();
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
		{value: koto.preferences.obj.albumArtScrollerNum}
	);
	this.controller.listen("number-of-album-art-scroller", Mojo.Event.propertyChange, this.handleAlbumArtScrollerNum = function(event){
		koto.preferences.obj.albumArtScrollerNum = event.value;
		koto.preferences.store();
	}.bind(this));
	
	this.controller.setupWidget("marquee-toggle", {}, this.marqueeText = {value: koto.preferences.obj.marqueeText});
	this.controller.listen("marquee-toggle", Mojo.Event.propertyChange, this.handleMarqueeText = function(event){
		koto.preferences.obj.marqueeText = event.value;
		koto.preferences.store();
	}.bind(this));
	
	this.controller.setupWidget("alphaScroller-toggle", {}, this.alphaScroller = {value: koto.preferences.obj.alphaScroller});
	this.controller.listen("alphaScroller-toggle", Mojo.Event.propertyChange, this.handleAlphaScroller = function(event){
		koto.preferences.obj.alphaScroller = event.value;
		koto.preferences.store();
	}.bind(this));
	
	this.controller.setupWidget("truncate-toggle", {}, this.truncateText = {value: koto.preferences.obj.truncateText});
	this.controller.listen("truncate-toggle", Mojo.Event.propertyChange, this.handleTruncateText = function(event){
		koto.preferences.obj.truncateText = event.value;
		koto.preferences.store();
	}.bind(this));
	
	this.controller.setupWidget("filter-tap-selector", 
		{
			label: $L('Tapping a Filtered Song'),
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			multiline: true,
			choices: [
				{label: $L("Plays All Songs"), value: "all"},
				{label: $L("Plays Filtered Songs"), value: "filtered"}
			]
		},
		{value: koto.preferences.obj.filterTap}
	);
	this.controller.listen("filter-tap-selector", Mojo.Event.propertyChange, this.handleFilteredTapSelector = function(event){
		koto.preferences.obj.filterTap = event.value;
		koto.preferences.store();
	}.bind(this));
	
	
	this.controller.setupWidget("playlist-tap-selector", 
		{
			label: $L('Tapping a Playlist'),
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			multiline: true,
			choices: [
				{label: $L("Views Songs"), value: "view"},
				{label: $L("Plays Songs"), value: "play"}
			]
		},
		{value: koto.preferences.obj.playlistTap}
	);
	this.controller.listen("playlist-tap-selector", Mojo.Event.propertyChange, this.handlePlaylistTapSelector = function(event){
		koto.preferences.obj.playlistTap = event.value;
		koto.preferences.store();
	}.bind(this));
	
	this.controller.setupWidget("favorite-tap-selector", 
		{
			label: $L('Tapping a Favorite'),
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			multiline: true,
			choices: [
				{label: $L("Views Songs"), value: "view"},
				{label: $L("Plays Songs"), value: "play"}
			]
		},
		{value: koto.preferences.obj.favoriteTap}
	);
	this.controller.listen("favorite-tap-selector", Mojo.Event.propertyChange, this.handleFavoriteTapSelector = function(event){
		koto.preferences.obj.favoriteTap = event.value;
		koto.preferences.store();
	}.bind(this));
	
	
	this.controller.setupWidget("close-dashboard-toggle", {}, this.closeDashboard = {value: koto.preferences.obj.closeDashboard});
	this.controller.listen("close-dashboard-toggle", Mojo.Event.propertyChange, this.handleMarqueeText = function(event){
		koto.preferences.obj.closeDashboard = event.value;
		koto.preferences.store();
	}.bind(this));
	
	this.controller.setupWidget("use-dashboard-toggle", {}, this.useDashboard = {value: koto.preferences.obj.useDashboard});
	this.controller.listen("use-dashboard-toggle", Mojo.Event.propertyChange, this.handleMarqueeText = function(event){
		koto.preferences.obj.useDashboard = event.value;
		koto.preferences.store();
	}.bind(this));
	
	
	this.controller.setupWidget("indexSongsByAlbum", {trueLabel: $L("Yes"), falseLabel: $L("No")}, {value: koto.preferences.obj.indexSongsByAlbum});
	this.controller.listen("indexSongsByAlbum", Mojo.Event.propertyChange, this.handleMarqueeText = function(event){
		koto.preferences.obj.indexSongsByAlbum = event.value;
		koto.preferences.store();
		
		this.controller.showAlertDialog({
			onChoose: function(value) {
				if (value){
					koto.justType.setupIndexingDashboard();
				}
			}.bind(this),
			title: $L("Re-Index Songs"),
			message: $L("For you changes to be in effect, you must re-index your songs."),
			choices:[
				{label:$L('Yes'), value: true, type:'primary'},  
				{label:$L("Not at this time"), value: false, type:'dismiss'}    
			]
		}); 
		//popup todo
	}.bind(this));
	
	
	this.controller.setupWidget("metrixToggleWidget", {}, this.metrixToggle = {value: koto.preferences.obj.metrixToggle});
	this.controller.listen("metrixToggleWidget", Mojo.Event.propertyChange, this.handleMetrixToggle = function(event){
		koto.preferences.obj.metrixToggle = event.value;
		koto.preferences.store();
	}.bind(this));
	
	/*
	 *	Last.fm
	 */
	this.controller.setupWidget("lastfm-toggle", {}, {value: koto.preferences.obj.lastfm.scrobble});
	this.controller.listen("lastfm-toggle", Mojo.Event.propertyChange, this.handleLastFMToggle = function(event){
		koto.preferences.obj.lastfm.scrobble = event.value;
		koto.preferences.store();
	}.bind(this));
	this.controller.setupWidget("lastfm-username", {hintText: $L("Username"), autoFocus: false, textCase: Mojo.Widget.steModeLowerCase}, {value: ""});
	this.controller.setupWidget("lastfm-password", {hintText: $L("Password"), autoFocus: false}, {value: ""});
	if (koto.preferences.obj.lastfm.sessionKey !== ""){
		this.controller.get("not-logged-in").hide();
		this.controller.get("username").innerHTML = koto.preferences.obj.lastfm.username;
		this.controller.get("logged-in").show();
	}
	this.controller.listen("log-in", Mojo.Event.tap, this.handleLogIn = function(event){
		lastfm.getAuth(this.controller.get("lastfm-username").mojo.getValue(), this.controller.get("lastfm-password").mojo.getValue(),
			function(){
				this.controller.get("not-logged-in").hide();
				this.controller.get("username").innerHTML = koto.preferences.obj.lastfm.username;
				this.controller.get("logged-in").show();
			}.bind(this)
		);
	}.bind(this));	
	this.controller.listen("log-out", Mojo.Event.tap, this.handleLogOut = function(event){
		koto.preferences.obj.lastfm = {username: "", sessionKey: "", scrobble: true};
		koto.preferences.store();
		this.controller.get("logged-in").hide();
		this.controller.get("username").innerHTML = "";
		this.controller.get("lastfm-username").mojo.setValue("");
		this.controller.get("lastfm-password").mojo.setValue("");
		this.controller.get("not-logged-in").show();
	}.bind(this));
	
	/*
	 *	Twitter
	 */
	this.controller.setupWidget("twitter-username", {hintText: $L("Username"), autoFocus: false, textCase: Mojo.Widget.steModeLowerCase}, {value: ""});
	this.controller.setupWidget("twitter-password", {hintText: $L("Password"), autoFocus: false}, {value: ""});
	if (koto.preferences.obj.twitter.authorized === true){
		this.controller.get("twitter-not-logged-in").hide();
		this.controller.get("twitter-logged-in-username").innerHTML = koto.preferences.obj.twitter.username;
		this.controller.get("twitter-logged-in").show();
	}
	this.controller.listen("twitter-log-in", Mojo.Event.tap, this.handleTwitterLogIn = function(event){
		koto.twitter.authorize(this.controller.get("twitter-username").mojo.getValue(), this.controller.get("twitter-password").mojo.getValue(),
		  function(response){
			if (response !== false) {
				koto.preferences.obj.twitter.authorized = true;
				koto.preferences.obj.twitter.username = response.username;
				koto.preferences.obj.twitter.token = response.token;
				koto.preferences.obj.twitter.secret = response.secret;
				//save credentials
				
				this.controller.get("twitter-not-logged-in").hide();
				this.controller.get("twitter-logged-in-username").innerHTML = koto.preferences.obj.twitter.username;
				this.controller.get("twitter-logged-in").show();
				
				this.controller.showAlertDialog({
					onChoose: function(value) {
						if (value){
							koto.twitter.followMe();
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
				koto.preferences.obj.twitter = {            
					username: '',
					authorized: false,
					token: '',
					secret: ''
				};
				koto.utilities.bannerError('Invalid login credentials')
			}
		  }.bind(this)
		);
	}.bind(this));	
	this.controller.listen("twitter-log-out", Mojo.Event.tap, this.handleTwitterLogOut = function(event){
		koto.twitter.logout()
		koto.preferences.obj.twitter = {username: "", authorized: false, username: "", token: "", secret: ""};
		koto.preferences.store();
		this.controller.get("twitter-logged-in").hide();
		this.controller.get("twitter-logged-in-username").innerHTML = "";
		this.controller.get("twitter-username").mojo.setValue("");
		this.controller.get("twitter-password").mojo.setValue("");
		this.controller.get("twitter-not-logged-in").show();
	}.bind(this));
	
	
	/*
	 *	Dropbox 
	 */
	/*this.controller.setupWidget("dropbox-username", {hintText: $L("Email/Username"), autoFocus: false}, {value: ""});
	this.controller.setupWidget("dropbox-password", {hintText: $L("Password"), autoFocus: false}, {value: ""});
	if (koto.preferences.obj.dropbox.token !== ""){
		this.controller.get("dropbox-not-logged-in").hide();
		this.controller.get("dropbox-logged-in-username").innerHTML = koto.preferences.obj.dropbox.displayName;
		this.controller.get("dropbox-logged-in").show();
	}
	this.controller.listen("dropbox-log-in", Mojo.Event.tap, this.handleDropboxLogIn = function(event){
		dropbox.authorize(this.controller.get("dropbox-username").mojo.getValue(), this.controller.get("dropbox-password").mojo.getValue(),
		  function(response){
			if (response && !response.error) {
				koto.preferences.obj.dropbox.displayName = response.displayName;
				koto.preferences.obj.dropbox.token = response.token;
				koto.preferences.obj.dropbox.secret = response.secret;
				//save credentials
				
				this.controller.get("dropbox-not-logged-in").hide();
				this.controller.get("dropbox-logged-in-username").innerHTML = koto.preferences.obj.dropbox.displayName;
				this.controller.get("dropbox-logged-in").show();
				
			} else {
				koto.preferences.obj.dropbox = {            
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
		koto.preferences.obj.dropbox = {            
			displayName: '',
			token: '',
			secret: ''
		};		
		koto.preferences.store();
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
	koto.preferences.store();
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