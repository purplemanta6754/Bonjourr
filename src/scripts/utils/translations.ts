import storage from '../storage'
import { countryCodeToLanguageCode } from '../utils'

let trns: Local.Translations | undefined
let currentTrnsLang = 'en'

export async function setTranslationCache(lang: string, local?: Local.Storage) {
	lang = countryCodeToLanguageCode(lang)

	if (lang === 'en') {
		storage.local.remove('translations')
		trns = undefined
		return
	}

	const cachedLang = local?.translations?.lang
	const useCache = local && cachedLang === lang

	if (useCache) {
		trns = local.translations
	} else {
		trns = await (await fetch(`../../_locales/${lang}/translations.json`)).json()
		storage.local.set({ translations: trns })
	}

	currentTrnsLang = lang
}

export function traduction(scope: Element | null, lang = 'en') {
	if (lang === 'en') {
		return
	}

	if (trns) {
		const dom = scope ?? document.body
		const tags = dom.querySelectorAll('.trn')
		let text: string

		for (const tag of tags) {
			text = tag.textContent?.trim() ?? ''
			tag.textContent = (trns[text] as string) ?? text
		}
	}

	document.documentElement.setAttribute('lang', lang)
	currentTrnsLang = lang
}

export async function toggleTraduction(lang: string) {
	const tags = document.querySelectorAll('.trn')
	const toggleDict: { [key: string]: string } = {}
	const currentDict = { ...trns }
	let newDict: Local.Translations | undefined
	let text: string

	await setTranslationCache(lang)
	newDict = (await storage.local.get('translations')).translations

	// old lang is 'en'
	if (newDict && currentDict?.lang === undefined) {
		Object.keys(newDict).forEach((key) => (currentDict[key] = key))
	}

	// {en: fr} & {en: sv} ==> {fr: sv}
	for (const [key, val] of Object.entries(currentDict)) {
		if (lang === 'en') toggleDict[val] = key
		else if (newDict) toggleDict[val] = newDict[key]
	}

	for (const tag of tags) {
		text = tag.textContent ?? ''
		tag.textContent = toggleDict[text] ?? text
	}

	currentTrnsLang = lang
}

export function getLang(): string {
	return currentTrnsLang
}

export function tradThis(str: string): string {
	return trns ? (trns[str] ?? str) : str
}
