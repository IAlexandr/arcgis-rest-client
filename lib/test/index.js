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
        log('FeatureServer: result.fields.length ', result.features ? result.features.length : ' null');
      })
      .catch(err => {
        log('FeatureServer.query err: ', err);
      });
  }

  // testMultiConnection();
  testQuery();
}

// const featureServerUrl = 'https://chebtelekom.ru/arcgis/rest/services/NTO/festtradeobjects/FeatureServer/0';
const username = '****';
const password = '****';

// var featureServer = new arcgis.FeatureServer({ featureServerUrl, username, password });
// test(featureServer);

const featureServerUrl = 'https://chebtelekom.ru/arcgis/rest/services/test/test_ai/FeatureServer/0';
var featureServer = new arcgis.FeatureServer({ featureServerUrl });
test(featureServer);