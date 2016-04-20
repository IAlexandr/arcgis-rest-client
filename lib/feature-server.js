import servers from './servers';
import request from 'superagent';
import atRequest from 'request';
import fs from 'fs';
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
            return reject(new Error('Arcgis server: ' + resBody.error.message));
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
            return reject(new Error('Arcgis server: ' + resBody.error.message));
          }
          return resolve(resBody);
        });
    });
  }

  checkToken(params = {}, id = guid()) {
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
    let params = Object.assign({}, {
      outFields: '*',
      returnGeometry: false,
      where: '1=1'
    }, props);

    params.f = 'json';

    params = this.prepObjectIds(params);
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
          return Promise.reject(new Error('Add error.'));
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
          return Promise.reject(new Error('Update error.'));
        }
        return resBody;
      });
  }

  prepObjectIds(params) {
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

  delete(params) {
    params = this.prepObjectIds(params);
    params.rollbackOnFailure = true;
    log('delete params:', params);
    return this.checkToken(params)
      .then((params) => {
        return this.postRequest(this.featureServerUrl + '/deleteFeatures', params)
      })
      .then(resBody => {
        if (!resBody.success) {
          // todo: error.message содержит больше данных
          return Promise.reject(new Error('Delete error.'));
        }
        return resBody;
      });
  }

  addAttachment(props) {
    log('addAttachment props:', props);
    const params = {
      f: 'json'
    };
    return this.checkToken(params)
      .then((params) => {
        params.objId = props.objId;
        params.rs = fs.createReadStream(props.filePath);
        return this.addAttach(params);
      })
      .then(resBody => {
        if (!!resBody.addAttachmentResult) {
          log('!resBody.addAttachmentResult', resBody);
          // todo: error.message содержит больше данных
          return Promise.reject(new Error('addAttachmentResult error.'));
        }
        return Promise.resolve(resBody);
      });
  }

  addAttach(params) {
    log('in addAttach');
    return new Promise((resolve) => {
      const { objId, rs, token } = params;
      const url = this.featureServerUrl + '/' + objId + '/addAttachment';
      const r = atRequest.post(url, function (err, resp, body) {
        if (err) {
          return Promise.reject(err);
        }
        log(err, body);
        return resolve(body);
      });
      const form = r.form();
      form.append('f', 'json');
      if (token) {
        form.append('token', token);
      }
      form.append('attachment', rs);
    });
  }

  addAttachmentUrl(props) {
    log('addAttachmentUrl props:', props);
    return this.checkToken()
      .then((params) => {
        params.objId = props.objId;
        const rs = atRequest.get(props.fileUrl);
        rs.on('error', function (err) {
          return Promise.reject(err);
        });
        params.rs = rs;
        return this.addAttach(params);
      })
      .then(resBody => {
        log(JSON.stringify(resBody));
        if (!resBody.addAttachmentResult) {
          return Promise.reject(new Error('addAttachmentUrl error.'));
        }
        return resBody;
      });
  }

  deleteAttachment(props) {
    const params = {
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
    return this.checkToken(params)
      .then((params) => {
        return this.postRequest(this.featureServerUrl + '/' + props.objId + '/deleteAttachments', params)
      })
      .then(resBody => {
        if (!resBody.deleteAttachmentResults) {
          // todo: error.message содержит больше данных
          return Promise.reject(new Error('deleteAttachmentResults error.'));
        }
        return resBody;
      });
  }

  attachmentInfos(objId) {
    log('attachmentInfos objId:', objId);
    const params = {
      f: 'json',
    };
    return this.checkToken(params)
      .then((params) => {
        return this.getRequest(this.featureServerUrl + '/' + objId + '/attachments', params)
      })
      .then(resBody => {
        if (!resBody.attachmentInfos) {
          // todo: error.message содержит больше данных
          return Promise.reject(new Error('attachmentInfos error.'));
        }
        return resBody;
      });

  }

  connect(props, id = guid()) { // Для теста id
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
          return Promise.reject(new Error('Passed URL seems to be not an Arcgis FeatureServer' +
            ' REST endpoint'));
        }
        return resBody;
      });
  }
}
