import { readdirSync, lstatSync, readFileSync, writeFileSync, watch } from 'fs'
import { join as Join, resolve, extname } from 'path'

// required
import toml from '@iarna/toml'
// optional
import yaml from 'yaml'

const $schema = 'https://starship.rs/config-schema.json' // or add local schema

const __dirname = import.meta.dirname ?? __dirname
var outputFile = resolve(__dirname, '../starship.toml')
var watchDir = resolve(__dirname, '../config')
// u can export them as env_vars
outputFile = resolve(process.env.STARSHIP_CONFIG ?? outputFile)
watchDir = resolve(process.env.STARSHIP_FILES ?? watchDir)

updateOutput()

const args = process.argv.slice(2)
const { log, error } = args.includes('--silent') || args.includes('-s')
    ? { log() { }, error() { } }
    : console

args.includes('--watch') || args.includes('-w')
    ? watch(watchDir, { persistent: true }, async (evt, file) => {
        log(`Updating changes from ${file}...`)
        setTimeout(updateOutput, 500)
    }) : null

log('outfile is ', outputFile)
log(`Watching for changes in ${watchDir}...`)

async function updateOutput() {
    let content = `"$schema" = '${$schema}'`
    const files = readdirSync(watchDir)

    for (const file of files) {
        const filePath = Join(watchDir, file)
        if (lstatSync(filePath).isFile()) {
            try {
                const fileContent = await importToml(filePath)
                content += `\n# From: ${file}\n${fileContent}\n`
            } catch (err) {
                error(`Error processing ${file}:`, err.message)
            }
        }
    }

    writeFileSync(outputFile, content, 'utf8')
}

async function importToml(file) {
    let obj = readFileSync(file, 'utf8')

    try {
        switch (extname(file).toLowerCase()) {
            case '.yml':
            case '.yaml':
                obj = yaml.parse(obj)
                break
            case '.json':
            case '.jsonc':
                obj = JSON.parse(obj)
                break
            case '.toml':
                obj = toml.parse(obj)
                break
            default:
                return obj
        }
        delete obj.$schema
        return toml.stringify(obj)
    } catch (error) {
        error(`Error converting ${file}:`, error.message)
        return ''
    }

}
