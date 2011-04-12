Mojo.Widget.Extra = Class.create({
	setup: function setup(){
		this._build();
		this.controller.exposeMethods(['hide', 'show', "toggle", "visible", "run"]);
	},
	_build : function _build() {
		//Make Title
		var content = Mojo.View.render({object: {title: ""}, template: "widgets/widget_title"});
		Element.insert(this.controller.element, content);
		this.titleDiv = this.controller.get("extraTitle");
		
		//Setup Scroller
		var content = Mojo.View.render({object: {id: "extraScroller", widget: "Scroller"}, template: "widgets/widget_declaration"});
		Element.insert(this.controller.element, content);
		
		this.controller.scene.setupWidget("extraScroller", {mode: "vertical"}, {});
		this.scroller = this.controller.get("extraScroller");

		this.scroller.setStyle({height: this.controller.scene.window.innerHeight + "px", width: this.controller.scene.window.innerWidth + "px"});
		
		//Element.insert(this.scroller, "<div style='height: 50px'></div>");

		
		if (!this.controller.model.playlistDisabled){
			//setup playlist
			var content = Mojo.View.render({object: {id: "addToPlaylist", widget: "AddToPlaylist", class_:"extra-content", style: "display: none"}, template: "widgets/widget_declaration"});
			Element.insert(this.scroller, content);
			this.addToPlaylistDiv = this.controller.get("addToPlaylist");
			
			this.controller.scene.setupWidget("addToPlaylist", {}, {});
		}
		
		if (!this.controller.model.songDetailsDisabled){
			//setup songDetails
			var content = Mojo.View.render({object: {id: "songDetails", widget: "SongDetails", class_:"extra-content", style: "display: none"}, template: "widgets/widget_declaration"});
			Element.insert(this.scroller, content);
			this.songDetailsDiv = this.controller.get("songDetails");
			
			this.controller.scene.setupWidget("songDetails", {}, {});
		}
		
		if (!this.controller.model.albumArtDownloaderDisabled){
			//setup songDetails
			var content = Mojo.View.render({object: {id: "albumArtDownloader", widget: "AlbumArtDownloader", class_:"extra-content", style: "display: none"}, template: "widgets/widget_declaration"});
			Element.insert(this.scroller, content);
			this.albumArtDownloaderDiv = this.controller.get("albumArtDownloader");
			
			this.controller.scene.setupWidget("albumArtDownloader", {}, {});
		}
		
		/*if (!this.controller.model.sleepTimerDisabled){
			//setup sleepTimer
			var content = Mojo.View.render({object: {id: "sleepTimer", widget: "SleepTimer"}, template: "widgets/widget_declaration"});
			Element.insert(this.scroller, content);
			this.sleepTimerDiv = this.controller.get("sleepTimer");

			this.controller.scene.setupWidget("sleepTimer", {}, {});
		}*/
		/*if (!this.controller.model.searchListDisabled){
			//setup searchList
			var content = Mojo.View.render({object: {id: "searchList", widget: "SearchList"}, template: "widgets/widget_declaration"});
			Element.insert(this.scroller, content);
			this.searchListDiv = this.controller.get("searchList");
			
			this.controller.scene.setupWidget("searchList", {}, {});
		
		}*/
		if (this.controller.model.scene === "play"){
			if (!this.controller.model.lyricsDisabled){
				//setup lyrics
				var content = Mojo.View.render({object: {id: "lyrics", widget: "Lyrics", class_:"extra-content lyrics", style: "display: none"}, template: "widgets/widget_declaration"});
				Element.insert(this.scroller, content);
				this.lyricsDiv = this.controller.get("lyrics");
				this.controller.scene.setupWidget("lyrics", {}, {});
			}
		}
		this.controller.instantiateChildWidgets(this.controller.element); 
		Element.insert(this.scroller, "<div style='height: 100px'></div>");
	},
	handleModelChanged : function() {
		//this.updateSong();
	},
	cleanup: function() {
	
	},
	//Mojo Methods
	hide: function(dontHideScrim, dontHideSearchListDiv){
		if (!dontHideScrim){
			this.controller.element.removeClassName("shown");
			this.titleDiv.removeClassName("shown");
			this.titleDiv.hide();
			window.setTimeout(function(){
				this.controller.element.hide();
			}.bind(this), 300);
		}
		
		
		//hide playlist stuff
		this.addToPlaylistDiv.mojo.hide();

		//hide sleep timer
		//this.sleepTimerDiv.mojo.hide();
		
		/*hide search list
		if (!dontHideSearchListDiv){
			this.searchListDiv.mojo.hide();
		}*/
		if (this.albumArtDownloaderDiv){
			this.albumArtDownloaderDiv.mojo.hide();
		}
		
		//hide lyrics, if it exists.
		if (this.lyricsDiv){
			this.lyricsDiv.mojo.hide();
		}
		//hide song details, if it exists
		if (this.songDetailsDiv){
			this.songDetailsDiv.mojo.hide();
		}
		
	},
	toggle: function(widgetId, arg, arg2){
		if (!this[widgetId+"Div"].visible()){
			this.show(widgetId, arg, arg2);
		}
		else {
			this.hide();
		}
	},
	visible: function(widgetId){
		return this[widgetId+"Div"].visible();
	},
	show: function(widgetId, arg, arg2){
		this.hide(true);//hide elements, but not scrim
		
		this.controller.element.show();
		window.setTimeout(function(){
			this.controller.element.addClassName('shown');
			this.titleDiv.addClassName('shown');
			window.setTimeout(function(){
				this[widgetId+"Div"].mojo.show(arg, arg2);
				//assistant.playlistTextFieldDiv.mojo.focus();
				//assistant.playlistTextFieldDiv.mojo.blur();
			}.bind(this), 200);
		}.bind(this), 100);
			
		var title = widgetId === "addToPlaylist" ? $("Add to Playlist") : widgetId === "sleepTimer" ? $("Sleep Timer") : widgetId === "searchList" ? $("Music Search") : widgetId === "lyrics" ? $("Lyrics") : widgetId === "songDetails" ? $("Song Details") : "Unknown";
		this.updateTitle(title);
	},
	run: function(widgetId, functionName, arg){
		this[widgetId+"Div"].mojo[functionName](arg);
	},
	updateTitle: function(title){
		this.titleDiv.innerHTML = title;
	}
});
