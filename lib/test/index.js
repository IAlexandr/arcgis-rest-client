import arcgis from './../index';
import path from 'path';
import debug from 'debug';
const log = debug('arcgis');

function test(featureServer) {

  function testMultiConnection() {
    featureServer.connect()
      .then(fsInfo => {
        log(4);
        log('FeatureServer: ', fsInfo ? 'CONNECTED' : 'NOT CONNECTED');
      })
      .catch(err => {
        log('FeatureServer.connect err: ', err);
      });
    log('-----');
    featureServer.connect()
      .then(fsInfo => {
        log(4);
        log('FeatureServer: ', fsInfo ? 'CONNECTED' : 'NOT CONNECTED');
      })
      .catch(err => {
        log('FeatureServer.connect err: ', err);
      });
    setTimeout(() => {
      featureServer.connect()
        .then(fsInfo => {
          log(4);
          log('FeatureServer: ', fsInfo ? 'CONNECTED' : 'NOT CONNECTED');
        })
        .catch(err => {
          log('FeatureServer.connect err: ', err);
        });
    }, 60000);
  }

  function testQuery() {
    featureServer.query({ returnGeometry: true })
      .then(result => {
        log('FeatureServer: result.fields.length ', result.fields.length);
        log('FeatureServer: result.features.length ', result.features ? result.features.length : ' null');
      })
      .catch(err => {
        log('FeatureServer.query err: ', err);
      });
  }

  function testQueryCount() {
    featureServer.queryCount()
      .then(count => {
        log('FeatureServer: count ', count);
      })
      .catch(err => {
        log('FeatureServer.queryCount err: ', err);
      });
  }

  function testAdd() {
    log('start testAdd()');
    featureServer.query({ returnGeometry: true })
      .then(result => {
        log('FeatureServer: result.features.length ', result.features ? result.features.length : ' null');
        featureServer.add([result.features[0]])
          .then(result => {
            log('FeatureServer add result: ', result);
          });
      })
      .catch(err => {
        log('FeatureServer.testAdd err: ', err);
      });
  }

  function testUpdate() {
    log('start testUpdate()');
    featureServer.query({ returnGeometry: true })
      .then(result => {
        log('FeatureServer: result.features.length ', result.features ? result.features.length : ' null');
        const feature = result.features[0];

        feature.attributes['площадь'] = '1111111111';
        featureServer.update([feature])
          .then(result => {
            log('FeatureServer update result: ', result);
          });
      })
      .catch(err => {
        log('FeatureServer.testUpdate err: ', err);
      });
  }

  function testDelete() {
    log('start testDelete()');
    featureServer.query({ returnGeometry: false })
      .then(result => {
        log('FeatureServer: result.features.length ', result.features ? result.features.length : ' null');
        const feature = result.features[0];
        featureServer.delete({ where: "OBJECTID='" + +feature.attributes['OBJECTID'] + "'" })
          .then(result => {
            log('FeatureServer delete result: ', result); // { success: true }
          });
      })
      .catch(err => {
        log('FeatureServer.testDelete err: ', err);
      });
  }

  function testAttachmentInfos() {
    log('start testAttachmentInfos()');
    featureServer.query({ returnGeometry: false })
      .then(result => {
        log('FeatureServer: result.features.length ', result.features ? result.features.length : ' null');
        const feature = result.features[0];
        featureServer.attachmentInfos(feature.attributes['OBJECTID'])
          .then(result => {
            log('FeatureServer attachmentInfos result: ', result); // { success: true }
          });
      })
      .catch(err => {
        log('FeatureServer.testAttachmentInfos err: ', err);
      });
  }

  function testAddAttachment() {
    log('start testAddAttachment()');
    const filePath = path.resolve(process.cwd(), './lib/test/1_1_1.jpg');
    log('filePath: ', filePath);
    featureServer.query({ returnGeometry: false })
      .then(result => {
        log('FeatureServer: result.features.length ', result.features ? result.features.length : ' null');
        const feature = result.features[0];
        featureServer.addAttachment({
            objId: feature.attributes['OBJECTID'],
            filePath
          })
          .then(result => {
            console.log(22222);
            log('FeatureServer addAttachment result: ', result); // { success: true }
          });
      })
      .catch(err => {
        log('FeatureServer.testAddAttachment err: ', err);
      });
  }

  function testUrlAddAttachment() {
    log('start testUrlAddAttachment()');
    const fileUrl = 'http://gisweb.gcheb.cap.ru/geoworks/admin/img/1387821817_Network-Service.png';//'https://www.npmjs.com/static/images/npm-logo.svg';
    log('fileUrl: ', fileUrl);
    featureServer.query({ returnGeometry: false })
      .then(result => {
        log('FeatureServer: result.features.length ', result.features ? result.features.length : ' null');
        const feature = result.features[0];
        featureServer.addAttachmentUrl({
            objId: feature.attributes['OBJECTID'],
            fileUrl
          })
          .then(result => {
            log('FeatureServer testUrlAddAttachment result: ', result); // { success: true }
          });
      })
      .catch(err => {
        log('FeatureServer.testUrlAddAttachment err: ', err);
      });
  }

  function testDeleteAttachment() {
    log('start testDeleteAttachment()');
    featureServer.query({ returnGeometry: false })
      .then(result => {
        log('FeatureServer: result.features.length ', result.features ? result.features.length : ' null');
        const feature = result.features[0];
        featureServer.attachmentInfos(feature.attributes['OBJECTID'])
          .then(result => {
            log(result);
            if (result.attachmentInfos.length > 0) {
              const attachmentInfo = result.attachmentInfos[0];
              featureServer.deleteAttachment({ objId: feature.attributes['OBJECTID'], attachmentIds: [attachmentInfo.id] })
                .then(result => {
                  log('FeatureServer testDeleteAttachment result: ', result); // { success: true }
                });
            }
          });
      })
      .catch(err => {
        log('FeatureServer.testDeleteAttachment err: ', err);
      });
  }

  // testMultiConnection();

  //testQuery();
  // testQueryCount();
  // TODO проверить testAdd(); + все с attachment
  // testAdd();
  // testUpdate();
  // testDelete();
  // testAttachmentInfos();
  // testAddAttachment();
  // testUrlAddAttachment();
  testDeleteAttachment();
}

// const featureServerUrl = 'https://chebtelekom.ru/arcgis/rest/services/NTO/festtradeobjects/FeatureServer/0';
// const username = '****';
// const password = '****';
//
// var featureServer = new arcgis.FeatureServer({ featureServerUrl, username, password });
// test(featureServer);

const featureServerUrl = 'http://gisweb.gcheb.cap.ru/arcgis/rest/services/cheb/oks_soc/FeatureServer/0';//'https://chebtelekom.ru/arcgis/rest/services/test/test_ai/FeatureServer/0';
var featureServer = new arcgis.FeatureServer({ featureServerUrl });
test(featureServer);
