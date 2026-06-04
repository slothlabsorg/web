'use client'
// Client-side access to the latest GitHub release for a product, via the
// /api/releases/<slug> Netlify function (token-authed + CDN-cached).
//
// - useLatestRelease(slug) → { loading, data, error }
// - useDetectedPlatform()  → { os, arch }  (arch refined async on Chromium)
// - pickPrimaryAsset()      → best download for the detected platform
// - assetList()             → all available downloads, human-labeled
// - <LiveVersion>           → SSR-safe version/date text that updates on hydrate

import { useEffect, useState, createElement, Fragment } from 'react'

export type AssetKey =
  | 'mac_arm64' | 'mac_x64' | 'mac_universal'
  | 'win_exe' | 'win_msi'
  | 'linux_appimage_x64' | 'linux_appimage_arm64'
  | 'linux_deb_x64' | 'linux_deb_arm64'
  | 'linux_rpm_x64' | 'linux_rpm_arm64'
  | 'plugin_zip'

export interface ReleaseAsset { url: string; name: string; size: number }

export interface ReleaseInfo {
  available: boolean
  slug?: string
  repo?: string
  tag?: string
  version?: string
  date?: string | null
  htmlUrl?: string
  releasesUrl?: string
  assets?: Partial<Record<AssetKey, ReleaseAsset>>
  error?: string
}

export type OS = 'macOS' | 'Windows' | 'Linux' | 'unknown'
export type Arch = 'arm64' | 'x64' | 'unknown'

export const ASSET_LABELS: Record<AssetKey, { label: string; os: OS; icon: string }> = {
  mac_arm64:            { label: 'macOS · Apple Silicon (.dmg)', os: 'macOS',   icon: '🍎' },
  mac_x64:              { label: 'macOS · Intel (.dmg)',          os: 'macOS',   icon: '🍎' },
  mac_universal:        { label: 'macOS · Universal (.dmg)',      os: 'macOS',   icon: '🍎' },
  win_exe:              { label: 'Windows · .exe installer',      os: 'Windows', icon: '🪟' },
  win_msi:              { label: 'Windows · .msi installer',      os: 'Windows', icon: '🪟' },
  linux_appimage_x64:   { label: 'Linux · AppImage (x86_64)',     os: 'Linux',   icon: '🐧' },
  linux_appimage_arm64: { label: 'Linux · AppImage (arm64)',      os: 'Linux',   icon: '🐧' },
  linux_deb_x64:        { label: 'Linux · .deb (x86_64)',         os: 'Linux',   icon: '🐧' },
  linux_deb_arm64:      { label: 'Linux · .deb (arm64)',          os: 'Linux',   icon: '🐧' },
  linux_rpm_x64:        { label: 'Linux · .rpm (x86_64)',         os: 'Linux',   icon: '🐧' },
  linux_rpm_arm64:      { label: 'Linux · .rpm (arm64)',          os: 'Linux',   icon: '🐧' },
  plugin_zip:           { label: 'Plugin (.zip)',                 os: 'unknown', icon: '🧩' },
}

// ── OS / arch detection ────────────────────────────────────────────────────────
function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  const platform =
    (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform ??
    navigator.platform ?? ''
  if (/Mac/i.test(platform) || /Mac/i.test(ua)) return 'macOS'
  if (/Win/i.test(platform) || /Win/i.test(ua)) return 'Windows'
  if (/Linux|X11/i.test(platform) || /Linux/i.test(ua)) return 'Linux'
  return 'unknown'
}

interface UAData {
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }>
}

/** Returns detected OS + arch. Arch starts 'unknown' and refines after mount
 *  (Chromium exposes CPU architecture via UA-CH; other browsers default to a
 *  sensible guess — macOS → arm64, since Apple Silicon is the common case). */
export function useDetectedPlatform(): { os: OS; arch: Arch } {
  const [os, setOs] = useState<OS>('unknown')
  const [arch, setArch] = useState<Arch>('unknown')

  useEffect(() => {
    const detectedOs = detectOS()
    setOs(detectedOs)

    const uaData = (navigator as Navigator & { userAgentData?: UAData }).userAgentData
    if (uaData?.getHighEntropyValues) {
      uaData
        .getHighEntropyValues(['architecture', 'bitness'])
        .then((v) => {
          if (v.architecture === 'arm') setArch('arm64')
          else if (v.architecture === 'x86') setArch('x64')
          else setArch(detectedOs === 'macOS' ? 'arm64' : 'x64')
        })
        .catch(() => setArch(detectedOs === 'macOS' ? 'arm64' : 'x64'))
    } else {
      // Safari / Firefox can't report CPU arch — default to the common case.
      setArch(detectedOs === 'macOS' ? 'arm64' : 'x64')
    }
  }, [])

  return { os, arch }
}

// ── Asset selection ─────────────────────────────────────────────────────────────
const PREFERENCE: Record<Exclude<OS, 'unknown'>, Record<Arch, AssetKey[]>> = {
  macOS: {
    arm64:   ['mac_arm64', 'mac_universal', 'mac_x64'],
    x64:     ['mac_x64', 'mac_universal', 'mac_arm64'],
    unknown: ['mac_universal', 'mac_arm64', 'mac_x64'],
  },
  Windows: {
    arm64:   ['win_exe', 'win_msi'],
    x64:     ['win_exe', 'win_msi'],
    unknown: ['win_exe', 'win_msi'],
  },
  Linux: {
    arm64:   ['linux_appimage_arm64', 'linux_deb_arm64', 'linux_rpm_arm64'],
    x64:     ['linux_appimage_x64', 'linux_deb_x64', 'linux_rpm_x64'],
    unknown: ['linux_appimage_x64', 'linux_appimage_arm64', 'linux_deb_x64'],
  },
}

export interface PickedAsset { key: AssetKey; asset: ReleaseAsset; label: string; icon: string }

export function pickPrimaryAsset(
  assets: Partial<Record<AssetKey, ReleaseAsset>> | undefined,
  os: OS,
  arch: Arch,
): PickedAsset | null {
  if (!assets) return null
  // Plugin artifacts have no OS variants.
  if (assets.plugin_zip) {
    return { key: 'plugin_zip', asset: assets.plugin_zip, ...ASSET_LABELS.plugin_zip }
  }
  if (os === 'unknown') return null
  for (const key of PREFERENCE[os][arch]) {
    const asset = assets[key]
    if (asset) return { key, asset, label: ASSET_LABELS[key].label, icon: ASSET_LABELS[key].icon }
  }
  return null
}

/** All available downloads, in a stable display order, human-labeled. */
export function assetList(
  assets: Partial<Record<AssetKey, ReleaseAsset>> | undefined,
): PickedAsset[] {
  if (!assets) return []
  return (Object.keys(ASSET_LABELS) as AssetKey[])
    .filter((k) => assets[k])
    .map((k) => ({ key: k, asset: assets[k]!, label: ASSET_LABELS[k].label, icon: ASSET_LABELS[k].icon }))
}

// ── Data hook ─────────────────────────────────────────────────────────────────
const cache = new Map<string, ReleaseInfo>()

export function useLatestRelease(slug: string): { loading: boolean; data: ReleaseInfo | null; error: string | null } {
  const [data, setData] = useState<ReleaseInfo | null>(() => cache.get(slug) ?? null)
  const [loading, setLoading] = useState(!cache.has(slug))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache.has(slug)) {
      setData(cache.get(slug)!)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    fetch(`/api/releases/${slug}`)
      .then((r) => r.json())
      .then((j: ReleaseInfo) => {
        if (!alive) return
        cache.set(slug, j)
        setData(j)
      })
      .catch((e) => alive && setError(String(e)))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [slug])

  return { loading, data, error }
}

// ── SSR-safe version/date text ──────────────────────────────────────────────────
function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

/** Renders `v{version}` (and optional date), using `fallback` for SSR/first paint
 *  then updating to the live release on hydration. */
export function LiveVersion({
  slug, fallback, prefix = 'v', showDate = false,
}: {
  slug: string
  fallback?: string
  prefix?: string
  showDate?: boolean
}) {
  const { data } = useLatestRelease(slug)
  const version = data?.available ? data.version : fallback
  if (!version) return null
  const date = showDate && data?.available ? fmtDate(data.date) : ''
  return createElement(Fragment, null, `${prefix}${version}${date ? ` · ${date}` : ''}`)
}
