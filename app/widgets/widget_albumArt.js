Mojo.Widget.AlbumArtDownloader = Class.create({
	setup: function setup(){
		this._build();
		this.controller.exposeMethods(["hide", "show"]);
	},
	_build : function _build() {	
		var content = Mojo.View.render({object: {id: "widget_album_art_scroller", widget: "Scroller", class_: "album-art-scroller download", style: "width: 100%; height: 100%;"}, template: "widgets/widget_declaration"});
		this.controller.scene.setupWidget("widget_album_art_scroller",
			this.scrollerAttributes = {},
			this.scrollerModel = {
				mode: "horizontal"//-snap",
				//snapIndex: 0
			}
		); 
		Element.insert(this.controller.element, "<table cellspacing='30'><tr>"+content+"<tr><tr><div class='palm-info-text' style='text-align: center; color: #ccc !important'>Powered by Google</div></table>");
		this.scrollerDiv = this.controller.get("widget_album_art_scroller");
		Element.insert(this.scrollerDiv, '<div id="widget_album_art_scroller_content" class="album-art-scroller-container"></div>');
		this.scrollerContentDiv = this.controller.get("widget_album_art_scroller_content");
		//Element.insert(this.controller.element, "<div style='height: px'></div>");
		this.controller.instantiateChildWidgets(this.controller.element); 
		
		this.controller.listen(this.scrollerContentDiv, Mojo.Event.tap, this.handleAlbumArtTap = this.albumArtTap.bind(this));
	},
	handleModelChanged : function() {
		//this.updateSong();
	},
	cleanup: function() {
	
	},	
	getItemWidth: function(event){
		if (Mojo.Environment.DeviceInfo.screenWidth === 320) {
			return 210;
		}
		if (Mojo.Environment.DeviceInfo.screenWidth === 480) {
			return 310;
		}
	},
	getAlbumArt: function(){
		checkConnectivity(function(connected){
			if (connected){
				google.search(this.album + " " + this.artist, function(array){
					this.albumArtArray = array;
					this.render();
				
				}.bind(this));
			} else {
				koto.utilities.bannerError($L("Not Connected to Internet"));
				this.hide();
			}
		}.bind(this));
	},
	render: function(){		
		var content = Mojo.View.render({collection: this.albumArtArray, template: 'play/scroller-item', formatters: {
			"dimension": function(value, model){
				if (Mojo.Environment.DeviceInfo.screenHeight === 480){
					return "200px";
				}
				if (Mojo.Environment.DeviceInfo.screenHeight === 400){
					return "125px";
				}
				if (Mojo.Environment.DeviceInfo.screenHeight === 800){
					return "300px";
				}
			},
			"display": function(value, model){
				return "none";
			},
			"index": function(value, model, index){
				return index;
			}
		}});
		this.scrollerContentDiv.innerHTML = content;
		
		elements = this.controller.scene.sceneElement.select('.item');
		this.scrollerModel.snapElements = {x: elements};
		this.controller.modelChanged(this.scrollerModel);
	},
	download: function(url){
		checkConnectivity(function(connected){
			if (connected){
				koto.utilities.bannerAlert($L("Downloading..."));
				var fileName = this.artist + " - " + this.album;
					fileName = fileName.replace(/[^A-z0-9_\s\-]/ig, "");//get rid of special chars
					fileName += "_" + Math.round(Math.random()*10000) + url.match(/(.*)\/([^\/\\]+)(\.\w+)$/)[3];
					
				koto.serviceRequest.request('palm://com.palm.downloadmanager/', {
					method: 'download', 
					parameters: 
					{
						target: url,
						targetDir : "/media/internal/.app-storage/"+koto.appId+"/",
						targetFilename : fileName
					},
					onSuccess : function (resp){
						if (resp.returnValue === true){
							koto.utilities.bannerAlert($L("Setting as Album Art"));
							koto.albumArt.set(this.album, this.artist, resp.target, function(response){
								//koto.utilities.bannerAlert("Done!");
								this.controller.scene.assistant.extraDiv.mojo.hide();
								var done = function done(){
									koto.utilities.bannerAlert($L("Done!"));
									this.refreshList();//done with this scope of the scene.
								}.bind(this.controller.scene.assistant);
								setTimeout(done, 3500);
							
							}.bind(this));
						};
					}.bind(this),
					onFailure : function (e){Mojo.Log.error(Object.toJSON(e))}
				});
			} else {
				koto.utilities.bannerError($L("Not Connected to Internet"));
			}
		}.bind(this))
	
	},
	albumArtTap: function(event){
		var index = parseInt(event.target.parentElement.id, 10);
		var image = this.albumArtArray[index];
		if (!image){
			return;
		}
		this.controller.scene.assistant.controller.popupSubmenu({
			onChoose: function(value){
				switch(value){
					case 'set':
						this.download(image.url);
						break;
									
				}
			}.bind(this),
			placeNear: event.target,
				items: [
					{label: $L("Set as Album Artwork"), command: "set"},
					
				]
		});
	},
	//Mojo Methods
	show: function(album, artist){
		this.album = album;
		this.artist = artist;
		this.getAlbumArt();
		this.controller.element.show();						
	},
	hide: function(){
		//hide div
		this.controller.element.hide();

		this.searchString = "";
		this.albumArtArray = "";
		this.scrollerContentDiv.innerHTML = "";
	}
	
});
