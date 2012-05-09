Mojo.Widget.NowPlayingPanel = Class.create({
	setup: function setup(){
		//this.controller.model
		//this.controller.attributes
		this._clickHandler = this._clickHandler.bindAsEventListener(this);//todo ON MOUSE UP
		this.controller.listen(this.controller.element, Mojo.Event.tap, this._clickHandler);
		this.controller.exposeMethods(["hideMarquee", "checkMarquee",'updateSong', 'updateProgress', "hide", "show", "toggleVisibility"]);
		this._build();
	},
	_build : function _build() {
		if (this.controller.model.hidden === true){
			this.hide();
		}
		renderedInfo = Mojo.View.render({
			object: koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index],
			template: "widgets/widget_panel",
			formatters: {
				"width": function(value, model){
					if (!isNaN(koto.nowPlaying.currentInfo.audioObj.duration)){
						return (koto.nowPlaying.currentInfo.audioObj.currentTime/koto.nowPlaying.currentInfo.audioObj.duration)*112.4 + "%";
					}
				},
				"currentTime": function(value, model){
					return koto.utilities.formatTime(koto.nowPlaying.currentInfo.audioObj.currentTime);
				},
				"totalTime": function(value, model){
					return koto.utilities.formatTime(koto.nowPlaying.currentInfo.audioObj.duration);
				}
			}
		});	
		this.controller.element.innerHTML = renderedInfo;
		this.info = this.controller.get("song-info");//have to get each time because it gets re-rendered every time
		this.title = this.controller.get("song-title");
		this.checkMarquee();
		
		this.progressBar = this.controller.get("progress-bar");

		this.currentTime = this.controller.get("currentTime");
		this.totalTime = this.controller.get("totalTime");
		
		//this.progressBar.style.width = ((50/188)*112.4) + "%";
		//this.currentTime.innerHTML = koto.utilities.formatTime(50);   //for testing on the emu!
		//this.totalTime.innerHTML = koto.utilities.formatTime(188);
	},
	handleModelChanged : function() {
		this.updateSong();
	},
	/*
	 * .mojo Methods
	 */
	hideMarquee: function(){
		if (koto.preferences.obj.marqueeText === true){
			this.title.removeClassName("marquee");
			this.info.removeClassName("marquee");
		}
	},
	checkMarquee: function(){
		if (koto.preferences.obj.marqueeText === true){
			if (this.title.scrollWidth > this.title.offsetWidth+5){
				this.title.addClassName("marquee");
				this.title.removeClassName("truncating-text");
			}
			else{
				this.title.removeClassName("marquee");
				this.title.addClassName("truncating-text");
			}
			if (this.info.scrollWidth > this.info.offsetWidth+10){
				this.info.addClassName("marquee");
				this.info.removeClassName("truncating-text");
			}
			else {
				this.info.removeClassName("marquee");
				this.info.addClassName("truncating-text");
			}
		} else {
			this.title.removeClassName("marquee");
			this.title.addClassName("truncating-text");
			
			this.info.removeClassName("marquee");
			this.info.addClassName("truncating-text");
			
		}
	},
	updateSong: function(dontUpdateWidth){
		//this.hasEnded = false;
		var currentSong = koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index];
		this.title.innerHTML = currentSong.title;
		this.info.innerHTML = currentSong.artist + " - " + currentSong.album;
		this.checkMarquee();
		if (!dontUpdateWidth)
			this.progressBar.style.width = "0%";
			
		//this.progressBar.style.width = ((50/188)*112.4) + "%";
		//this.currentTime.innerHTML = koto.utilities.formatTime(50);   //for testing on the emu!
		//this.totalTime.innerHTML = koto.utilities.formatTime(188);
	},	
	updateProgress: function(){
		//this.progressBar.style.width = ((50/188)*112.4) + "%";
		//this.currentTime.innerHTML = koto.utilities.formatTime(50);   //for testing on the emu!
		//this.totalTime.innerHTML = koto.utilities.formatTime(188);
		
		this.progressBar.style.width = ((!isNaN(koto.nowPlaying.currentInfo.audioObj.duration))?((parseFloat(koto.nowPlaying.currentInfo.audioObj.currentTime))/(parseFloat(koto.nowPlaying.currentInfo.audioObj.duration)))*112.4 + "%": "0%");
		this.currentTime.innerHTML = koto.utilities.formatTime(koto.nowPlaying.currentInfo.audioObj.currentTime);
		this.totalTime.innerHTML = koto.utilities.formatTime(koto.nowPlaying.currentInfo.audioObj.duration);
		
		//if (!isNaN(koto.nowPlaying.currentInfo.audioObj.duration)){
			/*if ((koto.nowPlaying.currentInfo.audioObj.duration - koto.nowPlaying.currentInfo.audioObj.currentTime) < 10 && this.hasSetup === false){
				this.hasSetup = true;
				m.loadNext();
			}*/
		/*	if (koto.nowPlaying.currentInfo.audioObj.duration - koto.nowPlaying.currentInfo.audioObj.currentTime < 3 && this.hasEnded === false){
				this.hasEnded = true;
				this.ended();
			}
		}*/
		//lastfm.scrobble(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]);
		//koto.justType.incrementPlayCount(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]._id);
		//koto.nowPlaying.playNext(true);
	},
	hasSetup: false,
	ended: function(){
		//moved to "ended" event.. should work better
		lastfm.scrobble(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]);
		koto.justType.incrementPlayCount(koto.nowPlaying.currentInfo.songs[koto.nowPlaying.currentInfo.index]._id);
	},
	show: function(){
		this.updateSong(true);
		this.controller.element.show();//todo animate
		this.controller.scene.assistant.checkCmdMenu();

		this.updateProgress();
	},
	hide: function(){
		this.controller.element.hide();		
		this.controller.scene.assistant.checkCmdMenu();
	},
	toggleVisibility: function(){
		if (this.controller.element.visible()){
			this.hide();
		}else {
			this.show();
		}
	},
	
	_clickHandler : function(e) {
		var percent = ((parseInt(e.down.clientX, 10)-10)/300);
		if (percent < 0)
			percent = 0;
		else if (percent > 1)
			percent = 1;
			
		console.log("percent " + percent);
		console.log("duration " + parseFloat(koto.nowPlaying.currentInfo.audioObj.duration));
		if (!isNaN(koto.nowPlaying.currentInfo.audioObj.duration))
			koto.nowPlaying.currentInfo.audioObj.currentTime = (percent * parseFloat(koto.nowPlaying.currentInfo.audioObj.duration));
			
		//this.updateProgress(); this doesn't need to be called because "timechange" handles it.
	},
	cleanup: function() {
		this.controller.stopListening(this.controller.element, Mojo.Event.tap, this._clickHandler);
	}
});
