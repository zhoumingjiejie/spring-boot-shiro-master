var socket;
var previewImage = [];
var methods = "loadPreviewImage";
var initPrints = true;
var linkNumber = 0;
doConnect();

/**
 * 连接打印客户端
 */
function doConnect() {
    socket = new WebSocket('ws://localhost:13528');
    //如果是https的话，端口是13529
    //socket = new WebSocket('wss://localhost:13529');
    // 打开Socket
    socket.onopen = function (event) {
        console.log('打开Socket：', event);
        // 监听消息
        socket.onmessage = function (event) {
            console.log('Client received a message', event);
            if (methods !== '') {
                window[methods](event);
                methods = '';
            }
            if (initPrints) {
                //初始化打印机列表
                doGetPrinters();
                initPrints = false;
            }
        };
        // 监听Socket的关闭
        socket.onclose = function (event) {
            console.log('Client notified socket has closed', event);
        };
        // 监听Socket的错误信息
        socket.onerror = function (event) {
            console.log('Client notified socket has error', event);
        }
    };
}

/**
 * 获取打印机列表
 */
function doGetPrinters() {
    methods = "loadPrints";
    send(getRequestObject("getPrinters"));
}

/**
 * 获取请求的UUID，指定长度和进制,如
 * getUUID(8, 2)   //"01001010" 8 character (base=2)
 * getUUID(8, 10) // "47473046" 8 character ID (base=10)
 * getUUID(8, 16) // "098F4D35"。 8 character ID (base=16)
 *
 * @param len 长度
 * @param radix 进制
 * @returns {string} uuid
 */
function getUUID(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;
    if (len) {
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        var r;
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }
    return uuid.join('');
}

/***
 * 构造request对象
 */
function getRequestObject(cmd) {
    var request = {};
    request.requestID = getUUID(8, 16);
    request.version = "1.0";
    request.cmd = cmd;
    return request;
}

/**
 * 打印电子面单
 * preview ture：预览；false：打印
 * documents 要打印的电子面单的数组
 */
function doPrint(preview) {
    var documents = getDocuments();
    if (documents === null || typeof (documents) === 'undefined') {
        alert("打印数据为空");
    }
    methods = "loadPreviewImage";
    var printer = $('#prints option:selected').val();
    var request = getRequestObject("print");
    request.task = {};
    request.task.taskID = getUUID(8, 10);
    request.task.preview = preview || false;
    request.task.printer = printer || '';
    request.task.previewType = 'image';
    request.task.firstDocumentNumber = 10;
    request.task.totalDocumentCount = 100;
    request.task.documents = [];
    request.task.documents.push(documents);
    console.log(request);
    send(request);
}

/**
 * 打印操作
 *
 * @param documents 打印数据
 * @param printer 打印机名字（默认：默认打印机）
 */
function startPrint(documents, printer) {
    console.log('调用打印机：'.concat(printer));
    methods = "loadPreviewImage";
    var request = getRequestObject("print");
    request.task = {};
    request.task.taskID = getUUID(8, 10);
    request.task.preview = false;
    request.task.printer = printer || '';
    request.task.previewType = 'image';
    request.task.firstDocumentNumber = 10;
    request.task.totalDocumentCount = 100;
    request.task.documents = [];
    request.task.documents.push(documents);
    console.log(request);
    send(request);
}

/**
 * 发送打印请求
 * @param data 请求数据
 */
function send(data) {
    if (socket.readyState === 1) {
        linkNumber = 0;
        socket.send(JSON.stringify(data));
    } else {
        console.log('正在努力连接打印机……');
        if (linkNumber < 3) {
            setTimeout(function () {
                linkNumber = linkNumber + 1;
                return send(data);
            }, "1000");
        } else {
            xtip.confirm('<div style="font-size: 13px; margin-top: 5px;"><div style="font-size:14px;font-weight:bold;">抱歉，菜鸟打印组件连接失败了<img src="https://herp.oss-cn-hangzhou.aliyuncs.com/static/images/print/49.gif"></div><div style="padding-top:8px">您是否已经安装打印组件？<br><ul style="list-style-type:disc;margin-left:20px;line-height:25px;margin-top:5px;"><li style="list-style-type:disc;">若还未安装，请<a href="javascript:window.open(\'https://cloudprint.cainiao.com/cloudprint/client/CNPrintSetup.exe\')">点此下载安装</a>。安装完成后需要刷新页面才能使用。</li><li style="list-style-type:disc;">已经安装的，请先确认组件已经打开并正常运行：</li></ul><div style="margin-left:25px;">1.重启组件后再次尝试<br></div></div></div>', '', {
                icon: 'w',
                btn: ['关闭']
            });
        }
    }
}

/**
 * 预览数据
 */
function loadPreviewImage(event) {
    var data = JSON.parse(event.data);
    if (data.status === 'failed') {
        alert('预览失败：' + data.msg);
        return;
    }
    if (data.status === 'success' && typeof (data.previewImage) !== 'undefined' && data.previewImage !== null) {
        previewImage = data.previewImage;
        ImagePreview.load(previewImage);
    }
}

/**
 * 获取打印机列表结果
 * @param event
 */
function loadPrints(event) {
    var data = JSON.parse(event.data);
    if (data.status === 'failed') {
        alert('获取打印机列表失败：' + data.msg);
        return;
    }
    if (data.status === 'success' && typeof (data.printers) !== 'undefined' && data.printers !== null) {
        var select = document.getElementById("prints");
        while (select.hasChildNodes()) {
            select.removeChild(select.firstChild);
        }
        select.options.add(new Option("默认", ""));
        var prints = data.printers;
        for (var i = 0; i < prints.length; i++) {
            select.options.add(new Option(prints[i].name, prints[i].name));
        }
    }
}

/**
 * 文档数据，后台传输获取
 */
function getDocuments2() {
    var data = {};
    data.documentID = new Date().getTime();
    data.contents = [];

    //销售单商品明细
    var content1 = {};
    content1.data = {};
    content1.data.value = '加急单';
    content1.data.code = '295273881882';
    content1.data.pay_date = '2020-01-10 13:18:27';
    content1.data.print_date = '2020-01-10 13:18:27';
    content1.data.remark = '顺丰标快，合并订单';
    content1.data.shop_name = '革命军零售-30201-旗舰店-29队-田旭';
    content1.data.name = '关小娟';
    content1.data.phone = '18523110887';
    content1.data.pay_name = '系统管理员';
    content1.data.specifications1 = 'V02836【薄款】，M[170【130-150斤】]';
    content1.data.number1 = '2';
    //content1.templateURL = 'http://127.0.0.1:8090/getTemplates/sales';
    content1.templateURL = 'http://cloudprint.cainiao.com/template/standard/325163/16';

    //小票
    var content2 = {};
    content2.data = {};
    content2.data.cloth = '日本卫衣';
    content2.data.type = '3D';
    content2.data.name = 'YH03-3D带帽';
    content2.data.bar_code = '1331912310002';
    content2.data.author = '系统管理员';
    content2.data.date = '2019-12-31 10:51';
    content2.data.total_count = '1';
    content2.data.order_count = '1';
    content2.templateURL = 'http://cloudprint.cainiao.com/template/standard/325567/5';

    var printData = $('#printData option:selected').val();
    if (parseInt(printData)) {
        data.contents.push(content2);
    } else {
        data.contents.push(content1);
    }
    return data;
}

/**
 * 实时预览数据
 */
$(document).ready(function () {
    $('#printData').change(function () {
        doPrint(true);
    });
});