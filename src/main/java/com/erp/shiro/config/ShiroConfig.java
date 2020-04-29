package com.erp.shiro.config;

import at.pollux.thymeleaf.shiro.dialect.ShiroDialect;
import com.erp.shiro.filter.KickoutSessionFilter;
import com.erp.shiro.realm.CustomRealm;
import lombok.extern.slf4j.Slf4j;
import net.sf.ehcache.CacheException;
import net.sf.ehcache.CacheManager;
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;
import org.apache.shiro.cache.ehcache.EhCacheManager;
import org.apache.shiro.session.mgt.eis.EnterpriseCacheSessionDAO;
import org.apache.shiro.spring.web.ShiroFilterFactoryBean;
import org.apache.shiro.web.mgt.CookieRememberMeManager;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.apache.shiro.web.servlet.SimpleCookie;
import org.apache.shiro.web.session.mgt.DefaultWebSessionManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.Resource;
import javax.servlet.Filter;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * @author 0.0.0
 * @ProjectName: [wln]
 * @Package: [cn.oz.fom.wln.config.ShiroConfig]
 * @Description shiro配置文件
 * @Date 2020/3/6 16:17
 */
@Slf4j
@Configuration
public class ShiroConfig {

    public static final String CACHE_NAME = "shiro-activeSessionCache";

    @Resource
    private ShiroPermissionProperties shiroPermissionProperties;

    /**
     * shiro安全管理器设置realm认证和ehcache缓存管理
     */
    @Bean
    public DefaultWebSecurityManager securityManager() {
        log.info("start shiro安全管理器设置");
        DefaultWebSecurityManager manager = new DefaultWebSecurityManager();
        //关联realm
        manager.setRealm(shiroRealm());
        //注入ehcache缓存管理器;
        manager.setCacheManager(ehCacheManager());
        //注入session管理器;
        manager.setSessionManager(sessionManager());
        //注入Cookie记住我管理器
        manager.setRememberMeManager(rememberMeManager());
        log.info("end shiro安全管理器设置");
        return manager;
    }

    /**
     * ShiroFilterFactoryBean 处理拦截资源文件过滤器
     * </br>1,配置shiro安全管理器接口securityManage;
     * </br>2,shiro 连接约束配置filterChainDefinitions;
     */
    @Bean
    public ShiroFilterFactoryBean shiroFilterFactoryBean(DefaultWebSecurityManager securityManager) {

        log.info("Shiro拦截器工厂类注入开始");
        ShiroFilterFactoryBean shiroFilterFactoryBean = new ShiroFilterFactoryBean();
        //设置securityManager
        shiroFilterFactoryBean.setSecurityManager(securityManager);

        //添加kichout认证
        HashMap<String, Filter> kichoutFilterMap = new HashMap<>();
        kichoutFilterMap.put("kickout", kickoutSessionFilter());
        shiroFilterFactoryBean.setFilters(kichoutFilterMap);

        //配置拦截链 使用LinkedHashMap,因为LinkedHashMap是有序的，shiro会根据添加的顺序进行拦截
        // Map<K,V> K指的是拦截的url V值的是该url是否拦截
        Map<String, String> filterMap = new LinkedHashMap<>(16);
        //配置退出过滤器logout，由shiro实现
        //authc:所有url都必须认证通过才可以访问; anon:所有url都都可以匿名访问,先配置anon再配置authc。
        this.shiroPermissionProperties.getPerms().forEach(p -> filterMap.put(p.get("url"), p.get("permission")));

        //设置默认登录的URL.
        shiroFilterFactoryBean.setLoginUrl("/login");
        // 登录成功后要跳转的链接
        shiroFilterFactoryBean.setSuccessUrl("/home");
        // 未授权时跳转的界面;
        shiroFilterFactoryBean.setUnauthorizedUrl("/error");

        shiroFilterFactoryBean.setFilterChainDefinitionMap(filterMap);
        log.info("Shiro拦截器工厂类注入成功");
        return shiroFilterFactoryBean;
    }

    /**
     * kichout认证session设置
     */
    private KickoutSessionFilter kickoutSessionFilter() {
        KickoutSessionFilter kickoutSessionFilter = new KickoutSessionFilter();
        //使用cacheManager获取相应的cache来缓存用户登录的会话；用于保存用户—会话之间的关系的；
        //这里我们还是用之前shiro使用的ehcache实现的cacheManager()缓存管理
        //也可以重新另写一个，重新配置缓存时间之类的自定义缓存属性
        kickoutSessionFilter.setCacheManager(ehCacheManager());
        //用于根据会话ID，获取会话进行踢出操作的；
        kickoutSessionFilter.setSessionManager(sessionManager());
        //是否踢出后来登录的，默认是false；即后者登录的用户踢出前者登录的用户；踢出顺序。
        kickoutSessionFilter.setKickoutAfter(false);
        //同一个用户最大的会话数，默认1；比如2的意思是同一个用户允许最多同时两个人登录；
        kickoutSessionFilter.setMaxSession(1);
        //被踢出后重定向到的地址；
        kickoutSessionFilter.setKickoutUrl("/login");
        return kickoutSessionFilter;
    }

    /**
     * 创建身份验证域
     *
     * @return 自定义的域
     */
    @Bean
    public CustomRealm shiroRealm() {
        log.debug("1、关联realm");
        //注入md5密码加密
        //realm.setCredentialsMatcher(hashedCredentialsMatcher());
        return new CustomRealm();
    }

    /**
     * 凭证匹配器 （由于我们的密码校验交给Shiro的SimpleAuthenticationInfo进行处理了
     * 所以我们需要修改下doGetAuthenticationInfo中的代码,更改密码生成规则和校验的逻辑一致即可; ）
     *
     * @return 凭证匹配器
     */
    @Bean
    public HashedCredentialsMatcher hashedCredentialsMatcher() {
        HashedCredentialsMatcher hashedCredentialsMatcher = new HashedCredentialsMatcher();
        hashedCredentialsMatcher.setHashAlgorithmName("MD5");// 散列算法:这里使用MD5算法;
        //hashedCredentialsMatcher.setHashIterations(2);// 散列的次数，比如散列两次，相当于 // md5(md5(""));
        hashedCredentialsMatcher.setStoredCredentialsHexEncoded(true);
        return hashedCredentialsMatcher;
    }

    /**
     * ehcache缓存管理器；shiro整合ehcache：
     * 通过安全管理器：securityManager
     * 单例的cache防止热部署重启失败
     *
     * @return EhCacheManager
     */
    @Bean
    public EhCacheManager ehCacheManager() {
        log.debug("2、注入ehcache缓存管理器");
        EhCacheManager ehcache = new EhCacheManager();
        CacheManager cacheManager = CacheManager.getCacheManager("shiro");
        if (cacheManager == null) {
            try {
                String filePath = "config/ehcache.xml";
                InputStream inputStream = new ClassPathResource(filePath).getInputStream();
                cacheManager = CacheManager.create(inputStream);
            } catch (CacheException | IOException e) {
                e.printStackTrace();
            }
        }
        ehcache.setCacheManager(cacheManager);
        return ehcache;
    }

    /**
     * 功能描述: sessionManager添加session缓存操作DAO
     */
    @Bean
    public DefaultWebSessionManager sessionManager() {
        log.debug("3、注入session管理器");
        DefaultWebSessionManager sessionManager = new DefaultWebSessionManager();
        sessionManager.setSessionDAO(enterCacheSessionDAO());
        sessionManager.setSessionIdCookie(sessionIdCookie());
        return sessionManager;
    }

    /**
     * EnterpriseCacheSessionDAO shiro sessionDao层的实现；
     * 提供了缓存功能的会话维护，默认情况下使用MapCache实现，内部使用ConcurrentHashMap保存缓存的会话。
     */
    @Bean
    public EnterpriseCacheSessionDAO enterCacheSessionDAO() {
        EnterpriseCacheSessionDAO enterCacheSessionDAO = new EnterpriseCacheSessionDAO();
        enterCacheSessionDAO.setActiveSessionsCacheName(ShiroConfig.CACHE_NAME);
        return enterCacheSessionDAO;
    }


    /**
     * 功能描述: 自定义cookie中session名称等配置
     */
    @Bean
    public SimpleCookie sessionIdCookie() {
        //DefaultSecurityManager
        SimpleCookie simpleCookie = new SimpleCookie();
        //sessionManager.setCacheManager(ehCacheManager());
        //如果在Cookie中设置了"HttpOnly"属性，那么通过程序(JS脚本、Applet等)将无法读取到Cookie信息，这样能有效的防止XSS攻击。
        simpleCookie.setHttpOnly(true);
        simpleCookie.setName("SHRIOSESSIONID");
        //单位秒
        simpleCookie.setMaxAge(86400);
        return simpleCookie;
    }

    /**
     * 配置cookie记住我管理器
     *
     * @return cookie管理器
     */
    @Bean
    public CookieRememberMeManager rememberMeManager() {
        log.debug("4、注入rememberMeManager");
        CookieRememberMeManager cookieRememberMeManager = new CookieRememberMeManager();
        cookieRememberMeManager.setCookie(remeberMeCookie());
        return cookieRememberMeManager;
    }

    /**
     * RememberMe 的功能
     */
    // 创建 Cookie
    @Bean
    public SimpleCookie remeberMeCookie() {
        //这个参数是cookie的名称，对应前端的checkbox的name = rememberMe
        SimpleCookie cookie = new SimpleCookie("rememberMe");
        // //记住我cookie生效时间30天 ,单位秒  [10天]
        cookie.setMaxAge(864000);
        // 设置只读模型
        //cookie.setHttpOnly(true);
        return cookie;
    }

    /**
     * 用于thymeleaf模板使用shiro标签
     *
     * @return shiro标签
     */
    @Bean
    public ShiroDialect shiroDialect() {
        return new ShiroDialect();
    }

}
