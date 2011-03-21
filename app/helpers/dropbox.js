dropbox = ({
	//Not even close to working.
	authorize: function(email, password, callBackFunc){
		g.AjaxRequest.request("https://api.dropbox.com/0/token",{
			method: "get",
			parameters: {
				"email": lastfm.utf8_encode(email),
				"password": lastfm.utf8_encode(password)
			},
			onSuccess: function(transport){
				m.debugErr(transport.responseText);
				m.debugObj(transport.responseJSON);
			}.bind(this),
			onFailure: function(transport){
				callBackFunc({error: "Failed"});		
			}.bind(this)
		});
	}
});