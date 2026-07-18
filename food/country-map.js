// ========================================
// Xiaode Guide
// World Map Renderer
// ========================================


let mapSvg;
let mapGroup;

let mapScale = 1;



// 初始化地图

function initWorldMap(){


    mapSvg =
    document.getElementById("world-map");


    if(!mapSvg){
        return;
    }



    fetch("./lib/countries-110m.json")

    .then(r=>r.json())

    .then(data=>{


        drawWorld(data);


    })

    .catch(err=>{


        console.error(
            "地图加载失败",
            err
        );


    });



}





function drawWorld(world){



    const svgNS =
    "http://www.w3.org/2000/svg";



    mapSvg.innerHTML="";



    mapGroup =
    document.createElementNS(
        svgNS,
        "g"
    );



    mapGroup.setAttribute(
        "class",
        "map-group"
    );



    mapSvg.appendChild(
        mapGroup
    );





    const countries =
    topojson.feature(
        world,
        world.objects.countries
    );





    countries.features.forEach(country=>{


        const path =
        document.createElementNS(
            svgNS,
            "path"
        );



        path.setAttribute(
            "d",
            geoPath(country)
        );


        path.classList.add(
            "country"
        );


        path.dataset.country =
        country.properties.name;




        const stats =
        getCountryStats(
            path.dataset.country
        );



        if(stats){


            path.classList.add(
                "active"
            );


            path.style.fill =
            getMapColor(
                stats.average
            );



            path.onclick=function(){


                showCountry(
                    path.dataset.country
                );


            };


        }



        mapGroup.appendChild(
            path
        );


    });



}




// ===============================
// 简化地图投影
// ===============================


function geoPath(feature){


    const coordinates =
    feature.geometry.coordinates;



    return convertGeo(
        coordinates
    );


}




function convertGeo(coords){


    let result="";



    function walk(arr){


        if(
            typeof arr[0][0]
            ===
            "number"
        ){


            arr.forEach(
                p=>{


                    const x =
                    (p[0]+180)
                    *
                    2.7;


                    const y =
                    (90-p[1])
                    *
                    2.7;



                    result +=
                    (result?
                    "L":"M")
                    +
                    x
                    +" "
                    +
                    y;


                }
            );


        }

        else{


            arr.forEach(
                walk
            );


        }


    }



    walk(coords);



    return result;


}




function getMapColor(score){


score =
Number(score);



if(score>=90)
return "#e85d5d";


if(score>=80)
return "#f39b38";


if(score>=70)
return "#9b70d6";


if(score>=60)
return "#4d9de0";


return "#ddd";


}





// 缩放

function zoomMap(value){


mapScale += value;


if(mapScale<0.5)
mapScale=0.5;


if(mapScale>3)
mapScale=3;



if(mapGroup){


mapGroup.style.transform =
`scale(${mapScale})`;

}


}
