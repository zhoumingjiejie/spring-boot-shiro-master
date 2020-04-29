package com.erp.shiro.filter;

import com.erp.shiro.common.IStatusMessage;
import com.erp.shiro.config.ShiroConfig;
import com.erp.shiro.model.LoginDTO;
import com.erp.shiro.response.ResponseResult;
import com.erp.shiro.utils.ShiroFilterUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.cache.Cache;
import org.apache.shiro.cache.CacheManager;
import org.apache.shiro.session.Session;
import org.apache.shiro.session.SessionException;
import org.apache.shiro.session.mgt.DefaultSessionKey;
import org.apache.shiro.session.mgt.SessionManager;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.web.filter.AccessControlFilter;
import org.apache.shiro.web.util.WebUtils;

import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayDeque;
import java.util.Deque;

/**
 * @author 0.0.0
 * @ProjectName: [wln]
 * @Package: [cn.oz.fom.wln.filter.KickoutSessionFilter]
 * @Description 进行用户访问控制
 * @Date 2020/3/9 10:19
 */
@Slf4j
@SuppressWarnings("unused")
public class KickoutSessionFilter extends AccessControlFilter {

    private String kickoutUrl; // 踢出后到的地址
    private boolean kickoutAfter = false; // 踢出之前登录的/之后登录的用户 默认false踢出之前登录的用户
    private int maxSession = 1; // 同一个帐号最大会话数 默认1
    private SessionManager sessionManager;
    private Cache<String, Deque<Serializable>> cache;

    public void setKickoutUrl(String kickoutUrl) {
        this.kickoutUrl = kickoutUrl;
    }

    public void setKickoutAfter(boolean kickoutAfter) {
        this.kickoutAfter = kickoutAfter;
    }

    public void setMaxSession(int maxSession) {
        this.maxSession = maxSession;
    }

    public void setSessionManager(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    // 设置Cache的key的前缀
    public void setCacheManager(CacheManager cacheManager) {
        //必须和ehcache缓存配置中的缓存name一致
        this.cache = cacheManager.getCache(ShiroConfig.CACHE_NAME);
    }

    @Override
    protected boolean isAccessAllowed(ServletRequest servletRequest, ServletResponse servletResponse, Object o) {
        return false;
    }

    @Override
    protected boolean onAccessDenied(ServletRequest servletRequest, ServletResponse servletResponse) throws Exception {
        Subject subject = getSubject(servletRequest, servletResponse);

        // 没有登录授权 且没有记住我
        if (!subject.isAuthenticated() && !subject.isRemembered()) {
            // 如果没有登录，直接进行之后的流程
            return true;
        }

        // 获得用户请求的URI
        HttpServletRequest req = (HttpServletRequest) servletRequest;
        String path = req.getRequestURI();

        if (path.equals("/login") || path.equals("/view?name=login")) {
            return true;
        }
        //默认30分钟
        Session session = subject.getSession();

        //当前用户信息
        LoginDTO loginDTO = (LoginDTO) subject.getPrincipal();
        String userName = loginDTO.getUsername();
        Serializable sessionId = session.getId();
        // 读取缓存用户 没有就存入
        Deque<Serializable> deque = cache.get(userName);
        if (deque == null) {
            // 初始化队列
            deque = new ArrayDeque<>();
        }

        // 如果队列里没有此sessionId，且用户没有被踢出；放入队列
        if (!deque.contains(sessionId) && session.getAttribute("kickout") == null) {
            // 将sessionId存入队列
            deque.push(sessionId);
            // 将用户的sessionId队列缓存
            cache.put(userName, deque);
        }

        // 如果队列里的sessionId数超出最大会话数，开始踢人
        while (deque.size() > maxSession || path.equals("/logout")) {
            //log.debug("===deque队列长度:" + deque.size());
            Serializable kickoutSessionId;
            // 是否踢出后来登录的，默认是false；即后者登录的用户踢出前者登录的用户；
            if (kickoutAfter) { // 如果踢出后者
                kickoutSessionId = deque.removeFirst();
            } else { // 否则踢出前者
                kickoutSessionId = deque.removeLast();
            }
            // 踢出后再更新下缓存队列
            cache.put(userName, deque);
            try {
                // 获取被踢出的sessionId的session对象
                Session kickoutSession = this.sessionManager
                        .getSession(new DefaultSessionKey(kickoutSessionId));
                if (kickoutSession != null) {
                    // 设置会话的kickout属性表示踢出了
                    kickoutSession.setAttribute("kickout", true);
                }
            } catch (SessionException e) {
                e.printStackTrace();
            }
        }

        // 如果被踢出了，(前者或后者)直接退出，重定向到踢出后的地址
        if (session.getAttribute("kickout") != null && (Boolean) session.getAttribute("kickout")) {
            // 会话被踢出了
            try {
                // 退出登录
                subject.logout();
            } catch (Exception e) { // ignore
            }
            this.saveRequest(servletRequest);
            log.debug("===踢出后用户{}重定向的路径kickoutUrl:{}", userName, kickoutUrl);
            return isAjaxResponse(servletRequest, servletResponse);
        }
        return true;
    }

    /**
     * 判断是否已经踢出
     * 1.如果是Ajax 访问，那么给予json返回值提示。
     * 2.如果是普通请求，直接跳转到登录页
     */
    private boolean isAjaxResponse(ServletRequest request,
                                   ServletResponse response) throws IOException {
        // ajax请求
        //判断是不是Ajax请求
        ResponseResult responseResult = new ResponseResult();
        if (ShiroFilterUtils.isAjax(request)) {
            log.info(getClass().getName() + "当前用户已经在其他地方登录，并且是Ajax请求！");
            responseResult.setCode(IStatusMessage.MANY_LOGINS.getCode());
            responseResult.setMessage("您已在别处登录，请您修改密码或重新登录");
            ShiroFilterUtils.out(response, responseResult);
        } else {
            // 重定向
            WebUtils.issueRedirect(request, response, kickoutUrl);
        }
        return false;
    }
}
