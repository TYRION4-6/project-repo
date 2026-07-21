const EventEmitter = require("events");

// Create a single instance of EventEmitter to be shared across the backend
const salesEmitter = new EventEmitter();

module.exports = salesEmitter;
