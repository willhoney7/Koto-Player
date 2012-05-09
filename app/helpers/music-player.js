//deprecated as of any version past 0.7.1.
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
				
				koto.content.view({type: "album", name: "alb name"}
					   {type: "artist", name: "artist name"}
				koto.content.albums.viewOne(albumName);
				koto.content.artists.viewOne(artistName)
			
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
	},
 * Utilities Functions
  
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
					koto.content.playlists.array += array;
				}
			}
		}
	},
*/

	