(function() {

	function getPrivateToken(html) {
		var strXml = $('head script[type="text/javascript"]').contents()[0]['wholeText'];
		var arrXmlNode = strXml.toString().split(';')
		var private_token;
		var objXml = {};

		for(var i = 1; i < arrXmlNode.length - 1; i++) {
			var  item = arrXmlNode[i].split('=');
			var key = item[0];
			var value = item[1];
			objXml[key] = value;
		}

		for(var key in objXml) {
			if(key === 'gon.api_token') {
				private_token = objXml[key];
			}
		}

		console.log('private_token: ' + private_token);

		return private_token;
	}

	getPrivateToken();
})();