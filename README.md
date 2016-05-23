arcgis-rest-client
==================

ArcGIS Server REST API client module for Node.js

```js
import { ArcgisServer, FeatureServer } from 'arcgis-rest-client';

const featureServerUrl = 'http://your-arcgis-host/arcgis/rest/services/test/testFS/FeatureServer/0';
const username = '****';
const password = '****';

const featureServer = new FeatureServer({ featureServerUrl, username, password });

featureServer.connect().then(connected => {}).catch(err => {});

// Query            // result = { fields, fieatures }
featureServer.query({<options>}).then(result => {}).catch(err => {});
// Count only
featureServer.queryCount({<options>}).then(count => {}).catch(err => {});
// Add features
featureService.add([<features>]).then(result => {}).catch(err => {});
// Update features
featureService.update([<features>]).then(result => {}).catch(err => {});
// Delete features
featureService.delete([<options>]).then(result => {}).catch(err => {});
// Get attachmentInfos
featureServer.attachmentInfos(<OBJECTID>).then(result => {}).catch(err => {});
// Add attachment
featureServer.addAttachment({ objId, filePath }).then(result => {}).catch(err => {});
// Add attachment by url
featureServer.addAttachmentUrl({ objId, fileUrl }).then(result => {}).catch(err => {});
// Delete attachments
featureServer.deleteAttachment({ objId, attachmentIds: [<attachmentIds>] })
	.then(result => {}).catch(err => {});
```
