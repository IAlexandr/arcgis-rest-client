import servers from './servers';
import request from 'superagent';
import requestProxy from 'superagent-proxy';
requestProxy(request);
import urlworks from './urlworks';
import debug from 'debug';
const log = debug('arcgis');

export default class FeatureServer {
  constructor(props, options = {}) {
    const { featureServerUrl, username, password } = props;
    this.featureServerUrl = featureServerUrl;
    this.username = username;
    this.password = password;
    this.serverUrl = urlworks.toArcgisServerBaseUrl(featureServerUrl);
    this.options = options;
    this.server = servers.getServer({ serverUrl: this.serverUrl, username, password }, options);
  }

  getRequest(url, params) {
    return new Promise((resolve, reject) => {
      let req = request
        .get(url);

      if (this.options.proxy) {
        req = req.proxy(this.options.proxy);
      }

      req
        .query(params)
        .accept('json')
        .end((err, res) => {
          if (err) {
            return reject(err);
          }
          if (!res.ok) {
            return reject(new Error('Query error (server response not ok).'));
          }
          let resBody;
          try {
            resBody = JSON.parse(res.text);
          } catch (e) {
            return reject(new Error('Query error (JSON parse error).'));
          }
          return resolve(resBody);
        });
    });
  }

  checkToken(params) {
    if (this.server.needToken) {
      return this.server.getToken()
        .then(token => {
          log('token:', token);
          params.token = token;
          return params;
        });
    }
    return params;
  }

  // postRequest(url, params) {
  //
  // }

  connect() {
    const getReq = (url, params) => {
      return this.getRequest(url, params)
        .then(fsInfo => {
          // todo: Сделать более широкую проверку типа слоя
          log(fsInfo.type);
          if (!(fsInfo.type && fsInfo.type === 'Feature Layer')) {
            throw new Error('Passed URL seems to be not an Arcgis FeatureServer REST endpoint');
          }
          return fsInfo;
        });
    };

    const params = {
      f: 'json',
    };
    if (this.server.needToken) {
      return this.server.getToken()
        .then(token => {
          log('token:', token);
          params.token = token;
          return getReq(this.featureServerUrl, params);
        });
    } else {
      return getReq(this.featureServerUrl, params);
    }
  }

  // TODO Добавление/изенение/удаление/поиск объектов в слое.

  query(props = { where: '1=1' }) {
    const params = Object.assign({}, {
      outFields: '*',
      returnGeometry: false,
    }, props);

    params.f = 'json';

    if (params.objectIds) {
      if (Object.prototype.toString.call(params.objectIds) === '[object Array]') {
        params.objectIds = params.objectIds.join(', ');
      } else {
        if (typeof params.objectIds !== 'string') {
          log('objectIds type not supported.');
        }
      }
    }
    log('query params:', params);
    return this.getRequest(this.featureServerUrl, params);
  }

}
