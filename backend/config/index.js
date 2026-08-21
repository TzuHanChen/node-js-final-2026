require("dotenv").config();
const db = require("./db");
const web = require("./web");
const secret = require("./secret");

const config = { db, web, secret };

function get(path) {
  const keys = path.split(".");
  let result = config;
  for (const key of keys) {
    result = result[key];
    if (result === undefined) throw new Error(`Config path not found: ${path}`);
  }
  return result;
}

module.exports = { get };

// 用 get("db.host") 的方式取值
// path.split(".") 將 "web.port" 拆成 ["web", "port"]
// 初始 result = config，即 { db, web, secret } 這個物件
// 第一次迭代：result = result["web"] → 取得 require("./web") 匯出的物件
// 第二次迭代：result = result["port"] → 取得該物件中的 port 屬性值