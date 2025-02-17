import { readdirSync, lstatSync, readFileSync, writeFileSync, unlinkSync, existsSync, watch } from 'fs'
import { resolve, extname } from 'path'
import { parseArgs } from 'util'
import { tmpdir } from 'os'

// required
import toml from '@iarna/toml'
// optional
import yaml from 'yaml'
import { exit } from 'process'

const $schema = 'https://starship.rs/config-schema.json' // or add local schema

var info = (...data) => console.log('[\x1b[1;94mINFO\x1b[0m]', ...data)
var warn = (...data) => console.log('[\x1b[1;93mWARN\x1b[0m]', ...data)
var error = (...data) => console.log('[\x1b[1;31mERROR\x1b[0m]', ...data)

const __dirname = import.meta.dirname ?? __dirname
const LOCK_FILE = resolve(tmpdir(), 'Starship-Config.lock')

// u can export them as env_vars
var outputFile = resolve(process.env.STARSHIP_CONFIG ?? resolve(__dirname, '../starship.toml'))
var watchDir = resolve(process.env.STARSHIP_FILES ?? resolve(__dirname, '../config'))

argParse()
createLock()
// exit(0)
updateOutput()

// info(process.env.STARSHIP_CONFIG, process.env.STARSHIP_FILES)
info('Outfile is', outputFile)
info(`Watching for changes in ${watchDir}...`)

async function updateOutput() {
    let content = `'$schema' = '${$schema}'\n`
    const files = readdirSync(watchDir)

    for (const file of files) {
        const filePath = resolve(watchDir, file)
        if (lstatSync(filePath).isFile()) {
            try {
                const fileContent = await importToml(filePath)
                content += `\n# From: ${file}\n${fileContent}\n`
            } catch (err) {
                error(`Processing ${file}:`, err.message)
            }
        }
    }
    writeFileSync(outputFile, content, 'utf8')
}

async function importToml(file) {
    const ext = extname(file).toLowerCase()
    let obj = readFileSync(file, 'utf8')

    try {
        switch (ext) {
            case '.yml':
            case '.yaml':
                obj = yaml.parse(obj)
                break
            case '.json':
            case '.jsonc':
                obj = JSON.parse(obj.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim())
                break
            case '.toml':
                obj = toml.parse(obj)
                break
            default:
                throw new Error(`Unknown file extention: '${ext}'\n\t-> Expected: ['json','jsonc', 'yml', 'yaml', 'toml']`)
        }
        delete obj.$schema
        return toml.stringify(obj)
    } catch (err) {
        error(`Converting ${file}:`, err.message)
        return ''
    }
}

function argParse() {
    const { values: args } = parseArgs({
        options: {
            log: {
                type: 'boolean',
                default: false,
                short: 'l'
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
        },
        strict: false,
        allowNegative: true,
    })
    global.timer = true
    if (!args.log) info = () => null, warn = () => null
    if (!args.err) error = () => null
    if (args.file) outputFile = resolve(args.file) || args.file
    if (args.dir) watchDir = resolve(args.dir) || args.dir
    if (args.watch)
        watch(watchDir, { persistent: true }, (evt, file) => {
            if (global.timer) {
                global.timer = false
                setTimeout(() => {
                    global.timer = true
                    info(`Updating changes from ${file}...`)
                    updateOutput()
                }, 500)
            }
        })
    else warn('Script is not runing in \x1b[95mwatch\x1b[0m mode, It will \x1b[31;1mNOT\x1b[0m Hot Reload the config files.\n\tRestart with the flag --watch, -w')
}

function createLock() {
    if (existsSync(LOCK_FILE)) {
        try {
            const pid = readFileSync(LOCK_FILE, 'utf8')
            process.kill(+pid, 'SIGINT')
            info('Stale lock detected. Overwriting...')
        } catch (err) {
            warn('Stale lock detected.', err.message)
        }
    }
    writeFileSync(LOCK_FILE, process.pid.toString())

    process.on('exit', removeLock)
    process.on('SIGINT', () => { removeLock(), process.exit() })
    process.on('SIGTERM', () => { removeLock(), process.exit() })
}

function removeLock() {
    if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE)
}
