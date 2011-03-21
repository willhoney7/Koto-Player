function SearchAssistant(e) {
	if(e){
		this.e = e;
	}
	scene_helpers.addControlSceneMethods(this, {search: true});
}
var filterString = "";
SearchAssistant.prototype.setup = function() {
	this.setupCommon();
	this.initViewMenu("Search");
		
	var listAttrs = { 
		itemTemplate: "list/list-item",
		listTemplate: "list/empty-list",
		hasNoWidgets: true,
		reorderable: false,
		swipeToDelete: false,
		renderLimit: 50,
		formatters: {
			"title": function(value, model){
				if(model.display)
					return model.display.replace(new RegExp('(' + filterString + ')', 'gi'), '<span class="highlight">$1</span>');
			},
			"info": function(value, model){
				if(model.secondary)
					return model.secondary.replace(new RegExp('(' + filterString + ')', 'gi'), '<span class="highlight">$1</span>');
			},
		}
	};
	this.items = [];
	this.listModel = {
		items: this.items
	}

	this.controller.setupWidget("searchResultList", listAttrs, this.listModel);
	this.list = this.controller.get("searchResultList");
	
	this.listTapHandler = this.listTap.bind(this);
	this.controller.listen('searchResultList', Mojo.Event.listTap, this.listTapHandler);
	
	//Setup filter
	this.filterFieldModel = {}

	this.controller.setupWidget('filterField', {}, this.filterFieldModel);
	this.filterField = this.controller.get("filterField");
	
	this.filterHandler = this.filter.bind(this);
	this.controller.listen('filterField', Mojo.Event.filter, this.filterHandler);
	
	this.moreDiv = this.controller.get("moreText");
	this.filter = "all";
	
	
};

SearchAssistant.prototype.activate = function(event) {
	if(this.e){
		//this.filterField.mojo.setText(this.e);
		this.e = undefined;
	}
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

SearchAssistant.prototype.filter = function(event){
	if(!event.filterString.blank()){
		filterString = event.filterString;
		m.search(filterString, this.renderItems.bind(this), ((this.filter !== "all") ? this.filter[0] + this.filter[1] : null));
		//m.db8_exec({"select" : ["display", "secondary", "id"], "from":g.AppId + ".data:1","where":[{"prop":"searchKey","op":"%","val":event.filterString, "collate": "primary"}], "limit":50}, this.renderItems.bind(this), false, true);
	} else {
		this.renderItems([]);
	}
	//, "orderBy": "orderKey" ...

}
SearchAssistant.prototype.renderItems = function(items){
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
	m.getObjsById([event.item.id], function(results){
		obj = results[0];
		var objType = m.getObjType(obj);

		//popup
		if(event.originalEvent.target.id && event.originalEvent.target.id == 'popup'){
			//build popup items
			var items = [];
			if(m.nP.songs.length > 0)
				items.push({label: $L('Play Next'), command: 'play-next'},{label: $L('Play Last'), command: 'play-last'});
			if(objType !== "song"){
				items.unshift({label: $L('Play'), command: 'play'}, {label: $L("Shuffle Play"), command: "shuffle"});
				if(objType === "playlist" && event.item.type && event.item.type === "custom")	
					items.push({label: $L('View & Edit Songs'), command: 'view'});
				else if(objType === "playlist")
					items.push({label: $L('View Songs'), command: 'view'});
			}
			items.push({label: $L('Add to Playlist'), command: 'add-to-playlist'})
			items.push({label: $L('Favorite'), command: 'favorite'});

			this.controller.popupSubmenu({
				onChoose: function(value){
					if(value === "favorite"){
						m.addToFavorites(obj);
					} else if(objType === "artist" || objType === "album"){
						m.view(obj);
					}
					else{
						var handleAction = function(songs){
							switch(value){
								case "play":
									m.playArray(songs, 0);
									break;
								case "shuffle":
									m.shufflePlay(songs, 0);
									break;
								case "view":
									m.viewArray(obj, songs);							
									break;
								case "play-next":
									m.playArrayNext(songs);
									break;
								case "play-last":
									m.playArrayLast(songs);
									break;
								case "add-to-playlist":
									this.extraDiv.mojo.show("addToPlaylist", songs);
									break;
							};
						}.bind(this);
						m.getSongsOfObj(obj, handleAction);
					}
				}.bind(this),
				placeNear: event.originalEvent.target,
					items: items
			});
		}
		else if(objType === "artist" || objType === "album"){
			m.viewArtist(obj);
		} 
		else {
			m.getSongsOfObj(obj, function(songs){
				m.viewArray(obj, songs);							
			}.bind(this));
		}
	}.bind(this));
}
SearchAssistant.prototype.moreTap = function(event) {
	var items = [
		{label: "All", command: "all"},
		{label: "Artists", command: "artists"},
		{label: "Albums", command: "albums"},
		{label: "Songs", command: "songs"},
		{label: "Playlists", command: "playlists"}
		
	]
	for(var i = 0; i< items.length; i++){
		if(items[i].command == this.filter){
			items[i].chosen = true;
		}else {
			items[i].chosen = false;
		}
	}
	this.controller.popupSubmenu({
		onChoose: function(value){
			if(value){
				this.filter = value;
				this.moreDiv.innerHTML = this.filter;
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
	this.controller.stopListening('filterField', Mojo.Event.filterImmediate, this.filterImmediateHandler);
	this.controller.stopListening('searchResultList', Mojo.Event.listTap, this.listTap);
};
