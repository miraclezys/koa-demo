let http = require('http');
let context = require('./context');
let request = require('./request');
let response = require('./response');

class Application {
    constructor() {
        this.context = context;
        this.request = request;
        this.response = response;
        this.middleware = [];
        this.callbackFunc;
    }

    listen(port, callback) {
        let server = http.createServer(this.callback());
        server.listen(port, callback);
    }

    use(fn) {
        this.middleware.push(fn);
        return this;
    }

    createContext(req, res) {
        let ctx = Object.create(this.context);
        
        ctx.request = Object.create(this.request);
        ctx.response = Object.create(this.response);
        ctx.req = ctx.request.req = req;
        ctx.res = ctx.response.res = res;
    
        return ctx;
    }

    compose() {
        return async ctx => {
            function createNext(middleware, oldNext) {
                return async () => {
                    await middleware(ctx, oldNext);
                }
            }

            let len = this.middleware.length;
            let next = async () => {
                return Promise.resolve();
            };

            for(let i=len-1; i>=0; i--) {
                let currentMiddleware = this.middleware[i];
                next = createNext(currentMiddleware, next);
            }
            
            await next();
        }
    }

    callback() {
        const fn = this.compose(this.middleware);

        const handleRequest = (req, res) => {
            const ctx = this.createContext(req, res);
            return fn(ctx);
        }

        return handleRequest;
    }
}

module.exports = Application;
