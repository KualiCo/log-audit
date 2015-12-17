# Log Audit

[![Test Coverage](https://codeclimate.com/repos/566f113d1dbede0065000755/badges/601a84c8bb7254b6c51b/coverage.svg)](https://codeclimate.com/repos/566f113d1dbede0065000755/coverage)
[![Code Climate](https://codeclimate.com/repos/566f113d1dbede0065000755/badges/601a84c8bb7254b6c51b/gpa.svg)](https://codeclimate.com/repos/566f113d1dbede0065000755/feed)
[![Circle CI](https://circleci.com/gh/KualiCo/log-audit.svg?style=shield&circle-token=89b130cfd4aae9c8bafa5d23b494e9093224317b)](https://circleci.com/gh/KualiCo/log-audit)

Log audit is a simple tool to write in a standardized way to stdout.

## Install 

```
npm i --save log-audit
```

## Usage

I recommend instantiating the logger in a central file and then exporting that file for useage throughout your app. For example:

logger.js
```javascript
import logAudit from 'log-audit'
const {info, debug, audit} = logAudit(options, defaultFields)
export {info, debug, audit}
```

some-other-file.js
```javascript
import {info} from 'logger'
info(fields)
```

`fields` should be an object of key value pairs that will be merged with the existing data. Ad-hoc type of data belongs here, ie: userId, etc

`defaultFields` should be an object of key value pairs that will appear on every call to logger automatically. Data that belongs on every request should be placed here, ie: timestamp, etc


Example: 

```javascript
info({
  userId: 'slk39lskj',
  endpoint: '/courses',
  method: 'GET',
  foo: 'bar'
})
```

## API

#### `logAudit([options,defaultFields])`

Instantiates the logger with optional options and default fields

##### `options`:

* console: boolean - Defaults to true. If true, `console.log` will run for every log call
* consoleFormat: string - `json` | `keyvalue` - Determines if `console.log` logs in key/value format or json format.
* hideLogs: boolean - When true, hides all log messages. Not recommended for production.
* kafka: boolean - When true, log-audit will also post to kafka.
* kafkaTopic: string - Topic to be used for kafka. Required when `kafka` is set to `true`.
* token: string - API token to be used for posting to kafka. Required when `kafka` is set to `true`.
* baseUrl: string - Url to be used to post to kafka, ie `https://domain.com`. Required when `kafka` is set to `true`.
* seconds: boolean - Defaults to false. When true, divides by 1000 to give you seconds instead of milliseconds.

##### `defaultFields`:

An object of any values. This object will be used applied any time a log fn is called.

The `logAudit` function returns an object of functions which can then be used to log their appropriate level of logs:

* INFO: Informational logs, eg: Server has started on port 3004
* AUDIT: Information that would be useful for auditing, eg: A user created an item, a resource was deleted, etc...
* DEBUG: Debug info that would only be turned on when a config is set to allow for it. 
* SENSITIVE: Stuff that shouldn't be logged at all, like SSNs and such. These logs will not show up... anywhere.
