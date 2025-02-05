import express, { type Express } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { CONFIG } from "./src/config";
import { appRouter } from "./src/routes";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./src/middleware/globalErrMiddleware";
import { ResponseMiddleware } from "./src/middleware/responseMiddleware";

const app: Express = express();

app.use(cors({ origin: true, credentials: true }));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(bodyParser.json());
app.use(cookieParser());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  // res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(ResponseMiddleware);

app.use("/public", express.static("public"));

appRouter(app);

app.all("*", notFoundMiddleware);
app.use(errorMiddleware);

app.listen(CONFIG.port, () => {
  console.log(`Server running on port ${CONFIG.port}`);
});
