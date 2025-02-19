
# Config-Any

 Make ur `Config` in **multiple files** with `json`, `yaml`, `toml` and *More...* **All at Once** and **Hot Reload** on **Change**.

## Shell Integration

bash/zsh

```bash
echo "path-to/config-any [options] &" >> ~/.bashrc # or ~/.zshrc
```

pwsh

```powershell
echo "Start-Process -NoNewWindow path-to/config-any -ArgumentList '[options]'" >> $PROFILE
```

cmd - ('if u have a profile script')

```batch
echo "@start /b path-to/config-any [options]" >> %USERPROFILE%/.batchrc
```

## API
Usage:

```bash
config-any --file ./mainFile.{json,yaml,...} --dir ./config --watch
```

Options:
- `--file, -f <path>`: Specify the output file path (default: ./config.json)
- `--dir, -d <path>`: Specify the directory to watch for config files (default: ./config)
- `--lock, -l <path>`: Specify a custom lock file name (default: tempDir/{outFileName}.lock)
- `--watch, -w`: Enable hot reloading on file changes
- `--verbose, -v`: Enable verbose logging
- `--err, -e`: Enable error logging (default: true)

Supported Formats:
- JSON
- JSONC (JSON with comments)
- YAML
- TOML

To add support for a new format, import the corresponding library and add it to the `Converter` object in index.js.

## Requirements

- [Node v20+](https://nodejs.org/en/download/current)

## Example

> [!IMPORTANT]
> make sure to start the file name that containe the global props with a ` . ` like `.main.toml`,
> so it will load first and not mess up the configuration output.

```bash
config-any --file $STARSHIP_CONFIG --watch # for starship config
```

`config/.main.toml`
```toml
"$schema" = 'https://starship.rs/config-schema.json'

format = """
${env_var.CSI}1F\
${env_var.CSI}$character╭─$os$username$directory${env_var.nim}[$package${custom.node}${custom.pnpm}${custom.npm}]()
${env_var.CSI}$character╰  \
${env_var.CSI}0m"""

add_newline = true
continuation_prompt = "[|](bright-black) "

fill = { symbol = " " }
```

`config/file-1.json`
```json
{
    "$schema" : "https://starship.rs/config-schema.json",

    "env_var": {
        "CSI": {
            "variable": "CSI",
            "format": "$env_value",
            "disabled": false
        },
        "nim": {
            "variable": "nim_ver",
            "format": "with [$symbol$env_value]($style) ",
            "style": "bright-cyan bold",
            "symbol": " ",
            "disabled": true
        }
    }
}
```

`config/file-2.yml`
```yaml
# yaml-language-server: $schema=../schema.json

aws:
  disabled: false
  expiration_symbol: X
  force_display: false
  format: on [$symbol($profile )(\($region\) )(\[$duration\] )]($style)
  style: bold yellow
os:
  format: "[$symbol]($style)"
  style: "bold bright-Blue"
  disabled: false
  symbols:
    Windows: " "
    Kali: "  "

```
---

output: `starship.toml`
```toml
"$schema" = 'https://starship.rs/config-schema.json'
# From: .frontend.toml
format = """
$fill[[${custom.get-clock-time}](bright-blue bold bg:237)[${custom.git-branch}](bright-blue bold bg:237)${custom.is-git}\r
${env_var.CSI}1F${env_var.CSI}100000C${env_var.CSI}2D[${custom.git-url}](#181717 bg:237)${env_var.CSI}10C](fg:237)\r
${env_var.CSI}1F${env_var.CSI}$character╭─$os$username$directory${env_var.nim}[$package${custom.node}${custom.pnpm}${custom.npm}]()\r
${env_var.CSI}$character╰  ${env_var.CSI}0m"""
add_newline = true
continuation_prompt = "[|](bright-black) "

[fill]
symbol = " "

# From: env_var.json
[env_var.CSI]
variable = "CSI"
format = "$env_value"
disabled = false

[env_var.nim]
variable = "nim_ver"
format = "with [$symbol$env_value]($style) "
style = "bright-cyan bold"
symbol = " "
disabled = true


# From: example.yaml
[aws]
disabled = false
expiration_symbol = "X"
force_display = false
format = "on [$symbol($profile )(\\($region\\) )(\\[$duration\\] )]($style)"
style = "bold yellow"

[os]
format = "[$symbol]($style)"
style = "bold bright-Blue"
disabled = false

  [os.symbols]
  Windows = " "
  Kali = "  "


```
