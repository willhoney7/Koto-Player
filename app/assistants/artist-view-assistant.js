function ArtistViewAssistant(artist, focus) {
	this.artist = artist; // artist.albums // artist.songs
	this.focus = focus || null;
	
	scene_helpers.addControlSceneMethods(this);
}

ArtistViewAssistant.prototype.setup = function() {
	this.initViewMenu(this.artist.name);
	this.initCmdMenu();
	this.setupCommon();
	this.listAttrs = {
		itemTemplate:'view/list-item-album-info',
		formatters: {
			"albumArt": function(value, model){
				if(model.thumbnails){
					return m.getAlbumArt(model);
				}
			},
			"tracks": function(value, model){
				if(model.total && model.total.tracks){
					var tracks = (model.total.tracks > 1)?model.total.tracks + " Tracks": model.total.tracks + " Track";
					return tracks;
				}
			}
		},
		swipeToDelete:false, 
		reorderable:false
	};
	this.listModel = {            
        items: this.artist.albums
    };  
	
	this.innerListAttrs = {
		itemTemplate:'list/list-item',
		listTemplate:'list/innerList-list',
		formatters: {
			"info": function(value, model){
				if(model.title){
					return model.artist + " - " + model.album;
				}
			},
			"truncatingOption": function(value, model){
				if(!m.prefs.truncateText){
					return "innerList-item noTruncate";
				} else {
					return "innerList-item";
				}
			}.bind(this),
		},			
		swipeToDelete: false, 
		reorderable: false,
		itemsProperty: "songs"
	};
	
	this.controller.setupWidget("results_list", this.listAttrs, this.listModel);
	this.controller.setupWidget("sub-list", this.innerListAttrs);
	this.controller.setupWidget("drawer", {unstyled: true});
	
	this.listTapHandler = this.listTap.bind(this);
	this.controller.listen(this.controller.get("results_list"), Mojo.Event.listTap, this.listTapHandler);

};

ArtistViewAssistant.prototype.activate = function(event) {
	if(this.focus){
		var index;
		for(var i = 0; i < this.artist.albums.length; i++){
			if(this.artist.albums[i].name === this.focus){
				index = i;
				break;
			}
		}
		if(index > 0){
			this.controller.getSceneScroller().mojo.adjustBy(0, (-99*index));
		}
	}
	this.activateCommon();
};

ArtistViewAssistant.prototype.listTap = function(event) {
	objType = m.getObjType(event.item);
	if((event.originalEvent.target.id && event.originalEvent.target.id == 'popup') || (objType === "album" && this.artist.albums.length == 1 && event.originalEvent.target.className !=="album-art-list-item")){
		var items = [];
		if(objType === "album")
			items.push({label: $L('Play Album'), command: 'play-now'}, {label: $L('Shuffle Album'), command: 'shuffle-play'});
		if(m.nP.songs.length > 0)
			items.push({label: $L('Play Next'), command: 'play-next'},{label: $L('Play Last'), command: 'play-last'});
		if(objType === "song" && !event.fromSongDetails){
			items.push({label: $L("Song Details"), command: "details"}, 
				{label: $L('Add to Playlist'), command: 'add-to-playlist'}
			);
		} else if(objType === "album"){
			items.push({label: $L('Add to Playlist'), command: 'add-to-playlist'});
		}
		items.push({label: $L('Favorite'), command: 'favorite'});
		
		this.controller.popupSubmenu({
			onChoose: function(value){
				if(objType === "song"){
					switch(value){
						case 'play-next':
							m.playArrayNext([event.item]); 
							break;
						case 'play-last':
							m.playArrayLast([event.item]); 	
							break;
						case 'add-to-playlist':
							this.extraDiv.mojo.show("addToPlaylist", [event.item]);
							break;
						case 'favorite':
							m.addToFavorites(event.item);
							break;
						case "details": 
							m.getSongsOfObj(event.item, function(songs){
								var index;
								for(var i = 0; i < songs.length; i++){
									if(songs[i]._id === event.item._id){
										index = i;
										break;
									}
								}
								this.extraDiv.mojo.toggle("songDetails", songs, index);
							}.bind(this), true); //get ALL songs by artist, unformatted
							break;
					}
				}else if(objType === "album"){
					switch(value){
						case "shuffle-play":
							m.shufflePlay(event.item.songs);
							break;
						case 'play-now':
							m.playArray(event.item.songs, 0);
							break;
						case 'play-next':
							m.playArrayNext(event.item.songs); 
							break;
						case 'play-last':
							m.playArrayLast(event.item.songs); 	
							break;
						case 'add-to-playlist':
							this.extraDiv.mojo.show("addToPlaylist", event.item.songs);
							break;
						case 'favorite':
							m.addToFavorites(event.item);
							break;
						
					}
				}
			}.bind(this),
			placeNear: event.originalEvent.target,
				items: items
		});
	} else if(event.originalEvent.target.className === "album-art-list-item"){
		//if album art image
		var items = [
			{label: "Download New Album Art", command: "download"},
			{label: "Cancel", command: "cancel"}	
		];
		if(m.hasCustomAlbumArt(event.item)){
			items.splice(1, 0, {label: "Return to Default Album Art", command: "remove"});
		}
		this.controller.popupSubmenu({
			onChoose: function(value){
				switch(value){
					case 'download':
						this.extraDiv.mojo.show("albumArtDownloader", event.item.name, event.item.artist);
						break;
					case "remove":
						m.setAlbumArt(event.item.name, event.item.artist, "undefined", this.refreshList.bind(this));
						break;			
				}
			}.bind(this),
			placeNear: event.originalEvent.target,
				items: items
		});
	}
	else if(objType === "album"){
		event.item.open = !event.item.open;
		this.controller.modelChanged(event.item);
	}
	else if(objType === "song"){
		m.playArray(event.model.songs, event.index);
	}
};

ArtistViewAssistant.prototype.moreTap = function(event){
	var items = [
			{label: $L('Shuffle All'), command: 'shuffle-songs'},	
			{},
			{label: $L('Add to Playlist'), command: 'add-to-playlist'},
			{label: $L('Favorite'), command: 'favorite'}
		]
		if(m.nP.songs.length > 0){
			items.splice(1, 0, {label: $L("Play All ..."), items: [
				{label: $L('Now'), command: 'play-songs'},
				{label: $L('Next'), command: 'play-next'},
				{label: $L('Last'), command: 'play-last'}			
			]});;
		}

	this.controller.popupSubmenu({
		onChoose: function(value){
			switch(value){
				case 'play-songs':
					m.playArray(this.artist.songs, 0);
					break;
				case 'shuffle-songs':
					m.shufflePlay(this.artist.songs);
					break;
				case 'play-next':
					m.playArrayNext(this.artist.songs);
					break;
				case 'play-last':
					m.playArrayLast(this.artist.songs)
					break;
				case 'add-to-playlist':
					this.extraDiv.mojo.show("addToPlaylist", this.artist.songs);
					break;
				case 'favorite':
					var artist = m.getArtist(this.artist.name);
					m.addToFavorites(artist);
					break;
			}
		}.bind(this),
		placeNear: event.target,
		items: items
	});
}

ArtistViewAssistant.prototype.refreshList = function(event) {
	this.controller.get("results_list").mojo.invalidateItems(0);
	this.activate();
}

ArtistViewAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

ArtistViewAssistant.prototype.cleanup = function(event) {
	this.cleanupCommon();
	this.controller.stopListening(this.controller.get("results_list"), Mojo.Event.listTap, this.listTapHandler);
};
