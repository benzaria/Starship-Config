//@ts-check
import { readdirSync, lstatSync, readFileSync, writeFileSync, unlinkSync, existsSync, watch } from 'fs'
import { resolve, extname } from 'path'
import { parseArgs } from 'util'
import { tmpdir } from 'os'

// lib imports
import toml from '@iarna/toml'
import yaml from 'yaml'

/** 
 * Add to this object any new format you want to support,  
 * after importing its corresponding library.
 * @type {import('./types').ConverterType}
 */
const Converter = new Proxy(
    {
        //! Insert new formats here
        toml: toml,
        yaml: yaml,
        yml: yaml,
        json: {
            parse: JSON.parse,
            stringify: (obj) => JSON.stringify(obj, null, 2),
        },
        jsonc: {
            parse: (str) => JSON.parse(str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim()),
            stringify: (obj) => JSON.stringify(obj, null, 2),
        }
    },
    {
        get(target, prop) {
            return target[prop] ?? error(
                `Unsupported format: ${String(prop)}
                \rSupported formats: ${Object.keys(target).join(', ')}
                \rTo add support for a new format, add it to the Converter object. at ${__filename}`
            )
        }
    }
)

const __dirname = import.meta.dirname
const __filename = import.meta.filename
//? or replace with a local version
const $schema = 'https://starship.rs/config-schema.json'
//? or overwrite it with the flag: --lock, -l <lock-name>
var LOCK_FILE = 'Starship-Config.lock'

//? or export them as env_vars
var outputFile = resolve(process.env.CONFIG_FILE ?? resolve(__dirname, '../starship.toml'))
var watchDir = resolve(process.env.CONFIG_DIR ?? resolve(__dirname, '../config'))

var info = (/**@type {string[]}*/...data) => console.log('[\x1b[1;94mINFO\x1b[0m]', ...data)
var warn = (/**@type {string[]}*/...data) => console.log('[\x1b[1;93mWARN\x1b[0m]', ...data)
var error = (/**@type {string[]}*/...data) => console.log('[\x1b[1;31mERROR\x1b[0m]', ...data)

argParse()
createLock()
updateOutput()

info('Outfile is', outputFile)
info(`Watching for changes in ${watchDir}...`)

async function updateOutput() {
    const content = { $schema }
    const files = readdirSync(watchDir)

    for (const file of files) {
        const filePath = resolve(watchDir, file)
        if (lstatSync(filePath).isFile()) {
            try {
                Object.assign(content, await importObj(filePath))
            } catch (err) {
                error(`Processing ${file}:`, err.message)
            }
        }
    }
    const extOut = extname(outputFile).toLowerCase().slice(1)
    writeFileSync(outputFile, Converter[extOut].stringify(content), 'utf8')
}

async function importObj(/**@type string*/file) {
    const extIn = extname(file).toLowerCase().slice(1)
    const str = readFileSync(file, 'utf8')

    try {
        const obj = Converter[extIn].parse(str)
        delete obj.$schema
        return obj
    } catch (err) {
        return error(`Converting ${file}:`, err.message), ''
    }
}

// TODO: add Commander.js for better CLI
function argParse() {
    const { values: args } = parseArgs({
        options: {
            verbose: {
                type: 'boolean',
                default: false,
                short: 'v'
            },
            err: {
                type: 'boolean',
                default: true,
                short: 'e'
            },
            watch: {
                type: 'boolean',
                default: false,
                short: 'w'
            },
            file: {
                type: 'string',
                default: undefined,
                short: 'f'
            },
            dir: {
                type: 'string',
                default: undefined,
                short: 'd'
            },
            lock: {
                type: 'string',
                default: undefined,
                short: 'l'
            },
        },
        strict: false,
        allowNegative: true,
    })
    global.__awaiter = true
    if (!args.verbose) info = NUN, warn = NUN
    if (!args.err) error = NUN
    if (args.file && typeof args.file !== 'boolean') outputFile = resolve(args.file) || args.file
    if (args.dir && typeof args.dir !== 'boolean') watchDir = resolve(args.dir) || args.dir
    if (args.lock && typeof args.lock !== 'boolean') LOCK_FILE = resolve(tmpdir(), args.lock) || args.lock
    if (args.watch)
        watch(watchDir, { persistent: true }, (evt, file) => {
            if (global.__awaiter) {
                global.__awaiter = false
                setTimeout(() => {
                    global.__awaiter = true
                    info(`Updating changes from ${file}...`)
                    updateOutput()
                }, 500)
            }
        })
    else warn(`Script is not running in \x1b[95mwatch\x1b[0m mode, It will \x1b[31;1mNOT\x1b[0m Hot Reload the config files.
        \r\tRestart with the flag: --watch, -w`)
}

//* Process Locking to prevent multiple instances
function createLock(lock = LOCK_FILE) {
    if (existsSync(lock)) {
        try {
            const pid = readFileSync(lock, 'utf8')
            process.kill(+pid, 'SIGINT')
            info('Stale lock detected. Overwriting...')
        } catch (err) {
            warn('Stale lock detected.', err.message)
        }
    }
    writeFileSync(lock, process.pid.toString())

    info('Lock file created at', lock)

    process.on('exit', () => removeLock(lock))
    process.on('SIGINT', () => { removeLock(lock) })
    process.on('SIGTERM', () => { removeLock(lock) })
}

function removeLock(lock = LOCK_FILE) {
    if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE)
    process.exit()
}

function NUN() { } //! No-Op Function