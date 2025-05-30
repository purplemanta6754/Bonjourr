import { elements, gridStringify } from './helpers.ts'
import { moveElements } from './index.ts'
import { onclickdown } from 'clickdown/mod'

import type { MoveAlign, MoveLayout } from '../../../types/sync.ts'
import type { Widgets } from '../../../types/shared.ts'
import { getHTMLTemplate } from '../../shared/dom.ts'

const dominterface = document.querySelector<HTMLElement>('#interface')

export function setGridAreas(grid: MoveLayout['grid'] | string) {
	const property = typeof grid === 'string' ? grid : gridStringify(grid)
	document.documentElement.style.setProperty('--grid', property)
}

export function setAlign(id: Widgets, align?: MoveAlign) {
	const { box, text } = align ?? { box: '', text: '' }
	const elem = elements[id]

	if (elem) {
		elem.style.placeSelf = box

		if (id === 'quicklinks') {
			document.getElementById('linkblocks')?.classList.remove('text-left', 'text-right')

			if (text === 'left') {
				document.getElementById('linkblocks')?.classList.add('text-left')
			}
			if (text === 'right') {
				document.getElementById('linkblocks')?.classList.add('text-right')
			}
		} else {
			elem.style.textAlign = text || ''
		}
	}
}

export function setAllAligns(items: MoveLayout['items']) {
	for (const [widget, align] of Object.entries(items)) {
		setAlign(widget as Widgets, align)
	}
}

export function addOverlay(id: Widgets) {
	const overlay = getHTMLTemplate<HTMLDivElement>('move-overlay-template', '.move-overlay')
	overlay.id = `move-overlay-${id}`
	dominterface?.appendChild(overlay)
	onclickdown(overlay, () => moveElements(undefined, { select: id }))
}

export function removeOverlay(id?: Widgets) {
	if (id) {
		document.querySelector(`#move-overlay-${id}`)?.remove()
	} else {
		for (const overlay of document.querySelectorAll('.move-overlay')) {
			overlay.remove()
		}
	}
}

export function removeSelection() {
	const toolbox = document.getElementById('element-mover')
	const elements = document.querySelectorAll<HTMLElement>(
		'.move-overlay, #grid-mover button, .grid-spanner, #element-mover button',
	)

	for (const elem of elements) {
		elem.classList.remove('selected')
		elem.removeAttribute('disabled')
	}

	toolbox?.classList.remove('active')
}

export function interfaceFade(fade: 'in' | 'out') {
	if (fade === 'in') {
		const dominterface = document.getElementById('interface') as HTMLElement
		dominterface.style.removeProperty('opacity')
		setTimeout(() => {
			dominterface.style.transition = ''
		}, 200)
	}

	if (fade === 'out') {
		const dominterface = document.getElementById('interface') as HTMLElement
		dominterface.style.opacity = '0'
		dominterface.style.transition = 'opacity 200ms cubic-bezier(.215,.61,.355,1)'
	}
}
