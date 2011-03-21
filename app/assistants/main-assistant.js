function MainAssistant(fromStartUp) {
	if(fromStartUp){
		m.initialize({dontLoadSongs: true});
		this.fromStartUp = fromStartUp;
	}//todo deal with 1.4.5 and earlier
	else {
		if(m.launchPlayer){
			this.loadedOnActivate = true;
		}
		try {
			m.initialize();
		}catch(e){
			Mojo.Controller.getAppController().getStageController("cardStage").swapScene({name: "error", transition: Mojo.Transition.none}, e);
		}
	}	
			
	scene_helpers.addControlSceneMethods(this);
}
var loaded = false;
MainAssistant.prototype.setup = function() {
	this.initViewMenu(Mojo.Controller.appInfo.title);
	this.initCmdMenu();
	this.setupCommon();
	
	this.mainListAttrs = {
		itemTemplate:'main/list-item',
		listTemplate:'list/empty-list', 
		formatters: {
			"info": function(value, model){
				if(model.label && loaded && model.command !== "upgrade"){
					var label = (m[model.label.toLowerCase()].length == 1)?model.label.slice(0, model.label.length-1):model.label;
					return m[model.label.toLowerCase()].length + " " + label;
				}
			}
		},
		swipeToDelete:false, reorderable:true
	}
	this.listItems = JSON.parse(JSON.stringify(m.prefs.startItems));
	this.listModel = {            
        items: this.listItems
    };    
	if(g.AppId !== "com.tibfib.app.koto" && g.AppId !== "com.tibfib.app.koto.alt"){
		this.listModel.items.unshift({label: "<center>Upgrade to Full Version!</center>", command: "upgrade"});
	}
    this.controller.setupWidget('results_list', this.mainListAttrs, this.listModel);
	this.list = this.controller.get('results_list');
	this.handleListTap = this.listTap.bind(this);
	this.handleListReorder = this.listReorder.bind(this);
	this.controller.listen(this.list, Mojo.Event.listTap, this.handleListTap);
	this.controller.listen(this.list, Mojo.Event.listReorder, this.handleListReorder);
	
	this.crappedOutTimeout = setTimeout(function(){
		if(m.songs.length === 0){
			this.controller.stageController.swapScene("error", "Error: No permission from Media Indexer", true);
		}
	}.bind(this), 30000);
	
	if(this.fromStartUp){
		this.loaded();
	}
	
};
MainAssistant.prototype.activate = function(event) {
	clearTimeout(this.crappedOutTimeout);
	if(this.loadedOnActivate){
		this.loaded();
	}
	this.activateCommon();
	this.list.mojo.invalidateItems(0);
};

MainAssistant.prototype.moreTap = function(event){
	//todo TURN into shuffle icon!
	this.controller.popupSubmenu({
		onChoose: function(value){
			if(value){
				m.shufflePlay(m.songs);
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
	loaded = true;
	this.list.mojo.invalidateItems(0);
};

MainAssistant.prototype.listTap = function(event) {
	if(event.item.command === "upgrade"){
		m.buyKoto();
	} else {
		this.controller.stageController.pushScene("list", event.item.command);
	}
}
MainAssistant.prototype.listReorder = function(event) {
	this.listItems.splice(event.fromIndex, 1);
	this.listItems.splice(event.toIndex, 0, event.item);
	
	m.prefs.startItems = JSON.parse(JSON.stringify(this.listItems));
	for(var i = 0; i < m.prefs.startItems.length; i++){
		if(m.prefs.startItems[i].command === "upgrade"){
			m.prefs.startItems.splice(i, 1);
			break;
		}
	}
	m.storePrefs();
}

MainAssistant.prototype.deactivate = function(event) {
	this.deactivateCommon();
};
MainAssistant.prototype.cleanup = function(event) {
	this.cleanupCommon()
	
	this.controller.stopListening(this.list, Mojo.Event.listTap, this.handleListTap);
	this.controller.stopListening(this.list, Mojo.Event.listReorder, this.handleListReorder);
};
