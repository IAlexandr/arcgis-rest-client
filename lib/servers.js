import ArcgisServer from './arcgis-server';

export default {
  servers: [],
  getServer (props, options = {}) {
    const _this = this;
    const { serverUrl, username, password } = props;
    let resServer;
    for (let i = 0; i < _this.servers; i++) {
      let server = _this.servers[i];
      if (
        server.serverUrl === serverUrl &&
        server.username === username &&
        server.password === password
      ) {
        resServer = server;
        break;
      }
    }
    if (!resServer) {
      resServer = _this.addServer(props, options);
    }
    return resServer;
  },
  addServer (props, options) {
    return new ArcgisServer(props, options);
  }
}
