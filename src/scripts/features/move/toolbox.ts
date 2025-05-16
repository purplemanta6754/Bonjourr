import { elements, getGridWidgets, gridFind, gridParse, gridStringify, hasDuplicateInArray } from './helpers.ts'
import { updateMoveElement } from './index.ts'
import { toggleDisabled } from '../../shared/dom.ts'
import { tradThis } from '../../utils/translations.ts'

import type { Move, MoveAlign } from '../../../types/sync.ts'
import type { Widgets } from '../../../types/shared.ts'
import { onclickdown } from 'clickdown/mod'

const moverdom = document.querySelector<HTMLElement>('#element-mover')
let resetTimeout: number
let firstPos = { x: 0, y: 0 }
let moverPos = { x: 0, y: 0 }

export function toolboxEvents() {
	const elementEntries = Object.entries(elements)
	const moverBtns = document.querySelectorAll<HTMLElement>('#grid-mover button')
	const boxAlignBtns = document.querySelectorAll<HTMLElement>('#box-alignment-mover button')
	const textAlignBtns = document.querySelectorAll<HTMLElement>('#text-alignment-mover button')
	const spanColsBtn = document.querySelector<HTMLElement>('#grid-span-cols')
	const spanRowsBtn = document.querySelector<HTMLElement>('#grid-span-rows')
	const resetBtn = document.querySelector<HTMLElement>('#b_resetlayout')
	const closeBtn = document.querySelector<HTMLElement>('#close-mover')

	for (const [key, element] of elementEntries) {
		onclickdown(element, () => updateMoveElement({ select: key }), { propagate: false })
	}

	for (const button of moverBtns) {
		onclickdown(button, () => {
			updateMoveElement({ grid: { x: button.dataset.col, y: button.dataset.row } })
		})
	}

	for (const button of boxAlignBtns) {
		onclickdown(button, () => {
			updateMoveElement({ box: button.dataset.align })
		})
	}

	for (const button of textAlignBtns) {
		onclickdown(button, () => {
			updateMoveElement({ text: button.dataset.align })
		})
	}

	onclickdown(spanColsBtn, () => updateMoveElement({ span: 'col' }))
	onclickdown(spanRowsBtn, () => updateMoveElement({ span: 'row' }))
	closeBtn?.addEventListener('click', () => updateMoveElement({ toggle: false }))
	resetBtn?.addEventListener('click', () => updateMoveElement({ reset: true }))

	moverdom?.addEventListener('mousedown', startDrag)
	moverdom?.addEventListener('mouseup', removeDrag)
	moverdom?.addEventListener('mouseleave', removeDrag)

	moverdom?.addEventListener('touchstart', startDrag, { passive: false })
	moverdom?.addEventListener('touchend', removeDrag)

	function startDrag(event: Event) {
		const target = event.target as HTMLElement
		const validTags = target?.tagName === 'HR' || target?.tagName === 'P'
		const validIds = target?.id === 'element-mover' || target?.id === 'close-mover-wrapper'

		if (validTags || validIds) {
			moverdom?.addEventListener(event.type.includes('touch') ? 'touchmove' : 'mousemove', moverDrag)
		}
	}

	function moverDrag(event: MouseEvent | TouchEvent) {
		const pos = (event as TouchEvent).touches ? (event as TouchEvent).touches[0] : (event as MouseEvent)

		const x = pos.clientX
		const y = pos.clientY

		// Set first position to calc offset
		if (firstPos.x === 0 && firstPos.y === 0) {
			firstPos = { x: x - moverPos.x, y: y - moverPos.y }
			return
		}

		moverPos = {
			x: x - firstPos.x,
			y: y - firstPos.y,
		}

		if (moverdom) {
			document.documentElement.style.overscrollBehavior = 'none'
			moverdom.style.transform = `translate(${moverPos.x}px, ${moverPos.y}px)`
		}
	}

	function removeDrag() {
		firstPos = { x: 0, y: 0 }
		;(moverdom as HTMLElement).style.removeProperty('cursor')
		document.documentElement.style.removeProperty('overscroll-behavior')
		moverdom?.removeEventListener('mousemove', moverDrag)
		moverdom?.removeEventListener('touchmove', moverDrag)
	}
}

export function layoutButtons(selection: Move['selection']) {
	for (const button of document.querySelectorAll<HTMLButtonElement>('#grid-layout button')) {
		button.classList.toggle('selected', button.dataset.layout === selection)
	}
}

export function gridButtons(id: Widgets) {
	const property = document.documentElement?.style.getPropertyValue('--grid') || ''
	const grid = gridParse(property)

	if (grid.length === 0) {
		return
	}

	let top = false
	let bottom = false
	let left = false
	let right = false

	const positions = gridFind(grid, id)
	const widgetBottomLimit = getGridWidgets(gridStringify(grid)).length - 1
	const rightLimit = grid[0].length - 1

	// Detect if element is on array limits
	for (const [col, row] of positions) {
		if (row === 0) {
			top = true
		}
		if (col === 0) {
			left = true
		}
		if (col === rightLimit) {
			right = true
		}
		if (row === widgetBottomLimit) {
			bottom = true
		}

		// Bottom limit when last elem on last line
		if (row === grid.length - 1) {
			const idOnlyRow = grid.at(row)?.filter((id) => id !== '.')
			if (new Set(idOnlyRow).size === 1) {
				bottom = true
			}
		}
	}

	// link button to correct limit, apply disable attr
	for (const button of document.querySelectorAll<HTMLButtonElement>('#grid-mover button')) {
		const c = Number.parseInt(button.dataset.col || '0')
		const r = Number.parseInt(button.dataset.row || '0')
		let limit = false

		if (r === -1) {
			limit = top
		}
		if (r === 1) {
			limit = bottom
		}
		if (c === -1) {
			limit = left
		}
		if (c === 1) {
			limit = right
		}

		toggleDisabled(button, limit)
	}
}

export function spanButtons(id: Widgets) {
	const gridstring = document.documentElement?.style.getPropertyValue('--grid') || ''
	const grid = gridParse(gridstring)

	if (grid.length === 0) {
		return
	}

	const applyStates = (dir: 'col' | 'row', state: boolean) => {
		const dirButton = document.querySelector(`#grid-span-${dir}s`)
		const otherButton = document.querySelector(`#grid-span-${dir === 'col' ? 'rows' : 'cols'}`)

		toggleDisabled(otherButton, state)

		dirButton?.classList.toggle('selected', state)
	}

	const [posCol, posRow] = gridFind(grid, id)[0]
	const col = grid.map((g) => g[posCol])
	const row = [...grid[posRow]]

	const hasColumnDuplicates = hasDuplicateInArray(col, id)
	const hasRowDuplicates = hasDuplicateInArray(row, id)

	applyStates('col', hasColumnDuplicates)
	applyStates('row', hasRowDuplicates)
}

export function alignButtons(align?: MoveAlign) {
	const { box, text } = align ?? { box: '', text: '' }
	const boxBtns = document.querySelectorAll<HTMLButtonElement>('#box-alignment-mover button')
	const textBtns = document.querySelectorAll<HTMLButtonElement>('#text-alignment-mover button')

	for (const b of boxBtns) {
		b.classList.toggle('selected', b.dataset.align === (box || 'center'))
	}
	for (const b of textBtns) {
		b.classList.toggle('selected', b.dataset.align === (text || 'center'))
	}
}

export function resetButton(): boolean {
	const bResetlayout = document.getElementById('b_resetlayout') as HTMLButtonElement
	const confirm = !!bResetlayout.dataset.confirm

	clearTimeout(resetTimeout)

	if (confirm === false) {
		bResetlayout.textContent = tradThis('Are you sure?')
		bResetlayout.dataset.confirm = 'true'

		resetTimeout = setTimeout(() => {
			bResetlayout.textContent = tradThis('Reset layout')
			bResetlayout.dataset.confirm = ''
		}, 1000)
	} else {
		bResetlayout.textContent = tradThis('Reset layout')
		bResetlayout.dataset.confirm = ''
	}

	return confirm
}

export function showSpanButtons(column: string) {
	column !== 'single'
		? document.getElementById('grid-spanner-container')?.classList.add('active')
		: document.getElementById('grid-spanner-container')?.classList.remove('active')
}
