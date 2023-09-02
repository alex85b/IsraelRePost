const express = require("express");

const { AllBranches } = require("./js-build/routes/AllBranches");
const errorHandler = require("./js-build/middlewares/error-handler");
const { TestLab } = require("./js-build/routes/TestLab");
const { TimeSlots } = require("./js-build/routes/TimeSlots");

//! Hide this service behind authentication and or authorization.

const port = 3000;

const onListen = () => {
	console.log(`### Scrape service listens to port ${port} ###`);
};

const app = express();

app.use(AllBranches);
app.use(TimeSlots);
app.use(TestLab);
app.all("*", () => {
	throw new Error("Route not found");
});

// custom error handler.
app.use(errorHandler);

app.listen(port, onListen);
