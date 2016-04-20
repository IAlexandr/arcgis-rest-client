'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _servers = require('./servers');

var _servers2 = _interopRequireDefault(_servers);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _superagentProxy = require('superagent-proxy');

var _superagentProxy2 = _interopRequireDefault(_superagentProxy);

var _urlworks = require('./urlworks');

var _urlworks2 = _interopRequireDefault(_urlworks);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(0, _superagentProxy2.default)(_superagent2.default);

var log = (0, _debug2.default)('arcgis');

var guid = function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + ' ' + s4() + ' - ' + s4() + ' - ' + s4() + ' - ' + s4() + ' - ' + s4() + ' ' + s4() + ' ' + s4();
};

var FeatureServer = function () {
  function FeatureServer(props) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, FeatureServer);

    var featureServerUrl = props.featureServerUrl;
    var username = props.username;
    var password = props.password;

    this.featureServerUrl = featureServerUrl;
    this.username = username;
    this.password = password;
    this.serverUrl = _urlworks2.default.toArcgisServerBaseUrl(featureServerUrl);
    this.options = options;
    this.server = _servers2.default.getServer({ serverUrl: this.serverUrl, username: username, password: password }, options);
  }

  _createClass(FeatureServer, [{
    key: 'getRequest',
    value: function getRequest(url, params) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var req = _superagent2.default.get(url);

        if (_this.options.proxy) {
          req = req.proxy(_this.options.proxy);
        }

        req.query(params).accept('json').end(function (err, res) {
          if (err) {
            return reject(err);
          }
          if (!res.ok) {
            return reject(new Error('Query error (server response not ok).'));
          }
          var resBody = void 0;
          try {
            resBody = JSON.parse(res.text);
          } catch (e) {
            return reject(new Error('Query error (JSON parse error).'));
          }
          if (!!resBody.error) {
            return reject(new Error('Arcgis server: ' + resBody.error.message));
          }
          return resolve(resBody);
        });
      });
    }
  }, {
    key: 'postRequest',
    value: function postRequest(url, params) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {

        params = Object.assign({}, {
          f: 'json'
        }, params);

        var req = _superagent2.default.post(url);

        if (_this2.options.proxy) {
          req = req.proxy(_this2.options.proxy);
        }

        req.type('form').send(params).accept('json').end(function (err, res) {
          if (err) {
            return reject(err);
          }
          if (!res.ok) {
            return reject(new Error('Query error (server response not ok).'));
          }
          var resBody = void 0;
          try {
            resBody = JSON.parse(res.text);
          } catch (e) {
            return reject(new Error('Query error (JSON parse error).'));
          }
          if (!!resBody.error) {
            return reject(new Error('Arcgis server: ' + resBody.error.message));
          }
          return resolve(resBody);
        });
      });
    }
  }, {
    key: 'checkToken',
    value: function checkToken() {
      var params = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      var id = arguments.length <= 1 || arguments[1] === undefined ? guid() : arguments[1];

      if (this.server.needToken) {
        return this.server.getToken(id).then(function (token) {
          log(id, 'token:', token);
          params.token = token;
          return params;
        });
      }
      return Promise.resolve(params);
    }
  }, {
    key: 'query',
    value: function query() {
      var _this3 = this;

      var props = arguments.length <= 0 || arguments[0] === undefined ? { where: '1=1' } : arguments[0];

      var params = Object.assign({}, {
        outFields: '*',
        returnGeometry: false,
        where: '1=1'
      }, props);

      params.f = 'json';

      params = this.prepObjectIds(params);
      log('query params:', params);
      return this.checkToken(params).then(function (params) {
        return _this3.getRequest(_this3.featureServerUrl + '/query', params);
      });
    }
  }, {
    key: 'queryCount',
    value: function queryCount() {
      var props = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      props.returnCountOnly = true;
      return this.query(props).then(function (result) {
        if (!result.hasOwnProperty('count')) {
          return Promise.reject(new Error('Query result error: no count property returned.'));
        }
        return result.count;
      });
    }
  }, {
    key: 'add',
    value: function add(features) {
      var _this4 = this;

      var params = {
        features: JSON.stringify(features)
      };
      log('add params:', params);
      return this.checkToken(params).then(function (params) {
        return _this4.postRequest(_this4.featureServerUrl + '/addFeatures', params);
      }).then(function (resBody) {
        if (!resBody.addResults) {
          // todo: error.message содержит больше данных
          return Promise.reject(new Error('Add error.'));
        }
        return resBody;
      });
    }
  }, {
    key: 'update',
    value: function update(features) {
      var _this5 = this;

      var params = {
        features: JSON.stringify(features)
      };
      log('update params:', params);
      return this.checkToken(params).then(function (params) {
        return _this5.postRequest(_this5.featureServerUrl + '/updateFeatures', params);
      }).then(function (resBody) {
        if (!resBody.updateResults) {
          // todo: error.message содержит больше данных
          return Promise.reject(new Error('Update error.'));
        }
        return resBody;
      });
    }
  }, {
    key: 'prepObjectIds',
    value: function prepObjectIds(params) {
      if (params.objectIds) {
        if (Object.prototype.toString.call(params.objectIds) === '[object Array]') {
          params.objectIds = params.objectIds.join(', ');
        } else {
          if (typeof params.objectIds !== 'string') {
            log('objectIds type not supported.');
          }
        }
      }
      return params;
    }
  }, {
    key: 'delete',
    value: function _delete(params) {
      var _this6 = this;

      params = this.prepObjectIds(params);
      params.rollbackOnFailure = true;
      log('delete params:', params);
      return this.checkToken(params).then(function (params) {
        return _this6.postRequest(_this6.featureServerUrl + '/deleteFeatures', params);
      }).then(function (resBody) {
        if (!resBody.success) {
          // todo: error.message содержит больше данных
          return Promise.reject(new Error('Delete error.'));
        }
        return resBody;
      });
    }
  }, {
    key: 'addAttachment',
    value: function addAttachment(props) {
      var _this7 = this;

      log('addAttachment props:', props);
      var params = {
        f: 'json'
      };
      return this.checkToken(params).then(function (params) {
        params.objId = props.objId;
        params.rs = _fs2.default.createReadStream(props.filePath);
        return _this7.addAttach(params);
      }).then(function (resBody) {
        if (!!resBody.addAttachmentResult) {
          log('!resBody.addAttachmentResult', resBody);
          // todo: error.message содержит больше данных
          return Promise.reject(new Error('addAttachmentResult error.'));
        }
        return Promise.resolve(resBody);
      });
    }
  }, {
    key: 'addAttach',
    value: function addAttach(params) {
      var _this8 = this;

      log('in addAttach');
      return new Promise(function (resolve) {
        var objId = params.objId;
        var rs = params.rs;
        var token = params.token;

        var url = _this8.featureServerUrl + '/' + objId + '/addAttachment';
        var r = _request2.default.post(url, function (err, resp, body) {
          if (err) {
            return Promise.reject(err);
          }
          log(err, body);
          return resolve(body);
        });
        var form = r.form();
        form.append('f', 'json');
        if (token) {
          form.append('token', token);
        }
        form.append('attachment', rs);
      });
    }
  }, {
    key: 'addAttachmentUrl',
    value: function addAttachmentUrl(props) {
      var _this9 = this;

      log('addAttachmentUrl props:', props);
      return this.checkToken().then(function (params) {
        params.objId = props.objId;
        var rs = _request2.default.get(props.fileUrl);
        rs.on('error', function (err) {
          return Promise.reject(err);
        });
        params.rs = rs;
        return _this9.addAttach(params);
      }).then(function (resBody) {
        log(JSON.stringify(resBody));
        if (!resBody.addAttachmentResult) {
          return Promise.reject(new Error('addAttachmentUrl error.'));
        }
        return resBody;
      });
    }
  }, {
    key: 'deleteAttachment',
    value: function deleteAttachment(props) {
      var _this10 = this;

      var params = {
        f: 'json',
        rollbackOnFailure: true,
        attachmentIds: props.attachmentIds
      };
      if (params.attachmentIds) {
        if (Object.prototype.toString.call(params.attachmentIds) === '[object Array]') {
          params.attachmentIds = params.attachmentIds.join(', ');
        } else {
          if (typeof params.attachmentIds !== 'string') {
            return Promise.reject(new Error('attachmentIds type not supported.'));
          }
        }
      } else {
        return Promise.reject(new Error('attachmentIds is empty.'));
      }
      log('deleteAttachment params: ', params);
      return this.checkToken(params).then(function (params) {
        return _this10.postRequest(_this10.featureServerUrl + '/' + props.objId + '/deleteAttachments', params);
      }).then(function (resBody) {
        if (!resBody.deleteAttachmentResults) {
          // todo: error.message содержит больше данных
          return Promise.reject(new Error('deleteAttachmentResults error.'));
        }
        return resBody;
      });
    }
  }, {
    key: 'attachmentInfos',
    value: function attachmentInfos(objId) {
      var _this11 = this;

      log('attachmentInfos objId:', objId);
      var params = {
        f: 'json'
      };
      return this.checkToken(params).then(function (params) {
        return _this11.getRequest(_this11.featureServerUrl + '/' + objId + '/attachments', params);
      }).then(function (resBody) {
        if (!resBody.attachmentInfos) {
          // todo: error.message содержит больше данных
          return Promise.reject(new Error('attachmentInfos error.'));
        }
        return resBody;
      });
    }
  }, {
    key: 'connect',
    value: function connect(props) {
      var _this12 = this;

      var id = arguments.length <= 1 || arguments[1] === undefined ? guid() : arguments[1];
      // Для теста id
      log(id, 1);
      var params = {
        f: 'json'
      };
      return this.checkToken(params, id).then(function (params) {
        log(id, 2);
        return _this12.getRequest(_this12.featureServerUrl, params);
      }).then(function (resBody) {
        log(id, 3);
        log(id, resBody.type);
        if (!(resBody.type && resBody.type === 'Feature Layer')) {
          return Promise.reject(new Error('Passed URL seems to be not an Arcgis FeatureServer' + ' REST endpoint'));
        }
        return resBody;
      });
    }
  }]);

  return FeatureServer;
}();

exports.default = FeatureServer;