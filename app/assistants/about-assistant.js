function AboutAssistant() {
	scene_helpers.addCommonSceneMethods(this, "about");
}
AboutAssistant.prototype.setup = function() {
	this.setupCommon();
	if (koto.appId !== "com.tibfib.app.koto"){
		this.controller.get("launchCatalog").innerHTML = "Buy Koto";
		if (koto.appId === "com.tibfib.app.koto.lite"){
			this.controller.get("lite").show();
		} else if (koto.appId === "com.tibfib.app.koto.hb"){
			this.controller.get("preware").show();
		}
	}
};

AboutAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

AboutAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

AboutAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
