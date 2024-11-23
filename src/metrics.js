const config = require('./config.js');
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
    this.pizzaTimePassed = 0;

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

    this.sendMetricsPeriodically(7000);

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
    //console.log("hit post request function");
  }

  incrementDeleteRequests() {
    this.deleterequest++;
    //console.log("hit delete request function");
  }

  incrementGetRequests() {
    this.getrequest++;
    //console.log("hit get request function");
  }

  incrementPutRequests() {
    this.putrequest++;
    //console.log("hit put request function");
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
    //console.log("more pizzas have been sold");
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
    //console.log("Added to total revenue. Total revenue is: ", this.totalRevenue);
  }

  incrementRequestProcessingTime(elapsedTime) {
    this.timePassed = elapsedTime;
    //console.log(`Request processing time: ${elapsedTime} ms`);
  }

  incrementPizzaRequestProcessingTime(elapsedTime) {
    this.pizzaTimePassed = elapsedTime;
    //console.log(`Request pizza creation processing time: ${elapsedTime} ms`);
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {

    const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;
    // console.log('sending metric: ', metric);
    // const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;
    console.log(config.metrics.source);     
    console.log(config.metrics.url);
    console.log(config.metrics.apiKey);
    console.log(config.metrics.userId);
    fetch(`${config.metrics.url}`, {
      method: 'post',
      body: metric,
      headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    })
      .then((response) => {
        // console.log('metrics response: ', response.status);
        if (!response.ok) {
          //console.error('Failed to push metrics data to Grafana');
          //console.log(response.status);
        }
        else {
          console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
      });
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return parseFloat(cpuUsage.toFixed(2)) * 100;
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
    this.sendMetricToGrafana('request', 'put', 'total', this.putrequest);
    this.sendMetricToGrafana('authenticate', 'users_logged_in', 'total', this.usersLoggedIn);
    this.sendMetricToGrafana('authenticate', 'successful_authentication', 'total', this.successfulAuthentication);
    this.sendMetricToGrafana('authenticate', 'failed_authentication', 'total', this.failedAuthentication);
    //maybe log this out to see what the info is here
    this.sendMetricToGrafana('pizza', 'pizzas_sold', 'total', this.pizzasSold);
    this.sendMetricToGrafana('pizza', 'pizza_success_creation_total', 'total', this.creationSuccesses);
    this.sendMetricToGrafana('pizza', 'pizza_failure_creation_total', 'total', this.creationFailures);
    this.sendMetricToGrafana('pizza_revenue_total', 'current_revenue', 'total', this.currentRevenue);
    this.sendMetricToGrafana('pizza_revenue_total', 'total_revenue', 'total', this.totalRevenue);
    this.sendMetricToGrafana('order', 'pizza_creation_latency', 'total', this.pizzaTimePassed);
    this.sendMetricToGrafana('request', 'all_request_latency', 'total', this.timePassed);

    //console.log(config);
  }

  sendMetricsPeriodically(period) {
    //const timer = setInterval(() => {
    setInterval(() => {
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
    }, period).unref();
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










    // OK so!
      // I'm having issues where it's not wanting to push some metrics to
      // Grafana. I think its an issue with login or with the menu 

      // it let me log in a user when i re-ran my front and back end but
      // wouldn't give me an error for them when I tried to log in again
      // I think after logging them out

      // it also doesn't want to login the franchisee that's already supposed
        // to be there in the system. 

      // it's also reminding me that I did something weird in my tests
        // where I generated a random name for a store and then 
        // added an item to the menu (a pepperoni pizza). Now I have
        // a bunch of random-letter store names and hundreds of specifically
        // pepperoni pizzas ONLY to order. How would I be able to clear that 
        // back up/ get it back to normal while still keeping the integrity
        // of my tests?

      // and i could've sworn I haven't messed around that much with my login
      // so I have NO idea why it isn't working the way its supposed to
      // is it like an issue with authentication? or trying to log in the same
      // user too many times?



      //also idk if it's because I didn't resolve something when I was following
      // along with the notification example from class but I will not stop getting
      // Grafana firing notifications and I don't know how to resolve them.
      // Is it because it's connected to my jwt pizza stuff, and when stuff fails there
      // it sends me a warning? because I connected it to one of my graphs
      // so idk if that's the problem.