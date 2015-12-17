import merge from 'lodash/object/merge'
import map from 'lodash/collection/map'
import path from 'path'
import axios from 'axios'

export default function (options, defaultFields = {}) {

  let defaultOptions = {
    hideLogs: false,
    console: true,
    kafka: false,
    consoleFormat: 'json',
    token: null,
    kafkaTopic: null,
    baseUrl: null,
    seconds: false
  }

  let opts = merge(defaultOptions, options)

  if (opts.kafka && !opts.kafkaTopic) {
    throw new Error('Kafka requires a topic.')
  }

  if (opts.kafka && !opts.token) {
    throw new Error('Kafka requires an API token.')
  }

  if (opts.kafka && !opts.baseUrl) {
    throw new Error('Kafka requires a baseUrl, eg: https://monsters.kuali.co')
  }

  var info = (fields) => {
    return buildAndProcess('INFO', fields, opts.hideLogs)
  }

  var audit = (fields) => {
    return buildAndProcess('AUDIT', fields, opts.hideLogs)
  }

  var debug = (fields) => {
    return buildAndProcess('DEBUG', fields, !process.env.DEBUG)
  }

  var sensitive = (fields) => {
    return buildAndProcess('SENSITIVE', fields, true)
  }

  var buildAndProcess = (level, fields, hideLogs) => {
    let obj = buildObject(level, fields)

    if (opts.kafka) {
      notifyKafka(opts.token, opts.baseUrl, opts.kafkaTopic, obj)
    }

    if (opts.console) {
      switch (opts.consoleFormat) {
        case 'json':
          return json(obj, hideLogs)
        case 'keyvalue':
          return keyValue(obj, hideLogs)
        default:
          throw new Error(`Unsupported consoleFormat was provided: ${opts.consoleFormat}`)
      }
    }
  }

  var buildObject = (level, fields) => {
    let ts = opts.seconds
      ? Math.round(Date.now() / 1000)
      : Date.now()
    return merge({
      ts,
      level
    }, defaultFields, fields)
  }

  return {info, audit, debug, sensitive}
}

var json = (obj, hideLogs) => {
  if (!hideLogs) {
    console.log(JSON.stringify(obj))
  }
}

var keyValue = function (obj, hideLogs) {
  if (!hideLogs) {
    console.log(convertToString(obj))
  }
}

export var notifyKafka = (token, baseUrl, topic, data) => {
  return axios.post(`${baseUrl}/api/reports/topic/${topic}`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
}

export var convertToString = (obj) => {
  let values = map(obj, (value, key) => {
    let v = typeof value == 'number' ? value : `"${value}"`
    return `${key}=${v}`
  })
  return values.join(' ')
}
