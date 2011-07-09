function HelpAssistant() {
 	scene_helpers.addCommonSceneMethods(this, "help");
}

HelpAssistant.prototype.setup = function() {
	this.setupCommon();
	
	this.listAttrs = {
		itemTemplate:'main/list-item',
		listTemplate:'help/list', 
		hasNoWidgets: true,
		swipeToDelete: false, 
		reorderable: false
	};
	this.listModel = {         
		listTitle: $L("Learn"),
        items: [
			{"title": $L("Basics Guide")},
			{"title": $L("Tips and Tricks")},
			{"title": $L("FAQs")}
		]
    };    
	this.controller.setupWidget("results_list", this.listAttrs, this.listModel);
	this.listTapHandler = this.listTap.bind(this);
	this.controller.listen("results_list", Mojo.Event.listTap, this.listTapHandler);
	
	this.controller.listen("pushMediaIndexerError", Mojo.Event.tap, function(){
		this.controller.stageController.pushScene("error", $L({value:"Error: No permission from Media Indexer", key:"error_indexer"}), true);
	}.bind(this));
};
HelpAssistant.prototype.listTap = function(event) {
	this.controller.stageController.pushScene("content", event.item.title);
}

HelpAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

HelpAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

HelpAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
