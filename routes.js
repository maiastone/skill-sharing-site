let Router = module.exports = function() {
  this.routes = [];
};

Router.proptotype.add = function(method, url, handler) {
  this.routes.push ({
    method,
    url,
    handler,
  });
};

Router.prototype.resolve = function(request, resolve) {
  let path = require('url').parse(request.url).pathname;
  return this.routes.some(function(route) {
    let match = route.url.exec(path);
    if (!match || route.method != request.method) {
      return false;
    }
    let urlParts = match.slice(1).map(decodeURIComponent);
    route.handler.apply(null, [request, response].concat(urlParts));
    return true;
  });
};
