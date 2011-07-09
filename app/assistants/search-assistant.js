function SearchAssistant(e) {
	scene_helpers.addControlSceneMethods(this, {search: true});
}
var filterString = "";
SearchAssistant.prototype.setup = function() {
	this.initViewMenu($L("Search"));
	this.initCmdMenu();
	this.setupCommon();
		
	this.listAttrs = { 
		itemTemplate: "list/list-item",
		listTemplate: "list/empty-list",
		hasNoWidgets: true,
		reorderable: false,
		swipeToDelete: false,
		renderLimit: 50,
		formatters: {
			"title": function(value, model){
				if (model.display)
					return model.display.replace(new RegExp('(' + filterString + ')', 'gi'), '<span class="highlight">$1</span>');
			},
			"info": function(value, model){
				if (model.secondary){
					return model.secondary.replace(/^(\w|\s)*\s\-\s/ig, "");
					//return display.replace(new RegExp('(' + filterString + ')', 'gi'), '<span class="highlight">$1</span>');
				}
			},
		},
		dividerTemplate: "view/divider",
		dividerFunction: function(itemModel){
			if (itemModel.secondary.indexOf("Favorite ") === 0){
				return "Favorites";
			}
			return (itemModel.objType === "so") ? "songs" : itemModel.objType === "ar" ? "artists" : itemModel.objType === "al" ? "albums" : "playlists";
		}.bind(this)
	};
	this.items = [];
	this.listModel = {
		items: this.items
	}

	this.controller.setupWidget("searchResultList", this.listAttrs, this.listModel);
	this.list = this.controller.get("searchResultList");
	
	this.listTapHandler = this.listTap.bind(this);
	this.controller.listen('searchResultList', Mojo.Event.listTap, this.listTapHandler);
	
	//Setup filter
	this.filterFieldModel = {}

	this.controller.setupWidget('filterField', {}, this.filterFieldModel);
	this.filterField = this.controller.get("filterField");
	
	this.filterHandler = this.filterContent.bind(this);
	this.controller.listen('filterField', Mojo.Event.filter, this.filterHandler);
	
	this.moreDiv = this.controller.get("moreText");
	this.filter = "all";
	
	
};

SearchAssistant.prototype.activate = function(event) {

};

SearchAssistant.prototype.filterContent = function(event){
	if (!event.filterString.blank()){
		filterString = event.filterString;
		koto.justType.search(filterString, this.renderItems.bind(this), ((this.filter !== "all") ? this.filter[0] + this.filter[1] : null));
		//db8.exec({"select" : ["display", "secondary", "id"], "from":koto.appId + ".data:1","where":[{"prop":"searchKey","op":"%","val":event.filterString, "collate": "primary"}], "limit":50}, this.renderItems.bind(this), false, true);
	} else {
		this.renderItems([]);
	}
	//, "orderBy": "orderKey" ...

}
SearchAssistant.prototype.renderItems = function(items){
	//for(var i = 0; i < items.length; i++){
	//	if (items.objType
	//}
	this.list.mojo.noticeRemovedItems(0, this.items.length);
	this.list.mojo.setLength(0);
	this.items.clear();
	Object.extend(this.items, items);
	this.list.mojo.noticeAddedItems(0, this.items);
	//this.controller.modelChanged(this.listModel);
	this.list.mojo.setLength(items.length);
	this.filterField.mojo.setCount(items.length);
}


SearchAssistant.prototype.listTap = function(event){
	db8.getObjsById([event.item.id], function(results){
		obj = results[0];
		var objType = koto.utilities.getObjType(obj);

		//popup
		if (event.originalEvent.target.id && event.originalEvent.target.id === 'popup'){
			//build popup items
			var items = [];
			if (koto.nowPlaying.currentInfo.songs.length > 0)
				items.push({label: $L('Play Next'), command: 'play-next'},{label: $L('Play Last'), command: 'play-last'});
			if (objType !== "song"){
				items.unshift({label: $L('Play'), command: 'play'}, {label: $L("Shuffle Play"), command: "shuffle"});
				if (objType === "playlist" && event.item.type && event.item.type === "custom")	
					items.push({label: $L('View & Edit Songs'), command: 'view'});
				else if (objType === "playlist")
					items.push({label: $L('View Songs'), command: 'view'});
			} else {
				items.push({label: $L('Song Details'), command: 'details'});
			}
			items.push({label: $L('Add to Playlist'), command: 'add-to-playlist'})
			items.push({label: $L('Favorite'), command: 'favorite'});

			this.controller.popupSubmenu({
				onChoose: function(value){
					if (value === "favorite"){
						koto.content.favorites.add(obj);
					} else if (value === "view" && (objType === "artist" || objType === "album")){
						koto.content.view(obj);
					}
					else{
						var handleAction = function(songs){
							switch(value){
								case "play":
									koto.nowPlaying.playArray(songs, 0);
									break;
								case "shuffle":
									koto.nowPlaying.shufflePlayArray(songs, 0);
									break;
								case "view":
									koto.content.viewArray(obj, songs);							
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
									this.extraDiv.mojo.show("songDetails", songs, 0);					
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
		else if (objType === "artist" || objType === "album"){
			koto.content.view(obj);
		} 
		else {
			koto.content.getSongsOfObj(obj, function(songs, index_){
				var index = index_ || 0;
				if (objType === "song" || objType === "playlist"){
					koto.nowPlaying.playArray(songs, index);
				} else if (objType === "genre"){
					koto.content.viewArray(obj, songs);
				}
			}.bind(this), true);//pass true so it returns all songs by artist if it's a song
		}
	}.bind(this));
}
SearchAssistant.prototype.moreTap = function(event) {
	var items = [
		{label: $L("All"), command: "all"},
		{label: $L("Artists"), command: "artists"},
		{label: $L("Albums"), command: "albums"},
		{label: $L("Songs"), command: "songs"},
		{label: $L("Playlists"), command: "playlists"}
		
	]
	for(var i = 0; i< items.length; i++){
		if (items[i].command === this.filter){
			items[i].chosen = true;
		}else {
			items[i].chosen = false;
		}
	}
	this.controller.popupSubmenu({
		onChoose: function(value){
			if (value){
				this.filter = value;
				this.moreDiv.innerHTML = this.filter;
				this.filterContent({filterString: filterString});
			}
		}.bind(this),
		placeNear: event.target,
		items: items
	});

}

SearchAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

SearchAssistant.prototype.cleanup = function(event) {
	this.controller.stopListening('filterField', Mojo.Event.filter, this.filterHandler);
	this.controller.stopListening('searchResultList', Mojo.Event.listTap, this.listTapHandler);
};
