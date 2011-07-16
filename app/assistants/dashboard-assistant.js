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
	koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index].albumArt = koto.albumArt.get(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]);
	renderedInfo = Mojo.View.render({
		object: koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index],
		template: "dashboard/dashboard-template",
		formatters: {
			"albumArt": function(value, model){
				if (model.thumbnails){
					return koto.albumArt.get(model);
				}
			}
		}
	});
	this.infoElement.innerHTML = renderedInfo;
	if (koto.nowPlaying.currentInfo.playing === false){
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
	if (event.target.id === "play_pause"){
		if (koto.nowPlaying.currentInfo.playing === true){
			this.playPauseDiv.removeClassName("pause");
			koto.nowPlaying.pause();
			this.playPauseDiv.addClassName("play");
		}
		else{
			this.playPauseDiv.removeClassName("play");
			koto.nowPlaying.resume();
			this.playPauseDiv.addClassName("pause");
		}
	}else if (event.target.id === "previous"){
		koto.nowPlaying.playPrevious();
	}else if (event.target.id === "next"){
		koto.nowPlaying.playNext();
	}
};
 
DashboardAssistant.prototype.activate = function (event) {
	this.displayDashboard();
};
DashboardAssistant.prototype.deactivate = function (event) {};
DashboardAssistant.prototype.cleanup = function (event) {
	this.controller.stopListening("dashboard-contents", Mojo.Event.tap, this.switchHandler);
	
	if (!koto.preferences.obj.closeDashboard && !koto.cardController){
		koto.nowPlaying.currentInfo.audioObj.pause();		

		koto.nowPlaying.save(function(){
			koto.nowPlaying.currentInfo.songs = [];
			koto.nowPlaying.currentInfo.unshuffledSongs = [];
			koto.nowPlaying.currentInfo.index = 0;
			koto.nowPlaying.currentInfo.playing = false;
		});
	}
};