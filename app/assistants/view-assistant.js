function ViewAssistant(titleObj, data, focus) {
	this.data = data;
	this.titleObj = titleObj;
	if(focus){
		this.focus = focus;
	}
	this.objType = m.getObjType(this.titleObj);
	scene_helpers.addControlSceneMethods(this);
}

ViewAssistant.prototype.setup = function() {
	this.initViewMenu(this.titleObj.name);
	this.initCmdMenu();
	this.setupCommon();
	this.listAttrs = {
		itemTemplate:'list/list-item',
		formatters: {
			"info": function(value, model){
				if(m.getObjType(model) === "song"){
					return model.artist + " - " + model.album;
				}
			},
			"truncatingOption": function(value, model){
				if(!m.prefs.truncateText){
					return "noTruncate";
				}
			}.bind(this),//add filtering
		},
		swipeToDelete:false, reorderable:false
	};
	if(this.objType === "playlist" && this.titleObj.type === "custom"){
		this.listAttrs["swipeToDelete"] = true;
		this.listAttrs["autoconfirmDelete"] = true;
		this.listAttrs["reorderable"] = true;
	}
	this.listModel = {            
        items: this.data
    };  
	
	this.controller.setupWidget("results_list", this.listAttrs, this.listModel);
		
	this.listTapHandler = this.listTap.bind(this);
	this.controller.listen(this.controller.get("results_list"), Mojo.Event.listTap, this.listTapHandler);
	if(this.objType === "playlist"){
		this.listDeleteHandler = this.listDelete.bind(this);
		this.listReorderHandler = this.listReorder.bind(this);
		this.controller.listen(this.controller.get("results_list"), Mojo.Event.listDelete, this.listDeleteHandler);
		this.controller.listen(this.controller.get("results_list"), Mojo.Event.listReorder, this.listReorderHandler);
	}
	
};
ViewAssistant.prototype.activate = function(event) {
	this.activateCommon();
};
ViewAssistant.prototype.refreshList = function(event) {
	if(this.objType === "playlist" && this.titleObj.type && this.titleObj.type !== "custom"){
		m.getPlaylistSongs(this.titleObj, function(songs){
			this.controller.get("results_list").mojo.noticeUpdatedItems(0, songs);
			this.data = songs;
		}.bind(this));
	} else {
		this.controller.get("results_list").mojo.invalidateItems(0);
	}
	this.activate();
}
ViewAssistant.prototype.listTap = function(event) {
	objType = m.getObjType(event.item);
	if(event.originalEvent.target.id && event.originalEvent.target.id == 'popup'){
		var items = [];
		if(m.nP.songs.length > 0)
			items.push({label: $L('Play Next'), command: 'play-next'},{label: $L('Play Last'), command: 'play-last'});
		if(objType === "song"){
			if(!event.fromSongDetails){
				items.push({label: $L("Song Details"), command: "details"});
			} if(this.objType !== "artist" && this.objType !== "album"){
				items.push({label: $L("View Album"), command: "view"});		
			} if(!event.fromSongDetails){
				items.push({label: $L('Add to Playlist'), command: 'add-to-playlist'});
			}
		} 
		items.push({label: $L('Favorite'), command: 'favorite'});
		
		this.controller.popupSubmenu({
			onChoose: function(value){
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
						this.extraDiv.mojo.toggle("songDetails", this.data, event.index);
						break;
					case "view":
						if(objType === "artist" || objType === "album"){
							m.view(obj);
						}
						break;
				}
			}.bind(this),
			placeNear: event.originalEvent.target,
				items: items
		});
	} else {
		m.playArray(this.data, event.index);
	}
};
ViewAssistant.prototype.listReorder = function(event){
	this.data.splice(event.fromIndex, 1);
	this.data.splice(event.toIndex, 0, event.item);
	m.savePlaylist(this.titleObj.name, {type: "custom", songs: this.data, name: this.titleObj.name});
}
ViewAssistant.prototype.listDelete = function(event){
	this.data.splice(event.index, 1);	
	m.savePlaylist(this.titleObj.name, {type: "custom", songs: this.data, name: this.titleObj.name});
}
ViewAssistant.prototype.moreTap = function(event){
	
		var items = [
			{label: $L('Shuffle All'), command: 'shuffle-songs'},	
			{},
			{label: $L('Add to Playlist'), command: 'add-to-playlist'},
			{label: $L('Favorite'), command: 'favorite'}
		]
		//if(m.getObjType(this.titleObj) === "playlist")TODO
		//	items.unshift({label: $L('Edit Playlist Name'), command: 'edit-playlist-name'},{});
		if(m.nP.songs.length > 0){
			items.splice(1, 0, {label: $L("Play All ..."), items: [
				{label: $L('Next'), command: 'play-next'},
				{label: $L('Last'), command: 'play-last'}			
			]});;
		}

		this.controller.popupSubmenu({
			onChoose: function(value){
				var handleAction = function(songs){
					switch(value){
						case 'play-songs':
							m.playArray(songs, 0);
							break;
						case 'shuffle-songs':
							m.shufflePlay(songs);
							break;
						case 'play-next':
							m.playArrayNext(songs);
							break;
						case 'play-last':
							m.playArrayLast(songs)
							break;
						case 'add-to-playlist':
							this.extraDiv.mojo.show("addToPlaylist", songs);
							break;
						case 'favorite':
							m.addToFavorites(songs);
							break;
					}
				}.bind(this);
				handleAction(this.data);
			}.bind(this),
			placeNear: event.target,
			items: items
		});
}

ViewAssistant.prototype.deactivate = function(event) {};
ViewAssistant.prototype.cleanup = function(event) {
	this.cleanupCommon();
	this.controller.stopListening(this.controller.get("results_list"), Mojo.Event.listTap, this.listTapHandler);
	
	if(this.objType === "playlist"){
		this.controller.stopListening(this.controller.get("results_list"), Mojo.Event.listDelete, this.listDeleteHandler);
		this.controller.stopListening(this.controller.get("results_list"), Mojo.Event.listReorder, this.listReorderHandler);
	}
};