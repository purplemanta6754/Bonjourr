import { weatherCacheControl } from './request.ts'
import { handleGeolOption } from './settings.ts'
import { onSettingsLoad } from '../../utils/onsettingsload.ts'
import { weatherUpdate } from './settings.ts'
import { suntime } from '../../shared/time.ts'
import { storage } from '../../storage.ts'

import type { LastWeather } from '../../../types/local.ts'
import type { Sync } from '../../../types/sync.ts'

export type Coords = { lat: number; lon: number }
export type MeteoGeo = { name: string; detail: string }[]

export type WeatherInit = {
	sync: Sync
	lastWeather?: LastWeather
}

export type WeatherUpdate = {
	forecast?: string
	moreinfo?: string
	provider?: string
	units?: string
	geol?: string
	city?: true
	temp?: string
	unhide?: true
	suggestions?: Event
}

let pollingInterval = 0

export function weather(init?: WeatherInit, update?: WeatherUpdate) {
	if (update) {
		weatherUpdate(update)
		return
	}

	if (!init) {
		console.warn(new Error('No weather data'))
		return
	}

	const mainHidden = !init.sync.main
	const weatherHidden = init.sync.hide?.weatherdesc && init.sync.hide?.weathericon
	const canShowWeather = !(weatherHidden || mainHidden)

	if (canShowWeather) {
		weatherCacheControl(init.sync.weather, init.lastWeather)
	}

	onSettingsLoad(() => {
		handleGeolOption(init.sync.weather)
	})

	queueMicrotask(() => {
		clearInterval(pollingInterval)

		pollingInterval = setInterval(async () => {
			const sync = await storage.sync.get(['weather', 'hide', 'main'])
			const local = await storage.local.get('lastWeather')
			weatherCacheControl(sync.weather, local.lastWeather)
		}, 1200000) // 20min
	})
}

export function getSunsetHour(): number {
	const d = new Date()
	d.setHours(Math.round(suntime().sunset / 60))
	return d.getHours()
}
