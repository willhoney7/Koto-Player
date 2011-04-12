/**
 * @name widget_filterfield.js
 * @fileOverview This file has functions related to documenting the filter field control; 
 * See {@link Mojo.Widget.FilterField} for more info.
 
Copyright 2009 Palm, Inc.  All rights reserved.

*/

/**
#### Overview ####
The FilterField widget has an input field displayed at the top of the screen that displays the result of just typing 
to the screen when no other input field is focused. The field is hidden when empty, it's initial state, but it is 
given focus in the scene so that any typing is captured in the field. 

As soon as the first character is entered, the framework displays the field and calls the specified filterFunction. 
The FilterField automatically delays events so that a search is not triggered as the result of every query.

##### Declaration ####

		<div x-mojo-element="FilterField" id="filterFieldId" class="filterFieldClass" name="filterFieldName" ></div>
		

		Properties 	 		Required 	 Value			Description 
		---------------------------------------------------------------------------------------------------------------------------------
		x-mojo-element		Required 	 FilterField	Declares the widget as type 'FilterField' 
		id 	 				Required 	 Any String 	Identifies the widget element for use when instantiating or rendering


#### Events ####

		Mojo.Event.listen("filterFieldId",Mojo.Event.filter, this.handleUpdate)
	
		Event Type					Value										Event Handling
		---------------------------------------------------------------------------------------------------------------------------------
		Mojo.Event.filter			filterString: value in the filter field.	Sent after the specified delayed passes.
		Mojo.Event.filterImmediate	filterString: value in the filter field.	Sent on every key press.
		
#### Instantiation ####

		this.controller.setupWidget('filterField', 
			this.attributes = {
				delay: 5000,
				filterFieldHeight: 100				
			}, 
			this.model = {
				disabled: false				
			});


#### Attribute Properties ####

		Attribute Property	Type		Required 	Default		Description
		---------------------------------------------------------------------------------------------------------------------------------
		delay							Optional	300ms		how long to wait between key strokes for a filter event; 
																helps to queue them up so not constantly searching.
		disabledProperty	String		Optional	"disabled"	Model property name for disabled

#### Model Properties ####

		Model Property 		Type 		Required 	Default		Description 	
		---------------------------------------------------------------------------------------------------------------------------------
		disabled			Boolean 	false		"disabled"	If true, the FilterField does not open when keys are typed 
																with no focused element on the screen

#### Methods ####

		Method				Arguments							Description
		---------------------------------------------------------------------------------------------------------------------------------
		close				None								Close the FilterField 
		open				None								Open the FilterField
		setCount			count(Integer)						Set the number to be shown in the results bubble in the FilterField


*/
Mojo.Widget.FilterFieldCustom = Class.create(
	/** @lends Mojo.Widget.FilterField */
	{

	/** @private */
	DEFAULT_DELAY : 300,
	SCENE_CLASS: 'palm-filter-open',
	
	deactivate: function() {
		var highlighted, model;
		//don't bother with this selecting
		if (!this.filterOpen) {
			return;
		}
		if (this.filterReadDiv && !this.filterReadDiv.innerText.blank()) {
			model = {
				text: this.filterReadDiv.innerText
			};
			highlighted = Mojo.View.render({template: this.highlightTemplate, object: model});
			this.filterReadDiv.innerHTML = highlighted;
			this.filterWriteDiv.select(); //prepare old text for possible clearing
			this.filterWriteDiv.blur(); //remove focus so that we don't get any keys written to this from a pushed scene or div
		}
	},
	
	activate: function() {
		//if there was something in this.filterReadDiv.innerText, that is the search we want
		//we want to make it highlighted
		if (this.filterOpen) {
			this.filterWriteDiv.focus();
			if (!this.filterWriteDiv.value.blank()) {
				this.filterWriteDiv.select();
			}
		}
	},
	
	setup : function() {		
		Mojo.assert(this.controller.element, "Mojo.Widget.FilterField requires an element");
		this.divPrefix = Mojo.View.makeUniqueId() + this.controller.scene.sceneId + this.controller.element.id;
		this.delay = this.controller.attributes.delay || this.DEFAULT_DELAY;
		this.disabledProperty = this.controller.attributes.disabledProperty || Mojo.Widget.defaultDisabledProperty;
		this.disabled = this.controller.model[this.disabledProperty];
		
		//render the list area
		this.renderWidget();
		
		// Expose public widget API:
		this.controller.exposeMethods(['close', 'open','setCount', "setText"]);
		this.controller.scene.pushCommander(this);
		
		this.activate = this.activate.bind(this);
		this.controller.listen(this.controller.scene.sceneElement, Mojo.Event.activate, this.activate);
		this.deactivate = this.deactivate.bind(this);
		this.controller.listen(this.controller.scene.sceneElement, Mojo.Event.deactivate, this.deactivate);
		this.handleFilterOpen = this.handleFilterOpen.bind(this);
		this.controller.listen(this.controller.scene.sceneElement, Mojo.Event.keydown, this.handleFilterOpen, true); //make sure we set focus to the filterfield here
		this.handleKey = this.handleKey.bind(this);
		this.controller.listen(this.filterWriteDivContainer, "keydown", this.handleKey, true); //make sure we get focus here on the key down so we can set focus as soon as a key is typed
		this.handleFilter = this.handleFilter.bind(this);
		this.controller.listen(this.filterWriteDiv, "keyup", this.handleFilter);
		this.focusFilter = this.focusFilter.bind(this);
		this.controller.listen(this.filter, Mojo.Event.tap, this.focusFilter);
		this.highlightTemplate = Mojo.Widget.getSystemTemplatePath('/filterfield/highlighted');
		
		this.open();
	},
	
	/** @private */
	cleanup: function() {
		this.controller.stopListening(this.controller.scene.sceneElement, Mojo.Event.activate, this.activate);
		this.controller.stopListening(this.controller.scene.sceneElement, Mojo.Event.deactivate, this.deactivate);
		this.controller.stopListening(this.controller.scene.sceneElement, Mojo.Event.keydown, this.handleFilterOpen, true); //make sure we set focus to the filterfield here
		this.controller.stopListening(this.filterWriteDivContainer, "keydown", this.handleKey, true); //make sure we get focus here on the key down so we can set focus as soon as a key is typed
		this.controller.stopListening(this.filterWriteDiv, "keyup", this.handleFilter);
		this.controller.stopListening(this.filter, Mojo.Event.tap, this.focusFilter);
	},
	
	focusFilter: function() {
		//if filter was refocused remove any possibility of it all being selected and set
		//it up to add more text to the end
		this.filterWriteDiv.selectionStart = this.filterWriteDiv.value.length;
		this.filterWriteDiv.selectionEnd = this.filterWriteDiv.value.length;
		this.filterReadDiv.innerText = this.filterWriteDiv.value; //clear out the higlight so its editable again
	},
	
	setCount: function(count) {
		//setup the count
		//create a div that encapsulates this info and draw it...somewhere
		this.toggleSpinner(false);
		
		if (count || count === 0) {
		this.countDivContainer.show(); //show the count div if it was hiding; we don't show this until we get some value back from the client
		this.updateCount(count);
		}
	},
	
	updateCount:function(count) {
		this.count = count;
		this.countDiv.innerHTML = count;
	},
	
	
	/*
	 * Explicitly close the filter field
	 */
	close: function() {
		//this.handleFilterClose();
		//this.filterWriteDiv.blur();	
	},

	/*
	 * Update the model attached tp this filterfield. Only empties the contents of the field
	 * TODO: might be better tied to a model that gives the value to put here?
	 * 
	 */
	handleModelChanged: function() {
		this.filterWriteDiv.value = "";
		this.filterReadDiv.innerText = "";
		this.disabled = this.controller.model[this.disabledProperty];
		if (this.disabled) {
			this.close();
		}
	},


	/** @private */
	renderWidget: function() {
		var filterSpinnerAttrs;
		var model = {
			'divPrefix': this.divPrefix,
			'filterFieldId': this.filterFieldId
		};

		var template = Mojo.Widget.getSystemTemplatePath('/filterfield/filterfield');
		var content = Mojo.View.render({object: model, template: template});
		Element.insert(this.controller.element, content); //draw this area into the div
		this.filter = this.controller.get(this.divPrefix+'_list_filter');
		this.filterWriteDiv = this.controller.get(this.divPrefix+'-filterwritediv');
		this.filterWriteDivContainer = this.controller.get(this.divPrefix+'-filterwritedivContainer');
		//add set text
		this.filterWriteDiv.mojo = {
			setText: this.setText.bind(this)
		};
		this.filterReadDiv = this.controller.get(this.divPrefix+'-filterreaddiv');
		
		//spinner
		this.filterSpinner = this.controller.get(this.divPrefix+'-filterspinner');
		filterSpinnerAttrs = {
			spinnerSize: 'small'
		};
		this.filterSpinnerModel = {
			spinning: false
		};
		this.controller.scene.setupWidget(this.filterSpinner.id, filterSpinnerAttrs, this.filterSpinnerModel);
		this.controller.instantiateChildWidgets();
		
		
		this.countDiv = this.controller.get(this.divPrefix+'_countDiv');
		this.countDivContainer = this.controller.get(this.divPrefix+'_countDivContainer');
	},

	/**
	 * @private
	 */
	hideFilter: function() {
		this.filter.hide();
	},

	/**
	 * @private
	 */
	open: function() {
		if (this.disabled) {
			return;
		}
		
		//these are now separate from the filterfield div
		//so can get sym logic
		this.filterWriteDiv.show();
		this.filterWriteDiv.focus();
		if (!this.filterOpen) {
			this.filter.show();
			this.filterOpen = true;
			if (!this.viewDiv) {
				this.viewDiv = this.controller.document.createElement('div');
				this.viewDiv.className = 'palm-filterfield-spacer filter-field-container-height';
			}
			this.controller.scene.sceneElement.insertBefore(this.viewDiv, this.controller.scene.sceneElement.firstChild);

			this.controller.scene.sceneElement.addClassName(this.SCENE_CLASS);
		}
	},

	/**
	 * @private
	 * @param {Object} event
	 */
	handleSelection: function(event) {
		Mojo.Event.send(this.controller.element, Mojo.Event.filter); //just forward the event
	},

	
	/**
	 * @private
	 * @param {Object} e
	 */
	handleKey: function(e) {
		// ignore characters unused in filter search typing
		//eat enter keys to avoid newlines	
		if (e.keyCode === Mojo.Char.enter) {
			Event.stop(e);
			return true;
		}

		if ((e.keyCode < 32 || e.keyCode === 127) && (e.keyCode != 8)) {
			return;
		}

		if (!Mojo.Char.isPrintableChar(e.keyCode, true)) {
			return;
		}
	},
	
	sendFilterEvent: function() {
		Mojo.Event.send(this.controller.element, Mojo.Event.filter, {filterString: this.filterWriteDiv.value}); //just forward the event
	},
	
	
	// show or hide spinner; start and stop the spinning
	toggleSpinner: function(spinning) {
		if (spinning) {
			this.filterSpinner.show();
			spinning = true;
		} else {
			this.filterSpinner.hide();
		}
		
		this.filterSpinnerModel.spinning = spinning;
		this.controller.modelChanged(this.filterSpinnerModel);
	},

	/**
	 * @private
	 */
	handleDelayedSend:function() {
		if (this.filterTimer) {
			this.filterTimer = undefined;
			this.sendFilterEvent();
		}
	},

	/**
	 * @private
	 * @param {Object} now
	 */
	handleSendEvent: function(now) {
		
		//setup the spinner and count immediately
		this.countDivContainer.hide(); //hide the count div for the new search
		this.toggleSpinner(true);
		
		//clear out any previously existing timers, because we don't want them to fire
		if (this.filterTimer) {
			this.controller.window.clearTimeout(this.filterTimer);
			this.filterTimer = undefined;
		}
		if (now) {
			this.sendFilterEvent();
		} else {
			//create a new timeout because some key was pressed
			//delay it by delay; we will wait that long to send a filter event OR to receive a cancellation
			this.filterTimer = this.controller.window.setTimeout(this.handleDelayedSend.bind(this), this.delay); //let's try 300ms to start
		}
	},

	/**
	 * @private
	 */
	handleFilterClose: function() {
		/*this.filterWriteDiv.hide();
		if (this.filterOpen) {
			this.hideFilter();
			this.filterOpen = false;
			this.filterWriteDiv.value = "";
			this.filterReadDiv.innerText = "";
			this.handleSendEvent(true); //send the event NOW
			this.filterWriteDiv.blur();
			this.viewDiv.remove();
			this.setCount(this.count); //when closing, reset the count
			this.controller.scene.sceneElement.removeClassName(this.SCENE_CLASS);
		}*/
	},

	/**
	 * @private
	 * @param {Object} e
	 */
	handleFilter: function(e) {
		//if this is an opt key being released AND the filter was not open
		//then we did not get any updated keys for this
		//so stop the event so we dont get an extra alt char picker
		//if it was open we do want to see the char picker
		if (e.keyCode === Mojo.Char.sym && !this.filterOpen) {
			e.stop(); //kill this event
			if (this.filterWriteDiv.value.blank()) {
				//this.close();
			}
			return;
		}
		//if the filter was not open and we got a chorded key, open it now
		if (!this.filterOpen && e.ctrlKey && Mojo.Widget.CharSelector.prototype.hasKeyAlternates(e.keyCode)) {
			this.open();
		}
		
		//always make sure the input field is focused
		this.filterWriteDiv.focus();	
		//eat enter keys to avoid newlines
		if (Mojo.Char.isEnterKey(e.keyCode)) {
			Event.stop(e);
			return true;
		}

		if ((e.ctrlKey || e.keyCode < 32 || e.keyCode === 127) && (e.keyCode !== Mojo.Char.backspace) && !Mojo.Char.isDeleteKey(e.keyCode)) {
			return;
		} 
		
		if (this.forceOpen) {
			this.forceOpen = undefined;
			this.filterWriteDiv.value = ''; //delete the space in there; we don't need it
			Mojo.Event.send(this.controller.element, Mojo.Event.filterImmediate, {filterString: ' '}); //send an empty string so that the apps THINK its open even though it isnt
			return; //send an empty event
		}
		
		this._updateFilter();
	},
	
	_updateFilter: function() {
		//need to update the div text before I send it out
		this.filterReadDiv.innerText = this.filterWriteDiv.value;
		// send filter-immediate event for those interested in knowing immediately when it changes
		// this is a good time to cancel any pending service requests (the data is old by this time)..
		Mojo.Event.send(this.controller.element, Mojo.Event.filterImmediate, {filterString: this.filterWriteDiv.value});
		
					
		// hide the field if empty
		if (this.filterReadDiv.innerText.blank()) {
			Mojo.Event.send(this.controller.element, Mojo.Event.filter, {filterString: ''}); //send an empty string so that the apps THINK its open even though it isnt
			//this.handleFilterClose();
		} else {
			//queue this up
			this.handleSendEvent();
		}
		
	},
	
	setText: function(value) {
		this.filterWriteDiv.value = value;
		this._updateFilter();
	},
	
	/**
	 * @private
	 * @param {Object} e
	 */
	handleFilterOpen: function(e) {
		var keyCode;
		if (this.filterOpen && !Mojo.View.isTextField(e.originalEvent.target)) { //don't take focus from something that accepts keys!
			this.filterWriteDiv.focus(); //already open, just refocus it IF it should be getting the keys
			return;
		}

		keyCode = e.originalEvent.keyCode;
		
		if (!Mojo.View.isTextField(e.originalEvent.target) && e.originalEvent.ctrlKey) { //sym key
			this.filterWriteDiv.show();
			this.filterWriteDiv.focus();
			return;
		}
		if (e.originalEvent.target !== this.controller.document.body) {
		 	return;
		}
		
		if (!Mojo.Char.isPrintableChar(keyCode, true)) {
			return;
		}
		if (keyCode === Mojo.Char.spaceBar) { //special shortcut key for bringing up the filterfield
			this.forceOpen = true;
			e.stop();
		}
		this.open();
	},

	/** @private */
	handleCommand: function(event) {
	}
});
