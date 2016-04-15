import arcgis from './../index';
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
        featureServer.delete({ where: "OBJECTID='" + +feature.attributes['OBJECTID'] + "'"})
          .then(result => {
            log('FeatureServer delete result: ', result); // { success: true }
          });
      })
      .catch(err => {
        log('FeatureServer.testDelete err: ', err);
      });
  }

  function testAttachmentInfo() {
    log('start testAttachmentInfo()');
    featureServer.query({ returnGeometry: false })
      .then(result => {
        log('FeatureServer: result.features.length ', result.features ? result.features.length : ' null');
        const feature = result.features[0];
        featureServer.attachmentInfos(3603)//(feature.attributes['OBJECTID'])
          .then(result => {
            log('FeatureServer attachmentInfos result: ', result); // { success: true }
          });
      })
      .catch(err => {
        log('FeatureServer.testAttachmentInfo err: ', err);
      });
  }
  // testMultiConnection();

  //testQuery();
  // testQueryCount();
  // TODO проверить testAdd(); + все с attachment
  // testAdd();
  // testUpdate();
  // testDelete();
  // testAttachmentInfo();

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
