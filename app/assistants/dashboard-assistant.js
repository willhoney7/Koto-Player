function DashboardAssistant() {}
DashboardAssistant.prototype.setup = function () {
	this.switchHandler = this.launchMain.bindAsEventListener(this);
	this.controller.listen("dashboard-contents", Mojo.Event.tap, this.switchHandler);
	this.handleControlTap = this.controlTap.bindAsEventListener(this);
	this.controller.listen("dashboard-controls", Mojo.Event.tap, this.handleControlTap);
 	this.playPauseDiv = this.controller.get("play_pause");
	this.infoElement = this.controller.get("dashboard-contents");
	this.displayDashboard();
};
 
DashboardAssistant.prototype.displayDashboard = function(){
	m.nP.songs[m.nP.index].albumArt = m.getAlbumArt(m.nP.songs[m.nP.index]);
	renderedInfo = Mojo.View.render({
		object: m.nP.songs[m.nP.index],
		template: "dashboard/dashboard-template",
		formatters: {
			"albumArt": function(value, model){
				if(model.thumbnails){
					return m.getAlbumArt(model);
				}
			}
		}
	});
	this.infoElement.innerHTML = renderedInfo;
	if(m.nP.playing === false){
		this.playPauseDiv.removeClassName("pause");
		this.playPauseDiv.addClassName("play");
	}
};
DashboardAssistant.prototype.launchMain = function () {
	this.controller.serviceRequest('palm://com.palm.applicationManager', 
		{
			method: 'launch',
			parameters: {
				id: Mojo.appInfo.id,
				params: {
					action: "launchFromDash"
				}
			}
		}
	);
	//Mojo.Controller.getAppController().closeStage("dashboardStage");
};

DashboardAssistant.prototype.controlTap = function (event) {
	if(event.target.id === "play_pause"){
		if(m.nP.playing === true){
			this.playPauseDiv.removeClassName("pause");
			m.pause();
			this.playPauseDiv.addClassName("play");
		}
		else{
			this.playPauseDiv.removeClassName("play");
			m.resume();
			this.playPauseDiv.addClassName("pause");
		}
	}else if(event.target.id === "previous"){
		m.playPrevious();
	}else if(event.target.id === "next"){
		m.playNext();
	}
};
 
DashboardAssistant.prototype.activate = function (event) {};
DashboardAssistant.prototype.deactivate = function (event) {};
DashboardAssistant.prototype.cleanup = function (event) {
	this.controller.stopListening("dashboard-contents", Mojo.Event.tap, this.switchHandler);
	
	if(!m.prefs.closeDashboard && !Mojo.Controller.getAppController().getStageController("cardStage")){
		m.nP["audioObj" + m.nP.cao].pause();		
		m.saveNowPlaying();
	}
};