package com.erp.shiro.controller;

import com.erp.shiro.config.ShiroConfig;
import com.erp.shiro.model.LoginDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.cache.Cache;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.annotation.Resource;
import java.io.Serializable;
import java.util.Deque;

/**
 * @author 0.0.0
 * @ProjectName: [wln]
 * @Package: [cn.oz.fom.wln.web.controller.IndexController]
 * @Description 首页controller
 * @Date 2020/3/6 17:35
 */
@Slf4j
@Controller
public class IndexController {

    @Resource
    DefaultWebSecurityManager defaultWebSecurityManager;

    @RequestMapping("login")
    public String login() {
        return "login";
    }

    @RequestMapping("home")
    public String home() {
        return "home";
    }

    @RequestMapping("logout")
    public String logout() {
        Subject subject = SecurityUtils.getSubject();

        //清空缓存用户
        Cache<String, Deque<Serializable>> cache = this.defaultWebSecurityManager.getCacheManager().getCache(ShiroConfig.CACHE_NAME);
        LoginDTO loginDTO = (LoginDTO) subject.getPrincipal();
        String userName = loginDTO.getUsername();
        cache.put(userName, null);

        subject.logout(); // shiro底层删除session的会话信息
        return "redirect:login";
    }
}
