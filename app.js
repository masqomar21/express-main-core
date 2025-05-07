"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const config_1 = require("./src/config");
const http_1 = __importDefault(require("http"));
const socket_1 = require("./src/config/socket");
const responseMiddleware_1 = require("./src/middlewares/responseMiddleware");
const routes_1 = require("./src/routes");
const globalErrMiddleware_1 = require("./src/middlewares/globalErrMiddleware");
const parseArgs_1 = __importDefault(require("./src/utils/parseArgs"));
process.env.TZ = 'Asia/Jakarta';
const argsObj = (0, parseArgs_1.default)(['--port']);
if (argsObj.port) {
    if (isNaN(Number(argsObj.port))) {
        console.error('Port must be a number');
        process.exit(1);
    }
    if (Number(argsObj.port) < 0 || Number(argsObj.port) > 65535) {
        console.error('Port must be between 0 and 65535');
        process.exit(1);
    }
    config_1.CONFIG.port = Number(argsObj.port);
}
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = (0, socket_1.init)(server);
app.use((0, cors_1.default)({ origin: true, credentials: true }));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    // res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Clinet disconnected:', socket.id);
    });
});
app.use(responseMiddleware_1.ResponseMiddleware);
app.use('/public', express_1.default.static('public'));
(0, routes_1.appRouter)(app);
app.all('*', globalErrMiddleware_1.notFoundMiddleware);
app.use(globalErrMiddleware_1.errorMiddleware);
server.listen(config_1.CONFIG.port, () => {
    console.log(`Server running on port ${config_1.CONFIG.port}`);
});
