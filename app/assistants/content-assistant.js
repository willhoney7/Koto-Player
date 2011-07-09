function ContentAssistant(title) {
	this.title = title;
	scene_helpers.addCommonSceneMethods(this);
}

ContentAssistant.prototype.setup = function(){
	this.initViewMenu(this.title);
	this.setupCommon();
	if (this.title === $L("Basics Guide")){
		this.controller.get("guide").show();
	}
	else if (this.title === $L("Tips and Tricks")){
		this.controller.get("tips").show();
	}else if (this.title === $L("FAQs")){
		this.controller.get("faqs").show();
	}
	
	this.launchJustType = function(){
		koto.serviceRequest.request("palm://com.palm.applicationManager", 
			{
				method: 'open',
				parameters: {
					id:"com.palm.app.searchpreferences",
					params: {
					//	launch:</b> "addMoreSearch" does web search engines.
					}
				}
			}
		); 
	}.bind(this)
	
	this.controller.listen("justtype", Mojo.Event.tap, this.launchJustType);
	this.controller.listen("justtype_", Mojo.Event.tap, this.launchJustType);

	
	this.controller.listen("cache", Mojo.Event.tap, function(){
		koto.justType.setupIndexingDashboard();
	}.bind(this));
};

ContentAssistant.prototype.activate = function(event) {};

ContentAssistant.prototype.deactivate = function(event) {};

ContentAssistant.prototype.cleanup = function(event) {};
