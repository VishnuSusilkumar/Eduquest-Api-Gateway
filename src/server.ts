import App from "./app";
import "dotenv/config";

const port = Number(process.env.GATEWAY_PORT || 3000);
new App().startServer(port);
