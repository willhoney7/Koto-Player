function StartupAssistant(arg) {
	if (arg === "new"){
		this.message = $L({value: "In a few moments, you will be prompted to give Koto access to your music. If you say no, you won't be able to use the app! <br/><br/>Once you give the app permission, it will launch a dashboard to cache your songs for Just Type. <b>It takes about 30 seconds per 500 songs depending on your device</b>. Please DO NOT close this dashboard! Make sure you add Koto to your application searches so you can type to play any song or playlist and view any artist/album/genre. Tap here to launch the Just Type Preferences, then tap \"Add Application Searches\", then \"Koto Player\".", key: "message_access"});
	}else if (arg === "update"){
		this.message = $L("Thanks for updating! The changelog is below!");
	}else if (arg === "changelog" || !arg){
		this.message = "";
	}
	this.arg = arg;
	var versionCookie = new Mojo.Model.Cookie('appVersion_mojoPlayer');
	//versionCookie.put("0.5.6");
	versionCookie.put(Mojo.Controller.appInfo.version);
	scene_helpers.addCommonSceneMethods(this, "startup");
	
	if (arg !== "changelog"){
		try {
			//m.initialize({fromStartup: true});
		} catch(e){
			//Mojo.Controller.getAppController().getStageController("cardStage").swapScene({name: "error", transition: Mojo.Transition.none}, e);
		}
	}
}

StartupAssistant.prototype.setup = function() {

	this.setupCommon();
	if (this.arg === "new")
		this.initViewMenu($L("Welcome to Koto!"));
	
	
	var changelog = [
		
		{
			"version": "1.0.0",
			"log":
				[
					"Some minor bug fixes and improvements",
					"Pre 3 support"
				]
		},
		{
			"version": "0.8.2",
			"log":
				[
					"<b>Improvement:</b> German Localization (Thanks hombresiniestro!)",
					"<b>Improvement:</b> New Rounded Circle behind the icon. (Thanks hombresiniestro!)",
					"<b>Bug Fix:</b> Launching Koto Player from the \"sticky\" dashboard. (Thanks @screwdestiny!)",
					"<b>Bug Fix:</b> Auto-Playlist creation. (Thanks @screwdestiny!)",
					"<b>Bug Fix:</b> Viewing an M3U Playlist from Just Type. (Thanks @screwdestiny!)",
					"<b>Bug Fix:</b> Make sure the app doesn't auto resume when it shouldn't. (Thanks @screwdestiny!)",
					"<b>Bug Fix:</b> Actually sort albums alphabetically in artist view.",
					"<b>Bug Fix:</b> Sort album tracks by position in case the media indexer reports them out of order"
				]
		},
		{
			"version": "0.8.0",
			"log":
				[
					"<b>New Feature:</b> M3U Playlists",
					"<b>Improvement:</b> Added banner error for trying to play a blank array (like an auto playlist)",
					"<b>Improvement:</b> Backend completely refactored and is now more efficient.",
					"<b>Bug Fix:</b> The Preference for Favorite Tap is now honored",
					"<b>Bug Fix:</b> Last song on album art scroller not showing up properly.",
					"<b>Bug Fix:</b> Repeat",
					"<b>Bug Fix:</b> Play Next/Last with shuffled songs",
					"<b>Bug Fix:</b> Play All from Artist view (Thanks @screwdestiny!)",
					"<b>Bug Fix:</b> FavoriteTap settings affecting artist and album views (Thanks @screwdestiny!)",
					"<b>Bug Fix:</b> Sort albums alphabetically in artist view just in case."
				]
		},
		{
			"version": "0.7.1",
			"log":
				[
					"<b>Improvement:</b> Just Type Indexing greatly improved",
					"<b>Improvement:</b> Behind-the-scenes refactoring"
				]
		},
		{
			"version": "0.7.0",
			"log":
				[
					"<b>New Feature:</b> In-app search! Just forward swipe to launch the search page.",
					"<b>New Feature:</b> Theme selection! Blue, black, green, red, or purple!",
					"<b>New Feature:</b> Filter songs in playlists by typing.",
					"<b>New Feature:</b> Advanced custom playlist sorting. Tap on the \"...\" button on the playlist view page, tap sort, and pick your option.",
					"<b>New Feature:</b> Added preference for the action to take when tapping on a playlist.",
					"<b>New Feature:</b> Artists, Albums, and Songs pages now ignore \"a\", \"an\", and \"the\" in sorting.",
					"<b>Improvement:</b> Added preference on what to do when you tap a song that has been filtered.",
					"<b>Improvement:</b> Added preference to hide the Alpha Scroller.",
					"<b>Improvement:</b> Added preference for not indexing songs by album",
					"<b>Improvement:</b> Enhanced performance on playing songs.",
					"<b>Improvement:</b> Moved favorites storage system to db8. Allows up to 500 favorites rather than 100-200.",
					"<b>Bug Fix:</b> Fixed truncation for Song Tweets.",
					"<b>Bug Fix:</b> Album Art Scroller with one song.",
					"<b>Bug Fix:</b> Improved handling of albums with various artists."
				]
		},
		{
			"version": "0.6.4",
			"log":
				[
					"<b>New Feature:</b> Smart Alpha Scroller! Use it to quickly navigate to you content.",
					"<b>New Feature:</b> Add to Favorite on ... menu on Now Playing Page.",
					"<b>New Feature:</b> Added API for other apps to get the currently playing song! For example, in Spaz you will be able to tweet your currently playing song directly from the app. The details are on <a href='http://webos101.com/Cross-App_Launching'>webos101.com/Cross-App_Launching</a>",
					"<b>New Feature:</b> Option to truncate long text added.",
					"<b>Improvement:</b> Underlay for Currently Playing item in the Now Playing Scroller as well as a \"selected\" underlay",
					"<b>Improvement:</b> Fixed poor handling of albums with various artists.",
					"<b>Improvement:</b> Scene Scroll Fades",
					"<b>Improvement:</b> Added keyboard controls for song details page. \"+\"/\"w\" to increment the rating, \"-\"/\"s\" to decrement it. Also added button",
					"<b>Bug Fix:</b> Restricted Album Art downloading to .jpgs",
					"<b>Bug Fix:</b> Downloading album art for albums with special characters.",
					"<b>Bug Fix:</b> Better handling of .m4p files.",
					"<b>Bug Fix:</b> Play Next/Last on the Album Art Scroller and Song Details pages would not render correctly.",
					"<b>Bug Fix:</b> Tapping on Favorites"
				]
		},
		{
			"version": "0.6.0",
			"log":
				[
					"<b>New Feature:</b> Song Change transitions! Now your album art will slide in",
					"<b>New Feature:</b> Album Art Downloading! Tap on album art on the album view!",
					"<b>New Feature:</b> Keyboard Controls! Check out the tips page from the help page for more info! (Thanks Oil and KromaXamorK!)",
					"<b>New Feature:</b> Advanced Dashboard preferences. See the Preferences page. (Thanks Derek and Edwina!)",
					"<b>Improvement:</b> Album Art Scroller enhanced!",
					"<b>Improvement:</b> Song Details now lets you flick to look through the songs. For example, view the song details on a song in an Auto Playlist. Flicking will show you the next/previous item. Also, swipe down on the Now Playing scene to bring up the Song Details page.",
					"<b>Improvement:</b> Song Rating and Playcount updating will now work even if the songs were not cached properly.",
					"<b>Improvement:</b> Behind-the-scenes refactoring with artist view and playlist view",
					"<b>Improvement:</b> Better song caching, rating, and playcount updating.",
					"<b>Improvement:</b> Added Data Connection testing to various functions",
					"<b>Improvement:</b> Twitter login and song tweeting error reporting",
					"<b>Bug Fix:</b> Top Rated now refreshes after you change the rating of a song in that list.",
					"<b>Bug Fix:</b> Popup options on songs from the songs list only use the song, instead of using all songs by that artist.",	
					"<b>Bug Fix:</b> Song repeat now works properly.",
					"<b>Bug Fix:</b> System events that pause your music now register correctly.",
					"<b>Bug Fix:</b> Tapping on a song from the list of songs sometimes would only play 50 songs."
				]
		},
		{
			"version": "0.5.6",
			"log":
				[
					"Now Pre 3 compatible",
					"<b>Improvement:</b> About Page content improved",
					"<b>Improvement:</b> Metrix opt-out added.",
					"<b>Improvement:</b> Added error page for those running webOS 1.x and for other errors.",
					"<b>Bug Fix:</b> Song repeat now works properly."
				]
		},
		{
			"version": "0.5.3",
			"log":
				[
					"<b>Bug Fix:</b> A bad song cache would remove all old songs from cache."
				]
		},
		{
			"version": "0.5.2",
			"log":
				[
					"Now HP Veer compatible",
					"<b>Bug Fix:</b> Tapping on a Song in Just Type would return an undefined playlist."
				]
		},
		{
			"version": "0.5.0",
			"log":
				[
					"Initial Release"
				]
		},
		/*{
			"version": "0.4.24 RC",
			"log":
				[
					"<b>Bug Fix:</b> Bad song playcount saving.",
					"<b>Bug Fix:</b> Song Focus Animate Issues"
				]
		},
		{
			"version": "0.4.23 RC",
			"log":
				[
					"<b>Improvement:</b> \"Song Details\" and \"View Album\" options added to song popup menu.",
					"<b>Improvement:</b> Improved Focusing on Song on Now Playing List View."
				]
		},
		{
			"version": "0.4.22 RC",
			"log":
				[
					"<b>New Feature:</b> Save only current song to a playlist",
					"<b>Improvement:</b> Made command menu panel button switch to indicate current panel's visibility.",
					"<b>Bug Fix:</b> Made it so you can't add Automatic Playlists to other playlists. (Thanks Roy!)",
					"<b>Bug Fix:</b> Temporarily removed gapless playback [beta] to fix bugs."
				]
		},
		{
			"version": "0.4.21",
			"log":
				[
					"<b>Bug Fix:</b> Changed Gapless Playback in effort to fix issues."
				]
		},
		{
			"version": "0.4.19",
			"log":
				[
					"<b>New Feature:</b> Lyrics Added using musiXmatch API [beta] - please keep this private",
					"<b>Improvement:</b> Changed Song Progress Monitoring.",
					"<b>Bug Workaround:</b> Put in a workaround for bad media indexing on Artists' Albums."
				
				]
		},
		{
			"version": "0.4.18",
			"log":
				[
					"<b>Bug Workaround:</b> Garbage Collection bug discovered, with a small workaround in place until we find the root cause.",
					"<b>Bug Fix:</b> Viewing Changelog Messing up Now Playing Song (Thanks John!)",
					"<b>Bug Fix:</b> Auto-List Tapping Views Songs instead of Playing",
					"<b>Bug Fix:</b> Koto now plays next song if it has a problem with current song (protected, etc.)"
				]
		},
		{
			"version": "0.4.17",
			"log":
				[
					"<b>Improvement:</b> Major behind-the-scenes improvements",
				]
		},
		{
			"version": "0.4.16",
			"log":
				[
					"<b>New Feature:</b> Added \"Update Just Type Data\" to \"More Options\" in app menu,",
					"<b>New Feature:</b> Added \"Recover Now Playing\" to \"More Options\" in app menu,",
					"<b>Improvement:</b> Improved Continue Album and View Album availability on Now Playing Scene",
					"<b>Improvement:</b> Improved popup options on View Album/Artist page.",
					"<b>Bug Fix:</b> A few bugs while deleting songs from the current playlist",
					"<b>Bug Fix:</b> Fixed View Album on Now Playing scene popup"
				]
		},
		{
			"version": "0.4.15",
			"log":
				[
					"<b>New Feature:</b> Added preference for tapping on favorites, to play or view them",
					"<b>Improvement:</b> Huge update to Artist and Album View",
					"<b>Improvement:</b> Just Type now caches whenever you add/remove songs instead of on update",
					"<b>Improvement:</b> Now when you tap on an album/artist/genre in Just Type, it will show the songs in that category, rather than playing them. Playlists and Songs still play when you tap on them",
					"<b>Bug Fix:</b> Back Gesture while Adding Playlist on list/view scenes"
				]
		},
		{
			"version": "0.4.14",
			"log":
				[
					"<b>New Feature:</b> (Nearly) Gapless Playback added [beta]",
					"<b>Bug Fix:</b> Shuffling bugs (Thanks webOSdealer!)"
				]
		},
		{
			"version": "0.4.13",
			"log":
				[
					"<b>Improvement:</b> Play All and Shuffle All from top right more menu on list views now plays based on content. For example, play now on albums will play all songs ordered by album. You can also do Play Next and Play Last.",
					"<b>Bug Fix:</b> Some bugs when having the same song in a playlist.",
					"<b>Error Fix:</b> Fixed startup text now that caching is in a dashboard."
				]
		},
		{
			"version": "0.4.12",
			"log":
				[
					"<b>New Feature:</b> Headset support added. Bluetooth headset is untested.",
					"<b>Error Fix:</b> Fixed startup text now that caching is in a dashboard."
				]
		},
		{
			"version": "0.4.11",
			"log":
				[
					"<b>Improvement:</b> Just Type caching moved to Dashboard",
					"<b>Bug Fix:</b> Just Type caching failing on very first launch",
					"<b>Bug Fix:</b> Songs getting loaded multiple times."
				]
		},
		{
			"version": "0.4.10",
			"log":
				[
					"<b>New Feature:</b> More From this Artist, via App Menu, tap to view all songs by the current artist",
					"<b>New Feature:</b> Share Now Playing via Email, via app menu",
					"<b>New Feature:</b> Continue with Album added to ... button on Now Playing Page",
					"<b>New Feature:</b> Added Initial Help Content",
					"<b>New Feature:</b> Choose Number of Songs to show up in Album Art Preview mode",
					"<b>Bug Fix:</b> Album Art Preview limited for performance",
					"<b>Bug Fix:</b> Various Album Art Preview Mode Bugs",
					"<b>Bug Fix:</b> Deleted playlists showing up in \"Add to Playlists\"",
					"<b>Bug Fix:</b> Playing a song that was filtered down not working properly"
				]
		},
		{
			"version": "0.4.9",
			"log":
				[
					"<b>New Feature:</b> Song Details, tap on the ... icon in the play scene, then \"Song Details\" to see play counts, and ratings!",
					"<b>New Feature:</b> Auto Playlists, tap on playlists then tap on any of the playlists in the \"Auto\" category. ",
					"<b>Bug Fix:</b> Just Type caching. Unfortunately, will take slightly longer now."
				]
		},
		{	
			"version": "0.4.8",
			"log": 
				[
					"<b>New Feature:</b> Twitter Integration, add your account in the Preferences and Accounts Page, then tap the ... button on the now playing scene, then tap \"Tweet Song\"",
					"<b>Bug Fix:</b> Scrim not disappearing bug"
				]
		},
		{
			"version": "0.4.7",
			"log":
				[
					"Re-implemented Just Type with enhancements",
					"Added content counts to View Menu",
					"Added content counts to Start Scene",
					"Re-ordered list items on the start scene are now saved",
					"Menu-icon next/previous changed to indicate full songs, rather than scrobbling",
					"Default repeat mode in prefs set up. Not satisfied with look yet.",
					"Fixed playlist list not updating"
				]
		},
		{
			"version": "0.4.5",
			"log":
				[
					"Removed artist/album drawers",
					"Decreased load time",
					"Removed Just Type caching momentarily",
					"Updated View Menu for artists, still working on it",
					"New Total Songs Count on view menu",
					"Made Marqueeing text an option. Default is off",
					"Fixed \"Play Last\""
				]
		},
		{
			"version": "0.4.2",
			"log":
				[
					"Fixed 0:60 bug",
					"Added time to resume",
					"Added default album art"
				]
		},
		{
			"version": "0.4.0",
			//"releaseDate": "10/11/10",
			"log":
				[
					"Added Repeat Mode. Untested",
					"Added dashboard"
				]
		},
		{
			"version": "0.3.9",
			//"releaseDate": "10/11/10",
			"log":
				[
					"Album-art playlist view added. Hold onto album art or swipe up to preview album art from all the songs in the playlist. Swipe up to delete the song from now playing. Swipe down to play that song now. Tap on it for more options."
				]
		},
		{
			"version": "0.3.8",
			//"releaseDate":</b> "10/11/10",
			"log":
				[
					"Initial Release"
				]
		},*/
	]
	var html = '';
	for (var i = 0; i < changelog.length; i++){
		html += Mojo.View.render({object: {dividerLabel: "v"+changelog[i].version}, template: 'startup/divider'});
		html +='<ul class="palm-body-text">';
		for (var l = 0; l < changelog[i].log.length; l++){
			html += '<li>' + changelog[i].log[l] + '</li>';
		}
		html += '</ul>';
	}
	if (this.message !== ''){
		this.controller.listen("message", Mojo.Event.tap, function(){
			koto.serviceRequest.request("palm://com.palm.applicationManager", 
				{
					method: 'open',
					parameters: {
						id:"com.palm.app.searchpreferences",
						params: {
						//	launch:</b> "addMoreSearch" does web search engines.
						}
					}
				}
			); 
		}.bind(this));
		
		this.controller.get("message").innerHTML = this.message;
		this.controller.get("message").show();
		this.controller.get("metrixToggle").show();
		
		this.controller.setupWidget("metrixToggleWidget", {}, this.metrixToggle = {value: koto.preferences.obj.metrixToggle});
		this.controller.listen("metrixToggleWidget", Mojo.Event.propertyChange, this.handleMetrixToggle = function(event){
			koto.preferences.obj.metrixToggle = event.value;
			koto.preferences.store();
		}.bind(this));
		this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.commandMenuModel = {visible: false, items:[{},{label: $L("Continue"), command: "swapMain-fromStartUp"},{}]});	
		
	}
	this.controller.get("changelog").innerHTML = html;
	
	this.crappedOutTimeout = setTimeout(function(){
		if (koto.content.songs.array.length === 0){
			this.controller.stageController.swapScene("error", "Error: No permission from Media Indexer", true);
		}
	}.bind(this), 35000);

};
StartupAssistant.prototype.loaded = function(){
	clearTimeout(this.crappedOutTimeout);
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
	if (this.arg === "new"){// || this.arg === "update"){
		koto.justType.setupIndexingDashboard();
	}	
}
StartupAssistant.prototype.handleCommand = function(event){}
StartupAssistant.prototype.activate = function(event) {};
StartupAssistant.prototype.deactivate = function(event) {};
StartupAssistant.prototype.cleanup = function(event) {
	if (koto.preferences.obj.metrixToggle === true){
		koto.metrix.postDeviceData();
	}
};