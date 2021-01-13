import express from "express";
import homepageController from "../controllers/homepageController";

let router = express.Router();

//init all web routes
let initWebRoutes = (app) => {
    router.get("/", homepageController.getHomepage);
    router.get("/webhook", homepageController.getWebhook);
    router.post("/webhook", homepageController.postWebhook);
    router.get("/webview", homepageController.getWebview);
    router.post("/webview", homepageController.postWebview);
    router.post("/set-up-profile", homepageController.handleSetupProfile);

    return app.use("/", router);
};

module.exports = initWebRoutes;
