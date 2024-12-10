const config = require('./config.js');

class Logger {
  httpLogger = (req, res, next) => {
    let send = res.send;
    res.send = (resBody) => {
      const logData = {
        authorized: !!req.headers.authorization,
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        reqBody: JSON.stringify(req.body),
        resBody: JSON.stringify(resBody),
      };
      const level = this.statusToLogLevel(res.statusCode);
      this.log(level, 'http', logData);
      res.send = send;
      return res.send(resBody);
    };
    next();
    ///////////
  };

  factoryLogger = (req, res, next) => {
    let send = res.send;
    res.send = (resBody) => {
        const logData = {
            factoryUrl: config.factory.url,
            factoryKey: config.factory.apiKey,
        };
        const level = this.statusToLogLevel(res.statusCode);
        this.log(level, 'factory', logData);
        res.send = send;
        return res.send(resBody);
    }
    next();
  }

  log(level, type, logData) {
    const labels = { component: config.source, level: level, type: type };
    const values = [this.nowString(), this.sanitize(logData)];
    const logEvent = { streams: [{ stream: labels, values: [values] }] };

    this.sendLogToGrafana(logEvent);
  }

  statusToLogLevel(statusCode) {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
  }

  nowString() {
    return (Math.floor(Date.now()) * 1000000).toString();
  }

  sanitize(logData) {
    logData = JSON.stringify(logData);
    return logData.replace(/\\"password\\":\s*\\"[^"]*\\"/g, '\\"password\\": \\"*****\\"');
  }

  sendLogToGrafana(event) {
    const body = JSON.stringify(event);
    fetch(`${config.logging.url}`, {
      method: 'post',
      body: body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.logging.userId}:${config.logging.apiKey}`,
      },
    }).then((res) => {
      if (!res.ok) console.log('Failed to send log to Grafana');
      //need to print out the actual error
    });
  }
}
module.exports = new Logger();





// I have to write about 3ish more UNIT TESTS for orderRouter, bc the
// test things are failing right now because i don't have enough coverage

// it might also be an issue that there isn't any coverage for metrics.js
// but worry about writing unit tests for order routher first




//for the http requests, it's gonna be similar to the http logger from the 
    // pre assignment, except you're gonna want to, in the logData section,
    // get the information that it asks for in the roman numerals part
    // of the first point of what the deliverable wants

//database request info, you made a note already in database.js, but
    // it's getting those capitalized statements with the asterisks,
    // putting them into their own variable, putting that variable 
    // into the log call, and THEN putting that variable
    // back into where the line was called before you had to 
    // change things

// factory service requests similar to the http requests, but for 
    // factory stuff instead

// unhandled exceptions part is for logging wherever you have like a catch block,
    // basically wherever you're dealing with an error statement kinda thing

    //sanitizing the log entries happens already from the logger
        // example code