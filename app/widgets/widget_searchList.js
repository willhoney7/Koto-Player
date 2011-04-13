//Deprecated. Doesn't work as well as I want it to.

Mojo.Widget.SearchList = Class.create({
	setup: function setup(){
		this._build();
		this.controller.exposeMethods(["hide", "show"]);
	},
	_build : function _build() {	
		var content = Mojo.View.render({object: {id: "filterField", widget: "FilterField"}, template: "widgets/widget_declaration"});
		Element.insert(this.controller.scene.sceneElement, content);
			
		this.filterField = this.controller.get('filterField');
		this.controller.scene.setupWidget('filterField', {}, this.filterFieldModel = {});
		
		this.controller.instantiateChildWidgets(this.controller.scene.sceneElement); 
			
		this.filterHandler = this.filter.bind(this);
		this.controller.listen('filterField', Mojo.Event.filter, this.filterHandler);

		this.filterImmediateHandler = this.filterImmediate.bind(this);
		this.controller.listen('filterField', Mojo.Event.filterImmediate, this.filterImmediateHandler);
		
		listAttrs = { 
			itemTemplate: "list/list-item",
			listTemplate: "list/empty-list",
			hasNoWidgets: true,
			reorderable: false,
			swipeToDelete: false,
			renderLimit: 50,
			formatters: {
				"title": function(value, model){
					if (model.display)
						return model.display;
				},
				"info": function(value, model){
					if (model.secondary)
						return model.secondary;
				},
			}
		};
		this.items = [];
		this.listModel = {
			items: this.items
		}
		var content = Mojo.View.render({object: {id: "searchResultList", widget: "List"}, template: "widgets/widget_declaration"});
		Element.insert(this.controller.element, "<div style='height: 45px'></div>");
		Element.insert(this.controller.element, content);
	
		this.controller.scene.setupWidget("searchResultList", listAttrs, this.listModel);
		this.list = this.controller.get("searchResultList");
		this.controller.instantiateChildWidgets(this.controller.element); 
		
		/*this.filter = this.filter.bind(this);
		this.controller.listen('filterField', Mojo.Event.filter, this.filter);
		
		this.filterImmediate = this.filterImmediate.bind(this);
		this.controller.listen('filterField', Mojo.Event.filterImmediate, this.filterImmediate);*/
		
		this.listTap = this.listTap.bind(this);
		this.controller.listen('searchResultList', Mojo.Event.listTap, this.listTap);
	},
	handleModelChanged : function() {
		//this.updateSong();
	},
	cleanup: function() {
		this.controller.stopListening('filterField', Mojo.Event.filter, this.filterHandler);
		this.controller.stopListening('filterField', Mojo.Event.filterImmediate, this.filterImmediateHandler);
		this.controller.stopListening('searchResultList', Mojo.Event.listTap, this.listTap);
	},	
	filterImmediate: function(event){
		if (!event.filterString.blank()){
			this.controller.scene.assistant.extraDiv.mojo.showSearch();
		}
	},
	filter: function(event){
		if (!event.filterString.blank()){
			db8.exec({"select" : ["display", "secondary", "id"], "from":koto.appId + ".data:1","where":[{"prop":"searchKey","op":"%","val":event.filterString, "collate": "primary"}], "limit":50}, this.renderItems.bind(this), false, true);
		} else {
			this.controller.scene.assistant.extraDiv.mojo.hide();
		}
		//, "orderBy": "orderKey" ...
	
	},
	renderItems: function(items){
		this.list.mojo.noticeRemovedItems(0, this.items.length);
		this.list.mojo.setLength(0);
		this.items.clear();
		Object.extend(this.items, items);
		this.list.mojo.noticeAddedItems(0, this.items);
		//this.controller.modelChanged(this.listModel);
		this.list.mojo.setLength(items.length);
		this.filterField.mojo.setCount(items.length);
	},
	listTap: function(event){	
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
				}
				items.push({label: $L('Add to Playlist'), command: 'add-to-playlist'})
				items.push({label: $L('Favorite'), command: 'favorite'});

				this.controller.scene.assistant.controller.popupSubmenu({
					onChoose: function(value){
						if (value === "favorite")
							koto.content.favorites.add(obj);
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
										koto.content.viewArray(songs, obj);
										break;
									case "play-next":
										koto.nowPlaying.playArrayNext(songs);
										break;
									case "play-last":
										koto.nowPlaying.playArrayLast(songs);
										break;
									case "add-to-playlist":
										this.controller.scene.assistant.extraDiv.mojo.show("addToPlaylist", songs);
										break;
								};
							}.bind(this);
							var formatted = (value === "view") ? true : false;
							koto.content.getSongsOfObj(obj, handleAction, formatted);
						}
					}.bind(this),
					placeNear: event.originalEvent.target,
						items: items
				});
			}
			else {
				if ((objType === "song" || objType === "playlist") || (this.data === "favorites" && koto.preferences.obj.favoriteTap === "play")){
					koto.content.getSongsOfObj(obj, function(songs){
						koto.nowPlaying.playArray(songs, 0);
					}.bind(this), false);
				}else {
					koto.content.getSongsOfObj(obj, function(songs){
						var focus = (objType === "album") ? obj.name : undefined;
						koto.content.viewArray(songs, obj, focus);
					}.bind(this), true);//pass true so it returns formatted songs
				}
			}
		}.bind(this));
	
	},
	
	//Mojo Methods
	show: function(){
		this.controller.element.show();	
	},
	hide: function(){
		//hide div
		this.controller.element.hide();
		
		//clear contents
		this.items.clear();
		this.controller.modelChanged(this.listModel);
	}
	
});
