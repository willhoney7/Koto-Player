g = {};
g.Metrix = new Metrix(); //Instantiate Metrix Library
g.ServiceRequest = new ServiceRequestWrapper(); //Instantiate asynchronous service protection
g.AjaxRequest = new AjaxRequestWrapper(); ////Instantiate ajax request protection
g.AppId = Mojo.appInfo.id;
function AppAssistant(appController){
	/*try{
		cookie.initialize();
		if(new Mojo.Model.Cookie('id_cookie_mojomessenger_id').get()){
			global_id = new Mojo.Model.Cookie('id_cookie_mojomessenger_id').get();
		}else{
			new Mojo.Model.Cookie('id_cookie_mojomessenger_id').put(global_id);
		}
	}
	catch(e){debugError(e)}*/
}

AppAssistant.prototype.handleLaunch = function(launchParams){
	var cardStageController = this.controller.getStageController('cardStage');
 	
	if (!launchParams) {
		// first launch or tap on icon when minimized
		if (cardStageController)
			// application already running
			cardStageController.activate();
		else {
			if(this.controller.getStageController("dashboard")){
				this.launchFromDash();
			} else {
				// Need to launch the stage and scene
				var pushMainScene = function(stageController){
					var versionCookie = new Mojo.Model.Cookie('appVersion_mojoPlayer');
					if(!versionCookie.get()){
						stageController.pushScene("startup", "new");
					}
					else if(versionCookie.get() !== Mojo.Controller.appInfo.version){
						stageController.pushScene("startup", "update");
					}	
					else {
						stageController.pushScene('main');
					}
				};	
				var stageArgs = {
					name: 'cardStage',
					lightweight: true,
					assistantName: 'StageAssistant'
				};
				this.controller.createStageWithCallback(stageArgs, pushMainScene.bind(this), 'card');
			}
		}
   }
   else {
		//m.debugObj("launchParams", launchParams);
		if(launchParams.action){
			switch (launchParams.action) {
				case 'pushScene':
					data = launchParams.data || "";
					this.controller.getActiveStageController().pushScene(launchParams.scene, data);
					break;
				// Stuff
				case 'nothing':
					cardStageController.activate();
					break;
				case "getNowPlayingData"://todo
					if(!cardStageController){
						m.setupHandleLaunchStage(launchParams);
					} else {
						if(launchParams.callback  && launchParams.callback.id && launchParams.callback.action){
							if(m.nP.songs.length > 0){
								var params = {
									returnValue: true,
									nowPlaying: {
										title: m.nP.songs[m.nP.index].title,
										artist: m.nP.songs[m.nP.index].artist,
										album: m.nP.songs[m.nP.index].album,
										path: m.nP.songs[m.nP.index].path
									}
								}
							} else {
								var params = {
									returnValue: false
								}
							}
							params.action = launchParams.callback.action;
							g.ServiceRequest.request("palm://com.palm.applicationManager", {
								method: 'launch',
								parameters:  {
									id: launchParams.callback.id,
									params: params
								}
							});
						} 
					}
					/*
					if(!cardStageController){
						this.controller.closeAllStages();
					}*/
					break;
				case "launchFromDash":
					this.launchFromDash();
					break;
			}
		}else if (launchParams.justTypeTap){
			m.getObjsById([launchParams.justTypeTap], function(results){
				if (cardStageController)
					cardStageController.activate();
				else {
					var pushMainScene = function(stageController){
						m.isDbSearch = true;
						stageController.pushScene('main');
					};	
					var stageArgs = {
						name: 'cardStage',
						lightweight: true,
						assistantName: 'StageAssistant'
					};
					this.controller.createStageWithCallback(stageArgs, pushMainScene.bind(this), 'card');
				}
				var obj = results[0];
				var objType = m.getObjType(obj);
				if(objType === "artist" || objType === "album"){
					m.view(obj);
				}
				m.getSongsOfObj(obj, function(songs, index_){
					var index = index_ || 0;
					if(objType === "song" || objType === "playlist"){
						m.playArray(songs, index);
					} else if(objType === "genre"){
						m.viewArray(obj, songs);
					}
				}.bind(this), true);//pass true so it returns all songs by artist if it's a song
			}.bind(this));
		}
	}
}
AppAssistant.prototype.launchFromDash = function(){
	var cardStageController = this.controller.getStageController('cardStage');

	if(cardStageController){
		cardStageController.activate();
	} else {
		var pushMainScene = function(stageController){
			m.launchPlayer = true;
			stageController.pushScene('main');
		};	
		var stageArgs = {
			name: 'cardStage',
			lightweight: true,
			assistantName: 'StageAssistant'
		};
		this.controller.createStageWithCallback(stageArgs, pushMainScene.bind(this), 'card');
	}
				
}
AppAssistant.prototype.handleCommand = function (event) {
    switch(event.type) {
        case Mojo.Event.command:
            switch (event.command) { 
				case 'popScene':
					this.controller.getActiveStageController().popScene('pop', Mojo.Transition.zoomFade);
					break;
				case 'closeCacheStage':
					this.controller.closeStage("cacheStage");
					break;
				case 'swapMain-fromStartUp':
					this.controller.getActiveStageController().swapScene("main", true);	
					break;
				case Mojo.Menu.prefsCmd:			
					this.controller.getActiveStageController().pushScene("prefs");
					break;
				case 'do-about':
					this.controller.getActiveStageController().pushScene("about");
					break;
				case 'update-just-type':
					m.setupCacheDashboard();
					break;
				case "resume-now-playing":
					m.resumeNowPlaying();
					break;
				case "playground":
					this.controller.getActiveStageController().pushScene("playground");				
					break;
				case Mojo.Menu.helpCmd:
					this.controller.getActiveStageController().pushScene("help");
					break;
				case 'do-review':
					var launchParams = {
						id: "com.palm.app.findapps",
						params: {'target': "http://developer.palm.com/appredirect/?packageid=com.tibfib.mojo.player"}
					};
        
					g.ServiceRequest.request('palm://com.palm.applicationManager',
					{
						method: 'open',
						parameters: launchParams
					});
    
					break;
            }
        break;
    }
};