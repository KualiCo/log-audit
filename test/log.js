import assert from 'assert'
import sinon from 'sinon'
import merge from 'lodash/object/merge'
import axios from 'axios'

import logger, {convertToString} from '../src'

let spy, sandbox

describe('audit-log', () => {

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
    spy = sinon.spy(console, 'log')
  })

  afterEach(() => {
    console.log.restore()
    sandbox.restore()
  })

  it('is not called when logs are hidden', () => {
    let info = logger({hideLogs: true}).info
    info('I am hidden')
    assert(!spy.called)
  })

  it('is not called when logs are hidden', () => {
    let info = logger({hideLogs: true, consoleFormat: 'keyvalue'}).info
    info('I am hidden')
    assert(!spy.called)
  })

  it('logs json', () => {
    let info = logger({seconds: true, consoleFormat: 'json'}).info
    info()
    var obj = buildObject('INFO')
    assert(spy.called)
    assert(spy.calledWith(JSON.stringify(obj)))
  })

  it('logs key value pairs', () => {
    let info = logger({seconds: true, consoleFormat: 'keyvalue'}).info
    info()
    var obj = buildObject('INFO')
    assert(spy.called)
    assert(spy.calledWith(convertToString(obj)))
  })

  it('logs audit messages', () => {
    let audit = logger({seconds: true}).audit
    audit()
    var obj = buildObject('AUDIT')
    assert(spy.called)
    assert(spy.calledWith(JSON.stringify(obj)))
  })

  it('logs debug messages when DEBUG is set', () => {
    process.env.DEBUG = true
    let debug = logger({seconds: true}).debug
    debug()
    var obj = buildObject('DEBUG')
    assert(spy.called)
    assert(spy.calledWith(JSON.stringify(obj)))
    delete process.env.DEBUG
  })

  it('doesn\'t log debug messages when DEBUG is absent', () => {
    delete process.env.DEBUG
    let debug = logger({seconds: true}).debug
    debug()
    assert(!spy.called)
  })

  it('omits sensitive messages', () => {
    let sensitive = logger({seconds: true}).sensitive
    sensitive()
    assert(!spy.called)
  })

  it('takes in initial options but doesn\'t log them', () => {
    let info = logger({seconds: true, consoleFormat: 'keyvalue'}, {foo: false}).info
    info({test: true})
    var obj = buildObject('INFO', {test: true}, {foo: false})
    assert(spy.called)
    assert(spy.calledWith(convertToString(obj)))
  })

  it('throws an error when kafka is set to true without required opts', () => {
    assert.throws(() => logger({
      console: false,
      kafka: true
    }))
    assert.throws(() => logger({
      console: false,
      kafka: true,
      kafkaTopic: 'a'
    }))
    assert.throws(() => logger({
      console: false,
      kafka: true,
      kafkaTopic: 'a',
      token: 'b'
    }))
    assert.doesNotThrow(() => logger({
      console: false,
      kafka: true,
      kafkaTopic: 'a',
      token: 'b',
      baseUrl: 'c'
    }))
  })

  it('throws an error when you pass in a bad arg for consoleFormat', () => {
    let info = logger({console: true, consoleFormat: 'blah'}).info
    assert.throws(info)
  })

  it('logs milliseconds when seconds option is not set', () => {
    let info = logger({consoleFormat: 'json'}).info
    info()
    // can you spot the monkey?
    let ts = JSON.parse(spy.args[0][0]).ts
    let len = ts.toString().split('').length
    let tsNow = Date.now()
    let delta = tsNow - ts
    assert(spy.called)
    assert(len == 13)
    assert(delta < 20)
  })

  it('does nothing if you set all the things to false', () => {
    let info = logger({console: false}).info
    info()
    assert(!spy.called)
  })

  it('calls out to kafka', () => {
    // cb is called when axios.post is called
    sandbox = sinon.stub(axios, 'post', () => assert(true))
    let info = logger({kafka: true, kafkaTopic: 'fake', baseUrl: '127.0.0.1', token: 'fake'}).info
    info()
  })
})

var buildObject = (level, fields, defaults = {}) => {
  return merge({
    ts: Math.round(Date.now() / 1000),
    level
  }, defaults, fields)
}
