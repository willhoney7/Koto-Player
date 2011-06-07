/**
 * helpers for scene assistants in Koto; (idea and basics) taken from the excellent Spaz app
 */
var scene_helpers = {};
/**
 * assistant adds a number of common scene methods to the passed scene assistant
 * @param {object} assistant a scene assistant
 */
scene_helpers.addControlSceneMethods = function(assistant, arg) {
	assistant.setupCommon = function(){
		//setup standard app menu
		assistant.controller.setDefaultTransition(Mojo.Transition.zoomFade);
		if ((arg && !arg.nowPlaying) || !arg){
			assistant.initAppMenu();
			assistant.handleMoreTap = assistant.moreTap.bind(assistant);
			assistant.controller.listen("more", Mojo.Event.tap, assistant.handleMoreTap);
		}
		
		//The Now Playing Panel
		assistant.panel = assistant.controller.get("panel");
		assistant.controller.setupWidget("panel", {}, {hidden:((arg && arg.nowPlaying)?false:true)});
		
		//Extra Widget
		var content = Mojo.View.render({object: {id: "extra", widget: "Extra", class_: "extra", style: "display:none"}, template: "widgets/widget_declaration", style: "display: none"});
		Element.insert(assistant.controller.sceneElement, content);
		assistant.controller.setupWidget("extra", {}, {scene: assistant.controller.sceneName});
		assistant.extraDiv = assistant.controller.get("extra");
		
		assistant.controller.listen(assistant.controller.sceneElement, Mojo.Event.keypress, function(event){
			if (Mojo.View.isTextField(event.originalEvent.target)){
				return;
			}
			//Mojo.Log.error(event.originalEvent.keyCode);
			switch(event.originalEvent.keyCode){
				case 32://spacebar
					koto.cardController.sendEventToCommanders({'type':Mojo.Event.command, command: "play_pause"});
					break;
				case 46://.
					koto.nowPlaying.playNext();
					break;
				case 64://@
				case 48:
					koto.nowPlaying.playPrevious();
					break;
				case 118://v
				case 86:
					if (arg && arg.nowPlaying){
						koto.cardController.sendEventToCommanders({'type':Mojo.Event.command, command: "view"});
					}
					break;
				case 109://m
				case 77:
					if (arg && arg.nowPlaying){
						koto.cardController.sendEventToCommanders({'type':Mojo.Event.command, command: "more"});
					}
					break;
				case 112://p
				case 80:
					if (arg && arg.nowPlaying){
						koto.cardController.sendEventToCommanders({'type':Mojo.Event.command, command: "playlist-popup"});
					}
					break;
				case 108://l
				case 76:
					if (arg && arg.nowPlaying){
						//koto.cardController.sendEventToCommanders({'type':Mojo.Event.command, command: "lyrics"});				
					}
					break;
				case 100://d
				case 68: 
					if (arg && arg.nowPlaying){
						koto.cardController.sendEventToCommanders({'type':Mojo.Event.command, command: "details"});														
					}
					break;
				case 99:
				case 67://c
					if (arg && arg.nowPlaying){
						koto.cardController.sendEventToCommanders({'type':Mojo.Event.command, command: "continue-album"});								
					}
					break;
				case 102://f
				case 70:
					if (arg && arg.nowPlaying){
						koto.cardController.sendEventToCommanders({'type':Mojo.Event.command, command: "favorite-song"});								
					}
					break;
					
				case 119:
				case 87://w 
				case 43://+
					if (assistant.extraDiv.mojo.visible("songDetails")){
						assistant.extraDiv.mojo.run("songDetails", "incrementRating");
					}
					break;
				case 115://s
				case 83:
				case 45://-
					if (arg && arg.nowPlaying){
						if (assistant.extraDiv.mojo.visible("songDetails")){
							assistant.extraDiv.mojo.run("songDetails", "decrementRating");
						} else {
							Mojo.Controller.getAppController().getStageController("cardStage").sendEventToCommanders({'type':Mojo.Event.command, command: "shuffle"});
						}
					}
					break;
			}
			
		}.bind(this));
		
		if ((arg && !arg.search) || !arg){
			//assistant.controller.listen(assistant.controller.sceneElement, Mojo.Event.keypress, assistant.search.bind(assistant));
		}
	};
	
	assistant.activateCommon = function(){
		assistant.checkCmdMenu();
		if (koto.nowPlaying.currentInfo.songs.length > 0){
			assistant.panel.removeClassName("shown");
			assistant.panel.mojo.updateSong();
		} 
		if (koto.nowPlaying.hasSaved){
			if ((((arg && !arg.nowPlaying) || !arg) && assistant.appMenuModel.items[0].items.length < 2) || ((arg && arg.nowPlaying)  && assistant.appMenuModel.items[1].items.length < 2)){
				assistant.appMenuModel.items[0].items.push({label: $L("Recover Now Playing"), command: "resume-now-playing"});
				assistant.controller.modelChanged(assistant.appMenuModel);
			}
		}		
	};
	
	assistant.deactivateCommon = function(){
		//assistant.controller.stopListening(assistant.controller.window.document, Mojo.Event.stageActivate, assistant.handleStageActivate);
		//assistant.controller.stopListening(assistant.controller.window.document, Mojo.Event.stageDeactivate, assistant.handleStageDeactivate);
	};

	assistant.cleanupCommon = function(){
	
	};
	assistant.stageDeactivate = function(){
		if (!assistant.panel.hasClassName("hidden")){
			assistant.panel.addClassName("center");	
			assistant.panel.mojo.hideMarquee();
		}
		if (koto.nowPlaying.currentInfo.songs.length > 0){
			koto.dashboard.show();
		}
	};
	assistant.stageActivate = function(){
		if (assistant.panel.hasClassName("center")){
			assistant.panel.removeClassName("center");	
			assistant.panel.mojo.checkMarquee();
			
		}
		assistant.checkCmdMenu();
		koto.dashboard.hide();
	};
	assistant.initAppMenu = function(opts) {
		var default_items = [                        //commands are in app-assistant
			{ label: $L('More Options'), items: [
				{label: $L("Update Just Type Data"), command: "update-just-type"},
				{label: $L("Search"), command: "search"}
			]},
			{ label: $L('Preferences & Accounts'),				command: Mojo.Menu.prefsCmd },
			{ label: $L('About Koto'),							command: 'do-about' },
			{ label: $L('Help'),								command: Mojo.Menu.helpCmd },
		];
		if (koto.nowPlaying.hasSaved === true){
			default_items[0].items.push({label: $L("Recover Now Playing"), command: "resume-now-playing"});
		}
		if (opts){
			opts.items = opts.items.concat(default_items);
		}
		if (!opts) {
			opts = {
				'items':default_items
			};
		}
		assistant.appMenuAttr  = {
			omitDefaultItems: true
		};
		
		assistant.appMenuModel = {
			visible: true,
			items: opts.items
		};

		assistant.controller.setupWidget(Mojo.Menu.appMenu, assistant.appMenuAttr, assistant.appMenuModel);
	};
	assistant.initViewMenu = function(title){
		//assistant.controller.setupWidget(Mojo.Menu.viewMenu, {spacerHeight: 50, menuClass: 'no-fade'}, {visible: true, items: [{label: title, width:'320'}]});	
		assistant.controller.get("title").innerHTML = title;
	};
	assistant.initCmdMenu = function(isNowPlaying){
		if (isNowPlaying) {
			var items = [
				{icon:"music-more", submenu: "more-menu"},
				{icon:"music-previous", command: "previous"},
				{icon:"music-pause", command: "play_pause"},
				{icon:"music-next", command: "next"},
				{icon:"music-shuffle", command: "shuffle"}					
			]
			var visible = true;
			if (koto.nowPlaying.currentInfo.unshuffledSongs.length > 0)
				items[4].icon = "music-shuffle-active";	
		}
		else {
			var items = [
				{icon:"music-nowplaying", command: "pushNowPlaying"},
				{icon:"music-previous", command: "previous"},
				{icon:"music-pause", command: "play_pause"},
				{icon:"music-next", command: "next"},
				{icon:"music-details", command: "showDetails"}					
			];
			var visible = (koto.nowPlaying.currentInfo.songs.length > 0)?true:false;
		}
		if (koto.nowPlaying.currentInfo.playing === false)
			items[2].icon = "music-play";

		assistant.controller.setupWidget(Mojo.Menu.commandMenu, 
			{spacerHeight: 50, menuClass: 'no-fade'}, 
			assistant.cmdMenuModel = {
				visible: visible, 
				items: [
					{},
					{items: items},
					{}
				]
			}
		);	
	};
	
	assistant.checkCmdMenu = function(){
		if (koto.nowPlaying.currentInfo.playing === true){
			if (assistant.cmdMenuModel.items[1].items[2].icon !== "music-pause"){
				assistant.cmdMenuModel.items[1].items[2].icon = "music-pause";
				assistant.controller.modelChanged(assistant.cmdMenuModel);
			}
		}		
		else{
			if (assistant.cmdMenuModel.items[1].items[2].icon !== "music-play"){
				assistant.cmdMenuModel.items[1].items[2].icon = "music-play";
				assistant.controller.modelChanged(assistant.cmdMenuModel);
			}
		}
		if ((arg && !arg.nowPlaying) || !arg){
			if (!assistant.panel.visible()){
				if (assistant.cmdMenuModel.items[1].items[4].icon !== "music-details"){
					assistant.cmdMenuModel.items[1].items[4].icon = "music-details";
					assistant.controller.modelChanged(assistant.cmdMenuModel);
				} 
			} else {
				if (assistant.cmdMenuModel.items[1].items[4].icon !== "music-details-down"){
					assistant.cmdMenuModel.items[1].items[4].icon = "music-details-down";
					assistant.controller.modelChanged(assistant.cmdMenuModel);
				}
			};
		}
		if (koto.nowPlaying.currentInfo.songs.length > 0 && !assistant.panel.hasClassName("center")){
			assistant.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
		}
		else {
			assistant.controller.setMenuVisible(Mojo.Menu.commandMenu, false);	
		}
	};
	assistant.search = function(event){
		var text = Mojo.Char.isValidWrittenChar(event.originalEvent.keyCode);
		if (text){
			assistant.controller.stageController.pushScene("search", text);
		}	
	};
	
	if ((arg && !arg.nowPlaying) || !arg){
		assistant.handleCommand = function(event){
			if (event.type === Mojo.Event.command) {
				switch(event.command){
					case 'pushNowPlaying':
						koto.nowPlaying.pushPlay();
						break;					
					case 'play_pause':
						if (koto.nowPlaying.currentInfo.playing === true){
							koto.nowPlaying.pause();
						}
						else{
							koto.nowPlaying.resume();
						}
						break;
					
					case 'previous':
						koto.nowPlaying.playPrevious();
						break;
					case 'next':
						koto.nowPlaying.playNext();
						break;
					case 'showDetails':
						assistant.panel.mojo.toggleVisibility();
						if (assistant.controller.sceneName === "list" && assistant.scroller && assistant.alphaScrollerBottomFade && assistant.scroller.visible()){
							assistant.handleResize();
						}
						break;
				}
			}
			if (event.type === Mojo.Event.forward){
				/*if (assistant.controller.sceneName === "list" || assistant.controller.sceneName === "view"){//list scene
					assistant.getSongs(function(songs){
						koto.nowPlaying.playArray(songs, 0);
					}.bind(assistant));
				}//main scene
				else if (assistant.controller.sceneName === "main") {
					koto.nowPlaying.shufflePlayArray(koto.content.songs.array, 0);
				};*/
				if ((arg && !arg.search) || !arg){
					assistant.controller.stageController.pushScene("search");
				}
			}
			if (event.type === Mojo.Event.back){
				if (assistant.extraDiv.hasClassName("shown")){
					assistant.extraDiv.mojo.hide();
					event.stop();
					event.stopPropagation();
				}
			}
		};
		assistant._playPrevious = function(){
			assistant.panel.mojo.updateSong();
		};
		assistant._playNext = function(){
			assistant.panel.mojo.updateSong();
		}
	};
	assistant._resume = function(){
		assistant.checkCmdMenu();
	}
	assistant._pause = function(){
		assistant.checkCmdMenu();
	}
	assistant._stop = function(){
		assistant.checkCmdMenu();
		assistant.panel.mojo.updateSong();
	}
	assistant._updateProgress = function(){
		assistant.panel.mojo.updateProgress();
		//if (((koto.nowPlaying.currentInfo.audioObj.currentTime/koto.nowPlaying.currentInfo.audioObj.duration) > .5) || (koto.nowPlaying.currentInfo.audioObj.currentTime > 240)){
			//lastfm.scrobble(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]);//todo TEST
		//}
	}
};

/* FOR 
ALL OTHER 
SCENES */


scene_helpers.addCommonSceneMethods = function(assistant, sceneName) {
	assistant.setupCommon = function(){
		assistant.initAppMenu();
	}
	assistant.initAppMenu = function(){
		assistant.appMenuAttr  = {
			omitDefaultItems: true
		};	
		var prefsDisable = false, aboutDisable = false, helpDisable = false, scenes = assistant.controller.stageController.getScenes();
		for(var i = 0; i < scenes.length; i++){
			if (scenes[i].sceneName === "about" || sceneName === "about")
				aboutDisable = true;
			else if (scenes[i].sceneName === "help" || sceneName === "help")
				helpDisable = true;
			else if (scenes[i].sceneName === "prefs" || sceneName === "prefs")
				prefsDisable = true;
		}
		if (sceneName === "startup"){
			aboutDisable = true; prefsDisable = true;
		}
		assistant.appMenuModel = {
			visible: true,
			items: [                        //commands are in app-assistant
				{ label: $L('Preferences & Accounts'),		command: Mojo.Menu.prefsCmd, disabled: prefsDisable},
				{ label: $L('About Koto'),		command: 'do-about',  disabled: aboutDisable},
				{ label: $L('Help'),			command: Mojo.Menu.helpCmd, disabled: helpDisable}
			]
		};
		assistant.controller.setupWidget(Mojo.Menu.appMenu, assistant.appMenuAttr, assistant.appMenuModel);
	}
	assistant.initViewMenu = function(title){
		assistant.controller.get("title").innerHTML = title;
	}
	assistant.stageDeactivate = function(){
		if (koto.nowPlaying.currentInfo.songs.length > 0){
			koto.dashboard.show();
		}
	};
	assistant.stageActivate = function(){
		koto.dashboard.hide();
	};
}