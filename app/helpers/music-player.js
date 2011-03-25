try { 
	var libraries = MojoLoader.require({ name: "foundations", version: "1.0" }); 
	var Future = libraries["foundations"].Control.Future; // Futures library 
	var DB = libraries["foundations"].Data.DB; // db8 wrapper library 
} catch (Error) { Mojo.Log.error(Error); }
var milliseconds;
var m = {
/*
 * Variables
 */
	artists: [],
	albums: [],
	songs: [],
	genres: [],
	playlists: [],
	customPlaylists: [],
	
	favorites: [],
	favoritesCookie: new Mojo.Model.Cookie('favorites_mojoPlayer'),
	
	nP: {
		songs: [],
		unshuffledSongs: [],
		index: 0,
		playing: false,
		repeat: 2,
		cao: "one" //current audio obj
	},
	
	prefs: {
		saveAndResume: true,
		defaultRepeat: 2,
		favoriteTap: "view",
		playlistTap: "play",
		albumArtScrollerNum: 40,
		marqueeText: false,
		alphaScroller: true,
		truncateText: true,
		metrixToggle: true,
		useDashboard: true,
		closeDashboard: true,
		lastfm: {
			username: "",
			sessionKey: "",
			scrobble: true
		},
		twitter: {
			username: "", 
			authorized: false, 
			username: "", 
			token: "", 
			secret: ""
		},
		/*dropbox: {            
			displayName: '',
			token: '',
			secret: ''
		},*/
		startItems: [
			{label: "Artists", command: "artists"},
			{label: "Albums", command: "albums"},
			{label: "Songs", command: "songs"},
			{label: "Genres", command: "genres"},
			{label: "Playlists", command: "playlists"},
			{label: "Favorites", command: "favorites"}
		]
	},
	songCountCookie: new Mojo.Model.Cookie("songCount_KotoPlayer"),
	prefsCookie: new Mojo.Model.Cookie("preferences_KotoPlayer"),
	setUpPrefs: function(){
		var prefData = m.prefsCookie.get();
		if(prefData){
			if(prefData.saveAndResume !== undefined){
				m.prefs.saveAndResume = prefData.saveAndResume;
			}
			if(prefData.defaultRepeat !== undefined && prefData.defaultRepeat && !isNaN(parseInt(prefData.defaultRepeat))){
				m.prefs.defaultRepeat = prefData.defaultRepeat;
			}
			if(prefData.playlistTap !== undefined){
				m.prefs.playlistTap = prefData.playlistTap;
			}
			if(prefData.favoriteTap !== undefined){
				m.prefs.favoriteTap = prefData.favoriteTap;
			}
			if(prefData.albumArtScrollerNum !== undefined){
				m.prefs.albumArtScrollerNum = prefData.albumArtScrollerNum;
			}
			if(prefData.marqueeText !== undefined){
				m.prefs.marqueeText = prefData.marqueeText;	
			}
			if(prefData.alphaScroller !== undefined){
				m.prefs.alphaScroller = prefData.alphaScroller;	
			}
			if(prefData.truncateText !== undefined){
				m.prefs.truncateText = prefData.truncateText;	
			}
			if(prefData.metrixToggle !== undefined){
				m.prefs.metrixToggle = prefData.metrixToggle;
			}
			if(prefData.closeDashboard !== undefined){
				m.prefs.closeDashboard = prefData.closeDashboard;
			}
			if(prefData.useDashboard !== undefined){
				m.prefs.useDashboard = prefData.useDashboard;
			}
			if(prefData.lastfm !== undefined){
				m.prefs.lastfm = prefData.lastfm;
			}
			if(prefData.twitter !== undefined){
				m.prefs.twitter = prefData.twitter;
			}
			if(api_keys){
				Twitter = new xTwitter({
					consumerKey: api_keys.twitter_consumerKey,
					consumerSecret: api_keys.twitter_consumerSecret,
					follow: {
						username: 'Koto_Player',
					}
				}, m.prefs.twitter);
			}
			
			/*if(prefData.dropbox !== undefined){
				m.prefs.dropbox = prefData.dropbox;
			}*/
			if(prefData.startItems !== undefined && prefData.startItems && prefData.startItems.length > 0 && prefData.startItems[0].command && prefData.startItems[0].label){
				m.prefs.startItems = prefData.startItems;
			}
		};
	},
	storePrefs: function(){
		m.prefsCookie.put(m.prefs);
	},

	isDbSearch: false, //so the app doesn't resume if you click on a dbsearch
	launchPlayer: false,
	hasSavedOldNowPlaying: false,
/*
 * Setup Functions
 */
	initialize: function(arg){
	/*
		Todo
			//-finish forward swipe
			//-finish search
				//-custom search widget
			//-similar artists	
			
			-meta-tap scroll to top/bottom  left/right .. top/bottom works.
			//-favorites horizontal scroller ?
			
			
			
			Figure out how to do album viewing with "various" artists.
				-from artist, launch all albums by artist
				-from album, launch "Album Artist" with album
				
				-view album launches album artist
				
				m.view({type: "album", name: "alb name"}
					   {type: "artist", name: "artist name"}
				m.viewAlbum(albumName);
				m.viewArtist(artistName)
			
			for .7
			-pick album art from now playing scene
			-Ignore the/a/an Option
			-m3u playlists
			-add "list item" for "Resume Now Playing"
			-color support
			-transitions between album art scroller and now playing item
				
			-dashboard progress bar?
			-exhibition?
			-landscape?
			-bookmarks?
			-improved last.fm scrobbling
				
			sometime:
			-improve m functions, especially initialize. it sucks
			-sleep timer
			
		Known Issues:
			- on viewAlbum, other albums by artist include songs by other artists.
				ex: viewAlbum "The Resistance" by Muse. "Unknown Album" by Muse shows ALL songs with the album name "Unknown Album" regardless of artist.
		*/
		
		db8.setup();
		m.setUpPrefs();
		if(m.prefs.saveAndResume == true || m.launchPlayer){
			if(!arg || (arg && !arg.fromStartup)){
				m.resumeNowPlaying();
			}
		}
		if((!arg || (arg && !arg.dontLoadSongs)) && !m.launchPlayer){
			m.getCustomAlbumArt(m.getPermissions.bind(this));
		}
		
		if(!m.launchPlayer){
			m.launchPlayer = false;

			m.getAllPlaylists(); //gets the auto lists and .m3u lists and unshifts them to custom lists
			m.setUpJustType.defer();
			m.setUpAudioObjs();
				

			var volumeLock = new Mojo.Service.Request("palm://com.palm.audio/media", {
				method: 'lockVolumeKeys',
				onSuccess: function(arg){}.bind(this),
				parameters: {
					subscribe: true,
					foregroundApp: true
				}
			});
			g.ServiceRequest.request("palm://com.palm.keys/headset", {//headset
				method:'status',
				parameters: {subscribe: true},
				onSuccess: function(button){
					if(m.nP.songs.length > 0 && button.state){
						if(button.state === "single_click"){
							if(m.nP.playing === true){
								m.pause();
							}
							else{
								m.resume();
							}
						}
						if(button.state === "double_click"){
							m.playNext();
						}
					}
				}.bind(this)
			},true);
			
			g.ServiceRequest.request("palm://com.palm.keys/media", {//bluetooth headset
				method:'status',
				parameters: {subscribe: true},
				onSuccess: function(button){
					//m.debugErr("heard bluetooth press " + Object.toJSON(button));
					if(button && button.state && button.state === "down" && m.nP.songs.length > 0){
						switch (button.key) {
							case "play":
								m.resume();
								break;
							case "pause":
								m.pause();
								break;	
							case "next":
								m.playNext();
								break;
							case "prev":
								m.playPrevious();
								break;											
						}
					}
				}.bind(this)
			},true);
	
		} else {
			//Mojo.Controller.getAppController().getStageController("cardStage").getScenes()[0].assistant.loaded();
		}
	},
	setUpAudioObjs: function(){
		m.nP["audioObjone"] = new Audio();
		//m.nP["audioObjtwo"] = new Audio();
		
		var libs = MojoLoader.require({ name: "mediaextension", version: "1.0"});
		var extObj = libs.mediaextension.MediaExtension.getInstance(m.nP["audioObjone"]);
		//var extObjTwo = libs.mediaextension.MediaExtension.getInstance(m.nP["audioObjtwo"]);
		extObj.audioClass = "media";
		//extObjTwo.audioClass = "media";
  
		// Listen for pause and play events
		m.nP["audioObjone"].addEventListener("pause", m.handlePause.bind(this), true);
		m.nP["audioObjone"].addEventListener("play", m.handlePlay.bind(this), true);
		m.nP["audioObjone"].addEventListener("ended", function(event){
			var currentId = m.nP.songs[m.nP.index]._id;
			var currentObj = m.nP.songs[m.nP.index];
			m.playNext(true);
			m.incrementPlayCount(currentId);
			lastfm.scrobble(currentObj);
		}.bind(this), true);
		//m.nP["audioObjone"].addEventListener("ended", m.playLoadedSong.bind(this), true);
		m.nP["audioObjone"].addEventListener("error", m.playNext.bind(this), true);
		m.nP["audioObjone"].addEventListener("timeupdate", function(arg){
			m.delegate("_updateProgress");
		}.bind(this), true);
		
		/*m.nP["audioObjtwo"].addEventListener("pause", m.handlePause.bind(this), true);
		m.nP["audioObjtwo"].addEventListener("play", m.handlePlay.bind(this), true);
		m.nP["audioObjtwo"].addEventListener("ended", m.playLoadedSong.bind(this), true);
		m.nP["audioObjtwo"].addEventListener("error", m.playNext.bind(this), true);
		m.nP["audioObjtwo"].addEventListener("timeupdate", function(arg){
			m.delegate("_updateProgress");
		}.bind(this), true);*/
	
	},
	getPermissions: function(doNotLoadSongs){
		g.ServiceRequest.request('palm://com.palm.mediapermissions', {  
			method: 'request',  
			parameters: {
				rights: {
					read: ["com.palm.media.image.album:1","com.palm.media.audio.album:1","com.palm.media.audio.artist:1","com.palm.media.audio.file:1","com.palm.media.audio.genre:1", "com.palm.media.playlist.object:1"]  
				}
			},  
			onComplete: function(response) {  
				if(response.returnValue && response.isAllowed){
					//Get the songs
					if(!doNotLoadSongs)
						m.getFavorites();
					
					Mojo.Log.info('Got permissions okay!');
					
				}
				else if(response.errorCode !== -1)
					m.dialogError("The app can not access your music... " + Object.toJSON(response));				
			}.bind(this)  
		});
	},
/*
 * Utilities Functions
 */ 
	db8_exec: function(query, callBackFunc, ignoreNext){//this is for music queries
		DB.find(query, false, false).then(function(future) {
			var result = future.result;   
			if (result.returnValue == true){ // Success
				callBackFunc(result.results, (result.next === undefined));
				if(result.next && !ignoreNext){
					query.page = result.next;
					m.db8_exec(query, callBackFunc);
				}
			}
			else {// Failure
				m.debugErr("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
			}
		});
	},
	getObjType: function(obj){
		if(obj.title) //USED in LOTS of stuff, mostly in list-assistant.js
			return "song";
		else if(obj._kind  && obj._kind === "com.palm.media.audio.artist:1")
			return "artist";
		else if(obj._kind  && obj._kind === "com.palm.media.audio.album:1")
			return "album";
		else if(obj._kind && obj._kind === "com.palm.media.audio.genre:1")
			return "genre"
		else if(obj._kind  && (obj._kind === "com.palm.media.playlist.object:1" || obj._kind === g.AppId + ".playlists:1"))
			return "playlist";
	},
	buyKoto: function(){
		var launchParams = {
			id: "com.palm.app.findapps",
			params: {'target': "http://developer.palm.com/appredirect/?packageid=com.tibfib.app.koto"}
		};
		g.ServiceRequest.request('palm://com.palm.applicationManager',{
			method: 'open',
			parameters: launchParams
		});
	},
	delegate: function(funcName, arg){
		try {
			Mojo.Controller.getAppController().getStageController("cardStage").delegateToSceneAssistant(funcName, arg);
		}catch(e){};//so it errors silently when you swipe card off
	},
	updateDashboard: function(){
		if(Mojo.Controller.getAppController().getStageController("dashboardStage")){
			Mojo.Controller.getAppController().getStageController("dashboardStage").delegateToSceneAssistant("displayDashboard");
		}
	},
	showingPlayer: function(){
		return (Mojo.Controller.getAppController().getStageController("cardStage").activeScene().sceneName === "play");
	},
	shuffle: function(array) {
		var tmp, current, top = array.length;
		if(top) while(--top) {
			current = Math.floor(Math.random() * (top + 1));
			tmp = array[current];
			array[current] = array[top];
			array[top] = tmp;
		}
		return array;
	},
	formatTime: function(sec){
		function pad(s){
			if(s < 10)
				return "0" + s;
			else
				return s;
		}
		if(!sec)
			return "0:00";
		return (Math.floor(sec/60))+":"+pad(Math.floor(sec%60));
	},
	formatDate: function(d){
		var year = d.getFullYear().toString(); 
		month = d.getMonth()+1;
		if(month < 10)
			month = '0' + month;
		day = d.getDate();
		if(day < 10)
			day = '0'+ day;
		var date =  month + "/" + day +"/"+ year.charAt(2)+year.charAt(3);		
		
		var hours = d.getHours().toString();
		var	apm = "AM";
		if (Mojo.Format.using12HrTime() == true){
			if(hours >= 12){
				hours = hours - 12;
				apm = "PM";
			}
			if(hours == 0)
				hours = 12;
			var time = hours + ":" + (checkTime(d.getMinutes())) + " " + apm;
		}
		else{var time = hours + ":" + (checkTime(d.getMinutes()));}
		
		function checkTime(i){   //Takes the 1 digit times and adds a 0
			if (i<10)
				i="0" + i;
			return i;
		}
		return date + " " + time;
	},
	swapAudioObjs: function(){
		m.nP.cao = (m.nP.cao === "one")? "two" : "one";
	},
	sortRegex: /^(the\s|an\s|a\s)(.*)/i,
	sortContentList: function(array){
		if(array.length > 0){
			var sortBy = array[0].title ? "title" : "name";
		}
		function sortFunction(a,b) {
			var x = a[sortBy].replace(m.sortRegex, "$2").toLowerCase()
			var y = b[sortBy].replace(m.sortRegex, "$2").toLowerCase();
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		}
		/*array = array.sortBy(function(obj){
			return obj[sortBy].replace(regex, "");
		}, this);*/
		array.sort(sortFunction);
		uniqArray(array);
	},
/*
 *	Get Functions:
 */
	getFavorites: function(dontGetMusic){
		m.favorites = [];
		cookieData = this.favoritesCookie.get();
		if(cookieData){
			favorites = [];
			for(var i = 0; i < cookieData.favorites.length; i++){
				favorites.push({"id": cookieData.favorites[i].id, "_kind": g.AppId + ".favorites:1"})
			}
			if(favorites.length > 0){
				db8.putArray(favorites, function(){
					getFavorites();
				}.bind(this));
				this.favoritesCookie.put(false);
			} else {
				getFavorites();
			}
		} else {
			getFavorites();
		}
		function getFavorites(){
			var query = {"select" : ["id","_id", "position"], "from": g.AppId + ".favorites:1"};
			m.db8_exec(query, function(objs){
				objs = objs.sortBy(function(item){
					return item.position;
				});
				m.favoriteIds = objs;
				favIds = [];
				for(var i = 0; i < objs.length; i++){
					favIds.push(objs[i].id)
				}
				if(favIds.length > 0){
					m.getObjsById(favIds, function(favorites){
						m.favorites.clear();
						Object.extend(m.favorites, favorites);
						if(!dontGetMusic){
							m.getAllArtists();		
						}
					}.bind(this))
				} else {
					if(!dontGetMusic){
						m.getAllArtists();		
					}
				}
			}.bind(this));
		}
	},
	getAllArtists: function(){
		m.artists.clear();
		var d = new Date();
		//milliseconds = d.getTime();
		var query = { "select" : ["name", "total.tracks", "total.albums", "_id", "_kind"], "orderBy":"name", "from":"com.palm.media.audio.artist:1"};
		m.db8_exec(query, handleArtists.bind(this));
		function handleArtists(artists, done){
			m.artists = m.artists.concat(artists);
			if(done){
				m.sortContentList(m.artists);
				m.getAllAlbums();
			}
		}
	},
	getAllAlbums: function(){
		m.albums.clear();
		var query = {"select" : ["name", "artist", "total.tracks", "_id", "_kind", "thumbnails"], "orderBy": "name", "from":"com.palm.media.audio.album:1" };
		m.db8_exec(query, handleAlbums.bind(this));
		function handleAlbums(albums, done){
			m.albums = m.albums.concat(albums);
			if(done){
				m.sortContentList(m.albums);
				m.getAllGenres();
			}
		}
	},
	getAllGenres: function(){
		m.genres.clear();
		var query = { "select" : ["name", "total.tracks", "_id", "_kind"], "from":"com.palm.media.audio.genre:1"};
		m.db8_exec(query, handleGenres.bind(this));
		function handleGenres(genres, done){
			m.genres = m.genres.concat(genres)
			if(done){
				m.getAllSongs();
			}
		}
	},
	getAllPlaylists: function(callBackFunc){
		query = {"select": ["_id", "name", "type", "songs", "sort", "songsQuery", "_kind"], "from":g.AppId + ".playlists:1", "where":[{"prop":"type","op":"!=","val":"hide"}]};
		m.db8_exec(query, function(array){
			m.playlists.clear();
			for(var i = 0; i < array.length; i++){
				if(array[i].songsQuery){
					array[i].preventDelete = true;
				}
				m.playlists.push(array[i]);
			}
			//m.playlists = array.clone();
			m.customPlaylists.clear();
			secondQuery = {"select": ["_id", "name", "type", "songs", "sort", "_kind"], "from":g.AppId + ".playlists:1", "where":[{"prop":"type","op":"=","val":"custom"}]};
			m.db8_exec(secondQuery, function(array_){
				m.customPlaylists = array_.clone();
				if(callBackFunc)
					callBackFunc();
			}.bind(this));
			
			this.getM3UPlaylists();
		}.bind(this));
		
		//var array, i = 0, playlists = [],

		/*query = {"select": ["_id", "name", "type", "songs", "_kind"], "from":g.AppId + ".playlists:1", "where":[{"prop":"type","op":"=","val":"custom"}], "orderBy": "name"};
		m.db8_exec(query, function(array_){
			m.playlists = array_.clone();
			//array = array_;
			if(callBackFunc)
				callBackFunc();
			//if(array.length > 0)
			//	getPlaylistSongs(array[i]);
		}.bind(this));	
		/*function getPlaylistSongs(playlist){
			m.getObjsById(playlist.songs, function(songs){
				playlist.songs.clear();
				Object.extend(playlist.songs, songs);
				playlists.push(playlist);
				for(var j = 0; j < m.favorites.length; j++){
					if(m.getObjType(m.favorites[j]) === "playlist" && m.favorites[j].name === playlist.name){
						m.favorites[j].songs.clear();
						Object.extend(m.favorites[j].songs, songs);
					}
				}
				m.cacheSearchData(playlist);
				if(i !== array.length-1){
					i++;
					getPlaylistSongs(array[i]);
				}else {
					m.playlists.clear();
					Object.extend(m.playlists, playlists);
					if(callBackFunc)
						callBackFunc(m.playlists);
				}	
			});
		};*/
		/*	todo autolists and .m3u
		var query = { "select" : ["name", "path", "songIds", "_id"], "from":"com.palm.media.playlist.object:1"};
		m.db8_exec(query, handlePlaylists.bind(this));	
		function handlePlaylists(array){
			var i = 0;//Dunno if this works....
			while(i < array.length){
				m.getObjsById(array[i].songIds, function(songs){
					array[i].songs = songs;
					i++;
				}.bind(this)); 
				if((i) === array.length){
					m.playlists += array;
				}
			}
			m.getAllSongs();
		}*/
	},
	getM3UPlaylists: function(callBackFunc){
		var query = { "select" : ["name", "path", "songIds", "_id"], "from":"com.palm.media.playlist.object:1"};
		//m.db8_exec(query, handlePlaylists.bind(this));	
		function handlePlaylists(array){
			var i = 0;//Dunno if this works....
			while(i < array.length){
				m.getObjsById(array[i].songIds, function(songs){
					array[i].songs = songs;
					i++;
				}.bind(this)); 
				if((i) === array.length){
					m.playlists += array;
				}
			}
		}
	},
	getAllSongs: function(){	
		var _milliseconds;
		var d = new Date();
		_milliseconds = d.getTime();
		
		m.songs = [];
		var query = {"select" : ["title", "path", "duration", "artist", "album", "genre", "thumbnails", "_id"], "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false}], "orderBy":"title"};
		//m.debugErr("------------- GETTING SONGS --------------");
		m.getSongs("title", function(songs){//, done){
			//m.debugErr("Adding " + songs[0].title.charAt(0) + " thru " + songs[songs.length-1].title.charAt(0));
			m.songs = songs;
			
			//if(done){
				var d = new Date();
				m.debugErr("Got songs. Took " + (parseInt(d.getTime()) - parseInt(_milliseconds)) + " milliseconds");
				m.sortContentList(m.songs);
				var d = new Date();
				m.debugErr("AFTER SORTING: " + (parseInt(d.getTime()) - parseInt(_milliseconds)) + " milliseconds");

				Mojo.Controller.getAppController().getStageController("cardStage").getScenes()[0].assistant.loaded();		

				if(m.songCountCookie.get()){
					m.checkJustType.defer(m.songCountCookie.get());
				} else {
					m.checkJustType.defer();
				}
				
			//}
		});
		//db8_exec: function(query, callBackFunc, isSongsQuery, ignoreNext){//this is for music queries
	/*	function getAllSongs(passedQuery, callBackFunc){
			DB.find(passedQuery, false, true).then(function(future) {
				var result = future.result;

				var d = new Date();
				m.debugErr("----- DB FIND CALLBACK -----");
				m.debugErr("Count: " + result.count);
				m.debugErr((parseInt(d.getTime()) - parseInt(_milliseconds)) + " milliseconds to get a list of songs");

				if (result.returnValue == true){ // Success
					var results = result.results;
					//if(m.songs.length > 0 && results[0].title > m.songs[m.songs.length-1].title){
						m.debugErr("results.length is " + results.length);
						m.debugErr("Adding " + results[0].title.charAt(0) + " thru " + results[results.length-1].title.charAt(0));
						m.songs = m.songs.concat(results);
					//}
					if(result.next){
						var newQuery = Object.clone(passedQuery);
						newQuery.page = result.next;
						m.debugErr("----------------------");
						getAllSongs(newQuery);
					}else {
						var d = new Date();
						m.debugErr("-------------FINISHED. Took " + (parseInt(d.getTime()) - parseInt(_milliseconds)) + " milliseconds -------------");
						m.sortContentList(m.songs);
						var d = new Date();
						m.debugErr("AFTER SORTING: " + (parseInt(d.getTime()) - parseInt(_milliseconds)) + " milliseconds");

						Mojo.Controller.getAppController().getStageController("cardStage").getScenes()[0].assistant.loaded();
					}
					if(result.fired){
						m.debugErr("result.fired");
						m.getFavorites();
					};
				}
				else // Failure
					Mojo.Log.error("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
			
			});		
		}
		getAllSongs(query);*/
		/*
		DB.find(query, true, false).then(function(future) {
			var result = future.result;   
			if (result.returnValue == true){ // Success
				results = result.results;
				m.songs = m.songs.concat(results);
				callBackFunc(result.results, (result.next === undefined));
				if(result.next && !ignoreNext){
					query.page = result.next;
					m.db8_exec(query, callBackFunc, isSongsQuery);
				}else {
					if(isSongsQuery){
						Mojo.Controller.getAppController().getStageController("cardStage").getScenes()[0].assistant.loaded();
					}
				}
				if(result.fired){
					m.debugErr("result.fired");
					m.getFavorites();
				};
			}
			else // Failure
				Mojo.Log.error("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
		
		});
		m.db8_exec(query, function(songs, done){
			m.songs = m.songs.concat(songs);
			if(done){
				if(m.songCountCookie.get()){
					m.checkJustType.defer(m.songCountCookie.get());
				} else {
					m.checkJustType.defer();
				}
			}
			//var d = new Date();
			//m.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds total to load");
		}.bind(this), true);*/
	},
	getSongs: function(order, callBackFunc){
		var songsArray = [];
		var query = {"select" : ["title", "path", "duration", "artist", "album", "genre", "thumbnails", "_id"], "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false}], "orderBy":order};
		m.db8_exec(query, function(songs, done){
			songsArray = songsArray.concat(songs);
			if(done){
				callBackFunc(songsArray);
			}
		}.bind(this));
	},
	getSongsOfObj: function(obj, callBackFunc, allSongsByArtistORDontSort){
		var objType = m.getObjType(obj);
		switch(objType){
			case "artist":
				m.getArtistSongs(obj, callBackFunc);
				break;
			case "album":
				m.getAlbumSongs(obj, callBackFunc);
				break;
			case "genre":
				m.getGenreSongs(obj, callBackFunc);
				break;
			case "playlist":
				m.getPlaylistSongs(obj, callBackFunc, allSongsByArtistORDontSort);
				break;
			case "song":
				if(allSongsByArtistORDontSort){
					m.getAllSongsByArtistFromSong(obj, callBackFunc);
				}
				else {
					callBackFunc([obj]);
				}
				break;
		}
	},
	getAllAlbumsByArtist: function(artist, callBackFunc){
		var query = {"select" : ["name", "artist", "total.tracks", "_id", "_kind", "thumbnails"], "where" : [{"prop":"artist","op":"=","val":artist}], "from":"com.palm.media.audio.album:1" };
		m.db8_exec(query, callBackFunc.bind(this));
	},
	getArtist: function(artist, callBackFunc){
		return m.artists.find(function(obj){
			return (obj.name === artist);
		}, this);
		/* for some stupid reason, "name" is not indexed in the kinds.
		
		var query = {"select" : ["name", "total.tracks", "total.albums", "_id", "_kind"], "where":[{"prop":"name","op":"=","val":artist}], "from":"com.palm.media.audio.artist:1"};
		m.db8_exec(query, handleArtists.bind(this));
		function handleArtists(artists){
			callBackFunc(artists[0]);
		}*/
	},
	getArtistSongs: function(obj, callBackFunc){
		var artist = (obj.name)?obj.name:obj;
		var query = {"select" : ["title", "path", "duration", "artist", "album", "genre", "thumbnails", "_id"], "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false},{"prop":"artist","op":"=","val":artist}]};
		m.db8_exec(query, callBackFunc.bind(this));
	},
	//getFormattedAlbumSongs: function(album, 
	getFormattedArtistSongs: function(artist_, callBackFunc, album_){
		var artist = (artist_.name) ? artist_.name : artist_;	
		/*m.getArtistSongs(artist, function(songs){
			var albums = [];
			if(songs.length > 0){
				for(var i = 0; i < songs.length; i++){
					if(i === 0){
						var album = m.getAlbum({artist: artist, name: songs[i].album});
						album.songs = [songs[i]];
						albums.push(album);
					} else if(i !== songs.length-1){
						var alreadyAdded = false;
						for(var k = 0; k < albums.length; k++){
							if(albums[k].name === songs[i].album){
								alreadyAdded = true; 
								albums[k].songs.push(songs[i]);
								break;
							}
						}
						if(!alreadyAdded){
							var album = m.getAlbum({artist: artist, name: songs[i].album});
							album.songs = [songs[i]];
							albums.push(album);
						}
					} 
					if(i === songs.length-1){
						callBackFunc(albums, songs);
					}
				}
				
			} else {
				m.debugErr("Well you're in trouble.");
				m.bannerError("Error: No Songs by Artist");
			}
		}.bind(this));*/
		m.getAllAlbumsByArtist(artist, function(albums){
			if(albums.length > 0){
				var i = 0, artistSongs = [];
				function getAlbumSongs(album){
					m.getAlbumSongs(album, function(songs){
						//do drawer stuff;
						if(albums.length === 1 || (album_ && album_ == albums[i].name)){
							albums[i].open = true;
						}
						//add songs 
						albums[i].songs = songs;
						artistSongs = artistSongs.concat(songs);
						i++;
						if(i < albums.length){
							getAlbumSongs(albums[i].name);
						} else {
							callBackFunc(albums, songs);
						}
					}, ((!album_) ? artist_ : undefined));
				}
				if(i < albums.length){
					getAlbumSongs(albums[i]);
				} else {
					m.debugErr("no albums");
				}
				/*m.getArtistSongs(artist, function(songs){
					if(songs.length > 0){
						for(var i = 0; i < songs.length; i++){
							for(var k = 0; k < albums.length; k++){
								if(albums[k].name === songs[i].album){
									if(albums.length === 1 || (album && album == albums[k].name)){
										albums[k].open = true;
									}
									if(albums[k].songs)
										albums[k].songs.push(songs[i]);
									else 
										albums[k].songs = [songs[i]];
									break;
								}
							}
						}
						var i = 0;//Gets rid of albums with no songs. These albums shouldn't exist, but the media indexer thinks they do... Delete them so it doesn't screw up view scene.
						while(i < albums.length){
							if(!albums[i].songs){
								albums.splice(i, 1);
							}else {
								i++;
							}
						}
						callBackFunc(albums, songs);
					} else {
						m.debugErr("Error with media indexing api, says artist has no songs, so launching alternate artist view.");
						m.getArtistSongs(artist, function(songs){
							callBackFunc(songs, songs, true);
						}.bind(this));
					}
				}.bind(this));*/
			} else {
				m.debugErr("Artist has no albums, so doing stuff to get it to work");
				m.getArtistSongs(artist, function(songs){
					var albums = [];
					if(songs.length > 0){
						for(var i = 0; i < songs.length; i++){
							if(i === 0){
								var album = m.getAlbum({artist: artist, name: songs[i].album});
								album.songs = [songs[i]];
								albums.push(album);
							} else if(i !== songs.length-1){
								var alreadyAdded = false;
								for(var k = 0; k < albums.length; k++){
									if(albums[k].name === songs[i].album){
										alreadyAdded = true; 
										albums[k].songs.push(songs[i]);
										break;
									}
								}
								if(!alreadyAdded){
									var album = m.getAlbum({artist: artist, name: songs[i].album});
									album.songs = [songs[i]];
									albums.push(album);	
								}
							} 
							if(i === songs.length-1){
								if(albums.length === 1){
									albums[i].open = true;
								}
								callBackFunc(albums, songs);
							}
						}
						
					} else {
						m.debugErr("Well you're in trouble.");
						m.bannerError("Error: No Songs by Artist");
					}
				}.bind(this));
			}
		}.bind(this));
	},
	getAlbum: function(obj, callBackFunc){
		var maybeAlbum;
		for(var i = 0; i < m.albums.length; i++){	
			if(m.albums[i].name === obj.name){//same album name
				if(m.albums[i].artist === obj.artist){//same artist, is for sure right album we want
					if(!callBackFunc){
						return m.albums[i];
					} else {
						callBackFunc(m.albums[i]);
						return;
					}
					break;
				} else {
					maybeAlbum = m.albums[i];//diff artist, could be media indexing issue, or could be wrong album.. cache it for later
				}
			}
		}
		if(maybeAlbum){
			if(!callBackFunc){
				return maybeAlbum;//well since we didn't find the same album with the same artist, give the maybeAlbum
			} else {
				callBackFunc(maybeAlbum);
			}
		}
		//for some dumb reason, name and artist are not indexed.
		/*var album = obj.name;
		var query = {"select" : ["name", "artist", "total.tracks", "_id", "_kind", "thumbnails"], "orderBy": "name", "from":"com.palm.media.audio.album:1", "where":[{"prop":"artist","op":"=","val":obj.artist}]};
		m.db8_exec(query, function(albums){
			for(var i = 0; i < albums.length; i++){
				if(albums[i].name === obj.name){
					callBackFunc(albums[i]);
					break;
				}
			}
		}.bind(this));*/
	
	},
	getAlbumSongs: function(obj, callBackFunc, artist){
		var album = (obj.name)? (m.getObjType(obj) === "album")?obj.name:obj.album : obj;
		
		//doesn't order properly
		//if(!obj.artist){
			var query = {"select" : ["title", "path", "duration", "artist", "album", "genre", "thumbnails", "_id"], "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false},{"prop":"album","op":"=","val":album}]};
			if(artist){
				m.debugErr("artist provided : " + artist);
				query.where.push({"prop":"artist","op":"=","val":artist});
			}
			m.db8_exec(query, function(songs){	
				callBackFunc(songs);
			}.bind(this));		
		/*} else {
			var query = {"select" : ["title", "path", "duration", "artist", "album", "genre", "thumbnails", "_id"], "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false},{"prop":"artist","op":"=","val":obj.artist}]};
		
			m.db8_exec(query, function(array){
				var albumSongs = [];
				for(var i = 0; i < array.length; i++){
					if(array[i].album === album)
						albumSongs.push(array[i]);
				}
				callBackFunc(albumSongs);
			}.bind(this));
		}*/
	},
	getAllSongsByArtistFromSong: function(obj, callBackFunc){
		m.getArtistSongs(obj.artist, function(array_){
			var array = JSON.parse(JSON.stringify(array_));
			var newIndex;
			for(var i = 0; i < array.length; i++){
				if(array[i].title == obj.title && array[i].artist == obj.artist && obj.album == array[i].album){
					newIndex = i;
					break;
				}
			}
			callBackFunc(array, newIndex);
		}.bind(this));
	
	},
	getGenreSongs: function(obj, callBackFunc){
		var genre = (obj.name)?obj.name:obj;
		var query = {"select" : ["title", "path", "duration", "artist", "album", "genre", "thumbnails", "_id"], "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false},{"prop":"genre","op":"=","val":genre}]};
		var genreSongs = [];
		m.db8_exec(query, function(songs, done){
			genreSongs = genreSongs.concat(songs);
			if(done){
				callBackFunc(genreSongs);
			}
		}.bind(this));
	},
	getPlaylistSongs: function(playlist, callBackFunc, dontSort){
		if(playlist.songs){
			m.getObjsById(playlist.songs, function(songs){
				if(playlist.sort && playlist.sort !== "custom" && !dontSort){
					//m.debugErr("playlist.sort is " + playlist.sort);
					songs = songs.sortBy(function(s){
						return s[playlist.sort];
					}, this);
				}
				callBackFunc(songs);
			});
		}else if(playlist.songsQuery){
			m.db8_exec(playlist.songsQuery, function(results){
				var ids = [];
				for(var i = 0; i < results.length; i++){
					ids.push(results[i].id);
				}
				m.getObjsById(ids, callBackFunc);
			}.bind(this));
		}
	},
	getObjsById: function(obj_ids, callBackFunc){
		DB.get(obj_ids).then(function(future) {
			callBackFunc(future.result.results);
		}); 
	},
	
/*
 * Save/resume now playing
 */
	deferSaveNowPlaying: function(){
		var d = new Date();
		var time = m.nP["audioObj" + m.nP.cao].currentTime, songs = m.nP.songs.clone(), unshuffledSongs = m.nP.unshuffledSongs.clone(), index = m.nP.index;
		db8.merge.defer({"from":g.AppId + ".playlists:1", "where":[{"prop":"name","op":"=","val":"_now_playing"}]}, {
			time: time,
			songs: songs,
			unshuffledSongs: unshuffledSongs,
			index: index
		});
	},
	saveNowPlaying: function(){
		var d = new Date();
		db8.merge({"from":g.AppId + ".playlists:1", "where":[{"prop":"name","op":"=","val":"_now_playing"}]}, {
			time: m.nP["audioObj" + m.nP.cao].currentTime,
			songs: m.nP.songs,
			unshuffledSongs: m.nP.unshuffledSongs,
			index: m.nP.index
		});
	},
	resumeNowPlaying: function(){
		if(m.isDbSearch === false && m.launchPlayer === false){
			m.db8_exec({"select" : ["name", "time","songs", "index", "unshuffledSongs"], "from":g.AppId + ".playlists:1", "where":[{"prop":"name","op":"=","val":"_now_playing"}]}, 
			function(results){
				if(results[0].songs.length > 0){
					m.playArray(results[0].songs, results[0].index, {time: results[0].time, shuffled: (results[0].unshuffledSongs.length > 0), unshuffledSongs: results[0].unshuffledSongs.clone()});
				}
			}.bind(this));
		} else if(m.launchPlayer === true){
			m.pushPlay(true);
		}
		m.isDbSearch = false;
	},
	
/*
 *	Playlist Functions
 */ 
	getPlaylist: function(name, callBackFunc){
		var query = {"select" : ["_id", "name", "type", "songs"], "from":g.AppId + ".playlists:1", "where":[{"prop":"name","op":"=","val":name}]};
		
		m.db8_exec(query, function(playlists){
			m.getObjsById(playlists[0].songs, function(songs){
				playlists[0].songs = songs;
				callBackFunc(playlists[0]);
			}.bind(this));
		}.bind(this));
	},
	savePlaylist: function(name, playlist_obj, callBackFunc){
		
		var query = {"select" : ["name", "_id"], "from":g.AppId + ".playlists:1", "where":[{"prop":"name","op":"=","val":name}]};
		m.db8_exec(query, function(results){
			if(playlist_obj.songs[0].title){//if it is not already an array of _id's
				var songs_ = [];
				for(var i = 0; i < playlist_obj.songs.length; i++){
					songs_.push(playlist_obj.songs[i]["_id"]);
				}
				playlist_obj.songs = songs_;
			}
			playlist_obj._kind = g.AppId + ".playlists:1";
			if(results.length < 1){
				db8.put(playlist_obj, function(id){
					playlist_obj._id = id
					m.cacheSearchData(playlist_obj);
				}.bind(this));
				m.getAllPlaylists();
				if(callBackFunc)
					callBackFunc();
			}
			else {
				db8.merge({"from":g.AppId + ".playlists:1", "where":[{"prop":"name","op":"=","val":name}]}, playlist_obj);
				playlist_obj._id = results[0]._id;
				m.cacheSearchData(playlist_obj);
				m.getAllPlaylists();
				if(callBackFunc)
					callBackFunc();
			}
		}.bind(this));
	},
	delPlaylist: function(name, i){
		db8.del({"from":g.AppId + ".playlists:1", "where":[{"prop":"name","op":"=","val":name}]});
		if(i){
			m.playlists.splice(i, 1);
			m.customPlaylists.splice(i-3, 1);
		}
		else {
			for(var j = 0; j < m.playlists.length; j++){
				if(m.playlists[j].name === name){
					m.playlists.slice(j, 1);
					m.customPlaylists.splice(j-3, 1);
				}
			}
		}
		for(var j = 0; j < m.favorites.length; j++){
			if(m.getObjType(m.favorites[j]) === "playlist" && m.favorites[j].name === name){
				m.delFavorite(j);
				m.storeFavorites();
			}
		}
	},
/*
 * Favorites
 */ 
	addToFavorites: function(object){
		var obj = Object.clone(object);
		for(var i = 0; i <= m.favorites.length; i++){
			if(i > 0 && i !== m.favorites.length && obj["_id"] && obj["_id"] === m.favorites[i]._id){
				m.bannerError("You already added this!");
				break;
			}
			if(i === (m.favorites.length-1) || m.favorites.length === 0){
				db8.put({"_kind": g.AppId + ".favorites:1", "id": obj["_id"], "position": m.favorites.length}, function(){
					//m.favorites.push(obj);
					m.cacheSearchData(obj, true);
					m.bannerAlert("Added to Favorites", {action: "pushScene", scene: "list", data: "favorites"});
					m.storeFavorites();						
				});	
				break;
			}
		}
	},
	delFavorite: function(index){
		db8.del({"from":g.AppId + ".favorites:1", "where":[{"prop":"position","op":"=","val":index}]});
		m.favorites.splice(index, 1);
		m.favoriteIds.splice(index, 1);
	},
	storeFavorites: function(dontGetFavorites) {
		var favoritesWithPosition = [];
		for(var i = 0; i < m.favorites.length; i++)
			favoritesWithPosition.push({_id: m.favoriteIds[i]._id, id: m.favorites[i]._id, position: i, _kind: g.AppId + ".favorites:1"});
		
		db8.mergeArray(favoritesWithPosition, function(){
			m.getFavorites(true);
		}.bind(this));
	},
	
/*
 *	Setting up just type
 */
	search: function(searchKey, callBackFunc, filter){
		var query = {"from":g.AppId + ".data:1","where":[{"prop":"searchKey","op":"?","val":searchKey, "collate": "primary"}], "orderBy": "orderKey", "limit":50}; 
		if(filter){
			//query.orderBy = undefined;
			//query.where.push({"prop":"objType","op":"=","val":filter});
		}
		g.ServiceRequest.request("palm://com.palm.db/", {
			method: "search",
			parameters: { "query": query},
			onSuccess: function(result){
				if (result.returnValue == true){ // Success
					if(filter){
						var results = [];
						for(var i = 0; i < result.results.length; i++){
							if(result.results[i].objType === filter){
								results.push(result.results[i]);
							}
						}
						callBackFunc(results);
					} else {
						callBackFunc(result.results);
					}
				}
				else {// Failure
					m.debugErr("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
				}
			}.bind(this),
			onFailure: function(e) { m.debugErr("Search failure! Err = " + JSON.stringify(e));}
	   }); 
	
	},
	cacheArray: function(array_, callBackFunc, favorite){
		array = JSON.parse(JSON.stringify(array_));
		m.debugErr("array.length = " + array.length);
		var i = 0;
		if(!favorite)
			favorite = false;
		function cacheData(item){
			m.cacheSearchData(item, favorite, function(){
				i++;
				if(i < array.length){
					cacheData(Object.clone(array[i]));
				} else {
					callBackFunc();
				}
			}.bind(this));
		};
		if(i < array.length){
			cacheData(Object.clone(array[i]));
		} else {
			callBackFunc();
		}
		/*var formattedArray = [];

		for(var i = 0; i < array.length; i++){
			origObj = array[i];
			objType = m.getObjType(origObj);
			if(objType === "song"){
				obj = {
					"orderKey": "k",
					"searchKey": origObj.title + " " + origObj.artist + " " + origObj.album,
					"display": origObj.title,
					"secondary": origObj.artist + " - " + origObj.album
				}
			}
			else if(objType === "album"){
				obj = {
					"orderKey": "j",
					"searchKey": origObj.name + " " + origObj.artist,
					"display": origObj.name,
					"secondary": objType.capitalize() + " - " + origObj.artist + " - " + origObj.total.tracks + " Track(s)"
				}
			}else if(objType === "artist"){
				obj = {
					"orderKey": "i",
					"searchKey": origObj.name,
					"display": origObj.name,
					"secondary": objType.capitalize() + " - " + origObj.total.albums + " Album(s)" + " - " + origObj.total.tracks + " Track(s)"
				}
			}
			else if (objType === "playlist"){
				obj = {
					"orderKey": "g",
					"searchKey": origObj.name + " Playlists",
					"display": origObj.name,
					"secondary": objType.capitalize() + " - " + origObj.songs.length + " Track(s)"
				}
			}
			if(favorite){
				obj.orderKey = "a";
				obj.searchKey += " Favorites";
				if(objType !== "song")
					obj.secondary = "Favorite " + obj.secondary;
				else
					obj.secondary = "Favorite - " + obj.secondary;
			}
			obj["_kind"] = g.AppId + ".data:1";
			obj["id"] = origObj._id;			
			formattedArray.push(obj);
		}
		db8.mergeArray(formattedArray, callBackFunc);*/
	},
	cacheSearchData: function(origObj, favorite, callBackFunc){
		var d = new Date(), obj, objType = m.getObjType(origObj);
		switch(objType){
			case "song":
				obj = {
					"orderKey": "k",
					"searchKey": origObj.title + " " + origObj.artist + " " + origObj.album,
					"display": origObj.title,
					"secondary": objType.capitalize() + " - " + origObj.artist + " - " + origObj.album
				};
				break;
			case "album":
				obj = {
					"orderKey": "j",
					"searchKey": origObj.name + " " + origObj.artist,
					"display": origObj.name,
					"secondary": objType.capitalize() + " - " + origObj.artist + " - " + origObj.total.tracks + " Track(s)"
				};
				if(origObj.albumArt){
					obj.albumArt = origObj.albumArt;
				}
				break;
			case "artist":
				obj = {
					"orderKey": "i",
					"searchKey": origObj.name,
					"display": origObj.name,
					"secondary": objType.capitalize() + " - " + origObj.total.albums + " Album(s)" + " - " + origObj.total.tracks + " Track(s)"
				};
				break;
			case "playlist":
				obj = {
					"orderKey": "g",
					"searchKey": origObj.name + " Playlists",
					"display": origObj.name
				}
				if(origObj.songs){
					obj["secondary"] = objType.capitalize() + " - " + origObj.songs.length + " Track(s)";
				}else {
					obj["secondary"] = "Auto Playlist";
				}
				break;
			case "genre":
				obj = {
					"orderKey": "m",
					"searchKey": origObj.name + " Genres",
					"display": origObj.name,
					"secondary": objType.capitalize() + " - " + origObj.total.tracks + " Track(s)"
				}
				break;
		}
		if(favorite){
			obj.orderKey = "a"; //make it show up first
			obj.searchKey += " Favorites";
			obj.secondary = "Favorite " + obj.secondary;
		}
		obj.objType = objType[0] + objType[1];
		obj._kind = g.AppId + ".data:1";
		obj.id = origObj._id;
		obj.lastUpdate = Math.round(d.getTime()/60000);
		
		//function handleCache(query, obj){
		DB.find({"select" : ["id"], "from":g.AppId + ".data:1", "where":[{"prop":"id","op":"=","val":obj.id}]}, false, false).then(function(future) {
			var result = future.result;
			if (result.returnValue === true){ // Success
				if(result.results.length < 1){
					if(objType === "song"){
						obj.playCount = origObj.playCount || 0;
						obj.rating = origObj.rating || 0;
					} 
					db8.put(obj, callBackFunc);
				}
				//if(!callBackFunc)
				//	callBackFunc = function(){};
				else {
					//if(!callBackFunc)
					//	callBackFunc = function(){};
					db8.merge({"from":g.AppId + ".data:1", "where":[{"prop":"id","op":"=","val":obj.id}]}, obj, callBackFunc);	
				}
			}
			else {// Failure
				m.debugErr("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
			}
		});
		//};
		//handleCache({"select" : ["id"], "from":g.AppId + ".data:1", "where":[{"prop":"id","op":"=","val":obj.id}]}, obj);
	},
	setUpJustType: function(){
		
		var permObj = [{"type":"db.kind","object":g.AppId + ".data:1", "caller":"com.palm.launcher", "operations":{"read":"allow"}}];
		g.ServiceRequest.request("palm://com.palm.db/", {
				method: "putPermissions",
				parameters: {"permissions":permObj},
				onSuccess: function() { Mojo.Log.info("DB permission granted successfully!");},
				onFailure: function() { Mojo.Log.error("DB failed to grant permissions!");}
		});
	},
	checkJustType: function(count){
		//called from getAllSongs.
		var query = {"select" : ["_id"], "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false}], "limit": 1};
		DB.find(query, true, true).then(function(future) {
			var result = future.result;
			if(result.count){
				if((count && result.count !== count) || !count){
					m.setupCacheDashboard();
				}
				m.songCountCookie.put(result.count);
			}
			if(result.fired){
				m.setupCacheDashboard();
				m.getFavorites();
			}
		});
		
	/*	m.debugErr("checking just type");
		var query = {"select" : ["_id"], "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false}], "limit": 1};
		m.db8_exec(query, function(songs){
			if(songs.length > 0){
				m.revCookie.put(songs[0]._rev);
				m.debugErr("putting rev");				
				if(rev && songs[0]._rev > rev){
					m.debugErr("setting up cache");
					m.setupCacheDashboard();
				}
			}
		}.bind(this), true);*/
	},
	setupCacheDashboard: function(){
		dashboardStage = Mojo.Controller.getAppController().getStageController("cacheStage");
		pushDashboard = function (stageController) {
			stageController.pushScene('cache');
		};
		Mojo.Controller.getAppController().createStageWithCallback({name: "cacheStage", lightweight: true, clickableWhenLocked: true}, pushDashboard, 'dashboard');
	
	},
	setupHandleLaunchStage: function(arg){
		dashboardStage = Mojo.Controller.getAppController().getStageController("handleLanuchStage");
		pushDashboard = function (stageController) {
			stageController.pushScene('handleLaunch', arg);
		};
		Mojo.Controller.getAppController().createStageWithCallback({name: "handleLanuchStage", lightweight: true, clickableWhenLocked: true}, pushDashboard, 'card');
	
	},
	
	getSongData: function(id, callBackFunc){
		var query = {"select" : ["rating", "playCount", "lastPlayed", "bookmarks"], "from":g.AppId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]};	
		m.db8_exec(query, function(results){
			if(results.length > 0){
				callBackFunc(results[0]);
			} else {
				callBackFunc({playCount: 0, rating: 0, bookmarks: [], lastPlayed: "n/a"});
				//m.bannerError("Song details not found");
			}
		}.bind(this));
	},
	incrementPlayCount: function(id){
		query = {"select" : ["rating", "playCount", "bookmarks"], "from":g.AppId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]};
		DB.find(query, false, false).then(function(future) {
			//m.debugErr("results " + Object.toJSON(future.result.results));
			if (future.result.returnValue == true){ // Success
				var d = new Date();
				if(future.result.results.length < 1){
					m.getObjsById([id], function(results){
						if(results.length > 1){
						
							results[0].playCount = 1;
							results[0].lastPlayed = d.getTime();
							results[0].bookmarks = [];
							
							m.cacheSearchData(results[0]);
							m.debugErr("Updated Playcount for " + results[0].display);
						}
					}.bind(this))
					
				}
				else {
					obj = {
						lastPlayed: d.getTime(),
						playCount: future.result.results[0].playCount += 1
					}
					db8.merge({"from":g.AppId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]}, obj);	
					m.debugErr("Updated Playcount");
				}
			}
			else // Failure
				Mojo.Log.error("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
			
		}.bind(this));
	},
	setRating: function(id, rating, callBackFunc){
		query = {"select" : ["rating", "playCount", "bookmarks"], "from":g.AppId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]};
		DB.find(query, false, false).then(function(future) {
			//m.debugErr("results " + Object.toJSON(future.result.results));
			if (future.result.returnValue == true){ // Success
				var d = new Date();
				if(future.result.results.length < 1){
					m.getObjsById([id], function(results){
						if(results.length > 0){
							results[0].rating = rating;							
							m.cacheSearchData(results[0], callBackFunc);
							m.debugErr("Set Rating at " + rating + " for " + results[0].display);
						}
					}.bind(this));
				}
				else {
					obj = {
						rating: rating
					}
					db8.merge({"from":g.AppId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]}, obj, callBackFunc);	
					m.debugErr("Set Rating at " + rating);
				}
			}
			else // Failure
				m.debugErr("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
			
		}.bind(this));
	},
	setAlbumArt: function(album, artist, image, callBackFunc){
		//m.getAlbumSongs({name: album, artist: artist, _kind: "com.palm.media.audio.album:1"}, function(array){
			m.getAlbum({name: album, artist: artist, _kind: "com.palm.media.audio.album:1"}, function(albumObj){
				//array.push(albumObj);
				//for(var i = 0; i < array.length; i++){
					//array[i].albumArt = image;
				//};
				//m.cacheArray(array, callBackFunc)
				albumObj.albumArt = image;
				m.cacheSearchData(albumObj, false, function(){
					m.getCustomAlbumArt(callBackFunc);
				
				});
			});
		//});
	},
	clearAlbumArt: function(album, artist, callBackFunc){
		m.getAlbum({name: album, artist: artist, _kind: "com.palm.media.audio.album:1"}, function(albumObj){
			DB.del({"from":g.AppId + ".data:1", "where":[{"prop":"lastUpdate","op":"<","val":oldStuff}]});

		});
	},
	getCustomAlbumArt: function(callBackFunc){
		m.customAlbumArt = [];
		var query = {"select" : ["id", "albumArt"], "from":g.AppId + ".data:1", "where":[{"prop":"objType","op":"=","val":"al"}]};
		m.db8_exec(query, function(results){
			var albumArtIds = [], albumArt = []
			results.each(function(item, index){
				if(item.albumArt && item.albumArt !== "undefined"){
					albumArtIds.push(item.id);
					albumArt.push(item);
				}			
			}, this);
			if(albumArtIds.length > 0){
				m.getObjsById(albumArtIds, function(albums){
					albums.each(function(item, index){
						if(item._id === albumArt[index].id){
							item.albumArt = albumArt[index].albumArt;
						} else {
							m.debugErr("Wrong Id. Crap.");
						}
					}, this);
					Object.extend(m.customAlbumArt, albums);
					if(callBackFunc){
						callBackFunc();
					}
				});
			} else {
				if(callBackFunc){
					callBackFunc();
				}
			}
			/*for(var i = 0; i < results.length; i++){
				
			
			}
			//Mojo.Log.error(Object.toJSON(results));
			if(results.length > 0 && results[0].albumArt){
				//imgObj.src = results[0].albumArt;
				callBackFunc(results[0].albumArt);
			} else {
				callBackFunc(m.getQuickAlbumArt(thumbnail));
			}*/
		}.bind(this));
	
	},
	getDefaultAlbumArt: function(thumbnail){
		var length = (Mojo.Environment.DeviceInfo.screenHeight === 400) ? "195" : (Mojo.Environment.DeviceInfo.screenHeight === 800) ? "406" : "275";
		var widthHeightString = ":" + length + ":" + length;
		
		if(thumbnail && thumbnail.data){
				return(thumbnail.type === "embedded")?
					("/var/luna/data/extractfs" + encodeURIComponent(thumbnail.data) + widthHeightString + ":3").replace(/'/g, "&#39;").replace(/"/g, "&#34;")
					:
					thumbnail.data.replace(/'/g, "&#39;").replace(/"/g, "&#34;");
		}
		else  {
			return "images/play/default-album-art.png";
		}
	
	},
	getAlbumArt: function(song, small){
		if(!song.album){
			song.album = song.name;
		}
		var album, maybeAlbum;
		for(var i = 0; i < m.customAlbumArt.length; i++){	
			if(m.customAlbumArt[i].name === song.album){//same album name
				if(m.customAlbumArt[i].artist === song.artist){//same artist, is for sure right album we want
					album =  m.customAlbumArt[i];
					break;
				} else {
					maybeAlbum = m.customAlbumArt[i];//diff artist, could be media indexing issue, or could be wrong album.. cache it for later
				}
			}
		}
		if(album === undefined && maybeAlbum !== undefined){
			album = maybeAlbum;//well since we didn't find the same album with the same artist, give the maybeAlbum
		}
		/*var album = m.customAlbumArt.find(function(item){
			if(item.name === song.name){//same album name
				if(item.artist === song.artist){//same artist, is for sure right album we want
					if(!callBackFunc){
						return m.albums[i];
					} else {
						callBackFunc(m.albums[i]);
						return;
					}
					break;
				} else {
					maybeAlbum = m.albums[i];//diff artist, could be media indexing issue, or could be wrong album.. cache it for later
				}
			}
			return (item.name === song.album && item.artist === song.artist);
		}, this);*/
		if(album !== undefined && album.albumArt){
			return album.albumArt;
		} else {
			return m.getDefaultAlbumArt(song.thumbnails[0]);
		}
		/*var query = {"select" : ["display", "albumArt"], "from":g.AppId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]};
		m.db8_exec(query, function(results){
			//Mojo.Log.error(Object.toJSON(results));
			if(results.length > 0 && results[0].albumArt){
				//imgObj.src = results[0].albumArt;
				callBackFunc(results[0].albumArt);
			} else {
				callBackFunc(m.getQuickAlbumArt(thumbnail));
			}
		}.bind(this));*/
	},
	hasCustomAlbumArt: function(song){
		if(!song.album){
			song.album = song.name;
		}
		var album, maybeAlbum;
		for(var i = 0; i < m.customAlbumArt.length; i++){	
			if(m.customAlbumArt[i].name === song.album){//same album name
				if(m.customAlbumArt[i].artist === song.artist){//same artist, is for sure right album we want
					album =  m.customAlbumArt[i];
					break;
				} else {
					maybeAlbum = m.customAlbumArt[i];//diff artist, could be media indexing issue, or could be wrong album.. cache it for later
				}
			}
		}
		if(album === undefined && maybeAlbum !== undefined){
			album = maybeAlbum;//well since we didn't find the same album with the same artist, give the maybeAlbum
		}
		/*var album = m.customAlbumArt.find(function(item){
			return (item.name === song.album && item.artist === song.artist);
		}, this);*/
		if(album){
			return true;
		} else {
			return false;
		}
	},
	getArrayOfAlbumArt: function(array, callBackFunc){
		var i = 0;
		var getAlbumArt = function getAlbumArt(item){
			if(item){
				m.getAlbumArt(item._id, item.thumbnails[0], true, function(albumArt){
					item.albumArt = albumArt;
					i++;
					if(i < array.length){
						getAlbumArt(array[i]);
					} else {
						callBackFunc();
					}
				}.bind(this));
			} else {
				callbackFunc();
			}
		}.bind(this);
		
		if(i < array.length){
			getAlbumArt(array[i]);
		} else {
			callBackFunc()
		}
	
	},
	
/*
 *	Array Functions
 */
	view: function(obj, array){
		var objType =(obj.type)? obj.type : m.getObjType(obj);
		if(objType ==="artist"){
			m.viewArtist(obj.name);
		} else if(objType === "album"){
			m.viewAlbum(obj);
		} else {
			m.viewArray(obj, array);
		}
		
	},
	viewArtist: function(artist){
		m.getFormattedArtistSongs(artist, function(formattedSongs, songs, error){
			if(!error){
				Mojo.Controller.getAppController().getStageController("cardStage").pushScene("artist-view", {name: artist, albums: formattedSongs, songs: songs, _kind: "com.palm.media.audio.artist:1"}, focus);
			} else if(error) {
				/*if(focus){
					m.getAlbumSongs({album: focus}, function(albumSongs){
						m.viewArray({name: focus, _kind: "com.palm.media.audio.album:1"}, albumSongs)
					}.bind(this));
				} else {
					m.viewArray({name: artist, _kind: "com.palm.media.audio.artist:1"}, songs);
				}*/
			}
		}.bind(this));
	},
	viewAlbum: function(album_){
		var album = (album_.artist) ? album_ : m.getAlbum({name: album_, artist: ""});
		m.debugErr("album.artist " + album.artist);
		m.getFormattedArtistSongs(album.artist, function(formattedSongs, songs, error){
			if(!error){
				Mojo.Controller.getAppController().getStageController("cardStage").pushScene("artist-view", {name: album.artist, albums: formattedSongs, songs: songs, _kind: "com.palm.media.audio.artist:1"}, album.name);
			}
		}.bind(this), album.name);
		//m.getAllAlbumsByArtist(
		/*m.getAlbumSongs(album_, function(songs){
			//albums.push
			album.songs = songs;
			album.open = true;
			albums.push(album);
			m.getArtistSongs
			//Mojo.Controller.getAppController().getStageController("cardStage").pushScene("artist-view", {name: album.artist, albums: albums, songs: songs, _kind: "com.palm.media.audio.artist:1"}, album.name);

		}.bind(this));*/
	},
	viewArray: function(titleObj, array, focus){
		Mojo.Controller.getAppController().getStageController("cardStage").pushScene("view", titleObj, array, focus);
	},
	playArray: function(array, index, arg){
		//var d = new Date();
		//milliseconds = d.getTime();

		if(m.nP.songs.length > 0){
			//m.saveNowPlaying();//save old songs
			m.deferSaveNowPlaying();
			m.hasSavedOldNowPlaying = true;
		}
		
		//var d = new Date();
		//m.debugErr((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after deffering save now playing");	
		

		//array = JSON.parse(JSON.stringify(array_));
		
		//var d = new Date();
		//m.debugErr((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after cloning array");	
		
		if(g.AppId === "com.tibfib.app.koto.lite"){
			if(array.length > 10){
				if(index >= 1){
					if(array.length-1 - index >= 9){
						array = array.slice(index - 1, index + 9);
						index = 1;
					} else {
						var oldLength = array.length;
						array = array.slice(-10);
						index = 9 - (oldLength-1 - index);
					}
				}else {
					array = array.slice(index, index + 10);
					index = 0;
				}
			}
			
			
			/*if((array.length-1 - index) <= 8){//if there are less than 8 items beyond
				array = array.slice(index - (8 - array.length-1 - index), array.length - 1);
				index = (5 - array.length-1 - index) + 5;
			} else {
				array = array.slice(index-5, index+5);
				index = 4;
			}*/
			
		}
		
		if(array.length < 1){ return;}
		//if(m.nP.songs[m.nP.index] && m.nP.songs[m.nP.index].active){
		//	m.nP.songs[m.nP.index].active = undefined;
		//}
		m.nP.unshuffledSongs.clear();
		if(arg && arg.shuffled && arg.unshuffledSongs){
			Object.extend(m.nP.unshuffledSongs, arg.unshuffledSongs);
		}
		
		//var d = new Date();
		//m.debugErr((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after setting up unshuffled songs");	
		
		m.nP.songs.clear();
		
		Object.extend(m.nP.songs, array);
		m.nP.index = index;
		//m.nP.songs[m.nP.index].active = true;
		m.nP.playing = true;
		m.nP.repeat = m.prefs.defaultRepeat;
		
		//var d = new Date();
		//m.debugErr((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after setting up nP object");	
		
		m.pushPlay();
		
		//var d = new Date();
		//m.debugErr((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after pushing play");	
		
		
		if(arg && arg.time){
			m.playSong(m.nP.songs[m.nP.index].path, arg.time);
		}
		else {
			m.playSong(m.nP.songs[m.nP.index].path);
		}
		
		//var d = new Date();
		//m.debugErr((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after playing song");	
		
	},
	/*Play Array functions*/
	playArrayNext: function(array){
		//array = JSON.parse(JSON.stringify(array_));
		
		/*var i = 0;
		while(i < array.length){
			for(var k = 0; k < m.nP.songs.length; k++){
				if(m.nP.songs[k].title == array[i].title && m.nP.songs[k].artist == array[i].artist && m.nP.songs[k].album == array[i].album && m.nP.songs[m.nP.index].title !== m.nP.songs[k].title){
					if(k < m.nP.index)
						m.nP.index--;
					m.nP.songs.splice(k, 1);
					break;
				}
			}
			if(m.nP.songs[m.nP.index].title === array[i].title)
				array.splice(i, 1);
			else
				i++;
		}*/
		var firstArray = m.nP.songs.slice(0, m.nP.index+1);
		var secondArray = m.nP.songs.slice(m.nP.index+1);
		m.nP.songs.clear();
		Object.extend(m.nP.songs, firstArray.concat(array, secondArray));
		this.liteCheck();
	},
	playArrayLast: function(array){
		//array = JSON.parse(JSON.stringify(array_));
		/*var i = 0;
		while(i < array.length){
			for(var k = 0; k < m.nP.songs.length; k++){
				if(m.nP.songs[k].title == array[i].title && m.nP.songs[k].artist == array[i].artist && m.nP.songs[k].album == array[i].album && m.nP.songs[m.nP.index].title !== m.nP.songs[k].title){
					if(k < m.nP.index)
						m.nP.index--;
					m.nP.songs.splice(k, 1);
					break;
				}
			}
			if(m.nP.songs[m.nP.index].title === array[i].title)
				array.splice(i, 1);
			else
				i++;
		}*/
		var origSongs = m.nP.songs.clone();
		m.nP.songs.clear();
		Object.extend(m.nP.songs, origSongs.concat(array));
		this.liteCheck();
		
	},
	shufflePlay: function(array){
		//array = JSON.parse(JSON.stringify(array_));
		if(g.AppId === "com.tibfib.app.koto.lite"){
			array = array.slice(0, 10);
		}
		m.playArray(m.shuffle(array.clone()), 0, {shuffled: true, unshuffledSongs: array});
	},
	shuffleNowPlaying: function(){
		m.nP.unshuffledSongs.clear();
		Object.extend(m.nP.unshuffledSongs, m.nP.songs.clone());
		var nowPlayingItem = m.nP.songs.splice(m.nP.index, 1)[0];
		var newSongs = m.nP.songs.clone();
		m.nP.songs.clear();
		Object.extend(m.nP.songs, m.shuffle(newSongs));
		m.nP.songs.unshift(nowPlayingItem);
		m.nP.index = 0;
		
	},
	unshuffleNowPlaying: function(){
		var currentSong = m.nP.songs[m.nP.index];
		m.nP.songs.clear();
		Object.extend(m.nP.songs, m.nP.unshuffledSongs.clone());
		for(var i = 0; i < m.nP.songs.length; i++){
			if(currentSong.title == m.nP.songs[i].title && currentSong.artist == m.nP.songs[i].artist && currentSong.album == m.nP.songs[i].album){
				m.nP.index = i;
				//m.nP.songs[m.nP.index].active = true;
				m.nP.unshuffledSongs.clear();
				break;
			}
		}
	},
	
	liteCheck: function(){
		if(g.AppId === "com.tibfib.app.koto.lite"){
			if(m.nP.songs.length > 10){
				if(m.nP.index >= 1){
					if(m.nP.songs.length-1 - m.nP.index >= 9){
						m.nP.songs = m.nP.songs.slice(m.nP.index - 1, m.nP.index + 9);
						m.nP.index = 1;
					} else {
						var oldLength = m.nP.songs.length;
						m.nP.songs = m.nP.songs.slice(-10);
						m.nP.index = 9 - (oldLength-1 - m.nP.index);
					}
				}else {
					m.nP.songs = m.nP.songs.slice(m.nP.index, m.nP.index + 10);
					m.nP.index = 0;
				}
			}
		}
	},	
/*
 * Audio Functions
 */
	pause: function(){
		m.nP["audioObj" + m.nP.cao].pause();
		//m.nP.playing = false;
		//m.handlePause();//delegates("_pause") called automagically from .pause()
		
	},
	resume: function(){
		if(getFileInfo(m.nP.songs[m.nP.index].path).extension !== ".m4p"){
			m.nP["audioObj" + m.nP.cao].play();
		}
		//m.nP.playing = true;
		//m.handlePlay();//delegates("_resume");
		
	},
	pushPlay: function(justPush){
		var stageController = Mojo.Controller.getAppController().getStageController("cardStage");
		if(justPush){
			stageController.pushScene("play");
		} else {
			if(stageController.activeScene().sceneName !== "play"){
				var playPushed, scenes = stageController.getScenes();
				for(var i = 0; i < scenes.length; i++){
					if(scenes[i].sceneName === "play"){
						playPushed = true;
						break;
					}
				}
				if(playPushed !== true){
					stageController.pushScene("play");
				}else {
					stageController.popScenesTo("play");
					stageController.swapScene({name: "play", transition: Mojo.Transition.zoomFade});

				}
			}
			else {
				stageController.swapScene({name: "play", transition: Mojo.Transition.crossFade});		
			}	
		}		
	},
	playSong: function(path, time, play, previousOrNext){
		if(m.nP["audioObj" + m.nP.cao].currentSrc){
			m.nP["audioObj" + m.nP.cao].pause();
			m.nP["audioObj" + m.nP.cao].src = null;
		}
		var extension = getFileInfo(path).extension;
		if(extension === ".m4p"){
			setTimeout(function(){
				if(previousOrNext && previousOrNext === "previous"){
					m.playPrevious(true);
				} else {
					m.playNext(false, true);
				}
			}, 500);
			return;
		}
		m.nP["audioObj" + m.nP.cao].src = path;
		m.nP["audioObj" + m.nP.cao].load();
		if(((play !== undefined && play !== false) || play === undefined)){
			m.nP["audioObj" + m.nP.cao].play();
			m.nP.playing = true;
		}

		var changeCurrentTime = function(){
			if(time){
				m.nP["audioObj" + m.nP.cao].currentTime = time;
			}else {
				m.nP["audioObj" + m.nP.cao].currentTime = 0;
			}
			if(play !== undefined && play === false){
				m.delegate("_updateProgress");
			}
			m.nP["audioObj" + m.nP.cao].removeEventListener("loadeddata", changeCurrentTime);
		}.bind(this);
		
		m.nP["audioObj" + m.nP.cao].addEventListener("loadeddata", changeCurrentTime);
		//m.nP["audioObj" + m.nP.cao].addEventListener("error", m.playNext.bind(this), true);

		//if(m.prefs.lastfm.sessionKey !== "" && m.prefs.lastfm.scrobble === true){
		//	lastfm.scrobble(m.nP.songs[m.nP.index]);
		//}
		if(m.prefs.lastfm.sessionKey !== "" && m.prefs.lastfm.scrobble === true){
			lastfm.updateNowPlaying();
		}
		  
	},
	playLoadedSong: function(){
		m.swapAudioObjs();
		var otherAO = (m.nP.cao === "one") ? "two": "one";
		if(m.nP["audioObj" + m.nP.cao].currentSrc === m.nP["audioObj" + otherAO].currentSrc){
			m.playNext();
			m.debugErr("playing next instead of loading");
		}else {
			m.resume();

			//m.nP.songs[m.nP.index].active = undefined;
			if(m.nP.index !== m.nP.songs.length-1){
				m.nP.index++;
			}else {
				m.nP.index = 0;
			};
			//m.nP.songs[m.nP.index].active = true;
			if(m.nP.repeat > 0){
				if(m.nP.repeat === 1){
					m.nP.repeat = 0;
				}
			}else {
				m.stop();
			}
			m.delegate("_playNext");
			m.updateDashboard();
			
			if(m.prefs.lastfm.sessionKey !== "" && m.prefs.lastfm.scrobble === true){
				lastfm.updateNowPlaying();
			}
		}

	},
	loadSong: function(path, cao){
		if(m.nP["audioObj" + cao].currentSrc){
			m.nP["audioObj" + cao].pause();
			m.nP["audioObj" + cao].src = null;
		}
		m.nP["audioObj" + cao].src = path;
		m.nP["audioObj" + cao].load();
		m.nP["audioObj" + cao].pause();

		/*changeCurrentTime = function(){
			if(time){
				m.nP["audioObj" + m.nP.cao].currentTime = time;
			}else {
				m.nP["audioObj" + m.nP.cao].currentTime = 0;
			}
			if(play !== undefined && play === false){
				m.delegate("_updateProgress");
			}
			m.nP["audioObj" + m.nP.cao].removeEventListener("loadeddata", changeCurrentTime);
		}.bind(this);
		m.nP["audioObj" + m.nP.cao].addEventListener("loadeddata", changeCurrentTime);*/
			  
	},
	loadNext: function (){
		if(m.nP.index !== m.nP.songs.length-1){
			nextIndex = (m.nP.index + 1);
		}else {
			nextIndex = 0;
		}

		if(m.nP.playing === true){
			m.loadSong(m.nP.songs[nextIndex].path, ((m.nP.cao === "one")?"two":"one"));
		}
	},
	playNext: function(ended, play){
		//try {
		//	m.nP.songs[m.nP.index].active = undefined;
		//}catch(e){}//if the user deletes the first song that is currently playing
		var oldIndex = m.nP.index;
		if(m.nP.index !== m.nP.songs.length-1){
			m.nP.index++;
		}else {
			m.nP.index = 0;
		}
		//m.nP.songs[m.nP.index].active = true;
		m.delegate("_playNext", ended);
		if(m.nP.playing === true){
			if(oldIndex === m.nP.songs.length-1 && ended){
				if(m.nP.repeat > 0){
					m.playSong(m.nP.songs[m.nP.index].path, 0, play, "next");
					if(m.nP.repeat === 1){
						m.nP.repeat = 0;
					}	
				}else {
					m.stop();
				}
			} 
			else {
				try {
					m.playSong(m.nP.songs[m.nP.index].path, 0, play, "next");
				}catch(e){m.debugErr("tried to play song: " + e)};
			}
		}else {
			try {
				m.playSong(m.nP.songs[m.nP.index].path, 0, (play !== undefined)? play: false, "next");
			}catch(e){m.debugErr("tried to play song: " + e)};
		}
		if(ended){
			m.updateDashboard();
		}
		//m.nP["audioObj" + m.nP.cao].removeEventListener("error", m.playNext.bind(this), true);

	},
	playPrevious: function(){
		if (m.nP["audioObj" + m.nP.cao].currentTime > 5){
			m.nP["audioObj" + m.nP.cao].currentTime = 0;
			if(m.nP.playing === false){
				m.delegate("_updateProgress");//just in case
			}
		}
		else{
			//m.nP.songs[m.nP.index].active = undefined;
			if(m.nP.index > 0){
				m.nP.index--;
			}else {
				m.nP.index = m.nP.songs.length-1;
			}
			//m.nP.songs[m.nP.index].active = true;
			try {
				m.playSong(m.nP.songs[m.nP.index].path, undefined, undefined, "previous");
			}catch(e){m.debugErr(e)};

			m.delegate("_playPrevious");
		}
		//m.nP["audioObj" + m.nP.cao].removeEventListener("error", m.playNext.bind(this), true);
	
	},
	stop: function(){
		m.nP["audioObj" + m.nP.cao].pause();
		//m.nP.songs[m.nP.index].active = undefined;
		m.nP.index = 0;
		//m.nP.songs[m.nP.index].active = true;
		m.nP["audioObj" + m.nP.cao].src = m.nP.songs[0].path;
		m.nP["audioObj" + m.nP.cao].load();
		m.nP["audioObj" + m.nP.cao].pause();
		//m.nP["audioObj" + m.nP.cao].currentTime = 0;
		m.nP.playing = false;
		m.delegate("_stop");
	},
	
/*
 * Handle Audio Functions
 */
	handlePlay: function(){	
		m.nP.playing = true;
		m.delegate("_resume");
		m.updateDashboard();
	},
	handlePause: function(){
		m.nP.playing = false;
		m.delegate("_pause");
		m.updateDashboard();
	},


/*
 *	Dashboard
 */
	showDashboard: function(){
		if(m.prefs.useDashboard){
			dashboardStage = Mojo.Controller.getAppController().getStageController("dashboardStage");
			if(dashboardStage) 
				dashboardStage.delegateToSceneAssistant("displayDashboard");
			else{
				pushDashboard = function (stageController) {
					stageController.pushScene('dashboard');
				};
				Mojo.Controller.getAppController().createStageWithCallback({name: "dashboardStage", lightweight: true, clickableWhenLocked: true}, pushDashboard, 'dashboard');
			}
		}
	},
	hideDashboard: function(){
		Mojo.Controller.getAppController().closeStage("dashboardStage");
	},
	
	
	
/*
 * Alerts
 */
	dialogAlert: function(alert){
	
	
	},
	dialogError: function(error){
		if(Mojo.Controller.getAppController().getActiveStageController().activeScene()){
			var window = Mojo.Controller.getAppController().getActiveStageController().activeScene().window;
			Mojo.Controller.errorDialog(error, window);
		}else
			m.bannerError(error);
	},
	bannerAlert: function(msg, params){
		launchParams = params || {action: "nothing"};
		Mojo.Controller.getAppController().showBanner({messageText: msg}, launchParams, "notification");	
	},
	bannerError: function(error, params){
		launchParams = params || {action: "nothing"};
		Mojo.Controller.getAppController().showBanner({messageText: error, icon: 'images/error-icon.png'}, launchParams, "error");	
	},

/*
 * Debug Functions
 */
	log_nP: function(){
		m.log("index is \""+ m.nP.index + "\" so playing \"" + m.nP.songs[m.nP.index].title + "\", length of songs is : \"" + m.nP.songs.length + "\", current item is : " + Object.toJSON(m.nP.songs[m.nP.index]));
	},
	log: function(string){
		//Comment out on release
		Mojo.Log.info(string);
	},
	debugObj: function(prefix, obj){
		//m.debugErr(prefix + ": " + Object.toJSON(obj));
	},
	debugObjFull: function(obj){
		for(var i in obj) {
			m.debugErr('OBJECT ITERATION: ' + i + ' : ' + obj[i]);
		}	
	},
	debugErr: function(string){
		Mojo.Log.error(string);
	}
};

db8 = ({
	domain: g.AppId,
	kinds: [
		{
			"kindID": g.AppId + ".playlists:1",
			//"name": "playlists",
			"indices": [
				{"name": "name", "props": [{"name": "name", "type":"single"}]},
				{"name": "type", "props": [{"name": "type", "type":"single"}]}
			]
		},
		{
			"kindID": g.AppId + ".favorites:1",
			//"name": "playlists",
			"indices": [
				{"name": "id", "props": [{"name": "id", "type":"single"}]},
				{"name": "position", "props": [{"name": "position", "type":"single"}]}
			]
		},
		{
			"kindID": g.AppId + ".data:1",
			"indices": [
				{"name": "id", "props": [{"name": "id", "type":"single"}]}, //obj _id
				{"name": "lastUpdate", "props": [{"name": "lastUpdate", "type":"single"}]},
				
				{"name": "searchKey", "props": [
					{"name": "searchKey", "type":"single", "tokenize": "all", "collate": "primary"}
				]}, //search key for just type
				{"name": "objType", "props": [{"name": "objType", "type":"single"}]}, 				
				{"name": "orderKey", "props": [{"name": "orderKey", "type":"single"}]}, 
				{"name": "display", "props": [{"name": "display", "type":"single"}]}, 
				{"name": "secondary", "props": [{"name": "secondary", "type":"single"}]}, 
				
				{"name": "playCount", "props": [{"name": "playCount"}]},
				{"name": "lastPlayed", "props": [{"name": "lastPlayed"}]}, 
				{"name": "rating", "props": [{"name": "rating"}]} 
			]
		},
	],
	setup: function(){
		this.putKinds();	
	},
	putKinds: function() {
		/*var quickCookie = new Mojo.Model.Cookie('quickCookie_mojoPlayer');
		if(!quickCookie || (quickCookie && quickCookie.get() !== Mojo.Controller.appInfo.version)){
			DB.delKind(g.AppId + ".data:1").then(function(future) {
				var result = future.result;
				if (result.returnValue == true)           
					Mojo.Log.info("delKind success");
				else{  
					result = future.exception;
					Mojo.Log.info("delKind failure: Err code=" + result.errorCode + "Err message=" + result.message); 
				}
			});
			quickCookie.put(Mojo.Controller.appInfo.version);
			//m.setupCacheDashboard();
		}*/
		
		for( var i = 0; i < this.kinds.length; i++ ) {
			DB.putKind(this.kinds[i].kindID, this.domain, this.kinds[i].indices).then(function(future){
				if (future.result.returnValue === false) {
				   m.debugErr("putKind Failure.");
				}
			}.bind(this));
			if(i === (this.kinds.length-1))
				this.putOrigObjs();
		}
	},
	putOrigObjs: function(){
		var query = {"select" : ["name"], "from":g.AppId + ".playlists:1", "where":[{"prop":"name","op":"=","val":"_now_playing"}]};
		m.db8_exec(query, function(results){
			if(results.length < 1){
				db8.put({
					_kind: g.AppId + ".playlists:1",
					name: "_now_playing",
					type: "hide",
					songs: m.nP.songs.clone(),
					unshuffledSongs: m.nP.unshuffledSongs.clone(),
					index: m.nP.index
				});
			}
		}.bind(this));
		
		var query = {"select" : ["name"], "from":g.AppId + ".playlists:1", "where":[{"prop":"type","op":"=","val":"auto"}]};
		m.db8_exec(query, function(results){
			if(results.length < 3){
				db8.putArray(
				[
					{
						_kind: g.AppId + ".playlists:1",
						name: "Top Rated",
						type: "auto",
						songsQuery: {"select" : ["id"], "from":g.AppId + ".data:1", "where":[{"prop":"rating","op":">","val":0}], "orderBy":"rating", "desc": true}
					},
					{
						_kind: g.AppId + ".playlists:1",
						name: "Most Played",
						type: "auto",
						songsQuery: {"select" : ["id"], "from":g.AppId + ".data:1", "where":[{"prop":"playCount","op":">","val":0}], "orderBy":"playCount", "desc": true}
					},
					{
						_kind: g.AppId + ".playlists:1",
						name: "Recently Played",
						type: "auto",
						songsQuery: {"select" : ["id"], "from":g.AppId + ".data:1", "where":[{"prop":"lastPlayed","op":">","val":0}], "orderBy":"lastPlayed", "desc": true}
					}				
				]);
			}
		}.bind(this));
	},
	put: function(object, callBackFunc){
		DB.put([object]).then(function(future){
			var result = future.result;
			if (result.returnValue == true){
				if(callBackFunc)
					callBackFunc(result.results[0].id);
					//m.log("put success, c.id="+result.results[0].id+", c.rev="+result.results[0].rev);			
			}
			else
				m.debugErr("put failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
	   });
	},
	putArray: function(array, callBackFunc){
		DB.put(array).then(function(future){
			var result = future.result;
			if (result.returnValue == true){
				if(callBackFunc)
					callBackFunc();
					//m.log("put success, c.id="+result.results[0].id+", c.rev="+result.results[0].rev);			
			}
			else
				m.debugErr("put failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
	   });
	},
	mergeArray: function(array, callBackFunc){
		DB.merge(array).then(function(future) {
			if (future.result.returnValue == true){
				if(callBackFunc)
					callBackFunc();
				//m.debugErr("merge success, number updated = "+future.result.results.length);
			}else
				m.debugErr("merge failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
		});
	},
	merge: function(query, updatedProps, callBackFunc){
		DB.merge(query, updatedProps).then(function(future) {
			if (future.result.returnValue == true){
				if(callBackFunc)
					callBackFunc();
				//m.log("merge success, number updated = "+future.result.count);
			}else
				m.debugErr("merge failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
		});
	},
	del: function(query){
		DB.del(query).then(function(future) {
			//if (future.result.returnValue == true)           
				//m.log("del success");
			//else
				//m.log("del failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
		}); 
	}
});