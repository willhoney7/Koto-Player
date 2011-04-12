function StageAssistant() {
	/* this is the creator function for your stage assistant object */
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

	/* this function is for setup tasks that have to happen when the stage is first created */
};

StageAssistant.prototype.cleanup = function(){
	
	if (koto.preferences.obj.closeDashboard){
		koto.nowPlaying.currentInfo.audioObj.pause();
		Mojo.Controller.getAppController().closeStage("dashboardStage");
		
		m.saveNowPlaying();
		m.cleanup();//1234354629114
	}

	
	Mojo.Event.stopListening(this.controller.window.document, Mojo.Event.stageActivate, this.handleStageActivate);
	Mojo.Event.stopListening(this.controller.window.document, Mojo.Event.stageDeactivate, this.handleStageDeactivate);

}