function ErrorAssistant(error, isPalmBug) {
	this.error = error;
	this.isPalmBug = isPalmBug || false;
	scene_helpers.addCommonSceneMethods(this, "error");
}

ErrorAssistant.prototype.setup = function() {
	this.controller.get("error").innerHTML = this.error;
	if (this.isPalmBug){
		this.controller.get("legacyError").hide();
		this.controller.get("mediaIndexerError").show();
	}
	this.controller.setupWidget("metrixToggleWidget", {}, this.metrixToggle = {value: true});		
	this.initAppMenu();

};

ErrorAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

ErrorAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

ErrorAssistant.prototype.cleanup = function(event) {
	if (this.metrixToggle.value === true){
		koto.metrix.postDeviceData();
	}
	
};