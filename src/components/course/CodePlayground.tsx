'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Pyodide is loaded on demand from the CDN the first time the user runs code.
const PYODIDE_VERSION = '0.27.7'
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

declare global {
  interface Window {
    loadPyodide?: (cfg: { indexURL: string }) => Promise<PyodideLike>
  }
}

interface PyodideLike {
  runPythonAsync: (code: string) => Promise<unknown>
  FS: {
    mkdir: (p: string) => void
    writeFile: (p: string, data: string) => void
    analyzePath?: (p: string) => { exists: boolean }
  }
}

let pyodidePromise: Promise<PyodideLike> | null = null

function loadPyodideOnce(onProgress?: (msg: string) => void): Promise<PyodideLike> {
  if (pyodidePromise) return pyodidePromise
  pyodidePromise = (async () => {
    if (!window.loadPyodide) {
      onProgress?.('Downloading the Python runtime (~10 MB, cached after first run)…')
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script')
        s.src = `${PYODIDE_BASE}pyodide.js`
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Could not load Pyodide from the CDN.'))
        document.head.appendChild(s)
      })
    }
    onProgress?.('Booting the Python interpreter…')
    const py = await window.loadPyodide!({ indexURL: PYODIDE_BASE })
    return py
  })()
  pyodidePromise = pyodidePromise.catch((e) => {
    pyodidePromise = null
    throw e
  })
  return pyodidePromise
}

function mkdirp(FS: PyodideLike['FS'], dir: string) {
  const parts = dir.split('/').filter(Boolean)
  let cur = ''
  for (const p of parts) {
    cur += `/${p}`
    try {
      FS.mkdir(cur)
    } catch {
      /* already exists */
    }
  }
}

const RUNNER = `
import sys, io, os, runpy, traceback
_buf = io.StringIO()
_old_out, _old_err = sys.stdout, sys.stderr
sys.stdout = _buf
sys.stderr = _buf
os.chdir('/lab')
sys.argv = ['main.py']
try:
    runpy.run_path('/lab/main.py', run_name='__main__')
except SystemExit:
    pass
except BaseException:
    traceback.print_exc()
finally:
    sys.stdout = _old_out
    sys.stderr = _old_err
_buf.getvalue()
`

interface DataFile {
  path: string
  content: string
}

interface Props {
  starterCode: string
  dataFiles?: DataFile[]
  lang: 'es' | 'en'
  filename?: string
}

const T = {
  es: {
    title: 'Editor de código · Python real en el navegador',
    run: 'Ejecutar',
    running: 'Ejecutando…',
    reset: 'Restaurar',
    output: 'Salida',
    empty: 'Pulsa Ejecutar para correr el código. La primera vez se descarga el runtime de Python (se cachea).',
    note: 'Se ejecuta 100% en tu navegador (Pyodide / WebAssembly). Tu código no sale de tu equipo.',
    files: 'archivos de datos cargados',
  },
  en: {
    title: 'Code editor · real Python in the browser',
    run: 'Run',
    running: 'Running…',
    reset: 'Reset',
    output: 'Output',
    empty: 'Press Run to execute the code. The first run downloads the Python runtime (then it is cached).',
    note: 'Runs 100% in your browser (Pyodide / WebAssembly). Your code never leaves your machine.',
    files: 'data files mounted',
  },
}

export default function CodePlayground({ starterCode, dataFiles = [], lang, filename = 'solucion_scratch.py' }: Props) {
  const [code, setCode] = useState(starterCode)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)
  const t = T[lang]

  useEffect(() => {
    setCode(starterCode)
  }, [starterCode])

  const run = useCallback(async () => {
    setStatus('loading')
    setProgress('')
    setOutput('')
    try {
      const py = await loadPyodideOnce(setProgress)
      setStatus('running')
      setProgress('')
      // Mount data files + the user's code into the virtual filesystem.
      mkdirp(py.FS, '/lab')
      for (const f of dataFiles) {
        const full = `/lab/${f.path}`
        const dir = full.slice(0, full.lastIndexOf('/'))
        mkdirp(py.FS, dir)
        py.FS.writeFile(full, f.content)
      }
      py.FS.writeFile('/lab/main.py', code)
      const result = (await py.runPythonAsync(RUNNER)) as string
      setOutput(result && result.length ? result : '(sin salida)')
      setStatus('done')
    } catch (e) {
      setOutput(String(e instanceof Error ? e.message : e))
      setStatus('error')
    }
  }, [code, dataFiles])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = `${code.slice(0, start)}    ${code.slice(end)}`
      setCode(next)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4
      })
    }
  }

  const busy = status === 'loading' || status === 'running'

  return (
    <div className="rounded-2xl border border-[#1a3060] bg-[#060d1e] overflow-hidden my-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#1a3060] bg-[#0a1530]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </span>
          <span className="text-xs text-[#8BA3C7] font-mono truncate ml-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {filename}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCode(starterCode)}
            disabled={busy}
            className="text-xs px-3 py-1.5 rounded-full border border-[#1a3060] text-[#8BA3C7] hover:text-white hover:border-[#4DA6FF]/50 transition-colors disabled:opacity-40"
          >
            {t.reset}
          </button>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="text-xs px-4 py-1.5 rounded-full font-bold bg-[#4DA6FF] text-[#050d1f] hover:brightness-110 transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {busy ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-[#050d1f]/40 border-t-[#050d1f] rounded-full animate-spin" />
                {t.running}
              </>
            ) : (
              <>▶ {t.run}</>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={taRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        rows={Math.min(26, Math.max(8, code.split('\n').length + 1))}
        className="w-full bg-[#060d1e] text-[#cbd5e1] text-[13px] leading-relaxed p-4 font-mono resize-y outline-none border-0 focus:ring-1 focus:ring-inset focus:ring-[#4DA6FF]/30"
        style={{ fontFamily: 'JetBrains Mono, monospace', tabSize: 4 }}
      />

      {/* Output */}
      <div className="border-t border-[#1a3060]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#0a1530]">
          <span className="text-[11px] uppercase tracking-wider text-[#4A6080] font-semibold">{t.output}</span>
          {dataFiles.length > 0 && (
            <span className="text-[11px] text-[#4A6080]">{dataFiles.length} {t.files}</span>
          )}
        </div>
        <pre
          className={`px-4 py-3 text-[12.5px] leading-relaxed overflow-x-auto max-h-80 whitespace-pre-wrap ${
            status === 'error' ? 'text-[#ff8a8a]' : 'text-[#a5d6a7]'
          }`}
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {output || progress || (
            <span className="text-[#4A6080]">{busy ? t.running : t.empty}</span>
          )}
        </pre>
      </div>

      <div className="px-4 py-2 border-t border-[#1a3060] bg-[#0a1530]">
        <p className="text-[11px] text-[#4A6080]">🔒 {t.note}</p>
      </div>
    </div>
  )
}
