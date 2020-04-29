package com.erp.shiro.model;

import lombok.Data;

/**
 * @author 0.0.0
 * @ProjectName: [wln]
 * @Package: [cn.oz.fom.wln.object.LoginDTO]
 * @Description 登录对象
 * @Date 2020/3/9 16:48
 */
@Data
public class LoginDTO {
    private String username;

    private String password;

    private String rememberMe;
}
