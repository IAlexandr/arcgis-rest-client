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
    this.expiration = 5; // minutes
    this.generateTokenUrl = urlworks.toArcgisServerGenTokenUrl(serverUrl);
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
    if (this.username && this.password) { // TODO (временное) переделать проверку наличия логина пароля
      this.needToken = true;
    }
  }

  checkExpires () {
    // TODO если отличается больше чем (на несколько минут) от this.exporation пока вывести в консоль warning! Возможно
    // дата на аркгис сервере отличается от локального сервера.
  }

  _getToken (id, callback) {
    log(id, '_getToken');
    const { username, password, client, expiration } = this;
    const params = {
      f: 'json',
      username,
      password,
      client,
      expiration
    };
    let req = request
      .post(this.generateTokenUrl);

    if (this.options.proxy) {
      req = req.proxy(this.options.proxy);
    }

    log(id, '_getToken req');
    req
      .type('form')
      .send(params)
      .end((err, res) => {

        if (err) {
          log(id, '_getToken err:', err);
          return callback(err);
        }
        let tokenInfo;
        try {
          tokenInfo = JSON.parse(res.text);
          log('tokenInfo.expires: ', tokenInfo.expires);
        } catch (e) {
          log(id, '_getToken e:', e);
          return callback(e);// new Error('Passed URL seems to be not an Arcgis FeatureServer REST endpoint'));
        }
        log(id, '_getToken res');
        this.setExpiredTokenTO(this.expiration * 1000 * 60 - 15000);
        return callback(null, tokenInfo);
      });
  }

  setExpiredTokenTO (ms) {
    // TODO создать то в toUpdateToken
    log('setExpiredTokenTO ms: ', ms);
    this.expiredTokenTO = setTimeout(() => {
      log('setExpiredTokenTO. Token expired. Set isValid = false');
      this.isValid = false;
    }, ms);
  }

  getToken (id) {
    return new Promise((resolve, reject) => {
      const getting = () => {
        if (this.isValid) {
          return resolve(this.tokenInfo.token);
        } else {
          if (this.getting) {
            log(id, 'getToken wait 1s');
            setTimeout(getting, 1000 * 1)
          } else {
            log(id, 'getToken! set getting = true');
            this.getting = true;
            this._getToken(id, (err, tokenInfo) => {
              log(id, 'getToken! set getting = false');
              this.getting = false;
              log(id, 'getToken! set isValid = true');
              this.isValid = true;
              if (err) {
                return reject(err);
              }
              this.tokenInfo = tokenInfo;
              this.checkExpires(); // проверка срока истечения токена (даты)
              return resolve(tokenInfo.token);
            });
          }
        }
      };
      getting();
    });
  }
}

export default Token;
