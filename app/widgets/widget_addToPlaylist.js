Mojo.Widget.AddToPlaylist = Class.create({
	setup: function setup(){
		this._build();
		this.controller.exposeMethods(["hide", "show"]);
	},
	_build : function _build() {	
		var content = Mojo.View.render({object: {}, template: "widgets/widget_addToPlaylist"});
		this.controller.element.innerHTML = content;
		
		//Textfield
		this.controller.scene.setupWidget("playlist-textfield", {hintText: "New Playlist", changeOnKeyPress: true}, this.playlistTextFieldModel = {value: ""});
		this.playlistTextFieldDiv = this.controller.get("playlist-textfield");
		
		//List of Playlists
		this.controller.scene.setupWidget("playlist-list", { 
			itemTemplate: "play/playlist-item",//no popup
			listTemplate: "play/playlist-list",//group
			addItemLabel: " ",
			formatters: {
				"info": function(value, model){
					if(model.songs)
						return model.songs.length + " Track(s)";
				}
			}
		}, {items: m.customPlaylists});
		
		this.playlistList = this.controller.get("playlist-list");
		this.controller.instantiateChildWidgets(this.controller.element); 
		
		this.controller.listen("playlist-list", Mojo.Event.listTap, this.playlistListTapHandler = this.listTap.bind(this));
		
		this.playlistTextFieldHandler = function(event){
			if(Mojo.Char.isEnterKey(event.keyCode)) {
				if(event.srcElement.parentElement.id=="playlist-textfield") {
					var playlist_name = this.playlistTextFieldDiv.mojo.getValue();
					if(playlist_name !== ""){
						//var songs = (m.nP.unshuffledSongs.length > 0 && this.playlistShuffleToggleModel.value === false)?m.nP.unshuffledSongs.clone():m.nP.songs.clone();
						var songs_ = [];
						m.savePlaylist(playlist_name, {
							name: playlist_name,
							songs: this.playlistSongs,
							type: "custom",
							}, function(playlist){
								
								this.controller.scene.assistant.extraDiv.mojo.hide();					
								this.playlistTextFieldModel.value = "";
								this.controller.modelChanged(this.playlistTextFieldModel);
								
								m.bannerAlert("Playlist Saved");
							}.bind(this)
						);
					}
				}
			}
		}.bind(this); 
	},
	handleModelChanged : function() {
		//this.updateSong();
	},
	cleanup: function() {
	},	
	
	listTap: function(event){	
		var songs_ = [];
		for(var i = 0; i < event.item.songs.length; i++){
			songs_.push(event.item.songs[i]);			
		}
		for(var i = 0; i < this.playlistSongs.length; i++){
			songs_.push(this.playlistSongs[i]["_id"]);
		}
		m.savePlaylist(event.item.name, {
			name: event.item.name,
			songs: songs_,
			type: "custom",
			}, function(){
				this.playlistTextFieldModel.value = "";
				this.controller.modelChanged(this.playlistTextFieldModel);
				
				var currentScene = this.controller.scene.assistant;
				if(currentScene.titleObj && m.getObjType(currentScene.titleObj) === "playlist" && event.item.name === currentScene.titleObj.name){
					m.getPlaylist(event.item.name, function(playlist){
						currentScene.titleObj = playlist;
						currentScene.data = playlist.songs;
						currentScene.controller.modelChanged(currentScene.listModel);
					}.bind(currentScene));
				}
				this.controller.scene.assistant.extraDiv.mojo.hide();					
				m.bannerAlert("Playlist Saved");
			}.bind(this)
		);
		
	},
	
	//Mojo Methods
	show: function(songs){
		if(!this.playListSongs)
			this.playlistSongs = songs;
		else {
			this.playlistSongs.clear();
			Object.extend(this.playlistSongs, songs);
		}
		this.playlistList.mojo.noticeUpdatedItems(0, m.customPlaylists);
		this.controller.element.show();	
	
		this.playlistTextFieldDiv.mojo.focus();//fix bug..
		this.playlistTextFieldDiv.mojo.blur();
		
		this.controller.scene.assistant.controller.document.addEventListener("keyup", this.playlistTextFieldHandler, true)
	},
	hide: function(){
		//hide div
		this.controller.element.hide();
		this.playlistTextFieldModel.value = "";
		this.controller.modelChanged(this.playlistTextFieldModel);
		try {
		this.playlistTextFieldDiv.mojo.blur();
		}catch(e){}
		
		this.controller.scene.assistant.controller.document.removeEventListener("keyup", this.playlistTextFieldHandler, true)

	},
	
});
