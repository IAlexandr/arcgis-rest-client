'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _arcgisServer = require('./arcgis-server');

var _arcgisServer2 = _interopRequireDefault(_arcgisServer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  servers: [],
  getServer: function getServer(props) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var _this = this;
    var serverUrl = props.serverUrl;
    var username = props.username;
    var password = props.password;

    var resServer = void 0;
    for (var i = 0; i < _this.servers; i++) {
      var server = _this.servers[i];
      if (server.serverUrl === serverUrl && server.username === username && server.password === password) {
        resServer = server;
        break;
      }
    }
    if (!resServer) {
      resServer = _this.addServer(props, options);
    }
    return resServer;
  },
  addServer: function addServer(props, options) {
    return new _arcgisServer2.default(props, options);
  }
};