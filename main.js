const API_KEY = config.apiKey; //api키 저장
console.log(API_KEY);
let lat; // 위도
let lon; // 경도
let corData; // 위도경도 데이터
let data; // 날씨 데이터
let hours; // 현재 시간
let date; //현재 날짜
let mapImage = document.getElementById("map");
let inputValue = document.getElementById("localInput");
let inputBtn = document.getElementById("input-button");
let searchLocal;
inputBtn.addEventListener("click", ()=>searchInput());
const getCoordinate = async(local) =>{
    let url = new URL(`http://api.openweathermap.org/geo/1.0/direct?q=yeosu&units=metric&appid=${API_KEY}`);
    if(local){
        url = new URL(`http://api.openweathermap.org/geo/1.0/direct?q=${local}&units=metric&appid=${API_KEY}`);
    }
    let response = await fetch(url);
    corData = await response.json();
    lat = corData[0].lat;
    lon = corData[0].lon;
    getWeatherData();
    renderMap();
    render_8Day_forecast();
    renderChart();
}
const getWeatherData = async() => {
    let url = new URL(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&cnt=10`);
    let response = await fetch(url);
    data = await response.json();
    renderLocalInformation();
}
const renderLocalInformation = () => {
    let today = new Date();
    date = today.toString().split(' ')[1] + ' ' + today.toString().split(' ')[2]; //1
    hours = ('0'+today.getHours()).slice(-2);
    let minutes = ('0'+today.getMinutes()).slice(-2);
    let ampm = hours < 12 ? 'am' : 'pm';
    let time = `${hours}:${minutes}${ampm}` //2
    let localName = corData[0].local_names.ko;
    let countryName = corData[0].country;
    let name = `${localName}, ${countryName}`; //3
    let iconSrc = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`; //4
    let description = data.weather[0].description; //5
    let temp = Math.round(data.main.temp)+"°C"; //6
    let degree = data.wind.deg < 45?"N": data.wind.deg < 135?"E":data.wind.deg <225?"S":data.wind.deg<315?"W":"N";
    let wind = `${data.wind.speed.toFixed(1)}m/s ${degree}`; // 7
    let pressure = data.main.pressure + "hPa"; //8
    let humidity = data.main.humidity + "%"; //9
    let visibility = ((data.visibility)/1000).toFixed(1)+"km"; // 10
    let feelsLike = Math.round(data.main.feels_like)+"°C"; //11
     
    let informationHTML = `
        <div>
            <div>
                <div class="date">${date}, ${time}</div>
                <div class="local-name">${name}</div>
            </div>
            <div class="local-temp">
                <img src="${iconSrc}"/>
                ${temp}
            </div>
        </div>
        <div class="temp-detail">
            <div>Feels like ${feelsLike}. ${description}.</div>
            <ul>
                <li>${wind}</li>
                <li>${pressure}</li>
                <li>Humidity: ${humidity}</li>
                <li>Visibility: ${visibility}</li>
            </ul>
        </div>
    `
    document.getElementById("local-information").innerHTML = informationHTML;
}
const renderMap = async() => {
    document.getElementById("map").innerText = ""; //초기화
    let map = new ol.Map({
        layers: [
            new ol.layer.Tile({
            source: new ol.source.OSM(),
            }),
        ],
        target: "map",
        controls: ol.control.defaults({
            attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
            collapsible: false,
            }),
        }),
        view: new ol.View({
            projection:'EPSG:900913',
            center: ol.proj.fromLonLat([lon, lat]),
            zoom: 10,
        }),
    });
}
const render_8Day_forecast = async() => {
    let url = new URL(`https://pro.openweathermap.org/data/2.5/forecast/climate?lat=${lat}&lon=${lon}&cnt=8&lang=kr&units=metric&appid=${API_KEY}`);
    let response = await fetch(url);
    let dayForecastData = (await response.json()).list;
    let date =[];
    let iconList =[];
    let maxTempList =[];
    let minTempList =[];
    let descriptionList =[];
    dayForecastData.forEach((item)=>{
        date.push(item.dt);
        iconList.push(item.weather[0].icon);
        maxTempList.push(Math.floor(item.temp.max));
        minTempList.push(Math.floor(item.temp.min));
        descriptionList.push(item.weather[0].description);
    })
    let dateList=[];
    date.forEach((item)=>dateList.push(new Date(item*1000)));
    let fixedDateList = [];
    dateList.forEach((item)=>{
        let string = item.toString().split(' ');
        fixedDateList.push(`${string[0]}, ${string[1]}${string[2]}`);
    })
    let dayForecastHTML = "";
    for(let i=0; i<dateList.length; i++){
        dayForecastHTML += `
            <li>
                <span style="display: flex; align-items:center;">${fixedDateList[i]}</span>
                <div class="day-forecast-value">
                    <div style="display:flex; justify-content:flex-start; align-items:center;">
                        <img src="https://openweathermap.org/img/wn/${iconList[i]}@2x.png"/>
                        <span>${maxTempList[i]} / ${minTempList[i]}°C </span>
                    </div>
                    <span class="description" style="width:70px; display: flex; align-items: center; text-align: left;">${descriptionList[i]}</span>
                </div>
            </li>
        `
    }
    document.getElementById("day-forecast").innerHTML = dayForecastHTML;
}
const renderChart = async() =>{
    document.querySelector(".chart-container").innerHTML = `<canvas width="1400" height="320" id="forecastChart"></canvas>`; //초기화
    let url = new URL(`https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&lang=kr&units=metric&appid=${API_KEY}`);
    let response = await fetch(url);
    let data = await response.json();
    let dataList = data.list;
    let dataDt = [];
    dataList.forEach((date)=>dataDt.push( Number( (date.dt_txt).slice(11,13) ) ));
    let count = 0; //현재시간이 있는 인덱스값
    for(let i=0; i<dataDt.length; i++){
        if(dataDt[i] == Number(hours)){
            count = i;
            break;
        }
    }
    for(let i=0; i<20; i++){
        dataDt[count+i] = dataDt[count+i] < 12 ? dataDt[count+i]+"am" : (dataDt[count+i]-12)+"pm";
        //dataDt[count+i] == "0am" ? dataDt[count+i] = 
    }
    let chartTemp = [];
    let maxTemp = -999;
    let minTemp = 999;
    for(let i=0; i<20; i++){
        chartTemp.push((dataList[count+i].main.temp).toFixed(1)); //차트에 들어갈 온도
        maxTemp = maxTemp < dataList[count+i].main.temp?dataList[count+i].main.temp:maxTemp; //최고온도
        minTemp = minTemp > dataList[count+i].main.temp?dataList[count+i].main.temp:minTemp; //최저온도
    }
    const ctx = document.getElementById('forecastChart');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: 
                [[dataDt[count],dataList[count].weather[0].description],
                [dataDt[count+1],dataList[count+1].weather[0].description],
                [dataDt[count+2],dataList[count+2].weather[0].description],
                [dataDt[count+3],dataList[count+3].weather[0].description],
                [dataDt[count+4],dataList[count+4].weather[0].description],
                [dataDt[count+5],dataList[count+5].weather[0].description],
                [dataDt[count+6],dataList[count+6].weather[0].description],
                [dataDt[count+7],dataList[count+7].weather[0].description],
                [dataDt[count+8],dataList[count+8].weather[0].description],
                [dataDt[count+9],dataList[count+9].weather[0].description],
                [dataDt[count+10],dataList[count+10].weather[0].description],
                [dataDt[count+11],dataList[count+11].weather[0].description],
                [dataDt[count+12],dataList[count+12].weather[0].description],
                [dataDt[count+13],dataList[count+13].weather[0].description],
                [dataDt[count+14],dataList[count+14].weather[0].description],
                [dataDt[count+15],dataList[count+15].weather[0].description],
                [dataDt[count+16],dataList[count+16].weather[0].description],
                [dataDt[count+17],dataList[count+17].weather[0].description],
                [dataDt[count+18],dataList[count+18].weather[0].description],
                [dataDt[count+19],dataList[count+19].weather[0].description]],
            datasets: [{
                label: '',
                data: [
                chartTemp[0],
                chartTemp[1],
                chartTemp[2],
                chartTemp[3],
                chartTemp[4],
                chartTemp[5],
                chartTemp[6],
                chartTemp[7],
                chartTemp[8],
                chartTemp[9],
                chartTemp[10],
                chartTemp[11],
                chartTemp[12],
                chartTemp[13],
                chartTemp[14],
                chartTemp[15],
                chartTemp[16],
                chartTemp[17],
                chartTemp[18],
                chartTemp[19]
            ],
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.2,
            borderColor: '#eb6e4b'
        }]
        },
        options: {
            layout: {
                padding:{
                    top: 20,
                    right: 50
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    max : Math.ceil(maxTemp) + 1,
                    min : Math.floor(minTemp) - 1,
                    ticks:{
                        stepSize: 1,
                    },
                    girdLines:{
                        drawBorder: false
                    }

                },
                x:{
        
                }
            },
            maintainAspectRatio: false,
            responsive: false
        }
    });
}
const searchInput =()=>{
    searchLocal = inputValue.value;
    getCoordinate(searchLocal);
}
getCoordinate();