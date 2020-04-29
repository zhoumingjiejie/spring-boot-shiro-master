package com.erp.shiro.config;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

/**
 * @author 0.0.0
 * @ProjectName: [sso-master]
 * @Package: [com.erp.holder]
 * @Description 获取spring 配置文件中 所有引用（注入）到的bean对象
 * @Date 2020/3/23 23:24
 */
@Component
@SuppressWarnings("all")
public class SpringContextHolder implements ApplicationContextAware {

    private static ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        SpringContextHolder.applicationContext = applicationContext;
    }

    public static ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    public static void clearHolder() {
        applicationContext = null;
    }

    public static <T> T getBean(String name) {
        if (applicationContext == null) {
            return null;
        }
        return (T) applicationContext.getBean(name);
    }

    /**
     * 根据类获取Service层对象
     *
     * @param clazz 类
     * @return 对象
     */
    public static <T> T getBean(Class<T> clazz) {
        return applicationContext.getBean(clazz);
    }

    /**
     * 根据name和class获取Service层对象
     *
     * @param beanName name
     * @param clazz    class
     * @return 对象
     */
    public static <T> T getBean(String beanName, Class<T> clazz) {
        return applicationContext.getBean(beanName, clazz);
    }
}
