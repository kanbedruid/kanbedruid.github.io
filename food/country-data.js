// =====================================
// Xiaode Guide
// 城市 / 地区 -> 国家映射
// =====================================


const countryRules = {


    // =================
    // 中国
    // =================

    "中国": "China",

    "全国": "China",

    "北京": "China",

    "上海": "China",

    "南京": "China",

    "苏州": "China",

    "杭州": "China",

    "广州": "China",

    "深圳": "China",

    "成都": "China",

    "重庆": "China",

    "武汉": "China",

    "长沙": "China",

    "西安": "China",

    "天津": "China",

    "合肥": "China",

    "淮南": "China",

    "东莞": "China",

    "佛山": "China",

    "厦门": "China",


    // 台湾 香港 澳门
    // 按中国处理

    "台湾": "China",

    "台北": "China",

    "高雄": "China",

    "香港": "China",

    "澳门": "China",





    // =================
    // 日本
    // =================


    "日本": "Japan",

    "东京": "Japan",

    "京都": "Japan",

    "大阪": "Japan",

    "宇治": "Japan",

    "近江八幡": "Japan",

    "北海道": "Japan",

    "神户": "Japan",

    "奈良": "Japan",




    // =================
    // 韩国
    // =================


    "韩国": "South Korea",

    "首尔": "South Korea",



    // =================
    // 欧洲
    // =================


    "法国": "France",

    "巴黎": "France",


    "英国": "United Kingdom",

    "伦敦": "United Kingdom",


    "德国": "Germany",

    "柏林": "Germany",


    "意大利": "Italy",

    "罗马": "Italy",

    "米兰": "Italy",


    "西班牙": "Spain",

    "马德里": "Spain",




    // =================
    // 北美
    // =================


    "美国": "United States",

    "纽约": "United States",

    "洛杉矶": "United States",

    "旧金山": "United States",


    "加拿大": "Canada",

    "多伦多": "Canada",


};





// ===============================
// 根据位置返回国家
// ===============================


function getCountry(location){


    if(!location){

        return "China";

    }


    let text = String(location);



    // 精确匹配

    for(let key in countryRules){


        if(text.includes(key)){


            return countryRules[key];


        }


    }



    // 默认

    // 没有国家前缀的一律认为中国

    return "China";


}






// ===============================
// 国家中文名
// ===============================


const countryNames = {


    "China":
    "中国",


    "Japan":
    "日本",


    "South Korea":
    "韩国",


    "France":
    "法国",


    "United Kingdom":
    "英国",


    "Germany":
    "德国",


    "Italy":
    "意大利",


    "Spain":
    "西班牙",


    "United States":
    "美国",


    "Canada":
    "加拿大"


};




function getCountryName(code){


    return countryNames[code] || code;


}
