//This will be the new library. Improving and fleshing it out for future ... stuff :)
/*jslint white: false, onevar: true, undef: true, nomen: false, regexp: true, plusplus: true, bitwise: true, newcap: true, maxerr: 100, indent: 4 */
/*global Mojo m console Audio api_keys xTwitter db8 Metrix ServiceRequestWrapper AjaxRequestWrapper*/
var koto = {
	//variables
	appId: Mojo.appInfo.id,
	metrix: new Metrix(),
	serviceRequest: new ServiceRequestWrapper(),
	ajaxRequest: new AjaxRequestWrapper(),
	setup: function (arg) {
		if ((arg && arg.action === "setup") || !arg) {
			
			//setup stuff
			db8.setup();
			koto.preferences.get();

			//set stylesheet
			Mojo.Controller.getAppController().getStageController("cardStage").loadStylesheet("stylesheets/" + koto.preferences.obj.theme + ".css");
			
			koto.albumArt.loadCustom(function () {
				//if auto resume is on, resume this stuff
				if(koto.preferences.obj.saveAndResume === true && (!arg || (arg && !arg.delayResume))){
					m.resumeNowPlaying();
				}
				//getPermissions for media
				koto.setupFunctions.getPermissions(function () {
					//now load
					koto.content.load();

				});
			});
			
			koto.justType.setup();
			koto.setupFunctions.setupAudioObj();
			koto.setupFunctions.setupControlListeners();
			
		} else if (arg && arg.action === "load") {
			//we just want to load, no setup
			koto.albumArt.loadCustom(function () {
				koto.setupFunctions.getPermissions(function () {
					koto.content.load();
				});
			});
			
		} else if (arg && arg.action === "fromDashboard") {
			//set stylesheet
			Mojo.Controller.getAppController().getStageController("cardStage").loadStylesheet("stylesheets/" + koto.preferences.obj.theme + ".css");
			//don't do anything else I guess.
		}
	},
	setupFunctions: {
		getPermissions: function (callback){
			koto.serviceRequest.request('palm://com.palm.mediapermissions', {  
				method: 'request',  
				parameters: {
					rights: {
						read: ["com.palm.media.image.album:1","com.palm.media.audio.album:1","com.palm.media.audio.artist:1","com.palm.media.audio.file:1","com.palm.media.audio.genre:1", "com.palm.media.playlist.object:1"]  
					}
				},  
				onComplete: function(response) {  
					if (response.returnValue && response.isAllowed){
						//Get the songs
						if (callback) {
							callback();
						}
						//if (!doNotLoadSongs){
							//koto.content.load.favorites();
						//}	
						Mojo.Log.info('Got permissions okay!');
						
					}
					else if (response.errorCode !== -1) {
						m.dialogError("The app can not access your music... " + Object.toJSON(response));	
					}
				}.bind(this)  
			});
		},
		setupAudioObj: function (eventHandler){
			eventHandler = /*eventHandler ||*/ function(event){
				console.log("event sent: " + event.type);
				switch(event.type){
					case "pause":
						m.handlePause();
						break;
					case "play":
						m.handlePlay();
						break;
					case "timeupdate":
						koto.utilities.delegate("_updateProgress");
						break;
					case "ended":
						var currentId = koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]._id, currentObj = koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index];
						m.playNext(true);
						m.incrementPlayCount(currentId);
						lastfm.scrobble(currentObj);
						break;
				
				}
			};
			var libs = MojoLoader.require({ name: "mediaextension", version: "1.0"});
			var extObj = libs.mediaextension.MediaExtension.getInstance(koto.nowPlaying.currentInfo.audioObj);
			extObj.audioClass = "media";
	  
			// Listen for pause and play events
			koto.nowPlaying.currentInfo.audioObj.addEventListener("pause", eventHandler, true);
			koto.nowPlaying.currentInfo.audioObj.addEventListener("play", eventHandler, true);
			koto.nowPlaying.currentInfo.audioObj.addEventListener("ended", eventHandler, true)
			koto.nowPlaying.currentInfo.audioObj.addEventListener("error", eventHandler, true);
			koto.nowPlaying.currentInfo.audioObj.addEventListener("timeupdate", eventHandler, true);
		
		},
		setupControlListeners: function(){
			var volumeLock = new Mojo.Service.Request("palm://com.palm.audio/media", {
				method: 'lockVolumeKeys',
				onSuccess: function(arg){}.bind(this),
				parameters: {
					subscribe: true,
					foregroundApp: true
				}
			});
			koto.serviceRequest.request("palm://com.palm.keys/headset", {//headset
				method:'status',
				parameters: {subscribe: true},
				onSuccess: function(button){
					if (koto.nowPlaying.currentInfo.songs.length > 0 && button.state){
						if (button.state === "single_click"){
							if (koto.nowPlaying.currentInfo.playing === true){
								m.pause();
							}
							else{
								m.resume();
							}
						}
						if (button.state === "double_click"){
							m.playNext();
						}
					}
				}.bind(this)
			},true);
			
			koto.serviceRequest.request("palm://com.palm.keys/media", {//bluetooth headset
				method:'status',
				parameters: {subscribe: true},
				onSuccess: function(button){
					//console.log("heard bluetooth press " + Object.toJSON(button));
					if (button && button.state && button.state === "down" && koto.nowPlaying.currentInfo.songs.length > 0){
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
		}
	},
	content: {
		artists: {
			array: [],
			load: function (callback) {
				this.array.clear();
				var query = { "select" : ["name", "total.tracks", "total.albums", "_id", "_kind"], "orderBy":"name", "from":"com.palm.media.audio.artist:1"};
				db8.exec(query, handleArtists.bind(this));
				function handleArtists(artists, done){
					this.array = this.array.concat(artists);
					if (done){
						koto.utilities.sortContentList(this.array);
						if(callback){
							callback();
						}
					}
				}
			},  
			getOne: function(artist, callback){
				return koto.content.artists.array.find(function(obj){
					return (obj.name === artist);
				}, this);
				/* for some stupid reason, "name" is not indexed in the kinds.
				
				var query = {"select" : ["name", "total.tracks", "total.albums", "_id", "_kind"], "where":[{"prop":"name","op":"=","val":artist}], "from":"com.palm.media.audio.artist:1"};
				db8.exec(query, handleArtists.bind(this));
				function handleArtists(artists){
					callback(artists[0]);
				}*/
			},
			getSongsOfOne: function(artist, callback){
				var query = {"select" : koto.content.songs.propertiesArray, "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false},{"prop":"artist","op":"=","val":artist}]};
				db8.exec(query, callback.bind(this));
			},
			getSongsOfOneBySong: function(obj, callback){
				//this function is used by Just Type and by the Continue Album feature.
				//it gets the songs by an artist, callsback the songs with the index of the song that was passed.
				koto.content.artists.getSongsOfOne(obj.artist, function(array){
					var newIndex;
					for(var i = 0; i < array.length; i++){
						if (array[i]._id === obj._id){
							newIndex = i;
							break;
						}
					}
					callback(array, newIndex);
				}.bind(this));
			},
			getFormattedSongsOfOne: function(artist_, callback, album_){
				var artist = (artist_.name) ? artist_.name : artist_;	
				/*koto.content.artists.getSongsOfOne(artist, function(songs){
					var albums = [];
					if (songs.length > 0){
						for(var i = 0; i < songs.length; i++){
							if (i === 0){
								var album = koto.content.albums.getOne({artist: artist, name: songs[i].album});
								album.songs = [songs[i]];
								albums.push(album);
							} else if (i !== songs.length-1){
								var alreadyAdded = false;
								for(var k = 0; k < albums.length; k++){
									if (albums[k].name === songs[i].album){
										alreadyAdded = true; 
										albums[k].songs.push(songs[i]);
										break;
									}
								}
								if (!alreadyAdded){
									var album = koto.content.albums.getOne({artist: artist, name: songs[i].album});
									album.songs = [songs[i]];
									albums.push(album);
								}
							} 
							if (i === songs.length-1){
								callback(albums, songs);
							}
						}
						
					} else {
						console.log("Well you're in trouble.");
						m.bannerError("Error: No Songs by Artist");
					}
				}.bind(this));*/
				koto.content.artists.getAlbumsOfOne(artist, function(albums){
					if (albums.length > 0){
						var i = 0, artistSongs = [];
						function getAlbumSongs(album){
							koto.content.albums.getSongsOfOne({album: album.name, albumArtist: album.artist}, function(songs){
								//do drawer stuff;
								if (albums.length === 1 || (album_ && album_ === albums[i].name)){
									albums[i].open = true;
								}
								//add songs 
								albums[i].songs = songs;
								artistSongs = artistSongs.concat(songs);
								i++;
								if (i < albums.length){
									getAlbumSongs(albums[i]);
								} else {
									callback(albums, songs);
								}
							});
						}
						if (i < albums.length){
							getAlbumSongs(albums[i]);
						} else {
							console.log("no albums");
						}
						/*koto.content.artists.getSongsOfOne(artist, function(songs){
							if (songs.length > 0){
								for(var i = 0; i < songs.length; i++){
									for(var k = 0; k < albums.length; k++){
										if (albums[k].name === songs[i].album){
											if (albums.length === 1 || (album && album === albums[k].name)){
												albums[k].open = true;
											}
											if (albums[k].songs)
												albums[k].songs.push(songs[i]);
											else 
												albums[k].songs = [songs[i]];
											break;
										}
									}
								}
								var i = 0;//Gets rid of albums with no songs. These albums shouldn't exist, but the media indexer thinks they do... Delete them so it doesn't screw up view scene.
								while(i < albums.length){
									if (!albums[i].songs){
										albums.splice(i, 1);
									}else {
										i++;
									}
								}
								callback(albums, songs);
							} else {
								console.log("Error with media indexing api, says artist has no songs, so launching alternate artist view.");
								koto.content.artists.getSongsOfOne(artist, function(songs){
									callback(songs, songs, true);
								}.bind(this));
							}
						}.bind(this));*/
					} else {
						console.log("Artist has no albums, so doing stuff to get it to work");
						koto.content.artists.getSongsOfOne(artist, function(songs){
							var albums = [];
							if (songs.length > 0){
								for(var i = 0; i < songs.length; i++){
									if (i === 0){
										var album = koto.content.albums.getOne({artist: artist, name: songs[i].album});
										album.songs = [songs[i]];
										albums.push(album);
									} else if (i !== songs.length-1){
										var alreadyAdded = false;
										for(var k = 0; k < albums.length; k++){
											if (albums[k].name === songs[i].album){
												alreadyAdded = true; 
												albums[k].songs.push(songs[i]);
												break;
											}
										}
										if (!alreadyAdded){
											var album = koto.content.albums.getOne({artist: artist, name: songs[i].album});
											album.songs = [songs[i]];
											albums.push(album);	
										}
									} 
									if (i === songs.length-1){
										if (albums.length === 1){
											albums[i].open = true;
										}
										callback(albums, songs);
									}
								}
								
							} else {
								console.log("Well you're in trouble.");
								m.bannerError("Error: No Songs by Artist");
							}
						}.bind(this));
					}
				}.bind(this));
			},
			getAlbumsOfOne: function(artist, callback){
				var query = {"select" : ["name", "artist", "total.tracks", "_id", "_kind", "thumbnails"], "where" : [{"prop":"artist","op":"=","val":artist}], "from":"com.palm.media.audio.album:1" };
				db8.exec(query, callback.bind(this));
			},
		},

		albums: {
			array: [],
			load: function (callback) {
				this.array.clear();
				var query = {"select" : ["name", "artist", "total.tracks", "_id", "_kind", "thumbnails"], "orderBy": "name", "from":"com.palm.media.audio.album:1" };
				db8.exec(query, handleAlbums.bind(this));
				function handleAlbums(albums, done){
					this.array = this.array.concat(albums);
					if (done){
						koto.utilities.sortContentList(this.array);
						if(callback){
							callback();
						}
					}
				}
			},
			
			//These are all single album functions
			getOne: function(obj, callback){
				var maybeAlbum;
				for(var i = 0; i < koto.content.albums.array.length; i++){	
					if (koto.content.albums.array[i].name === obj.name){//same album name
						if (koto.content.albums.array[i].artist === obj.artist){//same artist, is for sure right album we want
							if (!callback){
								return koto.content.albums.array[i];
							} else {
								callback(koto.content.albums.array[i]);
								return;
							}
							break;
						} else {
							maybeAlbum = koto.content.albums.array[i];//diff artist, could be media indexing issue, or could be wrong album.. cache it for later
						}
					}
				}
				if (maybeAlbum){
					if (!callback){
						return maybeAlbum;//well since we didn't find the same album with the same artist, give the maybeAlbum
					} else {
						callback(maybeAlbum);
					}
				}
				//for some dumb reason, name and artist are not indexed.
				/*var album = obj.name;
				var query = {"select" : ["name", "artist", "total.tracks", "_id", "_kind", "thumbnails"], "orderBy": "name", "from":"com.palm.media.audio.album:1", "where":[{"prop":"artist","op":"=","val":obj.artist}]};
				db8.exec(query, function(albums){
					for(var i = 0; i < albums.length; i++){
						if (albums[i].name === obj.name){
							callback(albums[i]);
							break;
						}
					}
				}.bind(this));*/
			},
			getSongsOfOne: function(obj, callback){
				var album = obj.album, artist = obj.artist || undefined;
				//doesn't order properly
				//if (!obj.artist){
					var query = {"select" : koto.content.songs.propertiesArray, "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false},{"prop":"album","op":"=","val":album}]};
					if (artist){
						console.log("artist provided : " + artist);
						query.where.push({"prop":"artist","op":"=","val":artist});
					}
					db8.exec(query, function(songs){	
						callback(songs);
					}.bind(this));		
				/*} else {
					var query = {"select" :koto.content.songs.propertiesArray, "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false},{"prop":"artist","op":"=","val":obj.artist}]};
				
					db8.exec(query, function(array){
						var albumSongs = [];
						for(var i = 0; i < array.length; i++){
							if (array[i].album === album)
								albumSongs.push(array[i]);
						}
						callback(albumSongs);
					}.bind(this));
				}*/
			},
		},
		songs: {
			array: [],
			propertiesArray: ["_id", "title", "artist", "album", "albumArtist", "genre", "path", "thumbnails", "duration"],
			load: function (callback) {
				var _milliseconds = new Date().getTime();
				this.array = [];
				var query = {"select" : koto.content.songs.propertiesArray, "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false}], "orderBy":"title"};
				//console.log("------------- GETTING SONGS --------------");
				koto.content.songs.get("title", function(songs){
					koto.content.songs.array = songs;
					
					var d = new Date();
					console.log("Got songs. Took " + (parseInt(d.getTime(), 10) - parseInt(_milliseconds, 10)) + " milliseconds");
					koto.utilities.sortContentList(koto.content.songs.array);
					
					d = new Date();
					console.log("AFTER SORTING: " + (parseInt(d.getTime(), 10) - parseInt(_milliseconds, 10)) + " milliseconds");
									
					if(callback){
						callback();
					}
				});
			},
			get: function(order, callback){
				var songsArray = [];
				var query = {"select" : koto.content.songs.propertiesArray, "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false}], "orderBy":order};
				db8.exec(query, function(songs, done){
					songsArray = songsArray.concat(songs);
					if (done){
						callback(songsArray);
					}
				}.bind(this));
			},
		},
		genres: {
			array: [],
			load: function (callback) {
				this.array.clear();
				var query = { "select" : ["name", "total.tracks", "_id", "_kind"], "from":"com.palm.media.audio.genre:1"};
				db8.exec(query, handleGenres.bind(this));
				function handleGenres(genres, done){
					koto.content.genres.array = koto.content.genres.array.concat(genres)
					if (done && callback){
						callback();
					}
				}
			
			},
			getSongsOfOne: function(obj, callback){
				var genre = (obj.name)?obj.name:obj;
				var query = {"select" : koto.content.songs.propertiesArray, "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false},{"prop":"genre","op":"=","val":genre}]};
				var genreSongs = [];
				db8.exec(query, function(songs, done){
					genreSongs = genreSongs.concat(songs);
					if (done){
						callback(genreSongs);
					}
				}.bind(this));
			},
		},
		playlists: {
			array: [],
			autoArray: [],
			customArray: [],
			m3uArray: [],
			load: function (callback) {
				var query = {"select": ["_id", "name", "type", "songs", "sort", "songsQuery", "_kind"], "from":koto.appId + ".playlists:1", "where":[{"prop":"type","op":"!=","val":"hide"}]};
				db8.exec(query, function(array){
					koto.content.playlists.autoArray.clear();
					koto.content.playlists.customArray.clear();
					koto.content.playlists.m3uArray.clear();
					for(var i = 0; i < array.length; i++){
						if (array[i].songsQuery){
							array[i].preventDelete = true;
						}
						koto.content.playlists[array[i].type + "Array"].push(array[i]);
						//m.playlists.push(array[i]);
					}
					//m.playlists = array.clone();
					
					koto.content.playlists.array = koto.content.playlists.autoArray.concat(koto.content.playlists.customArray);
					//this.getM3UPlaylists();
					if(callback){
						callback();
					}
				}.bind(this));
			},
			getOne: function(name, callback){
				var query = {"select" : ["_id", "name", "type", "songs"], "from":koto.appId + ".playlists:1", "where":[{"prop":"name","op":"=","val":name}]};
		
				db8.exec(query, function(playlists){
					db8.getObjsById(playlists[0].songs, function(songs){
						playlists[0].songs = songs;
						callback(playlists[0]);
					}.bind(this));
				}.bind(this));
			},
			saveOne: function(name, playlist_obj, callback){
				var query = {"select" : ["name", "_id"], "from":koto.appId + ".playlists:1", "where":[{"prop":"name","op":"=","val":name}]};
				db8.exec(query, function(results){
					if (playlist_obj.songs[0].title){//if it is not already an array of _id's
						var songs_ = [];
						for(var i = 0; i < playlist_obj.songs.length; i++){
							songs_.push(playlist_obj.songs[i]["_id"]);
						}
						playlist_obj.songs = songs_;
					}
					playlist_obj._kind = koto.appId + ".playlists:1";
					if (results.length < 1){
						db8.put(playlist_obj, function(id){
							playlist_obj._id = id
							koto.justType.cacheSearchData(playlist_obj);
						}.bind(this));
						koto.content.playlists.load();
						if (callback)
							callback();
					}
					else {
						db8.merge({"from":koto.appId + ".playlists:1", "where":[{"prop":"name","op":"=","val":name}]}, playlist_obj);
						playlist_obj._id = results[0]._id;
						koto.justType.cacheSearchData(playlist_obj);
						koto.content.playlists.load();
						if (callback)
							callback();
					}
				}.bind(this));
			},
			deleteOne: function(name, i){
				db8.del({"from":koto.appId + ".playlists:1", "where":[{"prop":"name","op":"=","val":name}]});
				if (i){
					m.playlists.splice(i, 1);
					koto.content.playlists.customArray.splice(i-3, 1);
				}
				else {
					for(var j = 0; j < m.playlists.length; j++){
						if (m.playlists[j].name === name){
							m.playlists.slice(j, 1);
							koto.content.playlists.customArray.splice(j-3, 1);
						}
					}
				}
				for(var j = 0; j < koto.content.favorites.length; j++){
					if (koto.utilities.getObjType(koto.content.favorites[j]) === "playlist" && koto.content.favorites[j].name === name){
						koto.content.favorites.del(j);
						koto.content.favorites.store();
					}
				}
			},
			getSongsOfOne: function(playlist, callback, dontSort){
				if (playlist.songs){
					db8.getObjsById(playlist.songs, function(songs){
						if (playlist.sort && playlist.sort !== "custom" && !dontSort){
							//console.log("playlist.sort is " + playlist.sort);
							songs = songs.sortBy(function(s){
								return s[playlist.sort];
							}, this);
						}
						callback(songs);
					});
				}else if (playlist.songsQuery){
					db8.exec(playlist.songsQuery, function(results){
						var ids = [];
						for(var i = 0; i < results.length; i++){
							ids.push(results[i].id);
						}
						db8.getObjsById(ids, callback);
					}.bind(this));
				}
			},
		},
		favorites: {
			array: [],
			"load": function (callback) {
				var query = {"select" : ["id","_id", "position"], "from": koto.appId + ".favorites:1"};
				db8.exec(query, function(objs){
					objs = objs.sortBy(function(item){
						return item.position;
					});
					var realFavoriteIds = [];
					for(var i = 0; i < objs.length; i++){
						realFavoriteIds.push(objs[i].id);
					}
					if (realFavoriteIds.length > 0) {
						db8.getObjsById(realFavoriteIds, function(favorites){
							koto.content.favorites.array.clear();
							Object.extend(koto.content.favorites.array, favorites);
							if(callback){
								callback();
							}
						}.bind(this))
					} else {
						if(callback){
							callback();
						}
					}
				}.bind(this));
			},
			"add": function(object){
				var obj = Object.clone(object);
				for(var i = 0; i <= koto.content.favorites.array.length; i++){
					if (i > 0 && i !== koto.content.favorites.array.length && obj["_id"] && obj["_id"] === koto.content.favorites.array[i]._id){
						m.bannerError("You already added this!");
						break;
					}
					if (i === (koto.content.favorites.array.length-1) || koto.content.favorites.array.length === 0){
						db8.put({"_kind": koto.appId + ".favorites:1", "id": obj["_id"], "position": koto.content.favorites.array.length}, function(){
							koto.content.favorites.array.push(obj);
							koto.justType.cacheSearchData(obj, true);
							m.bannerAlert("Added to Favorites", {action: "pushScene", scene: "list", data: "favorites"});
							koto.content.favorites.store();						
						});	
						break;
					}
				}
			},
			"del": function(index){
				db8.del({"from":koto.appId + ".favorites:1", "where":[{"prop":"position","op":"=","val":index}]});
				koto.content.favorites.array.splice(index, 1);
				//koto.content.favoriteIds.splice(index, 1);
			},
			"store": function() {
				//this saves them with the proper position
				var favoritesWithPosition = [];
				for(var i = 0; i < koto.content.favorites.array.length; i++){
					favoritesWithPosition.push({id: koto.content.favorites.array[i]._id, position: i, _kind: koto.appId + ".favorites:1"});
				}
				db8.del({"from":koto.appId + ".favorites:1"}, function(){
					db8.putArray(favoritesWithPosition, function(){
						koto.content.load.favorites();
					}.bind(this));
				});
			}
		},
		load: function(){
			koto.content.favorites.load(function(){
				koto.content.artists.load(function(){
					koto.content.albums.load(function(){
						koto.content.songs.load(function(){
							koto.content.genres.load(function(){
								koto.content.playlists.load(function(){
									console.log("done loading everything");
									try {
										Mojo.Controller.getAppController().getStageController("cardStage").getScenes()[0].assistant.loaded();		
									} catch(e){ console.log(e)};
									
									if (m.songCountCookie.get()){
										koto.justType.checkJustType.defer(m.songCountCookie.get());
									} else {
										koto.justType.checkJustType.defer();
									}
								});
							});
						});
					});
				});
			})
		},
		getSongsOfObj: function(obj, callback, optionalArg){
			//optionalArg either says to get all songs when getting songs of a song, or to not sort when getting a playlist
			var objType = koto.utilities.getObjType(obj);
			switch(objType){
				case "artist":
					koto.content.artists.getSongsOfOne(obj.name, callback);
					break;
				case "album":
					koto.content.albums.getSongsOfOne({album: obj.name}, callback);
					break;
				case "genre":
					koto.content.genres.getSongsOfOne(obj, callback);
					break;
				case "playlist":
					koto.content.playlists.getSongsOfOne(obj, callback, optionalArg);
					break;
				case "song":
					if (optionalArg){
						koto.content.artists.getSongsOfOneBySong(obj, callback);
					}
					else {
						callback([obj]);
					}
					break;
				default:
					console.log("Error! Object does not have a type");
					break;
			}
		}
	},
	nowPlaying: {
		currentInfo: {
			songs: [],
			unshuffledSongs: [],
			index: 0,
			playing: false,
			repeat: 2,
			audioObj: new Audio()
		},
		playSong: function (path, time, args) {
			
		},
		playNext: function (previousHasEnded) {
		
		},
		playPrevious: function () {
		
		}
	},
	justType: {
		setup: function(){
			var permObj = [{"type":"db.kind","object":koto.appId + ".data:1", "caller":"com.palm.launcher", "operations":{"read":"allow"}}];
			koto.serviceRequest.request("palm://com.palm.db/", {
					method: "putPermissions",
					parameters: {"permissions":permObj},
					onSuccess: function() { Mojo.Log.info("DB permission granted successfully!");},
					onFailure: function() { Mojo.Log.error("DB failed to grant permissions!");}
			});
		},
		search: function(searchKey, callback, filter){
			var query = {"from":koto.appId + ".data:1","where":[{"prop":"searchKey","op":"?","val":searchKey, "collate": "primary"}], "orderBy": "orderKey", "limit":50}; 
			if (filter){
				//query.orderBy = undefined;
				//query.where.push({"prop":"objType","op":"=","val":filter});
			}
			koto.serviceRequest.request("palm://com.palm.db/", {
				method: "search",
				parameters: { "query": query},
				onSuccess: function(result){
					if (result.returnValue === true){ // Success
						if (filter){
							var results = [];
							for(var i = 0; i < result.results.length; i++){
								if (result.results[i].objType === filter){
									results.push(result.results[i]);
								}
							}
							callback(results);
						} else {
							callback(result.results);
						}
					}
					else {// Failure
						console.log("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
					}
				}.bind(this),
				onFailure: function(e) { console.log("Search failure! Err = " + JSON.stringify(e));}
		   }); 
		
		},
		cacheArray: function(array, callback, favorite){
			//array = JSON.parse(JSON.stringify(array_));
			var a = {
				putArray: [], 
				mergeArray: []
			}, that = this, i = 0;
			
			console.log("array.length = " + array.length);
			var cacheData = function cacheData(item){
				koto.justType.cacheSearchData(item, favorite, function(returnValue){
					if(returnValue && returnValue.action){
						a[returnValue.action + "Array"].push(returnValue.obj);
					}
					i++;
					if (i < array.length){
						cacheData(array[i]);
					} else {
						console.log("this.putArray.length: " + a.putArray.length);
						console.log("this.mergeArray.length: " + a.mergeArray.length);
						db8.putArray(a.putArray, function(){
							db8.mergeArray(a.mergeArray, callback);
						});
						//console.log("this.putArray.length: " + this.putArray.length);
						//console.log("this.mergeArray.length: " + this.mergeArray.length);
						//callback();
					}
				});
			}
			if (i < array.length){
				cacheData(array[i]);
			} else {
				callback();
			}
		},
		cacheSearchData: function(origObj, favorite, callback, index){
			var d = new Date(), obj, objType = koto.utilities.getObjType(origObj);
			switch(objType){
				case "song":
					obj = {
						"orderKey": "k",
						"searchKey": origObj.title + " " + origObj.artist + " " + ((koto.preferences.obj.indexSongsByAlbum === true)? origObj.album : ""),
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
					if (origObj.albumArt){
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
					if (origObj.songs){
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
			if (favorite){
				obj.orderKey = "a"; //make it show up first
				obj.searchKey += " Favorites";
				obj.secondary = "Favorite " + obj.secondary;
			}
			obj.objType = objType[0] + objType[1];
			obj._kind = koto.appId + ".data:1";
			obj.id = origObj._id;
			obj.lastUpdate = Math.round(d.getTime()/60000);
			
			DB.find({"select" : ["_id", "id"], "from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":obj.id}]}, false, false).then(function(future) {
				var result = future.result;
				if (result.returnValue === true){ // Success
					if (result.results.length < 1){
						if (objType === "song"){
							obj.playCount = origObj.playCount || 0;
							obj.rating = origObj.rating || 0;
						} 
						if(callback && !index){
							callback({action: "put", obj: obj});
						} else {
							db8.put(obj, callback);
						}
					}
					else {
						obj._id = result.results[0]._id;
						if(callback && !index){ //if there's a callback, let it handle the obj. this is done so koto can use the bulk merge/put functions. index arg overrided if callback
							callback({action: "merge", obj: obj});
						} else { //if not, merge myself.
							db8.merge({"from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":obj.id}]}, obj, callback);	
						}
					}
				}
				else {// Failure
					console.log("find failure: Err code=" + future.exception.errorCode + "Err message=" + future.exception.message); 
				}
			}.bind(this));
		},
		checkJustType: function(count){
			//called from getAllSongs.
			var query = {"select" : ["_id"], "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false}], "limit": 1};
			DB.find(query, true, true).then(function(future) {
				var result = future.result;
				if (result.count){
					if ((count && result.count !== count) || !count){
						koto.justType.setupIndexingDashboard();
					}
					m.songCountCookie.put(result.count);
				}
				if (result.fired){
					koto.justType.setupIndexingDashboard();
					koto.content.load.favorites();
				}
			});
			
		/*	console.log("checking just type");
			var query = {"select" : ["_id"], "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false}], "limit": 1};
			db8.exec(query, function(songs){
				if (songs.length > 0){
					m.revCookie.put(songs[0]._rev);
					console.log("putting rev");				
					if (rev && songs[0]._rev > rev){
						console.log("setting up cache");
						koto.justType.setupIndexingDashboard();
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
	},
	albumArt: {
		array: [],
		loadCustom: function(callback){
			this.array.clear();
			var query = {"select" : ["id", "albumArt"], "from":koto.appId + ".data:1", "where":[{"prop":"objType","op":"=","val":"al"}]};
			db8.exec(query, function(results){
				var albumArtIds = [], albumArt = []
				results.each(function(item, index){
					if (item.albumArt && item.albumArt !== "undefined"){
						albumArtIds.push(item.id);
						albumArt.push(item);
					}			
				}, this);
				if (albumArtIds.length > 0){
					db8.getObjsById(albumArtIds, function(albums){
						albums.each(function(item, index){
							if (item._id === albumArt[index].id){
								item.albumArt = albumArt[index].albumArt;
							} else {
								Mojo.Log.error("Wrong Id. Crap.");
							}
						}, this);
						Object.extend(koto.albumArt.array, albums);
						if (callback){
							callback();
						}
					});
				} else {
					if (callback){
						callback();
					}
				}
			}.bind(this));
		},
		set: function(album, artist, image, callback){
			koto.content.albums.getOne({name: album, artist: artist, _kind: "com.palm.media.audio.album:1"}, function(albumObj){
				albumObj.albumArt = image;
				koto.justType.cacheSearchData(albumObj, false, function(){
					koto.albumArt.loadCustom(callback);
				}, true);
			});
		},
		clear: function(album, artist, callback){
			koto.albumArt.set(album, artist, "undefined", callback);	
		},
		get: function(song, small){
			if (!song.album){
				song.album = song.name;
			}
			var album, maybeAlbum;
			for(var i = 0; i < koto.albumArt.array.length; i++){	
				if (koto.albumArt.array[i].name === song.album){//same album name
					if (koto.albumArt.array[i].artist === song.artist){//same artist, is for sure right album we want
						album =  koto.albumArt.array[i];
						break;
					} else {
						maybeAlbum = koto.albumArt.array[i];//diff artist, could be media indexing issue, or could be wrong album.. cache it for later
					}
				}
			}
			if (album === undefined && maybeAlbum !== undefined){
				album = maybeAlbum;//well since we didn't find the same album with the same artist, give the maybeAlbum
			}
			/*var album = koto.albumArt.array.find(function(item){
				if (item.name === song.name){//same album name
					if (item.artist === song.artist){//same artist, is for sure right album we want
						if (!callback){
							return koto.content.albums.array[i];
						} else {
							callback(koto.content.albums.array[i]);
							return;
						}
						break;
					} else {
						maybeAlbum = koto.content.albums.array[i];//diff artist, could be media indexing issue, or could be wrong album.. cache it for later
					}
				}
				return (item.name === song.album && item.artist === song.artist);
			}, this);*/
			if (album !== undefined && album.albumArt){
				return album.albumArt;
			} else {
				return koto.albumArt.getDefault(song.thumbnails[0]);
			}
		},
		getDefault: function(thumbnail){
			var length = (Mojo.Environment.DeviceInfo.screenHeight === 400) ? "195" : (Mojo.Environment.DeviceInfo.screenHeight === 800) ? "406" : "275";
			var widthHeightString = ":" + length + ":" + length;
			
			if (thumbnail && thumbnail.data){
					return(thumbnail.type === "embedded")?
						("/var/luna/data/extractfs" + encodeURIComponent(thumbnail.data) + widthHeightString + ":3").replace(/'/g, "&#39;").replace(/"/g, "&#34;")
						:
						thumbnail.data.replace(/'/g, "&#39;").replace(/"/g, "&#34;");
			}
			else  {
				return "images/play/default-album-art.png";
			}
		
		},
		has: function(song) {
			if (!song.album){
				song.album = song.name;
			}
			var album, maybeAlbum;
			for(var i = 0; i < koto.albumArt.array.length; i++){	
				if (koto.albumArt.array[i].name === song.album){//same album name
					if (koto.albumArt.array[i].artist === song.artist){//same artist, is for sure right album we want
						album =  koto.albumArt.array[i];
						break;
					} else {
						maybeAlbum = koto.albumArt.array[i];//diff artist, could be media indexing issue, or could be wrong album.. cache it for later
					}
				}
			}
			if (album === undefined && maybeAlbum !== undefined){
				album = maybeAlbum;//well since we didn't find the same album with the same artist, give the maybeAlbum
			}
			/*var album = koto.albumArt.array.find(function(item){
				return (item.name === song.album && item.artist === song.artist);
			}, this);*/
			if (album){
				return true;
			} else {
				return false;
			}
		}
	},
	preferences: {
		obj: {
			saveAndResume: true, //resume on launch
			defaultRepeat: 2, //repeat mode
			theme: "blue", 
			favoriteTap: "view", //what happens when you tap on fav
			playlistTap: "play", //what happens when you tap on playlist
			filterTap: "filtered", //what songs the app plays when you tap on a song in a filtered list
			albumArtScrollerNum: 40, //num of items on each side of current item in album art scroller
			marqueeText: false, //whether to marquee long titles
			alphaScroller: true, //use alpha scroller in artists/albums/songs 
			truncateText: true, //whether to truncate song names in lists
			metrixToggle: true, //whether to allow metrix
			useDashboard: true, 
			closeDashboard: true, //whether to close dashboard when the card is closed
			indexSongsByAlbum: true, //whether to show a song in Just Type if the album is searched for
			lastfm: {
				username: "",
				sessionKey: "",
				scrobble: true //on/off
			},
			twitter: {
				username: "", 
				authorized: false, 
				token: "", 
				secret: ""
			},
			/*dropbox: {            
				displayName: '',
				token: '',
				secret: ''
			},*/
			startItems: [ //items on main page
				{label: "Artists", command: "artists"},
				{label: "Albums", command: "albums"},
				{label: "Songs", command: "songs"},
				{label: "Genres", command: "genres"},
				{label: "Playlists", command: "playlists"},
				{label: "Favorites", command: "favorites"}
			]
		},
		cookie: new Mojo.Model.Cookie("preferences_KotoPlayer"),
		get: function () {
			//this is koto.preferences
			var prefData = this.cookie.get();
			if (prefData) {
				if (prefData.theme !== undefined) {
					this.obj.theme = prefData.theme;
				}
				if (prefData.saveAndResume !== undefined) {
					this.obj.saveAndResume = prefData.saveAndResume;
				}
				if (prefData.defaultRepeat !== undefined && prefData.defaultRepeat && !isNaN(parseInt(prefData.defaultRepeat, 10))) {
					this.obj.defaultRepeat = prefData.defaultRepeat;
				}
				if (prefData.playlistTap !== undefined) {
					this.obj.playlistTap = prefData.playlistTap;
				}
				if (prefData.favoriteTap !== undefined) {
					this.obj.favoriteTap = prefData.favoriteTap;
				}
				if (prefData.filterTap !== undefined) {
					this.obj.filterTap = prefData.filterTap;
				}
				if (prefData.albumArtScrollerNum !== undefined) {
					this.obj.albumArtScrollerNum = prefData.albumArtScrollerNum;
				}
				if (prefData.marqueeText !== undefined) {
					this.obj.marqueeText = prefData.marqueeText;	
				}
				if (prefData.alphaScroller !== undefined) {
					this.obj.alphaScroller = prefData.alphaScroller;	
				}
				if (prefData.truncateText !== undefined) {
					this.obj.truncateText = prefData.truncateText;	
				}
				if (prefData.metrixToggle !== undefined) {
					this.obj.metrixToggle = prefData.metrixToggle;
				}
				if (prefData.closeDashboard !== undefined) {
					this.obj.closeDashboard = prefData.closeDashboard;
				}
				if (prefData.useDashboard !== undefined) {
					this.obj.useDashboard = prefData.useDashboard;
				}
				if (prefData.indexSongsByAlbum !== undefined) {
					this.obj.indexSongsByAlbum = prefData.indexSongsByAlbum;
				}
				if (prefData.lastfm !== undefined) {
					this.obj.lastfm = prefData.lastfm;
				}
				if (prefData.twitter !== undefined) {
					this.obj.twitter = prefData.twitter;
				}
				if (api_keys) {
					koto.Twitter = new xTwitter({
						consumerKey: api_keys.twitter_consumerKey,
						consumerSecret: api_keys.twitter_consumerSecret,
						follow: {
							username: 'Koto_Player'
						}
					}, this.obj.twitter);
				}
				/*if (prefData.dropbox !== undefined) {
					this.obj.dropbox = prefData.dropbox;
				}*/
				if (prefData.startItems !== undefined && prefData.startItems && prefData.startItems.length > 0 && prefData.startItems[0].command && prefData.startItems[0].label) {
					this.obj.startItems = prefData.startItems;
				}
			}
		
		},
		store: function () {
			this.cookie.put(this.obj);
		}
	},
	utilities: {
		getObjType: function (obj) {
			if (obj && obj.title) { //USED in LOTS of stuff, mostly in list-assistant.js
				return "song";
			} else if (obj && obj._kind) {
				switch (obj._kind) {
					case "com.palm.media.audio.artist:1":
						return "artist";
						//break;
					case "com.palm.media.audio.album:1":
						return "album";
						//break;
					case "com.palm.media.audio.genre:1":
						return "genre";
						//break;
					case "com.palm.media.playlist.object:1":
					case koto.appId + ".playlists:1":
						return "playlist";
				}
			}
		},
		delegate: function(funcName, arg){
			try {
				Mojo.Controller.getAppController().getStageController("cardStage").delegateToSceneAssistant(funcName, arg);
			}catch(e){};//so it errors silently when you swipe card off
		},
		showingPlayer: function(){
			return (Mojo.Controller.getAppController().getStageController("cardStage").activeScene().sceneName === "play");
		},
		shuffle: function(array) {
			var tmp, current, top = array.length;
			if (top) while(--top) {
				current = Math.floor(Math.random() * (top + 1));
				tmp = array[current];
				array[current] = array[top];
				array[top] = tmp;
			}
			return array;
		},
		formatTime: function(sec){
			function pad(s){
				if (s < 10)
					return "0" + s;
				else
					return s;
			}
			if (!sec)
				return "0:00";
			return (Math.floor(sec/60))+":"+pad(Math.floor(sec%60));
		},
		formatDate: function(d){
			var year = d.getFullYear().toString(); 
			month = d.getMonth()+1;
			if (month < 10)
				month = '0' + month;
			day = d.getDate();
			if (day < 10)
				day = '0'+ day;
			var date =  month + "/" + day +"/"+ year.charAt(2)+year.charAt(3);		
			
			var hours = d.getHours().toString();
			var	apm = "AM";
			if (Mojo.Format.using12HrTime() === true){
				if (hours >= 12){
					hours = hours - 12;
					apm = "PM";
				}
				if (hours === 0)
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
		sortRegex: /^(the\s|an\s|a\s)(.*)/i,
		sortContentList: function(array){
			if (array.length > 0){
				var sortBy = array[0].title ? "title" : "name";
			}
			function sortFunction(a,b) {
				var x = a[sortBy].replace(koto.utilities.sortRegex, "$2").toLowerCase()
				var y = b[sortBy].replace(koto.utilities.sortRegex, "$2").toLowerCase();
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			}
			/*array = array.sortBy(function(obj){
				return obj[sortBy].replace(regex, "");
			}, this);*/
			array.sort(sortFunction);
			uniqArray(array);
		}
	}
};