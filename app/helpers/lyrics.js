lyrics = ({
	api_key: api_keys.lyrics_api_key,
	base_url: "http://api.musixmatch.com/ws/1.1/",
	searchForLyrics: function(song_, callback){
		var song = Object.clone(song_);
		//Search first
		koto.ajaxRequest.request(this.base_url + "track.search", {
			method: "get",
			parameters: {
				"apikey": lastfm.utf8_encode(this.api_key),
				"q_track": lastfm.utf8_encode(song.title),
				"q_artist": lastfm.utf8_encode(song.artist),
				"pagesize": lastfm.utf8_encode(1),
				"f_has_lyrics": lastfm.utf8_encode(1)
			},
			onSuccess: function(transport){
				var response = transport.responseText.evalJSON(true);
				if (response.message.header.status_code === 200){
					if (response.message.header.available > 0){
						this.getLyrics(response.message.body.track_list[0].track.track_id, callback);
					}else {
						var regex = /(\(.*?\)|\[.*?\])/g; //remove extra stuff on titles..
						if (regex.test(song.title)){
							song.title = song.title.replace(regex, "");
							this.searchForLyrics({title: song.title, artist: song.artist}, callback);
						} else {
							callback({error: "Lyrics Not Found"});		
						}						
					}
				} else {
					console.log("Request Failed. Error Code #" + response.message.header.status_code);
					callback({error: "Lyrics Request Failed"});
				}
				//console.log(transport.responseText);
			
			}.bind(this),
			onFailure: function(transport){
				callback({error: "Lyrics Request Failed"});					
			}.bind(this)
		});
	},
	getLyrics: function(id, callback){
		koto.ajaxRequest.request(this.base_url + "track.lyrics.get", {
			method: "get",
			parameters: {
				"apikey": lastfm.utf8_encode(this.api_key),
				"track_id": lastfm.utf8_encode(id)
			},
			onSuccess: function(transport){
				var response = transport.responseText.evalJSON(true);
				if (response.message.header.status_code === 200){
					callback({lyrics: response.message.body.lyrics.lyrics_body.replace(/(\r\n|[\r\n])/g, "<br />") + "<br/><br/>" + Mojo.Format.runTextIndexer(response.message.body.lyrics.lyrics_copyright)});
				}else {
					callback({error: "Lyrics Request Failed"});					
				}
			},
			onFailure: function(transport){
				callback({error: "Lyrics Request Failed"});					
			}
		});
	},
	/* Lyricsfly
	getLyrics: function(song, callback){
		var params = {
			"i": "8697f4af5559f50d0-temporary.API.access",
			"a": lyrics.parseParam(song.artist),
			"t": lyrics.parseParam(song.title)
		}
		koto.ajaxRequest.request("http://api.lyricsfly.com/api/api.php",{
			method: "get",
			parameters: params,
			onSuccess: function(transport){
				Mojo.Log.info(transport.responseText);
				xml = transport.responseXML;
				status = xml.getElementsByTagName("status")[0].childNodes[0].nodeValue;
				if (status === 200 || status === 300)
					//callback({lyrics: this.parseLyrics(xml.getElementsByTagName("tx")[0].childNodes[0].nodeValue)});
					callback({lyrics: (xml.getElementsByTagName("tx")[0].childNodes[0].nodeValue).replace(/(\[br\]\[br\]|\[br\]\s\[br\])/g, "").replace(/\[br\]/g, "<br\/>")});
				else if (status === 204)
					callback({error: "Lyrics Not Found"});
				else {
					sg = xml.getElementsByTagName("sg")[0].childNodes[0].nodeValue;
					callback({error: "Error: " + sg});
				}
			}.bind(this),
			onFailure: function(transport){
				callback({error: "Lyrics Request Failed"});		
			}.bind(this)
		});
	},
	parseParam: function(string){
		Mojo.Log.info("string is : " + string);
		words = string.split(" "); 
		for (i=0 ; i < words.length; i++){//capitalize first letter
			words[i] = words[i].substr(0,1).toUpperCase() + words[i].substr(1, words[i].length -1);
		}         
		string = words.join("_");//join with _ so \W doesn't replace spaces.		
		return string.replace(/\W/g, "%").strip();
	},
	parseLyrics: function(lyrics){//not used
		Mojo.Log.info("lyrics before are: " + lyrics);
		Mojo.Log.info("lyrics are: " + 	lyrics.replace(/([A-Z])/g , '<br/>$1'));
		return lyrics.replace(/([A-Z])/g , '<br/>$1').replace(/\[br\]/g, "");
	}*/
	
});
