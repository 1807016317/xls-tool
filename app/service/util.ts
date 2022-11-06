import { praseEnumStruct } from "./jx-define"
import xlsxData from "./xlsx-data"

const dialog = require("electron").dialog

export default class Util {
    // 获取单元格解析内容中的实际值，v
    public static get_cell_v(cell: any, fileName?: string): string {
        if (cell == null) {
            return ""
        }
        let val = cell.v
        return val ? val.toString().trim() : ""
    }

    //获取单元格解析内容中的批注，h
    public static get_cell_c(cell: any): praseEnumStruct | null {
        if (cell == null) {
            return null
        }
        if (cell.c && cell.c.length > 0 && cell.c[0].h) {
            let comment = cell.c[0].h.toString().trim() //批注
            comment = comment.replace(/<br\/>/g, "\n")
            comment = comment.replace(/<.*?>/g, "")
            //wps
            comment = comment.replace(/&#10;/g, "\n")
            comment = comment.replace('作者:\n', '')
            let retDict: praseEnumStruct = Object.create(null)
            let name = cell.v.toString().trim()
            retDict.name = ("enum_" + name).toUpperCase()

            let splitArr = comment.split("\n")
            let units: string[] = []
            let match1 = /^(\d+).*?[=:]+.*?([\d_\w]+)(.*)/  //    1=a 数字=字母
            let match2 = /^([\d_\w]+).*?[=:]+.*?(\d+)(.*)/  //    a=1 字母=数字
            let enumLen = splitArr.length
            for (let i = 0; i < enumLen; i++) {
                let str = splitArr[i]
                let results = null
                if (results = str.match(match1)) {
                    let tmp = results[1]
                    results[1] = results[2]
                    results[2] = tmp
                } else if (results = str.match(match2)) {
                }
                if (results) {
                    if (results[1].includes('_max') && enumLen === 1) {
                        return null
                    }
                    results[3] = results[3].replace(/[,;#]/, "")
                    if (results[3]) {
                        str = results[1] + " : " + results[2] + ", //" + results[3]
                    } else {
                        str = results[1] + " : " + results[2] + ","
                    }
                    str = str.toUpperCase()
                    units.push(str)
                }
            }
            retDict.valList = units
            return retDict
        }
        return null
    }

    /**
     * 字母自增
     * @param {string} az 字母组
     * @param {number} step 字母增加步长
     */
    public static get_nextAZ(az: string, step = 1) {
        let azlist = az.split("")
        let zcharcode = "Z".charCodeAt(0)
        let carrier = 0

        for (let i = azlist.length - 1; i >= 0; i--) {
            let v = azlist[i].charCodeAt(0)
            if (v < zcharcode) {
                v += step
                azlist[i] = String.fromCharCode(v)
                carrier = 0
                break
            } else {
                azlist[i] = 'A'
                carrier = 1
            }
        }
        if (carrier == 1) {
            azlist.unshift("A")
        }

        return azlist.join("")
    }

    public static get_AZ_by_idx(idx: number) {
        // A~Z 的 ascll 码是 65~90
        idx = idx + 1
        const AStart = 64
        const codeNum = 26
        let beilv = Math.floor(idx / codeNum)
        let val = (idx % codeNum).toString()
        let ascllStr = beilv ? beilv + val : val
        let len = ascllStr.length
        let char = ""
        for (let i = 0; i < len; i++) {
            const charCode = Number(ascllStr[i]) + AStart
            char += String.fromCharCode(charCode)
        }
        if (!char) {
            this.show_error_dialog('数字转 A~Z 失败')
        }
        return char
    }

    /**
    * 错误弹窗函数
    * @param {string} msg 错误信息
    */
    public static show_error_dialog = function (msg: string) {
        console.log(`\n 错误日志：${msg}`)
        if (!xlsxData.instance.can_add_errorMsg()) {
            return
        }
        if (!msg) {
            msg = "未知错误，请联系开发"
        }
        const options = {
            type: 'error',
            title: '导表失败',
            message: msg,
        }
        xlsxData.instance.set_export_state_str(msg)
        if (!Util.is_jenkins()) {
            dialog.showMessageBox(options)
        } else {
            console.error("导表失败", msg)
        }
    }

    public static is_jenkins() {
        return process.env["IS_JENKINS"] === "1"
    }
}