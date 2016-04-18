'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

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

var Token = function () {
  function Token(props, options) {
    _classCallCheck(this, Token);

    var username = props.username;
    var password = props.password;
    var serverUrl = props.serverUrl;

    this.username = username;
    this.password = password;
    this.expiration = 5; // minutes
    this.generateTokenUrl = _urlworks2.default.toArcgisServerGenTokenUrl(serverUrl);
    this.client = 'requestip';
    this.options = options;
    this.needToken = false;
    this.tokenInfo = {
      token: null,
      expires: null
    };
    this.isValid = false;
    this.getting = false;
    this.expiredTokenTO = null;
    if (this.username && this.password) {
      // TODO (временное) переделать проверку наличия логина пароля
      this.needToken = true;
    }
  }

  _createClass(Token, [{
    key: 'checkExpires',
    value: function checkExpires() {
      // TODO если отличается больше чем (на несколько минут) от this.exporation пока вывести в консоль warning! Возможно
      // дата на аркгис сервере отличается от локального сервера.
    }
  }, {
    key: '_getToken',
    value: function _getToken(id, callback) {
      var _this = this;

      log(id, '_getToken');
      var username = this.username;
      var password = this.password;
      var client = this.client;
      var expiration = this.expiration;

      var params = {
        f: 'json',
        username: username,
        password: password,
        client: client,
        expiration: expiration
      };
      var req = _superagent2.default.post(this.generateTokenUrl);

      if (this.options.proxy) {
        req = req.proxy(this.options.proxy);
      }

      log(id, '_getToken req');
      req.type('form').send(params).end(function (err, res) {

        if (err) {
          log(id, '_getToken err:', err);
          return callback(err);
        }
        var tokenInfo = void 0;
        try {
          tokenInfo = JSON.parse(res.text);
          log('tokenInfo.expires: ', tokenInfo.expires);
        } catch (e) {
          log(id, '_getToken e:', e);
          return callback(e); // new Error('Passed URL seems to be not an Arcgis FeatureServer REST endpoint'));
        }
        log(id, '_getToken res');
        _this.setExpiredTokenTO(_this.expiration * 1000 * 60 - 15000);
        return callback(null, tokenInfo);
      });
    }
  }, {
    key: 'setExpiredTokenTO',
    value: function setExpiredTokenTO(ms) {
      var _this2 = this;

      // TODO создать то в toUpdateToken
      log('setExpiredTokenTO ms: ', ms);
      this.expiredTokenTO = setTimeout(function () {
        log('setExpiredTokenTO. Token expired. Set isValid = false');
        _this2.isValid = false;
      }, ms);
    }
  }, {
    key: 'getToken',
    value: function getToken(id) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var getting = function getting() {
          if (_this3.isValid) {
            return resolve(_this3.tokenInfo.token);
          } else {
            if (_this3.getting) {
              log(id, 'getToken wait 1s');
              setTimeout(getting, 1000 * 1);
            } else {
              log(id, 'getToken! set getting = true');
              _this3.getting = true;
              _this3._getToken(id, function (err, tokenInfo) {
                log(id, 'getToken! set getting = false');
                _this3.getting = false;
                log(id, 'getToken! set isValid = true');
                _this3.isValid = true;
                if (err) {
                  return reject(err);
                }
                _this3.tokenInfo = tokenInfo;
                _this3.checkExpires(); // проверка срока истечения токена (даты)
                return resolve(tokenInfo.token);
              });
            }
          }
        };
        getting();
      });
    }
  }]);

  return Token;
}();

exports.default = Token;