package com.erp.shiro.resource;

import com.erp.shiro.model.LoginDTO;
import com.erp.shiro.utils.RedisUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.DisabledAccountException;
import org.apache.shiro.authc.UnknownAccountException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.subject.Subject;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by zmj
 * On 2020/3/2.
 *
 * @author 0.0.0
 */
@Slf4j
@Controller
@RequestMapping("loginResource")
@SuppressWarnings("unused")
public class LoginResource {
    /**
     * 登录
     *
     * @param loginDTO 登陆对象
     */
    @RequestMapping("login")
    @ResponseBody
    public Map<String, Object> login(LoginDTO loginDTO, HttpServletRequest request) {
        Map<String, Object> data = new HashMap<>();
        String userName = loginDTO.getUsername();
        //获取token
        UsernamePasswordToken usernamePasswordToken = new UsernamePasswordToken(
                loginDTO.getUsername().trim(), loginDTO.getPassword().trim(), request.getRemoteAddr());

        // 设置 remenmberMe 的功能
        String rememberMe = loginDTO.getRememberMe();
        usernamePasswordToken.setRememberMe("on".equals(rememberMe));

        //使用shiro登录
        Subject subject = SecurityUtils.getSubject();
        try {
            subject.login(usernamePasswordToken);
        } catch (UnknownAccountException e) {
            data.put("code", 0);
            data.put("message", userName + "账号不存在".concat("！正确账号/密码——user/123456"));
            log.error(userName + "账号不存在");
            return data;
        } catch (DisabledAccountException e) {
            data.put("code", 0);
            data.put("message", userName + "账号异常".concat("！正确账号/密码——user/123456"));
            log.error(userName + "账号异常");
            return data;
        } catch (AuthenticationException e) {
            data.put("code", 0);
            data.put("message", userName + "密码错误".concat("！正确账号/密码——user/123456"));
            log.error(userName + "密码错误");
            return data;
        }
        //登录成功
        LoginDTO user = (LoginDTO) subject.getPrincipal();

        //缓存用户信息到redis，有效期24小时
        long redisTimeout = 24 * 60 * 60L;
        RedisUtil.getInstance().set(user.getUsername(), user, redisTimeout);
        data.put("code", 1);
        data.put("message", user.toString().concat(" ").concat(new Date().toString()));
        return data;
    }
}
