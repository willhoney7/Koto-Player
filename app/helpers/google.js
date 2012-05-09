google = ({
	url: "https://ajax.googleapis.com/ajax/services/search/images?",
	api_key: api_keys.google_api_key,
	search: function(query, callback){
		var url = this.url + "q="+encodeURIComponent(query) + "&v=1.0&rsz=6&imgsz=small|medium&as_filetype=jpg&key="+this.api_key;
		koto.ajaxRequest.request(url,{
			method: "get",
			onSuccess: function(transport){
				var response = JSON.parse(transport.responseText);
				callback(response.responseData.results);
			}.bind(this),
			onFailure: function(transport){
				Mojo.Log.error(transport.responseText);
			}.bind(this)
		});
	}
})