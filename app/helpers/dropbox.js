dropbox = ({
	//Not even close to working.
	authorize: function(email, password, callback){
		koto.ajaxRequest.request("https://api.dropbox.com/0/token",{
			method: "get",
			parameters: {
				"email": lastfm.utf8_encode(email),
				"password": lastfm.utf8_encode(password)
			},
			onSuccess: function(transport){
				console.log(transport.responseText);
			}.bind(this),
			onFailure: function(transport){
				callback({error: "Failed"});		
			}.bind(this)
		});
	}
});