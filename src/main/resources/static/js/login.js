/**
 * 登录
 */
$(function () {
    //初始化账号密码
    $("#username").val("user");
    $("#password").val("123456");

    layui.use(['form', 'layer'], function () {
        var form = layui.form;
        var layer = layui.layer;
        form.on("submit(login)", function () {
            login();
            return false;
        });
        var path = window.location.href;
        if (path.indexOf("kickout") > 0) {
            layer.alert("您的账号已在别处登录；若不是您本人操作，请立即修改密码！", function () {
                window.location.href = "/login";
            });
        }
    })
});

function login() {
    var url = "/loginResource/login";
    var load = xtip.load();
    $.ajax({
        type: "POST",
        url: url,
        data: $("#useLogin").serialize(),
        success: function (data) {
            xtip.close(load);
            console.log(data);
            if (data.code !== 0) {
                setJsonCookie('user', data, 'h24');
                //window.location.href = "/jdbcReport/view/wlnSentJdbc";
                window.location.href = "/view?name=home";
            } else {
                layer.alert(data.message, function () {
                    layer.closeAll();//关闭所有弹框
                });
            }
        },
        error: function (e) {
            layer.alert(e.responseJSON.message, function () {
                layer.closeAll();//关闭所有弹框
            });
        }
    });
}