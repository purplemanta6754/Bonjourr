import './init.test.ts'

// Import script after test init, document needs to be loaded first
import { SYNC_DEFAULT } from '../src/scripts/defaults.ts'
import { filterImports } from '../src/scripts/imports.ts'
import type { Link } from '../src/types/shared.ts'
import { assert } from '@std/assert'

const defaults = structuredClone(SYNC_DEFAULT)

Deno.test('Global exists', () => {
	assert(globalThis.document)
})

Deno.test('Filter imports is working', () => {
	filterImports(defaults, {})
})

Deno.test('Current version small import', () => {
	const config = filterImports(defaults, {
		time: false,
		main: false,
		lang: 'en',
	})

	assert(defaults.time !== config.time)
	assert(defaults.main !== config.main)
	assert(defaults.lang === config.lang)
})

Deno.test('1.10.0', async (t) => {
	const text = Deno.readTextFileSync('./tests/configs/old.1.10.0.json')
	const old = JSON.parse(text)
	const res = filterImports(defaults, old)

	await t.step('Links', async (t) => {
		const allkeys = Object.keys(res)
		const linkkeys = allkeys.filter(
			(key) => key.length === 11 && key.includes('links'),
		)

		await t.step('Correct fields', () => {
			assert(res.links === undefined)
			assert(linkkeys.length > 0)
		})

		await t.step('Correct values', () => {
			const str = JSON.stringify(res)
			assert(str.includes('https://www.youtube.com/'))
			assert(str.includes('https://api.faviconkit.com/www.youtube.com/144'))
		})

		await t.step('Valid links', () => {
			const key = linkkeys[0]
			const link = res[key] as Link

			assert(typeof link._id === 'string')
			assert(typeof link.order === 'number')
			assert(link.parent === 'default')
		})
	})

	await t.step('Clock', () => {
		assert(res.dateformat === 'us')
	})

	await t.step('Backgrounds', () => {
		assert(old.background_blur === res.backgrounds.blur)
	})

	await t.step('Searchbar', async (t) => {
		await t.step('Engine', () => {
			assert(old.searchbar_engine === res.searchbar.engine)
		})

		await t.step('New tab', () => {
			assert(old.searchbar_newtab === res.searchbar.newtab)
		})
	})

	await t.step('Hide', () => {
		assert(Array.isArray(res.hide) === false)
	})

	await t.step('Review', () => {
		assert(res.review === -1)
	})
})

Deno.test('20.4.2', async (t) => {
	const text = Deno.readTextFileSync('./tests/configs/unsplash.20.4.2.json')
	const old = JSON.parse(text)
	const res = filterImports(defaults, old)

	await t.step('Backgrounds', async (t) => {
		await t.step('Local type', () => {
			assert(res.backgrounds.type === 'files')
		})

		await t.step('Blur', () => {
			assert(old.background_blur === res.backgrounds.blur)
		})

		await t.step('Bright', () => {
			assert(old.background_bright === res.backgrounds.bright)
		})

		await t.step('Unsplash collection', () => {
			assert(old.unsplash.collection === res.backgrounds.queries['unsplash-images-collections'])
		})

		await t.step('Frequency', () => {
			assert(old.unsplash.every === res.backgrounds.frequency)
		})
	})
})
