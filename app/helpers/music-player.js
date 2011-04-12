try { 
	var libraries = MojoLoader.require({name: "foundations", version: "1.0"}); 
	var Future = libraries.foundations.Control.Future; // Futures library 
	var DB = libraries.foundations.Data.DB; // db8 wrapper library 
} catch (Error) { Mojo.Log.error(Error); }
//var milliseconds;
var m = {
/*
 * Variables
 */

	songCountCookie: new Mojo.Model.Cookie("songCount_KotoPlayer"),
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
			
			for .8
			-pick album art from now playing scene
			-m3u playlists
			-add "list item" for "Resume Now Playing"
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
		
		Mojo.Controller.getAppController().getStageController("cardStage").loadStylesheet("stylesheets/" + koto.preferences.obj.theme + ".css");
	
		if (koto.preferences.obj.saveAndResume === true || m.launchPlayer){
			if (!arg || (arg && !arg.fromStartup)){
				m.resumeNowPlaying();
			}
		}
		if ((!arg || (arg && !arg.dontLoadSongs)) && !m.launchPlayer){
			koto.albumArt.loadCustom(m.getPermissions.bind(this));
		}
		
		if (!m.launchPlayer){
			m.launchPlayer = false;

			m.loadContent();
			koto.justType.setup.defer();
			m.setUpAudioObjs();
			m.setUpControlListeners();
	
		} else {
			//Mojo.Controller.getAppController().getStageController("cardStage").getScenes()[0].assistant.loaded();
		}
	},
	cleanup: function(){
		koto.nowPlaying.currentInfo.audioObj.removeEventListener("pause", m.handlePause.bind(this), true);
		koto.nowPlaying.currentInfo.audioObj.removeEventListener("play", m.handlePlay.bind(this), true);
		koto.nowPlaying.currentInfo.audioObj.removeEventListener("ended", m.endedSong.bind(this), true);
		koto.nowPlaying.currentInfo.audioObj.removeEventListener("error", m.playNext.bind(this), true);
		koto.nowPlaying.currentInfo.audioObj.removeEventListener("timeupdate", m.timeUpdate.bind(this), true);
	},
/*
 * Utilities Functions
 */ 
	
	buyKoto: function(){
		var launchParams = {
			id: "com.palm.app.findapps",
			params: {'target': "http://developer.palm.com/appredirect/?packageid=com.tibfib.app.koto"}
		};
		koto.serviceRequest.request('palm://com.palm.applicationManager',{
			method: 'open',
			parameters: launchParams
		});
	},
	updateDashboard: function(){
		if (Mojo.Controller.getAppController().getStageController("dashboardStage")){
			Mojo.Controller.getAppController().getStageController("dashboardStage").delegateToSceneAssistant("displayDashboard");
		}
	},
	
	getM3UPlaylists: function(callback){
		var query = { "select" : ["name", "path", "songIds", "_id"], "from":"com.palm.media.playlist.object:1"};
		//db8.exec(query, handlePlaylists.bind(this));	
		function handlePlaylists(array){
			var i = 0;//Dunno if this works....
			while(i < array.length){
				db8.getObjsById(array[i].songIds, function(songs){
					array[i].songs = songs;
					i++;
				}.bind(this)); 
				if ((i) === array.length){
					m.playlists += array;
				}
			}
		}
	},
	
/*
 * Save/resume now playing
 */
	deferSaveNowPlaying: function(){
		var d = new Date();
		var time = koto.nowPlaying.currentInfo.audioObj.currentTime, songs = koto.nowPlaying.currentInfo.songs.clone(), unshuffledSongs = koto.nowPlaying.currentInfo.unshuffledSongs.clone(), index = koto.nowPlaying.currentInfo.index;
		db8.merge.defer({"from":koto.appId + ".playlists:1", "where":[{"prop":"name","op":"=","val":"_now_playing"}]}, {
			time: time,
			songs: songs,
			unshuffledSongs: unshuffledSongs,
			index: index
		});
	},
	saveNowPlaying: function(){
		var d = new Date();
		db8.merge({"from":koto.appId + ".playlists:1", "where":[{"prop":"name","op":"=","val":"_now_playing"}]}, {
			time: koto.nowPlaying.currentInfo.audioObj.currentTime,
			songs: koto.nowPlaying.currentInfo.songs,
			unshuffledSongs: koto.nowPlaying.currentInfo.unshuffledSongs,
			index: koto.nowPlaying.currentInfo.index
		});
	},
	resumeNowPlaying: function(){
		if (m.isDbSearch === false && m.launchPlayer === false){
			db8.exec({"select" : ["name", "time","songs", "index", "unshuffledSongs"], "from":koto.appId + ".playlists:1", "where":[{"prop":"name","op":"=","val":"_now_playing"}]}, 
			function(results){
				if (results[0].songs.length > 0){
					m.playArray(results[0].songs, results[0].index, {time: results[0].time, shuffled: (results[0].unshuffledSongs.length > 0), unshuffledSongs: results[0].unshuffledSongs.clone()});
				}
			}.bind(this));
		} else if (m.launchPlayer === true){
			m.pushPlay(true);
		}
		m.isDbSearch = false;
	},
	
/*
 *	Setting up just type
 */
	
	setupHandleLaunchStage: function(arg){
		dashboardStage = Mojo.Controller.getAppController().getStageController("handleLanuchStage");
		pushDashboard = function (stageController) {
			stageController.pushScene('handleLaunch', arg);
		};
		Mojo.Controller.getAppController().createStageWithCallback({name: "handleLanuchStage", lightweight: true, clickableWhenLocked: true}, pushDashboard, 'card');
	
	},
	
	getSongData: function(id, callback){
		var query = {"select" : ["rating", "playCount", "lastPlayed", "bookmarks"], "from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]};	
		db8.exec(query, function(results){
			if (results.length > 0){
				callback(results[0]);
			} else {
				callback({playCount: 0, rating: 0, bookmarks: [], lastPlayed: "n/a"});
				//m.bannerError("Song details not found");
			}
		}.bind(this));
	},
	incrementPlayCount: function(id){
		query = {"select" : ["rating", "playCount", "bookmarks"], "from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]};
		DB.find(query, false, false).then(function(future) {
			//console.log("results " + Object.toJSON(future.result.results));
			if (future.result.returnValue === true){ // Success
				var d = new Date();
				if (future.result.results.length < 1){
					db8.getObjsById([id], function(results){
						if (results.length > 1){
						
							results[0].playCount = 1;
							results[0].lastPlayed = d.getTime();
							results[0].bookmarks = [];
							
							koto.justType.cacheSearchData(results[0]);
							console.log("Updated Playcount for " + results[0].display);
						}
					}.bind(this))
					
				}
				else {
					obj = {
						lastPlayed: d.getTime(),
						playCount: future.result.results[0].playCount += 1
					}
					db8.merge({"from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]}, obj);	
					console.log("Updated Playcount");
				}
			}
			else // Failure
				Mojo.Log.error("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
			
		}.bind(this));
	},
	setRating: function(id, rating, callback){
		query = {"select" : ["rating", "playCount", "bookmarks"], "from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]};
		DB.find(query, false, false).then(function(future) {
			//console.log("results " + Object.toJSON(future.result.results));
			if (future.result.returnValue === true){ // Success
				var d = new Date();
				if (future.result.results.length < 1){
					db8.getObjsById([id], function(results){
						if (results.length > 0){
							results[0].rating = rating;							
							koto.justType.cacheSearchData(results[0], callback);
							console.log("Set Rating at " + rating + " for " + results[0].display);
						}
					}.bind(this));
				}
				else {
					obj = {
						rating: rating
					}
					db8.merge({"from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]}, obj, callback);	
					console.log("Set Rating at " + rating);
				}
			}
			else // Failure
				console.log("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
			
		}.bind(this));
	},
	
/*
 *	Array Functions
 */
	view: function(obj, array){
		var objType =(obj.type)? obj.type : koto.utilities.getObjType(obj);
		if (objType ==="artist"){
			m.viewArtist(obj.name);
		} else if (objType === "album"){
			m.viewAlbum(obj);
		} else {
			m.viewArray(obj, array);
		}
		
	},
	viewArtist: function(artist){
		koto.content.artists.getFormattedSongsOfOne(artist, function(formattedSongs, songs, error){
			if (!error){
				Mojo.Controller.getAppController().getStageController("cardStage").pushScene("artist-view", {name: artist, albums: formattedSongs, songs: songs, _kind: "com.palm.media.audio.artist:1"}, focus);
			} else if (error) {
				/*if (focus){
					koto.content.albums.getSongsOfOne({album: focus}, function(albumSongs){
						m.viewArray({name: focus, _kind: "com.palm.media.audio.album:1"}, albumSongs)
					}.bind(this));
				} else {
					m.viewArray({name: artist, _kind: "com.palm.media.audio.artist:1"}, songs);
				}*/
			}
		}.bind(this));
	},
	viewAlbum: function(album_){
		var album = (album_.artist) ? album_ : koto.content.albums.getOne({name: album_.name || album_, artist: ""});
		console.log("album.artist " + album.artist);
		koto.content.albums.getSongsOfOne({album: album.name, albumArtist: album.artist}, function(songs){
			album.songs = songs;
			album.open = true;
			Mojo.Controller.getAppController().getStageController("cardStage").pushScene("artist-view", {name: album.artist, albums: [album], songs: songs, _kind: "com.palm.media.audio.artist:1"});
		});
		//koto.content.artists.getFormattedSongsOfOne(album.artist, function(formattedSongs, songs, error){
			//if (!error){
			//	Mojo.Controller.getAppController().getStageController("cardStage").pushScene("artist-view", {name: album.artist, albums: formattedSongs, songs: songs, _kind: "com.palm.media.audio.artist:1"}, album.name);
			//}
		//}.bind(this), album.name);
		//koto.content.artists.getAlbumsOfOne(
		/*koto.content.albums.getSongsOfOne(album_, function(songs){
			//albums.push
			album.songs = songs;
			album.open = true;
			albums.push(album);
			koto.content.artists.getSongsOfOne
			//Mojo.Controller.getAppController().getStageController("cardStage").pushScene("artist-view", {name: album.artist, albums: albums, songs: songs, _kind: "com.palm.media.audio.artist:1"}, album.name);

		}.bind(this));*/
	},
	viewArray: function(titleObj, array, focus){
		Mojo.Controller.getAppController().getStageController("cardStage").pushScene("view", titleObj, array, focus);
	},
	playArray: function(array, index, arg){
		//var d = new Date();
		//milliseconds = d.getTime();

		if (koto.nowPlaying.currentInfo.songs.length > 0){
			//m.saveNowPlaying();//save old songs
			m.deferSaveNowPlaying();
			m.hasSavedOldNowPlaying = true;
		}
		
		//var d = new Date();
		//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after deffering save now playing");	
		

		//array = JSON.parse(JSON.stringify(array_));
		
		//var d = new Date();
		//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after cloning array");	
		
		if (koto.appId === "com.tibfib.app.koto.lite"){
			if (array.length > 10){
				if (index >= 1){
					if (array.length-1 - index >= 9){
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
			
			
			/*if ((array.length-1 - index) <= 8){//if there are less than 8 items beyond
				array = array.slice(index - (8 - array.length-1 - index), array.length - 1);
				index = (5 - array.length-1 - index) + 5;
			} else {
				array = array.slice(index-5, index+5);
				index = 4;
			}*/
			
		}
		
		if (array.length < 1){ return;}
		//if (koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index] && koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active){
		//	koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = undefined;
		//}
		koto.nowPlaying.currentInfo.unshuffledSongs.clear();
		if (arg && arg.shuffled && arg.unshuffledSongs){
			Object.extend(koto.nowPlaying.currentInfo.unshuffledSongs, arg.unshuffledSongs);
		}
		
		//var d = new Date();
		//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after setting up unshuffled songs");	
		
		koto.nowPlaying.currentInfo.songs.clear();
		
		Object.extend(koto.nowPlaying.currentInfo.songs, array);
		koto.nowPlaying.currentInfo.index = index;
		//koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = true;
		koto.nowPlaying.currentInfo.playing = true;
		koto.nowPlaying.currentInfo.repeat = koto.preferences.obj.defaultRepeat;
		
		//var d = new Date();
		//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after setting up nP object");	
		
		m.pushPlay();
		
		//var d = new Date();
		//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after pushing play");	
		
		
		if (arg && arg.time){
			m.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path, arg.time);
		}
		else {
			m.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path);
		}
		
		//var d = new Date();
		//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after playing song");	
		
	},
	/*Play Array functions*/
	playArrayNext: function(array){
		//array = JSON.parse(JSON.stringify(array_));
		
		/*var i = 0;
		while(i < array.length){
			for(var k = 0; k < koto.nowPlaying.currentInfo.songs.length; k++){
				if (koto.nowPlaying.currentInfo.songs[k].title === array[i].title && koto.nowPlaying.currentInfo.songs[k].artist === array[i].artist && koto.nowPlaying.currentInfo.songs[k].album === array[i].album && koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].title !== koto.nowPlaying.currentInfo.songs[k].title){
					if (k < koto.nowPlaying.currentInfo.index)
						koto.nowPlaying.currentInfo.index--;
					koto.nowPlaying.currentInfo.songs.splice(k, 1);
					break;
				}
			}
			if (koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].title === array[i].title)
				array.splice(i, 1);
			else
				i++;
		}*/
		var firstArray = koto.nowPlaying.currentInfo.songs.slice(0, koto.nowPlaying.currentInfo.index+1);
		var secondArray = koto.nowPlaying.currentInfo.songs.slice(koto.nowPlaying.currentInfo.index+1);
		koto.nowPlaying.currentInfo.songs.clear();
		Object.extend(koto.nowPlaying.currentInfo.songs, firstArray.concat(array, secondArray));
		this.liteCheck();
	},
	playArrayLast: function(array){
		//array = JSON.parse(JSON.stringify(array_));
		/*var i = 0;
		while(i < array.length){
			for(var k = 0; k < koto.nowPlaying.currentInfo.songs.length; k++){
				if (koto.nowPlaying.currentInfo.songs[k].title === array[i].title && koto.nowPlaying.currentInfo.songs[k].artist === array[i].artist && koto.nowPlaying.currentInfo.songs[k].album === array[i].album && koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].title !== koto.nowPlaying.currentInfo.songs[k].title){
					if (k < koto.nowPlaying.currentInfo.index)
						koto.nowPlaying.currentInfo.index--;
					koto.nowPlaying.currentInfo.songs.splice(k, 1);
					break;
				}
			}
			if (koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].title === array[i].title)
				array.splice(i, 1);
			else
				i++;
		}*/
		var origSongs = koto.nowPlaying.currentInfo.songs.clone();
		koto.nowPlaying.currentInfo.songs.clear();
		Object.extend(koto.nowPlaying.currentInfo.songs, origSongs.concat(array));
		this.liteCheck();
		
	},
	shufflePlay: function(array){
		//array = JSON.parse(JSON.stringify(array_));
		if (koto.appId === "com.tibfib.app.koto.lite"){
			array = array.slice(0, 10);
		}
		m.playArray(koto.utilities.shuffle(array.clone()), 0, {shuffled: true, unshuffledSongs: array});
	},
	shuffleNowPlaying: function(){
		koto.nowPlaying.currentInfo.unshuffledSongs.clear();
		Object.extend(koto.nowPlaying.currentInfo.unshuffledSongs, koto.nowPlaying.currentInfo.songs.clone());
		var nowPlayingItem = koto.nowPlaying.currentInfo.songs.splice(koto.nowPlaying.currentInfo.index, 1)[0];
		var newSongs = koto.nowPlaying.currentInfo.songs.clone();
		koto.nowPlaying.currentInfo.songs.clear();
		Object.extend(koto.nowPlaying.currentInfo.songs, koto.utilities.shuffle(newSongs));
		koto.nowPlaying.currentInfo.songs.unshift(nowPlayingItem);
		koto.nowPlaying.currentInfo.index = 0;
		
	},
	unshuffleNowPlaying: function(){
		var currentSong = koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index];
		koto.nowPlaying.currentInfo.songs.clear();
		Object.extend(koto.nowPlaying.currentInfo.songs, koto.nowPlaying.currentInfo.unshuffledSongs.clone());
		for(var i = 0; i < koto.nowPlaying.currentInfo.songs.length; i++){
			if (currentSong.title === koto.nowPlaying.currentInfo.songs[i].title && currentSong.artist === koto.nowPlaying.currentInfo.songs[i].artist && currentSong.album === koto.nowPlaying.currentInfo.songs[i].album){
				koto.nowPlaying.currentInfo.index = i;
				//koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = true;
				koto.nowPlaying.currentInfo.unshuffledSongs.clear();
				break;
			}
		}
	},
	
	liteCheck: function(){
		if (koto.appId === "com.tibfib.app.koto.lite"){
			if (koto.nowPlaying.currentInfo.songs.length > 10){
				if (koto.nowPlaying.currentInfo.index >= 1){
					if (koto.nowPlaying.currentInfo.songs.length-1 - koto.nowPlaying.currentInfo.index >= 9){
						koto.nowPlaying.currentInfo.songs = koto.nowPlaying.currentInfo.songs.slice(koto.nowPlaying.currentInfo.index - 1, koto.nowPlaying.currentInfo.index + 9);
						koto.nowPlaying.currentInfo.index = 1;
					} else {
						var oldLength = koto.nowPlaying.currentInfo.songs.length;
						koto.nowPlaying.currentInfo.songs = koto.nowPlaying.currentInfo.songs.slice(-10);
						koto.nowPlaying.currentInfo.index = 9 - (oldLength-1 - koto.nowPlaying.currentInfo.index);
					}
				}else {
					koto.nowPlaying.currentInfo.songs = koto.nowPlaying.currentInfo.songs.slice(koto.nowPlaying.currentInfo.index, koto.nowPlaying.currentInfo.index + 10);
					koto.nowPlaying.currentInfo.index = 0;
				}
			}
		}
	},	
/*
 * Audio Functions
 */
	pause: function(){
		koto.nowPlaying.currentInfo.audioObj.pause();
		//koto.nowPlaying.currentInfo.playing = false;
		//m.handlePause();//delegates("_pause") called automagically from .pause()
		
	},
	resume: function(){
		if (getFileInfo(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path).extension !== ".m4p"){
			koto.nowPlaying.currentInfo.audioObj.play();
		}
		//koto.nowPlaying.currentInfo.playing = true;
		//m.handlePlay();//delegates("_resume");
		
	},
	pushPlay: function(justPush){
		var stageController = Mojo.Controller.getAppController().getStageController("cardStage");
		if (justPush){
			stageController.pushScene("play");
		} else {
			if (stageController.activeScene().sceneName !== "play"){
				var playPushed, scenes = stageController.getScenes();
				for(var i = 0; i < scenes.length; i++){
					if (scenes[i].sceneName === "play"){
						playPushed = true;
						break;
					}
				}
				if (playPushed !== true){
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
		if (koto.nowPlaying.currentInfo.audioObj.currentSrc){
			koto.nowPlaying.currentInfo.audioObj.pause();
			koto.nowPlaying.currentInfo.audioObj.src = null;
		}
		var extension = getFileInfo(path).extension;
		if (extension === ".m4p"){
			setTimeout(function(){
				if (previousOrNext && previousOrNext === "previous"){
					m.playPrevious(true);
				} else {
					m.playNext(false, true);
				}
			}, 500);
			return;
		}
		koto.nowPlaying.currentInfo.audioObj.src = path;
		koto.nowPlaying.currentInfo.audioObj.load();
		if (((play !== undefined && play !== false) || play === undefined)){
			koto.nowPlaying.currentInfo.audioObj.play();
			koto.nowPlaying.currentInfo.playing = true;
		}

		var changeCurrentTime = function(){
			if (time){
				koto.nowPlaying.currentInfo.audioObj.currentTime = time;
			}else {
				koto.nowPlaying.currentInfo.audioObj.currentTime = 0;
			}
			if (play !== undefined && play === false){
				koto.utilities.delegate("_updateProgress");
			}
			koto.nowPlaying.currentInfo.audioObj.removeEventListener("loadeddata", changeCurrentTime);
		}.bind(this);
		
		koto.nowPlaying.currentInfo.audioObj.addEventListener("loadeddata", changeCurrentTime);
		//koto.nowPlaying.currentInfo.audioObj.addEventListener("error", m.playNext.bind(this), true);

		//if (koto.preferences.obj.lastfm.sessionKey !== "" && koto.preferences.obj.lastfm.scrobble === true){
		//	lastfm.scrobble(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]);
		//}
		if (koto.preferences.obj.lastfm.sessionKey !== "" && koto.preferences.obj.lastfm.scrobble === true){
			lastfm.updateNowPlaying();
		}
		  
	},
	playLoadedSong: function(){
		m.swapAudioObjs();
		var otherAO = (koto.nowPlaying.currentInfo.cao === "one") ? "two": "one";
		if (koto.nowPlaying.currentInfo.audioObj.currentSrc === koto.nowPlaying.currentInfo["audioObj" + otherAO].currentSrc){
			m.playNext();
			console.log("playing next instead of loading");
		}else {
			m.resume();

			//koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = undefined;
			if (koto.nowPlaying.currentInfo.index !== koto.nowPlaying.currentInfo.songs.length-1){
				koto.nowPlaying.currentInfo.index++;
			}else {
				koto.nowPlaying.currentInfo.index = 0;
			};
			//koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = true;
			if (koto.nowPlaying.currentInfo.repeat > 0){
				if (koto.nowPlaying.currentInfo.repeat === 1){
					koto.nowPlaying.currentInfo.repeat = 0;
				}
			}else {
				m.stop();
			}
			koto.utilities.delegate("_playNext");
			m.updateDashboard();
			
			if (koto.preferences.obj.lastfm.sessionKey !== "" && koto.preferences.obj.lastfm.scrobble === true){
				lastfm.updateNowPlaying();
			}
		}

	},
	loadSong: function(path, cao){
		if (koto.nowPlaying.currentInfo["audioObj" + cao].currentSrc){
			koto.nowPlaying.currentInfo["audioObj" + cao].pause();
			koto.nowPlaying.currentInfo["audioObj" + cao].src = null;
		}
		koto.nowPlaying.currentInfo["audioObj" + cao].src = path;
		koto.nowPlaying.currentInfo["audioObj" + cao].load();
		koto.nowPlaying.currentInfo["audioObj" + cao].pause();

		/*changeCurrentTime = function(){
			if (time){
				koto.nowPlaying.currentInfo.audioObj.currentTime = time;
			}else {
				koto.nowPlaying.currentInfo.audioObj.currentTime = 0;
			}
			if (play !== undefined && play === false){
				koto.utilities.delegate("_updateProgress");
			}
			koto.nowPlaying.currentInfo.audioObj.removeEventListener("loadeddata", changeCurrentTime);
		}.bind(this);
		koto.nowPlaying.currentInfo.audioObj.addEventListener("loadeddata", changeCurrentTime);*/
			  
	},
	loadNext: function (){
		if (koto.nowPlaying.currentInfo.index !== koto.nowPlaying.currentInfo.songs.length-1){
			nextIndex = (koto.nowPlaying.currentInfo.index + 1);
		}else {
			nextIndex = 0;
		}

		if (koto.nowPlaying.currentInfo.playing === true){
			m.loadSong(koto.nowPlaying.currentInfo.songs[nextIndex].path, ((koto.nowPlaying.currentInfo.cao === "one")?"two":"one"));
		}
	},
	playNext: function(ended, play){
		//try {
		//	koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = undefined;
		//}catch(e){}//if the user deletes the first song that is currently playing
		var oldIndex = koto.nowPlaying.currentInfo.index;
		if (koto.nowPlaying.currentInfo.index !== koto.nowPlaying.currentInfo.songs.length-1){
			koto.nowPlaying.currentInfo.index++;
		}else {
			koto.nowPlaying.currentInfo.index = 0;
		}
		//koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = true;
		koto.utilities.delegate("_playNext", ended);
		if (koto.nowPlaying.currentInfo.playing === true){
			if (oldIndex === koto.nowPlaying.currentInfo.songs.length-1 && ended){
				if (koto.nowPlaying.currentInfo.repeat > 0){
					m.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path, 0, play, "next");
					if (koto.nowPlaying.currentInfo.repeat === 1){
						koto.nowPlaying.currentInfo.repeat = 0;
					}	
				}else {
					m.stop();
				}
			} 
			else {
				try {
					m.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path, 0, play, "next");
				}catch(e){console.log("tried to play song: " + e)};
			}
		}else {
			try {
				m.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path, 0, (play !== undefined)? play: false, "next");
			}catch(e){console.log("tried to play song: " + e)};
		}
		if (ended){
			m.updateDashboard();
		}
		//koto.nowPlaying.currentInfo.audioObj.removeEventListener("error", m.playNext.bind(this), true);

	},
	playPrevious: function(){
		if (koto.nowPlaying.currentInfo.audioObj.currentTime > 5){
			koto.nowPlaying.currentInfo.audioObj.currentTime = 0;
			if (koto.nowPlaying.currentInfo.playing === false){
				koto.utilities.delegate("_updateProgress");//just in case
			}
		}
		else{
			//koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = undefined;
			if (koto.nowPlaying.currentInfo.index > 0){
				koto.nowPlaying.currentInfo.index--;
			}else {
				koto.nowPlaying.currentInfo.index = koto.nowPlaying.currentInfo.songs.length-1;
			}
			//koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = true;
			try {
				m.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path, undefined, undefined, "previous");
			}catch(e){console.log(e)};

			koto.utilities.delegate("_playPrevious");
		}
		//koto.nowPlaying.currentInfo.audioObj.removeEventListener("error", m.playNext.bind(this), true);
	
	},
	stop: function(){
		koto.nowPlaying.currentInfo.audioObj.pause();
		//koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = undefined;
		koto.nowPlaying.currentInfo.index = 0;
		//koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = true;
		koto.nowPlaying.currentInfo.audioObj.src = koto.nowPlaying.currentInfo.songs[0].path;
		koto.nowPlaying.currentInfo.audioObj.load();
		koto.nowPlaying.currentInfo.audioObj.pause();
		//koto.nowPlaying.currentInfo.audioObj.currentTime = 0;
		koto.nowPlaying.currentInfo.playing = false;
		koto.utilities.delegate("_stop");
	},
	
/*
 * Handle Audio Functions
 */
	handlePlay: function(){	
		koto.nowPlaying.currentInfo.playing = true;
		koto.utilities.delegate("_resume");
		m.updateDashboard();
	},
	handlePause: function(){
		koto.nowPlaying.currentInfo.playing = false;
		koto.utilities.delegate("_pause");
		m.updateDashboard();
	},


/*
 *	Dashboard
 */
	showDashboard: function(){
		if (koto.preferences.obj.useDashboard){
			dashboardStage = Mojo.Controller.getAppController().getStageController("dashboardStage");
			if (dashboardStage) 
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
		if (Mojo.Controller.getAppController().getActiveStageController().activeScene()){
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
		console.log("index is \""+ koto.nowPlaying.currentInfo.index + "\" so playing \"" + koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].title + "\", length of songs is : \"" + koto.nowPlaying.currentInfo.songs.length + "\", current item is : " + Object.toJSON(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]));
	},
	log: function(string){
		//Comment out on release
		Mojo.Log.info(string);
	},
	debugObj: function(prefix, obj){
		//console.log(prefix + ": " + Object.toJSON(obj));
	},
	debugObjFull: function(obj){
		for(var i in obj) {
			if(obj.hasOwnProperty(i)){
				console.log('OBJECT ITERATION: ' + i + ' : ' + obj[i]);
			}
		}	
	},
	debugErr: function(string){
		Mojo.Log.error(string);
	}
};