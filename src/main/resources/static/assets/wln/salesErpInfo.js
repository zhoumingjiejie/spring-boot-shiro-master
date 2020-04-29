//合单数据
var salesErpInfoData = {};
var salesErpInfoMethod = "saveSalesErpInfo";
//生成生产单数据
var factoryOrder = {};
var factoryOrderJson = {};

/**
 * 页面加载初始化
 */
$(function () {
    //默认点击按钮加载前一天数据
    oz_sort = "sort=create_time,desc";
    //doSearch(oz_sort);
    //排序初始化
    initSort($('#pageTable'), {});
});

/**
 * 搜索按钮监听
 */
function doSearch(sort) {
    var erpStatus = document.getElementById('dataBox').innerHTML;
    var buttonID;
    var data = getDataArr();
    if (erpStatus) {
        //已审核参数
        buttonID = "unchecked";
        data.push(setSearchData("erp_status", '已审核'));
    } else {
        //未审核查询参数
        buttonID = "checked";
        data.push(setSearchData("erp_status", null, SearchType.isNull));
        data.push(setSearchData("erp_status", '已审核', SearchType.orIsNotEqual));
    }
    document.getElementById(buttonID).style.display = "none";
    oz_sort = "sort=create_time,desc";
    postPageSearch("/jdbcReport/page/getSalesErpInfo", data, sort, null, 50, "wln");
    xtip.closeAll();
}

function getDataArr() {
    var tp_tid = $('#tp_tid').val();
    var express_code = $('#express_code').val();
    var trade_no = $('#trade_no').val();
    var buyer_account = $('#buyer_account').val();
    var phone = $('#phone').val();

    var data = [];
    data.push(setSearchData("tp_tid", tp_tid, SearchType.like));
    data.push(setSearchData("express_code", express_code, SearchType.like));
    data.push(setSearchData("trade_no", trade_no, SearchType.like));
    data.push(setSearchData("buyer_account", buyer_account, SearchType.like));
    data.push(setSearchData("phone", phone, SearchType.like));
    return data;
}

var indexFlag = -1; //用于单选时判断是否取消勾选

/**
 *  表单行点击事件
 **/
function tableRowClick(rowIndex, rowData, loadBl) {
    salesInfoRowIndex = rowIndex;
    salesInfoRowData = {};
    deepClone(rowData, salesInfoRowData, true);
    if (indexFlag === rowIndex && !loadBl) {
        $('#pageTable').datagrid('unselectRow', rowIndex); //去除选择
        indexFlag = -1;
    } else {
        oz_sort = "";
        var data = [];
        if (rowData.tp_tid !== null && rowData.tp_tid !== '' && typeof (rowData.tp_tid) !== 'undefined') {
            data.push(setSearchData("tp_tid", rowData.tp_tid));
            postSearch("/jdbcReport/list/getSalesErpItemInfo", data, oz_sort, "wln");
            $('#pageTable').datagrid('unselectRow', indexFlag); //去除上一个选择
            if (rowIndex !== -1) {
                indexFlag = rowIndex;
            }
        } else {
            xtip.msg('线上订单号为空', {icon: 'e'});
        }
    }
}

/**
 * check勾选
 * @param index 下标
 * @param row 行数据
 */
function onCheck(index, row) {
    salesErpInfoData[index] = row;
}

/**
 * check不勾选
 * @param index 下标
 * @param row 行数据
 */
function onUncheck(index, row) {
    delete salesErpInfoData[index];
}

/**
 * 行样式设置
 */
function rowStyler(index, row) {
    if (row.tableNew) {
        return 'background-color:#6293BB;color:#fff;';
    }
}

/**
 * 编辑表单
 * @param methodName 保存按钮回调方法名
 */
function editorSalesErpInfo(methodName) {
    if (salesErpInfoData == null || JSON.stringify(salesErpInfoData) === "{}") {
        alert("请选择勾选数据");
        return;
    }
    salesErpInfoMethod = methodName;
    openDialog("salesErpInfoDialog");
}

/**
 * 保存合单数据
 */
function saveMerge(salesErpInfoDataJson) {
    var ids = '';
    for (var value in salesErpInfoData) {
        if (salesErpInfoData.hasOwnProperty(value)) {
            var data = salesErpInfoData[value];
            ids = ids + "," + data.id;
        }
        //break;
    }
    ids = ids.substring(1);
    postType("/wln/saveMerge?ids=" + ids, JSON.stringify(salesErpInfoDataJson), "text", "application/json");
    doSearch(oz_sort);
    $('#dialog_div').dialog('close');
    salesErpInfoData = {};
}

/**
 * 保存数据
 * @param data 修改后的数据
 */
function saveSalesErpInfo(data) {
    postType("/wln/saveSalesErpInfo", JSON.stringify(data), "text", "application/json");
    doSearch(oz_sort);
    $('#dialog_div').dialog('close');
}

var startTime = new Date().getTime();

/**
 * 更新订单erp_status审核状态
 */
function updateErpStatus(status) {
    status = status || '已审核';
    var endTime = new Date().getTime();
    if (endTime - startTime > 3000) {
        startTime = new Date().getTime();
        xtip.load();
        var data = [];
        for (var key in salesErpInfoData) {
            if (salesErpInfoData.hasOwnProperty(key)) {
                data.push(setSearchData("id", salesErpInfoData[key].id, SearchType.or));
            }
        }
        var jsonData = {};
        jsonData.status = status;
        postSearch("/wln/updateErpStatus", data, '', '', true, '', jsonData);
        doSearch(oz_sort);
    }
}

/**
 * 生成生产单
 */
function saveFactory() {
    factoryOrder = {};
    factoryOrderJson = {};
    if (salesErpInfoData == null || JSON.stringify(salesErpInfoData) === "{}") {
        alert("请选择勾选一条数据");
        return;
    }
    var searchData = [];
    var type = "";
    //检查订单商品分类是否一致
    for (var key in salesErpInfoData) {
        if (salesErpInfoData.hasOwnProperty(key)) {
            var data = salesErpInfoData[key];
            factoryOrderJson[data.tp_tid] = data;
            if (typeof (data.type) === 'undefined' || data.type === '' || data.type === null || data.type === '杂') {
                alert('商品分类未知');
                return;
            }
            //商品分类是否一致
            if (type === '') {
                searchData.push(setSearchData("tp_tid", data.tp_tid, SearchType.and));
                type = data.type;
            } else {
                searchData.push(setSearchData("tp_tid", data.tp_tid, SearchType.or));
                if (type !== data.type) {
                    alert('商品分类不一致');
                    return;
                }
            }
        }
    }
    factoryOrder.type = type;
    factoryOrder.orderInfos = [];

    //获取订单明细数据
    postSearch("/jdbcReport/list/getSalesErpItemInfo", searchData, 'tp_tid', "wln", true, 'salesErpItemInfoResults');
}

/**
 * 获取返回的订单明细数据
 * @param json 数据
 */
function salesErpItemInfoResults(json) {
    var tpTidMapIndex = {};
    //订单明细数据合并，统计总件数
    for (var key in json) {
        if (json.hasOwnProperty(key)) {
            var data = json[key];
            var tp_tid = data.tp_tid;
            //销售订单主表数据
            var factoryOrderData = factoryOrderJson[data.tp_tid];

            if (!tpTidMapIndex.hasOwnProperty(tp_tid)) {
                var size = factoryOrder.orderInfos.length;
                tpTidMapIndex[tp_tid] = size;
                factoryOrder.orderInfos[size] = {
                    totalCount: 0,
                    pressingCount: 0,
                    pureCount: 0,
                    storeNo: factoryOrderData.shop_id,
                    //orderNo: '75331424935116',//线上订单号-订单号
                    orderNo: tp_tid,
                    type: data.type,
                    style: data.style
                };
            }

            var index = tpTidMapIndex[data.tp_tid];
            var orderInfo = factoryOrder.orderInfos[index];
            orderInfo.totalCount = parseInt(orderInfo.totalCount) + parseInt(data.size);
            orderInfo.pressingCount = parseInt(orderInfo.pressingCount) + parseInt(data.pressing_count);
            orderInfo.pureCount = parseInt(orderInfo.pureCount) + parseInt(data.pure_count);
            if (orderInfo.type !== data.type || orderInfo.style !== data.style) {
                alert('商品分类或商品编码不一致');
                return;
            }
        }
    }
    var payloadData = {};
    payloadData.url = "fom/factoryOrder/saveFactoryOrder";
    payloadData.requestBody = JSON.stringify(factoryOrder);
    var userCookie = getJsonCookie('user');
    if (userCookie == null || typeof (userCookie) == 'undefined') {
        xtip.msg('获取用户信息失败', {icon: 'e'});
        return;
    }
    payloadData.userId = userCookie.user.id;
    postJson("/oaApi/payload", payloadData, 'payLoadResult');
}

/**
 * 返回生成生产单请求结果
 * @param json
 */
function payLoadResult(json) {
    if (json.status !== 200) {
        xtip.msg("生产生产单失败：" + json.message);
        return;
    }
    //更新销售订单状态
    updateErpStatus('已完成');
    //打印生产单
    printFactoryOrder();
    //打印小票
    printXp(json.result);
}

/**
 * 打印小票
 * @param data
 */
function printXp(data) {
    //打印机名字
    var printer = "星辰小票-RICOH Aficio MP 2851";

    var type = data.type;

    var printData = {};
    printData.documentID = new Date().getTime();
    printData.contents = [];
    //小票
    var content = {};
    content.templateURL = 'http://cloudprint.cainiao.com/template/standard/325567/6';
    content.data = {};
    content.data.type = type;
    content.data.order_no = data.orderNo;
    content.data.creator = data.creator;
    content.data.create_date = data.createDate;
    content.data.total_count = data.totalCount;
    content.data.real_count = data.realCount;
    //2D数据默认为空
    if (type.toUpperCase() === '3D') {
        content.data.cloth = data.goods.cloth;
        content.data.name = '(' + data.goods.goodsNo + "-" + data.goods.name + ")";
    }
    //快递单总数
    var set = new Set();
    var orderItem = data.items;
    if (orderItem instanceof Array) {
        for (var i = 0; i < orderItem.length; i++) {
            var orderItemData = orderItem[i];
            set.add(orderItemData.orderId);
        }
    }
    content.data.order_count = set.size;
    printData.contents.push(content);
    //调用子窗口方法，预览打印
    //dialogPrint("setPrintData", printData);
    //直接打印
    startPrint(printData, printer);
}

/**
 * 打印生产单
 */
function printFactoryOrder() {
    var data = [];
    var type = SearchType.and;
    if (salesErpInfoData == null || JSON.stringify(salesErpInfoData) === "{}") {
        alert("请选择勾选数据");
        return;
    }
    for (var key in salesErpInfoData) {
        if (salesErpInfoData.hasOwnProperty(key)) {
            data.push(setSearchData("id", salesErpInfoData[key].id, type));
            type = SearchType.or;
        }
    }
    postSearch("/jdbcReport/list/getPrintData", data, "", "print", true, "doPrintFactoryOrder");
}

/**
 * 请求后设置打印机数据
 *
 * @param result 返回结果
 */
function doPrintFactoryOrder(result) {
    //调用子窗口方法，预览打印
    //dialogPrint("setPrintData", result[0]);
    //直接打印
    startPrint(result[0]);
}