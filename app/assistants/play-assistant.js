function PlayAssistant() {
	scene_helpers.addControlSceneMethods(this, {nowPlaying: true});
}
PlayAssistant.prototype.setup = function () {
	this.initViewMenu($L("Now Playing"));
	this.setupCommon();
	this.initAppMenu({items: [
		{label: $L("Share via Email"), items: [
			{label: $L("Now Playing List"), command: "share-playlist"},
			{label: $L("Current Song"), command: "share-song"},
			//{label: $L("All Music"), command: "share-json"}
		]}
	]});

	this.setupCmdMenu();
	this.progressNum = this.controller.get("progressNum");
	this.renderProgressNum();
	
	/* List */
	this.listAttrs = {
		itemTemplate:'play/item',
		formatters: {
			"info": function(value, model){
				return model.artist + " - " + model.album;
			},
			"active": function(value, model, index){
				//console.log("index is " + index);
				//if (model._id === koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]._id){
				//	console.log("index is " + index + ", koto.nowPlaying.currentInfo.index is " + koto.nowPlaying.currentInfo.index);
				//}
				if (model._id === koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]._id && index === koto.nowPlaying.currentInfo.index) {
					return "active";
				}
			},
			"truncatingOption": function(value, model){
				if (!koto.preferences.obj.truncateText){
					return "noTruncate";
				}
			}
		},
		hasNoWidgets: true,
		swipeToDelete:true, 
		reorderable:true,
		autoconfirmDelete: true
	};
	this.listModel = {            
        items: koto.nowPlaying.currentInfo.songs
    };    
	this.controller.setupWidget("results_list", this.listAttrs, this.listModel);
	this.list = this.controller.get("results_list");
	this.sceneScroller = this.controller.getSceneScroller();
	this.listContainer = this.controller.get("list");
	this.listTapHandler = this.listTap.bind(this);
	this.controller.listen(this.list, Mojo.Event.listTap, this.listTapHandler);
	this.listReorderHandler = this.listReorder.bind(this);
	this.controller.listen(this.list, Mojo.Event.listReorder, this.listReorderHandler);
	this.listDeleteHandler = this.listDelete.bind(this);
	this.controller.listen(this.list, Mojo.Event.listDelete, this.listDeleteHandler);
	
	
	/*Album Art*/
	this.albumArtContainer = this.controller.get("albumart");
	this.albumArtImage = this.controller.get("albumArtImage");
	
	//Single item
	this.nowPlayingItem = this.controller.get("nowPlayingItem");
	this.handleAlbumArtTap = function albumArtTap(){
		if (!this.albumArtScroller.visible()){
			if (koto.nowPlaying.currentInfo.playing === true && this.canPause){
				koto.nowPlaying.pause();
			}
			else {
				koto.nowPlaying.resume();
				
			}
		}
	}.bind(this);
	this.handleAlbumArtFlick = this.albumArtFlick.bind(this);
	this.handleAlbumArtHold = this.albumArtHold.bind(this);
	this.controller.listen(this.nowPlayingItem, Mojo.Event.tap, this.handleAlbumArtTap);
	this.controller.listen(this.nowPlayingItem, Mojo.Event.hold, this.handleAlbumArtHold);
	this.controller.listen(this.nowPlayingItem, Mojo.Event.flick, this.handleAlbumArtFlick);
	
	//this.renderNowPlayingItem();
	
	//Scroller
	this.controller.setupWidget("albumart-scroller",
        this.scrollerAttributes = {
        },
        this.scrollerModel = {
			mode: "horizontal"//-snap"
           // snapIndex: 0
		}
    ); 
	this.albumArtScroller = this.controller.get("albumart-scroller");
	this.albumArtScrollerContent = this.controller.get("albumart-scroller-content");
	this.albumArtScroller.hide();
	
	this.canPause = true, this.canFlick = true;
	this.handleAlbumArtScrollerFlick = this.albumArtScrollerFlick.bind(this);
	this.handleAlbumArtScrollerTap = this.albumArtScrollerTap.bind(this);
	this.handleAlbumArtScrollerHold = this.albumArtScrollerExit.bind(this);
	this.controller.listen(this.albumArtScrollerContent, Mojo.Event.flick, this.handleAlbumArtScrollerFlick);
	this.controller.listen(this.albumArtScrollerContent, Mojo.Event.tap, this.handleAlbumArtScrollerTap);
	this.controller.listen(this.albumArtScrollerContent, Mojo.Event.hold, this.handleAlbumArtScrollerHold);
	

	/* Toggle Bar */
	this.toggleAlbumartView = this.controller.get("toggle-albumart-view");
	this.toggleListView = this.controller.get("toggle-list-view");
	this.toggleBarTapHandler = this.swapView.bind(this);
	this.controller.listen(this.controller.get("toggle-bar"), Mojo.Event.tap, this.toggleBarTapHandler);
	
	this.handleWindowResize = function(event){
		if (this.controller && this.controller.window){
			if (Mojo.Environment.DeviceInfo.screenHeight === 400){
				if (this.controller.window.innerHeight < 372){
					//this.albumArtImage.style.padding = "5px; 0px; 0px; 0px;";
					this.albumArtScrollerContent.style.top = "-2.7%";
					this.nowPlayingItem.style.top = "-1.4%";
				} else {
					this.nowPlayingItem.style.top = "1.8%";
					this.albumArtScrollerContent.style.top = "1.8%";
				}
			}	
			else if (Mojo.Environment.DeviceInfo.screenHeight === 480){
				if (this.controller.window.innerHeight < 452){	
					this.albumArtScrollerContent.style.top = "-2%";
					this.nowPlayingItem.style.top = "-2%";
				} else {
					this.nowPlayingItem.style.top = "1.9%";
					this.albumArtScrollerContent.style.top = "1.9%";
				}
			}
			else if (Mojo.Environment.DeviceInfo.screenHeight === 800){
				if (this.controller.window.innerHeight < 505){	
					this.albumArtScrollerContent.style.top = "0%";
					this.nowPlayingItem.style.top = "0%";
				} else {
					this.nowPlayingItem.style.top = "3.2%";
					this.albumArtScrollerContent.style.top = "3.2%";
				}
			}
		}
	}
	this.handleWindowResize();
	Mojo.Event.listen(this.controller.window, 'resize', this.handleWindowResize.bind(this));
	
};
PlayAssistant.prototype.setupCmdMenu = function() {
	this.sendMenuModel ={
		label: $L('Music Options'),
		items: [
			{label: $L('Add to Favorites'), items: [
				{label: $L('This Song'), command:'favorite-song'}
			]},
			{label: $L('Save to Playlist'), items: [
				{label: $L('This Song'), command:'song-playlist'},
				{label: $L('All'), command:'all-playlist'}
			]},
			{},
			{label: $L('Repeat'), items: [
				{label: $L("No Repeat"), command:'repeat-0'},
				{label: $L("Repeat Once"), command:'repeat-1'},
				{label: $L("Repeat"), command:'repeat-2'}
			]},
			{},
			{label: $L("View Album"), command: "more"},
			{label: $L('Song Details'), command:"details"},
			//{label: $L('Lyrics'), command:'lyrics' },
			{},
			{label: $L('Tweet Song'), command:'tweet'}					
		]
	};
	for(var i = 0; i < koto.nowPlaying.currentInfo.songs.length; i++){
		if (koto.nowPlaying.currentInfo.songs[0].artist !== koto.nowPlaying.currentInfo.songs[i].artist){
			this.sendMenuModel.items.splice(5, 1, 
				{
					label: $L("Album"), 
					items: [
						{label: $L("Continue"), command: "continue-album"},
						{label: $L("View"), command: "more"}//todo change command name
					],
				}
			);
			break;
		}
	}
	this.sendMenuModel.items[3].items[koto.nowPlaying.currentInfo.repeat].chosen = true;
	this.controller.setupWidget('more-menu', undefined, this.sendMenuModel);
	this.initCmdMenu(true)
}

PlayAssistant.prototype.activate = function(event) {
	this.focusSong(false);
	this.renderNowPlayingItem();
	this.panel.mojo.updateSong();
	if (this.albumArtScroller.visible()){
		this.renderAlbumArtScrollerItems();
	}
};

PlayAssistant.prototype.focusSong = function(animate){
	this.list.mojo.revealItem(koto.nowPlaying.currentInfo.index, animate);
	this.list.mojo.revealItem(koto.nowPlaying.currentInfo.index, animate);
	//this.sceneScroller.mojo.scrollTo(0, -(koto.nowPlaying.currentInfo.index * 55) + 75, animate, false);
}

/* View Swap */
PlayAssistant.prototype.swapView = function(event) {
	this.toggleAlbumartView.toggleClassName("depressed");
	this.toggleListView.toggleClassName("depressed")
	var transition = this.controller.prepareTransition(Mojo.Transition.crossFade, false);
	this.albumArtScroller.hide();
	if (this.toggleAlbumartView.hasClassName("depressed")){
		this.listContainer.hide();
		this.controller.hideWidgetContainer('results_list');
		this.nowPlayingItem.show();
		this.renderNowPlayingItem();
		/*this.albumArtContainer.show(); //this doesn't seem to work.. bug in horiz scroller. Doesn't like being hidden.
		if (this.albumArtScroller.visible()){
			var left = this.albumArtScroller.mojo.getState().left;
			this.index = parseInt(left, 10);
			//this.index = Math.round(left/this.getItemWidth())
		}*/
		this.controller.getSceneScroller().mojo.revealTop(0);
	}
	else {
		this.controller.hideWidgetContainer('albumart-scroller');
		this.nowPlayingItem.hide()
		this.listContainer.show();
		/*this.albumArtContainer.hide();
		if (this.index){
			this.albumArtScroller.mojo.scrollTo(this.index, 0, true);
		}*/
		this.controller.showWidgetContainer('results_list');
		this.activate();
	}
	transition.run();
}

/* Album Art */
PlayAssistant.prototype.renderNowPlayingItem = function(){
	var array, previousItem = (koto.nowPlaying.currentInfo.index > 0)? koto.nowPlaying.currentInfo.index-1: koto.nowPlaying.currentInfo.songs.length-1, nextItem = (koto.nowPlaying.currentInfo.index < koto.nowPlaying.currentInfo.songs.length-1)? koto.nowPlaying.currentInfo.index+1: 0;
	var renderContent = function(){
		var renderedInfo = Mojo.View.render({
			object: {
				previousItem: koto.nowPlaying.currentInfo.songs[previousItem].albumArt,
				currentItem: koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].albumArt,
				nextItem: koto.nowPlaying.currentInfo.songs[nextItem].albumArt
			},
			template: "play/now-playing-item",
			formatters: {
				"dimension": function(value, model){
					var length = (Mojo.Environment.DeviceInfo.screenHeight === 400) ? "195" : (Mojo.Environment.DeviceInfo.screenHeight === 800) ? "300" : "275";
					return length + "px";
				}
			}
		});
		this.nowPlayingItem.innerHTML = renderedInfo; 
	}.bind(this);
	koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].albumArt = koto.albumArt.get(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]);
	koto.nowPlaying.currentInfo.songs[previousItem].albumArt = koto.albumArt.get(koto.nowPlaying.currentInfo.songs[previousItem]);
	koto.nowPlaying.currentInfo.songs[nextItem].albumArt = koto.albumArt.get(koto.nowPlaying.currentInfo.songs[nextItem]);
	renderContent();
}

PlayAssistant.prototype.albumArtFlick = function(event){
	if (event.velocity.x > 600 && (Math.abs(event.velocity.x) > Math.abs(event.velocity.y))){
		if (this.canFlick){
			this.canPause = false;
			koto.nowPlaying.playPrevious();
		}
	}
	else if (event.velocity.x < -600 && (Math.abs(event.velocity.x) > Math.abs(event.velocity.y))){
		if (this.canFlick){
			this.canPause = false;
			koto.nowPlaying.playNext();
		}
	}
	else if (event.velocity.y < -1000 && (Math.abs(event.velocity.y) > Math.abs(event.velocity.x))){
		this.albumArtHold();
	} else if (event.velocity.y > 1000 && (Math.abs(event.velocity.y) > Math.abs(event.velocity.x))){
		this.extraDiv.mojo.show("songDetails", koto.nowPlaying.currentInfo.songs, koto.nowPlaying.currentInfo.index);			
	}
}
PlayAssistant.prototype.getItemWidth = function(event){
	if (Mojo.Environment.DeviceInfo.screenWidth === 320){
		return 220;
	}
	if (Mojo.Environment.DeviceInfo.screenWidth === 480){
		return 280;
	}
	return 220;
}
PlayAssistant.prototype.albumArtHold = function(event){
	//scroller hold
	if (koto.nowPlaying.currentInfo.songs.length > 1){
		this.nowPlayingItem.hide();

		this.renderAlbumArtScrollerItems();
		this.albumArtScroller.show();
		var songIndex = koto.nowPlaying.currentInfo.index;
		var start = ((koto.nowPlaying.currentInfo.index+1) > koto.preferences.obj.albumArtScrollerNum)? koto.nowPlaying.currentInfo.index - koto.preferences.obj.albumArtScrollerNum : 0;
		var end = ((koto.nowPlaying.currentInfo.songs.length - koto.nowPlaying.currentInfo.index+1) > parseInt(koto.preferences.obj.albumArtScrollerNum, 10)) ?koto.nowPlaying.currentInfo.index + parseInt(koto.preferences.obj.albumArtScrollerNum, 10) : koto.nowPlaying.currentInfo.songs.length-1 ;
		if (start !== 0){
			songIndex = koto.nowPlaying.currentInfo.index - (koto.nowPlaying.currentInfo.index - koto.preferences.obj.albumArtScrollerNum);
		}
		
		
		var index = -(songIndex * this.getItemWidth());
		if (index === -this.getItemWidth())
			index = -this.getItemWidth() + 5;
		
		this.albumArtScroller.mojo.scrollTo(index, 0, false);
		this.albumArtScroller.mojo.setSnapIndex(songIndex, false);
	}
}
PlayAssistant.prototype.renderAlbumArtScrollerItems = function(){
	var start = ((koto.nowPlaying.currentInfo.index+1) > koto.preferences.obj.albumArtScrollerNum)? koto.nowPlaying.currentInfo.index - koto.preferences.obj.albumArtScrollerNum : 0;
	var end = ((koto.nowPlaying.currentInfo.songs.length - koto.nowPlaying.currentInfo.index) > parseInt(koto.preferences.obj.albumArtScrollerNum, 10)) ?koto.nowPlaying.currentInfo.index + parseInt(koto.preferences.obj.albumArtScrollerNum, 10) : koto.nowPlaying.currentInfo.songs.length;
	var array = koto.nowPlaying.currentInfo.songs.slice(start, end);
	
	for(var i = 0; i < array.length; i++){
		//if (!koto.nowPlaying.currentInfo.songs[i].albumArt)
			array[i].albumArt = koto.albumArt.get(array[i]);
	}
	
	
	var content = Mojo.View.render({collection: array, template: 'play/scroller-item', formatters: {
		"dimension": function(value, model){
			if (Mojo.Environment.DeviceInfo.screenHeight === 480){
				return "200px";
			}
			if (Mojo.Environment.DeviceInfo.screenHeight === 400){
				return "125px";
			}
			if (Mojo.Environment.DeviceInfo.screenHeight === 800){
				return "260px";
			}	
		},
		"width": function(value, model){
			if (Mojo.Environment.DeviceInfo.screenHeight === 480){
				return "200px";
			}
			if (Mojo.Environment.DeviceInfo.screenHeight === 400){
				return "125px";
			}
			if (Mojo.Environment.DeviceInfo.screenHeight === 800){
				return "260px";
			}	
		},
		"background": function(value, model, index){
			if (model.title){
				if (start + index === koto.nowPlaying.currentInfo.index){
					return "currentItem";
				}
			}
		},
		"index": function(value, model, index){
			return start + index; //add start to offset the limited amount of items
		}
	}});
	var tds =  (Mojo.Environment.DeviceInfo.screenWidth === 320) ? "<td><div style='width: 50px'></div></td>" : "<td><div style='width: 20px'></div></td>";
	this.albumArtScrollerContent.innerHTML =  tds + content + tds;
	
	//elements = this.controller.sceneElement.select('.item');
	//this.scrollerModel.snapElements = {x: elements};
	//this.controller.modelChanged(this.scrollerModel);
	
}

PlayAssistant.prototype.albumArtScrollerFlick = function(event){
	if (Math.abs(event.velocity.y) > 1000 && (Math.abs(event.velocity.y) > Math.abs(event.velocity.x))){
		var index = parseInt(event.target.parentElement.id, 10);
		if (koto.nowPlaying.currentInfo.songs[index]){
			if (event.velocity.y < -1000){
				this.listDelete({"index": index});
				this.list.mojo.noticeRemovedItems(index, 1);
				if (index === koto.nowPlaying.currentInfo.songs.length){
					index -= 1;
				}
				this.renderAlbumArtScrollerItems();
				this.albumArtScroller.mojo.setSnapIndex(index, false);
			}
			else if (event.velocity.y > 1000){
				if (koto.nowPlaying.currentInfo.index !== index){
					var oldIndex = koto.nowPlaying.currentInfo.index;
					koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = undefined;
					koto.nowPlaying.currentInfo.index = index;
					koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = true;
					this.list.mojo.invalidateItems(oldIndex, 1);
					this.list.mojo.invalidateItems(koto.nowPlaying.currentInfo.index, 1);
					koto.nowPlaying.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path);
					this.renderProgressNum();
					this.panel.mojo.updateSong();
				}
				this.albumArtScroller.hide();
				this.albumArtScrollerContent.innerHTML = "";
				this.renderNowPlayingItem();
				this.nowPlayingItem.show();
			}
		}
	}
}
PlayAssistant.prototype.albumArtScrollerTap = function(event){
	if (!this.albumArtScroller.visible() || !this.canPause)
		return;
		
	event.index = parseInt(event.target.parentElement.id, 10);
	
	var sentEvent = event;
	sentEvent.target = Object.clone(event.target)
	sentEvent.item = koto.nowPlaying.currentInfo.songs[event.index];
	sentEvent.target.id = "popup";
	sentEvent.originalEvent = {target: sentEvent.target};
	this.listTap(sentEvent);
	
}
PlayAssistant.prototype.albumArtScrollerExit = function(event){
	this.albumArtScroller.hide();
	this.nowPlayingItem.show();
}
/* List functions*/
PlayAssistant.prototype.listTap = function(event) {
	objType = koto.utilities.getObjType(event.item);
	if (event.originalEvent.target.id && event.originalEvent.target.id === 'popup'){
		var items = [];
		if (koto.nowPlaying.currentInfo.songs.length > 0 && event.index !== koto.nowPlaying.currentInfo.index){
			if (event.index !== koto.nowPlaying.currentInfo.index && this.albumArtScroller.visible())//for album art scroller
				items.push({label: $L('Play Now'), command: 'play-now'});			
			if (event.index !== koto.nowPlaying.currentInfo.index + 1)							
				items.push({label: $L('Play Next'), command: 'play-next'});
			if (event.index !== koto.nowPlaying.currentInfo.songs.length - 1)	
				items.push({label: $L('Play Last'), command: 'play-last'});
		}
		if (objType === "song" && !event.fromSongDetails){
			items.push({label: $L("Song Details"), command: "details"});
		}
		for(var i = 0; i < koto.nowPlaying.currentInfo.songs.length; i++){
			if (koto.nowPlaying.currentInfo.songs[0].artist !== koto.nowPlaying.currentInfo.songs[i].artist){
				if (event.index === koto.nowPlaying.currentInfo.index)
					items.push({label: $L("Continue with Album"), command: "continue-album"}, {label: $L("View Album"), command: "view-album"});
				else 
					items.push({label: $L("View Album"), command: "view-album"});		
				break;
			}
		}
		if (!event.fromSongDetails){
			items.push({label: $L('Add to Playlist'), command: 'add-to-playlist'});		
		}
		items.push({label: $L('Favorite'), command: 'favorite'});

		this.controller.popupSubmenu({
			onChoose: function(value){
				switch(value){
					case 'play-now':
						koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = undefined;
						var index = koto.nowPlaying.currentInfo.index;
						koto.nowPlaying.currentInfo.index = event.index;
						koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = true;
						this.list.mojo.invalidateItems(index, 1);
						this.list.mojo.invalidateItems(koto.nowPlaying.currentInfo.index, 1);
						koto.nowPlaying.playSong(event.item.path);
						this.renderNowPlayingItem();
						this.renderProgressNum();
						this.panel.mojo.updateSong();
						if (this.albumArtScroller.visible()){
							this.renderAlbumArtScrollerItems();
						}
						
						break;
					case 'play-next':
						if (event.index < koto.nowPlaying.currentInfo.index)
							koto.nowPlaying.currentInfo.index--;
						koto.nowPlaying.currentInfo.songs.splice(event.index, 1);
						this.list.mojo.noticeRemovedItems(event.index, 1);
						koto.nowPlaying.currentInfo.songs.splice(koto.nowPlaying.currentInfo.index+1,0, event.item);
						this.list.mojo.noticeAddedItems(koto.nowPlaying.currentInfo.index+1, [event.item]);
						
						this.renderProgressNum();
						
						if (this.albumArtScroller.visible()){
							this.renderAlbumArtScrollerItems();
						} else if (event.fromSongDetails){
							this.extraDiv.mojo.run("songDetails", "refresh", {playedNext: true});
						}
						
						break;
					case 'play-last':
						if (event.index < koto.nowPlaying.currentInfo.index)
							koto.nowPlaying.currentInfo.index--;
						koto.nowPlaying.currentInfo.songs.splice(event.index, 1);
						this.list.mojo.noticeRemovedItems(event.index, 1);
						koto.nowPlaying.currentInfo.songs.splice(koto.nowPlaying.currentInfo.songs.length, 0, event.item);
						this.list.mojo.noticeAddedItems(koto.nowPlaying.currentInfo.songs.length, [event.item]);
						
						this.renderProgressNum();
						if (this.albumArtScroller.visible()){
							this.renderAlbumArtScrollerItems();
						} else if (event.fromSongDetails){
							this.extraDiv.mojo.run("songDetails", "refresh", {playedLast: true});
						}
						break;
					case "continue-album":
						this.continueAlbum();
						break;
					case 'view-album':
						koto.content.view({name: event.item.album, type: "album"});
						break;
					case 'add-to-playlist':
						this.extraDiv.mojo.show("addToPlaylist", [event.item]);
						break;
					case 'favorite':
						koto.content.favorites.add(event.item);
						break;
					case "details":
						this.extraDiv.mojo.show("songDetails", koto.nowPlaying.currentInfo.songs, event.index);					
						break;
				}
			},
			placeNear: event.originalEvent.target,
				items: items
		});
	}
	else {
		if (event.index !== koto.nowPlaying.currentInfo.index){
			koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = undefined;
			var index = koto.nowPlaying.currentInfo.index;
			koto.nowPlaying.currentInfo.index = event.index;
			koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = true;
			this.list.mojo.invalidateItems(index, 1);
			this.list.mojo.invalidateItems(koto.nowPlaying.currentInfo.index, 1);
			koto.nowPlaying.playSong(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].path);
			this.focusSong(true);
			this.renderNowPlayingItem();
			this.renderProgressNum();
			this.panel.mojo.updateSong();
		}
	}
};

PlayAssistant.prototype.listReorder = function(event){
	koto.nowPlaying.currentInfo.songs.splice(event.fromIndex, 1);
	koto.nowPlaying.currentInfo.songs.splice(event.toIndex, 0, event.item);

	if (event.fromIndex === koto.nowPlaying.currentInfo.index)
		koto.nowPlaying.currentInfo.index = event.toIndex;
	else if (event.fromIndex > koto.nowPlaying.currentInfo.index && event.toIndex <= koto.nowPlaying.currentInfo.index){
		koto.nowPlaying.currentInfo.index++;
	}
	else if (event.fromIndex < koto.nowPlaying.currentInfo.index && event.toIndex >= koto.nowPlaying.currentInfo.index){
		koto.nowPlaying.currentInfo.index--;
	}
	this.renderProgressNum();
}
PlayAssistant.prototype.listDelete = function(event){
	if (koto.nowPlaying.currentInfo.songs.length === 1){
		koto.nowPlaying.stop();
	}
	koto.nowPlaying.currentInfo.songs.splice(event.index, 1);
	if (koto.nowPlaying.currentInfo.songs.length === 0){
		koto.nowPlaying.currentInfo.songs.clear();
		this.controller.stageController.popScene();
	} else {
		if (event.index < koto.nowPlaying.currentInfo.index)
			koto.nowPlaying.currentInfo.index--;
		else if (event.index === koto.nowPlaying.currentInfo.index){
			koto.nowPlaying.currentInfo.index--;
			koto.nowPlaying.playNext();
			
			setTimeout(function(){
				this.list.mojo.invalidateItems(koto.nowPlaying.currentInfo.index, 1);
			}.bind(this), 100);//This is because there's some sort of bug 

		}
		this.renderProgressNum();
	}
}

/* 
 * Control functions 
 * //The _underscore means they get delegated by the music player
 */

PlayAssistant.prototype._playPrevious = function(){
	if (this.extraDiv.mojo.visible("lyrics")){
		this.extraDiv.mojo.show("lyrics");
	}else if (this.extraDiv.mojo.visible("songDetails")){
		this.extraDiv.mojo.show("songDetails", koto.nowPlaying.currentInfo.songs, koto.nowPlaying.currentInfo.index);
	}//checks for visible extras, and updates them if they exist.

	this.renderProgressNum();
	//this.renderNowPlayingItem();
	this.controller.get("album-art-container").addClassName("previous");
	this.canFlick = false;
	koto.nowPlaying.resume();

	setTimeout(function(){
		this.renderNowPlayingItem();
		this.canFlick = true;
		this.canPause = true;
	}.bind(this), 400);
	if (this.albumArtScroller.visible()){
		//var state = this.albumArtScroller.mojo.getState();
		this.renderAlbumArtScrollerItems();
		//this.albumArtSroller.mojo.setState(state, false);
	}
	
	this.panel.mojo.updateSong();
	this.list.mojo.invalidateItems(koto.nowPlaying.currentInfo.index, 2);
	this.focusSong(true);
	this.panel.mojo.updateSong();
}
PlayAssistant.prototype._playNext = function(dontPlay){
	if (this.extraDiv.mojo.visible("lyrics")){
		this.extraDiv.mojo.show("lyrics");
	}else if (this.extraDiv.mojo.visible("songDetails")){
		this.extraDiv.mojo.show("songDetails", koto.nowPlaying.currentInfo.songs, koto.nowPlaying.currentInfo.index);
	}
	if (!dontPlay){
		//koto.nowPlaying.resume();
	}
	this.renderProgressNum();
	//this.renderNowPlayingItem();
	this.controller.get("album-art-container").addClassName("next");
	this.canFlick = false;
	setTimeout(function(){
		this.renderNowPlayingItem();
		this.canFlick = true;
		this.canPause = true;
		
	}.bind(this), 400);	
	if (this.albumArtScroller.visible()){
		//var state = this.albumArtScroller.mojo.getState();
		this.renderAlbumArtScrollerItems();
		//this.albumArtSroller.mojo.setState(state, false);
	}
	if (koto.nowPlaying.currentInfo.index > 0)
		this.list.mojo.invalidateItems(koto.nowPlaying.currentInfo.index-1, 2);
	else {
		this.list.mojo.invalidateItems(koto.nowPlaying.currentInfo.index, 1);	
		this.list.mojo.invalidateItems(koto.nowPlaying.currentInfo.songs.length-1, 1);
	}
	this.focusSong(true);
	this.panel.mojo.updateSong();
	
}

PlayAssistant.prototype.continueAlbum = function(){
	var song = koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index];
	koto.content.albums.getSongsOfOne({album: song.album}, function(array_){
		array = JSON.parse(JSON.stringify(array_));
		var newIndex;
		for(var i = 0; i < array.length; i++){
			if (array[i].title === song.title && array[i].artist === song.artist && song.album === array[i].album){
				newIndex = i;
			}
		}
		//this.list.mojo.noticeRemovedItems(0, koto.nowPlaying.currentInfo.songs.length);
		koto.nowPlaying.currentInfo.songs.clear();
		this.controller.modelChanged(this.listModel);

		Object.extend(koto.nowPlaying.currentInfo.songs, array);
		koto.nowPlaying.currentInfo.index = newIndex;
		koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].active = true;
		this.list.mojo.noticeAddedItems(0, koto.nowPlaying.currentInfo.songs);
		this.renderProgressNum();	
		this.renderNowPlayingItem();
		
		koto.nowPlaying.currentInfo.unshuffledSongs = [];
		this.cmdMenuModel.items[1].items[4].icon = "music-shuffle";
		this.controller.modelChanged(this.cmdMenuModel);
		
		if (this.albumArtScroller.visible()){
			this.albumArtScrollerExit();
		}	
	}.bind(this));
}

/* Progress Functions */
PlayAssistant.prototype.renderProgressNum = function(){
	this.progressNum.innerHTML = (koto.nowPlaying.currentInfo.index+1)+"/"+koto.nowPlaying.currentInfo.songs.length;
}

PlayAssistant.prototype.handleCommand = function(event){
	if (event.type === Mojo.Event.back){
		if (this.extraDiv && this.extraDiv.hasClassName("shown")){
			this.extraDiv.mojo.hide();
			event.stop();
			event.stopPropagation();
		}
		else if (this.albumArtScroller && this.albumArtScroller.visible()){
		this.albumArtScroller.hide();
		this.nowPlayingItem.show();
		event.stop();
			event.stopPropagation();
		}
	} else if (event.type === Mojo.Event.forward){
		this.controller.stageController.pushScene("search");
		
	}
	else if (event.type === Mojo.Event.command){
		var setupChosenRepeat = function(){
			this.sendMenuModel.items[3].items[koto.nowPlaying.currentInfo.repeat].chosen = true;
			this.controller.modelChanged(this.sendMenuModel);
		}.bind(this);
		var launchEmail = function(text){
			this.controller.serviceRequest("palm://com.palm.applicationManager", {
				method: 'open',
				parameters: {
					id: "com.palm.app.email",
					params: {
						summary: "Check out my music on Koto Player for webOS!",
						text: text
					}
				}
			});
		}.bind(this);
		switch(event.command){
			case "more":
				koto.content.view({name: koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].artist, type: "artist"});
				break;
			case "view":
				koto.content.view({name: koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].album, type: "album"});
				break;
			case "share-playlist":
				var text = "I'm using Koto Player for webOS. Check out <a href='http://kotoplayer.com'>http://kotoplayer.com</a> for more info!";
				text += " This is my current playlist: <br/><br/>"
				for(var i = 0; i < koto.nowPlaying.currentInfo.songs.length; i++){
					text += ("<li>" + koto.nowPlaying.currentInfo.songs[i].title + " by " + koto.nowPlaying.currentInfo.songs[i].artist + "</li>");
				}
				launchEmail(text);
				
				break;
			case "share-song":
				var text = "I'm using Koto Player for webOS. Check out <a href='http://kotoplayer.com'>http://kotoplayer.com</a> for more info!";
				text += " I'm playing this song now!<br/><br/>";
				text += ("<li>" + koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].title + " by " + koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].artist + "</li>");
				launchEmail(text);
				break;
			case "share-json":
				/*var text = "SONGS: " + JSON.stringify(koto.content.songs.array) + " ";
				text += "\nARTISTS: " + JSON.stringify(koto.content.artists.array) + " ";
				text += "\nALBUMS: " + JSON.stringify(koto.content.albums.array) + " ";
				text += "\nGENRES: " + JSON.stringify(koto.content.genres.array) + " ";*/
				koto.content.artists.getFormattedSongsOfOne("Sasha Knyazev", function(songs){
					var text = "\nSASHA KNYAZEV: " + JSON.stringify(songs) + " ";
					launchEmail(text);
				
				});
				break;
			case 'play_pause':
				if (koto.nowPlaying.currentInfo.playing === true){
					koto.nowPlaying.pause();
				}
				else{
					koto.nowPlaying.resume();
				}
				break;
			case 'previous':
				if (this.canFlick){
					koto.nowPlaying.playPrevious();
				}
				break;
			case 'next':
				if (this.canFlick){
					koto.nowPlaying.playNext();
				}
				break;
			case 'shuffle':
				if (koto.nowPlaying.currentInfo.unshuffledSongs.length > 0){
					koto.nowPlaying.unshuffle();
					
					this.cmdMenuModel.items[1].items[4].icon = "music-shuffle";
					this.controller.modelChanged(this.cmdMenuModel);
					
					if (this.albumArtScroller.visible()){
						var index = -(koto.nowPlaying.currentInfo.index * this.getItemWidth());
						if (index === -this.getItemWidth())
							index = -this.getItemWidth() + 5;
						this.renderAlbumArtScrollerItems();
						this.albumArtScroller.mojo.scrollTo(index, 0, false);
						//this.albumArtScroller.mojo.setSnapIndex(koto.nowPlaying.currentInfo.index, false);
					} else {
						this.renderNowPlayingItem();
					}
				}
				else {
					koto.nowPlaying.shuffle();
					
					this.cmdMenuModel.items[1].items[4].icon = "music-shuffle-active";
					this.controller.modelChanged(this.cmdMenuModel);
					
					if (this.albumArtScroller.visible()){
						var index = -(koto.nowPlaying.currentInfo.index * this.getItemWidth());
						if (index === -this.getItemWidth())
							index = -this.getItemWidth() + 5;
						this.renderAlbumArtScrollerItems();
						this.albumArtScroller.mojo.scrollTo(index, 0, false);
						//this.albumArtScroller.mojo.setSnapIndex(koto.nowPlaying.currentInfo.index, false);
					} else {
						this.renderNowPlayingItem();
					}
				
				}
				this.list.mojo.noticeUpdatedItems(0, koto.nowPlaying.currentInfo.songs);
				this.renderProgressNum();
				this.focusSong(true);
				break;

			case 'more-menu':
				//this.popupMoreMenu();
				break;
			case 'continue-album':
				this.continueAlbum();
				break;
			case 'lyrics':
				//m.debugObjFull(koto.nowPlaying.currentInfo.audioObj);
				//console.log("cao " + koto.nowPlaying.currentInfo.cao);
				this.extraDiv.mojo.toggle("lyrics");
				break;
			case "details":
				this.extraDiv.mojo.toggle("songDetails", koto.nowPlaying.currentInfo.songs, koto.nowPlaying.currentInfo.index);
				break;
			case "tweet":
				if (koto.preferences.obj.twitter.authorized === true){
					checkConnectivity(function(connected){
						if (connected){
							koto.twitter.generateTweet();
						} else {
							koto.utilities.bannerError("Not Connected to Internet");
						}
					}.bind(this));
				}else {
					koto.utilities.bannerError("Not Logged Into Twitter!", {action: "pushScene", scene: "prefs"});
				}
				break;
			case 'repeat-2':
			case 'repeat-1':
			case 'repeat-0':
				this.sendMenuModel.items[3].items[koto.nowPlaying.currentInfo.repeat].chosen = false;
				koto.nowPlaying.currentInfo.repeat = parseInt(event.command.split("-")[1], 10);
				setupChosenRepeat();
				break;
		
			case 'all-playlist':
				this.extraDiv.mojo.toggle("addToPlaylist", koto.nowPlaying.currentInfo.songs.clone());
				break;
			case 'song-playlist':
				this.extraDiv.mojo.toggle("addToPlaylist", [koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]]);			
				break;
			case "playlist-popup":
				this.controller.popupSubmenu({
					onChoose: function(value){
						switch(value){
							case 'playlist-all':
								this.extraDiv.mojo.toggle("addToPlaylist", koto.nowPlaying.currentInfo.songs.clone());
								break;
							case 'playlist-song':
								this.extraDiv.mojo.toggle("addToPlaylist", [koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]]);			
								break;
						}
					}.bind(this),
					//placeNear: event.originalEvent.target,
					items: [
						{label: $L("Add This Song to Playlist"), command: "playlist-song"},
						{label: $L("Add All to Playlist"), command: "playlist-all"}
					]
				});
				break;
			case 'favorite-song':
				koto.content.favorites.add(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]);			
				break;
			
		}
		
	}
}

PlayAssistant.prototype.deactivate = function(event) {
	this.deactivateCommon();
};
PlayAssistant.prototype.cleanup = function(event) {

	this.controller.stopListening(this.list, Mojo.Event.listTap, this.listTapHandler);
	this.controller.stopListening(this.list, Mojo.Event.listReorder, this.listReorderHandler);
	this.controller.stopListening(this.list, Mojo.Event.listDelete, this.listDeleteHandler);

	this.controller.stopListening(this.nowPlayingItem, Mojo.Event.tap, this.handleAlbumArtTap);
	this.controller.stopListening(this.nowPlayingItem, Mojo.Event.flick, this.handleAlbumArtFlick);
	
	this.controller.stopListening(this.controller.get("toggle-bar"), Mojo.Event.tap, this.toggleBarTapHandler);

};