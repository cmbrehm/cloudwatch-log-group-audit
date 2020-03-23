# cloudwatch-log-group-audit

Sample nodeJS functions to extract stored bytes and incoming bytes stats from
each and every cloud watch log group in an account.  These can be helpful for drilling down into runaway logging in a large AWS Account.

Might need to set AWS_REGION env var if running from command line.

You can run ad-hoc using node10+ or incorporate into a lambda for monitoring, see the API documentation if you want to tweak the metrics reporting duration..  
