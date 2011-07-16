function StageAssistant() {
}

StageAssistant.prototype.setup = function() {
	if (Mojo.Environment.DeviceInfo.screenHeight === 800){
		this.controller.document.getElementsByTagName("body")[0].addClassName('pre3');
	}

	this.handleStageActivate = function(){
		koto.utilities.delegate("stageActivate");
	}.bind(this);
	this.handleStageDeactivate = function(){
		koto.utilities.delegate("stageDeactivate");
	}.bind(this);	
	
	Mojo.Event.listen(this.controller.window.document, Mojo.Event.stageActivate, this.handleStageActivate);
	Mojo.Event.listen(this.controller.window.document, Mojo.Event.stageDeactivate, this.handleStageDeactivate);

};

StageAssistant.prototype.cleanup = function(){
	
	if (koto.preferences.obj.closeDashboard){
		koto.nowPlaying.currentInfo.audioObj.pause();
		Mojo.Controller.getAppController().closeStage("dashboardStage");
		
		koto.nowPlaying.save(function(){
			koto.nowPlaying.currentInfo.songs = [];
			koto.nowPlaying.currentInfo.unshuffledSongs = [];
			koto.nowPlaying.currentInfo.index = 0;
			koto.nowPlaying.currentInfo.playing = false;
		});
	}

	
	Mojo.Event.stopListening(this.controller.window.document, Mojo.Event.stageActivate, this.handleStageActivate);
	Mojo.Event.stopListening(this.controller.window.document, Mojo.Event.stageDeactivate, this.handleStageDeactivate);

}