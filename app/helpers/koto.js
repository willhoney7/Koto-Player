/*jslint white: false, onevar: true, undef: true, nomen: false, regexp: true, plusplus: true, bitwise: true, newcap: true, maxerr: 100, indent: 4 */
/*global Mojo m console Audio api_keys xTwitter db8 Metrix ServiceRequestWrapper AjaxRequestWrapper*/
var koto = {
	//variables
	appId: Mojo.appInfo.id,
	metrix: new Metrix(),
	serviceRequest: new ServiceRequestWrapper(),
	ajaxRequest: new AjaxRequestWrapper(),
	appController: {},
	cardController: {},
	setup: function (arg) {

		//setup global references to the controllers
		koto.appController = Mojo.Controller.getAppController();
		koto.cardController = koto.appController.getStageController("cardStage");
			
		if ((arg && arg.action === "setup") || !arg) {
			try {	
				//setup stuff
				db8.setup(function() {
				
					koto.preferences.get();
					
						//set stylesheet
						koto.cardController.loadStylesheet("stylesheets/" + koto.preferences.obj.theme + ".css");
						
						koto.albumArt.loadCustom(function () {
							//if auto resume is on, resume this stuff
							if(koto.preferences.obj.saveAndResume === true && (!arg || (arg && !arg.delayResume))){
								koto.nowPlaying.load();
							}
							//getPermissions for media
							koto.setupFunctions.getPermissions(function () {
								//now load content
								koto.content.load();

							});
						});
					
					koto.justType.setup();
					koto.setupFunctions.setupAudioObj();
					koto.setupFunctions.setupControlListeners();
				});
			} catch(e){
				koto.cardController.swapScene("error", e, false);
			}
			
		} else if (arg && arg.action === "load") {
			//we just want to load, no setup
			koto.albumArt.loadCustom(function () {
				koto.setupFunctions.getPermissions(function () {
					koto.content.load();
				});
			});
			
		} else if (arg && arg.action === "fromDashboard") {
			//set stylesheet
			koto.cardController.loadStylesheet("stylesheets/" + koto.preferences.obj.theme + ".css");
			//nothing else to do...
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
						koto.utilities.dialogError($L({value:"The app can not access your music... ", key:"error_accessmusic"}) + Object.toJSON(response));	
					}
				}.bind(this)  
			});
		},
		setupAudioObj: function (eventHandler){
			eventHandler = /*eventHandler ||*/ function(event){

				var throttledProgressUpdate = _.throttle(function(){
					koto.utilities.delegate("_updateProgress");						
				}, 300);

				//console.log("event sent: " + event.type);
				switch(event.type){
					case "pause":
						koto.nowPlaying.handlePause();
						break;
					case "play":
						koto.nowPlaying.handlePlay();
						break;
					case "timeupdate":
						throttledProgressUpdate();
						break;
					case "ended":
						var currentId = koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]._id, currentObj = koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index];
						koto.nowPlaying.playNext(true);
						koto.justType.incrementPlayCount(currentId);
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
								koto.nowPlaying.pause();
							}
							else{
								koto.nowPlaying.resume();
							}
						}
						if (button.state === "double_click"){
							koto.nowPlaying.playNext();
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
								koto.nowPlaying.resume();
								break;
							case "pause":
								koto.nowPlaying.pause();
								break;	
							case "next":
								koto.nowPlaying.playNext();
								break;
							case "prev":
								koto.nowPlaying.playPrevious();
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
						this.array = koto.utilities.sortContentList(this.array);

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
						koto.utilities.bannerError("Error: No Songs by Artist");
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
								albums[i].songs = [];
								_(songs).each(function(song){
									if(song.artist === artist){
										albums[i].songs.push(song);
									}
								});
								//add songs 

								artistSongs = [].concat(artistSongs, albums[i].songs);
								i++;
								if (i < albums.length){
									getAlbumSongs(albums[i]);
								} else {
									callback(albums, artistSongs);
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
										albums = _.sortBy(albums, function(album){
											return album.name;
										});
										var artistSongs = [];
										for(var i = 0; i < albums.length; i++){
											artistSongs = artistSongs.concat(albums[i].songs);
										}
										callback(albums, artistSongs);
									}
								}
								
							} else {
								console.log("Well you're in trouble.");
								koto.utilities.bannerError($L({value:"Error: No Songs by Artist", key:"error_noartistsongs"}));
							}
						}.bind(this));
					}
				}.bind(this));
			},
			getAlbumsOfOne: function(artist, callback){
				var query = {"select" : ["name", "artist", "total.tracks", "_id", "_kind", "thumbnails"], "where" : [{"prop":"artist","op":"=","val":artist}], "from":"com.palm.media.audio.album:1" };
				db8.exec(query, function(albums){
					albums = _.sortBy(albums, function(album){
						return album.name;
					})
					callback(albums);
				}.bind(this));
			},
			viewOne: function(artist){
				koto.content.artists.getFormattedSongsOfOne(artist, function(formattedSongs, songs, error){
					if (!error){
						koto.cardController.pushScene("artist-view", {name: artist, albums: formattedSongs, songs: songs, _kind: "com.palm.media.audio.artist:1"}, focus);
					} else if (error) {
					
					}
				}.bind(this));
			}
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
						this.array = koto.utilities.sortContentList(this.array);
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
						songs = _.sortBy(songs, function(song){
							return parseInt(song.track.position, 10);
						});
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
			viewOne: function(album_){
				var album = (album_.artist) ? album_ : koto.content.albums.getOne({name: album_.name || album_, artist: ""});
				console.log("album.artist " + album.artist);
				koto.content.albums.getSongsOfOne({album: album.name, albumArtist: album.artist}, function(songs){
					album.songs = songs;
					album.open = true;
					koto.cardController.pushScene("artist-view", {name: album.artist, albums: [album], songs: songs, _kind: "com.palm.media.audio.artist:1"});
				});
			},
		},
		songs: {
			array: [],
			propertiesArray: ["_id", "title", "artist", "album", "albumArtist", "genre", "path", "thumbnails", "duration", "track.position"],
			load: function (callback) {
				var _milliseconds = new Date().getTime();
				this.array = [];
				var query = {"select" : koto.content.songs.propertiesArray, "from":"com.palm.media.audio.file:1", "where":[{"prop":"isRingtone","op":"=","val":false}], "orderBy":"title"};
				//console.log("------------- GETTING SONGS --------------");
				koto.content.songs.get("title", function(songs){
					
					var d = new Date();
					console.log("Got songs. Took " + (parseInt(d.getTime(), 10) - parseInt(_milliseconds, 10)) + " milliseconds");
					koto.content.songs.array = koto.utilities.sortContentList(songs);
					
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
						//koto.content.playlists.array.push(array[i]);
					}
					//koto.content.playlists.array = array.clone();
					var query = { "select" : ["name", "path", "songIds", "_id", "_kind"], "orderBy": "name", "from":"com.palm.media.playlist.object:1"};
					
					db8.exec(query, function(array){
						var i = 0;//Dunno if this works....
						function addSongs(obj){
							//db8.getObjsById(obj.songIds, function(songs){
								obj.songs = obj.songIds;
								obj.preventDelete = true;
								obj.type = "M3U";
								i++;
								if (i < array.length){
									addSongs(array[i]);
								} else {
									Object.extend(koto.content.playlists.m3uArray, array);
									koto.content.playlists.array = [].concat(koto.content.playlists.m3uArray, koto.content.playlists.autoArray, koto.content.playlists.customArray);
									
									if(callback){
										callback();
									}
								}
							//}.bind(this)); 
						}
						if(i < array.length){						
							addSongs(array[i]);
						} else {
							Object.extend(koto.content.playlists.m3uArray, array);		
							koto.content.playlists.array = [].concat(koto.content.playlists.m3uArray, koto.content.playlists.autoArray, koto.content.playlists.customArray);
							
							if(callback){
								callback();
							}
						}
					}.bind(this));
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
					koto.content.playlists.array.splice(i, 1);
					koto.content.playlists.customArray.splice(i-3, 1);
				}
				else {
					for(var j = 0; j < koto.content.playlists.array.length; j++){
						if (koto.content.playlists.array[j].name === name){
							koto.content.playlists.array.slice(j, 1);
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
				if (playlist.songs || playlist.songIds){
					db8.getObjsById(playlist.songs || playlist.songIds, function(songs){
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
						koto.utilities.bannerError($L({value:"You already added this!", key:"error_alreadyadded"}));
						break;
					}
					if (i === (koto.content.favorites.array.length-1) || koto.content.favorites.array.length === 0){
						db8.put({"_kind": koto.appId + ".favorites:1", "id": obj["_id"], "position": koto.content.favorites.array.length}, function(){
							koto.content.favorites.array.push(obj);
							koto.justType.cacheSearchData(obj, true);
							koto.utilities.bannerAlert($L("Added to Favorites"), {action: "pushScene", scene: "list", data: "favorites"});
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
									koto.cardController.getScenes()[0].assistant.loaded();
									
									if (koto.justType.songCountCookie.get()){
										koto.justType.checkJustType.defer(koto.justType.songCountCookie.get());
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
					console.error("Error! Object does not have a type");
					break;
			}
		},
		view: function(obj, array){
			var objType = obj.type || koto.utilities.getObjType(obj);
			if (objType ==="artist"){
				koto.content.artists.viewOne(obj.name);
			} else if (objType === "album"){
				koto.content.albums.viewOne(obj);
			} else {
				koto.content.viewArray(obj, array);
			}
		},
		viewArray: function(titleObj, array){
			koto.cardController.pushScene("view", titleObj, array);
		},
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
		/* * * * * * * * * * * * * * * * * * * * * * * * * 
		 * * * Functions with currently playing songs* * *
		 * * * * * * * * * * * * * * * * * * * * * * * * */
		resume: function(){
			if (getFileInfo(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path).extension !== ".m4p"){
				koto.nowPlaying.currentInfo.audioObj.play();
			}			
		},
		handlePlay: function(){	
			//this is the function that gets added as the listener to playevents
			koto.nowPlaying.currentInfo.playing = true;
			koto.utilities.delegate("_resume");
			koto.dashboard.update();
		},
		pause: function(){
			koto.nowPlaying.currentInfo.audioObj.pause();	
		},
		handlePause: function(){
			koto.nowPlaying.currentInfo.playing = false;
			koto.utilities.delegate("_pause");
			koto.dashboard.update();
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
						koto.nowPlaying.playPrevious(true);
					} else {
						koto.nowPlaying.playNext(false, true);
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
			//koto.nowPlaying.currentInfo.audioObj.addEventListener("error", koto.nowPlaying.playNext.bind(this), true);

			//if (koto.preferences.obj.lastfm.sessionKey !== "" && koto.preferences.obj.lastfm.scrobble === true){
			//	lastfm.scrobble(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]);
			//}
			if (koto.preferences.obj.lastfm.sessionKey !== "" && koto.preferences.obj.lastfm.scrobble === true){
				lastfm.updateNowPlaying();
			}
			  
		},
		playNext: function (ended, play) {
			var oldIndex = koto.nowPlaying.currentInfo.index;
			if (koto.nowPlaying.currentInfo.index !== koto.nowPlaying.currentInfo.songs.length-1){
				koto.nowPlaying.currentInfo.index++;
			}else {
				koto.nowPlaying.currentInfo.index = 0;
			}
			koto.utilities.delegate("_playNext", ended);
			if (koto.nowPlaying.currentInfo.playing === true){
				if (oldIndex === koto.nowPlaying.currentInfo.songs.length-1 && ended){
					if (koto.nowPlaying.currentInfo.repeat > 0){
						koto.nowPlaying.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path, 0, play, "next");
						if (koto.nowPlaying.currentInfo.repeat === 1){
							koto.nowPlaying.currentInfo.repeat = 0;
						}	
					}else {
						koto.nowPlaying.stop();
					}
				} 
				else {
					try {
						koto.nowPlaying.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path, 0, play, "next");
					}catch(e){console.log("tried to play song: " + e)};
				}
			}else {
				try {
					koto.nowPlaying.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path, 0, (play !== undefined)? play: false, "next");
				}catch(e){console.log("tried to play song: " + e)};
			}
			if (ended){
				koto.dashboard.update();
			}
			//koto.nowPlaying.currentInfo.audioObj.removeEventListener("error", koto.nowPlaying.playNext.bind(this), true);
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
					koto.nowPlaying.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path, undefined, undefined, "previous");
				}catch(e){console.log(e)};

				koto.utilities.delegate("_playPrevious");
			}
			//koto.nowPlaying.currentInfo.audioObj.removeEventListener("error", koto.nowPlaying.playNext.bind(this), true);
		
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
		shuffle: function(){
			koto.nowPlaying.currentInfo.unshuffledSongs.clear();
			Object.extend(koto.nowPlaying.currentInfo.unshuffledSongs, koto.nowPlaying.currentInfo.songs.clone());
			var nowPlayingItem = koto.nowPlaying.currentInfo.songs.splice(koto.nowPlaying.currentInfo.index, 1)[0];
			var newSongs = koto.nowPlaying.currentInfo.songs.clone();
			koto.nowPlaying.currentInfo.songs.clear();
			Object.extend(koto.nowPlaying.currentInfo.songs, koto.utilities.shuffle(newSongs));
			koto.nowPlaying.currentInfo.songs.unshift(nowPlayingItem);
			koto.nowPlaying.currentInfo.index = 0;
			
		},
		unshuffle: function(){
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
		/* * * * * * * * * * * * * *
		 * * * Array Functions * * *
		 * * * * * * * * * * * * * */
		playArray: function(array, index, arg){
			//var d = new Date();
			//milliseconds = d.getTime();

			if (koto.nowPlaying.currentInfo.songs.length > 0){
				//koto.nowPlaying.save();//save old songs
				koto.nowPlaying.deferSave();
				koto.nowPlaying.hasSaved = true;
			}
			
			//var d = new Date();
			//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after deffering save now playing");	

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
			}
			
			if (array.length < 1){ 
				koto.utilities.bannerError($L({value:"Error Playing: No Songs", key:"error_nosongs"}));
				return;
			}
			koto.nowPlaying.currentInfo.unshuffledSongs.clear();
			if (arg && arg.shuffled && arg.unshuffledSongs){
				Object.extend(koto.nowPlaying.currentInfo.unshuffledSongs, arg.unshuffledSongs);
			}
			
			//var d = new Date();
			//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after setting up unshuffled songs");	
			
			koto.nowPlaying.currentInfo.songs.clear();
			
			Object.extend(koto.nowPlaying.currentInfo.songs, array);
			koto.nowPlaying.currentInfo.index = index;
			koto.nowPlaying.currentInfo.playing = true;
			koto.nowPlaying.currentInfo.repeat = koto.preferences.obj.defaultRepeat;
			
			//var d = new Date();
			//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after setting up nP object");	
			
			koto.nowPlaying.pushPlay();
			//var d = new Date();
			//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after pushing play");			
			if (arg && arg.time){
				koto.nowPlaying.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path, arg.time);
			}
			else {
				koto.nowPlaying.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path);
			}
			
			//var d = new Date();
			//console.log((parseInt(d.getTime()) - parseInt(milliseconds)) + " milliseconds after playing song");	
			
		},
		shufflePlayArray: function(array){
			if (koto.appId === "com.tibfib.app.koto.lite"){
				array = array.slice(0, 10);
			}
			koto.nowPlaying.playArray(koto.utilities.shuffle(array.clone()), 0, {shuffled: true, unshuffledSongs: array});
		},
		playArrayNext: function(array){
			var firstArray = koto.nowPlaying.currentInfo.songs.slice(0, koto.nowPlaying.currentInfo.index+1);
			var secondArray = koto.nowPlaying.currentInfo.songs.slice(koto.nowPlaying.currentInfo.index+1);
			koto.nowPlaying.currentInfo.songs.clear();
			Object.extend(koto.nowPlaying.currentInfo.songs, [].concat(firstArray, array, secondArray));
			if(koto.nowPlaying.currentInfo.unshuffledSongs.length > 0){
				var newUnshuffledSongs =  [].concat(koto.nowPlaying.currentInfo.unshuffledSongs, array);
				if (koto.appId === "com.tibfib.app.koto.lite"){
					newUnshuffledSongs = newUnshuffledSongs.slice(0, 10);
				}
				Object.extend(koto.nowPlaying.currentInfo.unshuffledSongs, newUnshuffledSongs);
			}
			koto.nowPlaying.liteCheck();
		},
		playArrayLast: function(array){
			var origSongs = koto.nowPlaying.currentInfo.songs.clone();
			koto.nowPlaying.currentInfo.songs.clear();
			Object.extend(koto.nowPlaying.currentInfo.songs, origSongs.concat(array));
			if(koto.nowPlaying.currentInfo.unshuffledSongs.length > 0){
				var newUnshuffledSongs =  [].concat(koto.nowPlaying.currentInfo.unshuffledSongs, array);
				if (koto.appId === "com.tibfib.app.koto.lite"){
					newUnshuffledSongs = newUnshuffledSongs.slice(0, 10);
				}
				Object.extend(koto.nowPlaying.currentInfo.unshuffledSongs, newUnshuffledSongs);
			}
			koto.nowPlaying.liteCheck();
			
		},
		/* * * * * * * * * * * * * * * * * *
		 * * * Save/Resume Now Playing * * *
		 * * * * * * * * * * * * * * * * * */
		hasSaved: false,
		save: function(callback){
			db8.merge({"from":koto.appId + ".playlists:1", "where":[{"prop":"name","op":"=","val":"_now_playing"}]}, {
				time: koto.nowPlaying.currentInfo.audioObj.currentTime,
				songs: koto.nowPlaying.currentInfo.songs,
				unshuffledSongs: koto.nowPlaying.currentInfo.unshuffledSongs,
				index: koto.nowPlaying.currentInfo.index
			}, callback);
		},
		deferSave: function(){
			var time = koto.nowPlaying.currentInfo.audioObj.currentTime, 
				songs = koto.nowPlaying.currentInfo.songs.clone(), 
				unshuffledSongs = koto.nowPlaying.currentInfo.unshuffledSongs.clone(), 
				index = koto.nowPlaying.currentInfo.index;

			db8.merge.defer({"from":koto.appId + ".playlists:1", "where":[{"prop":"name","op":"=","val":"_now_playing"}]}, {
				time: time,
				songs: songs,
				unshuffledSongs: unshuffledSongs,
				index: index
			});
		},
		load: function(){
			//if (m.isDbSearch === false && m.launchPlayer === false){
				db8.exec({"select" : ["name", "time","songs", "index", "unshuffledSongs"], "from":koto.appId + ".playlists:1", "where":[{"prop":"name","op":"=","val":"_now_playing"}]}, 
				function(results){
					if (results[0] && results[0].songs && results[0].songs.length > 0){
						koto.nowPlaying.playArray(results[0].songs, results[0].index, {time: results[0].time, shuffled: (results[0].unshuffledSongs.length > 0), unshuffledSongs: results[0].unshuffledSongs.clone()});
					}
				}.bind(this));
			//} else if (m.launchPlayer === true){
			//	koto.nowPlaying.pushPlay(true);
			//}
			//m.isDbSearch = false;
		},
		// Push the play scene
		pushPlay: function(justPush){
			if (justPush){
				koto.cardController.pushScene("play");
			} else {
				if (koto.cardController.activeScene().sceneName !== "play"){
					var playPushed, scenes = koto.cardController.getScenes();
					for(var i = 0; i < scenes.length; i++){
						if (scenes[i].sceneName === "play"){
							playPushed = true;
							break;
						}
					}
					if (playPushed !== true){
						koto.cardController.pushScene("play");
					}else {
						koto.cardController.popScenesTo("play");
						koto.cardController.swapScene({name: "play", transition: Mojo.Transition.zoomFade});

					}
				}
				else {
					koto.cardController.swapScene({name: "play", transition: Mojo.Transition.crossFade});		
				}	
			}		
		}
	},
	justType: {
		songCountCookie: new Mojo.Model.Cookie("songCount_KotoPlayer"),		
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
						"secondary": objType.capitalize() + " - " + origObj.artist + " - " + origObj.total.tracks + $L(" Track(s)")
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
						"secondary": objType.capitalize() + " - " + origObj.total.albums + $L(" Album(s)") + " - " + origObj.total.tracks + $L(" Track(s)")
					};
					break;
				case "playlist":
					obj = {
						"orderKey": "g",
						"searchKey": origObj.name + $L(" Playlists"),
						"display": origObj.name
					}
					if (origObj.songs){
						obj["secondary"] = objType.capitalize() + " - " + origObj.songs.length + $L(" Track(s)");
					}else {
						obj["secondary"] = $L("Auto Playlist");
					}
					break;
				case "genre":
					obj = {
						"orderKey": "m",
						"searchKey": origObj.name + $L(" Genres"),
						"display": origObj.name,
						"secondary": objType.capitalize() + " - " + origObj.total.tracks + $L(" Track(s)")
					}
					break;
			}
			if (favorite){
				obj.orderKey = "a"; //make it show up first
				obj.searchKey += $L(" Favorites");
				obj.secondary = $L("Favorite ") + obj.secondary;
			}
			obj.objType = objType[0] + objType[1];
			obj._kind = koto.appId + ".data:1";
			obj.id = origObj._id;
			obj.lastUpdate = Math.round(d.getTime()/60000);
			
			db8.DB.find({"select" : ["_id", "id"], "from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":obj.id}]}, false, false).then(function(future) {
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
			db8.DB.find(query, true, true).then(function(future) {
				var result = future.result;
				if (result.count){
					if ((count && result.count !== count) || !count){
						koto.justType.setupIndexingDashboard();
					}
					koto.justType.songCountCookie.put(result.count);
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
		setupIndexingDashboard: function(){
			dashboardStage = Mojo.Controller.getAppController().getStageController("cacheStage");
			pushDashboard = function (stageController) {
				stageController.pushScene('cache');
			};
			Mojo.Controller.getAppController().createStageWithCallback({name: "cacheStage", lightweight: true, clickableWhenLocked: true}, pushDashboard, 'dashboard');
		
		},
		// Now for the rating/bookmarks/playcount functions
		getSongData: function(id, callback){
			var query = {"select" : ["rating", "playCount", "lastPlayed", "bookmarks"], "from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]};	
			db8.exec(query, function(results){
				if (results.length > 0){
					callback(results[0]);
				} else {
					callback({playCount: 0, rating: 0, bookmarks: [], lastPlayed: "n/a"});
					//koto.utilities.bannerError("Song details not found");
				}
			}.bind(this));
		},
		incrementPlayCount: function(id){
			var query = {"select" : ["rating", "playCount", "bookmarks"], "from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]};
			db8.DB.find(query, false, false).then(function(future) {
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
						var obj = {
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
			var query = {"select" : ["rating", "playCount", "bookmarks"], "from":koto.appId + ".data:1", "where":[{"prop":"id","op":"=","val":id}]};
			db8.DB.find(query, false, false).then(function(future) {
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
	dashboard: {
		show: function(){
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
		update: function(){
			if (Mojo.Controller.getAppController().getStageController("dashboardStage")){
				Mojo.Controller.getAppController().getStageController("dashboardStage").delegateToSceneAssistant("displayDashboard");
			}
		},
		hide: function(){
			Mojo.Controller.getAppController().closeStage("dashboardStage");
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
				{label: $L("Artists"), command: "artists"},
				{label: $L("Albums"), command: "albums"},
				{label: $L("Songs"), command: "songs"},
				{label: $L("Genres"), command: "genres"},
				{label: $L("Playlists"), command: "playlists"},
				{label: $L("Favorites"), command: "favorites"}
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
					koto.twitter = new xTwitter({
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
		getObjType: function (obj) { //USED in LOTS of stuff, mostly in list-assistant.js
			if (obj && obj.title) { 
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
					default: 
						console.error("Obj has no type");
						break;
				}
			}
		},
		delegate: function(funcName, arg){
			if(koto.appController && koto.cardController){
				koto.cardController.delegateToSceneAssistant(funcName, arg);
			}
		},
		showingPlayer: function(){
			return (koto.cardController.activeScene().sceneName === "play");
		},
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
			koto.utilities.sortRegex = /^(the\s|an\s|a\s)(.*)/i;
			//console.error(Object.toJSON(array));
			if (array.length > 1){
				var sortBy = (array[0].title !== undefined) ? "title" : "name";
				var sortedArray = _.sortBy(array, function(item){
					return item[sortBy].replace(koto.utilities.sortRegex, "$2, $1").toLowerCase();
				});
				return uniqArray(sortedArray);
			} else {
				return array;
			}
		},
		setupHandleLaunchStage: function(arg){
			pushScene = function (stageController) {
				stageController.pushScene('handleLaunch', arg);
			};
			Mojo.Controller.getAppController().createStageWithCallback({name: "handleLaunchStage", lightweight: true, clickableWhenLocked: true}, pushScene, 'card');
		
		},	
		dialogAlert: function(alert){
		
		},
		dialogError: function(error){
			if (Mojo.Controller.getAppController().getActiveStageController().activeScene()){
				var window = Mojo.Controller.getAppController().getActiveStageController().activeScene().window;
				Mojo.Controller.errorDialog(error, window);
			}else {
				koto.utilities.bannerError(error);
			}
		},
		bannerAlert: function(msg, params){
			launchParams = params || {action: "nothing"};
			Mojo.Controller.getAppController().showBanner({messageText: msg}, launchParams, "notification");	
		},
		bannerError: function(error, params){
			launchParams = params || {action: "nothing"};
			Mojo.Controller.getAppController().showBanner({messageText: error, icon: 'images/error-icon.png'}, launchParams, "error");	
		}
	}
};