const EventEmitter = require("events");
class DashboardEmitter extends EventEmitter {}
const dashboardEmitter = new DashboardEmitter();
module.exports = dashboardEmitter;
