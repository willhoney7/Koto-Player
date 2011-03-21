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
		if(this.controller.model.hidden === true){
			this.hide();
		}
		renderedInfo = Mojo.View.render({
			object: m.nP.songs[m.nP.index],
			template: "widgets/widget_panel",
			formatters: {
				"width": function(value, model){
					if(!isNaN(m.nP["audioObj" + m.nP.cao].duration)){
						return (m.nP["audioObj" + m.nP.cao].currentTime/m.nP["audioObj" + m.nP.cao].duration)*112.4 + "%";
					}
				},
				"currentTime": function(value, model){
					return m.formatTime(m.nP["audioObj" + m.nP.cao].currentTime);
				},
				"totalTime": function(value, model){
					return m.formatTime(m.nP["audioObj" + m.nP.cao].duration);
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
		//this.currentTime.innerHTML = m.formatTime(50);   //for testing on the emu!
		//this.totalTime.innerHTML = m.formatTime(188);
	},
	handleModelChanged : function() {
		this.updateSong();
	},
	/*
	 * .mojo Methods
	 */
	hideMarquee: function(){
		if(m.prefs.marqueeText === true){
			this.title.removeClassName("marquee");
			this.info.removeClassName("marquee");
		}
	},
	checkMarquee: function(){
		if(m.prefs.marqueeText === true){
			if(this.title.scrollWidth > this.title.offsetWidth+5){
				this.title.addClassName("marquee");
				this.title.removeClassName("truncating-text");
			}
			else{
				this.title.removeClassName("marquee");
				this.title.addClassName("truncating-text");
			}
			if(this.info.scrollWidth > this.info.offsetWidth+10){
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
		var currentSong = m.nP.songs[m.nP.index];
		this.title.innerHTML = currentSong.title;
		this.info.innerHTML = currentSong.artist + " - " + currentSong.album;
		this.checkMarquee();
		if(!dontUpdateWidth)
			this.progressBar.style.width = "0%";
			
		//this.progressBar.style.width = ((50/188)*112.4) + "%";
		//this.currentTime.innerHTML = m.formatTime(50);   //for testing on the emu!
		//this.totalTime.innerHTML = m.formatTime(188);
	},	
	updateProgress: function(){
		//this.progressBar.style.width = ((50/188)*112.4) + "%";
		//this.currentTime.innerHTML = m.formatTime(50);   //for testing on the emu!
		//this.totalTime.innerHTML = m.formatTime(188);
		
		this.progressBar.style.width = ((!isNaN(m.nP["audioObj" + m.nP.cao].duration))?((parseFloat(m.nP["audioObj" + m.nP.cao].currentTime))/(parseFloat(m.nP["audioObj" + m.nP.cao].duration)))*112.4 + "%": "0%");
		this.currentTime.innerHTML = m.formatTime(m.nP["audioObj" + m.nP.cao].currentTime);
		this.totalTime.innerHTML = m.formatTime(m.nP["audioObj" + m.nP.cao].duration);
		
		//if(!isNaN(m.nP["audioObj" + m.nP.cao].duration)){
			/*if((m.nP["audioObj" + m.nP.cao].duration - m.nP["audioObj" + m.nP.cao].currentTime) < 10 && this.hasSetup === false){
				this.hasSetup = true;
				m.loadNext();
			}*/
		/*	if(m.nP["audioObj" + m.nP.cao].duration - m.nP["audioObj" + m.nP.cao].currentTime < 3 && this.hasEnded === false){
				this.hasEnded = true;
				this.ended();
			}
		}*/
		//lastfm.scrobble(m.nP.songs[m.nP.index]);
		//m.incrementPlayCount(m.nP.songs[m.nP.index]._id);
		//m.playNext(true);
	},
	hasSetup: false,
	ended: function(){
		//moved to "ended" event.. should work better
		lastfm.scrobble(m.nP.songs[m.nP.index]);
		m.incrementPlayCount(m.nP.songs[m.nP.index]._id);
	},
	show: function(){
		this.updateSong(true);
		this.controller.element.show();//todo animate
		this.controller.scene.assistant.checkCmdMenu();
	},
	hide: function(){
		this.controller.element.hide();		
		this.controller.scene.assistant.checkCmdMenu();
	},
	toggleVisibility: function(){
		if(this.controller.element.visible()){
			this.hide();
		}else {
			this.show();
		}
	},
	
	_clickHandler : function(e) {
		var percent = ((parseInt(e.down.clientX)-10)/300);
		if(percent < 0)
			percent = 0;
		else if(percent > 1)
			percent = 1;
			
		m.log("percent " + percent);
		m.log("duration " + parseFloat(m.nP["audioObj" + m.nP.cao].duration));
		if(!isNaN(m.nP["audioObj" + m.nP.cao].duration))
			m.nP["audioObj" + m.nP.cao].currentTime = (percent * parseFloat(m.nP["audioObj" + m.nP.cao].duration));
			
		//this.updateProgress(); this doesn't need to be called because "timechange" handles it.
	},
	cleanup: function() {
		this.controller.stopListening(this.controller.element, Mojo.Event.tap, this._clickHandler);
	}
});
