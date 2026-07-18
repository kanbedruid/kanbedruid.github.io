
// ========================================
// Xiaode Guide
// 主程序
// ========================================


let restaurants = [];

let filteredRestaurants = [];

let currentScale = 1;





// ========================================
// 读取 Excel
// ========================================


fetch("./饭店评分.xlsx")

.then(res => {


    if(!res.ok){

        throw new Error("Excel不存在");

    }


    return res.arrayBuffer();


})


.then(buffer=>{


    const workbook = XLSX.read(
        buffer,
        {
            type:"array"
        }
    );


    const sheet =
    workbook.Sheets[
        workbook.SheetNames[0]
    ];



    restaurants =
    XLSX.utils.sheet_to_json(sheet);



    filteredRestaurants =
    [...restaurants];



    init();


})


.catch(err=>{


    document.getElementById(
        "restaurant-list"
    ).innerHTML =

    `<div class="empty">
    无法读取 饭店评分.xlsx<br>
    ${err.message}
    </div>`;


});






// ========================================
// 初始化
// ========================================


function init(){


    renderList();


    createFilters();


    initTabs();


    initMap();



}







// ========================================
// 排行榜渲染
// ========================================


function renderList(){



    const box =
    document.getElementById(
        "restaurant-list"
    );



    if(filteredRestaurants.length===0){


        box.innerHTML=

        `<div class="empty">
        没有找到相关餐厅
        </div>`;


        return;


    }





    box.innerHTML =
    
    filteredRestaurants.map((r,index)=>{


        return `

<div class="restaurant-card">


<div class="restaurant-title">


<div>

<h2>

${r["饭店名"] || "未知餐厅"}

</h2>


<div class="location">

${r["位置"] || ""}

 ·

${r["类别"] || ""}

</div>


</div>




<div class="
score-total
${scoreClass(r["总评"])}
">

${number(r["总评"])}

</div>


</div>





<div class="score-grid">


${scoreItem(
"口味",
r["口味"]
)}



${scoreItem(
"服务",
r["服务"]
)}



${scoreItem(
"环境",
r["环境"]
)}



${scoreItem(
"总评",
r["总评"]
)}



</div>





${r["特别好吃的东西"] ?

`

<p>

推荐：

${r["特别好吃的东西"]}

</p>

`

:""}



</div>


`;



    }).join("");



}







// ========================================
// 评分显示
// ========================================


function scoreItem(name,value){


return `

<div class="
score-item
${scoreClass(value)}
">

<span>${name}</span>

<b>${number(value)}</b>

</div>

`;



}





function number(v){


if(v===undefined || v===""){

return "-";

}


return Number(v).toFixed(1);

}






function scoreClass(v){


v=Number(v);


if(v>=90)

return "score-red";


if(v>=80)

return "score-orange";


if(v>=70)

return "score-purple";


if(v>=60)

return "score-blue";


return "";

}






// ========================================
// 搜索
// ========================================


function createFilters(){



const name =
document.getElementById(
"search-name"
);


const loc =
document.getElementById(
"search-location"
);


const cat =
document.getElementById(
"search-category"
);



[
name,
loc,
cat

].forEach(
input=>{

input.addEventListener(
"input",
filter
);


});





document
.getElementById(
"reset-filter"
)
.onclick=function(){


name.value="";

loc.value="";

cat.value="";


filteredRestaurants =
[...restaurants];


renderList();



};




}






function filter(){



const name =
document
.getElementById(
"search-name"
)
.value
.trim();



const loc =
document
.getElementById(
"search-location"
)
.value
.trim();



const cat =
document
.getElementById(
"search-category"
)
.value
.trim();




filteredRestaurants =

restaurants.filter(r=>{


return

String(
r["饭店名"]||""
)
.includes(name)


&&


String(
r["位置"]||""
)
.includes(loc)


&&


String(
r["类别"]||""
)
.includes(cat);



});



renderList();


}
// ========================================
// 页面 Tab
// ========================================


function initTabs(){


document
.querySelectorAll(".nav-btn")
.forEach(btn=>{


btn.onclick=function(){


document
.querySelectorAll(".nav-btn")
.forEach(b=>
b.classList.remove("active")
);


btn.classList.add("active");



document
.querySelectorAll(".page")
.forEach(p=>
p.classList.remove("active")
);



document
.getElementById(
btn.dataset.page
)
.classList.add("active");



};



});


}






// ========================================
// 地图初始化
// ========================================


function initMap(){


if(
typeof worldMapData === "undefined"
){


console.log(
"没有地图数据"
);


return;


}



drawMap();



}




// ========================================
// 绘制世界地图
// ========================================


function drawMap(){


const svg =
document.getElementById(
"world-map"
);



svg.innerHTML="";



worldMapData.features.forEach(country=>{



const path =
document.createElementNS(
"http://www.w3.org/2000/svg",
"path"
);



path.setAttribute(
"d",
country.path
);



path.classList.add(
"country"
);




const code =
country.name;



const data =
getCountryStats(code);




if(data){


path.classList.add(
"active"
);


path.onclick=function(){


showCountry(code);


};


}





svg.appendChild(path);



});



initZoom();



}





// ========================================
// 国家统计
// ========================================


function getCountryStats(code){



const list =

restaurants.filter(r=>{


return (

getCountry(
r["位置"]
)

===code


);


});



if(
list.length===0
)

return null;



let total=0;



list.forEach(r=>{


total += Number(
r["总评"]
)||0;


});



return {


count:list.length,


average:
(total/list.length).toFixed(1),


restaurants:list



};



}







// ========================================
// 点击国家
// ========================================


function showCountry(code){



const data =
getCountryStats(code);



if(!data)

return;



const box =
document.getElementById(
"country-panel"
);



const panel =
document.querySelector(
".country-panel"
);




panel.innerHTML=`

<h2>

${getCountryName(code)}

</h2>


<p>

平均评分：

<b>
${data.average}
</b>

</p>


<p>

餐厅：

${data.count}

家

</p>



<hr>



${data.restaurants.map(r=>{


return `


<div class="mini-card">


<b>
${r["饭店名"]}
</b>


<br>


${r["位置"]}

<br>


总评：

${r["总评"]}


</div>


`;


}).join("")}


`;



}







// ========================================
// 地图缩放
// ========================================


function initZoom(){



const svg =
document.getElementById(
"world-map"
);



document
.getElementById(
"zoom-in"
)
.onclick=function(){


currentScale +=0.2;


svg.style.transform =
`scale(${currentScale})`;


};




document
.getElementById(
"zoom-out"
)
.onclick=function(){


currentScale -=0.2;


if(
currentScale<0.6
)

currentScale=0.6;



svg.style.transform =
`scale(${currentScale})`;


};





document
.getElementById(
"zoom-reset"
)
.onclick=function(){


currentScale=1;


svg.style.transform =
"scale(1)";


};



}
