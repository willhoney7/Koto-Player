function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function() {
	if(Mojo.Environment.DeviceInfo.screenHeight === 800){
		this.controller.document.getElementsByTagName("body")[0].addClassName('pre3');
	}

	this.handleStageActivate = function(){
		m.delegate("stageActivate");
	}.bind(this);
	this.handleStageDeactivate = function(){
		m.delegate("stageDeactivate");
	}.bind(this);	
	
	Mojo.Event.listen(this.controller.window.document, Mojo.Event.stageActivate, this.handleStageActivate);
	Mojo.Event.listen(this.controller.window.document, Mojo.Event.stageDeactivate, this.handleStageDeactivate);

	/* this function is for setup tasks that have to happen when the stage is first created */
};

StageAssistant.prototype.cleanup = function(){
	
	if(m.prefs.closeDashboard){
		m.nP["audioObj" + m.nP.cao].pause();
		Mojo.Controller.getAppController().closeStage("dashboardStage");
		
		m.saveNowPlaying();
	}

	
	Mojo.Event.stopListening(this.controller.window.document, Mojo.Event.stageActivate, this.handleStageActivate);
	Mojo.Event.stopListening(this.controller.window.document, Mojo.Event.stageDeactivate, this.handleStageDeactivate);

}