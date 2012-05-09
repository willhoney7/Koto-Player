function ListAssistant(data) {
	this.data = data;
	this.items = koto.content[this.data].array;
	scene_helpers.addControlSceneMethods(this);
}
/*ListAssistant.prototype.aboutToActivate = function(callback){
	//callback.defer();
}*/	

ListAssistant.prototype.setup = function() {
	/* Title Setup */
	this.setupTitle();
	
	/* Common Setup */
	this.setupCommon(); //functions for all scenes.
	this.initCmdMenu(); //command menu controls
	this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
	
	/*
	 * The list
	 */
	this.mainListAttrs = { 
	    itemTemplate: "list/list-item",
		hasNoWidgets: true,
		fixedHeightItems: false,
		filterFunction: this.filterList.bind(this),
		delay: 500,
		formatters: {
			"info": function(value, model){
				var objType = koto.utilities.getObjType(model);
				if (this.data === "favorites" || this.data === "playlists" || objType === "genre"){
					if (model.total && model.total.tracks){
						var tracks = (model.total.tracks > 1)?model.total.tracks + $L(" Tracks"): model.total.tracks + $L(" Track");
						return tracks;
					}else if (model.songs){
						var tracks = (model.songs.length > 1)?model.songs.length + $L(" Tracks"): model.songs.length + $L(" Track");
						return tracks;
					}/*else if (model.query){
						return "";
					}*/
				}
				switch(objType){
					case "song":
						return model.artist + " - " + model.album;
						break;
					case "album":
						var tracks = (model.total.tracks > 1)?model.total.tracks + $L(" Tracks"): model.total.tracks + $L(" Track");
						return model.artist + " - " + tracks;
						break;
					case "artist":
						var tracks = (model.total.tracks > 1)?model.total.tracks + $L(" Tracks"): model.total.tracks + $L(" Track");
						var albums = (model.total.albums > 1)?model.total.albums + $L(" Albums"): model.total.albums + $L(" Album");
						return albums + " - " + tracks;
						break;				
				}
			}.bind(this),
			"title": function(value, model){
				if (model.title || model.name){
					if (this.data === "artists" || this.data === "albums" || this.data === "songs"){
						return ((model.title) ? model.title : model.name).replace(koto.utilities.sortRegex, "$2, $1");
					} else {
						return ((model.title) ? model.title : model.name);				
					}
				}
			}.bind(this),
			"rowClass": function(value, model){
				return "content-list";
			}.bind(this),
			"truncatingOption": function(value, model){
				if (!koto.preferences.obj.truncateText){
					return "noTruncate";
				}
			}.bind(this),
		},
	    reorderable: false,
	    swipeToDelete: false
    };
	
	/* Change stuff based on list info*/
	switch(this.data){
		case "artists":
		case "albums":
		case "songs":
			//setup alpha divider
			this.mainListAttrs.dividerTemplate = "list/divider";	
			this.mainListAttrs.dividerFunction = function(itemModel){
				if (!isNaN((this.data === "songs")?parseInt(itemModel.title.charAt(0), 10):parseInt(itemModel.name.charAt(0), 10))){
					return "#";
				}
				var specialCharRegex = /(['"!@#$%^&*\(\)_ \\\/-;:<>\{\}\[\]])/;
				if (specialCharRegex.test((this.data === "songs")?itemModel.title.charAt(0):itemModel.name.charAt(0))){
					return "&";
				}
				return itemModel[(this.data === "songs") ? "title" : "name"].replace(koto.utilities.sortRegex, "$2").toLowerCase().charAt(0);
			}.bind(this);
			break;
		case "playlists":
			//make it deleteable
			this.mainListAttrs.swipeToDelete = true;
			this.mainListAttrs.preventDeleteProperty = "preventDelete";
			this.mainListAttrs.formatters.nameClass = function(value, model){ //add formatter for single line items
				if (model.type === "auto"){
					return "title";
				}
			}.bind(this);
			this.mainListAttrs.dividerTemplate = "view/divider";	//change dividers
			this.mainListAttrs.dividerFunction = function(itemModel){
				return (itemModel.type.toString().capitalize());
			}.bind(this);
			break;
		case "favorites":
			this.mainListAttrs.swipeToDelete = true;
			this.mainListAttrs.reorderable = true;
			this.mainListAttrs.formatters.nameClass = function(value, model){
				if (model.type && model.type === "auto"){
					return "title";
				}
			}.bind(this);
			break;
	}
	/* The model */
	this.listModel = {        
        items: this.items
	};    
	this.controller.setupWidget('results_list', this.mainListAttrs, this.listModel);
	this.list = this.controller.get("results_list");
	
	/* If there's no items */
	if (this.items.length === 0){
		this.controller.get("no-items").show();//todo, get image
	}
	
	/* Listeners */
	this.listTapHandler = this.listTap.bind(this);
	this.controller.listen(this.list, Mojo.Event.listTap, this.listTapHandler);
	if (this.data === "favorites" || this.data === "playlists"){
		this.listReorderHandler = this.listReorder.bind(this);
		this.listDeleteHandler = this.listDelete.bind(this);
		this.controller.listen(this.list, Mojo.Event.listReorder, this.listReorderHandler);
		this.controller.listen(this.list, Mojo.Event.listDelete, this.listDeleteHandler);
	}
	
	/* Popup for tapping title to quickly switch views */
	this.titleBarTapHandler = this.titleBarTap.bind(this);
	this.controller.listen(this.controller.get("title-bar"), Mojo.Event.tap, this.titleBarTapHandler);
	
	//this.controller.setupWidget("alphaScrollerWidget", {}, {});	
	
	/* Alpha Scroller Stuff*/
	if (this.data === "artists" || this.data === "albums" || this.data === "songs"){	
		this.setupAlphaScroller();
	}
	
	
	//Meta tap stuff
	/*this.handleMeta = function(event){
		this.metaKey = event.metaKey;
	}.bind(this);
	this.controller.listen(this.controller.sceneElement, "mousedown", this.handleMeta);
	this.controller.listen(this.controller.sceneElement, "mouseup", this.handleMeta);
	this.scroller = this.controller.getSceneScroller();
	this.controller.listen(this.scroller, Mojo.Event.flick, this.handleListScroll = function(event){
		if (this.metaKey === true){
			if (event.velocity.y > 0){
				this.scroller.mojo.revealTop(0);
				this.scroller.mojo.revealTop(0);
			}
			else if (event.velocity.y < 0){
				this.scroller.mojo.revealBottom();
				this.scroller.mojo.revealBottom();
			}
		}
	}.bind(this))*/
};
ListAssistant.prototype.setupAlphaScroller = function(event) {
	//create items
	var objHeading = (this.data === "songs")? "title" : "name", alphaListItems = [];
	var i = 0;
	while(i < this.items.length){
		if(_(this.items[i][objHeading]).isBlank()){
			this.items.splice(i, 1);
			continue;
		}
		i++;
	}
	for(var i = 0; i < this.items.length; i++){
		var specialCharRegex = /(['"!@#$%^&*\(\)_ \\\/-;:<>\{\}\[\]])/;
		if (!isNaN(parseInt(this.items[i][objHeading].charAt(0), 10))){
			if (!this.items[i-1] || (this.items[i-1][objHeading] && isNaN(parseInt(this.items[i-1][objHeading].charAt(0), 10)))){
				alphaListItems.push({letter: "#", index: i});
			}
		}
		else if (specialCharRegex.test(this.items[i][objHeading].charAt(0))){
			if (!this.items[i-1] || (this.items[i-1][objHeading] && !specialCharRegex.test(this.items[i][objHeading].charAt(0)))){
				alphaListItems.push({letter: "&", index: i});
			}
		} else {
			if (!this.items[i-1] || ((this.items[i-1][objHeading] && this.items[i-1][objHeading].replace(koto.utilities.sortRegex, "$2").charAt(0).toUpperCase() !== this.items[i][objHeading].replace(koto.utilities.sortRegex, "$2").charAt(0).toUpperCase()))){
				alphaListItems.push({letter: this.items[i][objHeading].replace(koto.utilities.sortRegex, "$2").charAt(0).toUpperCase(), index: i});				
				
			}
		}
	}
	
	this.controller.setupWidget("alphaScrollerWidget", {mode: "vertical"}, {});
	this.scroller = this.controller.get("alphaScrollerWidget");
	this.scroller.setStyle({height: Mojo.Environment.DeviceInfo.screenHeight - 120+"px", width: "26px"});
	var renderedContent = Mojo.View.render({collection: alphaListItems, template: 'widgets/widget_alphaScroller-item'});
	Element.insert(this.scroller, "<div class='alphaScroller-fade-top' x-mojo-scroll-fade='top'></div><div class='alpha-items'>" + renderedContent + "</div><div id='alphaScroller-fade-bottom' class='alphaScroller-fade-bottom' x-mojo-scroll-fade='bottom'></div>");
	this.alphaScrollerBottomFade = this.controller.get("alphaScroller-fade-bottom");
	this.controller.listen(this.scroller, Mojo.Event.tap, this.handleScroller = function(event){
		this.list.mojo.revealItem(parseInt(event.target.id.replace("alphaScrollerItem", ""), 10), false);
		this.list.mojo.revealItem(parseInt(event.target.id.replace("alphaScrollerItem", ""), 10), false);
	}.bind(this));
	
	Mojo.Event.listen(this.controller.window, 'resize', this.handleResize = function(){
		if (this.controller && this.controller.window){
			var height = this.controller.window.innerHeight;
			if (this.panel.visible()){
				this.scroller.setStyle({height: height + 28 - 180 + "px"});
				this.alphaScrollerBottomFade.setStyle({bottom: "103px"});
			} else {
				this.scroller.setStyle({height: height + 28 - 120 + "px"});							
				this.alphaScrollerBottomFade.setStyle({bottom: "40px"});
			}
		}
	}.bind(this));
	this.handleResize();
	
	if (koto.preferences.obj.alphaScroller === true){
		this.showAlphaScroller();
	} else if (koto.preferences.obj.alphaScroller === false) {
		this.hideAlphaScroller();
	}
}

ListAssistant.prototype.activate = function(event) {
	if (koto.preferences.obj.alphaScroller === true){
		this.showAlphaScroller();
	} else if (koto.preferences.obj.alphaScroller === false) {
		this.hideAlphaScroller();
	}
	this.activateCommon();
	
	if (this.data === "playlists" || this.data === "favorites"){
		this.list.mojo.noticeUpdatedItems(0, koto.content[this.data].array);
	}
};

ListAssistant.prototype.filterList = function(filterString, listWidget, offset, count){
	this.subset = [];
	var totalSubsetSize = 0;

	//loop through the original data set & get the this.subset of items that have the filterstring 
	var i = 0;
	while (i < this.items.length) {
		if ((this.items[i].name && this.items[i].name.toLowerCase().include(filterString.toLowerCase())) || (this.items[i].title && this.items[i].title.toLowerCase().include(filterString.toLowerCase())) || (this.items[i].album && this.items[i].album.toLowerCase().include(filterString.toLowerCase())) || (this.items[i].artist && this.items[i].artist.toLowerCase().include(filterString.toLowerCase()))){
			if (this.subset.length < count && totalSubsetSize >= offset){ 
				if (this.items[i].title){
					this.items[i].unFilteredIndex = i;
				}
				this.subset.push(this.items[i]);
			}
			totalSubsetSize++;
		}
		i++;
	}
	
	//update the items in the list with the subset
	listWidget.mojo.noticeUpdatedItems(offset, this.subset);
	listWidget.mojo.noticeUpdatedItems(offset, this.subset);
	
	//set the list's lenght & count if we're not repeating the same filter string from an earlier pass
	if (this.filter !== filterString) {
		listWidget.mojo.setLength(totalSubsetSize);
		listWidget.mojo.setCount(totalSubsetSize);
	}
	this.filter = filterString;
	if (filterString.length > 0){
		this.hideAlphaScroller();
	} else {
		this.showAlphaScroller();
	}
	/*
	//console.log("filtering: " + filterString)
	if (!this.filter || this.filter !== filterString){
		this.subset = [];
		var totalSubsetSize = 0;
	//loop through the original data set & get the this.subset of items that have the filterstring 
		var i = 0;
		while (i < this.items.length) {
			if ((this.items[i].name && this.items[i].name.toLowerCase().include(filterString.toLowerCase())) || (this.items[i].title && this.items[i].title.toLowerCase().include(filterString.toLowerCase())) || (this.items[i].album && this.items[i].album.toLowerCase().include(filterString.toLowerCase())) || (this.items[i].artist && this.items[i].artist.toLowerCase().include(filterString.toLowerCase()))){
				if (this.subset.length < count && totalSubsetSize >= offset) 
					this.subset.push(this.items[i]);
				totalSubsetSize++;
			}
			i++;
		}
		
		//update the items in the list with the subset
		listWidget.mojo.noticeUpdatedItems(offset, this.subset);
		
		//set the list's length & count if we're not repeating the same filter string from an earlier pass
		listWidget.mojo.setLength(totalSubsetSize);
		listWidget.mojo.setCount(totalSubsetSize);

		this.filter = filterString;
		if (filterString.length > 0){
			this.hideAlphaScroller();
		} else {
			this.showAlphaScroller();
		}
	}*/
}

ListAssistant.prototype.listTap = function(event){
	var obj = event.item; var objType = koto.utilities.getObjType(obj);
	
	//popup
	if (event.originalEvent.target.id && event.originalEvent.target.id === 'popup'){
		//build popup items
		var items = [];
		if (koto.nowPlaying.currentInfo.songs.length > 0){
			items.push({label: $L('Play Next'), command: 'play-next'},{label: $L('Play Last'), command: 'play-last'});
		}
		if (objType !== "song"){
			items.unshift({label: $L('Play'), command: 'play'}, {label: $L("Shuffle Play"), command: "shuffle"});
			if (objType === "playlist" && obj.type && obj.type === "custom"){
				items.push({label: $L('View & Edit Songs'), command: 'view-list'});
			}
			else if (objType === "playlist" || this.data === "favorites"){
				items.push({label: $L('View Songs'), command: 'view-list'});
			}
		} else {
			if (!event.fromSongDetails){
				items.push({label: $L("Song Details"), command: "details"});
			} else {
				//items.unshift({label: $L('Play'), command: 'play'});
			}
			if (this.data === "songs"){
				items.push({label: $L("View Album"), command: "view-album"});
			}
		} 
		if (((objType === "playlist" && (obj.type && obj.type !== "auto") || (!obj.type)) || objType !== "playlist") && (!event.fromSongDetails)){
			items.push({label: $L('Add to Playlist'), command: 'add-to-playlist'});
		}
		items.push({label: $L('Favorite'), command: 'favorite'});
		
		this.controller.popupSubmenu({
			onChoose: function(value){
				if (value === "favorite"){
					koto.content.favorites.add(obj);
				} else if (value === "view-album"){
					koto.content.view({type: "album", name: obj.album}); 
				}
				else{
					var handleAction = function(songs){
						switch(value){
							case "play":
								if (objType === "song"){
									//todo fix...
									if (this.subset.length > 0 && this.filter !== ""){
										koto.nowPlaying.playArray(this.subset, event.index);
									} else {
										koto.nowPlaying.playArray(this.items, event.index);
									}
								} else {
									koto.nowPlaying.playArray(songs, 0);
								}
								break;
							case "shuffle":
								koto.nowPlaying.shufflePlayArray(songs, 0);
								break;
							case "view-list":
								koto.content.view(obj, songs);							
								break;
							case "play-next":
								koto.nowPlaying.playArrayNext(songs);
								break;
							case "play-last":
								koto.nowPlaying.playArrayLast(songs);
								break;
							case "add-to-playlist":
								this.extraDiv.mojo.show("addToPlaylist", songs);
								break;
							case "details":
								//console.log("albumArtist: " + this.items[event.index].albumArtist);
								var quickItems = (this.subset.length > 0 && this.filter !== "") ? this.subset : this.items;
								this.extraDiv.mojo.toggle("songDetails", quickItems, event.index);			
								break;
						};
					}.bind(this);
					koto.content.getSongsOfObj(obj, handleAction);
				}
			}.bind(this),
			placeNear: event.originalEvent.target,
				items: items
		});
	}
	else {
		if (objType === "song"){			
			if (this.data === "favorites"){
				function handleSongs(songs){
					for(var i = 0; i < songs.length; i++){
						if (songs[i]._id === obj._id){
							koto.nowPlaying.playArray(songs, i);
							break;
						}
					}
				}
				if (this.subset.length > 0 && this.filter !== ""){
					this.getSongsOfArray(this.subset, handleSongs.bind(this));
				} else {
					this.getSongsOfArray(this.items, handleSongs.bind(this));				
				}
			} else {
				if (this.subset.length > 0 && this.filter !== "" && koto.preferences.obj.filterTap === "filtered"){
					koto.nowPlaying.playArray(this.subset, event.index);
				} else if (koto.preferences.obj.filterTap === "all"){
					koto.nowPlaying.playArray(this.items, obj.unFilteredIndex);
				} else {
					koto.nowPlaying.playArray(this.items, event.index);				
				}
			}
		} else if ((objType === "artist" || objType === "album") && (this.data !== "favorites" || (this.data == "favorite" && koto.preferences.obj.favoriteTap === "view"))){
			koto.content.view(obj);
		} 
		else if ((objType === "playlist" && koto.preferences.obj.playlistTap === "play" && this.data !== "favorites") || (this.data === "favorites" && koto.preferences.obj.favoriteTap === "play")){
			koto.content.getSongsOfObj(obj, function(songs){
				koto.nowPlaying.playArray(songs, 0);
			}.bind(this), true);
		}else {
			koto.content.getSongsOfObj(obj, function(songs){
				koto.content.viewArray(obj, songs);							
			}.bind(this), true);
		}
	}
};
ListAssistant.prototype.listReorder = function(event){
	if (this.data === "favorites"){
		koto.content.favorites.array.splice(event.fromIndex, 1);
		//var item = koto.content.favoriteIds[event.fromIndex];
		//koto.content.favoriteIds.splice(event.fromIndex, 1);
		koto.content.favorites.array.splice(event.toIndex, 0, event.item);
		//koto.content.favoriteIds.splice(event.toIndex, 0, item);
		koto.content.favorites.store();
	}
}
ListAssistant.prototype.listDelete = function(event){
	if (this.data === "favorites"){
		koto.content.favorites.del(event.index);
		this.items = koto.content[this.data];
	}
	else {
		koto.content.playlists.deleteOne(event.item.name, event.index);
	}
	
	this.setupTitle();
}

//Tapping the title bar
ListAssistant.prototype.setupTitle = function(event){
	this.initViewMenu($L(this.data.capitalize())); //view menu
	var title = (this.items.length === 1) ? this.data.slice(0, this.data.length-1) : this.data;
	this.controller.get("title-secondary").innerHTML = this.items.length + " " + $L(title.capitalize());
	title = null;
}
ListAssistant.prototype.titleBarTap = function(event){
	if (event.target.id !== "more"){
		var items = koto.preferences.obj.startItems.clone();
		
		for(var i = 0; i< items.length; i++){
			if (items[i].command === this.data){
				items[i].chosen = true;
			}else {
				items[i].chosen = false;
			}
		}
		this.controller.popupSubmenu({
			onChoose: function(value){
				if (value)
					this.controller.stageController.swapScene({name: "list", transition: Mojo.Transition.crossFade}, value);
			}.bind(this),
			placeNear: event.target,
			items: items
		});
	}
}
ListAssistant.prototype.moreTap = function(event){
	var items = [
		{label: $L('Play All'), command: 'play'},
		{label: $L('Shuffle All'), command: 'shuffle'}
	];
	if (koto.nowPlaying.currentInfo.songs.length > 0){
		items.splice(1, 0, {label: $L('Play All Next'), command: 'play-next'},{label: $L('Play All Last'), command: 'play-last'});
	}
	this.controller.popupSubmenu({
		onChoose: function(value){
			var handleAction = function(songs){
				switch(value){
					case "play":
						koto.nowPlaying.playArray(songs, 0);
						break;
					case "shuffle":
						koto.nowPlaying.shufflePlayArray(songs, 0);
						break;
					case "view":
						koto.content.viewArray(event.item, songs);							
						break;
					case "play-next":
						koto.nowPlaying.playArrayNext(songs);
						break;
					case "play-last":
						koto.nowPlaying.playArrayLast(songs);
						break;
					case "add-to-playlist":
						this.extraDiv.mojo.show("addToPlaylist", songs);
						break;
				};
			}.bind(this);
			if (value){
				this.getSongs(handleAction);
			}
		}.bind(this),
		placeNear: event.target,
		items: items
	});
};

ListAssistant.prototype.getSongs = function(callback) {
	switch(this.data){
		case "artists":
		case "albums":
		case "genres":
			koto.content.songs.get(this.data.substring(0, this.data.length-1), callback);
			break;
		case "songs":
			if (this.subset.length > 0){
				callback(this.subset)
			} else {
				callback(koto.content.songs.array);
			}
			break;
		case "playlists":
			this.getSongsOfArray(koto.content.playlists.array, callback);
			break;
		case "favorites":
			this.getSongsOfArray(koto.content.favorites.array, callback);
			break;
	}
}
ListAssistant.prototype.getSongsOfArray = function(array, callback){
	var i = 0, songs = [];
	function getSongsOfObj(item){
		koto.content.getSongsOfObj(item, function(songsOfObj){
			i++;
			songs = songs.concat(songsOfObj);
			if (i < array.length){
				getSongsOfObj(array[i]);
			} else {
				callback(songs);
			}
		}.bind(this));
	};
	if (i < array.length){
		getSongsOfObj(array[i])
	} else {
		callback(songs);
	}
};
ListAssistant.prototype.hideAlphaScroller = function(event) {
	if (this.scroller){
		this.scroller.hide();
		this.list.removeClassName("content-list");
	}
}

ListAssistant.prototype.showAlphaScroller = function(event) {
	if (this.scroller && koto.preferences.obj.alphaScroller === true){
		this.scroller.show();
		this.list.addClassName("content-list");
	}
}

ListAssistant.prototype.deactivate = function(event) {
	this.deactivateCommon();
};
ListAssistant.prototype.cleanup = function(event) {
	this.cleanupCommon()
	this.controller.stopListening(this.controller.get("results_list"), Mojo.Event.listTap, this.listTapHandler);
	this.controller.stopListening(this.controller.get("title-bar"), Mojo.Event.tap, this.titleBarTapHandler);
	
	if (this.data === "favorites" || this.data === "playlists"){
		this.controller.stopListening(this.list, Mojo.Event.listReorder, this.listReorderHandler);
		this.controller.stopListening(this.list, Mojo.Event.listDelete, this.listDeleteHandler);
	}	
	
	//this.controller.stopListening(this.controller.sceneElement, "mousedown", this.handleMeta);
	//this.controller.stopListening(this.controller.sceneElement, "mouseup", this.handleMeta);
	//this.controller.stopListening(this.scroller, Mojo.Event.flick, this.handleListScroll);

};