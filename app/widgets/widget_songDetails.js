Mojo.Widget.SongDetails = Class.create({
	setup: function setup(){
		this._build();
		this.controller.exposeMethods(["hide", "show", "incrementRating", "decrementRating", "refresh"]);
	},
	_build : function _build() {	
		Element.insert(this.controller.element, "<div id='song-details-track-info'></div><div id='song-details-track-stats'></div><div style='height: 100px'></div>");
		this.songDetailsTrackInfoDiv = this.controller.get("song-details-track-info");
		this.songDetailsTrackStatsDiv = this.controller.get("song-details-track-stats");
		this.controller.listen(this.songDetailsTrackStatsDiv, Mojo.Event.tap, this.ratingTapHandler = this.songDetailsTap.bind(this));
		this.controller.listen(this.songDetailsTrackInfoDiv, Mojo.Event.tap, this.popupHandler = this.popupTap.bind(this));
		
		this.controller.listen(this.controller.element, Mojo.Event.flick, this.flickHandler = this.flick.bind(this));
		//this.controller.instantiateChildWidgets(this.controller.element); 
	},
	handleModelChanged : function() {
	
	},
	cleanup: function() {
		this.controller.stopListening(this.songDetailsTrackStatsDiv, Mojo.Event.tap, this.ratingTapHandler);
	},	
	renderContent: function(){
		koto.justType.getSongData(this.array[this.index]._id, function(result){
			//console.log("results " + Object.toJSON(result));
			renderedContent = Mojo.View.render({
				object: result,
				formatters: {
					"rating": function(value, model){
						var stars = "";
						for(var i = 1; i <= model.rating; i++){
							stars += ("<div id='" + i + "' class='star'></div>");
						}
						for(var k = model.rating+1; k <= 5; k++){
							stars +=("<div id='" + k + "' class='star outline'></div>");
						}
						return stars;
					},
					"playCount": function(value, model){
						if (model.playCount && model.playCount > 0){
							return $L("Played ") + ((model.playCount === 1)?model.playCount + $L(" Time"):model.playCount + $L(" Times"));
						} else {
							return $L("Played 0 Times");
						}
					},
					"lastPlayed": function(value, model){
						if (model.lastPlayed && model.lastPlayed !== "n/a"){
							var d = new Date();
							d.setTime(model.lastPlayed);
							return $L("Last Played ") + koto.utilities.formatDate(d);
						}
					},
				},
				template: "widgets/widget_songDetails-data"
			});
			this.songDetailsTrackStatsDiv.innerHTML = renderedContent;
		}.bind(this));
		
		db8.getObjsById([this.array[this.index]._id], function(results){
			results[0].albumArt = koto.albumArt.get(results[0], true);//small

			renderedContent = Mojo.View.render({
				object: results[0],
				formatters: {
					"tracks": function(value, model){
						var trackNum = parseInt(this.index, 10) + 1;
						return $L("Track") + " " + trackNum + " " + $L("of") + " " + this.array.length;
							//return "Track " + model.track.position + " of " + model.track.total;
						
					}.bind(this),
				},
				template: "widgets/widget_songDetails-songInfo"
			});
			this.songDetailsTrackInfoDiv.innerHTML = renderedContent;
		}.bind(this));
	
	},
	songDetailsTap: function(event){
		if (event.target.id === "clear_rating"){
			koto.justType.setRating(this.array[this.index]._id, 0, function(){
				this.renderContent();
			}.bind(this));
		} else {
			var rating = parseInt(event.target.id, 10);
			if (!isNaN(rating)){
				koto.justType.setRating(this.array[this.index]._id, rating, function(){
					this.renderContent();
				}.bind(this));
			}
		}
	},
	popupTap: function(event){
		if (event.target.id === "popup"){
			db8.getObjsById([this.array[this.index]._id], function(results){
				event.item = results[0];
				event.index = this.index;
				event.originalEvent = {target: event.target};
				event.fromSongDetails = true;
				this.controller.scene.assistant.listTap(event);
			}.bind(this));	
		}
	},
	flick: function(event){
		if (event.velocity.x > 600 && (Math.abs(event.velocity.x) > Math.abs(event.velocity.y))){
			if (this.array[this.index-1]){
				this.index -= 1;
			} else {
				this.index = this.array.length-1;
			}
			this.renderContent();
		}
		else if (event.velocity.x < -600 && (Math.abs(event.velocity.x) > Math.abs(event.velocity.y))){
			if (this.array[this.index+1]){
				this.index += 1;
			} else {
				this.index = 0;
			}
			this.renderContent();
		} else if (event.velocity.y < -1000 && (Math.abs(event.velocity.y) > Math.abs(event.velocity.x))){
			this.controller.scene.assistant.extraDiv.mojo.hide();

		}
	
	},
	//Mojo Methods
	show: function(array, index){
		this.array = array;
		this.index = index;
		
		this.songDetailsTrackStatsDiv.innerHTML = "";
		this.songDetailsTrackInfoDiv.innerHTML = "";
		this.renderContent();
		this.controller.element.show();						
	},
	hide: function(){
		//hide div
		this.controller.element.hide();
		var currentScene = this.controller.scene.assistant;
		if (currentScene.controller.sceneName === "view" && currentScene.objType === "playlist" && currentScene.titleObj && currentScene.titleObj.type !== "custom"){
			currentScene.refreshList();
		}
	},
	incrementRating: function(){
		koto.justType.getSongData(this.array[this.index]._id, function(result){
			var rating = result.rating || 0;
			if (rating < 5){
				rating += 1;
				koto.justType.setRating(this.array[this.index]._id, rating, function(){
					this.renderContent();
				}.bind(this));
			}
		}.bind(this));
	
	},
	decrementRating: function(){
		koto.justType.getSongData(this.array[this.index]._id, function(result){
			var rating = result.rating || 0;
			if (rating > 0){
				rating -= 1;
				koto.justType.setRating(this.array[this.index]._id, rating, function(){
					this.renderContent();
				}.bind(this));
			}
		}.bind(this));
	},
	refresh: function(arg){
		if (arg && arg.playedNext){
			this.index = koto.nowPlaying.currentInfo.index + 1;
		} else if (arg && arg.playedLast){
			this.index = koto.nowPlaying.currentInfo.songs.length-1;
		}
		this.renderContent();
	}
});
