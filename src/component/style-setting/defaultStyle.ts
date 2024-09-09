export const defaultStyles = [
    {
        name: "默认样式",
        style: {
        }
    },
    {
        name: "半透明",
        style: {
            color: "color('white', 0.5)",
        }
    },
    {
        name: "按高度",
        style: {
            color: {
                conditions: [
                    ["${height} >= 300", "color('purple', 0.5)"],
                    ["${height} >= 200", "color('red')"],
                    ["${height} >= 100", "color('blue')"],
                    ["true", "color('yellow')"]
                ]
            },
        }
    },
    {
        name: "点云按高度",
        style: {
            color: {
                conditions: [
                    ["${Height} >= 300", "color('purple', 0.5)"],
                    ["${Height} >= 200", "color('red')"],
                    ["${Height} >= 100", "color('blue')"],
                    ["true", "color('yellow')"]
                ]
            },
            pointSize: "5.0",
        }
    },
    {
        name: '点云按属性',
        style: {
            "color": {
                "conditions": [
                    ["(${Classification} >= 4) && (${Classification} < 5) ", "color('#DC143C')"],
                    ["(${Classification} >= 7) && (${Classification} < 8)  ", "color('#7B68EE')"],
                    ["(${Classification} >= 16) && (${Classification} < 17)  ", "color('#00CED1')"],
                    ["(${Classification} >= 17) && (${Classification} < 18)  ", "color('#3CB371')"],
                    ["(${Classification} >= 18) && (${Classification} < 19)  ", "color('#FFFF00')"],
                    ["(${Classification} >= 19) && (${Classification} < 20)  ", "color('#FFA500')"],
                    ["(${Classification} >= 20) && (${Classification} < 21)  ", "color('#FF6347')"]
                ]
            },
            "pointSize": "3.0"
        }
    }
]