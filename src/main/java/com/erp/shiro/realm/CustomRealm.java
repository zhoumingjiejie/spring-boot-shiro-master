package com.erp.shiro.realm;

import com.erp.shiro.model.LoginDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;

/**
 * @author 0.0.0
 * @author 0.0.0
 * @ProjectName: [wln]
 * @Package: [cn.oz.fom.wln.shiro.CustomRealm]
 * @Description Realm：域，Shiro从Realm获取安全数据（如用户、角色、权限），就是说SecurityManager要验证用户身份，那么它需要从Realm获取相应的用户进行比较以确定用户身份是否合法；也需要从Realm得到用户相应的角色/权限进行验证用户是否能进行操作；可以把Realm看成DataSource，即安全数据源。
 * @Date 2020/3/6 14:42
 */
@Slf4j
public class CustomRealm extends AuthorizingRealm {

    /**
     * 授权
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principalCollection) {
        return new SimpleAuthorizationInfo();
    }

    /**
     * 认证
     *
     * @param authenticationToken token(来自主体Subject.login(token)提交时的token)
     * @return 用户认证信息
     * @throws AuthenticationException 认证异常
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
        //用于存放提交的登录信息
        UsernamePasswordToken token = (UsernamePasswordToken) authenticationToken;
        String username = token.getUsername();
        String password = String.valueOf(token.getPassword());

        if ("user".equals(username) && "123456".equals(password)) {
            log.debug("用户登录成功");
        } else {
            log.debug("用户认证失败：账号/密码——user/123456");
            return null;
        }
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setPassword(password);
        loginDTO.setUsername(username);

        //主体、散列凭证、凭证盐、域名
        return new SimpleAuthenticationInfo(loginDTO, password, getName());
        //return new SimpleAuthenticationInfo(principal, password, ByteSource.Util.bytes(credentialsSalt), realmName);
    }
}