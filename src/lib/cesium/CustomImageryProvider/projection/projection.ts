// 投影对照表
const projectionConfig: any = {
    //CGCS2000
    "EPSG:4490": "+proj=longlat +ellps=GRS80 +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 13
    "EPSG:4491": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=13500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 14
    "EPSG:4492": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=14500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 15
    "EPSG:4493": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=15500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 16
    "EPSG:4494": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=16500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 17
    "EPSG:4495": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=17500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 18
    "EPSG:4496": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=18500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 19
    "EPSG:4497": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=19500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 20
    "EPSG:4498": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=20500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 21
    "EPSG:4499": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=21500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 22
    "EPSG:4500": "++proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=22500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger zone 23
    "EPSG:4501": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=23500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 75E
    "EPSG:4502": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 81E
    "EPSG:4503": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 87E
    "EPSG:4504": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 93E
    "EPSG:4505": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 99E
    "EPSG:4506": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 105E
    "EPSG:4507": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 111E
    "EPSG:4508": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 117E
    "EPSG:4509": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 123E
    "EPSG:4510": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 129E
    "EPSG:4511": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / Gauss-Kruger CM 135E
    "EPSG:4512": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 25
    "EPSG:4513": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=25500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 26
    "EPSG:4514": "+proj=tmerc +lat_0=0 +lon_0=78 +k=1 +x_0=26500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 27
    "EPSG:4515": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=27500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 28
    "EPSG:4516": "+proj=tmerc +lat_0=0 +lon_0=84 +k=1 +x_0=28500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 29
    "EPSG:4517": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=29500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 30
    "EPSG:4518": "+proj=tmerc +lat_0=0 +lon_0=90 +k=1 +x_0=30500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 31
    "EPSG:4519": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=31500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 32
    "EPSG:4520": "+proj=tmerc +lat_0=0 +lon_0=96 +k=1 +x_0=32500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 33
    "EPSG:4521": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=33500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 34
    "EPSG:4522": "+proj=tmerc +lat_0=0 +lon_0=102 +k=1 +x_0=34500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 35
    "EPSG:4523": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=35500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 36
    "EPSG:4524": "+proj=tmerc +lat_0=0 +lon_0=108 +k=1 +x_0=36500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 37
    "EPSG:4525": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=37500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 38
    "EPSG:4526": "+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=38500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 39
    "EPSG:4527": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=39500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 40
    "EPSG:4528": "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=40500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 41
    "EPSG:4529": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=41500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 42
    "EPSG:4530": "+proj=tmerc +lat_0=0 +lon_0=126 +k=1 +x_0=42500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 43
    "EPSG:4531": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=43500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 44
    "EPSG:4532": "+proj=tmerc +lat_0=0 +lon_0=132 +k=1 +x_0=44500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger zone 45
    "EPSG:4533": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=45500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 75E
    "EPSG:4534": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 78E
    "EPSG:4535": "+proj=tmerc +lat_0=0 +lon_0=78 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 81E
    "EPSG:4536": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 84E
    "EPSG:4537": "+proj=tmerc +lat_0=0 +lon_0=84 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 87E
    "EPSG:4538": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 90E
    "EPSG:4539": "+proj=tmerc +lat_0=0 +lon_0=90 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 93E
    "EPSG:4540": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 96E
    "EPSG:4541": "+proj=tmerc +lat_0=0 +lon_0=96 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 99E
    "EPSG:4542": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 102E
    "EPSG:4543": "+proj=tmerc +lat_0=0 +lon_0=102 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 105E
    "EPSG:4544": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 108E
    "EPSG:4545": "+proj=tmerc +lat_0=0 +lon_0=108 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 111E
    "EPSG:4546": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 114E
    "EPSG:4547": "+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 117E
    "EPSG:4548": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 120E
    "EPSG:4549": "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 123E
    "EPSG:4550": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 126E
    "EPSG:4551": "+proj=tmerc +lat_0=0 +lon_0=126 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 129E
    "EPSG:4552": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 132E
    "EPSG:4553": "+proj=tmerc +lat_0=0 +lon_0=132 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    //CGCS2000 / 3-degree Gauss-Kruger CM 135E
    "EPSG:4554": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs",
    // 新增北京54坐标系
    //GCS_Beijing_1954
    "EPSG:4214": "+proj=longlat +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 25
    "EPSG:2401": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=25500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 26
    "EPSG:2402": "+proj=tmerc +lat_0=0 +lon_0=78 +k=1 +x_0=26500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 27
    "EPSG:2403": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=27500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 28
    "EPSG:2404": "+proj=tmerc +lat_0=0 +lon_0=84 +k=1 +x_0=28500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 29
    "EPSG:2405": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=29500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 30
    "EPSG:2406": "+proj=tmerc +lat_0=0 +lon_0=90 +k=1 +x_0=30500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 31
    "EPSG:2407": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=31500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 32
    "EPSG:2408": "+proj=tmerc +lat_0=0 +lon_0=96 +k=1 +x_0=32500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 33
    "EPSG:2409": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=33500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 34
    "EPSG:2410": "+proj=tmerc +lat_0=0 +lon_0=102 +k=1 +x_0=34500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 35
    "EPSG:2411": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=35500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 36
    "EPSG:2412": "+proj=tmerc +lat_0=0 +lon_0=108 +k=1 +x_0=36500000 +y_0=0 +ellps=krass +towgs84=11.911,-154.833,-80.079,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 37
    "EPSG:2413": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=37500000 +y_0=0 +ellps=krass +towgs84=31.4,-144.3,-74.8,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 38
    "EPSG:2414": "+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=38500000 +y_0=0 +ellps=krass +towgs84=31.4,-144.3,-74.8,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 39
    "EPSG:2415": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=39500000 +y_0=0 +ellps=krass +towgs84=31.4,-144.3,-74.8,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 40
    "EPSG:2416": "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=40500000 +y_0=0 +ellps=krass +towgs84=15.53,-113.82,-41.38,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 41
    "EPSG:2417": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=41500000 +y_0=0 +ellps=krass +towgs84=15.53,-113.82,-41.38,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 42
    "EPSG:2418": "+proj=tmerc +lat_0=0 +lon_0=126 +k=1 +x_0=42500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 43
    "EPSG:2419": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=43500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 44
    "EPSG:2420": "+proj=tmerc +lat_0=0 +lon_0=132 +k=1 +x_0=44500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger zone 45
    "EPSG:2421": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=45500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 75E
    "EPSG:2422": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 78E
    "EPSG:2423": "+proj=tmerc +lat_0=0 +lon_0=78 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 81E
    "EPSG:2424": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 84E
    "EPSG:2425": "+proj=tmerc +lat_0=0 +lon_0=84 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 87E
    "EPSG:2426": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 90E
    "EPSG:2427": "+proj=tmerc +lat_0=0 +lon_0=90 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 93E
    "EPSG:2428": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 96E
    "EPSG:2429": "+proj=tmerc +lat_0=0 +lon_0=96 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 99E
    "EPSG:2430": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 102E
    "EPSG:2431": "+proj=tmerc +lat_0=0 +lon_0=102 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 105E
    "EPSG:2432": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 108E
    "EPSG:2433": "+proj=tmerc +lat_0=0 +lon_0=108 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=11.911,-154.833,-80.079,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 111E
    "EPSG:2434": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=31.4,-144.3,-74.8,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 114E
    "EPSG:2435": "+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=31.4,-144.3,-74.8,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 117E
    "EPSG:2436": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=31.4,-144.3,-74.8,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 120E
    "EPSG:2437": "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.53,-113.82,-41.38,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 123E
    "EPSG:2438": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.53,-113.82,-41.38,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 126E
    "EPSG:2439": "+proj=tmerc +lat_0=0 +lon_0=126 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 129E
    "EPSG:2440": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 132E
    "EPSG:2441": "+proj=tmerc +lat_0=0 +lon_0=132 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / 3-degree Gauss-Kruger CM 135E
    "EPSG:2442": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 13
    "EPSG:21413": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=13500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 14
    "EPSG:21414": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=14500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 15
    "EPSG:21415": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=15500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 16
    "EPSG:21416": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=16500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 17
    "EPSG:21417": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=17500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 18
    "EPSG:21418": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=18500000 +y_0=0 +ellps=krass +towgs84=11.911,-154.833,-80.079,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 19
    "EPSG:21419": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=19500000 +y_0=0 +ellps=krass +towgs84=31.4,-144.3,-74.8,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 20
    "EPSG:21420": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=20500000 +y_0=0 +ellps=krass +towgs84=15.53,-113.82,-41.38,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 21
    "EPSG:21421": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=21500000 +y_0=0 +ellps=krass +towgs84=15.53,-113.82,-41.38,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 22
    "EPSG:21422": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=22500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    //Beijing 1954 / Gauss-Kruger zone 23
    "EPSG:21423": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=23500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 75E
    "EPSG:21453": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 81E
    "EPSG:21454": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 87E
    "EPSG:21455": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.8,-154.4,-82.3,0,0,0,0 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 93E
    "EPSG:21456": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 99E
    "EPSG:21457": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 105E
    "EPSG:21458": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=11.911,-154.833,-80.079,0,0,0,0 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 111E
    "EPSG:21459": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=31.4,-144.3,-74.8,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 117E
    "EPSG:21460": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.53,-113.82,-41.38,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 123E
    "EPSG:21461": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=15.53,-113.82,-41.38,0,0,0.814,-0.38 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 129E
    "EPSG:21462": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    // Beijing 1954 / Gauss-Kruger CM 135E
    "EPSG:21463": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=500000 +y_0=0 +ellps=krass +towgs84=12.646,-155.176,-80.863,0,0,0,0 +units=m +no_defs +type=crs",
    // 新增西安80坐标系
    //GCS_Xian_1980
    "EPSG:4610": "+proj=longlat +ellps=IAU76 +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 75E
    "EPSG:2370": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 78E
    "EPSG:2371": "+proj=tmerc +lat_0=0 +lon_0=78 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 81E
    "EPSG:2372": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 84E
    "EPSG:2373": "+proj=tmerc +lat_0=0 +lon_0=84 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 87E
    "EPSG:2374": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 90E
    "EPSG:2375": "+proj=tmerc +lat_0=0 +lon_0=90 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 93E
    "EPSG:2376": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 96E
    "EPSG:2377": "+proj=tmerc +lat_0=0 +lon_0=96 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 99E
    "EPSG:2378": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 102E
    "EPSG:2379": "+proj=tmerc +lat_0=0 +lon_0=102 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 105E
    "EPSG:2380": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 108E
    "EPSG:2381": "+proj=tmerc +lat_0=0 +lon_0=108 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 111E
    "EPSG:2382": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 114E
    "EPSG:2383": "+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 117E
    "EPSG:2384": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 120E
    "EPSG:2385": "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 123E
    "EPSG:2386": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 126E
    "EPSG:2387": "+proj=tmerc +lat_0=0 +lon_0=126 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 129E
    "EPSG:2388": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 132E
    "EPSG:2389": "+proj=tmerc +lat_0=0 +lon_0=132 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger CM 135E
    "EPSG:2390": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 25
    "EPSG:2349": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=25500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 26
    "EPSG:2350": "+proj=tmerc +lat_0=0 +lon_0=78 +k=1 +x_0=26500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 27
    "EPSG:2351": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=27500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 28
    "EPSG:2352": "+proj=tmerc +lat_0=0 +lon_0=84 +k=1 +x_0=28500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 29
    "EPSG:2353": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=29500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 30
    "EPSG:2354": "+proj=tmerc +lat_0=0 +lon_0=90 +k=1 +x_0=30500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 31
    "EPSG:2355": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=31500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 32
    "EPSG:2356": "+proj=tmerc +lat_0=0 +lon_0=96 +k=1 +x_0=32500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 33
    "EPSG:2357": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=33500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 34
    "EPSG:2358": "+proj=tmerc +lat_0=0 +lon_0=102 +k=1 +x_0=34500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 35
    "EPSG:2359": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=35500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 36
    "EPSG:2360": "+proj=tmerc +lat_0=0 +lon_0=108 +k=1 +x_0=36500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 37
    "EPSG:2361": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=37500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 38
    "EPSG:2362": "+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=38500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 39
    "EPSG:2363": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=39500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 40
    "EPSG:2364": "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=40500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 41
    "EPSG:2365": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=41500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 42
    "EPSG:2366": "+proj=tmerc +lat_0=0 +lon_0=126 +k=1 +x_0=42500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 43
    "EPSG:2367": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=43500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 44
    "EPSG:2368": "+proj=tmerc +lat_0=0 +lon_0=132 +k=1 +x_0=44500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / 3-degree Gauss-Kruger zone 45
    "EPSG:2369": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=45500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 75E
    "EPSG:2338": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 81E
    "EPSG:2339": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 87E
    "EPSG:2340": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 93E
    "EPSG:2341": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 99E
    "EPSG:2342": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 105E
    "EPSG:2343": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 111E
    "EPSG:2344": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 117E
    "EPSG:2345": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 123E
    "EPSG:2346": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 129E
    "EPSG:2347": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger CM 135E
    "EPSG:2348": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 13
    "EPSG:2327": "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=13500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 14
    "EPSG:2328": "+proj=tmerc +lat_0=0 +lon_0=81 +k=1 +x_0=14500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 15
    "EPSG:2329": "+proj=tmerc +lat_0=0 +lon_0=87 +k=1 +x_0=15500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 16
    "EPSG:2330": "+proj=tmerc +lat_0=0 +lon_0=93 +k=1 +x_0=16500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 17
    "EPSG:2331": "+proj=tmerc +lat_0=0 +lon_0=99 +k=1 +x_0=17500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 18
    "EPSG:2332": "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=18500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 19
    "EPSG:2333": "+proj=tmerc +lat_0=0 +lon_0=111 +k=1 +x_0=19500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 20
    "EPSG:2334": "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=20500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 21
    "EPSG:2335": "+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=21500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 22
    "EPSG:2336": "+proj=tmerc +lat_0=0 +lon_0=129 +k=1 +x_0=22500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
    //Xian 1980 / Gauss-Kruger zone 23
    "EPSG:2337": "+proj=tmerc +lat_0=0 +lon_0=135 +k=1 +x_0=23500000 +y_0=0 +ellps=IAU76 +units=m +no_defs +type=crs",
}

/**
 * 根据获取 epsg 获取 projection
 * @param epsg 如 EPSG:4490
 * @returns projection字符串
 */
export const getProjection = (epsg: string): string | undefined => {
    return projectionConfig[epsg];
}
