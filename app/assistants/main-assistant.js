function MainAssistant(loadedOnActivate) {
	this.loadedOnActivate = loadedOnActivate || false;	
	if(koto.preferences.obj.saveAndResume === true && this.loadedOnActivate){
		koto.nowPlaying.load();
	}
	
	scene_helpers.addControlSceneMethods(this);
}
MainAssistant.prototype.setup = function() {
	this.initViewMenu(Mojo.Controller.appInfo.title);
	this.initCmdMenu();
	this.setupCommon();
	this.loadedBool = false;
	this.mainListAttrs = {
		itemTemplate:'main/list-item',
		listTemplate:'list/empty-list', 
		formatters: {
			"info": function(value, model){
				if (model.command && this.loadedBool && model.command !== "upgrade"){
					var length = (koto.content[model.command]) ? koto.content[model.command].array.length : 0;
					var label = (length === 1)?model.command.slice(0, model.command.length-1):model.command;
					return length + " " + $L(_.capitalize(label));
				}
			}.bind(this)
		},
		swipeToDelete:false, reorderable:true
	}
	this.listItems = JSON.parse(JSON.stringify(koto.preferences.obj.startItems));
	this.listModel = {            
        items: this.listItems
    };    
	if (koto.appId !== "com.tibfib.app.koto" && koto.appId !== "com.tibfib.app.koto.alt"){
		this.listModel.items.unshift({label: $L("<center>Upgrade to Full Version!</center>"), command: "upgrade"});
	}
    this.controller.setupWidget('results_list', this.mainListAttrs, this.listModel);
	this.list = this.controller.get('results_list');
	this.handleListTap = this.listTap.bind(this);
	this.handleListReorder = this.listReorder.bind(this);
	this.controller.listen(this.list, Mojo.Event.listTap, this.handleListTap);
	this.controller.listen(this.list, Mojo.Event.listReorder, this.handleListReorder);
	
	this.crappedOutTimeout = setTimeout(function(){
		if (koto.content.songs.array.length === 0){
			this.controller.stageController.swapScene("error", $L({value: "Error: No permission from Media Indexer", key: "error_indexer"}), true);
		}
	}.bind(this), 30000);
	
	if (this.fromStartUp){
		this.loaded();
	}
	
};
MainAssistant.prototype.activate = function(event) {
	clearTimeout(this.crappedOutTimeout);
	if (this.loadedOnActivate){
		this.loaded();
	}
	this.activateCommon();
	this.list.mojo.invalidateItems(0);
};

MainAssistant.prototype.moreTap = function(event){
	//todo TURN into shuffle icon!
	this.controller.popupSubmenu({
		onChoose: function(value){
			if (value){
				koto.nowPlaying.shufflePlayArray(koto.content.songs.array);
			}
		}.bind(this),
		placeNear: event.target,
		items: [
			{label: $L('Shuffle All'), command: 'shuffle-all'}
			
		]
	});
};

MainAssistant.prototype.loaded = function(event){
	var scrim = this.controller.get("scrim");
	scrim.removeClassName("shown");
	window.setTimeout(function(){
		scrim.hide();
	}.bind(this), 300);
	this.loadedBool = true;
	this.list.mojo.invalidateItems(0);
};

MainAssistant.prototype.listTap = function(event) {
	if (event.item.command === "upgrade"){
		koto.utilities.buyKoto();
	} else {
		this.controller.stageController.pushScene("list", event.item.command);
	}
}
MainAssistant.prototype.listReorder = function(event) {
	this.listItems.splice(event.fromIndex, 1);
	this.listItems.splice(event.toIndex, 0, event.item);
	
	koto.preferences.obj.startItems = JSON.parse(JSON.stringify(this.listItems));
	for(var i = 0; i < koto.preferences.obj.startItems.length; i++){
		if (koto.preferences.obj.startItems[i].command === "upgrade"){
			koto.preferences.obj.startItems.splice(i, 1);
			break;
		}
	}
	koto.preferences.store();
}

MainAssistant.prototype.deactivate = function(event) {
	this.deactivateCommon();
};
MainAssistant.prototype.cleanup = function(event) {
	this.cleanupCommon()
	
	this.controller.stopListening(this.list, Mojo.Event.listTap, this.handleListTap);
	this.controller.stopListening(this.list, Mojo.Event.listReorder, this.handleListReorder);
};
