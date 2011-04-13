function CacheAssistant() {}

CacheAssistant.prototype.setup = function() {
	this.controller.setupWidget("spinner",
        this.attributes = {
            spinnerSize: "small"
        },
        this.model = {
            spinning: true 
        }
    ); 
	this.cache();
};

CacheAssistant.prototype.cache = function() {
	var d = new Date();
	var milliseconds = d.getTime();
	console.log("caching songs");
	koto.justType.cacheArray(koto.content.songs.array, function(){
		console.log("caching artists");
		koto.justType.cacheArray(koto.content.artists.array, function(){
			console.log("caching albums");
			koto.justType.cacheArray(koto.content.albums.array, function(){
				console.log("caching playlists");
				koto.justType.cacheArray(koto.content.playlists.array, function(){
					console.log("caching favorites");
					koto.justType.cacheArray(koto.content.favorites.array, function(){
						//this.commandMenuModel.visible = true;
						//this.controller.modelChanged(this.commandMenuModel)
							var d = new Date();
						if (koto.content.songs.array.length > 0){
							var oldStuff = Math.round(d.getTime()/60000) -2;//del stuff older than 2 minutes, since it no longer exists.
							db8.DB.del({"from":koto.appId + ".data:1", "where":[{"prop":"lastUpdate","op":"<","val":oldStuff}]});
						}
						//close stage
						
						console.log("DONE: " + Math.round((parseInt(d.getTime(), 10) - parseInt(milliseconds, 10))/1000) + " seconds total to cache");
						
						Mojo.Controller.getAppController().closeStage("cacheStage");
						
						
					}.bind(this), true);
				}.bind(this));
			}.bind(this));
		}.bind(this));
	}.bind(this));
	
}
CacheAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

CacheAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

CacheAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
