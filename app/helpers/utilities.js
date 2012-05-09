function checkConnectivity(callback) { 
    koto.serviceRequest.request('palm://com.palm.connectionmanager', {
        method: 'getstatus',
        parameters: {},
        onSuccess: function (response) {
            var wifi = response.wifi;
            var wan = response.wan;
            var hasInternet = response.isInternetConnectionAvailable;
            if (hasInternet && (wifi.state === "connected" || wan.state === "connected")) {
               callback(true);
            } else {
               callback(false);
            }
        }.bind(this),
        onFailure: function(response) {
            // Handle failure here...
        }
    });
}

function getFileInfo(filePath){
	var m = filePath.match(/(.*)\/([^\/\\]+)(\.\w+)$/);
	return {path: m[1], file: m[2], extension: m[3]};
}

function uniqArray(array){
	for ( var i = 1; i < array.length; i++ ) {
		if (array[i] === array[i - 1]){
			array.splice(i--, 1);
		}
	}
	return array;
}

/*var by = function (name, minor) {
    return function (o, p) {
        var a, b;
        if (o && p && typeof o === 'object' && typeof p === 'object') {
            a = o[name];
            b = p[name];
            if (a === b) {
                return typeof minor === 'function' ? minor(o, p) : 0;
            }
            if (typeof a === typeof b) {
                return a < b ? -1 : 1;
            }
            return typeof a < typeof b ? -1 : 1;
        } else {
            throw {
                name: 'Error',
                message: 'Expected an object when sorting by ' + name;
            };
        }
    };
	
	s.sort(by('last', by('first')));    // s is [
//    {first: 'Joe',   last: 'Besser'},
//    {first: 'Joe',   last: 'DeRita'},
//    {first: 'Larry', last: 'Fine'},
//    {first: 'Curly', last: 'Howard'},
//    {first: 'Moe',   last: 'Howard'},
//    {first: 'Shemp', last: 'Howard'}
// ]

};*/


Mojo.Model.format = function format(model, formatters, clone, index) {
	var newModel = Mojo.Model.decorate(model, clone);
	var propValue;
	var formattedValue;
	var formattedName;
	
	for(var propName in formatters) {
		if (formatters.hasOwnProperty(propName)) {
			propValue = newModel[propName];
			formattedValue = formatters[propName].call(undefined, propValue, model, index);
			
			if (typeof formattedValue === 'string' || typeof formattedValue === "number") {
				newModel[propName + 'Formatted'] = formattedValue;
			} else if (typeof formattedValue === 'object') {
				for(formattedName in formattedValue) {
					if (formattedValue.hasOwnProperty(formattedName)) {
						newModel[formattedName] = formattedValue[formattedName];
					}
				}
			}
		}
	}
	
	return newModel;
};

Mojo.View.render = function render(renderParams) {
	Mojo.Timing.resume("scene#render");
	var allText = "";
	var collection = renderParams.collection;
	var attributes = renderParams.attributes;
	var formatters = renderParams.formatters;
	var object;
	if (collection) {
		var separator = renderParams.separator;
		for(var i = 0, l = collection.length, lastIndex = l - 1; i < l; i++) {
			
			if (collection[i] !== null) {
				// Combine attributes with the collection object for this item,
				// And then apply formatters if we have any.
				object = Mojo.Model.format(collection[i], formatters, attributes, i);
				
				if (l === 1) {
					object.currentElementClass = 'single';
				} else {
					if (i === 0) {
						object.currentElementClass = 'first';
					} else if (i === lastIndex) {
						object.currentElementClass = 'last';
					}
				}
				var s = Mojo.View._doRender(object, renderParams);
				allText += s;
				if (separator && i != lastIndex) {
					allText += Mojo.View._renderNamedTemplate(Mojo.View._calculateTemplateFileName(renderParams.separator, object), object);
				}
			}
		}
	} else {
		object = renderParams.object || {
		};
		if (attributes || formatters) {
			object = Mojo.Model.format(object, formatters, attributes);
		}
		allText = Mojo.View._doRender(object, renderParams);
	}
	Mojo.Timing.pause("scene#render");
	return allText;
};