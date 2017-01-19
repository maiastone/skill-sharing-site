import http from 'http';
import Router from './router';
import ecstatic from 'ecstatic';

const fileServer = ecstatic({
  root: './public'
});
const router = new Router();

http.createServer(function(request, response) {
  if (!router.resolve(request, response)) {
    fileServer(request, response);
  }
}).listen(8000);

function respond(response, status, data, type) {
  response.writeHead(status, {
    'Content-Type': type || 'text/plain'
  });
  response.end(data);
}

function respondJason(response, status, data) {
  respond(response, status, JSON.stringify(data), 'application/json');
}
