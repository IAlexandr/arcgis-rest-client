'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _arcgisServer = require('./arcgis-server');

var _arcgisServer2 = _interopRequireDefault(_arcgisServer);

var _featureServer = require('./feature-server');

var _featureServer2 = _interopRequireDefault(_featureServer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { ArcgisServer: _arcgisServer2.default, FeatureServer: _featureServer2.default };