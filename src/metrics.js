const config = require('./config.json');
const os = require('os');

class Metrics {
  constructor() {
    this.totalRequests = 0;
        // This will periodically sent metrics to Grafana
    this.postrequest = 0;

    this.deleterequest = 0;

    this.getrequest = 0;

    this.putrequest = 0;

    this.usersLoggedIn = 0;
    //authenticate
    //message
    //total

    this.successfulAuthentication = 0;
    //authenticate

    this.failedAuthentication = 0;
    //authenticate

    this.memoryPercentage = 0;

    this.cpuPercentage = 0;

    this.pizzasSold = 0;

    this.creationFailures = 0;

    this.creationSuccesses = 0;

    this.currentRevenue = 0;
    this.totalRevenue = 0;

    this.timePassed = 0;

    //pizza
    //latency
    //total

    //pizza revenue total
    //pizza create total
    //total

    //os
    //memory
    //total

    //os
    //cpu
    //total

    this.sendMetricsPeriodically(10000);

    // const timer = setInterval(() => {
    //   this.sendMetricToGrafana('request', 'all', 'total', this.totalRequests);
    //   this.sendMetricToGrafana('request', 'post', 'total', this.postrequest);
    //   this.sendMetricToGrafana('request', 'delete', 'total', this.deleterequest);
    //   this.sendMetricToGrafana('request', 'get', 'total', this.getrequest);
    //   this.sendMetricToGrafana('authenticate', 'users logged in', 'total', this.usersLoggedIn);
    //   this.sendMetricToGrafana('authenticate', 'successful authentication', 'total', this.successfulAuthentication);
    //   this.sendMetricToGrafana('authenticate', 'failed authentication', 'total', this.failedAuthentication);
    //   this.sendMetricToGrafana('pizza', 'pizzas sold', 'total', this.pizzasSold);
    //   this.sendMetricToGrafana('pizza', 'pizza success creation total', 'total', this.creationSuccesses);
    //   this.sendMetricToGrafana('pizza', 'pizza failure creation total', 'total', this.creationFailures);
    //   this.sendMetricToGrafana('pizza revenue total', 'current revenue', 'total', this.currentRevenue);
    //   this.sendMetricToGrafana('pizza revenue total', 'total revenue', 'total', this.totalRevenue);
    //   console.log("sent");
    // }, 10000);
    // timer.unref();
  }

  incrementRequests() {
    this.totalRequests++;
  }

  incrementPostRequests() {
    this.postrequest++;
    console.log("hit post request function");
  }

  incrementDeleteRequests() {
    this.deleterequest++;
    console.log("hit delete request function");
  }

  incrementGetRequests() {
    this.getrequest++;
    console.log("hit get request function");
  }

  incrementPutRequests() {
    this.putrequest++;
    console.log("hit put request function");
  }

  userIsLoggedIn() {
    this.usersLoggedIn++;
    console.log("user is logged in");
  }

  userIsLoggedOut() {
    this.usersLoggedIn--;
    console.log("user is logged out");
  }

  incrementSuccessAuth() {
    this.successfulAuthentication++;
    console.log("User has been successfully authenticated");
  }

  incrementFailureAuth() {
    this.failedAuthentication++;
    console.log("User has NOT been successfully authenticated");
  }

  incrementPizzasSold() {
    this.pizzasSold++;
    console.log("more pizzas have been sold");
  }

  incrementCreationSuccesses() {
    this.creationSuccesses++;
    console.log("Pizza has been created");
  }

  incrementCreationFailures() {
    this.creationFailures++;
    console.log("Pizza has failed to be created");
  }

  currentPizzaRevenue(currRev) {
    this.currentRevenue = currRev;
    console.log("Current pizza revenue: ", this.currentRevenue);
  }

  incrementTotalRevenue(currRev) {
    this.totalRevenue += currRev;
    console.log("Added to total revenue. Total revenue is: ", this.totalRevenue);
  }

  incrementRequestProcessingTime(elapsedTime) {
    this.timePassed = elapsedTime;
    console.log('Request processing time: ${elapsedTime} ms');
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {

    const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;

    // const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;

    fetch(`${config.url}`, {
      method: 'post',
      body: metric,
      headers: { Authorization: `Bearer ${config.userId}:${config.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error('Failed to push metrics data to Grafana');
        } else {
          console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
      });
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
  }
  
  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }

  sendSystemMetrics() {
    this.cpuPercentage = this.getCpuUsagePercentage();
    this.memoryPercentage = this.getMemoryUsagePercentage();

    this.sendMetricToGrafana('os', 'cpu', 'usage', this.cpuPercentage);
    this.sendMetricToGrafana('os', 'memory', 'usage', this.memoryPercentage);
  }

  sendAppMetrics() {
    this.sendMetricToGrafana('request', 'all', 'total', this.totalRequests);
    this.sendMetricToGrafana('request', 'post', 'total', this.postrequest);
    this.sendMetricToGrafana('request', 'delete', 'total', this.deleterequest);
    this.sendMetricToGrafana('request', 'get', 'total', this.getrequest);
    this.sendMetricToGrafana('authenticate', 'users logged in', 'total', this.usersLoggedIn);
    this.sendMetricToGrafana('authenticate', 'successful authentication', 'total', this.successfulAuthentication);
    this.sendMetricToGrafana('authenticate', 'failed authentication', 'total', this.failedAuthentication);
    this.sendMetricToGrafana('pizza', 'pizzas sold', 'total', this.pizzasSold);
    this.sendMetricToGrafana('pizza', 'pizza success creation total', 'total', this.creationSuccesses);
    this.sendMetricToGrafana('pizza', 'pizza failure creation total', 'total', this.creationFailures);
    this.sendMetricToGrafana('pizza revenue total', 'current revenue', 'total', this.currentRevenue);
    this.sendMetricToGrafana('pizza revenue total', 'total revenue', 'total', this.totalRevenue);
    this.sendMetricToGrafana('order', 'pizza creation latency', 'total', this.timePassed);
  }

  sendMetricsPeriodically(period) {
    const timer = setInterval(() => {
        //call cpu and memory functions somewhere in here
      try {
        // const buf = new MetricBuilder();

        // httpMetrics(buf);
        // systemMetrics(buf);
        // userMetrics(buf);
        // purchaseMetrics(buf);
        // authMetrics(buf);
  
        // const metrics = buf.toString('\n');
        // this.sendMetricToGrafana(metrics);

        this.sendSystemMetrics();
        this.sendAppMetrics();

      } catch (error) {
        console.log('Error sending metrics', error);
      }
    }, period);
  }
}

const metrics = new Metrics();
module.exports = metrics;


//1. did in warmup assignment
    //reported in time graph like for warmup 
    //also change index.js
//2. how many ppl are logged in at a certain time
    //when a user logs in, can keep track of userid
        //when they logout, remove from data structure
        //keep track of active users
        //mess w authrouter
//3. ties w 2
    //how many times someone's logged in/# of successful times
    //and # of failed times
    //use authrouther 
//4 & 5. code in the deliverable instructions
    //counter up and down for creation failures
    //another counter for revenue (get curr rev and add to total)
    //keep track of the current revenue
//6. modding order router
    //