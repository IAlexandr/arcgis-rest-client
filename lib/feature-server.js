import servers from './servers';
import request from 'superagent';
import requestProxy from 'superagent-proxy';
requestProxy(request);
import urlworks from './urlworks';
import debug from 'debug';
const log = debug('arcgis');

const guid = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4()} ${s4()} - ${s4()} - ${s4()} - ${s4()} - ${s4()} ${s4()} ${s4()}`;
};

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
      let req = request.get(url);

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
          if (!!resBody.error) {
            throw new Error('Arcgis server: ' + resBody.error.message);
          }
          return resolve(resBody);
        });
    });
  }

  postRequest(url, params) {
    return new Promise((resolve, reject) => {

      params = Object.assign({}, {
        f: 'json'
      }, params);

      let req = request.post(url);

      if (this.options.proxy) {
        req = req.proxy(this.options.proxy);
      }

      req
        .type('form')
        .send(params)
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
          if (!!resBody.error) {
            throw new Error('Arcgis server: ' + resBody.error.message);
          }
          return resolve(resBody);
        });
    });
  }

  checkToken(params, id = guid()) {
    if (this.server.needToken) {
      return this.server.getToken(id)
        .then(token => {
          log(id, 'token:', token);
          params.token = token;
          return params;
        });
    }
    return Promise.resolve(params);
  }

  query(props = { where: '1=1' }) {
    const params = Object.assign({}, {
      outFields: '*',
      returnGeometry: false,
      where: '1=1'
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
    return this.checkToken(params)
      .then((params) => {
        return this.getRequest(this.featureServerUrl + '/query', params)
      });
  }

  queryCount(props = {}) {
    props.returnCountOnly = true;
    return this.query(props)
      .then(result => {
        if (!result.hasOwnProperty('count')) {
          return Promise.reject(new Error('Query result error: no count property returned.'));
        }
        return result.count;
      });
  }

  add(features) {
    const params = {
      features: JSON.stringify(features)
    };
    log('add params:', params);
    return this.checkToken(params)
      .then((params) => {
        return this.postRequest(this.featureServerUrl + '/addFeatures', params)
      })
      .then(resBody => {
        if (!resBody.addResults) {
          // todo: error.message содержит больше данных
          throw new Error('Add error.');
        }
        return resBody;
      });
  }

  update(features) {
    const params = {
      features: JSON.stringify(features)
    };
    log('update params:', params);
    return this.checkToken(params)
      .then((params) => {
        return this.postRequest(this.featureServerUrl + '/updateFeatures', params)
      })
      .then(resBody => {
        if (!resBody.updateResults) {
          // todo: error.message содержит больше данных
          throw new Error('Update error.');
        }
        return resBody;
      });
  }

  delete(params) {
    params.rollbackOnFailure = true;
    log('update params:', params);
    return this.checkToken(params)
      .then((params) => {
        return this.postRequest(this.featureServerUrl + '/deleteFeatures', params)
      })
      .then(resBody => {
        // TODO проверить что лежит в deleteResults
        if (!resBody.success) {
          // todo: error.message содержит больше данных
          throw new Error('Update error.');
        }
        return resBody;
      });
  }

  addAttachment(params) {
    // TODO
  }

  addAttachmentUrl() {
    // TODO
  }

  attachmentInfos() {
    // TODO
  }
  
  connect(id = guid()) { // Для теста id
    log(id, 1);
    const params = {
      f: 'json',
    };
    return this.checkToken(params, id)
      .then((params) => {
        log(id, 2);
        return this.getRequest(this.featureServerUrl, params)
      })
      .then(resBody => {
        log(id, 3);
        log(id, resBody.type);
        if (!(resBody.type && resBody.type === 'Feature Layer')) {
          throw new Error('Passed URL seems to be not an Arcgis FeatureServer REST endpoint');
        }
        return resBody;
      });
  }
}
