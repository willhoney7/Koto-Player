/**
 * @name widget_list.js
 * @fileOverview This file discusses The List widget is intended to display a variable length list of objects;
 * See {@link Mojo.Widget.List} for more info. 

Copyright 2009 Palm, Inc.  All rights reserved.

*/

/**
#### Overview ####
List is the most common and possibly the most powerful Mojo widget. 
Objects are rendered into list items using provided HTML templates, and may be variable 
height and/or include other widgets. Lists can be static, where the list items are provided 
to the widget directly as an array, or they can be dynamic, where the application provides 
a callback function which is invoked as additional items are needed for display. 
Lists can be manipulated in place, with the framework handling deletion, reordering 
and addition functions for the application.

#### Declaration ####

		<div x-mojo-element="List" id="listId" class="listClass" name="listName"></div>

		Properties		Required	Value			Description 
		---------------------------------------------------------------------------------------------------------------------------------
	    x-mojo-element	Required     List			Declares the widget as type 'List' 
	    id				Required     Any String		Identifies the widget element for use when instantiating or rendering
	    class			Optional     Any String		Provide your own unique class and override the frameworks styles
	    name			Optional     Any String		Add a unique name to the list widget; generally used in templates when used 

    
#### Events ####

		this.controller.listen("listId", Mojo.Event.listTap, this.handleUpdate)

		Event Type					Value			Event Handling
		---------------------------------------------------------------------------------------------------------------------------------
	    Mojo.Event.listChange		{model:this.controller.model, item:dataObj, index: index + this.renderOffset, originalEvent:event}
	    Mojo.Event.listTap			event.item
	    Mojo.Event.listAdd	
	    Mojo.Event.listDelete		event.item
									event.index
	    Mojo.Event.listReorder		event.item
									event.toIndex
									event.fromIndex


#### Instantiation ####
    
		this.controller.setupWidget("listId",
		     this.attributes = {
		         itemTemplate: 'listscene/static-list-entry',
		         listTemplate: 'listscene/static-list-container',
		         addItemLabel: $L('Add ...'),
		         swipeToDelete: true,
		         reorderable: true,
		         emptyTemplate:'list/emptylist'
		     },
		     this.model = {
		         listTitle: $L('List Title'),
		         items : [
		            {data:$L("Item 1"), year:$L("1974")},
		            {data:$L("Item 2"), year:$L("1975")},
		            {data:$L("Item 3"), year:$L("1972")},
		            {data:$L("Item 4"), year:$L("2003")},
		            {data:$L("Item 5"), year:$L("1996")},
		            {data:$L("Item 6"), year:$L("1969")},
		         ]

		     });


#### Attribute Properties ####

		Attribute Property	Type			Required	Default		Description
		---------------------------------------------------------------------------------------------------------------------------------
		listTemplate		String			Optional				File path relative to app folder for container template; the container template must contain
		                                                            #{-listElements} or no items will be rendered in the container; #{listTitle} must be specified if 
																	you want to specify a title in your list container
		itemTemplate		String			Required				File path relative to app folder for item template
		addItemLabel		String			Optional	None		If defined, a special "add" item will be appended to the list and taps on this 
																	item will generate a 'Mojo.Event.listAdd' event. The string is used to label the entry; 
																	if null, then it will default to "+Add".
		formatters			Function		Optional				Object functions to format list entries based on model properties
		preventDeleteProperty	String		Optional				If specified, the item models will be checked for this property, and swipeToDelete will be 
																	ignored on that item if the item model's property is truthy.
		itemsProperty		String			Optional	items		Model property for items list
		itemsCallback		Function		Optional	None		Items will be loaded as needed by calling this function of the form:
																	callback(widget, offset, count)
																	Typically, this callback should call widget.mojo.noticeUpdatedItems(offset, items) when ready
		swipeToDelete		Boolean			Optional	FALSE		If true, list entries can be deleted with a swipe
		autoconfirmDelete	Boolean			Optional	TRUE		If false, delete swipes will post a 'delete/undo' button pair, otherwise deletes 
																	will be made immediately after swiping
		uniquenessProperty	String			Optional	None		Name of an item model property which can be used to uniquely identify items.
																	If specified, List will maintain a hash of swiped items instead of setting a deleted property,
																	preventing the app from having to persist the deleted property.
		reorderable			Boolean			Optional	FALSE		If true, list entries can be reordered by drag & drop
		dividerFunction		Function		Optional				Function to create divider elements
		dividerTemplate		Function		Optional	list-divider.html	Function to format divider
		fixedHeightItems	Boolean			Optional	FALSE		If true, list widget will apply optimizations for fixed height items
		initialAverageRowHeight	Integer		Optional	?			Initial value used for average height estimation
		renderLimit			Integer			Optional	20			Max number of items to render at once; increase this if the UI overruns 
																	the list boundaries
		lookahead			Integer			Optional	15			Number of items to fetch ahead when loading new items
		dragDatatype		String			Optional	None		Used for drag&drop reordering. If specified will allow items to be dragged from one 
																	list to another of the same datatype
		deletedProperty		String			Optional	deleted		Name of the item object property in which to store the deleted status of an item
		nullItemTemplate	String			Optional	default template	File path relative to app folder for template for items that are 
																			rendered before loading
		emptyTemplate		String			Optional	default template	File path relative to app folder for template for empty list; this is only implemented for lists loaded via the itemsCallback property
		onItemRendered		Function		Optional	None		Called each time an item is rendered into the DOM with these arguments 
																	(listWidget, itemModel, itemNode)
		hasNoWidgets		boolean		Optional	false		Specify true for this if the list has no child widgets; allows for faster processing of simple lists; in versions of the List widget where this property does not exist, behavior will be as if hasNoWidgets was set to false
		splitInitialRender	boolean		Optional	false			Use a split rendering algorithm for the first screen of data; this allows for faster time to first load of a scene


#### Model Properties ####

		Model Property		Type			Required	Default		Description     
		---------------------------------------------------------------------------------------------------------------------------------
	    items				Array			Optional	None		Contains a list of Objects to display in the list; required unless itemsCallback property 
																	is set as a an Attributes property


#### Methods ####

		Method		Arguments					Description
		---------------------------------------------------------------------------------------------------------------------------------
		focusItem  itemModel, focusSelector 	Focus the item designated by the item model; optionally pass in the focusSelector to focus a specific element within the item
		showAddItem boolean						Show the "add item" in the list
		noticeUpdatedItems offset, items (array) Causes the given items to be replaced and re-rendered. Items provided past the current end of the list will cause the length to grow. MUST pass 		
												an array
		noticeAddedItems offset, items (array)   Inserts the given array of items into the list at the given offset.If list items are dynamically loaded, this may cause some to be kicked out of 
												 the cache. Calling this API will not cause a property-change event to be fired.
		noticeRemovedItems offset, limit  Removes items from the list beginning at the given offset, and continuing for 'limit' items. If list items are dynamically loaded, this may 
												  cause new ones to be requested. Calling this API will not cause a property-change event to be fired.
		getNodeByIndex	index					Return top level node for the list item of the given index. Returns undefined if the item does not exist or is not currently rendered.
		invalidateItems		offset, limit		Causes the given items to be reloaded (if currently loaded). If limit is unspecified, causes all items after 'offset' to be invalidated.
		getLoadedItemRange						Returns a hash with offset & limit properties indicating the range of currently loaded item models (or items which have been requested).  
												This is sometimes used on the service side to optimize subscription data.
		getMaxLoadedItems						Returns the maximum number of loaded items the list will maintain in its local cache.
												function has no affect when the list size != 0.
		setLength	length						Call to set the overall length of the list.
												This function will set the limit on what range of items may be requested, but will generally not invalidate any existing items
												or request any new ones.  It MAY request new items when the currently loaded items window
												is either not full, or the length change causes the items window to move.  The latter case can occur if the length change causes the 
												window to be "out of bounds", or if it would ideally be positioned past the end of the list.
		setLengthAndInvalidate	length			Behaves like setLength, except that all currently loaded items are invalidated.
												For lazily loaded lists, this API will result in a request for a whole window of items.
												Note that items are invalidated even when the length of the list does not actually change.
		getLength								Returns the current length of the list.
		revealItem	index, animate (boolean)	Attempts to scroll the scene to reveal the item with the given index
												May behave poorly when working with variable height list items which are not currently loaded, since we can't accurately predict the height of 
												the final rendered content.
		getItemByNode	node					Returns the item model associated with the list item containing the given node, if any. Returns undefined if not.


@field
*/

//overwrites default list widget. adds "setReorderable api".
Mojo.Widget.List = Class.create({
	
	loggingEnabled: false,
	
	kReorderDragClass: 'palm-reorder-element',
	kDeleteDragClass: 'palm-delete-element',
	
	kMaxSpacerHeight: 10000000, // allows for easy configuration of max spacer size, to potentially work around a fixed point overflor in the graphics layer.
	
	kDeletedItemSwiped: 0.5,
	kDeletedItemConfirmed: true,
	kDeletedItemCancelled: false,
	
	
	/* 
		=======================================
		= Public APIs, exposed via widget div =
		=======================================
	*/
	
	
	// Focuses an element inside the list item for the given itemModel object.  Defaults to the first input or textarea element.
	// itemModel: Object, required.  The object from 'items' model property associated with the list item to focus.
	// focusSelector: String, optional. CSS selector specifying which element should be focused.
	// return value: the element focused.
	focusItem: function(itemModel, focusSelector) {
		var node, input;
		var index = this.listItems.indexOf(itemModel);
		
		if (index >= 0) {
			node = this.getNodeByIndex(index + this.renderOffset);

			input = (focusSelector && node.querySelector(focusSelector)) || node.querySelector('input[type=text]') || node.querySelector('textarea');
			if (input) {
				if (input.focus) {
					input.focus();
				} else if (input.mojo && input.mojo.focus) {
					input.mojo.focus();
				}
			}
		}
		
		return input;
	},
	
	// Shows or hides the special 'add...' item. 
	showAddItem:function(show) {
		var item;
		
		if (!this.addItemNode) {
			Mojo.Log.error('WARNING: List.mojo.addItemNode is null. Please verify that you supplied addItemLabel in the widget attributes.');
			return;
		}
		
		this.addItemVisible = show;

		if (this.bigItemsList.length === 0) {
			this.updateListItems();
		}
		
		if (this.addItemNode){
			item = this.findPrevListItem();
			if (!show && this.addItemNode.parentNode) {
				this.addItemNode.parentNode.removeChild(this.addItemNode);
			} 
			else if (show && !this.addItemNode.parentNode) {
				this.listItemsParent.appendChild(this.addItemNode);
			}
			
			this.updateListClasses();
		}
		
	},
	setReorderable: function(value){
		if (value === true){
			if (this.controller.attributes.reorderable === false) {
				this.holdHandler = this.holdHandler.bindAsEventListener(this);
				this.controller.listen(this.controller.element, Mojo.Event.hold, this.holdHandler);
				this.controller.attributes.reorderable = true;
			}
		} else if (value === false){
			if (this.controller.attributes.reorderable === true) {
				this.controller.stopListening(this.controller.element, Mojo.Event.hold, this.holdHandler);
				this.controller.attributes.reorderable = false;
			}
		}
	},
	/**
	 * Returns an array of item model objects covering the requested range.
	 * Items which are not loaded will be null.
	 * This call will not cause the loaded item window to move.
	 * 
	 * @param {Object} offset
	 * @param {Object} limit
	 */
	getItems: function(offset, limit) {
		return this.bigItemsList.slice(offset, offset+limit, false);
	},
	
	

	/**
	 * Removes items from the list beginning at the given offset, and continuing for 'limit' items.
	 * If list items are dynamically loaded, this may cause new ones to be requested.
	 * Calling this API will not cause a property-change event to be fired.
	 * 
	 * @param {Object} offset
	 * @param {Object} limit
	 */
	noticeRemovedItems: function noticeRemovedItems(offset, limit) {
		var needUpdate, updated, needToRenderItems;
		var node, windowShift;
		this.log("noticeRemovedItems @", offset,", +",limit);

		this.bigItemsList.noticeRemovedItems(offset, limit);

		// Force an update of the list if the removed items overlap our rendered window.
		needUpdate = (offset + limit > this.renderOffset) && (offset < this.renderOffset + this.listItems.length);

		// Move render window back in order to keep it correct if needed.
		if (offset < this.renderOffset) {
			this.renderOffset = Math.max(0, this.renderOffset - limit);
		}
		
		// Optimize the common case of removing 1 element.
		// This unfortunately doesn't apply if updated===true, since moveWindowIfInvalid()
		// may or may not have updated everything already.
		if (needUpdate && limit === 1) {
			
			// remove the deleted item from the DOM
			node = this.getNodeByIndex(offset);
			this.removeListItemNode(node);
			
			// renumber the items, since removing the deleted one left a hole.
			this.renumberListItems();
			
			// If we're not rendering the whole list already, then we need to render a new item.
			if (this.renderLimit <= this.bigItemsList.length) {
				needToRenderItems = true;
				
				// save anchor position while renderOffset is still in sync with the DOM items
				this.saveAnchorPosition();
				
				// Move window back if it's past the end of the list... but not < 0.
				windowShift = 0;
				if (this.renderOffset + this.renderLimit > this.bigItemsList.length) {
					windowShift = this.renderOffset;
					this.renderOffset = Math.max(0, this.bigItemsList.length - this.renderLimit);
					windowShift = this.renderOffset - windowShift; // windowShift should be 0 or -1
				}
			}
			
			// Reload items, so we have models for the entire set we're rendering:
			this.listItems = this.bigItemsList.slice(this.renderOffset, this.renderOffset+this.renderLimit, true);
			
			if (needToRenderItems) {
				
				if (windowShift < 0) {
					// our window shifted back, render the first one.
					this.renderItemsBefore([this.listItems[0]], this.findNextListItem());
				} else {
					// render the last one
					this.renderItemsBefore([this.listItems[this.listItems.length-1]], this.bottomSpacer);
				}
				
				// renderItemsBefore() will renumbers everything for us.
				
				this.updateSpacers();
				
			} else {
				// even if no new items need to be rendered, we may still need to update the dividers since the last item in a section could have been removed.
				// This happens when the list length <= renderLimit.
				this.updateDividers();
				this.updateListClasses();
			}
		}
		else {
			// If the window is outside valid list bounds, then we need to move it.
			// This updates the spacers for us, but may not remove currently rendered items
			// that should no longer be in the DOM, since it only applies a delta to the current renderOffset.
			// So, we still need to update things if needUpdate is true.
			updated = this.moveWindowIfInvalid();

			if (needUpdate) {
				this.updateListItems();
			} else if (!updated) {
				this.saveAnchorPosition();
				this.updateSpacers();
			}
		}
		
		//we had an update, so better resize the scroller
		if (this.scroller && this.scroller.mojo) {
			this.scroller.mojo.validateScrollPosition();
		}

	},
	/**
	 * @deprecated Use List.mojo.noticeAddedItems() instead
	 */
	// TODO: Remove this deprecated code.
	addItems: function addItems(offset, items) {
		Mojo.Log.error('WARNING: List.mojo.addItems() has been renamed to List.mojo.noticeAddedItems().  Please update your code.');
		this.noticeAddedItems(offset, items);
	},
	
	/**
	 * @deprecated Use List.mojo.noticeRemovedItems() instead
	 */
	// TODO: Remove this deprecated code.
	removeItems: function removeItems(offset, limit) {
		Mojo.Log.error('WARNING: List.mojo.removeItems() has been renamed to List.mojo.noticeRemovedItems().  Please update your code.');
		this.noticeRemovedItems(offset, limit);
	},
	
	/**
	 * @deprecated Use List.mojo.noticeUpdatededItems() instead
	 */
	// TODO: Remove this deprecated code.
	updateItems: function updateItems(offset, items) {
		Mojo.Log.error('WARNING: List.mojo.updateItems() has been renamed to List.mojo.noticeUpdatedItems().  Please update your code.');
		this.noticeUpdatedItems(offset, items);
	},
	
	/**
	 * Inserts the given array of items into the list at the given offset.
	 * If list items are dynamically loaded, this may cause some to be kicked out of the cache.
	 * Calling this API will not cause a property-change event to be fired.
	 * 
	 * @param {Object} offset
	 * @param {Object} items
	 */
	noticeAddedItems: function noticeAddedItems(offset, items) {
		var adjustWindow;
		var needUpdate;
		
		this.log("noticeAddedItems @",offset,", +",items.length);
		
		// Will we need to readjust our render window after adding these items?
		// This is needed when the window is pinned to the end of the list.
		adjustWindow = this.renderOffset + this.renderLimit >= this.bigItemsList.length;
		
		// We need to make sure we re-render if the insert is within our render window.
		// we re-render (>= as opposed to >) when items are inserted right at our 
		// window-start so that new items will appear when viewing the beginning of the list.
		needUpdate = (offset >= this.renderOffset) && offset < (this.renderOffset + this.renderLimit);
		
		this.bigItemsList.noticeAddedItems(offset, items);
		
		if (offset < this.renderOffset) { 
			this.renderOffset += items.length;
		}
		
		// if we were pinned at the end, then we may need to adjust our window down a bit, now that we have more items.
		// Unfortunately, we still have to call updateListItems() below, since adjustRenderWindow() won't render
		// the newly inserted items into the DOM (and in fact, leaves the DOM in a bad state in this case, duplicating
		// items at the end since our listItems are out of sync with the BigList).
		if (adjustWindow) {
			this.adjustRenderWindow();
		}
		
		// Update if necessary.
		// No updates needed unless insert is within our window.
		// TODO: We should always update the spacers here, so the scroll bar appears correct.
		if (needUpdate) {
			this.updateListItems();
		}
		
		// we now have items, so scene transition can proceed.
		this.completeLazySetup();
		
		//we had an update, so better resize the scroller
		if (this.scroller && this.scroller.mojo) {
			this.scroller.mojo.validateScrollPosition();
		}
	},
	

	/**
	 * Causes the given items to be replaced and re-rendered.
	 * Items provided past the current end of the list will cause the length to grow appropriately.
	 * 
	 * @param {Object} offset
	 * @param {Object} items
	 */
	noticeUpdatedItems: function(offset, items) {
		var limit = items.length;
		this.log('got noticeUpdatedItems: offset ',offset,", limit ",limit);
		
		// Notify BigArray of the new items
		this.bigItemsList.noticeUpdatedItems(offset, items);
		
		
		// Return if we don't need to re-render anything.
		if (offset + limit < this.renderOffset || 
			offset > this.renderOffset + this.renderLimit) {
			this.log('noticeUpdatedItems: return without rendering.');
			return;
		}
		
		
		
		//Mojo.Timing.resetAllWithPrefix('notice');
		//Mojo.Timing.resume("notice#NoticeUpdated");
		
		// Refresh item models.
		// Do not allow slice to move the window, since that could cause more items to be loaded,
		// which can cause us to be called again.  Back when we were calling updateItems(), we'd 
		// set a flag to detect that case, and simply return (above).
		this.listItems = this.bigItemsList.slice(this.renderOffset, this.renderOffset+this.renderLimit, false);
		
		// Calculate offset & limit for overlapping range of items we're currently rendering, and the ones just updated.
		limit = Math.min(this.renderOffset + this.listItems.length, offset + limit);
		offset = Math.max(this.renderOffset, offset);
		limit -= offset;
		
		// Re-render the dirty items:
		//Mojo.Timing.resetAllWithPrefix('list');
		this.rerenderSomeItems(offset, limit);

		//Mojo.Timing.pause("notice#NoticeUpdated");
		//Mojo.Timing.resume("notice#NoticeMeasure");
		this.measureItemHeights();
		//Mojo.Timing.pause("notice#NoticeMeasure");
		//Mojo.Timing.reportTiming('notice', ", NoticeUpdated:");
		//Mojo.Timing.reportTiming('list', ", NoticeList:");
		//Mojo.Timing.resetAllWithPrefix('notice');
		//Mojo.Timing.resetAllWithPrefix('list');
		
		// we now have items, so scene transition can proceed.
		this.completeLazySetup();
		this.log("List: noticeUpdatedItems done.");
		
		//we had an update, so better resize the scroller
		if (this.scroller && this.scroller.mojo) {
			this.scroller.mojo.validateScrollPosition();
		}
	},
	

	/**
	 * Causes the given items to be reloaded (if currently loaded).
	 * If limit is unspecified, causes all items after 'offset' to be invalidated.
	 * 
	 * @param {Object} offset
	 * @param {Object} limit
	 */
	invalidateItems: function(offset, limit) {
		this.bigItemsList.invalidateItems(offset, limit);
		// updates happen if needed since our loadnotify function will be called.
	},
	

	/**
	 * Return top level node for the list item of the given index.
	 * Returns undefined if the item does not exist or is not currently rendered.
	 * 
	 * @param {Object} index
	 */
	getNodeByIndex: function(index) {
		var node;
		
		if (index < this.renderOffset || index >= this.renderOffset + this.listItems.length) {
			return undefined;
		}
		
		index -= this.renderOffset;
		for(node = this.listItemsParent.firstChild; node; node=node.nextSibling) {
			if (node._mojoListIndex === index) {
				return node;
			}
		}
		
		return undefined;
	},
	
	/**
	 * Returns the item model associated with the list item containing the given node, if any.
	 * Returns undefined if not.
	 */
	getItemByNode: function(node) {
		node = Mojo.Widget.Util.findListItemNode(node, this.listItemsParent);
		return node && this.listItems[node._mojoListIndex];
	},
	
	
	/**
	 * Returns a hash with offset & limit properties indicating the range of currently loaded item models
	 * (or items which have been requested).  This is sometimes used on the service side to optimize subscription data.
	 */
	getLoadedItemRange: function() {
		return this.bigItemsList.getLoadedItemRange();
	},
	
	/**
	 * @deprecated Use List.mojo.getMaxLoadedItems() instead. 
	 * @description Returns the maximum number of loaded items the list will maintain in its local cache.
	 */
	maxLoadedItems: function() {
		return this.bigItemsList.maxLoadedItems();
	},
	
	
	/**
	 * @description Returns the maximum number of loaded items the list will maintain in its local cache.
	 */
	getMaxLoadedItems: function() {
		return this.bigItemsList.maxLoadedItems();
	},

	
	/**
		Call to set the initial size of the list, or after resetting the list state by calling modelChanged().
		This function will set the limit on what range of items may be requested, but subsequent changes to the
		list size should be made through noticeAddedItems() and noticeRemovedItems().
		This function has no affect when the list size != 0.
		@deprecated Use List.mojo.setInitialSize() instead.
	*/
	setInitialSize: function(length) {
		
		Mojo.Log.error('WARNING: List.mojo.setInitialSize() has been deprecated.  Use setLength() instead.');
		
		// Only set size if the list is currently 0 size.
		// This ensures that it will (pretty much) only be used to set the initial size,
		// and subsequent changes to list size will go through noticeAddedItems/noticeRemovedItems.
		if (this.bigItemsList.length === 0 && length > 0) {
			this.setLength(length);
		}
	},
	
	/**
		Call to set the overall length of the list.
		This function will set the limit on what range of items may be requested, but will generally not invalidate any existing items
		or request any new ones.  It MAY request new items when the currently loaded items window
		is either not full, or the length change causes the items window to move.  The latter case can occur if the length change causes the 
		window to be "out of bounds", or if it would ideally be positioned past the end of the list.
	*/
	setLength: function(length) {
		this._setLengthInternal(length,false);
	},
	
	
	/**
		Behaves like setLength, except that all currently loaded items are invalidated.
		For lazily loaded lists, this API will result in a request for a whole window of items.
		Note that items are invalidated even when the length of the list does not actually change.
	*/
	setLengthAndInvalidate: function(length) {
		this._setLengthInternal(length,true);
	},
	
	/** @private */
	_setLengthInternal: function(length, inval) {
		var forceUpdate, movedWindow;
		
		this.log("List: Setting length to", length, ", inval=", inval);
		
		if (inval) {
			if ( this.secondRun ) {
				this.controller.window.clearTimeout(this.secondRun);
				this.secondRun = undefined;
			}
			this.bigItemsList.setLengthAndInvalidate(length);
		} else if (length === this.bigItemsList.length) {
			// don't bother with any of this if the length is not changing.
			// (unless we're invalidating, above.)
			this.completeLazySetup();
			return;
		} else {
			this.bigItemsList.setLength(length);
		}
		
		
		// force an update if the list is now shorter than the renderLimit, or not currently rendered at all (i.e., if it used to have 0 items).
		// This prevents us from having to cleverly remove any extraneous items from the DOM, which would be efficient.
		forceUpdate = this.bigItemsList.length < this.renderLimit || !this.listItemsParent;
		
		// Shift the render window if needed, in order to ensure it remains within valid list bounds.
		movedWindow = this.moveWindowIfInvalid();
		
		if (forceUpdate) {
			this.updateListItems();
		} else if (!movedWindow && !this.adjustRenderWindow()) {
			// If the list is not re-rendered, we need to at least update the spacer heights.
			this.saveAnchorPosition();
			this.updateSpacers();
		}
		
		this.completeLazySetup();
	},
	
	
	
	/**
		Returns the current length of the list.
	*/
	getLength: function() {
		return this.bigItemsList.length;
	},
	
	/**
		Attempts to scroll the scene to reveal the item with the given index
		May behave poorly when working with variable height list items which 
		are not currently loaded, since we can't accurately predict the height of 
		the final rendered content.
	*/
	revealItem: function(index, animate) {
		var node = this.getNodeByIndex(index);
		var top;
		
		
		if (node) {
			top = Mojo.View.viewportOffset(node).top;
//			Mojo.Log.info('Revealing item '+index+', loaded. actual top='+top);
		} else {
						
			// estimate scroll destination from beginning of top spacer if the index is in the first half of the spacer range.
			if (index < this.renderOffset/2) {
				top = Mojo.View.viewportOffset(this.topSpacer).top + (index * this.averageItemHeight);
			}
			
			// estimate from the bottom of the top spacer if it's in the second half of the spacer range
			else if (index < this.renderOffset) {
				top = Mojo.View.viewportOffset(this.topSpacer).top + this.topSpacerHeight - ((this.renderOffset - index) * this.averageItemHeight);
			}
			
			// Otherwise, estimate from top of bottom spacer.
			else { // index >= this.renderOffset
				top = Mojo.View.viewportOffset(this.bottomSpacer).top;
				top += (index - (this.renderOffset + this.listItems.length)) * this.averageItemHeight;
			}
			
//			Mojo.Log.info('Revealing item '+index+', estimated top='+top);
			
		}
		
		this.scroller.mojo.scrollTo(undefined, this.scroller.mojo.getState().top + this.kRevealTopMargin-top, animate);
	},
	
	/** @private Wrapper around correct method to get an element offset with regards to scrolling */
	elementOffset: function(element) {
		return Mojo.View.viewportOffset(element);
	},
	
	
	
	
	/* 
		===================
		= Setup & Cleanup =
		===================
	*/
	
	kRevealTopMargin: 200,
	
	kListDeleteCmdAttr: 'x-mojo-list-delete-cmd',	
	kDefaultDeletedProperty: 'deleted',
	
	
	/** @private */
	setup: function() {
		var defaultListTemplate;
		var spacers;
		var attributes = this.controller.attributes;
		var deleteTemplateName;
		
		this.hasWidgets = !this.controller.attributes.hasNoWidgets;
		
//		Mojo.Log.info('List getting set up.');
		
		Mojo.assert(this.controller.scene.assistant, "Mojo.Widget.List requires a scene assistant to be defined.");
		Mojo.assert(attributes && this.controller.model, "Mojo.Widget.List requires a model. Did you call controller.setupWidgetModel() for "+this.controller.widgetName+"?");
		
		// This should initially be set to false, until we get our first subtreeShown event, but 
		// we're not going to do it until we have time to find & iron out any issues it might expose.
		// this.maybeVisible = false;
		
		this.itemsProperty = attributes.itemsProperty || 'items';
				
		// TODO: Remove this legacy code:
		if (!this.controller.attributes.itemsCallback && !this.controller.attributes.itemsProperty && 
			!this.controller.model.items && this.controller.model.listItems) {
			this.itemsProperty = 'listItems';
			Mojo.Log.error("WARNING: The default model property for List widget items is now 'items' instead of 'listItems'.  Please update your code.");
		}
				
		this.lookahead = attributes.lookahead;
		
		defaultListTemplate = Mojo.Widget.getSystemTemplatePath("list/plain");
		this.listTemplate = attributes.listTemplate || defaultListTemplate;
		this.dividerTemplate = attributes.dividerTemplate || Mojo.Widget.getSystemTemplatePath('list/divider');
		this.onItemRendered = attributes.onItemRendered;
		
		this.deletedProperty = attributes.deletedProperty || this.kDefaultDeletedProperty;
		this.preventDeleteProperty = attributes.preventDeleteProperty;
		
		// If this is specified, then we keep a hash to track deleted items.
		this.uniquenessProperty = attributes.uniquenessProperty;
		if (this.uniquenessProperty !== undefined) {
			this._deletedItems = {}; // will contain uniqueness values from deleted items
		}
		
		this.emptyTemplate = attributes.emptyTemplate;
		
		
		// TODO: remove this hack once model is not automatically set to attributes when missing.
		// In the mean time, this prevents mojo-list events from having a model property set to the attributes,
		// so new app code won't come to depend on it.
		if (this.controller.model === attributes) {
			this.controller.model = {};
		}
		
		// If itemsCallback is specified, then we're responsible for loading items as needed.
		this.itemsCallback = attributes.itemsCallback;
		
		// No items callback?
		// We use a local one to return elements from our model array... 
		// this is less efficient, but guarantees that the same logic is used everywhere.
		if (!this.itemsCallback) {
			this.itemsCallback = this.loadItemsFromModel;
		} else {
			// items are really lazily loaded, so watch for aboutToActivate, and delay transitions until we have items.
			this.aboutToActivate = this.aboutToActivate.bindAsEventListener(this);
			Mojo.listen(this.controller.scene.sceneElement, Mojo.Event.aboutToActivate, this.aboutToActivate);
		}
		
		Mojo.requireFunction(this.itemsCallback, "itemsCallback must be a function.");
		
		// This is the function we give to BigArray to load items.  Just bind it once in setup().
		this.loadItemsForBigArray = this.loadItemsForBigArray.bind(this);
		
		
		// Item height measurement:
		this.initialAverageRowHeight = attributes.initialAverageRowHeight || 60;
		this.averageItemHeight = this.initialAverageRowHeight;
		this.heightSamples = 0;		
		
		// Watch for scroll events on the enclosing scroller:
		this.addAsScrollListener = this.addAsScrollListener.bind(this);
		this.scroller = Mojo.View.getScrollerForElement(this.controller.element);
		Mojo.require(this.scroller, "Failed to find scroller for element, although one might wonder why it is a requirement.");
		this.scroller.addEventListener(Mojo.Event.scrollStarting, this.addAsScrollListener, false);
		this.scrollThreshold = attributes.scrollThreshold || 100;

		// Temporarily used for scroll frame performance timing
//		this.saveLastMoveTime = this.saveLastMoveTime.bind(this);
		
		// Set up spacer & content divs:
//		spacers = Mojo.View.convertToNodeList("<div name='topSpacer'></div><div name='bottomSpacer'></div>");
		spacers = Mojo.View.convertToNodeList("<div name='topSpacer' style='background-color:#e4e4e2;'></div><div name='bottomSpacer' style='background-color:#e4e4e2;'></div>", this.controller.document);
		this.topSpacer = spacers[0];
		this.bottomSpacer = spacers[1];
		Element.remove(this.topSpacer);
		Element.remove(this.bottomSpacer);
		
		this.contentDiv = this.controller.element;
		
		// Set up list.  Initially has no items loaded.
		this.listItems = [];
		this.renderOffset = 0;  // item offset of this.listItems from "real" beginning of the list.
		this.renderLimit = attributes.renderLimit || 20;	// How many items to render (i.e., go into this.listitems.)
		this._initialPageSize = attributes._initialPageSize || 10;
		this.splitInitialRender = attributes.splitInitialRender;
		this.savedScrollPos={};
		
		
		// Attach event handling stuff:
		this.handleTap = this.handleTap.bindAsEventListener(this);
		this.controller.listen(this.controller.element, Mojo.Event.tap, this.handleTap);
		this.handleChange = this.handleChange.bindAsEventListener(this);
		this.controller.listen(this.controller.element, 'change', this.handleChange);
		
		// Optional drag'n'drop reordering:
		if (attributes.reorderable) {
			this.holdHandler = this.holdHandler.bindAsEventListener(this);
			this.controller.listen(this.controller.element, Mojo.Event.hold, this.holdHandler);
		}

		// Optional gestural delete:
		if (attributes.swipeToDelete) {
			this.dragStartHandler = this.dragStartHandler.bindAsEventListener(this);
			this.controller.listen(this.controller.element, Mojo.Event.dragStart, this.dragStartHandler);
			
			// We used to cache the converted delete spacer template in this widget's prototype, so
			// we only had to convert it once per framework instance.  But, this is potentially unsafe
			// since we need to clone the nodes for use in various other documents, so now we just
			// keep one copy per list widget (if the list has swipe-delete).
			if (attributes.autoconfirmDelete) {
				// Deletes are immediately confirmed, so there's no need for a delete/undo spacer.  Just use the reorder spacer.
				deleteTemplateName = "list/spacer-item";
			} else {
				// Use the delete confirmation template
				deleteTemplateName = "list/delete-item";
			}
			this.deleteTemplateNode = Mojo.View.convertToNode(	
											Mojo.View.render({template: Mojo.Widget.getSystemTemplatePath(deleteTemplateName)}),
											this.controller.document);
			
			
			// We store a random value on the scene controller to use as the delete property truth value.
			// This lets us implicitly 'undo' pending deletes when the scene is popped.
			// We can't just store it on the list, since lists inside lists may be destroyed & recreated when the parent list changes.
			if (this.controller.scene._mojoListDeleteCookie === undefined) {
				this.controller.scene._mojoListDeleteCookie = Math.random() + 1; // add 1 so it's at least guaranteed to be truthy
			}
			this.deleteTruth = this.controller.scene._mojoListDeleteCookie;
			
			this.swipeToDeleteQueue = [];
		}
		
		// determine template used to render null items, if needed:
		this.nullItemTemplate = attributes.nullItemTemplate || Mojo.Widget.getSystemTemplatePath("list/null-item");
		
		// Both swipe-delete and reordering require the list to be a drop container.
		if (attributes.swipeToDelete || attributes.reorderable) {
			Mojo.Drag.setupDropContainer(this.controller.element, this);
			this.dragDatatype = attributes.dragDatatype;
		}
		
		// Expose public widget API:
		this.controller.exposeMethods(['focusItem', 'setReorderable', 'showAddItem', 'updateItems', 'noticeUpdatedItems', 'getItems', 'addItems', 'noticeAddedItems',
					'removeItems', 'noticeRemovedItems', 'getNodeByIndex', 'invalidateItems', 'getLoadedItemRange', 'getMaxLoadedItems', 'maxLoadedItems', 
					'setInitialSize', 'setLength', 'setLengthAndInvalidate', 'getLength', 'revealItem', 'getItemByNode']);
				
		// If there's an add-item label, then render the item:
		if (attributes.addItemLabel) {
			this.addItemNode = Mojo.View.convertToNode(Mojo.View.render({object:{addItemLabel:attributes.addItemLabel}, 
														template: Mojo.Widget.getSystemTemplatePath("list/add-item")}), this.controller.document);
			
			if (this.addItemNode) {
				this.addItemVisible = true;
			} else {
				Mojo.Log.error('WARNING: List.mojo.addItemNode is null. Please verify that you supplied addItemLabel in the widget attributes.');
			}
		}
		
		this.setupBigList();
		
	},
	
	completeLazySetup: function() {
		// this means we have items now (or have been sized to 0 if the list is empty)
		this.lazySetupComplete = true;
		
		// If we're 0-length, and have an empty template, then we may need to re-render, so that we display it.
		if (this.bigItemsList.length === 0 && this.emptyTemplate) {
			this.updateListItems();
		}
		
		// Continue activation procedure if we delayed it.
		if (this.activateContinuationFunc) {
			this.activateContinuationFunc();
			delete this.activateContinuationFunc;
		}
		
	},
	
	/**
	 * @private
	 * Describe what this does...
	 * @param {Object} callbacktion
	 */
	setupBigList: function() {
		if (this.bigItemsList) {
			this.bigItemsList.cleanup();
		}
		
		this.isFirstRequest = true; // the request made here is AWLAYS the first request; when we render the results of this request, we clear this variable
		// Allocate BigArray to handle windowed item loading.
		this.bigItemsList = new Mojo.Model.BigArray(this.loadItemsForBigArray, 
										{pageSize:this.renderLimit, lookahead:this.lookahead});
		
		// If our items are actually in an array, we can set the size now.
		// This will cause any needed items to be loaded.
		if (this.itemsCallback === this.loadItemsFromModel) {
			this.bigItemsList.setLength(this.controller.model[this.itemsProperty].length);
		}
		else {
			// Otherwise, just request a full window.
			this.bigItemsList.requestFullWindow();
		}
		
		// lists which are still 0-length at this point haven't been drawn at all.
		// We need to draw them, in case they have an 'add' item showing or something.
		if (this.bigItemsList.length === 0) {
			this.renderFromModel();
		}
		
	},
	
	/**
	 * @private
	 * describe what this cleanup does
	 */
	cleanup: function() {
		// Remove our event listener on the scene scroller.
		this.scroller.removeEventListener(Mojo.Event.scrollStarting, this.addAsScrollListener);
		
		this.controller.stopListening(this.controller.element, Mojo.Event.tap, this.handleTap);
		this.controller.stopListening(this.controller.element, 'change', this.handleChange);
		
		if (this.controller.attributes.reorderable) {
			this.controller.stopListening(this.controller.element, Mojo.Event.hold, this.holdHandler);
		}
		
		// Optional gestural delete:
		if (this.controller.attributes.swipeToDelete) {
			this.controller.stopListening(this.controller.element, Mojo.Event.dragStart, this.dragStartHandler);
		}
	},
	
	
	
	/* 
		===================================
		= Rendering & general DOM support =
		===================================
	*/
	/** @private 
	 * Re-render the entire list.
	 */
	renderFromModel: function renderFromModel() {
//		console.profile('new renderFromModel');
		var attrs = this.controller.attributes;
		var model = this.controller.model;
		var itemModel;
		var item;
		
		// If there are no items, and the addItem is hidden, then do not even render the list container.
		if (this.bigItemsList.length === 0 && !this.addItemVisible) {
			if (this.emptyTemplate && this.lazySetupComplete) {
				this.contentDiv.innerHTML = Mojo.View.render({object: model, template: this.emptyTemplate, attributes:attrs});
			}else {
				this.contentDiv.innerHTML = '';
			}
			this.listItemsParent = undefined;
			this.log("List: renderFromModel rendering empty list");
			return;
		}
		
		// warn when this is called... most of the time, we should just update the items that are changing.
		this.log("************************ WARNING: renderFromModel is slow");
		
		this.renderContainer();
		
		this.setupItemsParent();
		
		// Render the actual list items:
		//Mojo.Timing.resetAllWithPrefix('list');
		this.renderItemsBefore(this.listItems, this.bottomSpacer, this.renderOffset);
		//Mojo.Timing.reportTiming('list', "renderFromModel");
		//Mojo.Timing.resetAllWithPrefix('list');
		
		// Make sure spacer heights are correct.
		this.updateSpacers();
		
//		console.profileEnd();
	},
	
	/** @private
		Sets up the listItemsParent div for actual use.
		Inserts the spacer divs, if missing, and installs the add-item if appropriate.
	*/
	setupItemsParent: function() {
		this.log("setupItemsParent");
		
		// Insert spacer divs:
		if (this.topSpacer.parentNode) {
			Element.remove(this.topSpacer);
			Element.remove(this.bottomSpacer);
		}
		this.listItemsParent.insertBefore(this.topSpacer, this.listItemsParent.firstChild);
		this.listItemsParent.appendChild(this.bottomSpacer);
		
		// ... and the "add item" node:
		if (this.addItemNode) {
			if (this.addItemNode.parentNode) {
				Element.remove(this.addItemNode);
			}
			if (this.addItemVisible) {
				this.listItemsParent.appendChild(this.addItemNode);
			}
		}
		
		return;
	},
	
	/** 
	 * @private
	 * Render the list's container template, and set up this.listItemsParent.
	 */
	renderContainer: function() {
		var placeholder;
		
		this.log("List: renderContainer");
		
		// Apply formatters here instead of in render(), so that we can also add the 'listElements' property to the decorator.
		var obj = Mojo.Model.format(this.controller.model, this.controller.attributes.formatters, false);  
		obj.listElements = "<div id='MojoListItemsParentMarker'></div>";

		this.contentDiv.innerHTML = Mojo.View.render({object: obj, template: this.listTemplate});
	
		// Find the list items parent, insert the items, and then mark them with their index into the data object array:
		placeholder = this.contentDiv.querySelector('#MojoListItemsParentMarker');
		this.listItemsParent = placeholder.parentNode;
		this.listItemsParent.removeChild(placeholder);
		
		return;
	},
	
	
	
	/** @private
		Updates only the given range of currently rendered items.
	*/
	rerenderSomeItems: function(offset, limit) {
		var node, i, newNode;
		
		this.log('List: rerenderSomeItems: offset ',offset,", limit ",limit);
		
		// If the list is not rendered at all, we need to do the whole thing:
		if (!this.listItemsParent) {
			this.updateListItems();
			return;
		}
		
		this.saveAnchorPosition();
		
		// NOTE: Because we don't save the anchor position & update the spacers, 
		// this could be a slightly rocky ride when using variable height items.
		
		node = this.getNodeByIndex(offset);
		if (node) {
			
			// Remove old items:
			for(i=0; i<limit && node; i++) {
				newNode = this.findNextListItem(node);
				this.removeListItemNode(node);
				node = newNode;
			}
		}
		
		// If we removed nodes all the way to the end, then render new ones before the bottom spacer:
		if (!node) {
			node = this.bottomSpacer;
		}
		
		// Render new items:
		offset -= this.renderOffset;
		this.renderItemsBefore(this.listItems.slice(offset, offset+limit), node, this.renderOffset + offset);
		
		this.updateSpacers();
		
	},
	
	/** @private
		Called to remove list items from the DOM.
		While swiping an item to delete it, the delete spacer is in the DOM but has no _mojoListIndex property, so it doesn't
		count as an item.  If the node it's tied to is removed, then it will be "orphaned".
		This function catches that case, and removes the spacer as well.
	*/
	removeListItemNode: function(node) {
		var spacer = node._mojoDeleteSpacer;
		if (spacer && spacer._mojoListIndex === undefined && spacer.parentNode) {
			spacer.remove();
		}
		
		if (node.parentNode) {
			node.remove();
		}
	},
	
	
	/** called when child widgets are re-rendered so that they are told to measure themselves in case of changes **/
	_maybeRemeasureChildWidgets: function() {
		if (this.hasWidgets) {
			if (this.maybeVisible) {
				this.controller.scene.showWidgetContainer(this.controller.element);	
			}
		}
	},
	
	
	subtreeShown: function() {
		
		// Note that this.maybeVisible is not necessarily reliable: it's set to true 
		// anytime us or a parent is shown, but some other ancestor may still be hidden,
		// and in that case we would not be visible even though this flag seems to indicate otherwise.
		// It's maybeVisible=false is intended to be a guarantee that we're NOT visible, whereas
		// maybeVisible=true means that we might (or might not) be visible.
		this.maybeVisible = true;
		
	},
	
	subtreeHidden: function() {
		this.maybeVisible = false;
	},
	
		/** 
		 * @private
		 * Render given item models, insert them into items parent div before the given sibling, and assign a placeholder index.
		 * 
		 * @param {Object} itemModels
		 * @param {Object} beforeNode
		 */
		renderItemsBefore: function renderItemsBefore(itemModels, beforeNode, offset) {
			//Mojo.Timing.resume('list#rendIB');
	//		console.profile('renderItemsBefore');
			var attrs = this.controller.attributes;
			var divFunc = attrs.dividerFunction;
			var content, nullContent;
			var i, formattedObj;
			var itemTemplate = attrs.itemTemplate;
			var renderedItems, itemContent, itemNode, itemModel, modelIndex, formattedModels;
			var confirmedDeletes;
			var hasWidgets = this.hasWidgets;
			var secondaryTemplate = this.controller.attributes.secondaryItemTemplate;
			var avgItemHeight = this.averageItemHeight;
			var nullItemTemplate = this.nullItemTemplate;
			var itemModelsLength = itemModels.length;
			var preventDeleteProperty = this.preventDeleteProperty;
			var listItemsParent = this.listItemsParent;
			var onItemRendered = this.onItemRendered;
			var controllerElement = this.controller.element;
			var swipeToDelete = this.controller.attributes.swipeToDelete;
			var autoconfirmDelete = this.controller.attributes.autoconfirmDelete;
			var contentLength;
			var secondRunFunc;
			var allModels;
			var initPageSize = this._initialPageSize;
			var splitInitialRender  = this.splitInitialRender;

			if (splitInitialRender  && this.isFirstRequest && itemModelsLength > initPageSize) {
				allModels = itemModels;

				itemModels = allModels.slice(0, initPageSize);
				itemModelsLength = itemModels.length;
				//make a second call
				this.isFirstRequest = undefined;
				secondRunFunc = this.renderItemsBefore.bind(this, allModels.slice(initPageSize), beforeNode);
			}
			this.log("renderItemsBefore");

			// Render the given objects iteratively, instantiating child widgets, adding to DOM, etc...
			// We might want to consider applying formatters and calculating the divider string here too.
			renderedItems = [];
			formattedModels = [];
			//Mojo.Timing.resume("list#IBrend");
			//console.log("itemModels " + itemModelsLength);

			for(i=0; i<itemModelsLength; i++) {

				itemModel = itemModels[i];
				if (itemModel === null) {
					nullContent = nullContent || Mojo.View.render({object: {averageItemHeight: avgItemHeight}, template: nullItemTemplate});
					itemContent = nullContent;
					formattedObj = null;
				} else {
					formattedObj = Mojo.Model.format(itemModel, attrs.formatters, false, offset + i);
					itemContent = Mojo.View.render({object: formattedObj, template: itemTemplate});
				}


				if (secondaryTemplate && itemModel) {
					//re-render this
					formattedObj.secondaryContent = itemContent;
					itemContent = Mojo.View.render({object: formattedObj, template: secondaryTemplate});
				}

				formattedModels.push(formattedObj);
				renderedItems.push(itemContent);
			}

			//Mojo.Timing.pause("list#IBrend");
			//Mojo.Timing.resume("list#IBConv");

			// Join item HTML, and convert to a node list all at once 'cause it's much faster.
			content = renderedItems.join('');
			content = $A(Mojo.View.convertToNodeList(content, this.controller.document));

			//Mojo.Timing.pause("list#IBConv");
			//Mojo.Timing.resume("list#IBInsert");

			// Loop through resulting nodes, and process each element node.
			// Since we copy the nodeList into an array (above), we don't need to worry about nodes disappearing as they're inserted into the DOM.
			modelIndex = 0;
			contentLength = content.length;
			//console.log("contentlength " + contentLength);

			for(i=0; i<contentLength; i++) {
				itemNode = content[i];
				if (itemNode && itemNode.nodeType === itemNode.ELEMENT_NODE) {
					itemNode._mojoListIndex = -1;
					itemModel = itemModels[modelIndex];
					formattedObj = formattedModels[modelIndex];
					modelIndex++;

					// Generate divider label, if needed
					if (divFunc && formattedObj) {
						itemNode._mojoListDividerLabel = divFunc(formattedObj);
					}

					listItemsParent.insertBefore(itemNode, beforeNode);
					if (itemModel) {
						itemNode._mojoListItemModel = itemModel; // stash the item model on the element, so it's there for whoever needs it.
						if (preventDeleteProperty) {
							itemNode._ignoreSwipeToDelete = !!itemModel[preventDeleteProperty];
						}
						if (hasWidgets) {
							this.controller.instantiateChildWidgets(itemNode, itemModel);
						}
					}

					// If we have an 'item rendered' function, then call it:
					if (itemModel && onItemRendered) {
						onItemRendered(controllerElement, itemModel, itemNode);
					}

					// If item was deleted, then show the spacer instead:
					if (swipeToDelete && itemModel && this.isModelDeleted(itemModel)) {

						this.replaceWithDeleteSpacer(itemNode);

						// If delete is already confirmed, then it was probably animating to 0 height when we re-rendered the list.
						// We "jump to the end", making it 0-height and saving a reference to it so we can finish the delete process 
						// after we complete rendering.
						if (this.isModelDeleteConfirmed(itemModel) || autoconfirmDelete) {
							itemNode._mojoDeleteSpacer.style.height="0px";
							confirmedDeletes = confirmedDeletes || [];
							confirmedDeletes.push(itemNode._mojoDeleteSpacer);						
						}

					}

				}
			}
		
			//Mojo.Timing.pause("list#IBInsert");

			// Renumber the list items, since we only assigned a placeholder number:
			//Mojo.Timing.resume("list#IBRenum");
			this.renumberListItems();
			//Mojo.Timing.pause("list#IBRenum");

			// Redo dividers, since they might be all wrong now.
			//Mojo.Timing.resume("list#IBDiv");
			this.updateDividers();
			//Mojo.Timing.pause("list#IBDiv");

			//Mojo.Timing.resume("list#IBLC");
			this.updateListClasses();
			//Mojo.Timing.pause("list#IBLC");

	//		console.profileEnd();

			//make sure we send a notification to child widgets that now is an ok time to measure themselves
			//as they are now being drawn
			//Mojo.Timing.resume("list#IBMeasure");
			this._maybeRemeasureChildWidgets();
			//Mojo.Timing.pause("list#IBMeasure");
			//Mojo.Timing.pause('list#rendIB');

			// If we rendered any confirmed deleted items that were not yet removed, go ahead and complete the delete process now.
			if (confirmedDeletes) {
				for(i=0; i<confirmedDeletes.length; i++) {
					this.deleteDraggedItemWithEvent(confirmedDeletes[i]);
				}
			}


			//if there was a deferred function for remaining content call it now
			//clear any previous deferred funcs
			if (secondRunFunc) {				
				if (this.secondRun) {
					this.controller.window.clearTimeout(this.secondRun);
				}
				this.secondRun = this.controller.window.setTimeout(secondRunFunc, 0);
			}
			return;
		},
	

	/**
	 * @private
	 * When shifting our items window, this function takes care of updating only the list DOM elements that need to change.
	 * i.e., it removes the ones pushed out of the render window, renders the new items, and inserts them.
	 * 
	 * @param {Object} delta
	 */
	applyDeltaToListItems: function(delta) {
		var newItems;
		var node;
		var index;
		var count = Math.abs(delta);		
		var loadIndex, insertType, removeIndex, beforeNode, nodeIterator;
		
		this.log("applyDeltaToListItems: ",delta,", new offset: ",(this.renderOffset+delta));
		
		if (count === 0) {
			return;
		}
		
		//Mojo.Timing.resume("list#applyDt");
		//Mojo.Timing.resume("list#dtSetup");
		
		// set up parameters for rest of function, depending on window move direction.
		if (delta > 0) {
			loadIndex = this.renderOffset + delta + this.listItems.length - count;
			insertType = 'push';
			removeIndex = 0;
			nodeIterator = this.findNextListItem;
			
		} else {
			loadIndex = this.renderOffset + delta;
			insertType = 'unshift';
			removeIndex = this.listItems.length - count;
			nodeIterator = this.findPrevListItem;
		}

		
		// Fetch new items we need to render:
		newItems = this.bigItemsList.slice(loadIndex, loadIndex+count, true);
		
		// Remove 'delta' items from beginning, add 'delta' new ones at the end.
		this.listItems.splice(removeIndex, count);
		this.listItems[insertType].apply(this.listItems, newItems);
		
		// Update renderOffset, to match our data:
		this.renderOffset += delta;
		
		//Mojo.Timing.pause("list#dtSetup");
		//Mojo.Timing.resume("list#dtRemove");
		
		// Remove 'delta' item nodes from the beginning:
		for(node = nodeIterator.call(this); node && count > 0; count--) {
			
			// remove the item if it's in our delta range.  Delta's negative when removing items from the end.
			if (node._mojoListIndex < delta || node._mojoListIndex >= this.renderLimit+delta) {
				this.removeListItemNode(node);
			} else {
				break;
			}
			node = nodeIterator.call(this);
		}
		
		//Mojo.Timing.pause("list#dtRemove");
		
		//setup beforeNode after we have possibly removed items from the beginning of the list
		if (delta > 0) {
			beforeNode = this.bottomSpacer;
		} else {
			beforeNode = this.topSpacer.nextSibling;

			// skip the leading divider too, if any.  
			// This'll often save us having to re-render it when scrolling up.
			while(beforeNode.nextSibling && (beforeNode.nextSibling._mojoListDivider || beforeNode.nodeType != beforeNode.ELEMENT_NODE)) {
				beforeNode = beforeNode.nextSibling;
			}
		}
		//correct.
		this.renderItemsBefore(newItems, beforeNode, loadIndex);		
		
		//Mojo.Timing.resume("list#dtSpacers");
		this.updateSpacers();
		//Mojo.Timing.pause("list#dtSpacers");
		//Mojo.Timing.pause("list#applyDt");
	},

	
	/**
	 * @private
	 * Traverses all currently rendered item nodes, applying single/first/last classes as appropriate.
	 */
	updateListClasses: function() {
		var node, count;
		
		if (!this.listItemsParent) {
			return;
		}
		
		// Loop over all item nodes & set list classes properly when appropriate.
		node = this.listItemsParent.firstChild;
		count = 0; // count of items since beginning or the last section divider.
		while(node) {
			
			if (node._mojoListIndex !== undefined) {
				
				// Is this item followed by a divider?
				if (node.nextSibling && node.nextSibling._mojoListDivider) {
					// Yes, give it 'single' or 'last'.
					if (count === 0) {
						this.setListClasses(node, true, false, false);
					} else {
						this.setListClasses(node, false, false, true);
					}
				} else {
					// No divider, give it 'first' or nothing at all.
					if (count === 0) {
						this.setListClasses(node, false, true, false);
					} else {
						this.setListClasses(node, false, false, false);
					}
				}
				
				count++;
				
			} else if (node._mojoListDivider) {
				count = 0;
			}
			
			node = node.nextSibling;
		}
		
		// If we're rendering the first item in the list, make it 'first' or 'single'.
		if (this.renderOffset === 0 && this.bigItemsList.length === 1) {
			node = this.findNextListItem();
			if (node) {
				//if first item in list and no add items after it ||
				if (!this.addItemVisible) {
					this.setListClasses(node, true, false, false);
				} else if (this.addItemVisible && this.addItemNode){
					this.setListClasses(node, false, true, false);
				}
			}
		}
		
		// If we're rendering the last item, and the length > 1, and there's no special 'add' item, then make it 'last'.
		if (this.renderOffset + this.listItems.length === this.bigItemsList.length && 
			this.bigItemsList.length > 1 && !this.addItemVisible) {
			node = this.findPrevListItem();
			if (node) {
				//this node is that last in the list BUT it had a divider directly above it so it is single NOT last
			 	if (node.previousSibling && node.previousSibling._mojoListDivider) {
					this.setListClasses(node, true, false, false);
				} else {
					this.setListClasses(node, false, false, true);
				}
			}
		}
	},
	
	/**
	 * @private
	 * Sets the standard list classes, 'single', 'first', and 'last' on the given item as indicated.
	*/
	setListClasses: function(node, single, first, last) {
		this.twiddleClassName(node, single, '_mojoListSingle', 'single');
		this.twiddleClassName(node, first, '_mojoListFirst', 'first');
		this.twiddleClassName(node, last, '_mojoListLast', 'last');
	},

	/**
	 * @private
	 * Copies the standard list classes, 'single', 'first', and 'last' from the source item to the destination item.
	 * This is used to duplicate the appropriate list classes on dynamically inserted delete spacers.
	*/
	copyListClasses: function(targetNode, srcNode) {
		this.twiddleClassName(targetNode, !!srcNode._mojoListSingle, '_mojoListSingle', 'single');
		this.twiddleClassName(targetNode, !!srcNode._mojoListFirst, '_mojoListFirst', 'first');
		this.twiddleClassName(targetNode, !!srcNode._mojoListLast, '_mojoListLast', 'last');
	},
	
	/**
	 * @private
	 * Applies or removes the given classname depending on the value of 'apply', 
	 * and checks the given property on the node to see if it's necessary.
	 * This lets us avoid the overhead of creating & executing a regexp to 
	 * determine if the class is already present on the node.
	 */
	twiddleClassName: function(node, apply, propName, className) {
		if (apply && !node[propName]) {
			Element.addClassName(node, className);
			node[propName] = true;
		} else if (!apply && node[propName]) {
			Element.removeClassName(node, className);
			delete node[propName];
		}
	},
	
	/**
	 * @private
	 * Runs through the currently rendered list items & dividers, and adds/removes dividers so everything is correct.
	*/
	updateDividers: function updateDividers() {
		var node, curDivider, prevDivider, dupDivider;
		var newDivider, itemModel;
		var template;
		
		
		if (!this.listItemsParent || !this.controller.attributes.dividerFunction) {
			return;
		}
		
		// Kind of a hack: we take the template directly from the attributes whenever possible, 
		// so that apps can modify it when changing views.
		// TODO: We need to decide how to handle things like this in a more consistent manner.
		template = this.controller.attributes.dividerTemplate || this.dividerTemplate;
		
		// Loop through all child nodes, remembering the previous node 
		// if it was a divider, and the last divider node we've seen.
		// When we find an item node, we can then do the right thing removing/inserting dividers.
		// And when we find 2 dividers in a row, 
		node = this.listItemsParent.firstChild;
		while(node) {
			
			// skip all nodes except items & dividers.
			if (node._mojoListIndex !== undefined || node._mojoListDivider) {
				
				// Is it a list item node?
				if (node._mojoListIndex !== undefined) {
					itemModel = this.listItems[node._mojoListIndex];
					
					// ignore items that haven't been loaded yet.
					if (itemModel) {
						
						// If the previous node was a divider, then the label had better match.
						// Otherwise, we remove it.
						// If the returned value for the divider label is undefined, don't draw a divider
						if (node._mojoListDividerLabel !== undefined && prevDivider && prevDivider._mojoListDividerLabel != node._mojoListDividerLabel) {
							prevDivider.parentNode.removeChild(prevDivider);
							prevDivider = undefined;
							curDivider = undefined;
						}
					
						// If there's no current divider, or else the current divider's label doesn't match, 
						// then we insert a new divider.
						// If the returned value for the divider label is undefined, don't draw a divider
						if (node._mojoListDividerLabel !== undefined && (!curDivider || curDivider._mojoListDividerLabel != node._mojoListDividerLabel)) {
							newDivider = Mojo.Model.decorate(itemModel);
							newDivider.dividerLabel = node._mojoListDividerLabel;
							newDivider = Mojo.View.render({object: newDivider, template: template});
							newDivider = Mojo.View.convertToNode(newDivider, this.controller.document);
							newDivider._mojoListDividerLabel = node._mojoListDividerLabel;
							newDivider._mojoListDivider = true;
							this.listItemsParent.insertBefore(newDivider, node);
							curDivider = newDivider;
						}
					}
				}
				
				// Is it a divider?
				if (node._mojoListDivider) {
				
					// Dividers before dividers get removed.
					if (prevDivider) {
						prevDivider.parentNode.removeChild(prevDivider);
					}
					
					// If this divider duplicates the one already in effect, then we remove it.
					if (curDivider && curDivider._mojoListDividerLabel === node._mojoListDividerLabel) {
						dupDivider = node;
						node = node.previousSibling; // so we're at the right node after this iteration
						dupDivider.parentNode.removeChild(dupDivider);
					} else {
						curDivider = node;
						prevDivider = curDivider;
					}
				} else {
					prevDivider = undefined;
				}
			}

			node = node.nextSibling;
		}
		
		//check that the last divider was dealt with
		//since we look at dividers in terms of the items that come after them, if there is no item after the last divider
		//then we need to deal with removing it separately
		//the cur divider in this case is the result of setting curDivider to the node being examined
		if (curDivider && (!curDivider.nextSibling || curDivider.nextSibling._mojoListIndex === undefined)) {
			curDivider.remove();
		}
	},
	
	
	
	/**
	 * @private
	 * Renumbers list items underneath our parent div.
	 * Each item with an existing _mojoListIndex property are numbered in 
	 * document order starting from 0.
	 */
	renumberListItems: function() {
		var i=0;
		var node = this.listItemsParent.firstChild;
		
		while(node) {
			if (node._mojoListIndex !== undefined) {
				
				// If we're reordering, then it's possible our dummy node was removed from the DOM 
				// when the user scrolled away, and then re-rendered again later, when they scrolled 
				// back.  So we may need to re-insert it.  We catch this case by comparing the 
				// absolute index of our dummy node, while renumbering the items.
				if (this.reorderDummyNode && this.reorderDummyNode !== node && 
					this.reorderDummyNode._mojoAbsoluteListIndex === this.renderOffset+i) {
					node.parentNode.replaceChild(this.reorderDummyNode, node);
					node = this.reorderDummyNode;
				}
				
				node._mojoListIndex = i;
				i++;
			}
			node = node.nextSibling;
		}
	},
	
	/* @private */
	handleModelChanged: function() {
		this.log("List: handleModelChanged");
		this.renderOffset = 0;
		this.savedScrollPos = {};
		this.listItems.clear();
		this.listItemsParent = undefined;
		this.controller.element.innerHTML='';
		
		this.setupBigList();
		this.updateSpacers();
		this.log("List: handleModelChanged done.");
		
		//we had an update, so better resize the scroller
		if (this.scroller && this.scroller.mojo) {
			this.scroller.mojo.validateScrollPosition();
		}
	},
	
	
	/**
	 * @private
	 * Given a DOM node for a list item, find the next one.
	 * Returns the first item if passed undefined/null.
	 * Returns null if passed the last one in the list.
	 * 
	 * @param {Object} node
	 */
	findNextListItem: function(node, skipReorderDummy) {
		if (!this.listItemsParent) {
			return null;
		}
		node = node ? node.nextSibling : this.listItemsParent.firstChild;
		while(node && (node._mojoListIndex === undefined || (skipReorderDummy && node === this.reorderDummyNode))) {
			node = node.nextSibling;
		}
		return node;
	},
	

	/**
	 * @private
	 * Given a DOM node for a list item, find the previous one.
	 * Returns the last item if passed undefined/null.
	 * Returns null if passed the first one in the list.
	 *  
	 * @param {Object} node
	 */
	findPrevListItem: function(node, skipReorderDummy) {
		if (!this.listItemsParent) {
			return null;
		}
		node = node ? node.previousSibling : this.listItemsParent.lastChild;
		while(node && (node._mojoListIndex === undefined || (skipReorderDummy && node === this.reorderDummyNode))) {
			node = node.previousSibling;
		}
		return node;
	},
	
	

	/**
	 * @private
	 * Find the data object associated with the part of the DOM subtree that 
	 * includes the event target.
	 * 
	 * @param {Object} event
	 * @returns undefined if the event target is not within a list item.
	 */
	_findDataObj: function(event) {
		var index = Mojo.Widget.Util.findListItemIndex(event, this.listItemsParent);
		
		if (index === undefined) {
			return undefined;
		}
		
		return this.listItems[index];
	},
	
	
	
	
	/* 
		==================
		= Event Handling =
		==================
	*/
	
	
	/**
	 * @private
	 * Handler for tap events.  
	 * Implements listTap events, the 'add' item, and delete spacer button handling.
	 */
	handleTap: function(event) {
		var index, dataObj, node, isAddNode;
		
		// Don't handle taps on text fields, or else they don't function.
		if (Mojo.View.isTextField(event.target)) {
			return;
		}
		
		//this may be the "add items" item which is NOT a list node with data but IS still valid
		isAddNode = (event.target ? (event.target.getAttribute('name') === "palm-add-item") : false);
		
		// Don't handle taps on delete spacers or partially swiped items:
		node = Mojo.Widget.Util.findListItemNode(event.target, this.listItemsParent);
		if (!isAddNode && (!node || node._mojoDeletedListNode || node._mojoSwipeDeleteDragger)) {
			return;
		}
		
		// Find index & item model corresponding to the tapped element.
		if (node) {
			index = node._mojoListIndex;
			if (index !== undefined) {
				dataObj = this.listItems[index];
			}
		}
		
		
		// If we found an item model for this tap event, send a listTap event.
		if (dataObj) {
			Event.stop(event);
			Mojo.Event.send(this.controller.element, Mojo.Event.listTap, 
						{model:this.controller.model, item:dataObj, index: index + this.renderOffset, originalEvent:event});				
		}
		// Was it in the add item?  Send a listAdd event.
		else if (isAddNode) {
			Event.stop(event);
			Mojo.Event.send(this.controller.element, Mojo.Event.listAdd, {model:this.controller.model, originalEvent:event});
		} 
				
	},
	
	/**
	 * @private
	 * Handler for change events, simply converts them into the appropriate listChange events.
	 */
	handleChange: function(event) {
		var index = Mojo.Widget.Util.findListItemIndex(event, this.listItemsParent);
		var dataObj;
		
		if (index !== undefined) {
			dataObj = this.listItems[index];
		}
		
		if (dataObj) {
			Event.stop(event);
			Mojo.Event.send(this.controller.element, Mojo.Event.listChange, 
						{model:this.controller.model, item:dataObj, index: index + this.renderOffset, originalEvent:event});
		}
	},
	
	/**
	 * @private
	 * When items are lazily loaded, this allows us to delay the initial scene transition until we have items loaded.
	 */
	aboutToActivate: function(event) {
		// lazySetupComplete is set when our size is set and/or we receive some items (updateItems or addItems).
		// this means the async service request for items has been completed, and so it's now safe to begin the scene transition.
		// If we try to activate before this happens, we get a wrapped function from the synchronizer in order to delay the transition.
		if (!this.lazySetupComplete) {
			this.activateContinuationFunc = event.synchronizer.wrap(Mojo.doNothing);
		}
		
		Mojo.stopListening(this.controller.scene.sceneElement, Mojo.Event.aboutToActivate, this.aboutToActivate);
	},
	

	/**
	 * @private
	 * Handler for scrollStart events, used to add us as a listener on the 
	 * scroller, when we need to dynamically load items.
	 * @param {Object} event
	 */
	addAsScrollListener: function(event) {
		event.scroller.addListener(this);
	},
	

	/**
	 * @private
	 * Event handler for dragStart events.
	 * This is used to start drag'n'drop operation for swipe-to-delete.
	 * 
	 * @param {Object} event
	 */
	dragStartHandler: function(event) {
		var node;
		
		// If swipeToDelete's been turned off, then don't do anything.
		if (!this.controller.attributes.swipeToDelete) {
			return;
		}

		if (Math.abs(event.filteredDistance.x) > 2*Math.abs(event.filteredDistance.y)) {
			
			// This will only return items with _mojoListIndex set, so we don't need to worry about stuff being reordered, or other nodes in the list.
			node = Mojo.Widget.Util.findListItemNode(event.target, this.listItemsParent);
			
			if (node && !node._ignoreSwipeToDelete) {
				// Don't allow swiping of delete spacers or items which are animating back into place.
				if (!node._mojoDeletedListNode && !node._mojoSwipeDeleteDragger) {
	//				this.swipeDeleteNode = node;
	//				node.addEventListener(Mojo.Event.flick, this.flickDeleteHandler, false);
				
					// Remove any top-level tap highlight before we start applying the drag styling, etc., to this node:
					node.removeClassName(Mojo.Gesture.kSelectedClassName);
				
					// hack so we can consistently test for this property to tell if the element is being dragged in a delete gesture.
					// The issue was that it wasn't set until after startDragging returned, which was AFTER we get the dragEnter.
					node._mojoSwipeDeleteDragger = true; 
					node._mojoOriginalHeight = Element.getHeight(node);
				
					node._mojoSwipeDeleteDragger = Mojo.Drag.startDragging(this.controller.scene, node, event.down, 
									{preventVertical:true, 
										draggingClass: this.kDeleteDragClass, 
										preventDropReset:true});
				
					event.stop();
				}
			}
		}
	},
	
	/**
	 * @private
	 * Hold event handler.
	 * This is what causes us to start reordering an item.
	 *  
	 * @param {Object} event
	 */
	holdHandler: function(event) {    
		var dragger, node, dummyNode;
		
		// If hold was on a list item, and not a delete-spacer, then reorder it!
		node = Mojo.Widget.Util.findListItemNode(event.target, this.listItemsParent);
		if (node && !node._mojoDeletedListNode) {
			
			Element.removeClassName(node, 'selected');
			
			// The item may be dragged way out of the loaded items window, 
			// so we need to calculate the absolute list index, and stash it on the element.
			node._mojoAbsoluteListIndex = node._mojoListIndex + this.renderOffset;
			
			// Create a "dummy" element to keep the list items in a consistent state, 
			// while we pick up the held one and drag it around.
			dummyNode = this.controller.document.createElement('div');
			dummyNode.style.height='0px';
			this.listItemsParent.insertBefore(dummyNode, node);
			
			dummyNode._mojoListIndex = node._mojoListIndex;
			dummyNode._mojoListItemModel = node._mojoListItemModel;
			dummyNode._mojoAbsoluteListIndex = node._mojoAbsoluteListIndex;
			
			// Save a reference to the dummy node, since it may be removed if its 
			// scrolled out of the render window and need to be re-inserted later.
			this.reorderDummyNode = dummyNode;
			
			// This is won't be valid for long, since the window may move, so remove it from the element.
			// Note that this also means findNextListItem(), etc., will no longer return this item.
			node._mojoListIndex = undefined;
			
			// used as a flag so the spacer starts full-height.
			this.beginningReorder = true;
			
			dragger = Mojo.Drag.startDragging(this.controller.scene, node, event.down, 
							{preventHorizontal:true, allowExit:!!this.dragDatatype, 
								draggingClass: this.kReorderDragClass, 
								dragDatatype:this.dragDatatype, autoscroll:true});
			
			// Modify marginLeft after startDragging(), so the drag system will remove it again on drop.
			node.style.marginLeft='6px';
		}
		
		// Don't stop the hold event, since we count on the 'tap' to indicate that a drag is not coming after all.
		// Event.stop(event);
	},
	
	
	
	/* 
		=======================
		= Drag'N'Drop support =
		=======================
		
		This is the "drag client" interface implementation, used for list reordering and swipe-to-delete.
		Private routines in here are drag'n'drop support stuff for handling spacer divs, etc.
	*/
	
	
	/**
	 * @private
	 * Called when we begin dragging one of our items.
	 * This is really only needed when we're doing an item-reorder drag,
	 * but it's called (and harmless) in the swipe case as well.
	 * 
	 * @param {Object} el
	 */
	dragEnter: function(el) {
		// this.log("Dragging item "+el._mojoListIndex);
		var elHeight;
		
		if (this.controller.attributes.fixedHeightItems) {
			elHeight = this.averageItemHeight;
		} else {
			elHeight = el.getHeight();
		}
		this.dragHeight = elHeight;
		this.dragAdjNode = undefined;
		
		// Insert correct type of spacer, depending on whether we're reordering items or deleting them.
		if (el._mojoSwipeDeleteDragger) {
			this.handleSwipeDeleteEnter(el);
		} else { 
			// If the element is in our list, we can save a lot of time looking for the correct adjacent item
			//  by beginning the search at the item itself.  Unfortunately, this won't work when the item is 
			// not in the list.
			if (el.parentNode === this.listItemsParent) {
				this.dragAdjNode = el.nextSibling;
			}
			
			this.dragAdjNode = this.findAdjacentDragNode(el, -elHeight/2);
			
			// use 'normal' reorder spacer:
			this.addSpacerBeforeNode(this.dragAdjNode, this.beginningReorder);
			this.beginningReorder = undefined;
		}
		
	},

	/**
	 * @private
	 * describe this...
	 * 
	 * @param {Object} el
	 */
	dragHover: function(el) {
		var newAdj;
				
		if (!el._mojoSwipeDeleteDragger) {
			newAdj = this.findAdjacentDragNode(el);
			if (newAdj && newAdj !== this.dragAdjNode) {
				this.dragAdjNode = newAdj;
				this.addSpacerBeforeNode(newAdj);
			}
		}
		
	},

	
	/**
	 * @private
	 * describe this
	 * 
	 * @param {Object} el
	 * @param {boolean} newItem is true if the dropped item originally came from a different container.
	 */
	dragDrop: function(el, newItem) {
		var newPos;
		var oldPos;
		var itemModel, items;
		var listEvent;
	//	this.log("got drop: "+oldPos );
		
		this.removeReorderDummyNode();
		
		// If this was a swipe-to-delete, then we can skip the rest of this routine after cleaning up.
		if (el._mojoSwipeDeleteDragger) {
			this.handleSwipeDeleteDrop(el);
			return;
		}
		
		oldPos = el._mojoAbsoluteListIndex;
		newPos = this.findDroppedIndex()+this.renderOffset;
	//	this.log("got drop: "+oldPos+" to "+ newPos );
		
		delete el._mojoAbsoluteListIndex; // since it's only valid while reordering
		
		
		if (this.curDragSpacer) {
			this.curDragSpacer.parentNode.replaceChild(el, this.curDragSpacer);
			this.curDragSpacer = undefined;
		}
		
		if (oldPos === undefined) {
			return;
		}
		
		
		
		// If the item came from a different container, we send a listAdd event, and specify the itemModel & index.
		// Default behavior for the event adds the item model to our list.
		if (newItem) {
			listEvent = Mojo.Event.send(this.controller.element, Mojo.Event.listAdd, 
						{model:this.controller.model, item:el._mojoListItemModel, index:newPos});
			
			if (!listEvent.defaultPrevented) {
				this.noticeAddedItems(newPos, [el._mojoListItemModel]);
				// TODO: If we're not dynamically loaded, modify the original array.
			}
		}
		// Otherwise, if it moved in this container, then move the item's model object around in the listItems array: 
		else {
			
			// The positions are set up so that newPos is the new index of the element after it has been removed/reinserted.
			// So, if it's moving only within this container, then we need to tweak newPos to take into account that it's moving from oldPos.
			if (newPos > oldPos) {
				newPos--;
			}
			
			// assign listIndex, since it was previously set to undefined while being reordered.
			el._mojoListIndex = newPos - this.renderOffset;
			
			// Renumber items, so they're correct.  
			// This helps guarantee that the scroll-position-maintaining code won't screw things up due to inconsistent item numbering.
			this.renumberListItems();
			
			if (oldPos != newPos) {
				// Send a mojo-list-reorder event, so the move can be persisted.
				Mojo.Event.send(this.controller.element, Mojo.Event.listReorder, 
								{model:this.controller.model, item:el._mojoListItemModel, 
									fromIndex:oldPos, toIndex:newPos});
			
				// Refresh ourselves.
				if (this.bigItemsList.reorderItem(oldPos, newPos)) {
					this.updateListItems();
				}
			}
		}
		
	},
	
	
	/**
	 * @private
	 * Called when an item is dragged out of the list, and dropped on another list.
	 *  
	 * @param {Object} el
	 */
	dragRemove: function(el) {
		this.removeReorderDummyNode();
		
		// Send delete event, etc., to remove the item from this list.
		this.deleteItemWithEvent(el, undefined);
	},
	
	
	/**
	 * @private
	 * Called when an item is dragged out of the list, for lists that allow it.
	 *  
	 * @param {Object} el
	 */
	dragLeave: function(el) {
		this.log("got leave");
		this.removeCurDragSpacer();
	},
	
	/**
	 * @private 
	 * Animates current drag spacer to 0 height and removes it from the DOM.
	 */
	removeCurDragSpacer: function() {
		var f, spacer;
		
		spacer = this.curDragSpacer;
		this.curDragSpacer = undefined;
		
		if (spacer) {
			f = function(el){
				if (el.parentNode) {
					el.remove();
				}
			};
			
			Mojo.Animation.animateStyle(spacer, 'height', 'ease-out', {from: this.dragHeight, to: 0, duration: 0.1, onComplete:f});
		}
		
	},
	
	/** @private
		Removes the 0-height dummy node used during item reordering, if it exists.
	*/
	removeReorderDummyNode: function() {
		var node = this.reorderDummyNode;
		
		if (node && node.parentNode) {
			node.remove();
		}
		
		delete this.reorderDummyNode;
	},
	
	/**
	 * @private 
	 * Adds a drag spacer before the given node.
	 * When adding the initial spacer, we dont want to animate it from 0 
	 * height, so startFullHeight is true.
	 * 
	 * @param {Object} adjacentNode
	 * @param {Object} startFullHeight
	 */
	addSpacerBeforeNode: function(adjacentNode, startFullHeight) {
		var spacer;
		var heightNodes;
		var i, height;
		
		this.removeCurDragSpacer();
		
		// Lazy initialization of the reorder spacer node:
		if (!this.reorderTemplateNode) {
			this.reorderTemplateNode = Mojo.View.convertToNode(	
											Mojo.View.render({template: Mojo.Widget.getSystemTemplatePath("list/spacer-item")}),
											this.controller.document);
		}
		
		spacer = this.reorderTemplateNode.cloneNode(true);
		
		heightNodes = spacer.querySelectorAll("div[x-mojo-set-height]");
		height=this.dragHeight+'px';
		for(i=0; i<heightNodes.length; i++) {
			heightNodes[i].style.height=height;
		}
		
		// this is triggered on teh initial hold event, since we need to skip the growing animation in that case.
		if (startFullHeight) {
			spacer.style.height = this.dragHeight+'px';
		}		
		
		this.listItemsParent.insertBefore(spacer, adjacentNode);
		
		if (!startFullHeight) {
			spacer.style.height = '0px';
			Mojo.Animation.animateStyle(spacer, 'height', 'ease-out', {from: 0, to: this.dragHeight, duration: 0.1});			
		}
		
		this.curDragSpacer = spacer;
	},
	
	
	/**
	 * @private
	 * Searches sibling nodes, starting from the current adjacent node,
	 * looking for a possible better-fit adjacent node.
	 *  
	 * @param {Object} el
	 * @param offset pixel value to offset spacer calculations.  Used to correct things on dragEnter, since there is no spacer.
	 */
	findAdjacentDragNode: function(el, offset) {
		var elY = el.offsetTop + (this.dragHeight/2) + (offset || 0);
		var foundNode;
		var curNode = this.findPrevListItem(this.dragAdjNode, true);
		
		// Search back in the list of child nodes, in case we should be before any of those nodes:
		while(curNode) {
			// skip the element being dragged
			if (curNode !== el) {
				// if our midpoint is below the quarter point, then we're done searching back.
				if (elY > curNode.offsetTop + (curNode.offsetHeight * 0.25)) {
					break;
				}
				foundNode = curNode;
			}
			curNode = this.findPrevListItem(curNode, true);
		}
		
		// Return new adjacent node, if we found one.
		if (foundNode) {
			return foundNode;
		}
		
		// Alternatively search forward in the list of sibling nodes instead.
		curNode = this.dragAdjNode;
		while(curNode) {
			if (curNode !== el) {
				// if our midpoint is above its 3/4 point, then we're done searching forwards.
				if (elY < curNode.offsetTop + (curNode.offsetHeight * 0.75)) {
					break;
				}
				foundNode = curNode; // otherwise, it should at least go AFTER this node.
			}
			curNode = this.findNextListItem(curNode, true);
		}
		
		// Since we need to return the item AFTER the insertion spot, 
		// we need to 'advance' this node one more time before returning it.
		if (foundNode) {
			return this.findNextListItem(foundNode, true) || this.addItemNode || this.bottomSpacer;
		}
		
		// The only case where we find no adjNode when we don't already have a valid one is 
		// when the last item is being dragged.  So we return the addItem/bottomSpacer for that case.
		return this.dragAdjNode || this.addItemNode || this.bottomSpacer;
	},
	

	/**
	 * @private
	 * Uses the position of the curDragSpacer, relative to its sibling elements,
	 * to determine & return the new index of the given dropped item.
	 *  
	 * @param {Object} el
	 */
	findDroppedIndex: function(el) {
		var index = 0;
		var nextNode = 0;
		
		if (this.curDragSpacer) {
			nextNode = this.findNextListItem(this.curDragSpacer);
			if (nextNode) {
				index = nextNode._mojoListIndex;
			} else {
				nextNode = this.findPrevListItem(this.curDragSpacer);
				if (nextNode) {
					index = nextNode._mojoListIndex+1;
				}
			}
		}
		
		
		return index;		
	},
	
	
	/* 
	========================
	= swipe-delete support =
	========================
	*/

	
	/**
	 * @private
	 * Returns true if the given item has been marked as deleted (swiped by the user).  
	 * It may be in the confirm spacer state, or animating between states around it.
	 * 
	 * @param {Object} itemModel
	 */
	isModelDeleted: function(itemModel) {
		var uniqueVal, val;
		if (this.uniquenessProperty !== undefined) {
			uniqueVal = itemModel[this.uniquenessProperty];
			return !!this._deletedItems[uniqueVal];
		}
		
		val = itemModel[this.deletedProperty];
		return (val === this.deleteTruth || val === this.kDeletedItemConfirmed);
	},
	
	/** @private */
	isModelDeleteConfirmed: function(itemModel) {
		var uniqueVal;
		if (this.uniquenessProperty !== undefined) {
			uniqueVal = itemModel[this.uniquenessProperty];
			return this._deletedItems[uniqueVal] === this.kDeletedItemConfirmed;
		}
		
		return (itemModel[this.deletedProperty] === this.kDeletedItemConfirmed);
	},
	
	/**
	 * @private
	 * Marks or unmarks the given item as deleted (swiped by the user).
	 * 
	 * @param {Object} itemModel
	 */
	markModelDeleted: function(itemModel, deleteState) {
		var uniqueVal;
		
		if (!itemModel) {
			return;
		}
		
		// In order to not break the folks who don't specify 'uniquenessProperty', we 
		// continue to support two schemes for tracking deleted items.  We use a hash 
		// to remember them if we have a uniquenessProperty, and continue to mark the item
		// models themselves otherwise.
		if (this.uniquenessProperty !== undefined) {
			uniqueVal = itemModel[this.uniquenessProperty];
			if (deleteState) {
				this._deletedItems[uniqueVal] = deleteState;
			} else {
				delete this._deletedItems[uniqueVal];
			}
		} else {
			
			if (deleteState === this.kDeletedItemSwiped) {
				deleteState = this.deleteTruth;
			}
			itemModel[this.deletedProperty] = deleteState;
			
			// send a property change event for the app, but only if we're not setting this to 'confirmed'.
			// We never used to send out a propertyChange event for 'confirmed', so this reduces the risk of introducing bugs,
			// and now that we have 'uniquenessProperty' apps should never need to persist the deleted property, so 
			// the propertyChange event shouldn't be needed anyways.  But we'll leave it in for now to preserve compatibility.
			if (deleteState !== this.kDeletedItemConfirmed) {
				Mojo.Event.send(this.controller.element, Mojo.Event.propertyChange,
					{ property: this.deletedProperty,
						value: itemModel[this.deletedProperty],
						model: itemModel
					});				
			}
		}
	},
	
	/**
	 * @private
	 * Removes a deleted item from our hash, while guaranteeing that we won't send a 
	 * pointless propertyChange event for a deleted item like calling markModelDeleted()
	 * would do.
	 * 
	 * @param {Object} itemModel
	 */
	purgeItemMark: function(itemModel) {		
		if (this.uniquenessProperty !== undefined) {
			this.markModelDeleted(itemModel, this.kDeletedItemCancelled);
		} else {
			itemModel[this.deletedProperty] = this.kDeletedItemCancelled;
		}
	},

	
	/**
	 * @private
	 * describe this...
	 * 
	 * @param {Object} el
	 */
	handleSwipeDeleteEnter: function(el) {		
		this.insertDeleteSpacer(el);

		// Save original absolute position, to aid animation.
		el._mojoOrigOffsetLeft = el.offsetLeft;
		
	},
	
	queueSwipeToDeleteElem: function(el) {
		this.swipeToDeleteQueue.push(el);
	},
	
	execSwipeToDeleteElem: function(el) {
		var completionArray, i;
		var swipeDeleteQueue = this.swipeToDeleteQueue;
		var idx = swipeDeleteQueue.indexOf(el);

		if (idx !== -1) {
			completionArray = swipeDeleteQueue.splice(0, idx+1);
			
			for(i = 0; i < completionArray.length; i++) {
				this.completeSwipeDelete(completionArray[i], false);
			}
		}
	},
	
	

	/**
	 * @private
	 * describe...
	 * 
	 * @param {Object} el
	 */
	handleSwipeDeleteDrop: function(el) {
		var f;
		var delta = el.offsetLeft - el._mojoOrigOffsetLeft;
		var inPos, outPos, deleteThreshold;
		
		inPos = el._mojoOrigOffsetLeft;
		outPos = delta > 0 ? 640 : -640; // move extra-far off screen in order get the right velocity.
//		outPos = delta > 0 ? 320 : -320;
		
		// Was it dragged enough?
		// This is a cheap way to check if it was dragged about 3/4 of the width of the screen, 
		// it does not properly account for borders in the list container.
		deleteThreshold = this.controller.window.innerWidth * 0.65;
		if (Math.abs(delta) > deleteThreshold) {
			
			// In order to ensure that confirmations can't come out of order, we 
			// adjust the start & end points of the animation here, so the animations
			// are always the same duration.
			inPos = el.offsetLeft;
			if (delta > 0) {
				outPos = inPos + (outPos - deleteThreshold);
			} else {
				outPos = inPos + (outPos + deleteThreshold);
			}
			
			// It was dragged far enough, so animate out & continue the delete operation.
			f = this.execSwipeToDeleteElem.bind(this, el);
			this.queueSwipeToDeleteElem(el);
			
			// Original duration
			// Mojo.Animation.animateStyle(el, 'left', 'ease-in', {from: inPos, to: outPos, duration: 0.4, onComplete:f});
			
			// Modified to match new start location, so the effective duration is the same as before:
			 Mojo.Animation.animateStyle(el, 'left', 'ease-in', {from: inPos, to: outPos, duration: 0.27, onComplete:f});
			
			// Adjusted for the '320' target values (swapped line above) to 
			// to keep the duration the same as when we were animating to 640, since that's wasteful:
			// Mojo.Animation.animateStyle(el, 'left', 'ease-in', {from: inPos, to: outPos, duration: 0.07, onComplete:f});
			// Mojo.Animation.animateStyle(el, 'left', 'linear', {from: inPos, to: outPos, duration: 0.07, onComplete:f});
			
			
			
			// Immediately mark the item swiped.
			// It's valuable to do this as soon as possible, since that will ensure 
			// the swipe is remembered if the item is re-rendered.
			this.markModelDeleted(el._mojoListItemModel, this.kDeletedItemSwiped);
			
			// We don't confirm here when 'autoconfirm' is set, because 'el' is not ready to delete yet.
			// We must wait for the end of the current animation.  But confirming other stuff is okay.
			if (!this.controller.attributes.autoconfirmDelete) {
				this.confirmOtherDeletes(el._mojoDeleteSpacer);
			}
		} else {
			// nope, animate back into place & cancel the delete.
			f = this.completeSwipeDelete.bind(this, el, true);
			Mojo.Animation.animateStyle(el, 'left', 'ease-out', {from: outPos, to: inPos, duration: 0.25, onComplete:f});
		}
				
		delete el._mojoOrigOffsetLeft;
	},


	/**
	 * @private
	 * Called when the swipe-delete animation is completed.
	 * Sets up the item state so that either everything is returned to normal
	 * (item was not dragged far enough to delete it) or else, the item is 
	 * hidden, and a confirm/undo spacer is visible in its place.  
	 * The arguments are bound ahead of time.
	 *  
	 * @param {Object} el
	 * @param {Object} cancelled
	 */
	completeSwipeDelete: function(el, cancelled) {
		var deleteSpacer;
		
		// In either case, we want the element in 'normal mode' now.
		el._mojoSwipeDeleteDragger.resetElement();			
		delete el._mojoSwipeDeleteDragger;
		
		// If swiped element is no longer in the DOM, then we treat it like it wasn't dragged far enough.
		if (cancelled || el.parentNode !== this.listItemsParent) {
			deleteSpacer = el._mojoDeleteSpacer;
			if (deleteSpacer.parentNode) {
				deleteSpacer.remove();
			}
			delete el._mojoDeleteSpacer;
		} else {
			
			// Replace item with a delete spacer, asking for confirmation.
			// This leaves _mojoDeletedListNode set on the spacer, so we know it's ready for confirmation.
			this.replaceWithDeleteSpacer(el);
			
			// Confirm the delete immediately, if we're set to autoconfirm.
			if (this.controller.attributes.autoconfirmDelete) {
				this.confirmDelete(el._mojoDeleteSpacer);
			} else {
				// Make a SECOND pass, confirming other deletes.  
				// This catches the case where the exit animation was not finished when we previously 
				// tried to confirm some other delete, and without this, we'd have two delete confirmation
				// spacers showing simultaneously.  With the next revision of the swipe delete behavior,
				// this logic should be able to get much simpler, since we won't need to wait for an "exit"
				// animation to finish before confirming a delete.
				this.confirmOtherDeletes(el._mojoDeleteSpacer);
			}
		}

	},
	
	/**
	 * @private
	 * Confirm the first deleted item in the currently rendered list.
	 * 'newDeleteSpacer' is optional.  If provided, that element will be ignored.  
	 * This is how the "confirm the first delete when the second item is swiped"
	 * functionality is implemented.
	 */
	confirmOtherDeletes: function(newDeleteSpacer) {
		var deleteSpacer;
		
		// Search for a delete spacer other than the newly deleted one (unless it was assigned above), and confirm it if we find one.
		// This loop actually takes about 12ms in a 100 list of emails, so we may want to consider being smarter about it at some point.
		deleteSpacer = this.findNextListItem();
		while(deleteSpacer) {
			if (deleteSpacer !== newDeleteSpacer && deleteSpacer._mojoDeletedListNode) {
				this.confirmDelete(deleteSpacer);
			}
			deleteSpacer = this.findNextListItem(deleteSpacer);
		}
		
	},
	
	
	/** @private 
		Animates item to 0 height, and then calls deleteItemWithEvent().
	*/
	confirmDelete: function(deleteSpacer) {
		var border;
		var model = deleteSpacer._mojoDeletedListNode._mojoListItemModel;
		
		// In order to confirm, model must be marked deleted but not confirmed.
		// This may help us avoid the chance of deleting the wrong item, or deleting the same one twice.
		if (!this.isModelDeleted(model) || this.isModelDeleteConfirmed(model)) {
			return;
		}
		
		// Mark this item as confirmed, so we don't try to delete it twice, or re-render it full-height.
		this.markModelDeleted(model, this.kDeletedItemConfirmed);
		
		// NOTE: This animation code must work with both the standard delete spacers, and also the reorder drag-spacer (since we use it when autoconfirmDelete is true).
		// TODO: We should clean up the way this works, for example consider doing animation solely with border-width.
		// It may be worth using different animation code for the different spacer types, too.
		Mojo.Animation.animateStyle(deleteSpacer, 'height', 'linear', {from: deleteSpacer.offsetHeight, to: 0, duration: 0.15, onComplete:this.deferDeleteItemWithEvent.bind(this, deleteSpacer)});
		
	},
	
	/** @private
		Defers the actual delete operation, which can be time consuming, so the "shrink" animation has a chance to be completed on-screen.
		Otherwise, there's a freeze before the last frame is drawn.
	*/
	deferDeleteItemWithEvent: function(deleteSpacer) {
		this.deleteDraggedItemWithEvent.bind(this, deleteSpacer).defer();
	},
	
	/**
	 * @private
	 * Called for tap events on delete-spacers.
	 *  
	 * @param {Object} event
	 * @param {Object} el is the real element being deleted (not the spacer).
	 */
	handleSwipeDeleteTap: function(event, itemNode) {
		var buttonNode, action;
		var itemModel;
		
		Event.stop(event);
		
		buttonNode = Mojo.View.findParentByAttribute(event.target, undefined, this.kListDeleteCmdAttr);
		action = buttonNode && buttonNode.getAttribute(this.kListDeleteCmdAttr);
		
		// Skip this if the tap wasn't on an action button.
		if (action !== "undo" && action !== "delete") {
			return;
		}
		
		// Do the right thing, depending on which action button was tapped.
		if (action === "undo") {
			// return item to normal & remove the delete spacer.
			this.cleanupSwipeDelete(itemNode);
			
			// Just have to clear the deleted flag, and send a propertyChange event.
 			// 'clear' in this instance means to set it to false if a deletedProperty was specified, or remove it otherwise,
			// so we don't leave little custom property turds sitting around in peoples model objects.
			itemModel = this.listItems[itemNode._mojoListIndex];
			this.markModelDeleted(itemModel, this.kDeletedItemCancelled);
			
		} else if (action === "delete") {
			this.confirmDelete(itemNode._mojoDeleteSpacer);
		}
		
	},
	
	
	deleteDraggedItemWithEvent: function(deleteSpacer) {
		var itemNode;
		var ancestor;
		
		// As a safety, we check to make sure the element hasn't been removed from the DOM before deleting.
		// If it HAS, then it means that some other list API was called during the brief animation time, and
		// this could have invalidated the index.
		ancestor = deleteSpacer.parentNode;
		while(ancestor && ancestor !== this.controller.scene.document) {
			ancestor = ancestor.parentNode;
		}
		
		// Do not perform actual delete operation if the element has been removed from the DOM by the time the animation is complete.
		// It will be re-rendered as deleted if appropriate, and the process can begin again.
		if (!ancestor) {
			return;
		}
		
		itemNode = deleteSpacer._mojoDeletedListNode;
		this.cleanupSwipeDelete(itemNode);
		this.deleteItemWithEvent(itemNode);
	},
	
	
	/**
	 * @private
	 * Given item node, deletes the item by sending a delete event,
	 * and providing default removal behavior.
	 * origEvent may be undefined when deletes are auto-confirmed.
	 */
	deleteItemWithEvent: function(el, origEvent) {
		var deleteEvent;
		
		// remove item from our hash of deleted stuff
		this.purgeItemMark(el._mojoListItemModel);
		
		// Send the listDelete event:
		deleteEvent = Mojo.Event.send(this.controller.element, Mojo.Event.listDelete, 
						{model:this.controller.model, item:el._mojoListItemModel, 
							index: el._mojoListIndex+this.renderOffset, 
							originalEvent:origEvent});

		// If nobody called preventDefault() on the event, then we remove the item cleanly.  
		// This allows us to update the list without re-rendering (due to a modelChanged()), so we won't interfere with another
		// swipe-delete if the confirming mousedown was intended to begin one.
		// This is cleaner than simply exposing an API to let the app tell us to cleanly remove an item... 
		// The app should modify the model in response to this event, so in theory we could call modelChanged(this.controller.model, this),
		// and we STILL would not have to re-render, but any other widgets using this model would be updated properly.
		// Use of preventDefault() is supported to allow the app to provide it's own deletion code... it is not intended to prevent deletion of the item.
		if (!deleteEvent.defaultPrevented) {
			this.noticeRemovedItems(el._mojoListIndex+this.renderOffset, 1);
		}
	},
	
	
	/**
	 * @private
	 * Inserts a delete spacer before the given item node from the DOM.
	 * 
	 * @param {Object} itemNode
	 */
	insertDeleteSpacer: function(itemNode) {
		var spacer = this.deleteTemplateNode.cloneNode(true);
		var heightNodes, i, height;
		this.listItemsParent.insertBefore(spacer, itemNode);
		itemNode._mojoDeleteSpacer = spacer;
		
		// The original height is saved before we start dragging, 
		// but when deleted items are re-rendered we need to get the height directly.
		itemNode._mojoOriginalHeight = itemNode._mojoOriginalHeight || Element.getHeight(itemNode);
		
		height = itemNode._mojoOriginalHeight+'px';
		spacer.style.height = height;
		
		heightNodes = spacer.querySelectorAll("div[x-mojo-set-height]");
		for(i=0; i<heightNodes.length; i++) {
			heightNodes[i].style.height=height;
		}
		
		this.copyListClasses(spacer, itemNode);
		
	},
	

	/**
	 * @private
	 * Removes the given item node from the DOM, replacing it with a properly
	 * configured delete spacer.  If deletes are auto-confirmed, then this will 
	 * begin the delete sequence also.  This means that if an item in the process 
	 * of being deleted is re-rendered, then the delete animation will start over.
	 * If it's not auto-confirmed, then the "delete" button push will be forgotten.
	 * TODO: We could probably remember the "delete" push by setting model.deleted =true 
	 * instead of =truthCookie, and then always autoconfirming.
	 * 
	 * @param {Object} itemNode
	 */
	replaceWithDeleteSpacer: function(itemNode) {
		
		// If this node has no delete spacer yet, then make a new one:
		if (!itemNode._mojoDeleteSpacer) {
			this.insertDeleteSpacer(itemNode);
		}
		
		itemNode._mojoDeleteSpacer._mojoDeletedListNode = itemNode;
		itemNode._mojoDeleteSpacer._mojoListIndex = itemNode._mojoListIndex;
		itemNode._mojoDeleteSpacer._mojoListDividerLabel = itemNode._mojoListDividerLabel;
		itemNode._mojoListIndex = undefined; // since it may not be valid anyways, if there's any reordering while its out of the DOM.
		
		if (itemNode.parentNode) {
			itemNode.remove();
		}
		
		// we need an event listener for the buttons if we're not autoconfirming.
		if (!this.controller.attributes.autoconfirmDelete) {
			itemNode._mojoDeleteSpacer.addEventListener(Mojo.Event.tap, this.handleSwipeDeleteTap.bindAsEventListener(this, itemNode), false);
		}
	},
	
	/**
	 * @private
	 * Reverts a 'deleted' item to normal, removing the delete spacer, reinserting the original node, etc.
	 * This happens in preparation for undoing or deleting.
	 *  
	 * @param {Object} itemNode is the original list item node, NOT the delete spacer.
	 */
	cleanupSwipeDelete: function(itemNode) {
		var spacer;
		// reassign element's index, in case spacer has been renumbered.
		itemNode._mojoListIndex = itemNode._mojoDeleteSpacer._mojoListIndex;
		
		spacer = itemNode._mojoDeleteSpacer;
		// Put element "back to normal" so the oddities of dragging & deletion aren't exposed to other code.
		if (spacer && spacer.parentNode) {
			spacer.parentNode.insertBefore(itemNode, spacer);
			spacer.remove();
		}
		
		delete itemNode._mojoDeleteSpacer;		
		delete spacer._mojoListIndex; // so it no longer looks like a list item
		
		return;
	},
	
	
		/* 
		====================================
		= Dynamically loaded items support =
		====================================
		
		This handles the window of loaded items, any item data model caching, and item height management & tracking.
	*/
	
	
	/**
	 * @private
	 * This function is used when we have a simple array of list items, and no
	 * item load callback function. It's basically an item-load callback for 
	 * BigArray, which allows us to maintain one set of logic in the list 
	 * widget for both cases (when items are dynamically loaded, or just read
	 * from an array). 
	 * 
	 * @param {Object} offset
	 * @param {Object} count
	 * @param {Object} callback
	 */
	loadItemsFromModel: function(listWidget, offset, count) {
		var items = this.controller.model[this.itemsProperty];
		listWidget.mojo.noticeUpdatedItems(offset, items.slice(offset, offset+count));
	},
	
	
	/**
	 * @private
	 * Wrapper for the user-provided load function, inserts a reference to the list widget.
	 */
	loadItemsForBigArray: function(offset, count) {
		return this.itemsCallback(this.controller.element, offset, count);
	},
	
	moved: function(scrollEnding, position) {
		var lastScrollY;
//		var time = Date.now();
		
		// If we know we're hidden, don't respond to scroll move notifications.
		// Note this is just a partially effective band-aid... maybeVisible true 
		// when we are hidden, and in that case we'll still try to adjust the renderWindow
		// while hidden, which can yield odd results, and can result in the spacers being 
		// messed up and the scroll position not properly preserved.  This check keeps things working 
		// for many cases until list is fixed to deal better with display:none, however, and is pretty low risk
		if (!this.maybeVisible) {
			return;
		}
		
		lastScrollY = this.lastScrollY;
		if (lastScrollY === undefined || scrollEnding || Math.abs(lastScrollY - position.y) > this.scrollThreshold) {
			this.adjustRenderWindow();
			
			// re-rendering items can cause trouble for the scroll adjustment threshold, since the spacers 
			// max out at 10000px, so we explicitly initialize it to the current scroll position here, instead of
			// using the "stale" value contained in position.y
			this.lastScrollY = this.scroller.mojo.getScrollPosition().top;
		} else {
			this._adjustDelta = 0;
		}
		
//		if (this._adjustDelta > 0 || scrollEnding) {
//			this.saveLastMoveTime.delay(0.001, time, this._adjustDelta, scrollEnding);
//		}
		
		
	},
	
	/** @private */
/*	saveLastMoveTime: function(oldtime, count, report) {
		this.savedMoveTimes = this.savedMoveTimes || [];
		this.savedMoveTimes.push({time:(Date.now() - oldtime), count:count});
				
		if (report) {
			console.log("FrameTimes: "+this.savedMoveTimes.map(function(elem) {return "{"+elem.count+": "+elem.time+"}";}).join());
			delete this.savedMoveTimes;
		}
	},
*/	
	
	/**
	 * @private
	 *
 		This routine adjusts the window of loaded items depending on the scroll location.
		If this adjustment requires loading new items, then 'null' items are temporarily inserted in their place, and 
		a request is made to the list's datasource function.
	
		This is the only place the "item window" is moved (although it is adjusted when we add/remove items).
		This and the fact that we insert placeholder 'null' items before requesting new ones ensures that
		we always know what is needed where, and don't need to worry so much about making duplicate requests for new items.	

	 */
	adjustRenderWindow: function adjustRenderWindow() {
		var topIndex, anchorNode, anchorTop, anchorIndex;
		var offsetDelta;
		
		//Mojo.Timing.resetAllWithPrefix('list');
		//Mojo.Timing.resume("list#adjust");
		
		// Find index of 1st visible item.
		// We start at the first item's offsetTop, which is usually accurate, 
		// and then calculate an approximate item offset using the average item height.
		anchorNode = this.findNextListItem();
		if (anchorNode) {
			anchorTop = this.elementOffset(anchorNode).top;
			offsetDelta = anchorTop - anchorNode.offsetTop;
			
			// Try to find an anchor node that is just on the + side of the top of the viewable area.
			// Calculating the topIndex of the new items window from this will be more accurate than 
			// the old method of always doing it from the first list item (this.renderOffset).
			//Mojo.Timing.resume('list#adjFind');
			do {
				anchorTop = anchorNode.offsetTop + offsetDelta;
				anchorIndex = anchorNode._mojoListIndex;
				anchorNode = this.findNextListItem(anchorNode);
			} while(anchorNode && anchorTop < 0);
			
			
			topIndex = this.renderOffset + anchorIndex + Math.floor(-anchorTop / this.averageItemHeight);
			
			// leave at least (scrollThreshold + a bit) px or 3 items of margin rendered above currently visible window.
			topIndex -= Math.max(Math.round((this.scrollThreshold+100) / this.averageItemHeight), 3); 
			
//			Mojo.Log.info("this.renderOffset = "+this.renderOffset+", this.averageItemHeight="+this.averageItemHeight);
//			Mojo.Log.info("topIndex="+topIndex);
			
			// pin top rendering offset to valid list bounds.
			topIndex = Math.min(topIndex, this.bigItemsList.length - this.renderLimit);
			topIndex = Math.max(topIndex, 0);
			//Mojo.Timing.pause('list#adjFind');

//			Mojo.Log.info("anchorTop = "+anchorTop+", cumulativeTop="+Element.cumulativeOffset(anchorNode).top+ " new topIndex="+topIndex);

			// And if it changed, move our window & update!		
			if (topIndex != this.renderOffset) {

				this.log("topIndex=",topIndex,", updating!");
				offsetDelta = topIndex - this.renderOffset;

				//	console.profile("adjustRenderWindow");
				//Mojo.Timing.resume("list#updLI");
				this.updateListItems(topIndex);
				//Mojo.Timing.pause("list#updLI");
				//	console.profileEnd();

				//Mojo.Timing.pause("list#adjust");
				//Mojo.Timing.reportTiming('list', ", Timing for "+offsetDelta+", ");
				//Mojo.Timing.resetAllWithPrefix('list');
				this._adjustDelta = offsetDelta;
				return true;
			}
		}
		
		//Mojo.Timing.pause("list#adjust");
		//Mojo.Timing.reportTiming('list', ", Timing for 0, ");
		//Mojo.Timing.resetAllWithPrefix('list');
		this._adjustDelta = 0;
		
		return false;
	},
	
	
	/**
	 * @private
	 * Verifies that our loaded items window is in a valid range.  Moves it and re-renders if not.
	 * Returns true if the window was moved, and the list was re-rendered.
	*/
	moveWindowIfInvalid: function() {
		
		// Move window back if it's past the end of the list... but not < 0.
		if (this.renderOffset + this.renderLimit > this.bigItemsList.length) {
			return this.updateListItems(Math.max(0, this.bigItemsList.length - this.renderLimit));
		}
		
		return false;
	},
	
	/**
	 * @private
	 * called internally to set the renderOffset, reload the currently rendered set of list items from
	 * our BigArray, re-render them, and update the spacer divs.
	 * 
	 * 
	 * @param {Object} newRenderOffset Optional. Causes render offset to be changed
	 * Returns true if the list items were re-rendered.
	 */
	updateListItems: function updateListItems(newRenderOffset) {
		var delta;
		
		this.log('List: updateListItems: newRenderOffset=',newRenderOffset);
		
//		console.profile("UpdateListItems");
		
		// nuthin' to do if newRenderOffset is specified (i.e., being set) and the same as the current render offset.
		if (this.renderOffset === newRenderOffset) {
			return false;
		}
		
		// Save anchor position while renderOffset and item node '_mojoListIndex' properties match.
		this.saveAnchorPosition();
		
		// Calculate the delta, if we got a new renderOffset.
		// The new renderOffset will actually be set either below, or in applyDeltaToListItems().
		if (newRenderOffset !== undefined) {
			delta = newRenderOffset - this.renderOffset;
		} else {
			newRenderOffset = this.renderOffset;
		}
		
//		this.log("Rendering "+this.renderOffset+"-"+(this.renderOffset+this.renderLimit)+", first="+
//			(this.listItems[0] && this.listItems[0].data !== undefined ? this.listItems[0].data : 'null'));
		
		// Update the list.  
		// Once this is done, this.renderOffset and item node '_mojoListIndex' properties will once again match.
		// We can apply an incremental render if the offset is such that we keep some of our existing items.
		if (delta !== undefined && delta > -this.renderLimit && delta < this.renderLimit) {
			// If 'delta' is set, then we can just update the relevant items, and avoid re-rendering the others.
			this.applyDeltaToListItems(delta);
						
		} else {
			this.listItems = this.bigItemsList.slice(newRenderOffset, newRenderOffset+this.renderLimit, true);
			this.renderOffset = newRenderOffset;
			this.renderFromModel();	
		}
		
		return true;
//		console.profileEnd();	
	},
	

	/**
	 * @private
		Saves offsetTop & index of first and last items.
		These items are used like "anchors" to let us easily resize the spacer divs
		so that the list does not appear to scroll.
		This allows us to set the spacer height later so that scrolling is smooth.
		
		It should always be called before moving the item window, since it relies on 
		both the _mojoListItem properties on the item nodes and this.renderOffset being correct & matching.
		It must always be called before calling renderFromModel(), because the latter calls updateSpacers(),
		and there may be a visible "jump" if they are resized without a proper anchor position saved.
 
	 */
	saveAnchorPosition: function() {
		var node;
		
		
		if (!this.topSpacer) {
			return;
		}
		
		// find first list item
		node = this.findNextListItem();
		
		if (node) {
			this.savedScrollPos.firstIndex = node._mojoListIndex + this.renderOffset;
			this.savedScrollPos.firstTop = node.offsetTop;
		} else {
			this.savedScrollPos.firstIndex = undefined;
			this.savedScrollPos.firstTop = undefined;
		}
		
		this.log('List: saveAnchorPosition ', this.savedScrollPos.firstIndex, ", top=", this.savedScrollPos.firstTop);
		
		// find last list item
		node = this.findPrevListItem();
		
		if (node) {
			this.savedScrollPos.lastIndex = node && node._mojoListIndex + this.renderOffset;
			this.savedScrollPos.lastTop = node && node.offsetTop;
		} else {
			this.savedScrollPos.lastIndex = undefined;
			this.savedScrollPos.lastTop = undefined;
		}
		
	},
	
	/**
	 * @private
	 * Sets the height of top & bottom spacers to properly represent the not-loaded items. 
	 */
	updateSpacers: function updateSpacers() {
		var oldTop, newTop, newNode;
		var maxSpacerHeight;
		var topHeight, bottomHeight;
		
		// If we have a saved scroll position, then try to use it.
		if (this.savedScrollPos.firstIndex !== undefined) {
			
			// Search for one of the nodes whose position we saved:
			newNode = this.getNodeByIndex(this.savedScrollPos.firstIndex);
			if (newNode) {				
				oldTop = this.savedScrollPos.firstTop;
			}
			else {
				newNode = this.getNodeByIndex(this.savedScrollPos.lastIndex);
				oldTop = this.savedScrollPos.lastTop;
			}
		}
		
		// If we found one of the nodes we saved, then we can do an accurate spacer adjustment.
		if (newNode) {
			newTop = newNode.offsetTop;
			this.topSpacerHeight -= newTop - oldTop;
			this.log("List: updateSpacers using item ", (newNode._mojoListIndex+this.renderOffset));
		} else {
			// otherwise, we estimate the top spacer height...
			this.topSpacerHeight = this.renderOffset * this.averageItemHeight;
		}
		
		this.log("List.updateSpacers: oldTop=", oldTop, ", newTop=", newTop);
		
		
		// Is our spacer height wrong? 
		// If so, there will be a visible 'jump' unless we adjust the scene's scroll position manually.
		// We test for two things: the topSpacerHeight should always be 0 when we're rendering the beginning of the list,
		// and it should never go negative under any conditions.  If it does, then we estimated wrong and "ran out" of spacer.
		// In either case, we need to account for this by adjusting the scroll position.
		// TODO: It might be simpler and more accurate to always set spacer height to (count * avgHeight) and then 
		// adjust scroll position to prevent jumping.
		if ((this.renderOffset === 0 && this.topSpacerHeight !== 0) || this.topSpacerHeight < 0) {
			this.log('List.updateSpacers: Adjusting by', this.topSpacerHeight);
			this.scroller.mojo.adjustBy(0, this.topSpacerHeight);
			this.topSpacerHeight = 0;
		}
		
		// Enforce max top spacer height:
		maxSpacerHeight = this.kMaxSpacerHeight;
		if (this.topSpacerHeight > maxSpacerHeight) {
			this.log('Max exceeded, Adjusting by', (this.topSpacerHeight - maxSpacerHeight));
			this.scroller.mojo.adjustBy(0, this.topSpacerHeight - maxSpacerHeight);
			this.topSpacerHeight = maxSpacerHeight;
		}
		
		// Grab both heights at the same time to avoid generating two webkit layouts
		topHeight = this.topSpacer.offsetHeight;
		bottomHeight = this.bottomSpacer.offsetHeight;

		if (this.topSpacerHeight !== topHeight) {
			this.topSpacer.style.height = this.topSpacerHeight + 'px';
		}
		
		// BUG: We should subtract trailing nulls from listItems.length in order to be technically correct... 
		// but it may be fine as is, since the list will update when the new item data arrives.
		this.bottomSpacerHeight = (this.bigItemsList.length - (this.renderOffset+this.listItems.length)) * this.averageItemHeight;
		this.bottomSpacerHeight = Math.min(this.bottomSpacerHeight, maxSpacerHeight);
		if (bottomHeight !== this.bottomSpacerHeight) {
			this.bottomSpacer.style.height = this.bottomSpacerHeight + 'px';
		}
		
	},
	
	
	/**
	 * @private
	 * Returns estimated total height for the given range of list items
	 * (from item[start] through item[end-1] inclusive). 
	 * 
	 * @param {Object} start
	 * @param {Object} end
	 */
	estimateHeight: function(start, end) {		
		return Math.floor((end - start) * this.averageItemHeight);
	},
	
	
	_getTrueHeight: function(node) {
		var sibling = this.findNextListItem(node);
		if (sibling) {
			return sibling.offsetTop - node.offsetTop;
		} else if (this.bottomSpacer && this.bottomSpacer.parentNode === this.listItemsParent) {
			return this.bottomSpacer.offsetTop - node.offsetTop;
		} else { 
			//if all else fails just get the offset height which is probably not correct due to negative margins but almost correct
			return node.offsetHeight;
		}
	},

	/**
	 * @private
	 * Measures the heights of the currently rendered items, and 
	 * incorporates them into our running average. 
	 */
	measureItemHeights: function() {
		var node, height;
		
		if (this.controller.attributes.fixedHeightItems) {
			if (!this._measuredFixedItem) {
				node = this.findNextListItem();
				if (node) {
					height = this._getTrueHeight(node);
					if (height && height > 0) { //otherwise sometime must be hidden, so don't set the averageitemheight yet
						this.averageItemHeight = height;
						this._measuredFixedItem = true;
					}
				}
			}
			return;
		}
		
		
		//TODO: if this is slow then store the nextTop and previousTop between loop iterations but be careful
		//to take into account the case where there are non-list items nodes
		for(node = this.listItemsParent && this.listItemsParent.firstChild; node; node=node.nextSibling) {
			
			// Note that we currently only measure items once, even though it's possible that their model
			// could change and they could grow larger.
			if (node._mojoListIndex !== undefined) {
				
				// Get node height, but only include it if it's > 0.
				// When we're hidden, all items are 0 height, and this can seriously screw things up.
				height = this._getTrueHeight(node);
				if (height > 0) {					
					// cap maximum samples, so items we haven't seen in awhile have less affect on the average.
					if (this.heightSamples > 30) {
						this.heightSamples--;
					}
				
					// TODO: optimization? 
					// We could calculate item heights simply by checking the offsetTop of each item, and its next sibling.
					this.averageItemHeight = ((this.heightSamples * this.averageItemHeight) + height) / (this.heightSamples+1);
					this.heightSamples++;
				}
			}
		}
	}
	
});

/**
 * @private
 */
Mojo.Log.addLoggingMethodsToClass(Mojo.Widget.List);

