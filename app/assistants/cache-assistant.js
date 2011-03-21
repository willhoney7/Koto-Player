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
	m.debugErr("caching songs");
	m.cacheArray(m.songs, function(){
		m.debugErr("caching artists");
		m.cacheArray(m.artists, function(){
			m.debugErr("caching albums");
			m.cacheArray(m.albums, function(){
				m.debugErr("caching playlists");
				m.cacheArray(m.playlists, function(){
					m.debugErr("caching favorites");
					m.cacheArray(m.favorites, function(){
						//this.commandMenuModel.visible = true;
						//this.controller.modelChanged(this.commandMenuModel)
							var d = new Date();
						if(m.songs.length > 0){
							var oldStuff = Math.round(d.getTime()/60000) -2;//del stuff older than 2 minutes, since it no longer exists.
							DB.del({"from":g.AppId + ".data:1", "where":[{"prop":"lastUpdate","op":"<","val":oldStuff}]});
						}
						//close stage
						
						m.debugErr("DONE: " + Math.round((parseInt(d.getTime()) - parseInt(milliseconds))/1000) + " seconds total to cache");
						
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
