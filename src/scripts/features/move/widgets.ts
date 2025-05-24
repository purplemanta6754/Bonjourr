import { addOverlay, interfaceFade, removeOverlay, removeSelection, setAllAligns, setGridAreas } from './dom.ts'
import { transitioner } from '../../utils/transitioner.ts'
import { storage } from '../../storage.ts'
import { weather } from '../weather/index.ts'
import {
	addGridWidget,
	getLayout,
	gridParse,
	gridStringify,
	isEditing,
	removeGridWidget,
	updateWidgetsStorage,
} from './helpers.ts'

import type { Widgets } from '../../../types/shared.ts'
import type { Sync } from '../../../types/sync.ts'

export function toggleWidget(data: Sync, widget: [Widgets, boolean]) {
	if (!widget) {
		return
	}

	const [id, on] = widget
	const gridToggle = on ? addGridWidget : removeGridWidget
	const interfaceTransition = transitioner()
	const selection = data.move.selection
	const layout = getLayout(data)
	const grid = gridParse(gridToggle(gridStringify(layout.grid), id, selection))

	data.move.layouts[selection] = { items: layout.items, grid: grid }
	const newdata = updateWidgetsStorage([widget], data)
	storage.sync.set(newdata)

	interfaceTransition.first(() => {
		toggleWidgetInSettings([[id, on]])
		interfaceFade('out')
	})

	interfaceTransition.after(() => {
		const layout = getLayout(newdata)
		setGridAreas(layout.grid)
		setAllAligns(layout.items)
		toggleWidgetOnInterface([[id, on]])
		removeSelection()

		// add/remove widget overlay only when editing move
		if (isEditing()) {
			on ? addOverlay(id) : removeOverlay(id)
		}

		// Apply weather if re-enabled
		if (id === 'main' && on === true) {
			storage.local.get('lastWeather').then((local) => {
				weather({ sync: newdata, lastWeather: local.lastWeather })
			})
		}
	})

	interfaceTransition.finally(() => {
		interfaceFade('in')
	})

	interfaceTransition.transition(200)
}

export function toggleWidgetInSettings(states: [Widgets, boolean][]) {
	const inputids: { [key in Widgets]: string } = {
		time: 'i_time',
		main: 'i_main',
		quicklinks: 'i_quicklinks',
		notes: 'i_notes',
		quotes: 'i_quotes',
		searchbar: 'i_sb',
	}

	for (const [widget, on] of states) {
		const input = document.getElementById(inputids[widget]) as HTMLInputElement
		const option = document.getElementById(`${widget}_options`)

		option?.classList.toggle('shown', on)
		input.checked = on
	}
}

export function toggleWidgetOnInterface(states: [Widgets, boolean][]) {
	const domids: { [key in Widgets]: string } = {
		time: 'time',
		main: 'main',
		quicklinks: 'linkblocks',
		notes: 'notes_container',
		quotes: 'quotes_container',
		searchbar: 'sb_container',
	}

	for (const [widget, on] of states) {
		const elem = document.getElementById(domids[widget]) as HTMLElement
		elem?.classList.toggle('hidden', !on)
	}
}
