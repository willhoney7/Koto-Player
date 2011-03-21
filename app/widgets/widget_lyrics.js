Mojo.Widget.Lyrics = Class.create({
	setup: function setup(){
		this._build();
		this.controller.exposeMethods(["hide", "show"]);
	},
	_build : function _build() {	
		var content = Mojo.View.render({object: {id: "spinner", widget: "Spinner", style: "text-align: center"}, template: "widgets/widget_declaration"});
		this.controller.scene.setupWidget("spinner",{
				spinnerSize: "large",
				/*frameHeight: 128,
				startFrameCount: 0,
				mainFrameCount: 12, trying to speed up the spinner, doesn't work wonderfully.
				fps: 20*/
			},
			this.spinnerModel = {
				spinning: false 
			}
		); 
		Element.insert(this.controller.element, content);
		Element.insert(this.controller.element, "<div id='lyrics-content' style='padding-bottom: 5px;'></div>");
		//Element.insert(this.controller.element, "<div style='height: px'></div>");
		this.spinnerDiv = this.controller.get("spinner");
		this.lyricsDiv = this.controller.get("lyrics-content");
		this.controller.instantiateChildWidgets(this.controller.element); 
	},
	handleModelChanged : function() {
		//this.updateSong();
	},
	cleanup: function() {
	
	},		
	showLyrics: function(lyrics){
		if(lyrics){
			m.nP.songs[m.nP.index].lyrics = lyrics;
		}
		if(m.nP.songs[m.nP.index].lyrics){
			this.spinnerDiv.mojo.stop();
			this.lyricsDiv.innerHTML = m.nP.songs[m.nP.index].lyrics;
		}
	},
	//Mojo Methods
	show: function(){
		this.lyricsDiv.innerHTML = "";
		this.spinnerDiv.mojo.start();
		this.controller.element.show();						
		
		if(!m.nP.songs[m.nP.index].lyrics){
			checkConnectivity(function(connected){
				if(connected){
					lyrics.searchForLyrics(m.nP.songs[m.nP.index], handleLyrics.bind(this));
				} else {
					m.bannerError("Not Connected to Internet");
					this.hide();
				}
			}.bind(this))
		}else {
			this.showLyrics();			
		}
				
		function handleLyrics(response){
			if(response.lyrics){
				this.showLyrics(response.lyrics);
			}
			else {
				this.controller.scene.assistant.extraDiv.mojo.hide();
				m.bannerError(response.error);
			}
		}
	},
	hide: function(){
		//hide div
		this.controller.element.hide();
		this.lyricsDiv.innerHTML = "";
		this.spinnerDiv.mojo.stop();
	}
	
});
