Mojo.Widget.AlphaScroller = Class.create({
	setup: function setup(){
		//this.controller.model
		//this.controller.attributes
		this._build();

		this._clickHandler = this._clickHandler.bindAsEventListener(this);//todo ON MOUSE UP
		this.controller.listen(this.controller.element, Mojo.Event.tap, this._clickHandler);
		this.controller.exposeMethods(["hide", "show", "toggleVisibility", "checkScroller"]);
	},
	_build : function _build() {
		var listItems = [
			{letter: "#"},
			{letter: "A"},
			{letter: "B"},
			{letter: "C"},
			{letter: "D"},
			{letter: "E"},
			{letter: "F"},
			{letter: "G"},
			{letter: "H"},
			{letter: "I"},
			{letter: "J"},
			{letter: "K"},
			{letter: "L"},
			{letter: "M"},
			{letter: "N"},
			{letter: "O"},
			{letter: "P"},
			{letter: "Q"},
			{letter: "R"},
			{letter: "S"},
			{letter: "T"},
			{letter: "U"},
			{letter: "V"},
			{letter: "W"},
			{letter: "X"},
			{letter: "Y"},
			{letter: "Z"}
		];
		//var scrollerContent = Mojo.View.render({object: {id: "alphaScroller", widget: "Scroller"}, template: "widgets/widget_declaration"});
		var content = Mojo.View.render({object: {id: "alphaMojoScroller", widget: "Scroller"}, template: "widgets/widget_declaration"});
		Element.insert(this.controller.element, content);
		
		this.controller.scene.assistant.controller.setupWidget("alphaMojoScroller", {mode: "vertical"}, {});
		this.scroller = this.controller.get("alphaMojoScroller");
		this.scroller.setStyle({height: "360px", width: "26px"});

		var renderedContent = Mojo.View.render({collection: listItems, template: 'widgets/widget_alphaScroller-item'});
		//this.scroller.innerHTML = "<div class='content'>" + renderedContent + "</div>";
		Element.insert(this.scroller, "<div class='alphaScroller-fade-top' x-mojo-scroll-fade='top'></div><div class='content'>" + renderedContent + "</div><div class='alphaScroller-fade-bottom' x-mojo-scroll-fade='bottom'></div>");
				
	},
	handleModelChanged : function() {
	},
	/*
	 * .mojo Methods
	 */	
	checkScroller: function(){
		console.log("get state: "  + Object.toJSON(this.scroller.mojo.getState()));	
	},
	show: function(){
		this.controller.element.show();//todo animate
	},
	hide: function(){
		this.controller.element.hide();		
	},
	toggleVisibility: function(){
		if (this.controller.element.visible()){
			this.hide();
		}else {
			this.show();
		}
	},
	
	_clickHandler : function(e) {
		
	},
	cleanup: function() {
		this.controller.stopListening(this.controller.element, Mojo.Event.tap, this._clickHandler);
	}
});
