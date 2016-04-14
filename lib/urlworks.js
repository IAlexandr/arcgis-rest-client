var url = require('url');

// Возвращает "канонический" базовый адрес REST API,
// типа http://arcgis.com/arcgis/rest
module.exports.toArcgisServerBaseUrl = function (inUrl) {
	var urlObj = url.parse(inUrl);
	delete urlObj.href;
	delete urlObj.search;
	delete urlObj.hash;
	delete urlObj.path;
	urlObj.pathname = '/arcgis/rest';

	return url.format(urlObj);
};

module.exports.toArcgisServerGenTokenUrl = function (inUrl) {
	var urlObj = url.parse(inUrl);
	delete urlObj.href;
	delete urlObj.search;
	delete urlObj.hash;
	delete urlObj.path;
	urlObj.pathname = '/arcgis/tokens/generateToken';

	return url.format(urlObj);
};
