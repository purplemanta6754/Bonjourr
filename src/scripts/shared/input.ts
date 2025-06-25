// States:
// 'idle' | 'loading' | 'failed'

import { onSettingsLoad } from '../utils/onsettingsload.ts'

// DOM:
//  button -> .network-button
//      span -> .network-button-icon
//      span -> (optional) text

export function networkButton(id: string) {
	let button: HTMLButtonElement | null

	onSettingsLoad(() => {
		button = document.querySelector<HTMLButtonElement>(`#${id}`)

		if (!button) {
			throw new Error(`"${id}" not found in DOM`)
		}
		if (!button.classList.contains('network-button')) {
			throw new Error(`Network button "${id}" must have "network-button" class`)
		}
		if (!button.firstElementChild?.classList.contains('network-button-icon')) {
			throw new Error(`Button "${id}" must have a "network-button-icon" span`)
		}
	})

	function load() {
		button?.setAttribute('data-state', 'loading')
		button?.setAttribute('disabled', '')
	}

	function finish() {
		button?.setAttribute('data-state', 'idle')
		button?.removeAttribute('disabled')
	}

	function fail() {
		button?.setAttribute('data-state', 'failed')
		button?.removeAttribute('disabled')
	}

	return { load, finish, fail }
}
