const Info = {
    "version": "1.0.0",
    "pluginLoader": ["All"],
    "name": "pluginLoader",
    "author": "whes1015"
}

const reload = require('require-reload')(require)
const fetch = require('node-fetch')
const { MessageEmbed } = require('discord.js')
const fs = require('fs')
const path = require("path")
const Path = path.resolve("")

let Ver = ""

async function messageCreate(client, message) {
    let plugin = JSON.parse(fs.readFileSync(Path + "/Plugin/plugin.json").toString())
    for (let index = 0; index < plugin.length; index++) {
        var fun = reload('../Plugin/' + plugin[index])
        if (fun.Event.includes("messageCreate")) {
            if (await compatible(fun.Info.pluginLoader)) {
                fun.messageCreate(client, message)
            }
        }
    }
}

async function ready(client) {
    let plugin = JSON.parse(fs.readFileSync(Path + "/Plugin/plugin.json").toString())
    for (let index = 0; index < plugin.length; index++) {
        var fun = reload('../Plugin/' + plugin[index])
        if (fun.Event.includes("ready")) {
            if (await compatible(fun.Info.pluginLoader)) {
                fun.messageCreate(client, message)
            }
        }
    }
}

async function plugin(client, message) {
    if (message.content == "$help") {
        let msg = "指令列表\n"
        let plugin = JSON.parse(fs.readFileSync(Path + "/Plugin/plugin.json").toString())
        for (let index = 0; index < plugin.length; index++) {
            var fun = reload('../Plugin/' + plugin[index])
            for (let index = 0; index < fun.Commands.length; index++) {
                msg = msg + fun.Commands[index]["name"] + " : " + fun.Commands[index]["note"] + "\n"
            }
        }
        await message.reply(await embed(msg))
    } else if (message.content == "$plugin check") {

    } else if (message.content == "$plugin info") {
        let msg = "插件列表\n"
        let plugin = JSON.parse(fs.readFileSync(Path + "/Plugin/plugin.json").toString())
        for (let index = 0; index < plugin.length; index++) {
            var fun = reload('../Plugin/' + plugin[index])
            msg = msg + "名稱: " + fun.Info.name + " 版本: " + fun.Info.version + " 作者: " + fun.Info.author + "\n"
        }
        await message.reply(await embed(msg))
    } else if (message.content.startsWith("$plugin uninstall ") || message.content.startsWith("$plugin u ")) {
        let msg = ""
        let Name = message.content.replace("$plugin uninstall ", "").replace("$plugin u ", "")
        msg = msg + "🟦 正在檢索 插件 資料夾...\n"
        let MSG = await message.reply(await embed(msg))
        let plugin = JSON.parse(fs.readFileSync(Path + "/Plugin/plugin.json").toString())
        if (!plugin.includes(Name)) {
            msg = msg + "🟨 未發現此 插件\n"
            edit(client, MSG.channel.id, MSG.id, await embed(msg))
            return
        } else {
            try {
                msg = msg + "🟦 撤銷 事件監聽...\n🟦 撤銷 插件訊息...\n🟦 撤銷 插件指令...\n"
                edit(client, MSG.channel.id, MSG.id, await embed(msg))
                plugin.splice(plugin.indexOf(Name), 1)
                fs.writeFileSync(Path + "/Plugin/plugin.json", JSON.stringify(plugin, null, "\t"))
                fs.unlinkSync(Path + "/Plugin/" + Name + ".js")
                msg = msg + "🟩 插件 卸載 完成"
                edit(client, MSG.channel.id, MSG.id, await embed(msg))
            } catch (error) {
                msg = msg + `🟥 插件 卸載 過程出錯了 請向 插件 作者聯繫\n錯誤碼:\n${error}\n`
                edit(client, MSG.channel.id, MSG.id, await embed(msg))
            }
        }
    } else if (message.content.startsWith("$plugin install ") || message.content.startsWith("$plugin i ")) {
        let msg = ""
        let command = message.content.replace("$plugin install ", "").replace("$plugin i ", "").split(" ")
        let Name = command[0]
        let VER = null
        msg = msg + "🟦 正在下載 " + Name + ".js 檔案...\n"
        let MSG = await message.reply(await embed(msg))
        if (command.length != 1) {
            VER = command[1]
            if (VER == "dev") {
                msg = msg + "🟦 版本:  最後一個版本 (含 DEV)\n"
            } else {
                msg = msg + "🟦 版本: " + VER + "\n"
            }
        } else {
            msg = msg + "🟦 版本:  最後一個版本\n"
        }
        edit(client, MSG.channel.id, MSG.id, await embed(msg))
        let down = await downloader(Name, VER)
        if (!down.state) {
            msg = msg + "🟥 下載過程出錯了 請向 插件 作者聯繫\n錯誤碼:\n" + down.res
            edit(client, MSG.channel.id, MSG.id, await embed(msg))
        } else {
            msg = msg + "🟦 下載完成 版本: " + down.res + "\n"
            edit(client, MSG.channel.id, MSG.id, await embed(msg))
            try {
                msg = msg + "🟦 正在讀取文件...\n"
                edit(client, MSG.channel.id, MSG.id, await embed(msg))
                var fun = await reload('../Plugin/' + Name)
                msg = msg + "🟦 校驗文件合法性...\n"
                edit(client, MSG.channel.id, MSG.id, await embed(msg))
                if (fun.Info == undefined || fun.Event == undefined || fun.Commands == undefined) {
                    msg = msg + "🟥 文件內容不合法 請向 插件 作者聯繫\n"
                    edit(client, MSG.channel.id, MSG.id, await embed(msg))
                } else {
                    msg = msg + "🟦 註冊 事件監聽...\n🟦 註冊 插件訊息...\n🟦 註冊 插件指令...\n"
                    edit(client, MSG.channel.id, MSG.id, await embed(msg))
                    let plugin = JSON.parse(fs.readFileSync(Path + "/Plugin/plugin.json").toString())
                    if (!plugin.includes(Name) && Name != "pluginLoader") {
                        plugin.push(Name)
                    }
                    fs.writeFileSync(Path + "/Plugin/plugin.json", JSON.stringify(plugin, null, "\t"))
                    if (!await compatible(fun.Info.pluginLoader)) {
                        msg = msg + "🟨 插件 不兼容 當前 pluginLoader\n雖然不會導致錯誤，但是插件並不會被執行\n解決方法:\n1. 更新 pluginLoader\n2. 請插件作者適配\n"
                        edit(client, MSG.channel.id, MSG.id, await embed(msg))
                    }
                    msg = msg + "🟩 插件 安裝 完成"
                    edit(client, MSG.channel.id, MSG.id, await embed(msg))
                }
            } catch (error) {
                msg = msg + `🟥 插件 安裝 過程出錯了 請向 插件 作者聯繫\n錯誤碼:\n${error}\n`
                edit(client, MSG.channel.id, MSG.id, await embed(msg))
            }
        }
    }
}

async function edit(client, channel, msgID, MSG) {
    try {
        let channels = await client.channels.cache.get(channel)
        let msg = await channels.messages.fetch(msgID)
        msg.edit(MSG)
        return true
    } catch (error) {
        return false
    }
}

function ver(version) {
    if (Ver == "") {
        Ver = version
    } else {
        return Ver
    }
}

async function compatible(ver) {
    let Ver = Info.version
    if (ver.includes(Info.version)) {
        return true
    } else if (ver.includes("All")) {
        return true
    } else if (ver.includes(Ver.substring(0, 1) + ".X.X")) {
        return true
    } else if (ver.includes(Ver.substring(0, 1) + "." + Ver.substring(2, 1) + ".X")) {
        return true
    }
    return false
}

async function downloader(path, ver) {
    try {
        var json = await fetch("https://raw.githubusercontent.com/ExpTechTW/MPR/%E4%B8%BB%E8%A6%81%E7%9A%84-(main)/repositories.json")
        var Json = await json.json()
        let url = ""
        for (let index = 0; index < Json.length; index++) {
            if (Json[index]["name"] == path) {
                url = Json[index]["url"]
                if (Json[index]["reclaimed"] == true) return { state: false, res: "此插件已停止支援" }
                break
            }
        }
        if (url == "") return { state: false, res: "無法取得下載地址" }
        var json = await fetch("https://raw.githubusercontent.com/" + url + "version.json")
        var Json = await json.json()
        if (ver == (undefined || null)) {
            for (let index = 0; index < Json.length; index++) {
                if (Json[index]["Pre-Release"] == false) {
                    if (Json[index]["reclaimed"] == true) return { state: false, res: "此 插件 版本 已停止支援" }
                    ver = Json[index]["name"]
                    break
                }
            }
        }
        else if (ver == "dev") {
            if (Json[0]["reclaimed"] == true) return { state: false, res: "此 插件 版本 已停止支援" }
            ver = Json[0]["name"]
        }
        let res = await fetch("https://raw.githubusercontent.com/" + url + "version/" + path + "-" + ver + ".js")
        if (res.status != 200) {
            return { state: false, res: "無法取得下載檔案" }
        } else {
            // if (path.includes('.json')) {
            //     fs.writeFileSync(Path + "/Plugin/" + path + ".js", JSON.stringify(await res.text(), null, "\t"), 'utf8')
            // } else if (path.includes('.js')) {
            let PATH = ""
            if (path == "pluginLoader") {
                PATH = Path + "/Core/" + path + ".js"
            } else {
                PATH = Path + "/Plugin/" + path + ".js"
            }
            fs.writeFileSync(PATH, await res.text(), 'utf8')
            //}
            return { state: true, res: ver }
        }
    } catch (error) {
        return { state: false, res: error }
    }
}

async function embed(msg, color, author, icon) {
    if (color == (undefined || null)) {
        color = '#0099ff'
    }
    if (author != (undefined || null) && icon != (undefined || null)) {
        let exampleEmbed = new MessageEmbed()
            .setColor(color)
            .setDescription(msg)
            .setTimestamp()
            .setFooter({ text: author, iconURL: icon })
        return { embeds: [exampleEmbed] }
    } else {
        const exampleEmbed = new MessageEmbed()
            .setColor(color)
            .setDescription(msg)
            .setTimestamp()
        return { embeds: [exampleEmbed] }
    }
}

async function log(msg, client) {
    let data = JSON.parse(fs.readFileSync(Path + "/Data/config.json").toString())
    if (client != undefined) {
        try {
            if (msg.startsWith("Info")) {
                msg = "🟩 " + msg
            } else if (msg.startsWith("Warn")) {
                msg = "🟨 " + msg
            } else {
                msg = "🟥 " + msg
            }
            await client.channels.cache.get(data["bot_console"]).send(msg)
        } catch (error) {
            console.log("\x1b[31mDiscord Log Error\x1b[0m")
        }
    }
    if (msg.startsWith("Info")) {
        console.log("\x1b[32m" + msg + "\x1b[0m")
    } else if (msg.startsWith("Warn")) {
        console.log("\x1b[33m" + msg + "\x1b[0m")
    } else {
        console.log("\x1b[31m" + msg + "\x1b[0m")
    }
}

module.exports = {
    messageCreate,
    ready,
    plugin,
    ver,
    downloader,
    Info,
    embed,
    edit,
    log
}