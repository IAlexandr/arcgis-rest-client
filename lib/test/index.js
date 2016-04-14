import arcgis from './../index';
import debug from 'debug';
const log = debug('arcgis');

function test () {
  const featureServerUrl = 'https://chebtelekom.ru/arcgis/rest/services/NTO/festtradeobjects/FeatureServer/0';
  const username = 'arcgis';
  const password = 'Informatica21';

  var featureServer = new arcgis.FeatureServer({ featureServerUrl, username, password });

  featureServer.connect()
    .then(fsInfo => {
      log('FeatureServer: ', fsInfo ? 'CONNECTED' : 'NOT CONNECTED');
    })
    .catch(err => {
      log('FeatureServer.connect err: ', err);
    });
  /*featureServer.query()
    .then(result => {
      log('FeatureServer: ', result);
    })
    .catch(err => {
      log('FeatureServer.query err: ', err);
    });*/
}

test();
