
# Startship-Config

 Make ur Startship `Config` in **multiple file** with `json`, `yaml` and `toml` **All at Once** and **Hot Reload** on **Change**.

## Example

> [!IMPORTANT]
> make sure to start the file name that containe the global props with a ` . ` like `.main.toml`,
> so it will load first and note mess up the configuration.

`.main.toml`
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

`file-1.json`
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

`file-2.yml`
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
