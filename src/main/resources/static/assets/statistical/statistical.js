/**
 * Created by 0.0.0 on 2019/8/19.
 */
//分页默认数据设置
var oz_pageSize = 50;
var oz_pageList = [50, 100, 500, 1000];
var oz_sort = '';

/**
 * 搜索类型
 * @type {{and: string, or: string, like: string, orLike: string, day: string, orDay: string, month: string, orMonth: string}}
 */
SearchType = {
    and: 'and',
    or: 'or',
    like: 'like',
    orLike: 'orLike',
    day: 'day',
    orDay: 'orDay',
    month: 'month',
    orMonth: 'orMonth',
    isNotEqual: 'isNotEqual',
    orIsNotEqual: 'orIsNotEqual',
    startTime: 'startTime',
    orStartTime: 'orStartTime',
    endTime: 'endTime',
    isNull: 'isNull',
    isNotNull: 'isNotNull'
};

/**
 * excel报表填写信息
 * @type {{fileName: string, cellCount: string, excelName: string, startRow: string, dataType: string}}
 */
ExcelInfo = {
    fileName: 'fileName',
    excelName: 'excelName',
    dataType: 'dataType',
    startRow: 'startRow',
    cellCount: 'cellCount'
};

/**
 * 返回请求的数据类型
 * @type {{normal: string, department: string}}
 */
DataType = {
    normal: 'normal',
    department: 'department'
};

ReportSearchData = {
    search: [],
    filterSort: []
};

/*--------------------------------初始化函数------------------------------*/
/**
 * 初始年月控件
 **/
function initAttYearMonth() {
    $('#attYearMonth').datebox({
        //显示日趋选择对象后再触发弹出月份层的事件，初始化时没有生成月份层
        onShowPanel: function () {
            //触发click事件弹出月份层
            span.trigger('click');
            if (!tds)
            //延时触发获取月份对象，因为上面的事件触发和对象生成有时间间隔
                setTimeout(function () {
                    tds = p.find('div.calendar-menu-month-inner td');
                    tds.click(function (e) {
                        //禁止冒泡执行easyui给月份绑定的事件
                        e.stopPropagation();
                        //得到年份
                        var year = /\d{4}/.exec(span.html())[0],
                            //月份
                            month = parseInt($(this).attr('abbr'), 10);

                        //隐藏日期对象
                        $('#attYearMonth').datebox('hidePanel')
                        //设置日期的值
                            .datebox('setValue', year + '-' + month);
                    });
                }, 0);
        },
        //配置parser，返回选择的日期
        parser: function (s) {
            if (!s) return new Date();
            var arr = s.split('-');
            return new Date(parseInt(arr[0], 10), parseInt(arr[1], 10) - 1, 1);
        },
        //配置formatter，只返回年月
        formatter: function (d) {
            var currentMonth = (d.getMonth() + 1);
            var currentMonthStr = currentMonth < 10 ? ('0' + currentMonth) : (currentMonth + '');
            return d.getFullYear() + '-' + currentMonthStr;
        }
    });

    //日期选择对象
    var p = $('#attYearMonth').datebox('panel'),
        //日期选择对象中月份
        tds = false,
        //显示月份层的触发控件
        span = p.find('span.calendar-text');
    var curr_time = new Date();

    //设置前当月
    $("#attYearMonth").datebox("setValue", curr_time.format("yyyy-MM"));
}

/**
 * 初始化排序
 *
 * @param table table元素
 * @param sortJson 排序sort映射表
 * @param defaultPrefix 默认字段前缀
 */
function initSort(table, sortJson, defaultPrefix) {
    var sortMapping = {};
    if (typeof (sortJson) !== 'undefined' && sortJson !== '') {
        sortMapping = sortJson;
    }
    table.datagrid({
        remoteSort: false,//是否从服务器排序数据
        onSortColumn: function (sort, order) {
            var sortToLine = sort.replace(/([A-Z])/g, "_$1").toLowerCase();
            var defaultPrefixSort = true;
            if (JSON.stringify(sortMapping) !== "{}") {
                if (typeof (sortMapping[sort]) !== 'undefined') {
                    defaultPrefixSort = false;
                    sortToLine = sortMapping[sort];
                }
            }
            if (defaultPrefixSort && typeof (defaultPrefix) !== 'undefined' && defaultPrefix !== '') {
                sortToLine = defaultPrefix + "." + sortToLine;
            }

            var sortData = "sort=" + sortToLine + "," + order;
            oz_sort = sortData;
            doSearch(sortData);
        }
    })
}

/**
 * 初始化form表单请求
 *
 * @param method 请求方式
 * @param action 请求地址
 */
function initForm(method, action) {
    var form = document.createElement('form');
    form.method = method;
    form.action = action;
    form.targer = '_blank';
    return form;
}

/*-----------------------------工具类函数-------------------------------*/
/**
 * 采用jquery easyui loading css效果
 * */
function ajaxLoading() {
    $("<div class=\"datagrid-mask\"></div>").css({
        display: "block",
        width: "100%",
        height: $(window).height()
    }).appendTo("body");
    $("<div class=\"datagrid-mask-msg\" style='height: 40px'>正在处理，请稍候。。。</div>")
        .appendTo("body")
        .css({
            display: "block",
            left: ($(document.body).outerWidth(true) - 190) / 2,
            top: ($(window).height() - 45) / 2
        });
}

function ajaxLoadEnd() {
    $(".datagrid-mask").remove();
    $(".datagrid-mask-msg").remove();
}

/**
 * 获取排序url
 *
 * @param url 基础url
 * @param sort  排序字段
 * @returns 排序url
 */
function getSortUrl(url, sort) {
    //排序
    if (typeof (sort) !== 'undefined' && sort !== '') {
        url = url + "?" + sort;
    } else {
        if (typeof (oz_sort) !== 'undefined' && oz_sort !== '') {
            url = url + "?" + oz_sort;
        }
    }
    return url;
}

/**
 * 时间控件参数
 *
 * @param format 日期格式
 * @returns {string}
 */
Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(),    //day
        "h+": this.getHours(),   //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
        "S": this.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
};

/**
 * 字段日期格式化
 * */
function formatDatebox(value) {
    if (value === null || value === '' || typeof value === 'undefined') {
        return '';
    }
    var dt;
    if (value instanceof Date) {
        dt = value;
    } else {

        dt = new Date(value);

    }
    return dt.format("yyyy-MM-dd hh:mm"); //扩展的Date的format方法(上述插件实现)
}

function formatDateYYYMMDD(value) {
    if (value === null || value === '' || typeof value === 'undefined') {
        return '';
    }
    var dt;
    if (value instanceof Date) {
        dt = value;
    } else {

        dt = new Date(value);

    }
    return dt.format("yyyy-MM-dd"); //扩展的Date的format方法(上述插件实现)
}

/**
 * 添加form表单数据
 *
 * @param name key
 * @param value value
 * @param form 表单
 */
function putFormData(name, value, form) {

    var inputData = document.createElement('input');
    inputData.type = 'hidden';
    inputData.name = name;
    inputData.value = value;
    if (form) {
        form.appendChild(inputData);
    }
    return inputData;
}

/**
 * 设置搜索数据
 *
 * @param field 字段名
 * @param value 值
 * @param type 类型（可选）
 * @returns {string}
 */
function setSearchData(field, value, type) {
    return JSON.stringify({"field": field, "value": value, "type": type});
}

/**
 * 设置导出查询数据
 *
 * @param field 字段名
 * @param value 值
 * @param type 类型（可选）
 */
function setExportData(field, value, type) {
    return setSearchData(field, value, type);
}

/**
 * 导出excel
 *
 * @param action 请求动作
 * @param data 请求数据
 * @param type 类型
 * @param excelInfo excel信息
 */
function exportExcel(action, data, excelInfo, type) {
    var url = contextPath + getSortUrl(action, '');
    var form = initForm('post', url);
    var typeData = type || '';
    if (data instanceof Array) {
        putFormData('search', '[' + data + ']', form);
    } else {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                putFormData(key, '[' + data[key] + ']', form);
            }
        }
    }
    //报表信息
    if (typeof (excelInfo) !== 'undefined') {
        for (var excelKey in excelInfo) {
            if (excelInfo.hasOwnProperty(excelKey)) {
                putFormData(excelKey, excelInfo[excelKey], form);
            }
        }
    }
    //导出全部
    putFormData('type', typeData, form);
    putFormData('size', 1, form);
    document.body.appendChild(form);
    form.submit();
}

/**
 * combobox控件加载成功设置默认值。默认设置id【combobox】生效，value字段是id
 */
function comboboxLoadSuccess() {
    var data = $('#combobox').combobox('getData');
    if (data.length > 0) {
        $("#combobox").combobox('select', data[0].id);
    }
}

//比较两个时间  time1，time2均为日期类型
//判断两个时间段是否相差 m 个月
function completeDate(time1, time2, m) {
    var diffyear = time2.getFullYear() - time1.getFullYear();
    var diffmonth = diffyear * 12 + time2.getMonth() - time1.getMonth();
    if (diffmonth < 0) {
        return false;
    }

    var diffDay = time2.getDate() - time1.getDate();

    if (diffmonth < m || (diffmonth === m && diffDay <= 0)) {

        if (diffmonth === m && diffDay === 0) {
            var timeA = time1.getHours() * 3600 + 60 * time1.getMinutes() + time1.getSeconds();
            var timeB = time2.getHours() * 3600 + 60 * time2.getMinutes() + time2.getSeconds();
            if (timeB - timeA > 0) {
                return false;
            }
        }
        return true;
    }
    return false;
}

/**
 * 深度克隆
 * @param origin 源数据
 * @param target 目标数据
 * @param replace 是否替换目标属性，默认false不替换
 * @returns {*|{}}
 */
function deepClone(origin, target, replace) {
    replace = replace || false;
    target = target || {};//以防用户没传，默认是对象
    for (var prop in origin) {
        if (origin.hasOwnProperty(prop) && origin[prop] !== null && typeof (origin[prop]) == 'object') {    //判断是不是原始值
            //在不是原始值的情况下，判断是数组还是对象
            target[prop] = Object.prototype.toString.call(origin[prop]) === '[object Array]' ? [] : {};
            this.deepClone(origin[prop], target[prop]);

        } else {
            if (replace) {
                target[prop] = origin[prop];
            } else {
                if (target[prop] === null || typeof (target[prop]) === 'undefined') {
                    target[prop] = origin[prop];
                }
            }
        }
    }
    return target;
}

function isIntNum(val) {
    var regPos = / ^\d+$/; // 非负整数
    var regNeg = /^\-[1-9][0-9]*$/; // 负整数
    return !!(regPos.test(val) || regNeg.test(val));
}


/**
 * 添加数据
 * @param tableEle table元素
 * @param rowData 行数据
 */
function addList(tableEle, rowData) {
    if (rowData instanceof Array) {
        for (var i = 0; i < rowData.length; i++) {
            tableEle.datagrid('appendRow', rowData[i]);
        }
    } else {
        tableEle.datagrid('appendRow', rowData);
    }
}

/*------------------------------- -----本地分页排序处理函数-------------------------------------*/

/**
 * 加载表单数据
 **/
function loadData(data, usePagination) {
    if (!usePagination) {
        usePagination = true;  //如果没传是否分页，就默认分页
    }

    $("#etg").datagrid({
        rownumbers: true,
        fitColumns: true,
        pagination: usePagination,
        remoteSort: false,   //设置为本地排序
        onClickRow: oneTableRowClick,
        onCheck: oneOnCheck,
        onUncheck: oneOnUncheck,
        onCheckAll: oneOnCheckAll,
        onUncheckAll: oneOnUncheckAll,
        rowStyler: oneRowStyler,
        onAfterEdit: oneOnAfterEdit,
        data: data.slice(0, oz_pageSize)
    });

    $("#etg").datagrid("getPager").pagination({
        total: data.length,
        showRefresh: false,
        pageSize: oz_pageSize,
        pageList: oz_pageList,
        onSelectPage: function (pageNo, pageSize) {
            oz_pageSize = pageSize;
            setPage(data, pageNo, pageSize);
        }
    });
}

/**
 * 表单行点击事件
 */
function oneTableRowClick(rowIndex, rowData, value) {

}

/**
 * check勾选
 * @param index 下标
 * @param row 行数据
 */
function oneOnCheck(index, row) {
    console.log('勾选');
}

/**
 * check不勾选
 * @param index 下标
 * @param row 行数据
 */
function oneOnUncheck(index, row) {
    console.log('不勾选');
}

/**
 * 全选
 * @param rows 选择的数据
 */
function oneOnCheckAll(rows) {
}

/**
 * 取消全选
 * @param rows 取消的数据
 */
function oneOnUncheckAll(rows) {
}

/**
 * 行样式设置
 */
function oneRowStyler(index, row) {
}

/**
 * 当用户完成编辑一行时触发
 * @param rowIndex 编辑行的索引
 * @param rowData 编辑行对应的记录
 * @param changes 更改的字段/值对
 */
function oneOnAfterEdit(rowIndex, rowData, changes) {
}


/**
 * 刷新页面数据
 * @param data 数据
 * @param pageNo 页码
 * @param pageSize 页码大小
 */
function setPage(data, pageNo, pageSize) {
    var start = (pageNo - 1) * pageSize;
    var end = start + pageSize;
    $("#etg").datagrid("loadData", data.slice(start, end));
    $("#etg").datagrid("getPager").pagination('refresh', {
        total: data.length,
        pageNumber: pageNo
    });
}

/**
 * post 搜索
 *
 * @param url 请求地址
 * @param data 请求数据
 * @param sort 排序条件
 * @param type 数据类型
 * @param loadDataBl<boolean> 默认加载。true获取返回数据
 */
function postSearch(url, data, sort, type, loadDataBl, methodName, parameter) {
    var jsonData = {};
    jsonData.type = type || '';
    if (data instanceof Array) {
        jsonData.search = '[' + data.toString() + ']';
    } else {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                jsonData[key] = '[' + data[key] + ']';
            }
        }
    }
    for (var k in parameter) {
        if (parameter.hasOwnProperty(k)) {
            jsonData[k] = parameter[k];
        }
    }
    //获取全部数据
    jsonData.size = 1;
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: getSortUrl(url, sort),
        data: jsonData,
        beforeSend: ajaxLoading,
        success: function (json) {
            ajaxLoadEnd();
            if (loadDataBl) {
                if (methodName) {
                    //方法调用
                    eval(methodName + "(json)");
                } else {
                    postSearchResults(json);
                }
            } else {
                loadData(json);
            }
        }
    });
}

/**
 * 普通的post请求
 *
 * @param url 地址
 * @param jsonData 请求数据
 * @param methodName 方法名
 */
function postJson(url, jsonData, methodName) {
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: url,
        data: jsonData,
        beforeSend: ajaxLoading,
        success: function (json) {
            ajaxLoadEnd();
            if (methodName) {
                eval(methodName + "(json)")
            }
        },
        error: function (e) {
            ajaxLoadEnd();
            alert(e.responseJSON.message);
        }
    });
}

/**
 * post请求，默认加载easyUi数据
 * @param url 地址
 * @param jsonData 请求数据
 * @param usePagination 是否使用分页
 */
function post(url, jsonData, usePagination) {
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: url,
        data: jsonData,
        beforeSend: ajaxLoading,
        success: function (json) {
            ajaxLoadEnd();
            loadData(json, usePagination);
        }
    });
}

/**
 *  payRequest 请求（对接后端接收对象时使用）
 *
 * @param url 地址
 * @param jsonData 请求数据
 * @param type 数据类型
 * @param contentType 内容类型
 * @param methodName 方法名
 */
function postType(url, jsonData, type, contentType, methodName) {
    type = type || 'json';
    contentType = contentType || 'application/json';
    $.ajax({
        type: 'POST',
        dataType: type,
        contentType: contentType,
        async: false,
        url: url,
        data: jsonData,
        beforeSend: ajaxLoading,
        success: function (json) {
            ajaxLoadEnd();
            if (methodName) {
                //自定义方法回调
                eval(methodName + "(json)");
            } else {
                //默认回调方法
                postSearchResults(json, methodName);
            }
        },
        error: function (e) {
            ajaxLoadEnd();
            alert(e.responseJSON.message);
        }
    });
}

/*-------------------------------------服务器分页排序处理函数-----------------------------------*/
/**
 * 刷新页面数据
 *
 * @param result 数据
 * @param url url
 * @param searchData 搜索条件
 * @param sort 排序
 * @param pageNo 页码
 * @param pageSize 页数大小
 */
function refreshPageDate(result, url, searchData, sort, pageNo, pageSize, type) {

    $("#pageTable").datagrid({
        rownumbers: true,
        fitColumns: true,
        pagination: true,
        striped: true,
        //singleSelect:true,
        onClickRow: tableRowClick,
        onCheck: onCheck,
        onUncheck: onUncheck,
        onCheckAll: onCheckAll,
        onUncheckAll: onUncheckAll,
        rowStyler: rowStyler,
        data: result.result.fileList
    });

    $("#pageTable").datagrid("getPager").pagination({
        total: result.result.totalCount,
        showRefresh: true,
        pageSize: oz_pageSize,
        pageList: oz_pageList,
        onSelectPage: function (pageNo, pageSize) {
            oz_pageSize = pageSize;
            postPageSearch(url, searchData, sort, pageNo, pageSize, type);
        }
    });

    //$("#pageTable").datagrid("loadData", result.result.fileList);
    $("#pageTable").datagrid("getPager").pagination('refresh', {
        total: result.result.totalCount,
        pageNumber: pageNo
    });
}

/**
 * 表单行点击事件
 */
function tableRowClick(rowIndex, rowData, value) {

}

/**
 * check勾选
 * @param index 下标
 * @param row 行数据
 */
function onCheck(index, row) {
    console.log('勾选');
}

/**
 * check不勾选
 * @param index 下标
 * @param row 行数据
 */
function onUncheck(index, row) {
    console.log('不勾选');
}

/**
 * 全选
 * @param rows 选择的数据
 */
function onCheckAll(rows) {
}

/**
 * 取消全选
 * @param rows 取消的数据
 */
function onUncheckAll(rows) {
}

/**
 * 行样式设置
 */
function rowStyler(index, row) {
}

/**
 * post 分页搜索
 *
 * @param url 请求地址
 * @param searchData 请求数据
 * @param sort 排序url参数
 * @param pageNo 页码
 * @param pageSize 页码大小
 */
function postPageSearch(url, searchData, sort, pageNo, pageSize, type) {
    var jsonData = {};
    //分页
    jsonData.page = pageNo || 1;
    jsonData.size = pageSize || oz_pageSize;
    jsonData.type = type || '';

    if (searchData instanceof Array) {
        jsonData.search = '[' + searchData.toString() + ']';
    } else {
        for (var key in searchData) {
            if (searchData.hasOwnProperty(key)) {
                jsonData[key] = '[' + searchData[key] + ']';
            }
        }
    }

    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: getSortUrl(url, sort),
        data: jsonData,
        beforeSend: ajaxLoading,
        success: function (resultData) {
            ajaxLoadEnd();
            refreshPageDate(resultData, url, searchData, sort, pageNo, pageSize, type);
        }
    });
}