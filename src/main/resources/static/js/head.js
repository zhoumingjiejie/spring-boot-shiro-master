/**
 * 菜单
 * */
//获取路径uri
var pathUri = window.location.href;
$(function () {
    layui.use('element', function () {
        var element = layui.element;
        //加载用户
        var userName = getJsonCookie('user').user.name;
        $("#userName").text(userName);
        // 左侧导航区域（可配合layui已有的垂直导航）
        //getMenus(getMenusData());
        element.render('nav');
    });
})
var getMenus = function (data) {
    //回显选中
    var ul = $("<ul class='layui-nav layui-nav-tree' lay-filter='test'></ul>");
    for (var i = 0; i < data.length; i++) {
        var node = data[i];
        console.log(node)
        var li = $("<li class='layui-nav-item' flag='" + node.id + "'></li>");
        var a = $("<a class='' href='javascript:;'>" + node.name + "</a>");
        li.append(a);
        //获取子节点
        var childArry = node.childrens;
        console.log(childArry);
        if (childArry.length > 0) {
            a.append("<span class='layui-nav-more'></span>");
            var dl = $("<dl class='layui-nav-child'></dl>");
            for (var y in childArry) {
                var dd = $("<dd><a href='" + childArry[y].url + "'>" + childArry[y].name + "</a></dd>");
                //判断选中状态
                if (pathUri.indexOf(childArry[y].url) > 0) {
                    li.addClass("layui-nav-itemed");
                    dd.addClass("layui-this")
                }
                dl.append(dd);
            }
            li.append(dl);
        }
        ul.append(li);
    }
    $(".layui-side-scroll").append(ul);
};

/**
 * 获取菜单数据
 * @returns {[]}
 */
function getMenusData() {
    var menusArr = [];

    //菜单1
    var menus1 = {id: 1, name: '订单管理', childrens: []};
    menus1.childrens.push({name: '未审核', url: '/view?path=/sales&name=/wlnSentJdbc'}, {
        name: '已审核',
        url: '/view?path=/sales&name=/wlnSentJdbc'
    });
    menusArr.push(menus1);

    return menusArr;
}

/**
 * 加载iframe
 * @param herf 加载地址
 */
function loadIframe(herf) {
    $("#iframeMain").attr("src", herf);
}