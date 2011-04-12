function PlaygroundAssistant() {
	scene_helpers.addCommonSceneMethods(this);
}

PlaygroundAssistant.prototype.setup = function() {
	this.controller.setupWidget("playbackSlider", 
		{
			round: true,
			maxValue: 40,
			minValue: 1,
		},
		{
			value: koto.nowPlaying.currentInfo.audioObj.playbackRate*10
		}
	);

	this.controller.listen("playbackSlider", Mojo.Event.propertyChanged, this.handleProgressSlider = this.progressSliderChange.bind(this));
}
PlaygroundAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};
PlaygroundAssistant.prototype.progressSliderChange = function(event) {
	console.log("value " + event.value);
	console.log("playbackRate " + koto.nowPlaying.currentInfo.audioObj.playbackRate);
	
	koto.nowPlaying.currentInfo.audioObj.playbackRate = event.value/10;
	
	console.log("playbackRate after" + koto.nowPlaying.currentInfo.audioObj.playbackRate);
	
}	
PlaygroundAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

PlaygroundAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
