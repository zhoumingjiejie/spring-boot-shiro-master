var editIndex = undefined;

function endEditing() {
    if (editIndex === undefined) {
        return true
    }
    if ($('#etg').datagrid('validateRow', editIndex)) {
        $('#etg').datagrid('endEdit', editIndex);
        editIndex = undefined;
        return true;
    } else {
        return false;
    }
}

//拆单数据
var data = {};
var dataSize = 0;
var salesInfoItemData = [];
var salesInfoData = {};


/**
 * 保存订单明细数据
 */
function saveSalesErpItemInfo(data) {
    postType("/wln/saveSalesErpItemInfo", JSON.stringify(data), 'text', 'application/json');
    //关闭编辑窗口自动刷新订单明细数据
    $('#dialog_div').dialog('close');
    tableRowClick(-2, salesInfoRowData, true);
}

/**
 * 保存拆单数据
 */
function saveDecomposition(ids) {
    salesInfoItemData = salesInfoItemData.concat($('#etg').datagrid("getRows"));
    salesInfoData.orders = salesInfoItemData;
    //添加数据
    postType("/wln/decompositionOffline?ids=" + ids, JSON.stringify(salesInfoData), 'text', 'application/json', 'doSearch');
}

/**
 * 拆单操作
 */
function decomposition(type) {
    salesInfoData = deepClone(salesInfoRowData, salesInfoData);
    // 将 dataGrid 所有的行都结束编辑
    var endRows = $('#etg').datagrid("getRows");
    for (var i = 0; i < endRows.length; i++) {
        $('#etg').datagrid('endEdit', i);
    }
    if (dataSize > 0) {
        //等于1则分解线下单
        if (type === 'offline') {
            decompositionOffline();
        } else {
            decompositionOnline();
        }
    } else {
        alert('请勾选订单明细数据');
    }
}

/**
 * 拆线下单
 */
function decompositionOffline() {
    var rowDataArr = [];
    var regPos = /(^[1-9]\d*$)/; // 非负整数
    var isIntNum = true;
    var delIds = '';

    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            delIds += ',' + data[key].id;
            var rowData = deepClone(data[key]);
            data[key].show_data = false;
            salesInfoItemData.push(data[key]);
            var size = data[key].size;
            var splitString = data[key].split;
            splitString = splitString.replace("/，/g", ",");
            var splitArr = splitString.split(",");
            var splitSize = 0;
            for (var i = 0; i < splitArr.length; i++) {
                var number = splitArr[i];
                if (!regPos.test(number)) {
                    isIntNum = false;
                    break;
                }
                splitSize += parseInt(splitArr[i]);
                rowData.size = splitArr[i];
                rowData.tableNew = true;
                rowData.id = null;
                rowData.old_id = data[key].id;
                rowData.split = '';
                rowDataArr.push(rowData);
            }
            //判断是否是正整数
            if (!isIntNum) {
                alert('请输入正确正整数');
                break;
            }
            if (splitSize > size) {
                alert('拆分的数量大于总数量');
            } else {

                if (splitSize < size) {
                    var moreDate = {};
                    deepClone(rowData, moreDate);
                    moreDate.id = null;
                    moreDate.old_id = data[key].id;
                    moreDate.size = size - splitSize;
                    rowDataArr.push(moreDate);
                }
                //前端更新数据操作
                $('#etg').datagrid('deleteRow', key);
                $('#etg').datagrid('updateRow', key);
                this.addList($('#etg'), rowDataArr);
            }
        }
    }
    if (isIntNum) {
        delIds = delIds.substring(1);
        saveDecomposition(delIds);
        data = {};
    }
}

/**
 * 拆线上单
 */
function decompositionOnline() {
    var salesInfoItemArr = [];
    var delSalesInfoItemId = '';
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            var salesInfoItem = deepClone(data[key]);
            salesInfoItem.tableNew = true;
            delSalesInfoItemId += ',' + salesInfoItem.id;
            salesInfoItem.id = null;
            salesInfoItemArr.push(salesInfoItem);
        }
    }
    delSalesInfoItemId = delSalesInfoItemId.substring(1);
    if (delSalesInfoItemId === '') {
        alert('勾选数据为空，请刷新数据重新勾选');
        return;
    }
    salesInfoData.id = null;
    salesInfoData.tableNew = true;
    salesInfoData.orders = salesInfoItemArr;
    this.addList($('#pageTable'), salesInfoData);
    //添加数据
    postType("/wln/decompositionOnline?ids=" + delSalesInfoItemId, JSON.stringify(salesInfoData), 'text', 'application/json', 'doSearch');
    //删除数据
    //postType("/wln/deleteSalesErpItemInfo?ids=" + delSalesInfoItemId, {}, 'text', 'application/json', 'delete');

}

function postSearchResults(json, flag) {
    if (flag === 'doSearch') {
        //刷新数据
        $('#express_code').val(salesInfoRowData.express_code);
        $("#express_code").textbox('setValue', salesInfoRowData.express_code);
        //数据回显
        var allData = $('#pageTable').datagrid("getRows");
        for (var i = 0; i < allData.length; i++) {
            $('#pageTable').datagrid('unselectRow', i);
        }
        indexFlag = -1;
        tableRowClick(-2, salesInfoRowData);
        doSearch();
        data = {};
    }
    if (flag === 'delete') {
        //数据回显
        var allData = $('#pageTable').datagrid("getRows");
        for (var i = 0; i < allData.length; i++) {
            $('#pageTable').datagrid('unselectRow', i);
        }
        indexFlag = -1;
        tableRowClick(-2, salesInfoRowData);
    }
}

var oneIndexFlag = -1; //用于单选时判断是否取消勾选
/**
 *  表单行点击事件
 **/
function oneTableRowClick(rowIndex, rowData) {
    formData = {};
    deepClone(rowData, formData, true);
    if (oneIndexFlag === rowIndex) {
        $('#etg').datagrid('unselectRow', rowIndex); //去除选择
        oneIndexFlag = -1;
    } else {
        $('#etg').datagrid('unselectRow', oneIndexFlag); //去除上一个选择
        if (rowIndex !== -1) {
            oneIndexFlag = rowIndex;
        }
    }
    openDialog("salesErpItemInfoDialog");
}

/**
 * check勾选
 * @param index 下标
 * @param row 行数据
 */
function oneOnCheck(index, row) {
    data[index] = row;
    dataSize += 1;
}

/**
 * check不勾选
 * @param index 下标
 * @param row 行数据
 */
function oneOnUncheck(index, row) {
    delete data[index];
    dataSize -= 1;
}

/**
 * 行样式设置
 */
function oneRowStyler(index, row) {
    if (row.tableNew) {
        return 'background-color:#6293BB;color:#fff;';
    }
}

/**
 * 用户点击单元格触发
 **/
function onClickCell(index, field) {
    if (editIndex !== index) {
        if (endEditing()) {
            $('#etg').datagrid('selectRow', index)
                .datagrid('beginEdit', index);
            var ed = $('#etg').datagrid('getEditor', {index: index, field: field});
            if (ed) {
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            editIndex = index;
        } else {
            setTimeout(function () {
                $('#etg').datagrid('selectRow', editIndex);
            }, 0);
        }
    }
}

/**
 * 双击编辑
 *
 * @param index 下标
 * @param field 字段
 * @param value 值
 */
function onDblClickCell(index, field, value) {
    $('#etg').datagrid('beginEdit', index);
    var ed = $('#etg').datagrid('getEditor', {index: index, field: field});
    if (ed) {
        $(ed.target).focus();
    }
}

/**
 * 显示图片
 *
 * @param value 图片url
 * @param row 行数据
 * @param index 下标
 * @returns {string|null}
 */
function showPhoto(value, row, index) {
    if (typeof (value) != 'undefined' && value !== null && value.indexOf("http")) {
        value = window.location.protocol + "//" + window.location.host + "/" + value;
    }
    if (value) {
        return '<img onclick="dimgloadwin(' + value + ')"\n' +
            '                     style="display:block;margin:0 auto" onMouseOver="bigImg(this)" onMouseOut="closeImgWin()"\n' +
            '                     src="' + value + '" height="50" width="50"/>';
    } else {
        return null;
    }

}


//这里需要自己定义一个div   来创建一个easyui的弹窗展示图片  
function dimgloadwin(imgUrl) {
    var simg = imgUrl;
    $('#dahuikuimg').dialog({
        title: '预览',
        width: 800,
        height: 800,
        resizable: true,
        closed: false,
        cache: false,
        modal: true
    });
    $("#simg").attr("src", simg);
}

function bigImg(imgObj) {
    /**
     * dialog预览图片
     * @param imgObj img的jquery对象
     **/
    // 若imgObj为空或imgObj的[src]为【Þ】时，图片无法打开
    if ((imgObj === undefined || imgObj == null || imgObj.length === 0)
        || ($(imgObj).attr("src") === "" || /Þ$/i.test($(imgObj).attr("src")))) {
        $.messager.alert('提示', "该图片无法打开！");
        return;
    }
    var img = new Image();
    img.src = $(imgObj).attr("src");

    var imgWidth = "";
    var imgHeight = "";
    var imgProportion = "";
    // 当<img>的class中配置了"img-width-**px"或"img-height-**px"或"img-proportion-**%"时（仅支持整数），使用对应的图片大小
    var imgClassNames = $(imgObj).prop("class");
    if (imgClassNames != undefined && imgClassNames != "") {
        var imgClassNameArray = imgClassNames.split(" ");
        var imgClassName;
        for (var index in imgClassNameArray) {
            imgClassName = imgClassNameArray[index];
            // 图片宽度
            if (/^(img-width-\d+px)/i.test(imgClassName)) {
                imgWidth = imgClassName.substring(10, imgClassName.length - 2);

                // 图片高度
            } else if (/^(img-height-\d+px)/i.test(imgClassName)) {
                imgHeight = imgClassName.substring(11, imgClassName.length - 2);

                // 图片显示比例
            } else if (/^(img-proportion-\d+%)/i.test(imgClassName)) {
                imgProportion = imgClassName.substring(15, imgClassName.length);
            }
        }
    }
    // 显示宽度
    if (imgWidth != null && imgWidth != "") {
        img.width = imgWidth;
    }
    // 显示高度
    if (imgHeight != null && imgHeight != "") {
        img.height = imgHeight;
    }
    // 显示比例设置
    if (imgProportion != null && imgProportion != "") {
        img.width = img.width * parseFloat(imgProportion) / 100;
        img.height = img.height * parseFloat(imgProportion) / 100;
    }
    // 保持图片纵横比的情况下，取得能够在$(window)中放得下的大小
    var heightWidthPropor = img.height / img.width;
    var width = $(window).width() * 0.8 >= img.width ? img.width : $(window).width() * 0.8;
    var height;
    if ($(window).height() * 0.8 < width * heightWidthPropor) {
        height = $(window).height() * 0.8;
        width = height / heightWidthPropor;
    } else {
        height = width * heightWidthPropor;
    }

    // 防止因用户拖动边框而导致dialog宽高固定不变
    $("#dialog").parent().css("width", "auto");
    $("#dialog").parent().css("height", "auto");

    $("#img_id").css("height", height + "px");
    $("#img_id").css("max-height", height + "px");
    if (imgWidth != null && imgWidth != "") {
        $("#img_id").css("width", width + "px");
        $("#img_id").css("max-width", width + "px");
    }

    $("#dialog").css("width", width + "px");
    $("#dialog").css("height", height + 5 + "px");

    $("#img_id").css("overflow", "hidden");
    $("#img_id").attr('src', img.src);
    $("#dialog").window('center');
    // 解决关闭按钮位置问题
    $("div.panel-header.panel-header-noborder.window-header").css("width", "auto");
    $("#dialog").dialog("open");


}

function closeImgWin() {
    $("#dialog").dialog("close");
}