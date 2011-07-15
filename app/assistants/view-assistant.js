function ViewAssistant(titleObj, data, focus) {
	this.data = data;
	
	this.titleObj = titleObj;
	if (focus){
		this.focus = focus;
	}
	this.objType = koto.utilities.getObjType(this.titleObj);
	scene_helpers.addControlSceneMethods(this);
}

ViewAssistant.prototype.setup = function() {
	this.setupTitle();
	this.initCmdMenu();
	this.setupCommon();
	this.listAttrs = {
		itemTemplate:'list/list-item',
		filterFunction: this.filterList.bind(this),
		delay: 100,
		formatters: {
			"info": function(value, model){
				if (koto.utilities.getObjType(model) === "song"){
					return model.artist + " - " + model.album;
				}
			},
			"truncatingOption": function(value, model){
				if (!koto.preferences.obj.truncateText){
					return "noTruncate";
				}
			}.bind(this),
			"title": function(value, model){
				if (model.title){
					return model.title;
				}
			}
		},
		swipeToDelete:false, reorderable:false
	};
	if (this.objType === "playlist" && this.titleObj.type === "custom"){
		this.listAttrs["swipeToDelete"] = true;
		this.listAttrs["autoconfirmDelete"] = true;
		this.listAttrs["reorderable"] = true;
	}
	this.listModel = {            
        items: this.data
    };  
	if(this.objType === "playlist" && this.titleObj.type && this.titleObj.type === "custom"){
		this.handleCustomPlaylistSort();
	}
	
	this.controller.setupWidget("results_list", this.listAttrs, this.listModel);
	this.listWidget = this.controller.get("results_list");
	this.listTapHandler = this.listTap.bind(this);
	this.controller.listen(this.listWidget, Mojo.Event.listTap, this.listTapHandler);
	if (this.objType === "playlist"){
		this.listDeleteHandler = this.listDelete.bind(this);
		this.listReorderHandler = this.listReorder.bind(this);
		this.controller.listen(this.listWidget, Mojo.Event.listDelete, this.listDeleteHandler);
		this.controller.listen(this.listWidget, Mojo.Event.listReorder, this.listReorderHandler);
	}
	
};

ViewAssistant.prototype.setupTitle = function(event){
	this.initViewMenu(this.titleObj.name);
	if (!this.subTitleDev){
		this.subTitleDiv = this.controller.get("title-secondary");
	}
	
	var title = (this.data.length === 1) ? $L("Track") : $L("Tracks")
	this.subTitleDiv.innerHTML = this.data.length + " " + title.capitalize();
	title = null;
	
	
}

ViewAssistant.prototype.activate = function(event) {
	this.setupTitle();
	this.activateCommon();
};
ViewAssistant.prototype.refreshList = function(event) {
	if (this.objType === "playlist" && this.titleObj.type && this.titleObj.type !== "custom"){
		koto.content.playlists.getSongsOfOne(this.titleObj, function(songs){
			this.listWidget.mojo.noticeUpdatedItems(0, songs);
			this.data = songs;
		}.bind(this));
	} else {
		this.listWidget.mojo.invalidateItems(0);
	}
	this.activate();
}

ViewAssistant.prototype.filterList = function(filterString, listWidget, offset, count){
	this.subset = [];
	var totalSubsetSize = 0;

	//loop through the original data set & get the this.subset of items that have the filterstring 
	var i = 0;
	while (i < this.data.length) {
		if ((this.data[i].title && this.data[i].title.toLowerCase().include(filterString.toLowerCase())) || (this.data[i].album && this.data[i].album.toLowerCase().include(filterString.toLowerCase())) || (this.data[i].artist && this.data[i].artist.toLowerCase().include(filterString.toLowerCase()))){
			if (this.subset.length < count && totalSubsetSize >= offset){ 
				this.data[i].unFilteredIndex = i;
				this.subset.push(this.data[i]);
			}	
			totalSubsetSize++;
		}
		i++;
	}
	
	//update the items in the list with the subset
	listWidget.mojo.noticeUpdatedItems(offset, this.subset);
	
	//set the list's lenght & count if we're not repeating the same filter string from an earlier pass
	if (this.filter !== filterString) {
		listWidget.mojo.setLength(totalSubsetSize);
		listWidget.mojo.setCount(totalSubsetSize);
	}
	this.filter = filterString;
	
}
ViewAssistant.prototype.handleCustomPlaylistSort = function(){
	//if (this.titleObj.sort && this.titleObj.sort !== "custom"){
		if (!this.titleObj.sort)
			this.titleObj.sort = "custom";
		console.log("playlist.sort is " + this.titleObj.sort);
		this.customSortSongs = JSON.parse(JSON.stringify(this.data));
		this.data = this.data.sortBy(function(s){
			return s[this.titleObj.sort];
		}, this);
	//}
};

ViewAssistant.prototype.listTap = function(event) {
	objType = koto.utilities.getObjType(event.item);
	var songs = (this.subset.length > 0 && this.filter !== "")? this.subset : this.data;
	if (event.originalEvent.target.id && event.originalEvent.target.id === 'popup'){
		var items = [];
		if (koto.nowPlaying.currentInfo.songs.length > 0)
			items.push({label: $L('Play Next'), command: 'play-next'},{label: $L('Play Last'), command: 'play-last'});
		if (objType === "song"){
			if (!event.fromSongDetails){
				items.push({label: $L("Song Details"), command: "details"});
			} if (this.objType !== "artist" && this.objType !== "album"){
				items.push({label: $L("View Album"), command: "view"});		
			} if (!event.fromSongDetails){
				items.push({label: $L('Add to Playlist'), command: 'add-to-playlist'});
			}
		} 
		items.push({label: $L('Favorite'), command: 'favorite'});
		
		this.controller.popupSubmenu({
			onChoose: function(value){
				switch(value){
					case 'play-next':
						koto.nowPlaying.playArrayNext([event.item]); 
						break;
					case 'play-last':
						koto.nowPlaying.playArrayLast([event.item]); 	
						break;
					case 'add-to-playlist':
						this.extraDiv.mojo.show("addToPlaylist", [event.item]);
						break;
					case 'favorite':
						koto.content.favorites.add(event.item);
						break;
					case "details": 
						this.extraDiv.mojo.toggle("songDetails", songs, event.index);
						break;
					case "view":
						if (objType === "artist" || objType === "album"){
							koto.content.view(obj);
						}
						break;
				}
			}.bind(this),
			placeNear: event.originalEvent.target,
				items: items
		});
	} else {
		if (this.subset.length > 0 && this.filter !== "" && koto.preferences.obj.filterTap === "all"){
			songs = this.data;
			event.index = event.item.unFilteredIndex;
		}
		koto.nowPlaying.playArray(songs, event.index);
	}
};
ViewAssistant.prototype.listReorder = function(event){
	if (this.subset.length === this.customSortSongs.length && (this.filter === "" || !this.filter)){
		this.data.splice(event.fromIndex, 1);
		this.data.splice(event.toIndex, 0, event.item);
		this.customSortSongs.splice(event.fromIndex, 1);
		this.customSortSongs.splice(event.toIndex, 0, event.item);
		koto.content.playlists.saveOne(this.titleObj.name, {type: "custom", songs: this.customSortSongs, name: this.titleObj.name});
	}
}
ViewAssistant.prototype.listDelete = function(event){
	if ((this.subset.length > 0 && this.filter !== "") || this.titleObj.sort !== "custom"){
		for(var i = 0; i < this.customSortSongs.length; i++){
			if (this.customSortSongs[i]._id === this.subset[event.index]._id){
				this.customSortSongs.splice(i, 1);
				break;
			}
		}
		for(var i = 0; i < this.data.length; i++){
			if (this.data[i]._id === this.subset[event.index]._id){
				this.data.splice(i, 1);
				break;
			}

		}
		//this.data.splice(event.index, 1);
		if (this.subset.length > 0 && this.filter !== ""){
			this.subset.splice(event.index, 1);
			this.listWidget.mojo.setLength(this.subset.length);
			this.listWidget.mojo.setCount(this.subset.length);
		} 
	} else {
		this.customSortSongs.splice(event.index, 1);	
		this.data = this.customSortSongs;
	}
	this.setupTitle();
	koto.content.playlists.saveOne(this.titleObj.name, {type: "custom", sort: this.titleObj.sort, songs: this.customSortSongs, name: this.titleObj.name});
}
ViewAssistant.prototype.moreTap = function(event){
	
		var items = [
			{label: $L('Shuffle All'), command: 'shuffle-songs'},	
			{},
			{label: $L('Add to Playlist'), command: 'add-to-playlist'},
			{label: $L('Favorite'), command: 'favorite'}
		]
		if (this.objType === "playlist" && this.titleObj.type === "custom"){
			items.splice(2, 0, 
				{label: $L('Sort'), items: [
					{label: $L('Custom'), command: 'sort-custom'},		
					{label: $L('Title'), command: 'sort-title'},		
					{label: $L('Artist'), command: 'sort-artist'},		
					{label: $L('Album'), command: 'sort-album'}		
				]},
				{}
			);
			for(var i = 0; i < items[2].items.length; i++){
				if (this.titleObj.sort && items[2].items[i].label.toLowerCase() === this.titleObj.sort){
					items[2].items[i].chosen = true;
					break;
				} else if (!this.titleObj.sort){
					items[2].items[0].chosen = true;
					break;
				}
			}
		}
		//if (koto.utilities.getObjType(this.titleObj) === "playlist")TODO
		//	items.unshift({label: $L('Edit Playlist Name'), command: 'edit-playlist-name'},{});
		if (koto.nowPlaying.currentInfo.songs.length > 0){
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
							koto.nowPlaying.playArray(songs, 0);
							break;
						case 'shuffle-songs':
							koto.nowPlaying.shufflePlayArray(songs);
							break;
						case 'play-next':
							koto.nowPlaying.playArrayNext(songs);
							break;
						case 'play-last':
							koto.nowPlaying.playArrayLast(songs)
							break;
						case 'add-to-playlist':
							this.extraDiv.mojo.show("addToPlaylist", songs);
							break;
						case 'favorite':
							koto.content.favorites.add(this.titleObj);
							break;
						
						case "sort-custom":
						case "sort-title":
						case "sort-artist":
						case "sort-album":
							var sort = value.split("-")[1];
							koto.content.playlists.saveOne(this.titleObj.name, {type: "custom", sort: sort, songs: this.customSortSongs, name: this.titleObj.name});
							this.titleObj.sort = sort;	
							if (sort !== "custom"){
								this.listWidget.mojo.setReorderable(false);
								this.data = this.data.sortBy(function(s){
									if (sort !== "title"){
										return s[sort] + " " + s.title;
									}
									return s[sort];
								}, this);	
							} else {
								this.data = this.customSortSongs;
								this.listWidget.mojo.setReorderable(true);
							}							
							this.listWidget.mojo.noticeUpdatedItems(0, this.data);
							break;
							
					}
				}.bind(this);
				var songs = (this.subset.length > 0 && this.filter !== "")? this.subset : this.data;
				handleAction(songs);
			}.bind(this),
			placeNear: event.target,
			items: items
		});
}

ViewAssistant.prototype.deactivate = function(event) {};
ViewAssistant.prototype.cleanup = function(event) {
	this.cleanupCommon();
	this.controller.stopListening(this.controller.get("results_list"), Mojo.Event.listTap, this.listTapHandler);
	
	if (this.objType === "playlist"){
		this.controller.stopListening(this.controller.get("results_list"), Mojo.Event.listDelete, this.listDeleteHandler);
		this.controller.stopListening(this.controller.get("results_list"), Mojo.Event.listReorder, this.listReorderHandler);
	}
};