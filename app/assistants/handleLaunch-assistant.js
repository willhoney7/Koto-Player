function HandleLaunchAssistant(launchParams) {
	this.launchParams = launchParams;
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

HandleLaunchAssistant.prototype.setup = function() {
	if (this.launchParams.callback  && this.launchParams.callback.id && this.launchParams.callback.action){
		if (koto.nowPlaying.currentInfo.songs.length > 0){
			var params = {
				returnValue: true,
				nowPlaying: koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]
			}
		} else {
			var params = {
				returnValue: false
			}
		}
		params.action = this.launchParams.callback.action;
		koto.serviceRequest.request("palm://com.palm.applicationManager", {
			method: 'launch',
			parameters:  {
				id: this.launchParams.callback.id,
				params: params
			}
		});
	}
	this.controller.window.close();
};

HandleLaunchAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

HandleLaunchAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

HandleLaunchAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
