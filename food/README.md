# 饭店评分 · 静态站点

单页离线站点，用于 GitHub Pages 部署。

## 部署方式

将本目录（`site/`）内容作为 GitHub Pages 的根目录（或整体上传到 Pages 分支根）：

```
index.html
app.js
country-map.js
饭店评分.xlsx        ← 用户提供，与 index.html 同目录
lib/
  xlsx.full.min.js
  topojson-client.min.js
  countries-110m.json
```

## 本地预览

由于浏览器不允许 `file://` 下 `fetch` xlsx，请用任意静态服务器：

```
cd site
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## Excel 列识别（模糊匹配，兼容常见命名）

- 饭店名：`饭店 / 餐厅 / 名称 / 店名 / name`
- 位置：`位置 / 地址 / 城市 / 地点 / location / city`
- 类别：`类别 / 类型 / 菜系 / 分类 / category / cuisine`
- 总评分：优先 `总评分 / 总评 / 总分`，其次 `评分 / 分数 / score / rating`
- 国家（可选）：`国家 / country`

## 国家识别规则

1. 若有“国家”列，直接使用；
2. 否则根据“位置”文本匹配国家名（见 `country-map.js` 的 `COUNTRY_CN2ISO`）；
3. 若为“全国”或中国主要城市（`CN_CITIES`）→ 归为中国；
4. 未识别的行默认归为中国。

扩展新国家：在 `country-map.js` 中增加 `COUNTRY_CN2ISO`（中文名 → ISO 数字编码）与 `ISO2CN`（ISO → 展示名）两个映射即可，无需改动主逻辑。ISO 编码可从 https://en.wikipedia.org/wiki/ISO_3166-1_numeric 查询。

扩展新城市：加入 `CN_CITIES`（中国境内）即可自动归入中国。
