'use strict'

const aws=require('aws-sdk'),
  moment=require('moment');

const logs = new aws.CloudWatchLogs();
const cloudwatch = new aws.CloudWatch();
const pageSize=10;

const getPaginatedResults = async (fn) => {
  const EMPTY = Symbol("empty");
  const res = [];
  for await (const lf of (async function*() {
    let NextMarker = EMPTY;
    while (NextMarker || NextMarker === EMPTY) {
      const {marker, results} = await fn(NextMarker !== EMPTY ? NextMarker : undefined);
      yield* results;
      NextMarker = marker;
    }
  })()) {
    res.push(lf);
  }
	return res;
};

async function getLogGroupInfo() {
  return await getPaginatedResults(async (NextMarker) => {
	const logGroups = await logs.describeLogGroups({nextToken: NextMarker}).promise();
	return {
		marker: logGroups.nextToken,
		results: logGroups.logGroups,
	  };
  });
}

async function getLogGroupStats() {
  let now = moment();
    return await getPaginatedResults(async (NextMarker) => {
      const logGroups = await logs.describeLogGroups({limit: pageSize, nextToken: NextMarker}).promise();
      const metrics = await Promise.all(logGroups.logGroups.map(async lg=>{
        let m = await cloudwatch.getMetricStatistics({
          Namespace: 'AWS/Logs',
          MetricName:'IncomingBytes',
          Dimensions: [{Name: 'LogGroupName', Value: lg.logGroupName}],
          StartTime: moment().subtract(7, 'day').toISOString(),
          EndTime: now.toISOString(),
          Period: 3600*24*7,
          Statistics: ['Sum'],
          Unit: 'Bytes'
        }).promise();
        return {
          logGroupName: lg,
          IncomingBytes: m.Datapoints
        }
      }));
      return {
        marker: logGroups.nextToken,
    		results: metrics
      };
    })
}
getlogGroupInfo().then(console.log);
getLogGroupStats().then(r=>console.log(JSON.stringify(r, null, 2)));
