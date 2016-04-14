import Token from './token';

export default class ArcgisServer extends Token {
  constructor(props, options) {
    super(props, options);
    this.options = options;
    this.serverUrl = props.serverUrl;
  }

  // TODO различные rest операции ..
}
