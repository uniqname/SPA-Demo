(function () {
    'use strict';

    let http = require('http'),
        fs = require('fs'),
        path = require('path'),
        url = require('url'),

        html = fs.readFileSync('./index.html'),
        sso = fs.readFileSync('./sso.html'),

        routes = {
            '/api/secure': function (req, resp) {
                if (req.headers['x-token'] === 'true') {
                    resp.end(JSON.stringify({
                        data: 'secure data'
                    }));
                } else {
                    resp.statusCode = 401;
                    resp.end(JSON.stringify({
                        location: '/sso'
                    }));
                }
            },
            '/sso': function (req, resp) {
                let form = '';
                req.on('data', function (data) {
                    form += data;
                });
                req.on('end', function () {
                    if (form) {
                        resp.writeHead(302, {
                            'Set-Cookie': `X-Token=true; expires=${new Date(new Date().getTime()+1000).toUTCString()}`,
                            'Location': decodeURIComponent(url.parse(req.url, true).query.from)
                        });
                        resp.end();
                    } else {
                        resp.end(sso);
                    }
                })
            },
            '/index': function (req, resp) {
                resp.end(html);
            },
            '/404': function (req, resp) {
                resp.statusCode = 404;
                resp.end('Not Found');
            }
        };

    function reqHandler(req, resp) {
        let pathname = url.parse(req.url).pathname;
        if (pathname.match(/^\/static|^\/favicon\.ico/)) {
            let staticPath = path.join(__dirname, pathname);
            fs.readFile(staticPath, {encoding: 'utf8'}, function (err, data) {
                if (err) {
                    routes['/404'](req, resp);
                } else {
                    resp.end(data);
                }
            });
        } else {
            (routes[pathname] || routes['/index'])(req, resp);
        }
    }

    let server = http.createServer(reqHandler);
    const PORT = 8080;

    server.listen(PORT, function (err) {
        if (err) {
            console.error(err);
        }
        console.log(`Listening on port ${PORT}`);
    });
})();
