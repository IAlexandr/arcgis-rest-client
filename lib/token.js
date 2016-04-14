import request from 'superagent';
import requestProxy from 'superagent-proxy';
requestProxy(request);
import urlworks from './urlworks';
import debug from 'debug';
const log = debug('arcgis');

class Token {
  constructor (props, options) {
    const { username, password, serverUrl } = props;
    this.username = username;
    this.password = password;
    this.timeout = 1000 * 60 * 58;
    this.expiration = 60; // minutes
    this.generateTokenUrl = urlworks.toArcgisServerGenTokenUrl(serverUrl);
    this.client = 'requestip';
    this.options = options;
    this.needToken = false;
    this.tokenInfo = {
      token: null,
      expires: null
    };
    this.isValid = false;
    this.expiredTokenTO = null;
    if (this.username && this.password) { // TODO (временное) переделать проверку наличия логина пароля
      this.needToken = true;
    }
  }

  checkExpires () {
    // TODO если отличается больше чем (на несколько минут) от this.exporation пока вывести в консоль warning! Возможно
    // дата на аркгис сервере отличается от локального сервера.
  }

  _getToken (callback) {
    const { username, password, client } = this;
    const params = {
      f: 'json',
      username,
      password,
      client
    };
    let req = request
      .post(this.generateTokenUrl);

    if (this.options.proxy) {
      req = req.proxy(this.options.proxy);
    }
    req
      .type('form')
      .send(params)
      .end((err, res) => {
        if (err) {
          log('_getToken err:', err);
          return callback(err);
        }
        let tokenInfo;
        try {
          tokenInfo = JSON.parse(res.text);
        } catch (e) {
          log('_getToken e:', e);
          return callback(e);// new Error('Passed URL seems to be not an Arcgis FeatureServer REST endpoint'));
        }
        this.setExpiredTokenTO(this.timeout);
        return callback(null, tokenInfo);
      });
  }

  setExpiredTokenTO (ms) {
    // TODO создать то в toUpdateToken
    this.expiredTokenTO = setTimeout(() => {
      this.isValid = false;
    }, ms);
  }

  getToken () {
    return new Promise((resolve, reject) => {
      if (this.isValid) {
        return resolve(this.tokenInfo.token);
      } else {
        this._getToken((err, tokenInfo) => {
          if (err) {
            return reject(err);
          }
          this.tokenInfo = tokenInfo;
          this.checkExpires(); // проверка срока истечения токена (даты)
          return resolve(tokenInfo.token);
        });
      }
    });
  }
}

export default Token;
