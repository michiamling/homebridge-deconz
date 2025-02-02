// homebridge-deconz/lib/DeconzService/WarningDevice.js
// Copyright© 2022-2023 Erik Baauw. All rights reserved.
//
// Homebridge plugin for deCONZ.

'use strict'

const DeconzService = require('../DeconzService')
const { timeout } = require('homebridge-lib')

class WarningDevice extends DeconzService.LightsResource {
  constructor (accessory, resource, params = {}) {
    params.Service = accessory.Services.hap.Switch
    super(accessory, resource, params)

    this.addCharacteristicDelegate({
      key: 'on',
      Characteristic: this.Characteristics.hap.On,
      value: false
    }).on('didSet', async (value, fromHomeKit) => {
      if (fromHomeKit) {
        if (this.timer != null) {
          clearTimeout(this.timer)
          delete this.timer
        }
        const onTime = this.values.duration > 0 ? this.values.duration : 1
        let body = { alert: 'none' }
        if (value) {
          if (this.values.mute) {
            body = { alert: 'blink', ontime: onTime }
          } else if (this.values.duration === 0) {
            body = { alert: 'select' }
          } else {
            body = { alert: 'lselect', ontime: onTime }
          }
        }
        await this.put(this.statePath, body)
        if (value) {
          await timeout(onTime * 1000)
          this.values.on = false
        }
      }
    })

    this.addCharacteristicDelegate({
      key: 'duration',
      Characteristic: this.Characteristics.hap.SetDuration
    })

    this.addCharacteristicDelegate({
      key: 'mute',
      Characteristic: this.Characteristics.hap.Mute
    })

    this.addCharacteristicDelegates()

    this.update(resource.body, resource.rpath)
  }

  updateState (state) {
    if (state.on != null) {
      this.values.on = state.on
    }
    super.updateState(state)
  }
}

module.exports = WarningDevice
